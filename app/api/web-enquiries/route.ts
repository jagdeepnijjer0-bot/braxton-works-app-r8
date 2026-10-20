import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"

// Public endpoint used by the tradenestapp.co.uk enquiry form.
// Writes a row to the same `jobs` table the mobile app uses, with source "web",
// so it shows up in the admin dashboard and fires the same Telegram alert
// (the Telegram alert is a database webhook on jobs INSERT).
//
// The category lists below must match mobile/app/inquiry/category.tsx exactly.

const ISSUE_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Heating / Boiler",
  "Damp / Roofing",
  "Locks / Doors",
  "Appliances",
  "General Repairs",
  "Other",
] as const

const ENQUIRY_CATEGORIES = [
  "Extension",
  "Refurb",
  "Kitchen",
  "Bathroom",
  "Windows & Doors",
  "Flooring & Carpets",
  "Painting & Decorating",
  "Other",
] as const

// Origins allowed to call this endpoint from a browser.
const ALLOWED_ORIGINS = new Set([
  "https://tradenestapp.co.uk",
  "https://www.tradenestapp.co.uk",
  "https://buildme-waitlist.vercel.app",
])
// Vercel preview deployments of the website project (for testing before go-live).
const PREVIEW_ORIGIN = /^https:\/\/buildme-waitlist-[a-z0-9-]+\.vercel\.app$/

function allowedOrigin(origin: string | null): string | null {
  if (!origin) return null
  if (ALLOWED_ORIGINS.has(origin)) return origin
  if (PREVIEW_ORIGIN.test(origin)) return origin
  return null
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = allowedOrigin(origin)
  const headers: Record<string, string> = {
    Vary: "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  }
  if (allowed) headers["Access-Control-Allow-Origin"] = allowed
  return headers
}

const TRACKING_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
  "referrer",
  "landing_path",
  "device",
] as const

const bodySchema = z.object({
  type: z.enum(["issue", "enquiry"]),
  category: z.string().trim().min(1).max(60),
  description: z.string().trim().min(5).max(1000),
  timing: z.enum(["asap", "this-week", "choose-date"]),
  chosenDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(10).max(20),
  postcode: z.string().trim().min(5).max(10),
  email: z.string().trim().max(120).optional().nullable(),
  // Spam traps
  company: z.string().optional().nullable(), // honeypot, real people never fill it
  openedAt: z.number().optional().nullable(), // ms timestamp when the form was opened
  tracking: z.record(z.string(), z.string()).optional().nullable(),
})

// Simple per-instance rate limit. Serverless instances do not share memory, so the
// duplicate check against the database below is the second line of defence.
const hits = new Map<string, number[]>()
const WINDOW_MS = 15 * 60 * 1000
const MAX_PER_WINDOW = 5

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent)
    return true
  }
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear()
  return false
}

function normalisePhone(raw: string): string | null {
  let p = raw.replace(/[\s\-().]/g, "")
  if (p.startsWith("+44")) p = "0" + p.slice(3)
  else if (p.startsWith("0044")) p = "0" + p.slice(4)
  if (!/^0[1-9]\d{8,9}$/.test(p)) return null
  return p
}

function normalisePostcode(raw: string): string | null {
  const p = raw.toUpperCase().replace(/\s+/g, "")
  if (!/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(p)) return null
  return `${p.slice(0, -3)} ${p.slice(-3)}`
}

function json(body: unknown, status: number, origin: string | null) {
  return NextResponse.json(body, { status, headers: corsHeaders(origin) })
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  })
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin")

  if (!allowedOrigin(origin)) {
    return json({ error: "Not allowed" }, 403, origin)
  }

  try {
    const raw = await req.text()
    if (raw.length > 20_000) {
      return json({ error: "Request too large" }, 413, origin)
    }

    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(raw)
    } catch {
      return json({ error: "Invalid request" }, 400, origin)
    }

    const parsed = bodySchema.safeParse(parsedJson)
    if (!parsed.success) {
      return json({ error: "Please check your details and try again." }, 400, origin)
    }
    const body = parsed.data

    // Spam traps: pretend success so bots learn nothing.
    if (body.company && body.company.trim() !== "") {
      return json({ ok: true }, 201, origin)
    }
    if (typeof body.openedAt === "number" && Date.now() - body.openedAt < 4000) {
      return json({ ok: true }, 201, origin)
    }

    const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim()
    if (rateLimited(ip)) {
      return json({ error: "Too many enquiries from this connection. Please try again later." }, 429, origin)
    }

    // Category must belong to the chosen type (same lists as the app).
    const allowedCategories: readonly string[] =
      body.type === "issue" ? ISSUE_CATEGORIES : ENQUIRY_CATEGORIES
    if (!allowedCategories.includes(body.category)) {
      return json({ error: "Please choose a category." }, 400, origin)
    }

    const phone = normalisePhone(body.phone)
    if (!phone) {
      return json({ error: "Please enter a valid UK phone number." }, 400, origin)
    }

    const postcode = normalisePostcode(body.postcode)
    if (!postcode) {
      return json({ error: "Please enter a valid UK postcode." }, 400, origin)
    }

    let email: string | null = null
    if (body.email && body.email.trim() !== "") {
      const e = z.string().email().safeParse(body.email.trim())
      if (!e.success) {
        return json({ error: "Please enter a valid email address, or leave it blank." }, 400, origin)
      }
      email = e.data.toLowerCase()
    }

    let chosenDate: string | null = null
    if (body.timing === "choose-date") {
      if (!body.chosenDate) {
        return json({ error: "Please choose a date." }, 400, origin)
      }
      const d = new Date(`${body.chosenDate}T00:00:00Z`)
      const yesterday = Date.now() - 24 * 60 * 60 * 1000
      if (Number.isNaN(d.getTime()) || d.getTime() < yesterday) {
        return json({ error: "Please choose a date in the future." }, 400, origin)
      }
      chosenDate = body.chosenDate
    }

    // Keep only known tracking keys, trimmed.
    const tracking: Record<string, string | boolean> = {}
    for (const key of TRACKING_KEYS) {
      const v = body.tracking?.[key]
      if (typeof v === "string" && v.trim() !== "") tracking[key] = v.trim().slice(0, 200)
    }
    const area = postcode.split(" ")[0].replace(/\d.*$/, "")
    tracking.postcode_area = area
    tracking.outside_cv = area !== "CV"

    const supabase = createAdminClient()

    // Double tap / retry protection: same phone, same source, last 10 minutes.
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { data: existing } = await supabase
      .from("jobs")
      .select("id")
      .eq("source", "web")
      .eq("guest_phone", phone)
      .gte("created_at", since)
      .limit(1)
    if (existing && existing.length > 0) {
      return json({ ok: true }, 201, origin)
    }

    const { data: job, error: insertError } = await supabase
      .from("jobs")
      .insert({
        type: body.type,
        category: body.category,
        description: body.description,
        address: postcode,
        timing: body.timing,
        chosen_date: chosenDate,
        status: "Enquiry Received",
        source: "web",
        guest_name: body.name,
        guest_phone: phone,
        guest_contact_preference: "phone",
        guest_email: email,
        tracking,
      })
      .select("id")
      .single()

    if (insertError || !job) {
      console.error("[web-enquiries] insert error:", insertError)
      return json({ error: "Something went wrong on our side. Please try again in a moment." }, 500, origin)
    }

    // First entry on the job timeline, same as the app. Not critical.
    const { error: updateError } = await supabase.from("job_updates").insert({
      job_id: job.id,
      type: "status_change",
      message: "Enquiry received",
    })
    if (updateError) console.error("[web-enquiries] job_updates insert error:", updateError)

    return json({ ok: true }, 201, origin)
  } catch (err) {
    console.error("[web-enquiries] route error:", err)
    return json({ error: "Something went wrong on our side. Please try again in a moment." }, 500, origin)
  }
}

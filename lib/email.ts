import { Resend } from "resend"

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set")
  return new Resend(process.env.RESEND_API_KEY)
}

interface NewJobEmailParams {
  jobId: string
  name: string
  phone: string
  contactPreference: string
  address: string
  type: string
  category: string
  description: string
  timing: string
  chosenDate: string | null
  photoCount: number
}

export async function sendNewJobEmail(params: NewJobEmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const adminUrl = `${appUrl}/admin?job=${params.jobId}`

  const timingLabel: Record<string, string> = {
    asap: "As soon as possible",
    "this-week": "This week",
    "choose-date": params.chosenDate ?? "Date chosen",
  }

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="margin:0 0 4px">New ${params.type === "issue" ? "Issue" : "Enquiry"} — ${params.category}</h2>
      <p style="color:#64748b;margin:0 0 24px">Submitted via Braxton Works app</p>

      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#64748b;width:160px">Name</td><td style="padding:8px 0;font-weight:600">${params.name}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Phone</td><td style="padding:8px 0;font-weight:600">${params.phone}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Contact preference</td><td style="padding:8px 0">${params.contactPreference}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Address</td><td style="padding:8px 0">${params.address}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Type</td><td style="padding:8px 0">${params.type}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Category</td><td style="padding:8px 0">${params.category}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Timing</td><td style="padding:8px 0">${timingLabel[params.timing] ?? params.timing}</td></tr>
        ${params.photoCount > 0 ? `<tr><td style="padding:8px 0;color:#64748b">Photos</td><td style="padding:8px 0">${params.photoCount} photo${params.photoCount > 1 ? "s" : ""} attached</td></tr>` : ""}
      </table>

      <div style="margin:24px 0;padding:16px;background:#f8fafc;border-radius:8px">
        <p style="margin:0;color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Description</p>
        <p style="margin:8px 0 0;color:#1e1e1e">${params.description}</p>
      </div>

      <a href="${adminUrl}" style="display:inline-block;padding:12px 24px;background:#6EC6FF;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
        View in Admin Dashboard →
      </a>

      <p style="margin:24px 0 0;color:#94a3b8;font-size:12px">Job ID: ${params.jobId}</p>
    </div>
  `

  const resend = getResend()
  await resend.emails.send({
    from: "Braxton Works <noreply@braxtonworks.co.uk>",
    to: process.env.ADMIN_EMAIL!,
    subject: `New ${params.type === "issue" ? "Issue" : "Enquiry"} — ${params.category} — ${params.name}`,
    html,
  })
}

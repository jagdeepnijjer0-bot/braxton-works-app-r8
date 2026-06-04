import { google } from "googleapis"

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })
}

export interface SheetJobRow {
  jobId: string
  name: string
  phone: string
  contactPreference: string
  address: string
  type: string
  category: string
  description: string
  timing: string
  chosenDate: string
  status: string
  source: string
  assignedTo: string
  estimatedValue: string
  actualValue: string
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!
const SHEET_NAME = "Jobs"

// Ensure the header row exists (idempotent — only writes if A1 is empty)
async function ensureHeader(sheets: ReturnType<typeof google.sheets>) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1`,
  })
  if (res.data.values && res.data.values.length > 0) return

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        "Submission Date", "Job ID", "Name", "Phone", "Contact Preference",
        "Address", "Type", "Category", "Description", "Timing",
        "Scheduled Date", "Status", "Source", "Assigned To",
        "Estimated Value", "Actual Value",
      ]],
    },
  })
}

// Append a new job row; returns the 1-based row index written
export async function appendJobRow(job: SheetJobRow): Promise<number> {
  const auth = getAuth()
  const sheets = google.sheets({ version: "v4", auth })

  await ensureHeader(sheets)

  const now = new Date().toLocaleString("en-GB", { timeZone: "Europe/London" })

  const values = [[
    now,
    job.jobId,
    job.name,
    job.phone,
    job.contactPreference,
    job.address,
    job.type,
    job.category,
    job.description,
    job.timing,
    job.chosenDate,
    job.status,
    job.source,
    job.assignedTo,
    job.estimatedValue,
    job.actualValue,
  ]]

  const appendRes = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:P`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  })

  // Parse the updated range to get the row number (e.g. "Jobs!A5:P5" → 5)
  const updatedRange = appendRes.data.updates?.updatedRange ?? ""
  const match = updatedRange.match(/:.*?(\d+)$/)
  return match ? parseInt(match[1], 10) : 0
}

// Update specific columns in an existing row (status, assigned_to, values)
export async function updateJobRow(
  rowIndex: number,
  updates: Partial<Pick<SheetJobRow, "status" | "assignedTo" | "estimatedValue" | "actualValue">>
) {
  const auth = getAuth()
  const sheets = google.sheets({ version: "v4", auth })

  const data: { range: string; values: string[][] }[] = []

  if (updates.status !== undefined) {
    data.push({ range: `${SHEET_NAME}!L${rowIndex}`, values: [[updates.status]] })
  }
  if (updates.assignedTo !== undefined) {
    data.push({ range: `${SHEET_NAME}!N${rowIndex}`, values: [[updates.assignedTo]] })
  }
  if (updates.estimatedValue !== undefined) {
    data.push({ range: `${SHEET_NAME}!O${rowIndex}`, values: [[updates.estimatedValue]] })
  }
  if (updates.actualValue !== undefined) {
    data.push({ range: `${SHEET_NAME}!P${rowIndex}`, values: [[updates.actualValue]] })
  }

  if (data.length === 0) return

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: "RAW",
      data,
    },
  })
}

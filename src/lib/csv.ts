import type { ExpenseRecord, NecessaryType } from '../types'

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

export function parseCsvToRecords(csvText: string): ExpenseRecord[] {
  const lines = csvText
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length <= 1) {
    return []
  }

  const records: ExpenseRecord[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i])
    if (cols.length < 7) {
      continue
    }
    const [date, category, amountRaw, merchant, paymentMethod, necessaryRaw, note] = cols
    const amount = Number.parseFloat(amountRaw)
    if (!Number.isFinite(amount) || amount <= 0) {
      continue
    }
    const necessary: NecessaryType = necessaryRaw === '非必要' ? '非必要' : '必要'
    records.push({
      id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      date,
      category,
      amount,
      merchant,
      paymentMethod,
      necessary,
      note,
    })
  }

  return records
}

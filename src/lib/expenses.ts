export interface ExpenseRecord {
  id: string
  date: string
  category: string
  amount: number
  note: string
}

export interface CategorySummary {
  category: string
  total: number
}

export interface MonthSummary {
  month: string
  total: number
}

export function normalizeAmount(input: string): number {
  const amount = Number.parseFloat(input)
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0
  }
  return Math.round(amount * 100) / 100
}

export function summarizeByCategory(items: ExpenseRecord[]): CategorySummary[] {
  const bucket = new Map<string, number>()
  for (const item of items) {
    bucket.set(item.category, (bucket.get(item.category) ?? 0) + item.amount)
  }

  return [...bucket.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
}

export function summarizeByMonth(items: ExpenseRecord[]): MonthSummary[] {
  const bucket = new Map<string, number>()
  for (const item of items) {
    const month = item.date.slice(0, 7)
    bucket.set(month, (bucket.get(month) ?? 0) + item.amount)
  }

  return [...bucket.entries()]
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

export function toCsv(items: ExpenseRecord[]): string {
  const header = ['Date', 'Category', 'Amount', 'Note']
  const rows = items.map((item) => {
    const escapedNote = item.note.replaceAll('"', '""')
    return [item.date, item.category, item.amount.toFixed(2), `"${escapedNote}"`].join(',')
  })
  return [header.join(','), ...rows].join('\n')
}

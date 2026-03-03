import { describe, expect, it } from 'vitest'
import { summarizeByCategory, summarizeByMonth, toCsv, type ExpenseRecord } from './expenses'

const sample: ExpenseRecord[] = [
  { id: '1', date: '2026-03-01', category: 'Food', amount: 12.5, note: 'Lunch' },
  { id: '2', date: '2026-03-02', category: 'Food', amount: 7.5, note: 'Breakfast' },
  { id: '3', date: '2026-02-15', category: 'Transport', amount: 20, note: 'Taxi' },
]

describe('expense helpers', () => {
  it('summarizes by category', () => {
    const result = summarizeByCategory(sample)
    expect(result[0]).toEqual({ category: 'Food', total: 20 })
    expect(result[1]).toEqual({ category: 'Transport', total: 20 })
  })

  it('summarizes by month', () => {
    const result = summarizeByMonth(sample)
    expect(result).toEqual([
      { month: '2026-02', total: 20 },
      { month: '2026-03', total: 20 },
    ])
  })

  it('exports csv', () => {
    const csv = toCsv(sample)
    expect(csv.split('\n')[0]).toBe('Date,Category,Amount,Note')
    expect(csv).toContain('2026-03-01,Food,12.50,"Lunch"')
  })
})

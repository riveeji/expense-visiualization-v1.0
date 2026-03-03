import { describe, expect, it } from 'vitest'
import type { ExpenseRecord } from '../types'
import { summarizeByCategory, summarizeByMonth, toCsv } from './expenses'

const sample: ExpenseRecord[] = [
  {
    id: '1',
    date: '2026-03-01',
    category: '餐饮',
    amount: 12.5,
    note: '午餐',
    merchant: '面馆',
    paymentMethod: '微信',
    necessary: '必要',
  },
  {
    id: '2',
    date: '2026-03-02',
    category: '餐饮',
    amount: 7.5,
    note: '早餐',
    merchant: '便利店',
    paymentMethod: '支付宝',
    necessary: '必要',
  },
  {
    id: '3',
    date: '2026-02-15',
    category: '交通',
    amount: 20,
    note: '打车',
    merchant: '滴滴',
    paymentMethod: '微信',
    necessary: '非必要',
  },
]

describe('expense helpers', () => {
  it('summarizes by category', () => {
    const result = summarizeByCategory(sample)
    expect(result[0]).toEqual({ category: '餐饮', total: 20 })
    expect(result[1]).toEqual({ category: '交通', total: 20 })
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
    expect(csv.split('\n')[0]).toBe('日期,分类,金额,商家,支付方式,必要性,备注')
    expect(csv).toContain('2026-03-01,餐饮,12.50,"面馆",微信,必要,"午餐"')
  })
})

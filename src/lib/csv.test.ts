import { describe, expect, it } from 'vitest'
import { parseCsvToRecords } from './csv'

describe('parseCsvToRecords', () => {
  it('parses valid csv rows', () => {
    const csv = [
      '日期,分类,金额,商家,支付方式,必要性,备注',
      '2026-03-01,餐饮,12.50,"面馆",微信,必要,"午餐"',
      '2026-03-02,交通,20.00,"地铁",支付宝,非必要,"打车"',
    ].join('\n')

    const records = parseCsvToRecords(csv)
    expect(records).toHaveLength(2)
    expect(records[0].category).toBe('餐饮')
    expect(records[1].necessary).toBe('非必要')
  })

  it('ignores invalid rows', () => {
    const csv = [
      '日期,分类,金额,商家,支付方式,必要性,备注',
      '2026-03-01,餐饮,invalid,"面馆",微信,必要,"午餐"',
    ].join('\n')
    const records = parseCsvToRecords(csv)
    expect(records).toHaveLength(0)
  })
})

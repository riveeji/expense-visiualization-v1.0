import { describe, expect, it } from 'vitest'
import { adviceByBudgetMode, estimateMonthEnd, getProgressState } from './budget'

describe('budget utils', () => {
  it('estimates month end by average daily spend', () => {
    expect(estimateMonthEnd(300, 10, 30)).toBe(900)
  })

  it('returns progress states', () => {
    expect(getProgressState(1.01)).toBe('danger')
    expect(getProgressState(0.92)).toBe('warning')
    expect(getProgressState(0.75)).toBe('notice')
    expect(getProgressState(0.5)).toBe('healthy')
  })

  it('produces budget advice by mode', () => {
    expect(adviceByBudgetMode('conservative', 0.85)).toContain('保守')
    expect(adviceByBudgetMode('balanced', 1.1)).toContain('超预算')
    expect(adviceByBudgetMode('flexible', 0.6)).toContain('灵活')
  })
})

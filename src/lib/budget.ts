import type { BudgetMode } from '../types'

export function getProgressState(value: number) {
  if (value >= 1) return 'danger'
  if (value >= 0.9) return 'warning'
  if (value >= 0.7) return 'notice'
  return 'healthy'
}

export function estimateMonthEnd(
  currentSpent: number,
  currentDay: number,
  daysInMonth: number,
): number {
  if (currentDay <= 0 || daysInMonth <= 0) {
    return currentSpent
  }
  const avgPerDay = currentSpent / currentDay
  return Math.round(avgPerDay * daysInMonth * 100) / 100
}

export function adviceByBudgetMode(mode: BudgetMode, usageRatio: number): string {
  if (mode === 'conservative') {
    if (usageRatio >= 0.8) return '保守模式：建议立即压缩非必要消费。'
    return '保守模式：保持当前节奏，优先必要支出。'
  }
  if (mode === 'flexible') {
    if (usageRatio >= 1) return '灵活模式：已超预算，建议暂停可选消费。'
    return '灵活模式：预算空间尚可，注意不要持续冲动消费。'
  }

  if (usageRatio >= 1) {
    return '平衡模式：已超预算，优先减少高频非必要支出。'
  }
  if (usageRatio >= 0.9) {
    return '平衡模式：预算接近上限，建议控制购物和娱乐。'
  }
  return '平衡模式：预算状态良好，保持当前消费结构。'
}

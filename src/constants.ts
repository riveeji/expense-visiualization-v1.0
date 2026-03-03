import type { ExpenseTemplate, ViewKey } from './types'

export const STORAGE_KEY = 'expense-visualizer/store'

export const CATEGORY_OPTIONS = [
  { name: '餐饮', icon: '🍜' },
  { name: '交通', icon: '🚇' },
  { name: '购物', icon: '🛍️' },
  { name: '住房', icon: '🏠' },
  { name: '娱乐', icon: '🎬' },
  { name: '医疗', icon: '💊' },
  { name: '学习', icon: '📚' },
  { name: '其他', icon: '✨' },
] as const

export const PAYMENT_METHODS = ['微信', '支付宝', '银行卡', '现金', '其他'] as const

export const VIEW_TABS: Array<{ key: ViewKey; labelZh: string; labelEn: string }> = [
  { key: 'dashboard', labelZh: '总览', labelEn: 'Dashboard' },
  { key: 'transactions', labelZh: '记账', labelEn: 'Transactions' },
  { key: 'budgets', labelZh: '预算', labelEn: 'Budgets' },
  { key: 'insights', labelZh: '分析', labelEn: 'Insights' },
]

export const DEFAULT_TEMPLATES: ExpenseTemplate[] = [
  {
    id: 'tpl-rent',
    name: '房租',
    category: '住房',
    amount: 3000,
    merchant: '房东',
    paymentMethod: '银行卡',
    necessary: '必要',
    note: '每月固定支出',
  },
  {
    id: 'tpl-subscription',
    name: '订阅',
    category: '娱乐',
    amount: 68,
    merchant: '流媒体',
    paymentMethod: '支付宝',
    necessary: '非必要',
    note: '会员订阅',
  },
  {
    id: 'tpl-transport',
    name: '通勤',
    category: '交通',
    amount: 15,
    merchant: '地铁',
    paymentMethod: '微信',
    necessary: '必要',
    note: '上下班交通',
  },
]

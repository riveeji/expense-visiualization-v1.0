export type NecessaryType = '必要' | '非必要'
export type SortBy = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'
export type ViewKey = 'dashboard' | 'transactions' | 'budgets' | 'insights'
export type Language = 'zh' | 'en'
export type BudgetMode = 'conservative' | 'balanced' | 'flexible'

export interface ExpenseRecord {
  id: string
  date: string
  category: string
  amount: number
  note: string
  merchant: string
  paymentMethod: string
  necessary: NecessaryType
}

export interface CategorySummary {
  category: string
  total: number
}

export interface MonthSummary {
  month: string
  total: number
}

export interface ExpenseTemplate {
  id: string
  name: string
  category: string
  amount: number
  merchant: string
  paymentMethod: string
  necessary: NecessaryType
  note: string
}

export type BudgetsByMonth = Record<string, number>
export type CategoryBudgetsByMonth = Record<string, Record<string, number>>

export interface StoredDataV2 {
  version: 2
  records: ExpenseRecord[]
  budgetsByMonth: BudgetsByMonth
  categoryBudgetsByMonth: CategoryBudgetsByMonth
  budgetMode: BudgetMode
  language: Language
}

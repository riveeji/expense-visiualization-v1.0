import { z } from 'zod'
import { format } from 'date-fns'
import { STORAGE_KEY } from '../constants'
import type {
  BudgetMode,
  CategoryBudgetsByMonth,
  ExpenseRecord,
  Language,
  StoredDataV2,
} from '../types'

const expenseRecordSchema = z.object({
  id: z.string(),
  date: z.string(),
  category: z.string(),
  amount: z.number().positive(),
  note: z.string(),
  merchant: z.string(),
  paymentMethod: z.string(),
  necessary: z.enum(['必要', '非必要']),
})

const storedDataSchema = z.object({
  version: z.literal(2),
  records: z.array(expenseRecordSchema),
  budgetsByMonth: z.record(z.string(), z.number().nonnegative()),
  categoryBudgetsByMonth: z.record(z.string(), z.record(z.string(), z.number().nonnegative())),
  budgetMode: z.enum(['conservative', 'balanced', 'flexible']),
  language: z.enum(['zh', 'en']),
})

function createDefaultStore(): StoredDataV2 {
  return {
    version: 2,
    records: [],
    budgetsByMonth: {},
    categoryBudgetsByMonth: {},
    budgetMode: 'balanced',
    language: 'zh',
  }
}

function migrateLegacyRecord(input: Partial<ExpenseRecord>): ExpenseRecord {
  return {
    id: input.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: input.date ?? format(new Date(), 'yyyy-MM-dd'),
    category: input.category ?? '其他',
    amount: Number.isFinite(input.amount) ? Number(input.amount) : 0,
    note: input.note ?? '',
    merchant: input.merchant ?? '',
    paymentMethod: input.paymentMethod ?? '其他',
    necessary: input.necessary === '非必要' ? '非必要' : '必要',
  }
}

function migrateUnknownStore(raw: unknown): StoredDataV2 {
  if (Array.isArray(raw)) {
    return {
      ...createDefaultStore(),
      records: raw
        .map((item) => migrateLegacyRecord(item as Partial<ExpenseRecord>))
        .filter((item) => item.amount > 0),
    }
  }

  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    const records = Array.isArray(obj.records)
      ? obj.records
          .map((item) => migrateLegacyRecord(item as Partial<ExpenseRecord>))
          .filter((item) => item.amount > 0)
      : []

    const budgetsByMonth = (
      obj.budgetsByMonth && typeof obj.budgetsByMonth === 'object' ? obj.budgetsByMonth : {}
    ) as Record<string, number>

    const categoryBudgetsByMonth = (
      obj.categoryBudgetsByMonth && typeof obj.categoryBudgetsByMonth === 'object'
        ? obj.categoryBudgetsByMonth
        : {}
    ) as CategoryBudgetsByMonth

    const budgetMode = (
      obj.budgetMode === 'conservative' ||
      obj.budgetMode === 'balanced' ||
      obj.budgetMode === 'flexible'
        ? obj.budgetMode
        : 'balanced'
    ) as BudgetMode
    const language = (
      obj.language === 'en' || obj.language === 'zh' ? obj.language : 'zh'
    ) as Language

    return {
      version: 2,
      records,
      budgetsByMonth,
      categoryBudgetsByMonth,
      budgetMode,
      language,
    }
  }

  return createDefaultStore()
}

export function loadStore(): StoredDataV2 {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return createDefaultStore()
    }
    const parsed = JSON.parse(raw) as unknown
    const migrated = migrateUnknownStore(parsed)
    return storedDataSchema.parse(migrated)
  } catch {
    return createDefaultStore()
  }
}

export function saveStore(store: StoredDataV2) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

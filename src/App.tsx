import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { format } from 'date-fns'
import { Bar, Pie } from 'react-chartjs-2'
import {
  normalizeAmount,
  summarizeByCategory,
  summarizeByMonth,
  toCsv,
  type ExpenseRecord,
} from './lib/expenses'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const STORAGE_KEY = 'expense-visualizer/records'
const BUDGET_STORAGE_KEY = 'expense-visualizer/budgets'

const CATEGORY_OPTIONS = [
  { name: '餐饮', icon: '🍜' },
  { name: '交通', icon: '🚇' },
  { name: '购物', icon: '🛍️' },
  { name: '住房', icon: '🏠' },
  { name: '娱乐', icon: '🎬' },
  { name: '医疗', icon: '💊' },
  { name: '学习', icon: '📚' },
  { name: '其他', icon: '✨' },
]

const PAYMENT_METHODS = ['微信', '支付宝', '银行卡', '现金', '其他']

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeRecord(input: Partial<ExpenseRecord>): ExpenseRecord {
  return {
    id: input.id ?? createId(),
    date: input.date ?? format(new Date(), 'yyyy-MM-dd'),
    category: input.category ?? '其他',
    amount: Number.isFinite(input.amount) ? Number(input.amount) : 0,
    note: input.note ?? '',
    merchant: input.merchant ?? '',
    paymentMethod: input.paymentMethod ?? '其他',
    necessary: input.necessary === '非必要' ? '非必要' : '必要',
  }
}

function readRecordsFromStorage(): ExpenseRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as Partial<ExpenseRecord>[]
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.map(item => normalizeRecord(item)).filter(item => item.amount > 0)
  }
  catch {
    return []
  }
}

function readBudgetsFromStorage(): Record<string, number> {
  try {
    const raw = localStorage.getItem(BUDGET_STORAGE_KEY)
    if (!raw) {
      return {}
    }
    const parsed = JSON.parse(raw) as Record<string, number>
    return parsed && typeof parsed === 'object' ? parsed : {}
  }
  catch {
    return {}
  }
}

function getCategoryIcon(category: string) {
  return CATEGORY_OPTIONS.find(item => item.name === category)?.icon ?? '🧾'
}

function getBudgetAdvice(usageRatio: number, necessaryRatio: number) {
  if (usageRatio >= 1) {
    return '本月已超预算，建议优先减少非必要消费并暂停冲动购物。'
  }
  if (usageRatio >= 0.9) {
    return '预算接近上限，建议本月剩余时间以必要支出为主。'
  }
  if (usageRatio >= 0.7) {
    return '预算使用较快，建议适当控制娱乐和购物支出。'
  }
  if (necessaryRatio >= 0.8) {
    return '本月支出结构较健康，可以在预算内适度消费。'
  }
  return '当前预算空间充足，但建议继续关注非必要支出占比。'
}

export default function App() {
  const [records, setRecords] = useState<ExpenseRecord[]>(() => readRecordsFromStorage())
  const [budgetsByMonth, setBudgetsByMonth] = useState<Record<string, number>>(() => readBudgetsFromStorage())
  const [editingId, setEditingId] = useState<string | null>(null)

  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [category, setCategory] = useState<string>(CATEGORY_OPTIONS[0].name)
  const [customCategory, setCustomCategory] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [merchant, setMerchant] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0])
  const [necessary, setNecessary] = useState<'必要' | '非必要'>('必要')

  const [search, setSearch] = useState<string>('')
  const [monthFilter, setMonthFilter] = useState<string>(format(new Date(), 'yyyy-MM'))
  const [categoryFilter, setCategoryFilter] = useState<string>('全部')
  const [budgetInput, setBudgetInput] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  }, [records])

  useEffect(() => {
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budgetsByMonth))
  }, [budgetsByMonth])

  useEffect(() => {
    const monthBudget = budgetsByMonth[monthFilter]
    setBudgetInput(monthBudget ? String(monthBudget) : '')
  }, [monthFilter, budgetsByMonth])

  function resetForm() {
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setCategory(CATEGORY_OPTIONS[0].name)
    setCustomCategory('')
    setAmount('')
    setNote('')
    setMerchant('')
    setPaymentMethod(PAYMENT_METHODS[0])
    setNecessary('必要')
    setEditingId(null)
  }

  function startEdit(record: ExpenseRecord) {
    setEditingId(record.id)
    setDate(record.date)
    setAmount(String(record.amount))
    setNote(record.note)
    setMerchant(record.merchant)
    setPaymentMethod(record.paymentMethod)
    setNecessary(record.necessary)

    const isPresetCategory = CATEGORY_OPTIONS.some(item => item.name === record.category)
    if (isPresetCategory) {
      setCategory(record.category)
      setCustomCategory('')
    }
    else {
      setCategory('其他')
      setCustomCategory(record.category)
    }
  }

  function cancelEdit() {
    resetForm()
    setErrorMessage('')
  }

  const allCategories = useMemo(() => {
    const categories = new Set([
      ...CATEGORY_OPTIONS.map(item => item.name),
      ...records.map(item => item.category),
    ])
    return ['全部', ...[...categories].sort((a, b) => a.localeCompare(b, 'zh-CN'))]
  }, [records])

  const filteredRecords = useMemo(() => {
    return records
      .filter((record) => {
        if (monthFilter && !record.date.startsWith(monthFilter)) {
          return false
        }
        if (categoryFilter !== '全部' && record.category !== categoryFilter) {
          return false
        }
        if (!search.trim()) {
          return true
        }
        const query = search.toLowerCase()
        return (
          record.note.toLowerCase().includes(query)
          || record.category.toLowerCase().includes(query)
          || record.merchant.toLowerCase().includes(query)
          || record.paymentMethod.toLowerCase().includes(query)
        )
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [records, monthFilter, categoryFilter, search])

  const monthRecords = useMemo(
    () => records.filter(item => item.date.startsWith(monthFilter)),
    [records, monthFilter],
  )

  const totalAmount = useMemo(
    () => filteredRecords.reduce((sum, item) => sum + item.amount, 0),
    [filteredRecords],
  )

  const currentMonthTotal = useMemo(
    () => monthRecords.reduce((sum, item) => sum + item.amount, 0),
    [monthRecords],
  )

  const necessaryTotal = useMemo(
    () => monthRecords.filter(item => item.necessary === '必要').reduce((sum, item) => sum + item.amount, 0),
    [monthRecords],
  )

  const monthlyBudget = budgetsByMonth[monthFilter] ?? 0
  const usageRatio = monthlyBudget > 0 ? currentMonthTotal / monthlyBudget : 0
  const necessaryRatio = currentMonthTotal > 0 ? necessaryTotal / currentMonthTotal : 0
  const adviceText = monthlyBudget > 0
    ? getBudgetAdvice(usageRatio, necessaryRatio)
    : '先设置月预算后可获得更精确的消费建议。'

  const categorySummary = useMemo(() => summarizeByCategory(filteredRecords), [filteredRecords])
  const monthlySummary = useMemo(() => summarizeByMonth(records).slice(-6), [records])

  const pieData = {
    labels: categorySummary.map(item => `${getCategoryIcon(item.category)} ${item.category}`),
    datasets: [
      {
        label: '分类占比',
        data: categorySummary.map(item => item.total),
        backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6', '#84cc16', '#f97316'],
      },
    ],
  }

  const barData = {
    labels: monthlySummary.map(item => item.month),
    datasets: [
      {
        label: '月总支出',
        data: monthlySummary.map(item => item.total),
        backgroundColor: '#2563eb',
      },
    ],
  }

  function handleSubmitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = normalizeAmount(amount)
    const finalCategory = category === '其他'
      ? customCategory.trim() || '其他'
      : category

    if (!date || !finalCategory || normalized <= 0) {
      setErrorMessage('请填写完整的日期、分类和有效金额。')
      return
    }

    const payload = {
      date,
      category: finalCategory,
      amount: normalized,
      note: note.trim(),
      merchant: merchant.trim(),
      paymentMethod,
      necessary,
    }

    if (editingId) {
      setRecords(previous =>
        previous.map(item => (item.id === editingId ? { ...item, ...payload } : item)),
      )
    }
    else {
      setRecords(previous => [{ id: createId(), ...payload }, ...previous])
    }

    setErrorMessage('')
    resetForm()
  }

  function handleDelete(id: string) {
    setRecords(previous => previous.filter(item => item.id !== id))
    if (editingId === id) {
      cancelEdit()
    }
  }

  function handleExportCsv() {
    if (filteredRecords.length === 0) {
      setErrorMessage('当前筛选条件下没有可导出的记录。')
      return
    }

    const blob = new Blob([toCsv(filteredRecords)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `记账数据-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function handleSaveBudget() {
    const value = normalizeAmount(budgetInput)
    if (value <= 0) {
      setErrorMessage('预算金额需大于 0。')
      return
    }
    setBudgetsByMonth(previous => ({ ...previous, [monthFilter]: value }))
    setErrorMessage('')
  }

  return (
    <main className="page">
      <header className="header panel">
        <h1>账单可视化助手</h1>
        <p>支持分类图表、预算阈值预警、消费建议与 CSV 导出。</p>
      </header>

      <section className="panel budget-panel">
        <div className="budget-top">
          <h2>月预算与建议</h2>
          <div className="budget-controls">
            <input
              type="number"
              min="0"
              step="0.01"
              value={budgetInput}
              placeholder="设置本月预算"
              onChange={e => setBudgetInput(e.target.value)}
            />
            <button type="button" onClick={handleSaveBudget}>保存预算</button>
          </div>
        </div>
        <div className="budget-metrics">
          <p>
            当前月份：
            <strong>{monthFilter}</strong>
          </p>
          <p>
            本月支出：
            <strong>¥{currentMonthTotal.toFixed(2)}</strong>
          </p>
          <p>
            本月预算：
            <strong>{monthlyBudget > 0 ? `¥${monthlyBudget.toFixed(2)}` : '未设置'}</strong>
          </p>
        </div>
        {monthlyBudget > 0 && (
          <div className="budget-progress-wrap">
            <div className="budget-progress">
              <span style={{ width: `${Math.min(usageRatio * 100, 100)}%` }} />
            </div>
            <p className="budget-status">
              预算使用率：
              {(usageRatio * 100).toFixed(1)}
              %
              {usageRatio >= 1 ? '（已超支）' : usageRatio >= 0.9 ? '（接近上限）' : usageRatio >= 0.7 ? '（注意控制）' : '（健康）'}
            </p>
          </div>
        )}
        <p className="advice">{adviceText}</p>
      </section>

      <section className="panel">
        <h2>{editingId ? '编辑记录' : '新增记账'}</h2>
        <form className="expense-form" onSubmit={handleSubmitExpense}>
          <label>
            日期
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </label>
          <label>
            分类
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORY_OPTIONS.map(item => (
                <option key={item.name} value={item.name}>
                  {item.icon}
                  {' '}
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          {category === '其他' && (
            <label>
              自定义分类
              <input
                type="text"
                value={customCategory}
                placeholder="例如：宠物"
                onChange={e => setCustomCategory(e.target.value)}
              />
            </label>
          )}
          <label>
            金额
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              placeholder="0.00"
              onChange={e => setAmount(e.target.value)}
            />
          </label>
          <label>
            商家
            <input
              type="text"
              value={merchant}
              placeholder="例如：盒马 / 地铁"
              onChange={e => setMerchant(e.target.value)}
            />
          </label>
          <label>
            支付方式
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
              {PAYMENT_METHODS.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            消费属性
            <select value={necessary} onChange={e => setNecessary(e.target.value as '必要' | '非必要')}>
              <option value="必要">必要</option>
              <option value="非必要">非必要</option>
            </select>
          </label>
          <label className="full-row">
            备注
            <input
              type="text"
              value={note}
              placeholder="可填写用途说明"
              onChange={e => setNote(e.target.value)}
            />
          </label>
          <div className="action-row full-row">
            <button type="submit">{editingId ? '保存修改' : '添加记录'}</button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={cancelEdit}>取消编辑</button>
            )}
          </div>
        </form>
        {errorMessage && <p className="error">{errorMessage}</p>}
      </section>

      <section className="panel">
        <div className="toolbar">
          <h2>账单记录</h2>
          <button type="button" onClick={handleExportCsv}>导出 CSV</button>
        </div>
        <div className="filters">
          <label>
            月份
            <input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} />
          </label>
          <label>
            分类
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              {allCategories.map(item => (
                <option key={item} value={item}>
                  {item === '全部' ? '全部' : `${getCategoryIcon(item)} ${item}`}
                </option>
              ))}
            </select>
          </label>
          <label>
            搜索
            <input
              type="text"
              value={search}
              placeholder="备注/商家/分类/支付方式"
              onChange={e => setSearch(e.target.value)}
            />
          </label>
          <p className="total">
            筛选总额：
            <strong>¥{totalAmount.toFixed(2)}</strong>
          </p>
        </div>

        <ul className="record-list">
          {filteredRecords.length === 0 && <li className="empty">暂无符合条件的记录。</li>}
          {filteredRecords.map(record => (
            <li key={record.id}>
              <div>
                <strong>
                  {getCategoryIcon(record.category)}
                  {' '}
                  {record.category}
                  {' '}
                  <span className="badge">{record.necessary}</span>
                </strong>
                <p>
                  商家：
                  {record.merchant || '未填写'}
                  {' | '}
                  支付：
                  {record.paymentMethod}
                </p>
                <p>{record.note || '无备注'}</p>
              </div>
              <div className="record-meta">
                <span>{record.date}</span>
                <span>¥{record.amount.toFixed(2)}</span>
                <button type="button" onClick={() => startEdit(record)}>编辑</button>
                <button type="button" onClick={() => handleDelete(record.id)}>删除</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="charts">
        <article className="panel">
          <h2>分类占比图</h2>
          {categorySummary.length === 0
            ? <p className="empty">暂无数据可视化。</p>
            : <Pie data={pieData} />}
        </article>
        <article className="panel">
          <h2>近 6 个月支出趋势</h2>
          {monthlySummary.length === 0
            ? <p className="empty">暂无数据可视化。</p>
            : <Bar data={barData} />}
        </article>
      </section>
    </main>
  )
}

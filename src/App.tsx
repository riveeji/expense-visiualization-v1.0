import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { endOfMonth, format, getDate, getDaysInMonth, isSameMonth, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { Bar, Doughnut, Pie } from 'react-chartjs-2'
import { Copy, Download, Languages, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import OnboardingEmpty from './components/OnboardingEmpty'
import CountUpNumber from './components/CountUpNumber'
import { CATEGORY_OPTIONS, DEFAULT_TEMPLATES, PAYMENT_METHODS, VIEW_TABS } from './constants'
import { adviceByBudgetMode, estimateMonthEnd, getProgressState } from './lib/budget'
import { parseCsvToRecords } from './lib/csv'
import { normalizeAmount, summarizeByCategory, summarizeByMonth, toCsv } from './lib/expenses'
import { loadStore, saveStore } from './lib/storage'
import type { BudgetMode, ExpenseRecord, Language, SortBy, ViewKey } from './types'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getCategoryIcon(category: string) {
  return CATEGORY_OPTIONS.find((item) => item.name === category)?.icon ?? '🧾'
}

function formatCurrency(value: number) {
  return `¥${value.toFixed(2)}`
}

export default function App() {
  const store = useMemo(() => loadStore(), [])
  const { t, i18n } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const defaultMonth = format(new Date(), 'yyyy-MM')

  const [records, setRecords] = useState<ExpenseRecord[]>(store.records)
  const [budgetsByMonth, setBudgetsByMonth] = useState<Record<string, number>>(store.budgetsByMonth)
  const [categoryBudgetsByMonth, setCategoryBudgetsByMonth] = useState<
    Record<string, Record<string, number>>
  >(store.categoryBudgetsByMonth)
  const [budgetMode, setBudgetMode] = useState<BudgetMode>(store.budgetMode)
  const [language, setLanguage] = useState<Language>(store.language)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [view, setView] = useState<ViewKey>('dashboard')

  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [category, setCategory] = useState<string>(CATEGORY_OPTIONS[0].name)
  const [customCategory, setCustomCategory] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [merchant, setMerchant] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0])
  const [necessary, setNecessary] = useState<'必要' | '非必要'>('必要')

  const [search, setSearch] = useState<string>('')
  const [monthFilter, setMonthFilter] = useState<string>(defaultMonth)
  const [categoryFilter, setCategoryFilter] = useState<string>('全部')
  const [sortBy, setSortBy] = useState<SortBy>('date_desc')
  const [budgetInput, setBudgetInput] = useState<string>(
    store.budgetsByMonth[defaultMonth] ? String(store.budgetsByMonth[defaultMonth]) : '',
  )
  const [categoryBudgetInputs, setCategoryBudgetInputs] = useState<Record<string, string>>(() => {
    const source = store.categoryBudgetsByMonth[defaultMonth] ?? {}
    const next: Record<string, string> = {}
    for (const item of CATEGORY_OPTIONS) {
      next[item.name] = source[item.name] ? String(source[item.name]) : ''
    }
    return next
  })
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    saveStore({
      version: 2,
      records,
      budgetsByMonth,
      categoryBudgetsByMonth,
      budgetMode,
      language,
    })
  }, [records, budgetsByMonth, categoryBudgetsByMonth, budgetMode, language])

  useEffect(() => {
    void i18n.changeLanguage(language)
  }, [language, i18n])

  function syncBudgetInputsByMonth(nextMonth: string) {
    const monthBudget = budgetsByMonth[nextMonth]
    setBudgetInput(monthBudget ? String(monthBudget) : '')

    const source = categoryBudgetsByMonth[nextMonth] ?? {}
    const next: Record<string, string> = {}
    for (const item of CATEGORY_OPTIONS) {
      next[item.name] = source[item.name] ? String(source[item.name]) : ''
    }
    setCategoryBudgetInputs(next)
  }

  function onMonthFilterChange(nextMonth: string) {
    setMonthFilter(nextMonth)
    syncBudgetInputsByMonth(nextMonth)
  }

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

  function applyTemplate(templateId: string) {
    const template = DEFAULT_TEMPLATES.find((item) => item.id === templateId)
    if (!template) {
      return
    }
    setCategory(template.category)
    setAmount(String(template.amount))
    setMerchant(template.merchant)
    setPaymentMethod(template.paymentMethod)
    setNecessary(template.necessary)
    setNote(template.note)
    setView('transactions')
  }

  function startEdit(record: ExpenseRecord) {
    setView('transactions')
    setEditingId(record.id)
    setDate(record.date)
    setAmount(String(record.amount))
    setNote(record.note)
    setMerchant(record.merchant)
    setPaymentMethod(record.paymentMethod)
    setNecessary(record.necessary)

    const isPresetCategory = CATEGORY_OPTIONS.some((item) => item.name === record.category)
    if (isPresetCategory) {
      setCategory(record.category)
      setCustomCategory('')
    } else {
      setCategory('其他')
      setCustomCategory(record.category)
    }
  }

  function duplicateRecord(record: ExpenseRecord) {
    const duplicated: ExpenseRecord = {
      ...record,
      id: createId(),
      date: format(new Date(), 'yyyy-MM-dd'),
    }
    setRecords((previous) => [duplicated, ...previous])
  }

  function cancelEdit() {
    resetForm()
    setErrorMessage('')
  }

  function handleDelete(id: string) {
    setRecords((previous) => previous.filter((item) => item.id !== id))
    if (editingId === id) {
      cancelEdit()
    }
  }

  const allCategories = useMemo(() => {
    const categories = new Set([
      ...CATEGORY_OPTIONS.map((item) => item.name),
      ...records.map((item) => item.category),
    ])
    return ['全部', ...[...categories].sort((a, b) => a.localeCompare(b, 'zh-CN'))]
  }, [records])

  const filteredRecords = useMemo(() => {
    const next = records.filter((record) => {
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
        record.note.toLowerCase().includes(query) ||
        record.category.toLowerCase().includes(query) ||
        record.merchant.toLowerCase().includes(query) ||
        record.paymentMethod.toLowerCase().includes(query)
      )
    })

    next.sort((a, b) => {
      if (sortBy === 'date_desc') return b.date.localeCompare(a.date)
      if (sortBy === 'date_asc') return a.date.localeCompare(b.date)
      if (sortBy === 'amount_desc') return b.amount - a.amount
      return a.amount - b.amount
    })

    return next
  }, [records, monthFilter, categoryFilter, search, sortBy])

  const monthRecords = useMemo(
    () => records.filter((item) => item.date.startsWith(monthFilter)),
    [records, monthFilter],
  )
  const categorySummary = useMemo(() => summarizeByCategory(filteredRecords), [filteredRecords])
  const monthlySummary = useMemo(() => summarizeByMonth(records).slice(-6), [records])

  const totalAmount = useMemo(
    () => filteredRecords.reduce((sum, item) => sum + item.amount, 0),
    [filteredRecords],
  )
  const currentMonthTotal = useMemo(
    () => monthRecords.reduce((sum, item) => sum + item.amount, 0),
    [monthRecords],
  )
  const necessaryTotal = useMemo(
    () =>
      monthRecords
        .filter((item) => item.necessary === '必要')
        .reduce((sum, item) => sum + item.amount, 0),
    [monthRecords],
  )
  const nonNecessaryTotal = currentMonthTotal - necessaryTotal

  const monthlyBudget = budgetsByMonth[monthFilter] ?? 0
  const usageRatio = monthlyBudget > 0 ? currentMonthTotal / monthlyBudget : 0
  const budgetState = getProgressState(usageRatio)
  const budgetRemain = monthlyBudget > 0 ? monthlyBudget - currentMonthTotal : 0
  const necessaryRatio = currentMonthTotal > 0 ? necessaryTotal / currentMonthTotal : 0

  const monthDate = parseISO(`${monthFilter}-01`)
  const day = isSameMonth(monthDate, new Date()) ? getDate(new Date()) : getDaysInMonth(monthDate)
  const monthForecast = estimateMonthEnd(currentMonthTotal, day, getDate(endOfMonth(monthDate)))

  const budgetModeAdvice = adviceByBudgetMode(budgetMode, usageRatio)
  const adviceText =
    monthlyBudget > 0
      ? `${budgetModeAdvice} 预计月底支出 ${formatCurrency(monthForecast)}。`
      : '先设置月预算后可获得更精确的消费建议。'

  const categoryBudgetsForMonth = categoryBudgetsByMonth[monthFilter] ?? {}
  const monthCategorySummary = useMemo(() => summarizeByCategory(monthRecords), [monthRecords])
  const monthCategoryMap = useMemo(
    () => new Map(monthCategorySummary.map((item) => [item.category, item.total])),
    [monthCategorySummary],
  )

  const pieData = {
    labels: categorySummary.map((item) => `${getCategoryIcon(item.category)} ${item.category}`),
    datasets: [
      {
        label: '分类占比',
        data: categorySummary.map((item) => item.total),
        backgroundColor: [
          '#f59e0b',
          '#10b981',
          '#3b82f6',
          '#ef4444',
          '#8b5cf6',
          '#14b8a6',
          '#84cc16',
          '#f97316',
        ],
      },
    ],
  }

  const barData = {
    labels: monthlySummary.map((item) => item.month),
    datasets: [
      {
        label: '月总支出',
        data: monthlySummary.map((item) => item.total),
        backgroundColor: '#2563eb',
      },
    ],
  }

  const necessaryDonutData = {
    labels: ['必要', '非必要'],
    datasets: [
      {
        data: [necessaryTotal, Math.max(nonNecessaryTotal, 0)],
        backgroundColor: ['#16a34a', '#f97316'],
      },
    ],
  }

  const recentRecords = useMemo(
    () => [...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [records],
  )

  function handleSubmitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = normalizeAmount(amount)
    const finalCategory = category === '其他' ? customCategory.trim() || '其他' : category

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
      setRecords((previous) =>
        previous.map((item) => (item.id === editingId ? { ...item, ...payload } : item)),
      )
    } else {
      setRecords((previous) => [{ id: createId(), ...payload }, ...previous])
    }

    setErrorMessage('')
    resetForm()
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

  function handleImportCsv(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : ''
      const imported = parseCsvToRecords(content)
      if (imported.length === 0) {
        setErrorMessage('没有解析到有效 CSV 记录。')
        return
      }
      setRecords((previous) => [...imported, ...previous])
      setErrorMessage('')
    }
    reader.readAsText(file)
  }

  function handleSaveBudget() {
    const value = normalizeAmount(budgetInput)
    if (value <= 0) {
      setErrorMessage('预算金额需大于 0。')
      return
    }
    setBudgetsByMonth((previous) => ({ ...previous, [monthFilter]: value }))
    setErrorMessage('')
  }

  function handleSaveCategoryBudgets() {
    const nextCategoryBudget: Record<string, number> = {}
    for (const [category, rawValue] of Object.entries(categoryBudgetInputs)) {
      const value = normalizeAmount(rawValue)
      if (value > 0) {
        nextCategoryBudget[category] = value
      }
    }

    setCategoryBudgetsByMonth((previous) => ({
      ...previous,
      [monthFilter]: nextCategoryBudget,
    }))
    setErrorMessage('')
  }

  const showOnboarding = records.length === 0

  return (
    <main className="page">
      <header className="header panel hero">
        <div>
          <h1>{t('appTitle')}</h1>
          <p>{t('appDesc')}</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setLanguage((prev) => (prev === 'zh' ? 'en' : 'zh'))}
            title="Switch language"
          >
            <Languages size={16} />
            <span>{language === 'zh' ? '中文' : 'EN'}</span>
          </button>
        </div>
      </header>

      <nav className="tabs sticky-mobile">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.key}
            className={view === tab.key ? 'tab active' : 'tab'}
            onClick={() => setView(tab.key)}
            type="button"
          >
            {language === 'zh' ? tab.labelZh : tab.labelEn}
          </button>
        ))}
      </nav>

      {showOnboarding && (
        <OnboardingEmpty
          title={t('emptyTitle')}
          description={t('emptyDesc')}
          templates={DEFAULT_TEMPLATES}
          onUseTemplate={(template) => applyTemplate(template.id)}
        />
      )}

      {view === 'dashboard' && (
        <>
          <section className="stats-grid fade-in">
            <article className="stat-card">
              <span>本月支出</span>
              <strong>
                <CountUpNumber value={currentMonthTotal} prefix="¥" />
              </strong>
            </article>
            <article className="stat-card">
              <span>预算剩余</span>
              <strong>
                <CountUpNumber value={budgetRemain} prefix="¥" />
              </strong>
            </article>
            <article className="stat-card">
              <span>必要支出占比</span>
              <strong>{(necessaryRatio * 100).toFixed(1)}%</strong>
            </article>
            <article className="stat-card">
              <span>月底预测</span>
              <strong>
                <CountUpNumber value={monthForecast} prefix="¥" />
              </strong>
            </article>
          </section>

          <section className="panel budget-highlight fade-in">
            <div className="budget-headline">
              <h2>月预算状态</h2>
              <span className={`state-pill ${budgetState}`}>
                {monthlyBudget <= 0
                  ? '未设置'
                  : budgetState === 'danger'
                    ? '超支'
                    : budgetState === 'warning'
                      ? '预警'
                      : budgetState === 'notice'
                        ? '注意'
                        : '健康'}
              </span>
            </div>
            {monthlyBudget > 0 ? (
              <>
                <div className="budget-progress">
                  <span
                    className={budgetState}
                    style={{ width: `${Math.min(usageRatio * 100, 100)}%` }}
                  />
                </div>
                <p className="budget-text">
                  已使用 {(usageRatio * 100).toFixed(1)}%，
                  {budgetRemain >= 0
                    ? `剩余 ${formatCurrency(budgetRemain)}`
                    : `超出 ${formatCurrency(Math.abs(budgetRemain))}`}
                </p>
              </>
            ) : (
              <p className="budget-text">请到「预算」页设置本月预算。</p>
            )}
            <p className="advice">{adviceText}</p>
          </section>

          <section className="grid-2 fade-in">
            <article className="panel">
              <h2>最近记录</h2>
              <ul className="record-list compact">
                {recentRecords.length === 0 && <li className="empty">暂无记录</li>}
                {recentRecords.map((record) => (
                  <li key={record.id}>
                    <div>
                      <strong>
                        {getCategoryIcon(record.category)} {record.category}
                      </strong>
                      <p>
                        {record.merchant || '未填写商家'} · {record.paymentMethod}
                      </p>
                    </div>
                    <div className="record-meta">
                      <span>{record.date}</span>
                      <span>{formatCurrency(record.amount)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
            <article className="panel">
              <h2>必要/非必要占比</h2>
              {currentMonthTotal > 0 ? (
                <Doughnut data={necessaryDonutData} />
              ) : (
                <p className="empty">本月暂无数据</p>
              )}
            </article>
          </section>
        </>
      )}

      {view === 'transactions' && (
        <>
          <section className="panel fade-in">
            <div className="toolbar">
              <h2>{editingId ? '编辑记录' : '新增记账'}</h2>
              <div className="toolbar-actions">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={15} />
                  <span>导入 CSV</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImportCsv(file)
                    }
                    e.currentTarget.value = ''
                  }}
                />
              </div>
            </div>

            <div className="template-row">
              {DEFAULT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className="template-chip"
                  onClick={() => applyTemplate(template.id)}
                >
                  <Plus size={14} />
                  {template.name}
                </button>
              ))}
            </div>

            <form className="expense-form" onSubmit={handleSubmitExpense}>
              <label>
                日期
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
              <label>
                分类
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORY_OPTIONS.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.icon} {item.name}
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
                    onChange={(e) => setCustomCategory(e.target.value)}
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
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
              <label>
                商家
                <input
                  type="text"
                  value={merchant}
                  placeholder="例如：盒马 / 地铁"
                  onChange={(e) => setMerchant(e.target.value)}
                />
              </label>
              <label>
                支付方式
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  {PAYMENT_METHODS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                消费属性
                <select
                  value={necessary}
                  onChange={(e) => setNecessary(e.target.value as '必要' | '非必要')}
                >
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
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
              <div className="action-row full-row">
                <button type="submit">{editingId ? '保存修改' : '添加记录'}</button>
                {editingId && (
                  <button type="button" className="btn-secondary" onClick={cancelEdit}>
                    取消编辑
                  </button>
                )}
              </div>
            </form>
            {errorMessage && <p className="error">{errorMessage}</p>}
          </section>

          <section className="panel fade-in">
            <div className="toolbar">
              <h2>账单记录</h2>
              <button type="button" className="icon-btn" onClick={handleExportCsv}>
                <Download size={15} />
                <span>导出 CSV</span>
              </button>
            </div>
            <div className="filters">
              <label>
                月份
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => onMonthFilterChange(e.target.value)}
                />
              </label>
              <label>
                分类
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  {allCategories.map((item) => (
                    <option key={item} value={item}>
                      {item === '全部' ? '全部' : `${getCategoryIcon(item)} ${item}`}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                排序
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
                  <option value="date_desc">日期 - 最新优先</option>
                  <option value="date_asc">日期 - 最早优先</option>
                  <option value="amount_desc">金额 - 从高到低</option>
                  <option value="amount_asc">金额 - 从低到高</option>
                </select>
              </label>
              <label>
                搜索
                <input
                  type="text"
                  value={search}
                  placeholder="备注/商家/分类/支付方式"
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <p className="total">
                筛选总额：<strong>{formatCurrency(totalAmount)}</strong>
              </p>
            </div>

            <ul className="record-list">
              {filteredRecords.length === 0 && <li className="empty">暂无符合条件的记录。</li>}
              {filteredRecords.map((record) => (
                <li key={record.id}>
                  <div>
                    <strong>
                      {getCategoryIcon(record.category)} {record.category}{' '}
                      <span className="badge">{record.necessary}</span>
                    </strong>
                    <p>
                      商家：{record.merchant || '未填写'} | 支付：{record.paymentMethod}
                    </p>
                    <p>{record.note || '无备注'}</p>
                  </div>
                  <div className="record-meta">
                    <span>{record.date}</span>
                    <span>{formatCurrency(record.amount)}</span>
                    <button type="button" className="icon-btn" onClick={() => startEdit(record)}>
                      <Pencil size={14} />
                      <span>编辑</span>
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => duplicateRecord(record)}
                    >
                      <Copy size={14} />
                      <span>复制</span>
                    </button>
                    <button
                      type="button"
                      className="icon-btn danger"
                      onClick={() => handleDelete(record.id)}
                    >
                      <Trash2 size={14} />
                      <span>删除</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {view === 'budgets' && (
        <>
          <section className="panel fade-in">
            <h2>月总预算</h2>
            <div className="budget-controls inline">
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => onMonthFilterChange(e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={budgetInput}
                placeholder="设置本月预算"
                onChange={(e) => setBudgetInput(e.target.value)}
              />
              <button type="button" onClick={handleSaveBudget}>
                保存总预算
              </button>
            </div>
            <div className="mode-row">
              <span>预算模式</span>
              <select
                value={budgetMode}
                onChange={(e) => setBudgetMode(e.target.value as BudgetMode)}
              >
                <option value="conservative">保守</option>
                <option value="balanced">平衡</option>
                <option value="flexible">灵活</option>
              </select>
            </div>
            <p className="budget-text">
              当前预算：{monthlyBudget > 0 ? formatCurrency(monthlyBudget) : '未设置'}
            </p>
            <p className="budget-text">预计月底支出：{formatCurrency(monthForecast)}</p>
          </section>

          <section className="panel fade-in">
            <div className="toolbar">
              <h2>分类预算</h2>
              <button type="button" onClick={handleSaveCategoryBudgets}>
                保存分类预算
              </button>
            </div>
            <div className="category-budget-grid">
              {CATEGORY_OPTIONS.map((item) => {
                const spent = monthCategoryMap.get(item.name) ?? 0
                const budget = categoryBudgetsForMonth[item.name] ?? 0
                const ratio = budget > 0 ? spent / budget : 0
                const state = getProgressState(ratio)
                return (
                  <article key={item.name} className="category-budget-card">
                    <h3>
                      {item.icon} {item.name}
                    </h3>
                    <label>
                      分类预算
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={categoryBudgetInputs[item.name] ?? ''}
                        placeholder="0.00"
                        onChange={(e) =>
                          setCategoryBudgetInputs((prev) => ({
                            ...prev,
                            [item.name]: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <p>已支出：{formatCurrency(spent)}</p>
                    <p>预算：{budget > 0 ? formatCurrency(budget) : '未设置'}</p>
                    {budget > 0 && (
                      <>
                        <div className="budget-progress small">
                          <span
                            className={state}
                            style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                          />
                        </div>
                        <p className="budget-status">使用率：{(ratio * 100).toFixed(1)}%</p>
                      </>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        </>
      )}

      {view === 'insights' && (
        <section className="grid-2 fade-in">
          <article className="panel">
            <h2>分类占比图</h2>
            {categorySummary.length === 0 ? (
              <p className="empty">暂无数据可视化。</p>
            ) : (
              <Pie data={pieData} />
            )}
          </article>
          <article className="panel">
            <h2>近 6 个月支出趋势</h2>
            {monthlySummary.length === 0 ? (
              <p className="empty">暂无数据可视化。</p>
            ) : (
              <Bar data={barData} />
            )}
          </article>
        </section>
      )}
    </main>
  )
}

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
const PRESET_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other']

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function readFromStorage(): ExpenseRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as ExpenseRecord[]
    return Array.isArray(parsed) ? parsed : []
  }
  catch {
    return []
  }
}

export default function App() {
  const [records, setRecords] = useState<ExpenseRecord[]>(() => readFromStorage())
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [category, setCategory] = useState<string>(PRESET_CATEGORIES[0])
  const [customCategory, setCustomCategory] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [monthFilter, setMonthFilter] = useState<string>(format(new Date(), 'yyyy-MM'))
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  }, [records])

  const allCategories = useMemo(() => {
    const categories = new Set([...PRESET_CATEGORIES, ...records.map(item => item.category)])
    return ['All', ...[...categories].sort((a, b) => a.localeCompare(b))]
  }, [records])

  const filteredRecords = useMemo(() => {
    return records
      .filter((record) => {
        if (monthFilter && !record.date.startsWith(monthFilter)) {
          return false
        }
        if (categoryFilter !== 'All' && record.category !== categoryFilter) {
          return false
        }
        if (!search.trim()) {
          return true
        }
        const q = search.toLowerCase()
        return record.note.toLowerCase().includes(q) || record.category.toLowerCase().includes(q)
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [records, monthFilter, categoryFilter, search])

  const totalAmount = useMemo(
    () => filteredRecords.reduce((sum, item) => sum + item.amount, 0),
    [filteredRecords],
  )

  const categorySummary = useMemo(
    () => summarizeByCategory(filteredRecords),
    [filteredRecords],
  )

  const monthlySummary = useMemo(
    () => summarizeByMonth(records).slice(-6),
    [records],
  )

  const pieData = {
    labels: categorySummary.map(item => item.category),
    datasets: [
      {
        label: 'Category Breakdown',
        data: categorySummary.map(item => item.total),
        backgroundColor: ['#14532d', '#166534', '#15803d', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'],
      },
    ],
  }

  const barData = {
    labels: monthlySummary.map(item => item.month),
    datasets: [
      {
        label: 'Monthly Total',
        data: monthlySummary.map(item => item.total),
        backgroundColor: '#166534',
      },
    ],
  }

  function handleAddExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedAmount = normalizeAmount(amount)
    const finalCategory = category === 'Other'
      ? customCategory.trim() || 'Other'
      : category

    if (!date || !finalCategory || normalizedAmount <= 0) {
      setErrorMessage('Please fill date, category and a valid amount.')
      return
    }

    const next: ExpenseRecord = {
      id: createId(),
      date,
      category: finalCategory,
      amount: normalizedAmount,
      note: note.trim(),
    }

    setRecords(previous => [next, ...previous])
    setAmount('')
    setNote('')
    setErrorMessage('')
  }

  function handleDelete(id: string) {
    setRecords(previous => previous.filter(item => item.id !== id))
  }

  function handleExportCsv() {
    if (filteredRecords.length === 0) {
      setErrorMessage('No records available for export under current filters.')
      return
    }

    const blob = new Blob([toCsv(filteredRecords)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `expenses-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <main className="page">
      <header className="header">
        <h1>Expense Visualizer</h1>
        <p>Track spending, see category and monthly trends, and export CSV.</p>
      </header>

      <section className="panel">
        <h2>Add Expense</h2>
        <form className="expense-form" onSubmit={handleAddExpense}>
          <label>
            Date
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </label>
          <label>
            Category
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {PRESET_CATEGORIES.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          {category === 'Other' && (
            <label>
              Custom Category
              <input
                type="text"
                value={customCategory}
                placeholder="Custom category"
                onChange={e => setCustomCategory(e.target.value)}
              />
            </label>
          )}
          <label>
            Amount
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
          <label className="full-row">
            Note
            <input
              type="text"
              value={note}
              placeholder="Optional note"
              onChange={e => setNote(e.target.value)}
            />
          </label>
          <button type="submit">Add</button>
        </form>
        {errorMessage && <p className="error">{errorMessage}</p>}
      </section>

      <section className="panel">
        <div className="toolbar">
          <h2>Records</h2>
          <button type="button" onClick={handleExportCsv}>Export CSV</button>
        </div>
        <div className="filters">
          <label>
            Month
            <input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} />
          </label>
          <label>
            Category
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              {allCategories.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            Search
            <input
              type="text"
              value={search}
              placeholder="Search note/category"
              onChange={e => setSearch(e.target.value)}
            />
          </label>
          <p className="total">
            Total:
            {' '}
            <strong>${totalAmount.toFixed(2)}</strong>
          </p>
        </div>

        <ul className="record-list">
          {filteredRecords.length === 0 && <li className="empty">No records found.</li>}
          {filteredRecords.map(record => (
            <li key={record.id}>
              <div>
                <strong>{record.category}</strong>
                <p>{record.note || 'No note'}</p>
              </div>
              <div className="record-meta">
                <span>{record.date}</span>
                <span>${record.amount.toFixed(2)}</span>
                <button type="button" onClick={() => handleDelete(record.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="charts">
        <article className="panel">
          <h2>Category Breakdown</h2>
          {categorySummary.length === 0
            ? <p className="empty">No data to chart.</p>
            : <Pie data={pieData} />}
        </article>
        <article className="panel">
          <h2>Monthly Trend (Last 6 months)</h2>
          {monthlySummary.length === 0
            ? <p className="empty">No data to chart.</p>
            : <Bar data={barData} />}
        </article>
      </section>
    </main>
  )
}

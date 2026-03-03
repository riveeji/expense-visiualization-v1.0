import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  zh: {
    translation: {
      appTitle: '账单可视化助手 Pro',
      appDesc: '更好看的界面、更完整的预算管理、更清晰的数据洞察。',
      emptyTitle: '从第一条记录开始',
      emptyDesc: '可以先用下方模板快速录入，再按你的习惯逐步完善预算。',
    },
  },
  en: {
    translation: {
      appTitle: 'Expense Visualizer Pro',
      appDesc: 'Polished UI, stronger budget controls, and clearer insights.',
      emptyTitle: 'Start with your first expense',
      emptyDesc: 'Use templates below for quick entry, then tune budgets as needed.',
    },
  },
}

void i18next.use(initReactI18next).init({
  resources,
  fallbackLng: 'zh',
  lng: 'zh',
  interpolation: {
    escapeValue: false,
  },
})

export default i18next

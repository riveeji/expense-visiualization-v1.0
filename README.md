# Expense Visualizer Pro / 账单可视化助手 Pro

An expense tracker desktop/web app with budgeting, forecasting, CSV import/export, and charts.  
一个支持预算管理、月末预测、CSV 导入导出和图表分析的记账应用（Web + Windows 桌面版）。

## Features / 功能

- Dashboard / Transactions / Budgets / Insights views
- Add, edit, duplicate, delete expense records
- Monthly budget + category budget tracking
- Budget mode: conservative / balanced / flexible
- End-of-month spending forecast
- Necessary vs optional spending ratio
- CSV import/export
- Local data persistence
- Basic i18n (Chinese / English)
- Electron Windows desktop packaging support

- 总览 / 记账 / 预算 / 分析四大页面
- 支持新增、编辑、复制、删除账单记录
- 支持月预算和分类预算
- 预算模式：保守 / 平衡 / 灵活
- 月底支出预测
- 必要/非必要支出占比
- 支持 CSV 导入导出
- 本地数据持久化
- 支持中英文切换（基础）
- 支持 Electron 打包为 Windows 桌面应用

## Tech Stack / 技术栈

- React + TypeScript + Vite
- Chart.js + react-chartjs-2
- date-fns
- zod
- i18next + react-i18next
- Electron + electron-builder
- Vitest + ESLint + Prettier

## Quick Start / 快速开始

```bash
npm install
npm run dev
```

## Build Web / 构建 Web

```bash
npm run build
npm run preview
```

## Build Windows Desktop / 构建 Windows 桌面版

```bash
npm run build:win
```

After build, use:
构建完成后运行：

- `release/win-unpacked/Expense Visualizer.exe`

Note: keep the whole `win-unpacked` folder; do not copy only the `.exe`.  
注意：需要保留完整 `win-unpacked` 目录，不能只复制单个 `.exe`。

## Scripts / 常用脚本

- `npm run dev`: start dev server / 启动开发服务器
- `npm run build`: type-check + production build / 类型检查并构建
- `npm run preview`: preview build / 预览构建产物
- `npm run test`: run tests / 运行测试
- `npm run lint`: run lint checks / 运行代码检查
- `npm run format`: format code / 代码格式化
- `npm run build:win`: build Windows desktop package / 构建 Windows 桌面包

## Project Structure / 项目结构

```text
src/
  App.tsx
  main.tsx
  i18n.ts
  constants.ts
  types.ts
  components/
  lib/
electron/
```

## Roadmap / 规划

- [ ] Full i18n coverage (all labels/messages)
- [ ] Better category/payment label normalization
- [ ] More analytics widgets
- [ ] Optional cloud sync

- [ ] 全量国际化（所有标签/提示）
- [ ] 分类与支付方式文本标准化
- [ ] 更多分析组件
- [ ] 可选云同步

## License / 许可证

MIT

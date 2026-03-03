# 账单可视化助手 Pro

一个支持预算管理、消费建议、可视化分析、CSV 导入导出的前端记账应用。

## 主要功能

- 多页面导航：总览 / 记账 / 预算 / 分析
- 新增、编辑、删除、复制记账记录
- 固定模板快速记账（房租、订阅、通勤）
- 记录排序（日期、金额）
- CSV 导出 + CSV 导入
- 月预算与分类预算
- 预算模式（保守 / 平衡 / 灵活）
- 月底支出预测与预算建议
- 必要 / 非必要支出占比
- 本地持久化（带版本迁移）
- PWA 支持（可安装）
- 中英切换（基础文案）

## 技术栈

- React + TypeScript + Vite
- Chart.js + react-chartjs-2
- date-fns
- zod（本地数据校验）
- i18next + react-i18next
- Vitest
- ESLint + Prettier + Husky + lint-staged

## 快速开始

```bash
npm install
npm run dev
```

## 生产运行

```bash
npm run build
npm run preview -- --host 127.0.0.1
```

## 可用脚本

- `npm run dev` 开发环境
- `npm run build` 构建
- `npm run preview` 预览构建产物
- `npm run test` 单元测试
- `npm run lint` 代码检查
- `npm run format` 代码格式化

## 目录结构

```text
src/
  App.tsx
  main.tsx
  i18n.ts
  constants.ts
  types.ts
  components/
    CountUpNumber.tsx
    OnboardingEmpty.tsx
  lib/
    expenses.ts
    csv.ts
    budget.ts
    storage.ts
    *.test.ts
```

## 后续可继续扩展

- 深化 i18n（全量文案词典）
- 接入后端账号体系
- 高级图表筛选（周/季度/年度）
- 数据加密与云端同步

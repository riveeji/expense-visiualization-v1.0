# 账单可视化助手（expense-visiualization-v1.0）

一个轻量、中文友好的个人记账可视化工具。

## 功能

- 新增和删除记账记录
- 更详细的记账字段
- 商家、支付方式、必要/非必要标记
- 按月份、分类、关键词筛选
- 分类占比饼图、近 6 个月趋势柱图
- 月预算设置 + 阈值预警 + 消费建议
- 导出当前筛选结果为 CSV
- 数据保存在浏览器本地 `localStorage`

## 技术栈

- React + TypeScript + Vite
- Chart.js + react-chartjs-2
- date-fns
- Vitest

## 本地运行

```bash
npm install
npm run dev
```

## 仅运行（生产预览）

```bash
npm install
npm run build
npm run preview -- --host 127.0.0.1
```

## 常用脚本

- `npm run dev` 本地开发
- `npm run build` 生产构建
- `npm run preview` 预览构建产物
- `npm run test` 运行单元测试

## 目录结构

```text
src/
  App.tsx
  main.tsx
  style.css
  lib/
    expenses.ts
    expenses.test.ts
```

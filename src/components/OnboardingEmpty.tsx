import type { ExpenseTemplate } from '../types'

interface OnboardingEmptyProps {
  title: string
  description: string
  templates: ExpenseTemplate[]
  onUseTemplate: (template: ExpenseTemplate) => void
}

export default function OnboardingEmpty({
  title,
  description,
  templates,
  onUseTemplate,
}: OnboardingEmptyProps) {
  return (
    <section className="panel onboarding">
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="template-grid">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            className="template-card"
            onClick={() => onUseTemplate(template)}
          >
            <strong>{template.name}</strong>
            <span>{template.category}</span>
            <span>¥{template.amount.toFixed(2)}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

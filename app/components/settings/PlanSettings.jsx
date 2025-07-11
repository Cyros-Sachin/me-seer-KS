import SectionWrapper from './SectionWrapper'

export default function PlanSettings() {
  const plans = [
    { name: 'Free', price: '$0/month' },
    { name: 'Plus', price: '$5/month billed annually' },
    { name: 'Premium', price: '$10/month billed annually' },
  ]

  return (
    <SectionWrapper title="Plans">
      <p className="mb-4">Active Plan: <strong>Beginner</strong></p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plans.map(plan => (
          <div key={plan.name} className="border rounded-lg p-4 bg-white shadow">
            <h3 className="font-bold mb-1">{plan.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">{plan.price}</p>
            <ul className="text-sm list-disc pl-5 space-y-1">
              <li>Create limited spaces & tasks</li>
              <li>Log activities (basic)</li>
              <li>Daily task reminders</li>
              <li>Limited dashboard view</li>
              <li>Data history: 7 days</li>
            </ul>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}

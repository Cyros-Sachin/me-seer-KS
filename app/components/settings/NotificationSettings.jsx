import SectionWrapper from './SectionWrapper'
import { Check, X } from 'lucide-react'
import { useState } from 'react'

export default function NotificationSettings() {
  const items = [
    'Task Due Reminder',
    'Daily Task Summary',
    'Missed Task Alert',
    'One-Time Task Reminder',
    'Goal Check-In',
    'Goal Lag Alert',
    'Activity Logging Reminder',
  ]

  const ToggleSwitch = ({ defaultChecked = false }) => {
    const [on, setOn] = useState(defaultChecked)
    return (
      <div
        onClick={() => setOn(!on)}
        className={`w-12 h-6 rounded-full cursor-pointer flex items-center px-1 transition ${
          on ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'
        }`}
      >
        {on ? <Check size={14} className="text-white" /> : <X size={14} className="text-white" />}
      </div>
    )
  }

  return (
    <SectionWrapper title="Notifications">
      {items.map((label) => (
        <div key={label} className="flex justify-between items-center py-2 border-b">
          <span>{label}</span>
          <ToggleSwitch />
        </div>
      ))}
    </SectionWrapper>
  )
}

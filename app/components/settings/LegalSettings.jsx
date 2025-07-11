import SectionWrapper from './SectionWrapper'
import { LogOut } from 'lucide-react'

export default function LegalSettings() {
  return (
    <SectionWrapper title="Legal & Info">
      <div className="space-y-4">
        <div>
          <p className="font-medium">Terms of Service</p>
          <p className="text-sm text-gray-500">Read our terms and conditions</p>
        </div>
        <div>
          <p className="font-medium">Privacy Policy</p>
          <p className="text-sm text-gray-500">Learn how we protect your data</p>
        </div>
        <div className="text-sm text-gray-500">
          <p>Version: 1.1.1</p>
          <p>Build: 2024.01.15</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200">
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </SectionWrapper>
  )
}

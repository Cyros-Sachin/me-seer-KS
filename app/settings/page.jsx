'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../components/settings/Sidebar'
import AccountSettings from '../components/settings/AccountSettings'
import GeneralSettings from '../components/settings/GeneralSettings'
import NotificationSettings from '../components/settings/NotificationSettings'
import IntegrationSettings from '../components/settings/IntegrationSettings'
import PlanSettings from '../components/settings/PlanSettings'
import LegalSettings from '../components/settings/LegalSettings'

const tabs = [
  'Account',
  'General',
  'Notifications',
  'Integrations',
  'Plans',
  'Legal & Info',
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Account')

  const renderTab = () => {
    switch (activeTab) {
      case 'Account': return <AccountSettings />
      case 'General': return <GeneralSettings />
      case 'Notifications': return <NotificationSettings />
      case 'Integrations': return <IntegrationSettings />
      case 'Plans': return <PlanSettings />
      case 'Legal & Info': return <LegalSettings />
      default: return null
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
      <main className="flex-1 p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

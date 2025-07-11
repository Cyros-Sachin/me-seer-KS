import SectionWrapper from './SectionWrapper'
import { Link2, Link2Off } from 'lucide-react'

export default function IntegrationSettings() {
  const connections = {
    'Movement & Activity': [
      { name: 'Fitbit', connected: true, lastSync: '1 hour ago' },
      { name: 'Google Fit', connected: false },
      { name: 'MyFitnessPal', connected: true, lastSync: '1 minute ago' },
    ],
    Finance: [
      { name: 'Mint', connected: true, lastSync: '56 minutes ago' },
      { name: 'Groww', connected: false },
    ],
  }

  return (
    <SectionWrapper title="Connections">
      {Object.entries(connections).map(([category, apps]) => (
        <div key={category} className="mb-4">
          <h4 className="font-medium mb-2">{category}</h4>
          {apps.map(app => (
            <div key={app.name} className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="font-medium">{app.name}</p>
                {app.lastSync && (
                  <p className="text-xs text-gray-500">Last sync: {app.lastSync}</p>
                )}
              </div>
              <button
                className={`px-3 py-1 rounded flex items-center gap-1 text-sm transition ${
                  app.connected
                    ? 'border border-gray-400 text-gray-700 hover:bg-gray-100'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {app.connected ? <Link2Off size={16} /> : <Link2 size={16} />}
                {app.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      ))}
    </SectionWrapper>
  )
}

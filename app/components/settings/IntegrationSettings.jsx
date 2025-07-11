import SectionWrapper from './SectionWrapper';
import { Link2, Link2Off } from 'lucide-react';
import { motion } from 'framer-motion';

export default function IntegrationSettings() {
  const connections = {
    'Movement & Activity': [
      { name: 'Fitbit', connected: true, lastSync: '1 hour ago', icon: '🏃' },
      { name: 'Google Fit', connected: false, icon: '🏋️' },
      { name: 'MyFitnessPal', connected: true, lastSync: '1 minute ago', icon: '🍎' },
    ],
    'Finance': [
      { name: 'Mint', connected: true, lastSync: '56 minutes ago', icon: '💰' },
      { name: 'Groww', connected: false, icon: '📈' },
    ],
  };

  return (
    <SectionWrapper title="App Connections">
      {Object.entries(connections).map(([category, apps]) => (
        <div key={category} className="mb-6">
          <h4 className="font-medium text-gray-700 mb-3">{category}</h4>
          <div className="space-y-2">
            {apps.map(app => (
              <motion.div 
                key={app.name}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{app.icon}</span>
                  <div>
                    <p className="font-medium text-gray-800">{app.name}</p>
                    {app.lastSync && (
                      <p className="text-xs text-gray-500">Last sync: {app.lastSync}</p>
                    )}
                  </div>
                </div>
                <motion.button
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm transition-all ${
                    app.connected
                      ? 'border border-gray-300 text-gray-700 hover:bg-gray-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  }`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {app.connected ? <Link2Off size={16} /> : <Link2 size={16} />}
                  {app.connected ? 'Disconnect' : 'Connect'}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </SectionWrapper>
  );
}
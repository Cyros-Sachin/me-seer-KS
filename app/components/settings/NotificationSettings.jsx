import SectionWrapper from './SectionWrapper';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function NotificationSettings() {
  const items = [
    { label: 'Task Due Reminder', enabled: true },
    { label: 'Daily Task Summary', enabled: true },
    { label: 'Missed Task Alert', enabled: false },
    { label: 'One-Time Task Reminder', enabled: true },
    { label: 'Goal Check-In', enabled: false },
    { label: 'Goal Lag Alert', enabled: true },
    { label: 'Activity Logging Reminder', enabled: false },
  ];

  const ToggleSwitch = ({ defaultChecked = false, onChange }) => {
    const [on, setOn] = useState(defaultChecked);
    
    const toggle = () => {
      setOn(!on);
      onChange?.(!on);
    };

    return (
      <motion.div
        onClick={toggle}
        className={`w-14 h-7 rounded-full cursor-pointer flex items-center px-1 transition-colors ${
          on ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div 
          className="w-5 h-5 bg-white rounded-full shadow-md"
          layout
        >
          {on ? (
            <Check size={12} className="text-green-500 m-auto" />
          ) : (
            <X size={12} className="text-gray-500 m-auto" />
          )}
        </motion.div>
      </motion.div>
    );
  };

  return (
    <SectionWrapper title="Notification Preferences">
      <div className="space-y-2">
        {items.map((item) => (
          <motion.div 
            key={item.label}
            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
            whileHover={{ scale: 1.01 }}
          >
            <span className="text-gray-700">{item.label}</span>
            <ToggleSwitch 
              defaultChecked={item.enabled} 
              // onChange={(enabled) => console.log(`${item.label}: ${enabled}`)}
            />
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}
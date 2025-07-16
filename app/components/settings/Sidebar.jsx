import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Sidebar({ activeTab, setActiveTab, tabs,onback }) {
  const router = useRouter();
  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-5 flex flex-col h-full">
      {/* Back button section */}
      <motion.button
        onClick={()=>router.push('/')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 px-2 py-1.5 rounded-lg hover:bg-gray-50 w-fit"
        whileHover={{ x: -3 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronLeft size={18} className="text-gray-500" />
        <span className="text-sm font-medium">Back</span>
      </motion.button>

      {/* Navigation tabs */}
      <div className="space-y-1 flex-grow">
        {tabs.map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
              activeTab === tab
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <motion.span 
              className={`w-1.5 h-6 rounded-full ${activeTab === tab ? 'bg-blue-500' : 'bg-transparent'}`}
              layoutId="sidebarIndicator"
            />
            <span>{tab}</span>
          </motion.button>
        ))}
      </div>

      {/* Optional footer area */}
      <div className="mt-auto pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">Settings v1.1.1</p>
      </div>
    </aside>
  );
}
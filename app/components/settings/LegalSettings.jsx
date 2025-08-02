import SectionWrapper from './SectionWrapper';
import { LogOut, FileText, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import {useRouter} from 'next/navigation';
import Cookies from "js-cookie";

export default function LegalSettings() {
  const router = useRouter();
  const items = [
    { icon: <FileText size={18} />, title: 'Terms of Service', description: 'Read our terms and conditions' },
    { icon: <Shield size={18} />, title: 'Privacy Policy', description: 'Learn how we protect your data' },
  ];

  return (
    <SectionWrapper title="Legal & Information">
      <div className="space-y-4">
        {items.map((item, index) => (
          <motion.div
            key={index}
            className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer"
            whileHover={{ x: 5 }}
          >
            <div className="flex items-center gap-3">
              <div className="text-blue-600">
                {item.icon}
              </div>
              <div>
                <p className="font-medium text-gray-800">{item.title}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </div>
          </motion.div>
        ))}

        <div className="text-sm text-gray-500 pt-4 border-t border-gray-100">
          <p>Version: 1.1.1</p>
          <p>Build: 2024.01.15</p>
        </div>

        <motion.button
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 mt-6 bg-red-50 border border-red-100 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            Cookies.remove("token");
            Cookies.remove("userInfo");
            router.push("/login");
          }} 
        >
          <LogOut size={18} />
          Sign Out
        </motion.button>
      </div>
    </SectionWrapper>
  );
}
import SectionWrapper from './SectionWrapper';
import { motion } from 'framer-motion';
import Cookies from "js-cookie";
export default function AccountSettings() {
  let data = null;
  try {
    const userInfoRaw = Cookies.get("userInfo");
    if (userInfoRaw) {
      data = JSON.parse(userInfoRaw);
    }
  } catch (err) {
    console.error("Failed to parse userInfo cookie:", err);
  }
  return (
    <SectionWrapper title="Account Settings">
      <div className="flex items-center gap-4">
        <motion.div
          className="w-14 h-14 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white flex items-center justify-center font-bold text-xl shadow-md"
          whileHover={{ scale: 1.05 }}
        >
          M
        </motion.div>
        <motion.button
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Change Photo
        </motion.button>
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-gray-700">Name: <span className="font-medium text-gray-900">{data?.name}</span></p>
        <p className="text-gray-700">Email: <span className="font-medium text-gray-900">{data?.email}</span></p>
      </div>

      <motion.button
        className="mt-6 px-4 py-2 bg-red-50 border border-red-100 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Delete account
      </motion.button>
    </SectionWrapper>
  );
}
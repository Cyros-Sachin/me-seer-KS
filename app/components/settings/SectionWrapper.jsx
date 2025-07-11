import { motion } from 'framer-motion';

export default function SectionWrapper({ title, children }) {
  return (
    <motion.section 
      className="mb-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
        {children}
      </div>
    </motion.section>
  );
}
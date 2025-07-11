import SectionWrapper from './SectionWrapper';
import { motion } from 'framer-motion';

export default function PlanSettings() {
  const plans = [
    { 
      name: 'Free', 
      price: '$0/month',
      features: [
        'Create limited spaces & tasks',
        'Log activities (basic)',
        'Daily task reminders',
        'Limited dashboard view',
        'Data history: 7 days'
      ],
      highlight: false
    },
    { 
      name: 'Plus', 
      price: '$5/month billed annually',
      features: [
        'Everything in Free',
        'Unlimited spaces & tasks',
        'Advanced activity logging',
        'Custom reminders',
        'Data history: 30 days',
        'Basic analytics'
      ],
      highlight: true
    },
    { 
      name: 'Premium', 
      price: '$10/month billed annually',
      features: [
        'Everything in Plus',
        'Priority support',
        'Advanced analytics',
        'Custom integrations',
        'Data history: 1 year',
        'Team collaboration'
      ],
      highlight: false
    },
  ];

  return (
    <SectionWrapper title="Subscription Plans">
      <p className="mb-6 text-gray-700">Active Plan: <span className="font-semibold text-blue-600">Beginner</span></p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan, index) => (
          <motion.div 
            key={plan.name}
            className={`border rounded-xl p-5 transition-all ${plan.highlight ? 'border-blue-300 bg-blue-50 shadow-lg' : 'border-gray-200 bg-white'}`}
            whileHover={{ y: -5 }}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className={`font-bold text-lg ${plan.highlight ? 'text-blue-600' : 'text-gray-800'}`}>{plan.name}</h3>
              <span className="text-sm font-medium text-gray-600">{plan.price}</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <svg 
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-blue-500' : 'text-gray-400'}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <motion.button
              className={`w-full mt-4 py-2 rounded-lg font-medium transition-colors ${
                plan.highlight 
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {plan.highlight ? 'Upgrade Now' : 'Select Plan'}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}
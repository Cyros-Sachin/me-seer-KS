import SectionWrapper from './SectionWrapper';

export default function GeneralSettings() {
  const settings = [
    { label: 'Date Format', value: 'DD-MM-YYYY' },
    { label: 'Time Format', value: '13:00 (24-hour)' },
    { label: 'Timezone', value: 'San Diego, CA, USA (GMT-7)' },
  ];

  return (
    <SectionWrapper title="General Settings">
      <div className="space-y-4">
        {settings.map((item, index) => (
          <div 
            key={index}
            className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
          >
            <p className="font-medium text-gray-700">{item.label}</p>
            <p className="text-gray-600">{item.value}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
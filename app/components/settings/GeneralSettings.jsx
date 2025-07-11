import SectionWrapper from './SectionWrapper'

export default function GeneralSettings() {
  return (
    <SectionWrapper title="General">
      <div className="space-y-4">
        <div>
          <p className="font-medium">Date Format</p>
          <p>DD-MM-YYYY</p>
        </div>
        <div>
          <p className="font-medium">Time Format</p>
          <p>13:00</p>
        </div>
        <div>
          <p className="font-medium">Timezone</p>
          <p>San Diego, CA, USA (GMT-7)</p>
        </div>
      </div>
    </SectionWrapper>
  )
}

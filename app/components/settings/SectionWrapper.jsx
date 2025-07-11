export default function SectionWrapper({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="bg-white rounded-lg shadow p-4">{children}</div>
    </section>
  )
}

export default function Sidebar({ activeTab, setActiveTab, tabs }) {
  return (
    <aside className="w-64 bg-white border-r p-4">
      <div className="space-y-2">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`w-full text-left px-3 py-2 rounded-lg transition ${
              activeTab === tab
                ? 'bg-gray-200 font-semibold'
                : 'hover:bg-gray-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </aside>
  )
}

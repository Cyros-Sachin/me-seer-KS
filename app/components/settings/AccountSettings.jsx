import SectionWrapper from './SectionWrapper'

export default function AccountSettings() {
  return (
    <SectionWrapper title="Account">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded bg-red-500 text-white flex items-center justify-center font-bold text-xl">
          M
        </div>
        <button className="px-3 py-1 bg-gray-200 rounded">Change Photo</button>
      </div>
      <p className="mt-4">Name: <strong>Micah Bell</strong></p>
      <p>Email: advaitramesh7@gmail.com</p>
      <button className="mt-4 px-3 py-1 bg-red-100 text-red-500 rounded">Delete account</button>
    </SectionWrapper>
  )
}

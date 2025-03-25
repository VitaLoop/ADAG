import type React from "react"

type PrintLayoutProps = {
  title: string
  children: React.ReactNode
}

export function PrintLayout({ title, children }: PrintLayoutProps) {
  return (
    <div className="w-full">
      <div className="print:block hidden mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="border-b border-gray-200 mt-2 mb-6" />
      </div>
      {children}
    </div>
  )
}


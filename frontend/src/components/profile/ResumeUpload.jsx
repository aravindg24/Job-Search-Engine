import { useRef, useState } from 'react'

export default function ResumeUpload({ onUpload, uploading }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handleFile = (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) return
    onUpload(file)
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault()
        setDragging(false)
        handleFile(e.dataTransfer.files[0])
      }}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
        dragging
          ? 'border-accent bg-accent/5'
          : 'border-border hover:border-zinc-600 hover:bg-white/[0.02]'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={e => handleFile(e.target.files[0])}
      />

      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <svg className="w-8 h-8 animate-spin text-accent" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-secondary text-sm">Parsing your resume…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-primary text-sm font-medium">Drop your resume here</p>
          <p className="text-secondary text-xs">PDF only · Max 10 MB</p>
        </div>
      )}
    </div>
  )
}

import { useRef, useState } from 'react'

export default function FileUpload({ file, onChange, error }) {
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)

  const handleFile = (f) => {
    if (!f) return
    if (f.type !== 'application/pdf') return alert('Only PDF files are allowed')
    if (f.size > 5 * 1024 * 1024) return alert('File must be under 5MB')
    onChange(f)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const formatSize = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB'

  return (
    <div>
      {!file ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current.click()}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
            ${dragging ? 'border-indeed-blue bg-blue-50' : 'border-gray-300 hover:border-indeed-blue hover:bg-gray-50'}
            ${error ? 'border-red-400' : ''}`}
        >
          <div className="text-4xl mb-3">📄</div>
          <p className="text-sm font-semibold text-gray-700">Drag & drop your resume here</p>
          <p className="text-xs text-gray-400 mt-1">PDF only · Max 5MB</p>
          <button type="button" className="mt-4 text-indeed-blue text-sm font-medium hover:underline">
            Browse files
          </button>
          <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📄</span>
            <div>
              <p className="text-sm font-medium text-gray-800">{file.name}</p>
              <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
            </div>
          </div>
          <button onClick={() => onChange(null)} className="text-red-400 hover:text-red-600 text-sm font-medium">Remove</button>
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

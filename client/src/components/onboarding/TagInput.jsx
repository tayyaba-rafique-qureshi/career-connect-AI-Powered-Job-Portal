import { useState } from 'react'

export default function TagInput({ tags, onChange, placeholder = 'Type and press Enter...' }) {
  const [input, setInput] = useState('')

  const add = () => {
    const val = input.trim()
    if (val && !tags.includes(val)) onChange([...tags, val])
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); add() }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-full px-3 py-1">
            {tag}
            <button onClick={() => onChange(tags.filter(t => t !== tag))} className="text-blue-400 hover:text-blue-700 font-bold text-xs ml-1">×</button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={add}
        placeholder={placeholder}
        className="w-full h-12 px-4 border border-[#D4D2D0] rounded focus:outline-none focus:border-indeed-blue focus:ring-2 focus:ring-blue-100 text-sm"
      />
    </div>
  )
}

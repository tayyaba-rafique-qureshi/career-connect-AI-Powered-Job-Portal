import { useState, useRef } from 'react'

const SUGGESTIONS = [
  'JavaScript','Python','React','Node.js','MongoDB','SQL','Java','C++',
  'TypeScript','Docker','Git','Figma','Photoshop','Excel','Communication',
  'Leadership','Project Management','AWS','REST APIs','GraphQL','Vue.js',
  'Angular','PHP','Ruby','Swift','Kotlin','Machine Learning','Data Analysis'
]

export default function SkillChipInput({ skills, onChange, showLevel = false }) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef()

  const filtered = query.length > 0
    ? SUGGESTIONS.filter(s => s.toLowerCase().includes(query.toLowerCase()) && !skills.find(sk => sk.name === s))
    : []

  const addSkill = (name) => {
    if (skills.find(s => s.name === name)) return
    onChange([...skills, { name, level: 'Intermediate' }])
    setQuery('')
    inputRef.current?.focus()
  }

  const removeSkill = (name) => onChange(skills.filter(s => s.name !== name))

  const updateLevel = (name, level) => onChange(skills.map(s => s.name === name ? { ...s, level } : s))

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      addSkill(query.trim())
      e.preventDefault()
    }
  }

  return (
    <div>
      {/* Chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {skills.map(skill => (
          <div key={skill.name} className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
            <span className="text-sm text-blue-800 font-medium">{skill.name}</span>
            {showLevel && (
              <select
                value={skill.level}
                onChange={e => updateLevel(skill.name, e.target.value)}
                className="text-xs text-blue-600 bg-transparent border-none outline-none ml-1 cursor-pointer"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Expert</option>
              </select>
            )}
            <button onClick={() => removeSkill(skill.name)} className="text-blue-400 hover:text-blue-700 ml-1 text-xs font-bold">×</button>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Type a skill and press Enter..."
          className="w-full h-12 px-4 border border-[#D4D2D0] rounded focus:outline-none focus:border-indeed-blue focus:ring-2 focus:ring-blue-100 text-sm"
        />
        {focused && filtered.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded shadow-lg mt-1 max-h-48 overflow-y-auto">
            {filtered.map(s => (
              <li
                key={s}
                onMouseDown={() => addSkill(s)}
                className="px-4 py-2 text-sm hover:bg-blue-50 cursor-pointer text-gray-700"
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

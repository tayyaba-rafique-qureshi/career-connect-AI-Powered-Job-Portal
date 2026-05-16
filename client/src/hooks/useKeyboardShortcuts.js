import { useEffect } from 'react'

/**
 * Custom hook for keyboard shortcuts
 * @param {Object} shortcuts - Object mapping key combinations to handlers
 * @example
 * useKeyboardShortcuts({
 *   'ctrl+s': handleSave,
 *   'ctrl+f': () => searchRef.current?.focus(),
 *   'ctrl+r': fetchData,
 *   'escape': closeModal
 * })
 */
const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Build key combination string
      let combo = ''
      if (e.ctrlKey || e.metaKey) combo += 'ctrl+'
      if (e.shiftKey) combo += 'shift+'
      if (e.altKey) combo += 'alt+'
      combo += e.key.toLowerCase()

      // Check if this combination has a handler
      const handler = shortcuts[combo]
      if (handler) {
        e.preventDefault()
        handler(e)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [shortcuts])
}

export default useKeyboardShortcuts

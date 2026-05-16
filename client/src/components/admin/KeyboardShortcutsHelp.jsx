import { useState } from 'react'
import { Keyboard, X } from 'lucide-react'

const KeyboardShortcutsHelp = ({ shortcuts }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-[#2557a7] hover:bg-[#1a4480] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-40"
        title="Keyboard Shortcuts (Press ?)"
      >
        <Keyboard className="h-5 w-5" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
            <div className="relative bg-white dark:bg-[#1f1f1f] rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Keyboard Shortcuts</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{shortcut.description}</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Press <kbd className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">?</kbd> to toggle this help
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default KeyboardShortcutsHelp

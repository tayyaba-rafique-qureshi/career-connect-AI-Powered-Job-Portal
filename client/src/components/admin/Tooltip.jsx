import { HelpCircle } from 'lucide-react'

const Tooltip = ({ text, position = 'top' }) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  }

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900 dark:border-b-gray-700',
    left: 'left-full top-1/2 transform -translate-y-1/2 -ml-1 border-4 border-transparent border-l-gray-900 dark:border-l-gray-700',
    right: 'right-full top-1/2 transform -translate-y-1/2 -mr-1 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700'
  }

  return (
    <div className="group relative inline-block ml-2">
      <HelpCircle className="h-4 w-4 text-gray-400 dark:text-gray-500 cursor-help hover:text-[#2557a7] dark:hover:text-white transition-colors" />
      <div className={`absolute ${positionClasses[position]} hidden group-hover:block w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg z-50 pointer-events-none`}>
        <div className={`absolute ${arrowClasses[position]}`}></div>
        {text}
      </div>
    </div>
  )
}

export default Tooltip

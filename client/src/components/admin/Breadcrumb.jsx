import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const Breadcrumb = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm mb-6" aria-label="Breadcrumb">
      <Link
        to="/dashboard/admin"
        className="flex items-center text-gray-500 dark:text-gray-400 hover:text-[#2557a7] dark:hover:text-white transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-600 mx-1" />
          {item.href ? (
            <Link
              to={item.href}
              className="text-gray-500 dark:text-gray-400 hover:text-[#2557a7] dark:hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 dark:text-white font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}

export default Breadcrumb

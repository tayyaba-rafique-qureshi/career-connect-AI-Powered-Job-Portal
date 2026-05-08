const StatusBadge = ({ status, type = 'default' }) => {
  const getStyles = () => {
    if (type === 'job') {
      switch (status) {
        case 'active':
          return 'bg-green-100 text-green-800 border-green-200'
        case 'draft':
          return 'bg-gray-100 text-gray-800 border-gray-200'
        case 'closed':
          return 'bg-red-100 text-red-800 border-red-200'
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }

    if (type === 'application') {
      switch (status) {
        case 'pending':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'reviewed':
          return 'bg-blue-100 text-blue-800 border-blue-200'
        case 'shortlisted':
          return 'bg-purple-100 text-purple-800 border-purple-200'
        case 'rejected':
          return 'bg-red-100 text-red-800 border-red-200'
        case 'hired':
          return 'bg-green-100 text-green-800 border-green-200'
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }

    if (type === 'user') {
      switch (status) {
        case 'active':
          return 'bg-green-100 text-green-800 border-green-200'
        case 'banned':
          return 'bg-red-100 text-red-800 border-red-200'
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }

    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyles()}`}>
      {status}
    </span>
  )
}

export default StatusBadge

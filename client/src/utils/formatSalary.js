/**
 * Format salary range for display based on salary type.
 * @param {number|null} min
 * @param {number|null} max
 * @param {string} type - 'yearly' | 'monthly' | 'stipend'
 * @returns {string|null}
 */
export function formatSalary(min, max, type = 'yearly') {
  if (!min && !max) return null

  const fmt = (n) => `Rs ${Number(n).toLocaleString()}`

  let range = ''
  if (min && max) {
    range = `${fmt(min)} – ${fmt(max)}`
  } else if (min) {
    range = `From ${fmt(min)}`
  } else {
    range = `Up to ${fmt(max)}`
  }

  switch (type) {
    case 'monthly':
      return `${range} /month`
    case 'stipend':
      return `${range} /month (stipend)`
    case 'yearly':
    default:
      return `${range} /year`
  }
}

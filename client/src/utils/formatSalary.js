/**
 * Format salary range for display based on salary type.
 * @param {number|null} min
 * @param {number|null} max
 * @param {string} type - 'yearly' | 'monthly' | 'stipend'
<<<<<<< HEAD
 * @returns {string|null}
 */
export function formatSalary(min, max, type = 'yearly') {
  if (!min && !max) return null
=======
 * @returns {string}
 */
export function formatSalary(min, max, type = 'yearly') {
  if (!min && !max) return ''
>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3

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

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @template T
 * @param {T[]} array - Array to shuffle
 * @returns {T[]} - Shuffled array
 */
export function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Format seconds to time string
 * @param {number} seconds - Total seconds
 * @returns {string} - Formatted time (e.g., "2m 30s")
 */
export function formatTime(seconds) {
  const mins = Math.floor(Math.abs(seconds) / 60)
  const secs = Math.abs(seconds) % 60
  if (mins === 0) return `${secs}s`
  if (secs === 0) return `${mins}m`
  return `${mins}m ${secs}s`
}

/**
 * Check if device is in landscape orientation
 * @returns {boolean}
 */
export function isLandscape() {
  if (typeof window === 'undefined') return true
  return window.innerWidth > window.innerHeight
}

/**
 * Check if running on mobile device
 * @returns {boolean}
 */
export function isMobile() {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= 1024
}

/**
 * Debounce function
 * @template T
 * @param {T} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {T} - Debounced function
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Get random rotation for card stack effect
 * @returns {number} - Random rotation in degrees (-3 to 3)
 */
export function getRandomRotation() {
  const choices = [-3, -2, -1, 0, 1, 2, 3]
  const weights = [20, 60, 80, 20, 80, 60, 20]
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  let random = Math.random() * totalWeight
  for (let i = 0; i < choices.length; i++) {
    random -= weights[i]
    if (random <= 0) return choices[i]
  }
  return 0
}

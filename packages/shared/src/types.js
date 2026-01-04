/**
 * @typedef {Object} Box
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} description_short
 * @property {string} tagline
 * @property {string[]} topics
 * @property {string} price_id
 * @property {string} color
 * @property {string[]} color_palette
 * @property {string} path
 * @property {number} display_order
 * @property {boolean} is_sample
 * @property {string} full_box_id
 * @property {boolean} is_active
 * @property {string} collection_series_id
 */

/**
 * @typedef {Object} Card
 * @property {string} id
 * @property {string} box_id
 * @property {string} pile_id
 * @property {string} text
 * @property {string} image_path
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} Pile
 * @property {string} id
 * @property {string} slug
 * @property {string} name
 * @property {string} image_path
 * @property {string} collection_series_id
 * @property {number} display_order
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} Price
 * @property {string} id
 * @property {string} label
 * @property {string} payment_info
 * @property {string} hook_info
 * @property {number} amount
 * @property {number} promo_amount
 * @property {boolean} promo_enabled
 * @property {string} currency
 * @property {number} membership_days
 * @property {string} stripe_price_id
 * @property {number} display_order
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} CollectionSeries
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {number} display_order
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} AppConfig
 * @property {string} id
 * @property {string} slug
 * @property {string} name
 * @property {string} title
 * @property {string} tagline
 * @property {string} promise
 * @property {string} header_text
 * @property {string} body_text
 * @property {string} footer_text
 * @property {string} admin_emails
 */

/**
 * @typedef {'idle' | 'countdown' | 'waiting' | 'countup' | 'finished'} TimerState
 */

/**
 * @typedef {'black' | 'white'} CardColor
 */

export const TIMER_STATES = {
  IDLE: 'idle',
  COUNTDOWN: 'countdown',
  WAITING: 'waiting',
  COUNTUP: 'countup',
  FINISHED: 'finished'
}

export const CARD_COLORS = {
  BLACK: 'black',
  WHITE: 'white'
}

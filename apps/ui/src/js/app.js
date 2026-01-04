import Framework7 from 'framework7/bundle'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pwdwemakaozxmutwswqa.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_K-L2v83yXtTeHkSWtFX_ag_ZbjbDq8p'
export const supabase = createClient(supabaseUrl, supabaseKey)

// App State
const state = {
  user: null,
  appConfig: null,
  boxes: [],
  piles: [],
  cards: [],
  selectedBoxIds: [],
  gameStarted: false,
  // Game state
  blackDeck: [],
  whiteDeck: [],
  currentBlack: null,
  currentWhite: null,
  blackFlipped: false,
  whiteFlipped: false,
  // Timer state
  timerState: 'idle', // idle, countdown, waiting, countup, finished
  timerSeconds: 15,
  timerInterval: null
}

// Routes
import { routes } from './routes.js'

// Initialize Framework7 App
const app = new Framework7({
  el: '#app',
  name: 'AS WE ALL ARE',
  theme: 'ios',
  colors: {
    primary: '#007AFF'
  },
  routes: routes,
  view: {
    iosDynamicNavbar: true,
    browserHistory: true,
    browserHistorySeparator: ''
  },
  on: {
    init: async function() {
      // Check auth state
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        state.user = session.user
      }
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        state.user = session?.user || null
        // Refresh current view if needed
        if (app.views.main) {
          const currentRoute = app.views.main.router.currentRoute
          if (currentRoute && currentRoute.path === '/profile/') {
            app.views.main.router.refreshPage()
          }
        }
      })
      
      // Load initial data
      await loadAppConfig()
      await loadBoxes()
      await loadPiles()
    }
  }
})

// Data loading functions
async function loadAppConfig() {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('*')
      .eq('slug', 'asweallare')
      .single()
    
    if (data) {
      state.appConfig = data
    }
  } catch (err) {
    console.error('Error loading app config:', err)
  }
}

async function loadBoxes() {
  try {
    const { data, error } = await supabase
      .from('boxes')
      .select('*, prices(*), collection_series(*)')
      .eq('is_active', true)
      .order('display_order')
    
    if (data) {
      state.boxes = data
    }
  } catch (err) {
    console.error('Error loading boxes:', err)
  }
}

async function loadPiles() {
  try {
    const { data, error } = await supabase
      .from('piles')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
    
    if (data) {
      state.piles = data
    }
  } catch (err) {
    console.error('Error loading piles:', err)
  }
}

async function loadCardsForBoxes(boxIds) {
  if (!boxIds || boxIds.length === 0) return []
  
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*, piles(*)')
      .in('box_id', boxIds)
      .eq('is_active', true)
    
    if (data) {
      // Add color based on pile
      const cardsWithColor = data.map(card => ({
        ...card,
        color: card.piles?.slug === 'black' ? 'black' : 'white'
      }))
      state.cards = cardsWithColor
      return cardsWithColor
    }
  } catch (err) {
    console.error('Error loading cards:', err)
  }
  return []
}

// Game functions
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function startGame(boxIds) {
  state.selectedBoxIds = boxIds
  state.gameStarted = true
  
  // Load cards and setup decks
  loadCardsForBoxes(boxIds).then(cards => {
    const blackCards = cards.filter(c => c.color === 'black')
    const whiteCards = cards.filter(c => c.color === 'white')
    
    state.blackDeck = shuffleArray(blackCards)
    state.whiteDeck = shuffleArray(whiteCards)
    state.currentBlack = null
    state.currentWhite = null
    state.blackFlipped = false
    state.whiteFlipped = false
    resetTimer()
  })
}

function drawCard(pile) {
  if (pile === 'black' && state.blackDeck.length > 0 && !state.currentBlack) {
    const [card, ...rest] = state.blackDeck
    state.currentBlack = card
    state.blackDeck = rest
    state.blackFlipped = true
    checkBothFlipped()
  } else if (pile === 'white' && state.whiteDeck.length > 0 && !state.currentWhite) {
    const [card, ...rest] = state.whiteDeck
    state.currentWhite = card
    state.whiteDeck = rest
    state.whiteFlipped = true
    checkBothFlipped()
  }
}

function flipCard(pile) {
  if (pile === 'black' && state.currentBlack) {
    state.blackFlipped = !state.blackFlipped
  } else if (pile === 'white' && state.currentWhite) {
    state.whiteFlipped = !state.whiteFlipped
  }
}

function checkBothFlipped() {
  if (state.blackFlipped && state.whiteFlipped && state.timerState === 'idle') {
    // Start countdown
    startCountdown()
  }
}

function resetTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval)
    state.timerInterval = null
  }
  state.timerState = 'idle'
  state.timerSeconds = 15
}

function startCountdown() {
  state.timerState = 'countdown'
  state.timerSeconds = 15
  
  state.timerInterval = setInterval(() => {
    state.timerSeconds--
    if (state.timerSeconds <= 0) {
      clearInterval(state.timerInterval)
      state.timerState = 'waiting'
    }
    // Trigger UI update
    document.dispatchEvent(new CustomEvent('timer-update'))
  }, 1000)
}

function startSharing() {
  if (state.timerState === 'countdown') {
    clearInterval(state.timerInterval)
  }
  state.timerState = 'countup'
  state.timerSeconds = 0
  
  state.timerInterval = setInterval(() => {
    state.timerSeconds++
    document.dispatchEvent(new CustomEvent('timer-update'))
  }, 1000)
}

function finishSharing() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval)
    state.timerInterval = null
  }
  state.timerState = 'finished'
  document.dispatchEvent(new CustomEvent('timer-update'))
}

function resetRound() {
  state.currentBlack = null
  state.currentWhite = null
  state.blackFlipped = false
  state.whiteFlipped = false
  resetTimer()
}

function reshufflePile(pile) {
  if (pile === 'black') {
    const allBlack = state.cards.filter(c => c.color === 'black')
    state.blackDeck = shuffleArray(allBlack)
    state.currentBlack = null
    state.blackFlipped = false
  } else {
    const allWhite = state.cards.filter(c => c.color === 'white')
    state.whiteDeck = shuffleArray(allWhite)
    state.currentWhite = null
    state.whiteFlipped = false
  }
}

function endGame() {
  state.gameStarted = false
  state.selectedBoxIds = []
  resetTimer()
}

// Auth functions
async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  })
  if (error) {
    console.error('Google sign in error:', error)
    app.dialog.alert('Sign in failed. Please try again.', 'Error')
  }
}

async function signInWithMagicLink(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin
    }
  })
  if (error) {
    console.error('Magic link error:', error)
    app.dialog.alert('Failed to send magic link. Please try again.', 'Error')
    return false
  }
  return true
}

async function signOut() {
  await supabase.auth.signOut()
  state.user = null
}

// Export for use in pages
export {
  app,
  state,
  loadAppConfig,
  loadBoxes,
  loadPiles,
  loadCardsForBoxes,
  startGame,
  drawCard,
  flipCard,
  resetRound,
  reshufflePile,
  endGame,
  startSharing,
  finishSharing,
  signInWithGoogle,
  signInWithMagicLink,
  signOut
}

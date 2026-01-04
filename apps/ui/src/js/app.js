import Framework7 from 'framework7/bundle'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase - ONLY for authentication
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pwdwemakaozxmutwswqa.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_K-L2v83yXtTeHkSWtFX_ag_ZbjbDq8p'
export const supabase = createClient(supabaseUrl, supabaseKey)

// API Base URL - Use local backend for data
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// App State
window.appState = {
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
  timerState: 'idle',
  timerSeconds: 15,
  timerInterval: null
}

const state = window.appState

// ============================================================================
// DATA LOADING FUNCTIONS - Use local API endpoints
// ============================================================================

async function loadAppConfig() {
  try {
    const response = await fetch(`${API_BASE}/app-config?slug=asweallare`)
    const data = await response.json()
    
    if (data) {
      state.appConfig = data
      console.log('App config loaded:', data)
    }
  } catch (err) {
    console.error('Error loading app config:', err)
  }
}

async function loadBoxes() {
  try {
    const response = await fetch(`${API_BASE}/boxes`)
    const data = await response.json()
    
    if (data && Array.isArray(data)) {
      state.boxes = data
      console.log('Boxes loaded:', data.length, 'boxes')
    }
  } catch (err) {
    console.error('Error loading boxes:', err)
  }
}

async function loadPiles() {
  try {
    const response = await fetch(`${API_BASE}/piles`)
    const data = await response.json()
    
    if (data && Array.isArray(data)) {
      state.piles = data
      console.log('Piles loaded:', data.length, 'piles')
    }
  } catch (err) {
    console.error('Error loading piles:', err)
  }
}

async function loadCardsForBoxes(boxIds) {
  if (!boxIds || boxIds.length === 0) return []
  
  try {
    // Fetch cards for each box
    const allCards = []
    
    for (const boxId of boxIds) {
      const response = await fetch(`${API_BASE}/boxes/${boxId}/cards`)
      const data = await response.json()
      
      if (data && Array.isArray(data)) {
        allCards.push(...data)
      }
    }
    
    // Add color based on pile
    const cardsWithColor = allCards.map(card => ({
      ...card,
      color: card.pile?.slug === 'black' || card.pile_id?.includes('black') ? 'black' : 'white'
    }))
    
    state.cards = cardsWithColor
    console.log('Cards loaded:', cardsWithColor.length, 'cards')
    return cardsWithColor
  } catch (err) {
    console.error('Error loading cards:', err)
  }
  return []
}

// ============================================================================
// GAME FUNCTIONS
// ============================================================================

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
    
    console.log('Game started with', blackCards.length, 'black cards and', whiteCards.length, 'white cards')
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

// ============================================================================
// AUTH FUNCTIONS - Use Supabase for authentication only
// ============================================================================

async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  })
  if (error) {
    console.error('Google sign in error:', error)
    if (window.f7App) {
      window.f7App.dialog.alert('Sign in failed. Please try again.', 'Error')
    }
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
    if (window.f7App) {
      window.f7App.dialog.alert('Failed to send magic link. Please try again.', 'Error')
    }
    return false
  }
  return true
}

async function signOut() {
  await supabase.auth.signOut()
  state.user = null
}

// ============================================================================
// EXPORT FUNCTIONS TO WINDOW
// ============================================================================

window.appFunctions = {
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

// ============================================================================
// APP INITIALIZATION
// ============================================================================

async function initApp() {
  console.log('Initializing AS WE ALL ARE UI App...')
  console.log('API Base:', API_BASE)
  
  // Check auth state (Supabase)
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      state.user = session.user
      console.log('User logged in:', session.user.email)
    }
  } catch (err) {
    console.log('Auth check skipped (expected in local mode)')
  }
  
  // Listen for auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    state.user = session?.user || null
  })
  
  // Load initial data from LOCAL API
  console.log('Loading data from local API...')
  await Promise.all([
    loadAppConfig(),
    loadBoxes(),
    loadPiles()
  ])
  
  console.log('Data loaded. Boxes:', state.boxes.length)
  
  // Initialize Framework7
  const app = new Framework7({
    el: '#app',
    name: 'AS WE ALL ARE',
    theme: 'ios',
    colors: {
      primary: '#007AFF'
    },
    routes: [
      {
        path: '/',
        url: '/pages/home.html'
      },
      {
        path: '/experience/',
        url: '/pages/experience.html'
      },
      {
        path: '/game/',
        url: '/pages/game.html'
      },
      {
        path: '/store/',
        url: '/pages/store.html'
      },
      {
        path: '/profile/',
        url: '/pages/profile.html'
      }
    ]
  })
  
  window.f7App = app
  console.log('Framework7 initialized')
}

// Wait for DOM and init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp)
} else {
  initApp()
}

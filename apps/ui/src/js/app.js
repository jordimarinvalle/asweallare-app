import Framework7 from 'framework7/bundle'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase - ONLY for authentication
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pwdwemakaozxmutwswqa.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_K-L2v83yXtTeHkSWtFX_ag_ZbjbDq8p'
export const supabase = createClient(supabaseUrl, supabaseKey)

// API Base URL - Use environment variable, fallback to relative path for same-origin
const API_BASE = import.meta.env.VITE_API_URL || '/api'

console.log('[UI App] API_BASE:', API_BASE)

// App State
window.appState = {
  user: null,
  appConfig: null,
  boxes: [],
  piles: [],
  cards: [],
  hasAllAccess: false,
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
// DATA LOADING FUNCTIONS
// ============================================================================

async function loadAppConfig() {
  try {
    const response = await fetch(`${API_BASE}/app-config?slug=asweallare`)
    const data = await response.json()
    if (data) {
      state.appConfig = data
      console.log('App config loaded:', data.name || 'default')
    }
  } catch (err) {
    console.error('Error loading app config:', err)
  }
}

async function loadBoxes() {
  try {
    const response = await fetch(`${API_BASE}/boxes`)
    const data = await response.json()
    if (data && data.boxes) {
      state.boxes = data.boxes
      state.hasAllAccess = data.hasAllAccess || false
      console.log('Boxes loaded:', data.boxes.length, 'boxes')
    }
  } catch (err) {
    console.error('Error loading boxes:', err)
  }
}

async function loadCardsForBoxes(boxIds) {
  if (!boxIds || boxIds.length === 0) return []
  
  try {
    const boxIdsParam = boxIds.join(',')
    const response = await fetch(`${API_BASE}/cards?box_ids=${boxIdsParam}`)
    const data = await response.json()
    if (data && data.cards) {
      state.cards = data.cards
      console.log('Cards loaded:', data.cards.length, 'cards')
      return data.cards
    }
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
    
    // Store pile images for card backs
    if (blackCards.length > 0 && blackCards[0].pile_image) {
      state.blackPileImage = blackCards[0].pile_image
    }
    if (whiteCards.length > 0 && whiteCards[0].pile_image) {
      state.whitePileImage = whiteCards[0].pile_image
    }
    
    console.log('Game started with', blackCards.length, 'black cards and', whiteCards.length, 'white cards')
    
    // Dispatch event to notify game page that cards are ready
    document.dispatchEvent(new CustomEvent('cards-loaded', { 
      detail: { 
        blackCount: blackCards.length, 
        whiteCount: whiteCards.length,
        blackPileImage: state.blackPileImage,
        whitePileImage: state.whitePileImage
      } 
    }))
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
// AUTH FUNCTIONS
// ============================================================================

async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  })
  if (error) {
    console.error('Google sign in error:', error)
    window.f7App?.dialog.alert('Sign in failed. Please try again.', 'Error')
  }
}

async function signInWithMagicLink(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin }
  })
  if (error) {
    console.error('Magic link error:', error)
    window.f7App?.dialog.alert('Failed to send magic link. Please try again.', 'Error')
    return false
  }
  return true
}

async function signOut() {
  await supabase.auth.signOut()
  state.user = null
}

// ============================================================================
// PAGE INITIALIZATION FUNCTIONS
// ============================================================================

function initExperiencePage(page) {
  console.log('[Experience] Initializing page')
  let selectedBoxIds = []
  
  // Use DOM queries - page.el is the page element
  const pageEl = page.el || page.$el?.[0] || document.querySelector('.page[data-name="experience"]')
  if (!pageEl) {
    console.log('[Experience] Page element not found')
    return
  }
  
  const container = pageEl.querySelector('#deck-scroll')
  const playBtn = pageEl.querySelector('#play-btn')
  
  if (!container) {
    console.log('[Experience] Container not found')
    return
  }
  
  function renderDecks() {
    console.log('[Experience] Rendering decks, boxes:', state.boxes.length)
    
    if (state.boxes.length === 0) {
      container.innerHTML = '<div style="padding: 40px; text-align: center; color: #8E8E93;">No decks available.</div>'
      return
    }
    
    let html = ''
    state.boxes.forEach(box => {
      const isLocked = !box.is_sample && !box.hasAccess && !state.hasAllAccess
      const heroImage = box.path ? `/collections/${box.path}/hero.jpg` : '/assets/logo-asweallare.png'
      
      html += `
        <div class="deck-tile" data-box-id="${box.id}" data-locked="${isLocked}" data-sample="${box.is_sample}" style="border: 2px solid transparent;">
          <img src="${heroImage}" alt="${box.name}" onerror="this.src='/assets/logo-asweallare.png'" style="opacity: ${isLocked ? '0.6' : '1'};" />
          ${box.is_sample ? '<span class="sample-badge">SAMPLE</span>' : ''}
          ${isLocked ? '<div class="lock-overlay"><i class="f7-icons" style="color: white; font-size: 32px;">lock_fill</i></div>' : ''}
          <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 12px; background: linear-gradient(transparent, rgba(0,0,0,0.7));">
            <p style="color: white; font-weight: 600; font-size: 14px; margin: 0;">${box.name}</p>
            ${box.tagline ? `<p style="color: rgba(255,255,255,0.7); font-size: 11px; margin: 4px 0 0 0;">${box.tagline}</p>` : ''}
          </div>
        </div>
      `
    })
    
    container.innerHTML = html
    
    // Add click handlers
    container.querySelectorAll('.deck-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        const boxId = tile.dataset.boxId
        const isLocked = tile.dataset.locked === 'true'
        
        if (isLocked) {
          window.f7App?.dialog.alert('This deck is locked. Purchase it in the Store to unlock.', 'Locked')
          return
        }
        
        const idx = selectedBoxIds.indexOf(boxId)
        if (idx > -1) {
          selectedBoxIds.splice(idx, 1)
          tile.style.borderColor = 'transparent'
          tile.style.transform = 'scale(1)'
        } else {
          selectedBoxIds.push(boxId)
          tile.style.borderColor = '#007AFF'
          tile.style.transform = 'scale(0.95)'
        }
        
        if (playBtn) {
          playBtn.classList.toggle('disabled', selectedBoxIds.length === 0)
        }
        console.log('[Experience] Selected:', selectedBoxIds)
      })
    })
  }
  
  // Play button
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (selectedBoxIds.length > 0) {
        console.log('[Experience] Starting game with:', selectedBoxIds)
        startGame(selectedBoxIds)
        window.f7App?.views.main.router.navigate('/game/')
      }
    })
  }
  
  // Render decks
  renderDecks()
}

function initGamePage(page) {
  console.log('[Game] Initializing page')
  
  const pageEl = page.el || page.$el?.[0] || document.querySelector('.page[data-name="game"]')
  if (!pageEl) {
    console.log('[Game] Page element not found')
    return
  }
  
  const rotateScreen = pageEl.querySelector('#rotate-screen')
  const gameContent = pageEl.querySelector('#game-content')
  const blackPile = pageEl.querySelector('#black-pile')
  const whitePile = pageEl.querySelector('#white-pile')
  const blackFront = pageEl.querySelector('#black-front')
  const whiteFront = pageEl.querySelector('#white-front')
  const blackCount = pageEl.querySelector('#black-count')
  const whiteCount = pageEl.querySelector('#white-count')
  const timerDisplay = pageEl.querySelector('#timer-display')
  const resetBtn = pageEl.querySelector('#reset-btn')
  const exitBtn = pageEl.querySelector('#exit-btn')
  const reshuffleBlack = pageEl.querySelector('#reshuffle-black')
  const reshuffleWhite = pageEl.querySelector('#reshuffle-white')
  
  function checkOrientation() {
    const isLandscape = window.innerWidth > window.innerHeight
    if (rotateScreen) rotateScreen.style.display = isLandscape ? 'none' : 'flex'
    if (gameContent) gameContent.style.display = isLandscape ? 'flex' : 'none'
  }
  
  function updateTimerDisplay() {
    if (!timerDisplay) return
    timerDisplay.className = `timer-display ${state.timerState}`
    
    switch (state.timerState) {
      case 'idle':
        timerDisplay.textContent = 'Tap on the cards to flip them and start your turn'
        break
      case 'countdown':
        timerDisplay.textContent = `Ready? Tap to begin sharing (${state.timerSeconds}s)`
        break
      case 'waiting':
        timerDisplay.textContent = 'Ready when you are — tap to start sharing'
        break
      case 'countup':
        const mins = Math.floor(state.timerSeconds / 60)
        let msg = "Tap when you're done sharing"
        if (mins >= 3) msg = "Tap when done. 3+ minutes — wrapping up?"
        else if (mins >= 2) msg = "Tap when done. 2 minutes — you're in the flow."
        else if (mins >= 1) msg = "Tap when done. 1 minute — keep sharing."
        timerDisplay.textContent = msg
        break
      case 'finished':
        const finMins = Math.floor(state.timerSeconds / 60)
        const finSecs = state.timerSeconds % 60
        let timeStr = finSecs + 's'
        if (finMins > 0) timeStr = `${finMins}m ${finSecs}s`
        timerDisplay.textContent = `Done (${timeStr}) — tap to reset for next turn`
        break
    }
  }
  
  function updateCards() {
    if (blackPile && blackFront) {
      if (state.currentBlack) {
        blackPile.classList.toggle('flipped', state.blackFlipped)
        const imgPath = state.currentBlack.image_path || ''
        // Don't add / prefix if it's already a full URL
        const imgSrc = imgPath.startsWith('http://') || imgPath.startsWith('https://') 
          ? imgPath 
          : (imgPath.startsWith('/') ? imgPath : '/' + imgPath)
        blackFront.innerHTML = `<img src="${imgSrc}" alt="Card" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" onerror="this.style.display='none'" />`
      } else {
        blackPile.classList.remove('flipped')
      }
    }
    
    if (whitePile && whiteFront) {
      if (state.currentWhite) {
        whitePile.classList.toggle('flipped', state.whiteFlipped)
        const imgPath = state.currentWhite.image_path || ''
        // Don't add / prefix if it's already a full URL
        const imgSrc = imgPath.startsWith('http://') || imgPath.startsWith('https://') 
          ? imgPath 
          : (imgPath.startsWith('/') ? imgPath : '/' + imgPath)
        whiteFront.innerHTML = `<img src="${imgSrc}" alt="Card" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" onerror="this.style.display='none'" />`
      } else {
        whitePile.classList.remove('flipped')
      }
    }
    
    if (blackCount) blackCount.textContent = `${state.blackDeck.length} cards left`
    if (whiteCount) whiteCount.textContent = `${state.whiteDeck.length} cards left`
  }
  
  // Event listeners
  window.addEventListener('resize', checkOrientation)
  window.addEventListener('orientationchange', checkOrientation)
  document.addEventListener('timer-update', updateTimerDisplay)
  
  blackPile?.addEventListener('click', () => {
    if (!state.currentBlack && state.blackDeck.length > 0) drawCard('black')
    else if (state.currentBlack) flipCard('black')
    updateCards()
  })
  
  whitePile?.addEventListener('click', () => {
    if (!state.currentWhite && state.whiteDeck.length > 0) drawCard('white')
    else if (state.currentWhite) flipCard('white')
    updateCards()
  })
  
  timerDisplay?.addEventListener('click', () => {
    if (state.timerState === 'countdown' || state.timerState === 'waiting') startSharing()
    else if (state.timerState === 'countup') finishSharing()
    else if (state.timerState === 'finished') { resetRound(); updateCards() }
    updateTimerDisplay()
  })
  
  resetBtn?.addEventListener('click', () => { resetRound(); updateCards(); updateTimerDisplay() })
  exitBtn?.addEventListener('click', () => { endGame(); window.f7App?.views.main.router.navigate('/experience/') })
  reshuffleBlack?.addEventListener('click', e => { e.stopPropagation(); reshufflePile('black'); updateCards() })
  reshuffleWhite?.addEventListener('click', e => { e.stopPropagation(); reshufflePile('white'); updateCards() })
  
  checkOrientation()
  updateCards()
  updateTimerDisplay()
}

// Export functions
window.appFunctions = {
  loadAppConfig, loadBoxes, loadCardsForBoxes,
  startGame, drawCard, flipCard, resetRound, reshufflePile, endGame,
  startSharing, finishSharing, signInWithGoogle, signInWithMagicLink, signOut
}

// ============================================================================
// APP INITIALIZATION
// ============================================================================

async function initApp() {
  console.log('===========================================')
  console.log('Initializing AS WE ALL ARE UI App...')
  console.log('API Base:', API_BASE)
  console.log('===========================================')
  
  // Check auth state
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      state.user = session.user
      console.log('User logged in:', session.user.email)
    }
  } catch (err) {
    console.log('Auth check skipped')
  }
  
  supabase.auth.onAuthStateChange((event, session) => {
    state.user = session?.user || null
  })
  
  // Load data
  console.log('Loading data from local API...')
  await Promise.all([loadAppConfig(), loadBoxes()])
  console.log('Data loaded. Boxes:', state.boxes.length)
  
  // Initialize Framework7 with page callbacks
  const app = new Framework7({
    el: '#app',
    name: 'AS WE ALL ARE',
    theme: 'ios',
    colors: { primary: '#007AFF' },
    routes: [
      { path: '/', url: '/pages/home.html' },
      { path: '/experience/', url: '/pages/experience.html', on: { pageInit: initExperiencePage } },
      { path: '/game/', url: '/pages/game.html', on: { pageInit: initGamePage } },
      { path: '/store/', url: '/pages/store.html' },
      { path: '/profile/', url: '/pages/profile.html' }
    ]
  })
  
  window.f7App = app
  console.log('Framework7 initialized')
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp)
} else {
  initApp()
}

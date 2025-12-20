'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Bell, Save, Clock, LogOut, Plus, Edit, Trash2, CreditCard, Info, RotateCw, Smartphone } from 'lucide-react'

// ============================================================================
// CARD PILE COMPONENT - Isolated state for reliable single-click draws
// ============================================================================
function CardPile({ 
  color, 
  deck,
  setDeck,
  allCards,
  currentCard,
  setCurrentCard
}) {
  const [isFlipped, setIsFlipped] = useState(false)
  
  // Generate random rotations for stack effect (like messy pile)
  const getRandomRotation = () => {
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
  
  // Store random rotations for stack cards (regenerate on mount/reset)
  const [stackRotations, setStackRotations] = useState(() => [
    getRandomRotation(),
    getRandomRotation(),
    getRandomRotation()
  ])
  
  // Regenerate rotations when deck resets
  useEffect(() => {
    if (!currentCard && deck.length > 0) {
      setStackRotations([
        getRandomRotation(),
        getRandomRotation(),
        getRandomRotation()
      ])
    }
  }, [currentCard, deck.length])
  
  // Determine styling based on color
  const isBlack = color === 'black'
  const cardBackImage = isBlack ? '/black-card-back.png' : '/white-card-back.png'
  const bgColor = isBlack ? 'bg-black' : 'bg-white'
  const textColor = isBlack ? 'text-white' : 'text-gray-900'
  const hintColor = isBlack ? 'text-gray-400' : 'text-gray-600'
  const borderColor = 'border-gray-400' // Light gray but noticeable
  
  // Handle click on the pile/card area
  const handleClick = () => {
    if (!currentCard && deck.length > 0) {
      // Draw a card AND flip it immediately (show content)
      const [card, ...remaining] = deck
      setCurrentCard(card)
      setDeck(remaining)
      setIsFlipped(true) // Immediately show content
    } else if (currentCard) {
      // Toggle flip state (allow flipping back and forth)
      setIsFlipped(prev => !prev)
    }
  }
  
  // Reset flip state when current card changes to null (Next Player)
  useEffect(() => {
    if (!currentCard) {
      setIsFlipped(false)
    }
  }, [currentCard])
  
  // Handle reshuffle click
  const handleReshuffle = (e) => {
    e.stopPropagation()
    setCurrentCard(null)
    setIsFlipped(false)
    // Shuffle all cards of this color
    const colorCards = allCards.filter(c => c.color === color)
    const shuffled = [...colorCards].sort(() => Math.random() - 0.5)
    setDeck(shuffled)
  }
  
  // Empty deck and no current card
  if (deck.length === 0 && !currentCard) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div 
          className="cursor-pointer"
          style={{ width: '252px', height: '352px' }}
        >
          <div className={`w-full h-full bg-gray-100 border-2 ${borderColor} rounded-lg flex items-center justify-center`}>
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg font-serif mb-4">No Cards Left</p>
              <Button onClick={handleReshuffle} size="sm" variant="outline">
                <RotateCw className="w-4 h-4 mr-2" />
                Reshuffle
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        onClick={handleClick}
        className="cursor-pointer"
        style={{ 
          width: '252px', 
          height: '352px',
          perspective: '1000px'
        }}
      >
        {!currentCard ? (
          // Show the pile (clickable to draw) - with "Tap to draw" text
          <div className="relative w-full h-full">
            <div 
              className={`w-full h-full ${bgColor} border-2 ${borderColor} rounded-lg flex items-center justify-center hover:shadow-xl transition-shadow overflow-hidden relative`}
            >
              <img 
                src={cardBackImage} 
                alt="Card pile" 
                className="absolute inset-0 w-full h-full object-cover rounded-lg" 
              />
              {/* "Tap to draw" overlay on pile */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`${isBlack ? 'text-white' : 'text-gray-700'} text-sm font-sans opacity-80 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm`}>
                  Tap to draw
                </span>
              </div>
            </div>
            {/* Stack effect - offset cards behind */}
            <div className={`absolute top-1 left-1 w-full h-full ${bgColor} border-2 ${borderColor} rounded-lg -z-10 opacity-70`}></div>
            <div className={`absolute top-2 left-2 w-full h-full ${bgColor} border-2 ${borderColor} rounded-lg -z-20 opacity-40`}></div>
          </div>
        ) : (
          // Show the drawn card with flip animation
          <div 
            className="w-full h-full transition-transform duration-500"
            style={{ 
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
          >
            {/* Card Back */}
            <div 
              className="absolute inset-0 w-full h-full"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className={`w-full h-full ${bgColor} border-2 ${borderColor} rounded-lg flex items-center justify-center overflow-hidden relative`}>
                <img 
                  src={cardBackImage} 
                  alt="Card back" 
                  className="absolute inset-0 w-full h-full object-cover rounded-lg" 
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`${isBlack ? 'text-white' : 'text-gray-700'} text-sm font-sans opacity-80 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm`}>
                    Tap to flip
                  </span>
                </div>
              </div>
            </div>
            
            {/* Card Front */}
            <div 
              className="absolute inset-0 w-full h-full"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              <div className={`w-full h-full ${bgColor} border-2 ${borderColor} rounded-lg flex items-center justify-center p-8`}>
                <div className="text-center">
                  <h2 className={`${textColor} text-2xl font-serif mb-4`}>
                    {currentCard?.title || ''}
                  </h2>
                  {currentCard?.hint && (
                    <p className={`${hintColor} text-sm italic`}>
                      {currentCard.hint}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// GAME TIMER COMPONENT - Handles bell sounds at 1, 2, 3 minutes
// ============================================================================
function GameTimer({ isRunning, setIsRunning, seconds, setSeconds }) {
  const [bellsPlayed, setBellsPlayed] = useState({ one: false, two: false, three: false })
  const audioContextRef = useRef(null)
  
  // Format time display
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    
    if (mins === 0) {
      return `${secs}s`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Play bell sound using Web Audio API
  const playBell = useCallback((count) => {
    try {
      // Create audio context on first use
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      
      const audioContext = audioContextRef.current
      
      // Resume if suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }
      
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          // Create a more realistic bell sound
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          // Boxing bell: bright metallic sound
          oscillator.frequency.value = 1200
          oscillator.type = 'sine'
          
          // Start loud and decay
          const now = audioContext.currentTime
          gainNode.gain.setValueAtTime(0.4, now)
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6)
          
          oscillator.start(now)
          oscillator.stop(now + 0.6)
        }, i * 400) // 400ms between dings
      }
    } catch (error) {
      console.error('Error playing bell:', error)
    }
  }, [])
  
  // Timer effect
  useEffect(() => {
    let interval
    
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prev => {
          const newValue = prev + 1
          
          // Bell at 1 minute (60 seconds)
          if (newValue === 60 && !bellsPlayed.one) {
            playBell(1)
            setBellsPlayed(p => ({ ...p, one: true }))
          }
          
          // Bell at 2 minutes (120 seconds)
          if (newValue === 120 && !bellsPlayed.two) {
            playBell(2)
            setBellsPlayed(p => ({ ...p, two: true }))
          }
          
          // Bell at 3 minutes (180 seconds)
          if (newValue === 180 && !bellsPlayed.three) {
            playBell(3)
            setBellsPlayed(p => ({ ...p, three: true }))
          }
          
          return newValue
        })
      }, 1000)
    }
    
    return () => clearInterval(interval)
  }, [isRunning, bellsPlayed, playBell, setSeconds])
  
  // Reset bells when timer is reset
  useEffect(() => {
    if (seconds === 0) {
      setBellsPlayed({ one: false, two: false, three: false })
    }
  }, [seconds])
  
  // Start timer
  const startTimer = () => {
    setIsRunning(true)
    setSeconds(0)
    setBellsPlayed({ one: false, two: false, three: false })
  }
  
  // Stop timer
  const stopTimer = () => {
    setIsRunning(false)
  }
  
  return (
    <Button 
      onClick={isRunning ? stopTimer : startTimer} 
      size="lg" 
      variant="outline" 
      className="border-red-600 text-red-600 hover:bg-red-50 w-[180px] font-mono"
    >
      {isRunning ? (
        <>
          <Clock className="w-5 h-5 mr-2" />
          {formatTime(seconds)}
        </>
      ) : (
        <>
          <Clock className="w-5 h-5 mr-2" />
          Start Sharing
        </>
      )}
    </Button>
  )
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState('signin')
  const [authOpen, setAuthOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
  const [isLandscape, setIsLandscape] = useState(true)
  
  // Game state - separated for black and white cards
  const [allCards, setAllCards] = useState([])
  const [blackDeck, setBlackDeck] = useState([])
  const [whiteDeck, setWhiteDeck] = useState([])
  const [currentBlack, setCurrentBlack] = useState(null)
  const [currentWhite, setCurrentWhite] = useState(null)
  
  // Timer state (lifted to parent for Next Player reset)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  
  // Other screens
  const [view, setView] = useState('game')
  const [savedDraws, setSavedDraws] = useState([])
  const [paymentType, setPaymentType] = useState('onetime')
  const [couponCode, setCouponCode] = useState('')
  
  // Admin
  const [adminCards, setAdminCards] = useState([])
  const [editingCard, setEditingCard] = useState(null)
  const [cardForm, setCardForm] = useState({
    color: 'black',
    title: '',
    hint: '',
    language: 'en',
    isDemo: false,
    isActive: true
  })
  
  const supabase = createClient()
  
  // Check orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight)
    }
    
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)
    
    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])
  
  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const response = await fetch('/api/auth/user')
        const data = await response.json()
        setUser(data.user)
      }
      setLoading(false)
    }
    
    checkAuth()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const response = await fetch('/api/auth/user')
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    })
    
    return () => subscription.unsubscribe()
  }, [])
  
  // Shuffle deck helper
  const shuffleDeck = (deck) => {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Load cards and initialize decks
  const loadCards = async () => {
    const response = await fetch('/api/cards')
    const data = await response.json()
    
    if (data.cards) {
      const normalizedCards = data.cards.map(card => ({
        id: card.id,
        color: card.color,
        title: card.title,
        hint: card.hint,
        language: card.language,
        isDemo: card.isdemo,
        isActive: card.isactive,
        createdAt: card.createdat
      }))
      
      setAllCards(normalizedCards)
      const blacks = normalizedCards.filter(c => c.color === 'black')
      const whites = normalizedCards.filter(c => c.color === 'white')
      setBlackDeck(shuffleDeck([...blacks]))
      setWhiteDeck(shuffleDeck([...whites]))
    }
  }
  
  useEffect(() => {
    loadCards()
  }, [user])
  
  // Next Player - reset for next turn
  const handleNextPlayer = () => {
    setCurrentBlack(null)
    setCurrentWhite(null)
    setTimerRunning(false)
    setTimerSeconds(0)
  }
  
  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthError('')
    setAuthSuccess('')
    
    try {
      const response = await fetch(`/api/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (data.error) {
        if (data.error.includes('Email not confirmed')) {
          setAuthError('Please check your email and click the confirmation link before signing in.')
        } else if (data.error.includes('Invalid login credentials')) {
          setAuthError('Invalid email or password. Please try again.')
        } else {
          setAuthError(data.error)
        }
      } else {
        if (authMode === 'signup') {
          setAuthSuccess('Success! Please check your email to confirm your account before signing in.')
          setEmail('')
          setPassword('')
          setTimeout(() => {
            setAuthMode('signin')
            setAuthSuccess('')
          }, 3000)
        } else {
          setAuthOpen(false)
          setEmail('')
          setPassword('')
        }
      }
    } catch (error) {
      setAuthError('Authentication failed. Please try again.')
    }
  }
  
  const handleGoogleSignIn = async () => {
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      setAuthError('Google sign-in failed')
    }
  }
  
  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    setUser(null)
    setView('game')
  }
  
  const saveDraw = async () => {
    if (!user) {
      setAuthOpen(true)
      return
    }
    
    if (!currentBlack || !currentWhite) {
      alert('Please draw both cards before saving')
      return
    }
    
    await fetch('/api/draws/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blackCardId: currentBlack.id,
        whiteCardId: currentWhite.id,
        blackCardTitle: currentBlack.title,
        whiteCardTitle: currentWhite.title
      })
    })
    
    alert('Draw saved!')
  }
  
  const loadSavedDraws = async () => {
    const response = await fetch('/api/draws')
    const data = await response.json()
    if (data.draws) {
      const normalizedDraws = data.draws.map(draw => ({
        id: draw.id,
        userId: draw.userid,
        userEmail: draw.useremail,
        blackCardId: draw.blackcardid,
        whiteCardId: draw.whitecardid,
        blackCardTitle: draw.blackcardtitle,
        whiteCardTitle: draw.whitecardtitle,
        timestamp: draw.timestamp
      }))
      setSavedDraws(normalizedDraws)
    }
  }
  
  const handlePayment = async () => {
    const response = await fetch('/api/payment/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentType, couponCode })
    })
    
    const data = await response.json()
    if (data.url) {
      window.location.href = data.url
    }
  }
  
  const loadAdminCards = async () => {
    const response = await fetch('/api/admin/cards')
    const data = await response.json()
    if (data.cards) {
      const normalizedCards = data.cards.map(card => ({
        id: card.id,
        color: card.color,
        title: card.title,
        hint: card.hint,
        language: card.language,
        isDemo: card.isdemo,
        isActive: card.isactive,
        createdAt: card.createdat
      }))
      setAdminCards(normalizedCards)
    }
  }
  
  const handleSaveCard = async () => {
    if (editingCard) {
      await fetch(`/api/admin/cards/${editingCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardForm)
      })
    } else {
      await fetch('/api/admin/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardForm)
      })
    }
    
    setEditingCard(null)
    setCardForm({
      color: 'black',
      title: '',
      hint: '',
      language: 'en',
      isDemo: false,
      isActive: true
    })
    loadAdminCards()
    loadCards()
  }
  
  const handleDeleteCard = async (cardId) => {
    if (confirm('Are you sure you want to delete this card?')) {
      await fetch(`/api/admin/cards/${cardId}`, {
        method: 'DELETE'
      })
      loadAdminCards()
      loadCards()
    }
  }
  
  useEffect(() => {
    if (view === 'draws') {
      loadSavedDraws()
    } else if (view === 'admin') {
      loadAdminCards()
    }
  }, [view])
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-2xl font-serif text-gray-900">Loading...</div>
      </div>
    )
  }
  
  // Landscape orientation check
  if (!isLandscape && view === 'game') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="text-center max-w-md">
          <Smartphone className="w-24 h-24 mx-auto mb-6 text-red-600 animate-pulse" />
          <h2 className="text-3xl font-serif text-gray-900 mb-4">Rotate Your Device</h2>
          <p className="text-lg text-gray-600 mb-6">
            AS WE ALL ARE is best experienced in landscape mode. Please rotate your phone horizontally.
          </p>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <RotateCw className="w-5 h-5" />
            <span>Turn your device sideways</span>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="font-brand text-gray-900">AS WE ALL ARE</h1>
            
            <div className="flex items-center gap-4">
              {!user ? (
                <Button onClick={() => setAuthOpen(true)} variant="outline">
                  Sign In
                </Button>
              ) : (
                <>
                  <Button onClick={() => setView('game')} variant={view === 'game' ? 'default' : 'ghost'}>
                    Play
                  </Button>
                  <Button onClick={() => setView('draws')} variant={view === 'draws' ? 'default' : 'ghost'}>
                    My Draws
                  </Button>
                  {!user.hasPaidAccess && (
                    <Button onClick={() => setView('payment')} variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Unlock Full Access
                    </Button>
                  )}
                  <Button onClick={() => setView('admin')} variant={view === 'admin' ? 'default' : 'ghost'}>
                    Admin
                  </Button>
                  <Button onClick={handleSignOut} variant="ghost" size="sm">
                    <LogOut className="w-4 h-4" />
                  </Button>
                  <div className="text-sm text-gray-600">{user.email}</div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main content */}
      <div className="pt-16">
        {view === 'game' && (
          <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-8">
            {(!user || !user.hasPaidAccess) && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md text-center">
                <Info className="w-5 h-5 text-red-600 inline-block mr-2" />
                <span className="text-sm text-red-900">
                  {!user ? 'Sign in and unlock full access to all cards' : 'You are viewing demo cards. Unlock full access to continue.'}
                </span>
              </div>
            )}
            
            {/* Card piles */}
            <div className="flex flex-row gap-8 sm:gap-12 mb-12">
              {/* Black card pile */}
              <CardPile 
                color="black"
                deck={blackDeck}
                setDeck={setBlackDeck}
                allCards={allCards}
                currentCard={currentBlack}
                setCurrentCard={setCurrentBlack}
              />
              
              {/* White card pile */}
              <CardPile 
                color="white"
                deck={whiteDeck}
                setDeck={setWhiteDeck}
                allCards={allCards}
                currentCard={currentWhite}
                setCurrentCard={setCurrentWhite}
              />
            </div>
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Button onClick={handleNextPlayer} size="lg" className="bg-gray-900 hover:bg-gray-800 text-white">
                Next Player
              </Button>
              
              <GameTimer 
                isRunning={timerRunning}
                setIsRunning={setTimerRunning}
                seconds={timerSeconds}
                setSeconds={setTimerSeconds}
              />
              
              <Button onClick={saveDraw} size="lg" variant="outline">
                <Save className="w-5 h-5 mr-2" />
                Save This Draw
              </Button>
            </div>
          </div>
        )}
        
        {view === 'draws' && (
          <div className="max-w-4xl mx-auto p-8">
            <h2 className="text-3xl font-serif text-gray-900 mb-8">My Saved Draws</h2>
            
            {savedDraws.length === 0 ? (
              <p className="text-gray-600">No saved draws yet. Start playing and save your favorite moments!</p>
            ) : (
              <div className="space-y-6">
                {savedDraws.map(draw => (
                  <Card key={draw.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-sm text-gray-500">
                        {new Date(draw.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <div className="text-xs text-gray-500 mb-2">Black Card</div>
                        <div className="font-serif text-lg">{draw.blackCardTitle}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-2">White Card</div>
                        <div className="font-serif text-lg">{draw.whiteCardTitle}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
        
        {view === 'payment' && (
          <div className="max-w-2xl mx-auto p-8">
            <h2 className="text-3xl font-serif text-gray-900 mb-4">Unlock Full Access</h2>
            <p className="text-gray-600 mb-8">Get access to all conversation cards and save unlimited draws.</p>
            
            <Card className="p-6 mb-6">
              <Tabs value={paymentType} onValueChange={setPaymentType}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="onetime">One-Time</TabsTrigger>
                  <TabsTrigger value="subscription">Subscription</TabsTrigger>
                </TabsList>
                
                <TabsContent value="onetime" className="mt-6">
                  <div className="text-center">
                    <div className="text-4xl font-serif text-gray-900 mb-2">$20</div>
                    <div className="text-gray-600 mb-6">One-time unlock</div>
                    <ul className="text-left space-y-2 mb-6">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-red-600 rounded-full mr-3"></span>
                        <span>Lifetime access to all cards</span>
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-red-600 rounded-full mr-3"></span>
                        <span>Save unlimited draws</span>
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-red-600 rounded-full mr-3"></span>
                        <span>No recurring charges</span>
                      </li>
                    </ul>
                  </div>
                </TabsContent>
                
                <TabsContent value="subscription" className="mt-6">
                  <div className="text-center">
                    <div className="text-4xl font-serif text-gray-900 mb-2">$3</div>
                    <div className="text-gray-600 mb-6">Every 3 months</div>
                    <ul className="text-left space-y-2 mb-6">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-red-600 rounded-full mr-3"></span>
                        <span>Access to all cards</span>
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-red-600 rounded-full mr-3"></span>
                        <span>Save unlimited draws</span>
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-red-600 rounded-full mr-3"></span>
                        <span>Cancel anytime</span>
                      </li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
            
            <div className="mb-6">
              <Label htmlFor="coupon">Coupon Code (Optional)</Label>
              <Input
                id="coupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                className="mt-2"
              />
            </div>
            
            <Button onClick={handlePayment} size="lg" className="w-full bg-red-600 hover:bg-red-700 text-white">
              Continue to Payment
            </Button>
          </div>
        )}
        
        {view === 'admin' && (
          <div className="max-w-6xl mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-serif text-gray-900">Card Management</h2>
              <Button onClick={() => {
                setEditingCard(null)
                setCardForm({
                  color: 'black',
                  title: '',
                  hint: '',
                  language: 'en',
                  isDemo: false,
                  isActive: true
                })
              }} className="bg-red-600 hover:bg-red-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Card
              </Button>
            </div>
            
            <Card className="p-6 mb-8">
              <h3 className="text-xl font-serif mb-4">{editingCard ? 'Edit Card' : 'New Card'}</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Color</Label>
                  <select
                    value={cardForm.color}
                    onChange={(e) => setCardForm({ ...cardForm, color: e.target.value })}
                    className="w-full mt-2 p-2 border border-gray-300 rounded-md"
                  >
                    <option value="black">Black</option>
                    <option value="white">White</option>
                  </select>
                </div>
                
                <div>
                  <Label>Language</Label>
                  <Input
                    value={cardForm.language}
                    onChange={(e) => setCardForm({ ...cardForm, language: e.target.value })}
                    placeholder="en"
                    className="mt-2"
                  />
                </div>
                
                <div className="sm:col-span-2">
                  <Label>Title</Label>
                  <Input
                    value={cardForm.title}
                    onChange={(e) => setCardForm({ ...cardForm, title: e.target.value })}
                    placeholder="Card title"
                    className="mt-2"
                  />
                </div>
                
                <div className="sm:col-span-2">
                  <Label>Hint (Optional)</Label>
                  <Input
                    value={cardForm.hint}
                    onChange={(e) => setCardForm({ ...cardForm, hint: e.target.value })}
                    placeholder="Optional hint text"
                    className="mt-2"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="isDemo">Demo Card</Label>
                  <Switch
                    id="isDemo"
                    checked={cardForm.isDemo}
                    onCheckedChange={(checked) => setCardForm({ ...cardForm, isDemo: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Active</Label>
                  <Switch
                    id="isActive"
                    checked={cardForm.isActive}
                    onCheckedChange={(checked) => setCardForm({ ...cardForm, isActive: checked })}
                  />
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <Button onClick={handleSaveCard} className="bg-red-600 hover:bg-red-700 text-white">
                  {editingCard ? 'Update Card' : 'Create Card'}
                </Button>
                {editingCard && (
                  <Button onClick={() => {
                    setEditingCard(null)
                    setCardForm({
                      color: 'black',
                      title: '',
                      hint: '',
                      language: 'en',
                      isDemo: false,
                      isActive: true
                    })
                  }} variant="outline">
                    Cancel
                  </Button>
                )}
              </div>
            </Card>
            
            <div className="space-y-4">
              {adminCards.map(card => (
                <Card key={card.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded ${card.color === 'black' ? 'bg-black text-white' : 'bg-white text-black border'}`}>
                          {card.color}
                        </span>
                        {card.isDemo && (
                          <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">Demo</span>
                        )}
                        {!card.isActive && (
                          <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">Inactive</span>
                        )}
                      </div>
                      <div className="font-serif text-lg mb-1">{card.title}</div>
                      {card.hint && <div className="text-sm text-gray-600 italic">{card.hint}</div>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setEditingCard(card)
                          setCardForm({
                            color: card.color,
                            title: card.title,
                            hint: card.hint || '',
                            language: card.language,
                            isDemo: card.isDemo,
                            isActive: card.isActive
                          })
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteCard(card.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Auth Dialog */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </DialogTitle>
            <DialogDescription>
              {authMode === 'signin' ? 'Sign in to save your draws and unlock full access' : 'Create an account to start saving your conversation moments'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAuth} className="space-y-4">
            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                {authError}
              </div>
            )}
            
            {authSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
                {authSuccess}
              </div>
            )}
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-2"
              />
            </div>
            
            <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white">
              {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
            </Button>
            
            <Separator />
            
            <Button type="button" onClick={handleGoogleSignIn} variant="outline" className="w-full">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
            
            <div className="text-center text-sm">
              {authMode === 'signin' ? (
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className="text-red-600 hover:underline"
                >
                  Don't have an account? Sign up
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className="text-red-600 hover:underline"
                >
                  Already have an account? Sign in
                </button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

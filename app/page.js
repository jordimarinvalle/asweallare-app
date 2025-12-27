'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { LogOut, Plus, Edit, Trash2, CreditCard, RotateCw, Smartphone, Lock, Check, Package, Play, ShoppingBag, Sparkles, Crown, Receipt, XCircle, Image, Menu, AlertTriangle, RefreshCcw, BookOpen, Upload, Download, X, RotateCcw, Home, User, Settings, ExternalLink, Calendar, Mail, ChevronUp, ChevronDown, GripVertical } from 'lucide-react'
import { BookletViewer, GuideSelector, GuideSelectorCompact, BOOKLET_IMAGES, BOOKLET_30SECS } from '@/components/game/BookletViewer'
import { RotateDeviceScreen } from '@/components/game/RotateDeviceScreen'
import { ThemeProvider, useTheme, BottomNav, useBottomNavPadding, SocialIcon, SocialPlatformSelector, SOCIAL_PLATFORMS, getPlatformConfig, ReorderableList } from '@/components/theme'

// Simple Markdown to HTML converter (no external dependencies)
function SimpleMarkdown({ children }) {
  if (!children) return null
  
  const processMarkdown = (text) => {
    let html = text
    
    // Escape HTML first
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    
    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold text-gray-900 mt-6 mb-3">$1</h3>')
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-semibold text-gray-900 mt-6 mb-4">$1</h2>')
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-gray-900 mt-6 mb-4">$1</h1>')
    
    // Bold and italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
    
    // Blockquotes
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-4 border-red-500 pl-4 my-4 italic text-gray-700">$1</blockquote>')
    
    // Ordered lists
    html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 mb-2"><span class="font-medium">$1.</span> $2</li>')
    
    // Unordered lists
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4 mb-1 list-disc list-inside">$1</li>')
    
    // Wrap consecutive list items
    html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="my-4">$&</ul>')
    
    // Paragraphs (lines that aren't already wrapped)
    const lines = html.split('\n')
    html = lines.map(line => {
      if (line.trim() === '') return ''
      if (line.startsWith('<')) return line
      return `<p class="mb-3 text-gray-600">${line}</p>`
    }).join('\n')
    
    return html
  }
  
  return (
    <div 
      className="prose prose-gray max-w-none"
      dangerouslySetInnerHTML={{ __html: processMarkdown(children) }}
    />
  )
}

// ============================================================================
// CARD PILE COMPONENT - Isolated state for reliable single-click draws
// ============================================================================
function CardPile({ 
  color, 
  deck,
  setDeck,
  allCards,
  currentCard,
  setCurrentCard,
  isFlipped,
  setIsFlipped,
  disabled = false
}) {
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
  const borderColor = 'border-gray-400'
  
  // Handle click on the pile/card area
  const handleClick = () => {
    // Don't do anything if disabled
    if (disabled) return
    
    if (!currentCard && deck.length > 0) {
      // Draw a card from the deck
      const [card, ...remaining] = deck
      setCurrentCard(card)
      setDeck(remaining)
      setIsFlipped(true)
    } else if (currentCard) {
      // Toggle flip
      setIsFlipped(prev => !prev)
    }
  }
  
  // Handle reshuffle click
  const handleReshuffle = (e) => {
    e.stopPropagation()
    setCurrentCard(null)
    setIsFlipped(false)
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
        className={disabled ? "" : "cursor-pointer"}
        style={{ 
          width: '252px', 
          height: '352px',
          perspective: '1000px'
        }}
      >
        {!currentCard ? (
          // Show the pile (clickable to draw) - with "Tap to draw" text
          <div className="relative w-full h-full">
            {/* Stack cards behind - with random rotations for messy look */}
            <div 
              className={`absolute w-full h-full ${bgColor} border-2 ${borderColor} rounded-lg -z-30 opacity-30`}
              style={{ 
                transform: `rotate(${stackRotations[2]}deg) translate(4px, 4px)`,
              }}
            ></div>
            <div 
              className={`absolute w-full h-full ${bgColor} border-2 ${borderColor} rounded-lg -z-20 opacity-50`}
              style={{ 
                transform: `rotate(${stackRotations[1]}deg) translate(2px, 2px)`,
              }}
            ></div>
            <div 
              className={`absolute w-full h-full ${bgColor} border-2 ${borderColor} rounded-lg -z-10 opacity-70`}
              style={{ 
                transform: `rotate(${stackRotations[0]}deg) translate(1px, 1px)`,
              }}
            ></div>
            {/* Top card */}
            <div 
              className={`w-full h-full ${bgColor} border-2 ${borderColor} rounded-lg flex items-center justify-center hover:shadow-xl transition-shadow overflow-hidden relative`}
            >
              <img 
                src={cardBackImage} 
                alt="Card pile" 
                className="absolute inset-0 w-full h-full object-cover rounded-lg" 
              />
              {/* "Tap" overlay on pile - only show if not disabled */}
              {!disabled && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex items-center gap-2 text-white text-sm font-medium px-5 py-2.5 rounded-full" style={{ backgroundColor: '#D12128' }}>
                    <RefreshCcw className="w-4 h-4" />
                    Tap
                  </span>
                </div>
              )}
            </div>
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
                {/* "Tap" overlay - only show if not disabled */}
                {!disabled && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex items-center gap-2 text-white text-sm font-medium px-5 py-2.5 rounded-full" style={{ backgroundColor: '#D12128' }}>
                      <RefreshCcw className="w-4 h-4" />
                      Tap
                    </span>
                  </div>
                )}
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
              {currentCard?.imagePath ? (
                // Show image if available
                <div className={`w-full h-full border-2 ${borderColor} rounded-lg overflow-hidden`}>
                  <img 
                    src={currentCard.imagePath.startsWith('/') ? currentCard.imagePath : `/${currentCard.imagePath}`}
                    alt={currentCard.title || 'Card'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : currentCard?.image_path ? (
                // Also check image_path field
                <div className={`w-full h-full border-2 ${borderColor} rounded-lg overflow-hidden`}>
                  <img 
                    src={currentCard.image_path.startsWith('/') ? currentCard.image_path : `/${currentCard.image_path}`}
                    alt={currentCard.title || currentCard.text || 'Card'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                // Fallback to text
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
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// GAME STATUS TEXT - Displays above cards
// ============================================================================
function GameStatusText({ 
  timerState, 
  seconds, 
  onTimerClick,
  onReset,
  disabled = false
}) {
  // Use a key that changes with seconds to trigger CSS animation
  const pulseKey = timerState === 'countdown' && !disabled ? `pulse-${seconds}` : 'no-pulse'
  
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(Math.abs(totalSeconds) / 60)
    const secs = Math.abs(totalSeconds) % 60
    if (mins === 0) return `${secs}s`
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Reset icon button component
  const ResetButton = ({ className = "" }) => (
    <button
      onClick={onReset}
      className={`p-3 rounded-lg transition-colors hover:bg-red-50 ${className}`}
      style={{ color: '#D12128' }}
      title="Reset"
    >
      <RotateCw className="w-5 h-5" />
    </button>
  )
  
  // Render based on timer state
  switch (timerState) {
    case 'idle':
      return (
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center">
            <span className="inline-block px-6 py-3 bg-white border border-white text-gray-500 rounded-lg font-medium">
              Tap on the cards to flip them and start your turn
            </span>
            <ResetButton className="absolute -right-12" />
          </div>
        </div>
      )
    
    case 'countdown':
      return (
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center">
            <button
              onClick={onTimerClick}
              disabled={disabled}
              key={pulseKey}
              className={`min-w-[320px] px-6 py-3 bg-white rounded-lg ${
                disabled 
                  ? 'border border-gray-300 text-gray-400 cursor-not-allowed font-medium' 
                  : 'hover:bg-red-50 countdown-pulse'
              }`}
              style={disabled ? {} : { 
                borderColor: '#D12128', 
                color: '#D12128',
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            >
              {disabled ? `Flip a card first (${seconds}s)` : `Ready? Tap to begin sharing (${seconds}s)`}
            </button>
            <ResetButton className="absolute -right-12" />
          </div>
        </div>
      )
    
    case 'waiting':
      return (
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center">
            <button
              onClick={onTimerClick}
              disabled={disabled}
              className={`min-w-[320px] px-6 py-3 rounded-lg font-medium transition-colors ${
                disabled 
                  ? 'bg-white border border-gray-300 text-gray-400 cursor-not-allowed' 
                  : 'text-white hover:opacity-90'
              }`}
              style={disabled ? {} : { 
                backgroundColor: '#D12128', 
                borderColor: '#D12128',
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            >
              {disabled ? 'Flip a card first' : 'Ready when you are — tap to start sharing'}
            </button>
            <ResetButton className="absolute -right-12" />
          </div>
        </div>
      )
    
    case 'countup':
      // Determine message and style based on elapsed time
      const minutes = Math.floor(seconds / 60)
      let countupMessage = "Tap here when you're done sharing"
      let isThreeMinutes = false
      
      if (minutes >= 3) {
        countupMessage = "Tap when done. 3 minutes — wrapping up? No rush, but stay mindful."
        isThreeMinutes = true
      } else if (minutes >= 2) {
        countupMessage = "Tap when done. 2 minutes — you're in the flow."
      } else if (minutes >= 1) {
        countupMessage = "Tap when done. 1 minute — keep sharing."
      }
      
      return (
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center">
            <button
              onClick={onTimerClick}
              className={`min-w-[380px] px-6 py-3 border rounded-lg font-medium transition-colors ${
                isThreeMinutes 
                  ? 'bg-black text-white border-black hover:bg-gray-800' 
                  : 'bg-white text-gray-700 border-gray-400 hover:bg-gray-50'
              }`}
            >
              {countupMessage}
            </button>
            <ResetButton className="absolute -right-12" />
          </div>
        </div>
      )
    
    case 'finished':
      // Format time nicely for the finished message
      const finishedMins = Math.floor(seconds / 60)
      const finishedSecs = seconds % 60
      let timeDisplay = ""
      if (finishedMins > 0 && finishedSecs > 0) {
        timeDisplay = `${finishedMins} min ${finishedSecs} sec`
      } else if (finishedMins > 0) {
        timeDisplay = `${finishedMins} min`
      } else {
        timeDisplay = `${finishedSecs} sec`
      }
      
      return (
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center">
            <button
              onClick={onReset}
              className="max-w-[500px] px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-left"
            >
              Sharing complete (⏱️ {timeDisplay}) — now it's time for the circle to respond. Click here to reset for the next turn.
            </button>
            <ResetButton className="absolute -right-12" />
          </div>
        </div>
      )
    
    default:
      return null
  }
}

// ============================================================================
// GAME TIMER HOOK - Manages timer state and sounds
// ============================================================================
function useGameTimer(bothCardsFlipped) {
  const [timerState, setTimerState] = useState('idle')
  const [seconds, setSeconds] = useState(15)
  const audioContextRef = useRef(null)
  
  // Play bell/beep sound
  const playBell = useCallback((count) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      const audioContext = audioContextRef.current
      if (audioContext.state === 'suspended') audioContext.resume()
      
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          oscillator.frequency.value = 1200
          oscillator.type = 'sine'
          const now = audioContext.currentTime
          gainNode.gain.setValueAtTime(0.4, now)
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6)
          oscillator.start(now)
          oscillator.stop(now + 0.6)
        }, i * 400)
      }
    } catch (error) {
      console.error('Error playing bell:', error)
    }
  }, [])
  
  // Play warning sound (different tone for countdown end)
  const playWarning = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      const audioContext = audioContextRef.current
      if (audioContext.state === 'suspended') audioContext.resume()
      
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.frequency.value = 600
      oscillator.type = 'sine'
      const now = audioContext.currentTime
      gainNode.gain.setValueAtTime(0.5, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.0)
      oscillator.start(now)
      oscillator.stop(now + 1.0)
    } catch (error) {
      console.error('Error playing warning:', error)
    }
  }, [])
  
  // Auto-start countdown when both cards are flipped (only once)
  useEffect(() => {
    if (bothCardsFlipped && timerState === 'idle') {
      setTimerState('countdown')
      setSeconds(15)
    }
  }, [bothCardsFlipped, timerState])
  
  // Note: Timer does NOT reset when cards are flipped back
  // It only resets when Reset button is clicked (handled by parent component)
  
  // Countdown timer effect
  useEffect(() => {
    let interval
    if (timerState === 'countdown') {
      interval = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            playWarning()
            setTimerState('waiting')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerState, playWarning])
  
  // Countup timer effect
  useEffect(() => {
    let interval
    if (timerState === 'countup') {
      interval = setInterval(() => {
        setSeconds(prev => {
          const newValue = prev + 1
          if (newValue === 60) playBell(1)
          if (newValue === 180) playBell(3)
          return newValue
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerState, playBell])
  
  // Handle timer click
  const handleTimerClick = () => {
    if (timerState === 'countdown' || timerState === 'waiting') {
      // Can start during countdown (early) or after countdown ends
      setTimerState('countup')
      setSeconds(0)
    } else if (timerState === 'countup') {
      setTimerState('finished')
    }
  }
  
  // Reset timer to initial state
  const resetTimer = () => {
    setTimerState('idle')
    setSeconds(15)
  }
  
  return {
    timerState,
    seconds,
    handleTimerClick,
    resetTimer
  }
}

// ============================================================================
// GAME PLAY VIEW COMPONENT - Main game area with cards and timer
// ============================================================================
function GamePlayView({
  blackDeck, setBlackDeck,
  whiteDeck, setWhiteDeck,
  allCards,
  currentBlack, setCurrentBlack,
  currentWhite, setCurrentWhite,
  blackFlipped, setBlackFlipped,
  whiteFlipped, setWhiteFlipped,
  onBackToBoxes,
  onNextPlayer,
  onOpenCompleteGuide,
  onOpenQuickGuide,
  isPlayingSample = false,
  totalCardsInDeck = 0,
  onGoToStore,
  onResetGame
}) {
  // Check if both cards are flipped (showing fronts)
  const bothCardsFlipped = currentBlack && currentWhite && blackFlipped && whiteFlipped
  
  // Check which cards are showing their fronts (after being drawn)
  const blackShowingFront = currentBlack && blackFlipped
  const whiteShowingFront = currentWhite && whiteFlipped
  const blackShowingBack = currentBlack && !blackFlipped
  const whiteShowingBack = currentWhite && !whiteFlipped
  
  // Both cards drawn but both showing backs = disable start button
  const bothShowingBacks = blackShowingBack && whiteShowingBack
  
  // Use the timer hook
  const { timerState, seconds, handleTimerClick, resetTimer } = useGameTimer(bothCardsFlipped)
  
  // Only hide cards during countup or finished states (AFTER clicking start)
  const sharingStarted = timerState === 'countup' || timerState === 'finished'
  
  // Should we show each card?
  // - Always show during idle, countdown, waiting
  // - During countup/finished: hide cards showing backs IF the other card shows front
  const showBlackCard = !sharingStarted || !blackShowingBack || !whiteShowingFront
  const showWhiteCard = !sharingStarted || !whiteShowingBack || !blackShowingFront
  
  // Should the start button be disabled? Only during countdown/waiting if both show backs
  const startButtonDisabled = (timerState === 'countdown' || timerState === 'waiting') && bothShowingBacks
  
  // Handle next player - reset cards AND timer state
  const handleNextPlayerClick = () => {
    onNextPlayer()
    resetTimer()
  }
  
  // Calculate remaining cards for sample mode
  const remainingBlack = blackDeck.length
  const remainingWhite = whiteDeck.length
  const totalRemaining = remainingBlack + remainingWhite
  const cardsPlayed = totalCardsInDeck - totalRemaining - (currentBlack ? 1 : 0) - (currentWhite ? 1 : 0)
  
  // Check if sample is finished (no more cards to draw)
  const isSampleFinished = isPlayingSample && blackDeck.length === 0 && whiteDeck.length === 0 && !currentBlack && !currentWhite
  
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Sample Finished Modal */}
      {isSampleFinished && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-serif text-gray-900 mb-3">
              You've played all the sample cards!
            </h2>
            <p className="text-gray-600 mb-8">
              Enjoyed the experience? Unlock the full game with 108+ conversation cards for deeper, more meaningful connections.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={onGoToStore}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-6 text-lg"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Get the Full Game
              </Button>
              <Button 
                onClick={onResetGame}
                variant="outline"
                className="w-full py-4"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Play Sample Again
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Top buttons row */}
      <div className="absolute top-20 left-4 right-4 flex justify-between items-center">
        <Button variant="ghost" size="sm" onClick={onBackToBoxes}>
          ← Change Boxes
        </Button>
        
        {/* Remaining cards counter for sample */}
        {isPlayingSample && !isSampleFinished && (
          <div className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-sm font-medium">
            {totalRemaining + (currentBlack ? 1 : 0) + (currentWhite ? 1 : 0)} cards left
          </div>
        )}
        
        <GuideSelectorCompact
          onSelectComplete={onOpenCompleteGuide}
          onSelectQuick={onOpenQuickGuide}
        />
      </div>
      
      {/* Status text above cards */}
      <GameStatusText 
        timerState={timerState}
        seconds={seconds}
        onTimerClick={handleTimerClick}
        onReset={handleNextPlayerClick}
        disabled={startButtonDisabled}
      />
      
      {/* Card piles */}
      <div className="flex flex-row gap-8 sm:gap-12 justify-center">
        {showBlackCard && (
          <CardPile 
            color="black"
            deck={blackDeck}
            setDeck={setBlackDeck}
            allCards={allCards}
            currentCard={currentBlack}
            setCurrentCard={setCurrentBlack}
            isFlipped={blackFlipped}
            setIsFlipped={setBlackFlipped}
            disabled={sharingStarted}
          />
        )}
        {showWhiteCard && (
          <CardPile 
            color="white"
            deck={whiteDeck}
            setDeck={setWhiteDeck}
            allCards={allCards}
            currentCard={currentWhite}
            setCurrentCard={setCurrentWhite}
            isFlipped={whiteFlipped}
            setIsFlipped={setWhiteFlipped}
            disabled={sharingStarted}
          />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// BOX SELECTION COMPONENT - Premium Deck Selection UI
// ============================================================================
function BoxSelectionScreen({ 
  boxes, 
  selectedBoxIds, 
  setSelectedBoxIds, 
  onStartPlaying, 
  onGoToStore, 
  user, 
  onOpenCompleteGuide, 
  onOpenQuickGuide,
  collectionSeries = []
}) {
  const [boxMockups, setBoxMockups] = useState({})  // { boxId: { mainImage, secondaryImage, cardMockups } }
  const [selectedSeries, setSelectedSeries] = useState(null)
  const [seeMoreBox, setSeeMoreBox] = useState(null)  // Box for "See more" modal
  const [mockupsLoading, setMockupsLoading] = useState({})
  const [lightboxImage, setLightboxImage] = useState(null)  // { index, images } for lightbox
  const [visibleMockups, setVisibleMockups] = useState(24)  // Pagination for mockups
  
  // See More Modal State
  const [seeMoreMainImage, setSeeMoreMainImage] = useState(null)  // Current main image URL
  const [seeMoreShowSecondary, setSeeMoreShowSecondary] = useState(false)  // Is showing secondary (flipped)
  const [seeMoreIsFlipping, setSeeMoreIsFlipping] = useState(false)  // Animation state
  
  // Load mockups for all visible boxes
  useEffect(() => {
    const loadMockupsForBoxes = async () => {
      const boxesToLoad = boxes.filter(b => !boxMockups[b.id])
      
      for (const box of boxesToLoad) {
        if (mockupsLoading[box.id]) continue
        
        setMockupsLoading(prev => ({ ...prev, [box.id]: true }))
        
        try {
          const res = await fetch(`/api/boxes/${box.id}/mockups`)
          if (res.ok) {
            const data = await res.json()
            setBoxMockups(prev => ({ ...prev, [box.id]: data }))
          }
        } catch (err) {
          console.error('Failed to load mockups for', box.id, err)
        }
        
        setMockupsLoading(prev => ({ ...prev, [box.id]: false }))
      }
    }
    
    if (boxes.length > 0) {
      loadMockupsForBoxes()
    }
  }, [boxes])
  
  const toggleBox = (boxId) => {
    const box = boxes.find(b => b.id === boxId)
    if (!box?.hasAccess) return
    
    setSelectedBoxIds(prev => 
      prev.includes(boxId) 
        ? prev.filter(id => id !== boxId)
        : [...prev, boxId]
    )
  }
  
  // Get unique series from boxes
  const uniqueSeries = [...new Set(boxes.map(b => b.collection_series_id).filter(Boolean))]
  const hasMultipleSeries = uniqueSeries.length > 1
  
  // Auto-select series if only one
  useEffect(() => {
    if (!hasMultipleSeries && uniqueSeries.length === 1 && !selectedSeries) {
      setSelectedSeries(uniqueSeries[0])
    }
  }, [uniqueSeries, hasMultipleSeries, selectedSeries])
  
  // Sample hiding logic using full_box_id
  const ownedFullBoxIds = new Set(
    boxes.filter(b => !b.is_sample && b.hasAccess).map(b => b.id)
  )
  
  const filterAccessibleBoxes = (box) => {
    if (!box.hasAccess) return false
    // Filter by selected series (if any)
    if (selectedSeries && box.collection_series_id !== selectedSeries) return false
    // Hide sample if user owns the related full box
    if (box.is_sample && box.full_box_id && ownedFullBoxIds.has(box.full_box_id)) return false
    return true
  }
  
  const filterLockedBoxes = (box) => {
    if (box.hasAccess) return false
    if (box.is_sample) return false
    if (selectedSeries && box.collection_series_id !== selectedSeries) return false
    return true
  }
  
  const accessibleBoxes = boxes
    .filter(filterAccessibleBoxes)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
  
  const lockedBoxes = boxes
    .filter(filterLockedBoxes)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
  
  const canStart = selectedBoxIds.length > 0
  
  // If user has only one accessible box, auto-select it
  useEffect(() => {
    if (accessibleBoxes.length === 1 && selectedBoxIds.length === 0) {
      setSelectedBoxIds([accessibleBoxes[0].id])
    }
  }, [accessibleBoxes, selectedBoxIds.length, setSelectedBoxIds])
  
  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxImage) return
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightboxImage(null)
      } else if (e.key === 'ArrowLeft' && lightboxImage.images.length > 1) {
        setLightboxImage(prev => ({
          ...prev,
          index: prev.index > 0 ? prev.index - 1 : prev.images.length - 1
        }))
      } else if (e.key === 'ArrowRight' && lightboxImage.images.length > 1) {
        setLightboxImage(prev => ({
          ...prev,
          index: prev.index < prev.images.length - 1 ? prev.index + 1 : 0
        }))
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxImage])
  
  // Open See More modal with hero image as default
  const openSeeMoreModal = (box) => {
    const mockups = boxMockups[box.id]
    const heroImage = mockups?.mainImage?.imagePath || null
    setSeeMoreBox(box)
    setSeeMoreMainImage(heroImage)
    setSeeMoreShowSecondary(false)
    setVisibleMockups(24)
  }
  
  // Close See More modal
  const closeSeeMoreModal = () => {
    setSeeMoreBox(null)
    setSeeMoreMainImage(null)
    setSeeMoreShowSecondary(false)
    setSeeMoreIsFlipping(false)
  }
  
  // Handle flip between hero and secondary
  const handleFlipMainImage = () => {
    const mockups = boxMockups[seeMoreBox?.id]
    if (!mockups?.secondaryImage?.imagePath) return
    
    setSeeMoreIsFlipping(true)
    setTimeout(() => {
      if (seeMoreShowSecondary) {
        setSeeMoreMainImage(mockups.mainImage?.imagePath)
      } else {
        setSeeMoreMainImage(mockups.secondaryImage?.imagePath)
      }
      setSeeMoreShowSecondary(!seeMoreShowSecondary)
      setSeeMoreIsFlipping(false)
    }, 150) // Half of transition duration
  }
  
  // Set a thumbnail as main image
  const setThumbnailAsMain = (imagePath) => {
    setSeeMoreMainImage(imagePath)
    setSeeMoreShowSecondary(false) // Reset flip state when selecting thumbnail
  }
  
  // Keyboard navigation for See More modal
  useEffect(() => {
    if (!seeMoreBox) return
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSeeMoreBox(null)
        setSeeMoreMainImage(null)
        setSeeMoreShowSecondary(false)
        setSeeMoreIsFlipping(false)
      }
    }
    
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [seeMoreBox])
  
  // Series selection UI (only if multiple series)
  if (hasMultipleSeries && !selectedSeries) {
    const seriesData = collectionSeries.length > 0 
      ? collectionSeries 
      : uniqueSeries.map(id => ({ id, name: id, description: '' }))
    
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
          <div className="max-w-2xl w-full text-center">
            <h1 className="text-sm font-medium tracking-[0.3em] text-gray-400 uppercase mb-4">
              AS WE ALL ARE
            </h1>
            <h2 className="text-3xl sm:text-4xl font-serif text-gray-900 mb-6">
              Choose Your Experience
            </h2>
            <p className="text-gray-600 mb-12 max-w-md mx-auto">
              Select a collection to explore its conversation decks.
            </p>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {seriesData.map(series => (
                <button
                  key={series.id}
                  onClick={() => setSelectedSeries(series.id)}
                  className="group p-8 border border-gray-200 rounded-2xl hover:border-gray-400 hover:shadow-lg transition-all text-left"
                >
                  <h3 className="text-xl font-medium text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                    {series.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {series.description || 'Explore this collection'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Get current series name
  const currentSeriesName = collectionSeries.find(s => s.id === selectedSeries)?.name || 'Unscripted Conversations'
  
  return (
    <div className="min-h-screen bg-white">
      {/* Lightbox Modal - Higher z-index than Dialog (z-[100]) */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4">
          <div className="relative max-w-4xl max-h-full w-full">
            {/* Close button - dark gray background for visibility */}
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-10 w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
            >
              <XCircle className="w-7 h-7" />
            </button>
            
            {/* Navigation buttons - dark gray background for visibility */}
            {lightboxImage.images.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxImage(prev => ({
                    ...prev,
                    index: prev.index > 0 ? prev.index - 1 : prev.images.length - 1
                  }))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-white text-2xl font-bold transition-colors shadow-lg"
                >
                  ←
                </button>
                <button
                  onClick={() => setLightboxImage(prev => ({
                    ...prev,
                    index: prev.index < prev.images.length - 1 ? prev.index + 1 : 0
                  }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-white text-2xl font-bold transition-colors shadow-lg"
                >
                  →
                </button>
              </>
            )}
            
            {/* Image */}
            <div className="flex items-center justify-center h-[80vh]">
              <img
                src={lightboxImage.images[lightboxImage.index]?.imagePath}
                alt={`Card ${lightboxImage.index + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </div>
            
            {/* Image counter - dark gray background */}
            {lightboxImage.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                {lightboxImage.index + 1} / {lightboxImage.images.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* See More Modal - BookletViewer Style */}
      {seeMoreBox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          {/* Header - matching BookletViewer */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/50">
            <div className="flex items-center gap-2 text-white">
              <Image className="w-5 h-5" />
              <span className="text-sm font-medium">{seeMoreBox.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white/70 text-sm">
                {boxMockups[seeMoreBox.id]?.cardMockups?.length || 0} cards
              </span>
              <button
                onClick={closeSeeMoreModal}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto p-4 sm:p-6">
            {/* Main Image Viewer - Large Centered Square */}
            <div className="w-full max-w-lg mb-6">
              <div className="relative aspect-square bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
                {seeMoreMainImage ? (
                  <>
                    <img
                      src={seeMoreMainImage}
                      alt="Preview"
                      className={`w-full h-full object-cover transition-all duration-300 ${
                        seeMoreIsFlipping ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                      }`}
                    />
                    
                    {/* Flip Icon - Only show if secondary image exists */}
                    {boxMockups[seeMoreBox.id]?.secondaryImage?.imagePath && (
                      <button
                        onClick={handleFlipMainImage}
                        className="absolute bottom-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-lg transition-colors group"
                        title={seeMoreShowSecondary ? 'Show front' : 'Show back'}
                      >
                        <RotateCcw className={`w-5 h-5 text-white transition-transform group-hover:rotate-180 ${
                          seeMoreShowSecondary ? 'rotate-180' : ''
                        }`} />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hero image</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Hero/Secondary indicator */}
              {boxMockups[seeMoreBox.id]?.secondaryImage?.imagePath && seeMoreMainImage && (
                <div className="text-center mt-2 text-white/50 text-xs">
                  {seeMoreShowSecondary ? 'Back of box' : 'Front of box'} • Click ↻ to flip
                </div>
              )}
            </div>

            {/* Thumbnails Grid - Centered rows of squares */}
            {boxMockups[seeMoreBox.id]?.cardMockups?.length > 0 && (
              <div className="w-full max-w-2xl">
                <div className="text-white/70 text-sm mb-3 text-center font-medium">
                  Card Previews
                </div>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                  {/* Hero thumbnail */}
                  {boxMockups[seeMoreBox.id]?.mainImage?.imagePath && (
                    <button
                      onClick={() => {
                        setSeeMoreMainImage(boxMockups[seeMoreBox.id].mainImage.imagePath)
                        setSeeMoreShowSecondary(false)
                      }}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                        seeMoreMainImage === boxMockups[seeMoreBox.id].mainImage.imagePath && !seeMoreShowSecondary
                          ? 'border-white ring-2 ring-white/30'
                          : 'border-transparent hover:border-white/50'
                      }`}
                    >
                      <img
                        src={boxMockups[seeMoreBox.id].mainImage.imagePath}
                        alt="Box front"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  )}
                  
                  {/* Secondary thumbnail */}
                  {boxMockups[seeMoreBox.id]?.secondaryImage?.imagePath && (
                    <button
                      onClick={() => {
                        setSeeMoreMainImage(boxMockups[seeMoreBox.id].secondaryImage.imagePath)
                        setSeeMoreShowSecondary(true)
                      }}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                        seeMoreMainImage === boxMockups[seeMoreBox.id].secondaryImage.imagePath
                          ? 'border-white ring-2 ring-white/30'
                          : 'border-transparent hover:border-white/50'
                      }`}
                    >
                      <img
                        src={boxMockups[seeMoreBox.id].secondaryImage.imagePath}
                        alt="Box back"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  )}
                  
                  {/* Divider */}
                  {(boxMockups[seeMoreBox.id]?.mainImage?.imagePath || boxMockups[seeMoreBox.id]?.secondaryImage?.imagePath) && (
                    <div className="w-px h-16 sm:h-20 bg-white/20 mx-1" />
                  )}
                  
                  {/* Card mockup thumbnails */}
                  {boxMockups[seeMoreBox.id].cardMockups.slice(0, visibleMockups).map((mockup, idx) => (
                    <button
                      key={mockup.id || idx}
                      onClick={() => setThumbnailAsMain(mockup.imagePath)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                        seeMoreMainImage === mockup.imagePath
                          ? 'border-white ring-2 ring-white/30'
                          : 'border-transparent hover:border-white/50'
                      }`}
                    >
                      <img
                        src={mockup.imagePath}
                        alt={`Card ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
                
                {/* Load More Button */}
                {boxMockups[seeMoreBox.id].cardMockups.length > visibleMockups && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => setVisibleMockups(prev => prev + 24)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-full transition-colors"
                    >
                      Load More ({boxMockups[seeMoreBox.id].cardMockups.length - visibleMockups} more)
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Empty state for no mockups */}
            {!boxMockups[seeMoreBox.id]?.cardMockups?.length && !boxMockups[seeMoreBox.id]?.mainImage?.imagePath && (
              <div className="text-center text-white/50 py-8">
                <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No preview images available for this box</p>
              </div>
            )}
          </div>

          {/* Footer with box info */}
          <div className="bg-black/50 px-4 py-3 text-center">
            <p className="text-white/70 text-sm">
              {seeMoreBox.description_short || seeMoreBox.description || 'Explore the card previews above'}
            </p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {hasMultipleSeries && (
              <button 
                onClick={() => setSelectedSeries(null)}
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                ← All Collections
              </button>
            )}
            <div className="flex-1" />
            <GuideSelector
              onSelectComplete={onOpenCompleteGuide}
              onSelectQuick={onOpenQuickGuide}
              variant="ghost"
              className="text-gray-600"
            />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-sm font-medium tracking-[0.3em] text-gray-400 uppercase mb-3">
            {currentSeriesName}
          </h1>
          <h2 className="text-3xl sm:text-4xl font-serif text-gray-900 mb-4">
            Select Your Decks
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto leading-relaxed">
            AS WE ALL ARE presents a therapeutic conversational card game to know more about each other without the need to ask any question.
          </p>
        </div>
        
        {/* Deck Cards Grid */}
        {accessibleBoxes.length > 0 && (
          <div className="mb-12">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {accessibleBoxes.map(box => {
                const mockup = boxMockups[box.id]
                const isSelected = selectedBoxIds.includes(box.id)
                const heroImage = mockup?.mainImage?.imagePath
                const secondaryImage = mockup?.secondaryImage?.imagePath
                
                return (
                  <div
                    key={box.id}
                    className={`group relative bg-white rounded-2xl border-2 overflow-hidden transition-all duration-300 ${
                      isSelected 
                        ? 'border-red-500 shadow-xl ring-4 ring-red-100' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
                    }`}
                  >
                    {/* Selection Badge */}
                    {isSelected && (
                      <div className="absolute top-4 right-4 z-10 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                    
                    {/* Hero Image */}
                    <div 
                      className="aspect-[4/3] bg-gray-100 cursor-pointer relative overflow-hidden"
                      onClick={() => toggleBox(box.id)}
                    >
                      {heroImage ? (
                        <img 
                          src={heroImage} 
                          alt={box.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: box.color === '#FFFFFF' ? '#F3F4F6' : (box.color || '#F3F4F6') }}
                        >
                          <Package className={`w-16 h-16 ${
                            box.color === '#000000' || box.color === '#D12128' ? 'text-white/50' : 'text-gray-400'
                          }`} />
                        </div>
                      )}
                      
                      {/* Secondary Image Thumbnail */}
                      {secondaryImage && (
                        <div className="absolute bottom-3 right-3 w-16 h-16 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                          <img 
                            src={secondaryImage} 
                            alt={`${box.name} preview`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Free Badge */}
                      {box.is_sample && (
                        <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow">
                          Free Sample
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-5">
                      <div 
                        className="cursor-pointer"
                        onClick={() => toggleBox(box.id)}
                      >
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{box.name}</h3>
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                          {box.description_short || box.tagline || box.description}
                        </p>
                      </div>
                      
                      {/* Topics */}
                      {box.topics && box.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {box.topics.slice(0, 4).map((topic, idx) => (
                            <span 
                              key={idx}
                              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                            >
                              {topic}
                            </span>
                          ))}
                          {box.topics.length > 4 && (
                            <span className="text-xs px-2 py-0.5 text-gray-400">
                              +{box.topics.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <button
                          onClick={() => openSeeMoreModal(box)}
                          className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                        >
                          See more →
                        </button>
                        
                        <button
                          onClick={() => toggleBox(box.id)}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
        {/* Multi-selection hint */}
        {selectedBoxIds.length > 1 && (
          <div className="text-center mb-8">
            <p className="text-sm text-gray-500 bg-gray-50 inline-block px-4 py-2 rounded-full">
              ✨ You can combine multiple decks to shape the experience
            </p>
          </div>
        )}
        
        {/* Start Playing Section */}
        <div className="flex flex-col items-center gap-4">
          <Button 
            size="lg" 
            className={`px-12 py-6 text-lg rounded-full transition-all ${
              canStart 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!canStart}
            onClick={onStartPlaying}
          >
            <Play className="w-5 h-5 mr-2" />
            Start Playing
          </Button>
          
          {!canStart && (
            <p className="text-sm text-gray-400">Select at least one deck to begin</p>
          )}
          
          {lockedBoxes.length > 0 && (
            <button 
              onClick={onGoToStore}
              className="mt-4 text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              <ShoppingBag className="w-4 h-4 inline mr-1" />
              {lockedBoxes.length} more deck{lockedBoxes.length > 1 ? 's' : ''} available
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// STORE COMPONENT - Purchase boxes and subscriptions
// ============================================================================
function StoreScreen({ boxes, plans, onPurchaseBox, onSubscribe, onBack, user, hasAllAccess }) {
  const [selectedTab, setSelectedTab] = useState('boxes')
  const lockedBoxes = boxes.filter(b => !b.hasAccess && !b.is_sample)
  const ownedBoxes = boxes.filter(b => b.hasAccess && !b.is_sample)
  
  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
              ← Back to Game
            </Button>
            <h2 className="text-3xl font-serif text-gray-900">Store</h2>
            <p className="text-gray-600">Unlock new card collections</p>
          </div>
          
          {hasAllAccess && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 px-4 py-2 rounded-full border border-amber-200">
              <Crown className="w-5 h-5 text-amber-600" />
              <span className="text-amber-800 font-medium">All Access Member</span>
            </div>
          )}
        </div>
        
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setSelectedTab('boxes')}
            className={`pb-3 px-1 font-medium transition-colors ${
              selectedTab === 'boxes' 
                ? 'text-red-600 border-b-2 border-red-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Individual Boxes
          </button>
          <button
            onClick={() => setSelectedTab('subscription')}
            className={`pb-3 px-1 font-medium transition-colors ${
              selectedTab === 'subscription' 
                ? 'text-red-600 border-b-2 border-red-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Access Subscription
          </button>
        </div>
        
        {/* Individual Boxes Tab */}
        {selectedTab === 'boxes' && (
          <div>
            {/* Available Boxes */}
            {lockedBoxes.length > 0 && (
              <div className="mb-10">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Available to Purchase</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lockedBoxes.map(box => (
                    <Card key={box.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {/* Box header with color */}
                      <div 
                        className="h-24 flex items-center justify-center"
                        style={{ backgroundColor: box.color === '#FFFFFF' ? '#F3F4F6' : box.color }}
                      >
                        <Package className={`w-12 h-12 ${box.color === '#000000' || box.color === '#D12128' ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      
                      <CardContent className="p-5">
                        <h4 className="text-xl font-serif text-gray-900 mb-2">{box.name}</h4>
                        <p className="text-gray-600 text-sm mb-4">{box.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-bold text-gray-900">${box.price}</span>
                            <span className="text-gray-500 text-sm ml-1">one-time</span>
                          </div>
                          <Button 
                            onClick={() => onPurchaseBox(box)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Buy Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* Owned Boxes */}
            {ownedBoxes.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Collection</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ownedBoxes.map(box => (
                    <Card key={box.id} className="overflow-hidden bg-green-50 border-green-200">
                      <div 
                        className="h-24 flex items-center justify-center relative"
                        style={{ backgroundColor: box.color === '#FFFFFF' ? '#F3F4F6' : box.color }}
                      >
                        <Package className={`w-12 h-12 ${box.color === '#000000' || box.color === '#D12128' ? 'text-white' : 'text-gray-600'}`} />
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                          <Check className="w-3 h-3" /> Owned
                        </div>
                      </div>
                      
                      <CardContent className="p-5">
                        <h4 className="text-xl font-serif text-gray-900 mb-2">{box.name}</h4>
                        <p className="text-gray-600 text-sm">{box.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {lockedBoxes.length === 0 && ownedBoxes.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No boxes available at the moment</p>
              </div>
            )}
          </div>
        )}
        
        {/* Subscription Tab */}
        {selectedTab === 'subscription' && (
          <div>
            {hasAllAccess ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Crown className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-serif text-gray-900 mb-2">You have All Access!</h3>
                <p className="text-gray-600 mb-6">Enjoy unlimited access to all current and future boxes.</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {boxes.filter(b => !b.is_sample).map(box => (
                    <span 
                      key={box.id}
                      className="px-3 py-1 rounded-full text-sm border"
                      style={{ 
                        backgroundColor: box.color === '#FFFFFF' ? '#F9FAFB' : `${box.color}15`,
                        borderColor: box.color === '#FFFFFF' ? '#E5E7EB' : box.color,
                        color: box.color === '#FFFFFF' ? '#374151' : box.color
                      }}
                    >
                      {box.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {/* All Access Hero */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 mb-8 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-6 h-6 text-amber-400" />
                        <span className="text-amber-400 font-medium">Best Value</span>
                      </div>
                      <h3 className="text-3xl font-serif mb-3">All Access Pass</h3>
                      <p className="text-gray-300 mb-6 max-w-md">
                        Get unlimited access to all {boxes.filter(b => !b.is_sample).length} card boxes, 
                        plus any new boxes we release in the future.
                      </p>
                      
                      <ul className="space-y-2 mb-6">
                        <li className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-400" />
                          <span>Access to all {boxes.filter(b => !b.is_sample).length} premium boxes</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-400" />
                          <span>New boxes added automatically</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-400" />
                          <span>Cancel anytime</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="hidden sm:block">
                      <Crown className="w-24 h-24 text-amber-400 opacity-50" />
                    </div>
                  </div>
                </div>
                
                {/* Subscription Plans */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {plans.map((plan, index) => (
                    <Card 
                      key={plan.id} 
                      className={`overflow-hidden ${index === 0 ? 'border-red-500 border-2' : ''}`}
                    >
                      {index === 0 && (
                        <div className="bg-red-500 text-white text-center py-1 text-sm font-medium">
                          Most Popular
                        </div>
                      )}
                      <CardContent className="p-6">
                        <h4 className="text-xl font-medium text-gray-900 mb-1">{plan.name}</h4>
                        <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
                        
                        <div className="mb-6">
                          <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                          <span className="text-gray-500">/{plan.interval === 'quarter' ? '3 months' : plan.interval}</span>
                          
                          {plan.interval === 'quarter' && (
                            <p className="text-green-600 text-sm mt-1">
                              Save 20% vs monthly
                            </p>
                          )}
                        </div>
                        
                        <Button 
                          onClick={() => onSubscribe(plan)}
                          className={`w-full ${index === 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800'} text-white`}
                        >
                          Subscribe Now
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {plans.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Subscription plans coming soon!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// HOME SCREEN - Landing page with app info
// ============================================================================
function HomeScreen({ appConfig, onPlay, onSignIn, user }) {
  const { theme, isApple, isDark, colors } = useTheme()
  const { paddingBottom, paddingLeft, isLandscape } = useBottomNavPadding()
  
  return (
    <div 
      className={`min-h-screen ${isDark ? 'bg-[#0F0F0F]' : 'bg-white'}`}
      style={{ paddingBottom, paddingLeft }}
    >
      {/* Hero Section */}
      <div className={`relative overflow-hidden ${isDark ? 'bg-gradient-to-b from-[#1a1a1a] to-[#0F0F0F]' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
          {/* Brand Name */}
          <h1 className={`font-brand text-lg tracking-widest mb-4 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
            {appConfig?.name || 'AS WE ALL ARE'}
          </h1>
          
          {/* Title */}
          <h2 className={`text-3xl sm:text-5xl font-serif mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {appConfig?.title || 'Unscripted Conversations'}
          </h2>
          
          {/* Tagline */}
          <p className={`text-lg sm:text-xl mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {appConfig?.tagline || 'A therapeutic conversational card game'}
          </p>
          
          {/* Promise */}
          <p className={`text-base max-w-xl mx-auto mb-8 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {appConfig?.promise || 'Know more about each other without the need to ask any question'}
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={onPlay}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg"
              style={{ borderRadius: theme.borderRadius.lg, backgroundColor: colors.primary }}
            >
              <Play className="w-5 h-5 mr-2" />
              Start Playing
            </Button>
            {!user && (
              <Button 
                onClick={onSignIn}
                variant="outline"
                className="px-8 py-3 text-lg border-gray-300"
                style={{ borderRadius: theme.borderRadius.lg }}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Header Content (Markdown) */}
      {appConfig?.header_text && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className={`prose prose-lg max-w-none text-center ${isDark ? 'prose-invert' : 'prose-gray'}`}>
            <SimpleMarkdown>{appConfig.header_text}</SimpleMarkdown>
          </div>
        </div>
      )}
      
      {/* Body Content (Markdown) */}
      {appConfig?.body_text && (
        <div className={`py-12 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className={`prose prose-lg max-w-none ${isDark ? 'prose-invert prose-blockquote:border-red-500' : 'prose-gray prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600 prose-blockquote:border-red-500 prose-blockquote:text-gray-700'}`}>
              <SimpleMarkdown>{appConfig.body_text}</SimpleMarkdown>
            </div>
          </div>
        </div>
      )}
      
      {/* Socials */}
      {appConfig?.socials?.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-wrap justify-center gap-3">
            {appConfig.socials.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${isDark ? 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                style={{ borderRadius: isApple ? theme.borderRadius.full : theme.borderRadius.lg }}
              >
                <SocialIcon platform={social.name} size={20} colored />
                <span className="text-sm font-medium">{social.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}
      
      {/* Footer Content */}
      {appConfig?.footer_text && (
        <div className={`border-t py-8 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>{appConfig.footer_text}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// PROFILE SCREEN - User info, purchases, memberships
// ============================================================================
function ProfileScreen({
  user, 
  purchases, 
  onSignOut, 
  onCancelSubscription,
  onSignIn,
  isAdmin,
  onGoToAdmin
}) {
  const { theme, themeName, toggleTheme, autoDetected, manualOverride, resetToAuto, isApple, colorMode, autoColorMode, colorModeOverride, setColorModePreference, colors } = useTheme()
  const { paddingBottom, paddingLeft } = useBottomNavPadding()
  
  // Group purchases by status
  const activeMemberships = purchases.filter(p => 
    p.membership_days && new Date(p.expires_at) > new Date()
  )
  const expiredMemberships = purchases.filter(p => 
    p.membership_days && new Date(p.expires_at) <= new Date()
  )
  const oneTimePurchases = purchases.filter(p => !p.membership_days)
  
  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  // Calculate days until expiry
  const daysUntilExpiry = (dateStr) => {
    if (!dateStr) return null
    const diff = new Date(dateStr) - new Date()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }
  
  const isDark = colorMode === 'dark'
  
  if (!user) {
    return (
      <div 
        className={`min-h-screen flex flex-col items-center justify-center p-4 ${isDark ? 'bg-[#0F0F0F]' : 'bg-white'}`}
        style={{ paddingBottom, paddingLeft }}
      >
        <User className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
        <h2 className={`text-2xl font-serif mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Welcome</h2>
        <p className={`mb-6 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sign in to view your profile and purchases</p>
        <Button 
          onClick={onSignIn}
          className="text-white px-8"
          style={{ borderRadius: theme.borderRadius.lg, backgroundColor: colors.primary }}
        >
          Sign In
        </Button>
      </div>
    )
  }
  
  return (
    <div 
      className={`min-h-screen ${isDark ? 'bg-[#0F0F0F]' : 'bg-gray-50'}`}
      style={{ paddingBottom, paddingLeft }}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {/* Profile Header */}
        <div className={`rounded-2xl p-6 mb-4 shadow-sm ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
              <User className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Signed in as</p>
              <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.email}</p>
            </div>
          </div>
          
          {/* Admin Link */}
          {isAdmin && (
            <button
              onClick={onGoToAdmin}
              className={`mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              <Settings className="w-4 h-4" />
              Admin Panel
            </button>
          )}
        </div>
        
        {/* Active Memberships */}
        {activeMemberships.length > 0 && (
          <div className={`rounded-2xl p-6 mb-4 shadow-sm ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Crown className="w-5 h-5" style={{ color: colors.primary }} />
              Active Memberships
            </h3>
            <div className="space-y-3">
              {activeMemberships.map((purchase) => {
                const days = daysUntilExpiry(purchase.expires_at)
                return (
                  <div key={purchase.id} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-green-900/50' : 'bg-green-100'}`}>
                        <Crown className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{purchase.box_name || purchase.plan_name || 'Membership'}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Expires: {formatDate(purchase.expires_at)}
                          {days && days <= 30 && (
                            <span className="ml-2 text-orange-500">({days} days left)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onCancelSubscription(purchase)}
                      className="text-sm font-medium"
                      style={{ color: colors.danger }}
                    >
                      Cancel
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
        {/* Owned Products */}
        {oneTimePurchases.length > 0 && (
          <div className={`rounded-2xl p-6 mb-4 shadow-sm ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Package className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-600'}`} />
              Owned Products
            </h3>
            <div className="space-y-3">
              {oneTimePurchases.map((purchase) => (
                <div key={purchase.id} className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-50'}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#3a3a3a]' : 'bg-gray-100'}`}>
                    <Package className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{purchase.box_name || purchase.product_name || 'Product'}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Purchased: {formatDate(purchase.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Past Memberships */}
        {expiredMemberships.length > 0 && (
          <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              Past Memberships
            </h3>
            <div className="space-y-3">
              {expiredMemberships.map((purchase) => (
                <div key={purchase.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg opacity-60">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">{purchase.box_name || purchase.plan_name || 'Membership'}</p>
                    <p className="text-sm text-gray-400">
                      Expired: {formatDate(purchase.expires_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {purchases.length === 0 && (
          <div className="bg-white rounded-2xl p-8 mb-4 shadow-sm text-center">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">No purchases yet</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Your purchase history will appear here</p>
          </div>
        )}
        
        {/* Settings */}
        <div className={`rounded-2xl p-6 mb-4 shadow-sm ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
          <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Settings className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-600'}`} />
            Settings
          </h3>
          
          {/* Dark Mode Toggle */}
          <div className={`flex items-center justify-between py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
            <div>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Appearance</p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {colorModeOverride ? `Manual: ${colorMode}` : `Auto: ${autoColorMode}`}
              </p>
            </div>
            <div className={`flex items-center gap-1 rounded-full p-1 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
              <button
                onClick={() => setColorModePreference('light')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  colorMode === 'light' 
                    ? (isDark ? 'bg-[#3a3a3a] text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm') 
                    : (isDark ? 'text-gray-400' : 'text-gray-500')
                }`}
              >
                Light
              </button>
              <button
                onClick={() => setColorModePreference('dark')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  colorMode === 'dark' ? 'bg-gray-800 text-white' : (isDark ? 'text-gray-400' : 'text-gray-500')
                }`}
              >
                Dark
              </button>
            </div>
          </div>
          
          {/* Theme Toggle (Apple/Material) */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Style</p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {manualOverride ? `Manual: ${themeName}` : `Auto: ${autoDetected}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {manualOverride && (
                <button
                  onClick={resetToAuto}
                  className={`text-xs mr-2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Reset
                </button>
              )}
              <button
                onClick={toggleTheme}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isApple 
                    ? 'bg-gray-900 text-white' 
                    : (isDark ? 'bg-[#2a2a2a] text-gray-300' : 'bg-gray-100 text-gray-700')
                }`}
              >
                {isApple ? 'Apple' : 'Material'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Sign Out */}
        <button
          onClick={onSignOut}
          className="w-full py-3 text-red-600 font-medium hover:bg-red-50 rounded-xl transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

function AppContent() {
  const { theme } = useTheme()
  const { paddingBottom, paddingLeft, isLandscape: bottomNavLandscape } = useBottomNavPadding()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState('signin')
  const [authOpen, setAuthOpen] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
  const [isLandscape, setIsLandscape] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Cancel subscription dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [purchaseToCancel, setPurchaseToCancel] = useState(null)
  
  // Admin email restriction - also check is_admin flag from local auth
  const ADMIN_EMAIL = 'mocasin@gmail.com'
  const isAdmin = user?.email === ADMIN_EMAIL || user?.is_admin === true
  
  // Admin filter state
  const [adminSeriesFilter, setAdminSeriesFilter] = useState('')
  const [adminBoxFilter, setAdminBoxFilter] = useState('')
  const [adminPileFilter, setAdminPileFilter] = useState('')
  
  // Card editing state
  const [editingCardId, setEditingCardId] = useState(null)
  const [editingCardText, setEditingCardText] = useState('')
  
  // Box selection state
  const [boxes, setBoxes] = useState([])
  const [plans, setPlans] = useState([])
  const [collectionSeries, setCollectionSeries] = useState([])
  const [selectedBoxIds, setSelectedBoxIds] = useState([])
  const [gameStarted, setGameStarted] = useState(false)
  const [hasAllAccess, setHasAllAccess] = useState(false)
  
  // Game state - separated for black and white cards
  const [allCards, setAllCards] = useState([])
  const [blackDeck, setBlackDeck] = useState([])
  const [whiteDeck, setWhiteDeck] = useState([])
  const [currentBlack, setCurrentBlack] = useState(null)
  const [currentWhite, setCurrentWhite] = useState(null)
  const [blackFlipped, setBlackFlipped] = useState(false)
  const [whiteFlipped, setWhiteFlipped] = useState(false)
  
  // Booklet viewer state
  const [bookletOpen, setBookletOpen] = useState(false)
  const [bookletImages, setBookletImages] = useState(BOOKLET_IMAGES)
  const [bookletTitle, setBookletTitle] = useState("Unscripted Conversations Guide")
  
  // View state - default to 'home' now
  const [view, setView] = useState('home')
  const [purchases, setPurchases] = useState([])
  
  // App config state
  const [appConfig, setAppConfig] = useState(null)
  
  // Admin
  const [adminCards, setAdminCards] = useState([])
  const [adminBoxes, setAdminBoxes] = useState([])
  const [adminSeries, setAdminSeries] = useState([])
  const [adminPrices, setAdminPrices] = useState([])
  const [adminPiles, setAdminPiles] = useState([])
  const [adminBundles, setAdminBundles] = useState([])
  const [adminTab, setAdminTab] = useState('app')  // Default to 'app' tab
  
  // Admin App Config state
  const [adminAppConfig, setAdminAppConfig] = useState(null)
  const [adminAppConfigLoading, setAdminAppConfigLoading] = useState(false)
  const [adminAppSocialForm, setAdminAppSocialForm] = useState({ platform: 'Instagram', url: '' })
  
  // Mockups state
  const [mockupsSeriesFilter, setMockupsSeriesFilter] = useState('')
  const [mockupsBoxId, setMockupsBoxId] = useState('')
  const [mockupsData, setMockupsData] = useState({ mainImage: null, secondaryImage: null, cardMockups: [] })
  const [mockupsLoading, setMockupsLoading] = useState(false)
  const [editingMockupOrder, setEditingMockupOrder] = useState(null)  // ID of mockup being edited
  
  // Show/hide forms (forms hidden by default)
  const [showCardForm, setShowCardForm] = useState(false)
  const [showBoxForm, setShowBoxForm] = useState(false)
  const [showSeriesForm, setShowSeriesForm] = useState(false)
  const [showPriceForm, setShowPriceForm] = useState(false)
  const [showPileForm, setShowPileForm] = useState(false)
  const [showBundleForm, setShowBundleForm] = useState(false)
  
  const [editingCard, setEditingCard] = useState(null)
  const [editingBox, setEditingBox] = useState(null)
  const [editingSeries, setEditingSeries] = useState(null)
  const [editingPrice, setEditingPrice] = useState(null)
  const [editingPile, setEditingPile] = useState(null)
  const [editingBundle, setEditingBundle] = useState(null)
  
  const [cardForm, setCardForm] = useState({
    color: 'black',
    title: '',
    hint: '',
    language: 'en',
    isSample: false,
    isActive: true,
    boxId: '',
    imagePath: ''
  })
  
  const [boxForm, setBoxForm] = useState({
    id: '',  // Slug - also used as folder name for cards
    name: '',
    description: '',
    descriptionShort: '',
    tagline: '',
    topicsText: '',  // Store as text, parse on save
    priceId: '',
    color: '#000000',
    colorPaletteText: '',  // Store as text, parse on save
    displayOrder: 0,
    isSample: false,
    fullBoxId: '',  // Reference to the full version box (only for sample boxes)
    isActive: true,
    collectionSeriesId: ''
  })
  
  const [seriesForm, setSeriesForm] = useState({
    id: '',
    name: '',
    description: '',
    displayOrder: 0,
    isActive: true
  })
  
  const [priceForm, setPriceForm] = useState({
    id: '',
    label: '',
    paymentInfo: '',
    hookInfo: '',
    amount: 0,
    promoAmount: null,
    promoEnabled: false,
    currency: 'USD',
    membershipDays: 30,
    displayOrder: 0,
    isActive: true
  })
  
  const [pileForm, setPileForm] = useState({
    id: '',
    slug: '',
    name: '',
    imagePath: '',
    collectionSeriesId: 'unscripted_conversations',
    displayOrder: 0,
    isActive: true
  })
  
  const [bundleForm, setBundleForm] = useState({
    id: '',
    name: '',
    description: '',
    priceId: '',
    boxIds: [],
    displayOrder: 0,
    isActive: true
  })
  
  // Bulk card upload state
  const [bulkUploadPileId, setBulkUploadPileId] = useState('')
  const [uploadingCards, setUploadingCards] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingPileImage, setUploadingPileImage] = useState(false)
  
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
  
  // Auth check - supports both local and Supabase auth
  useEffect(() => {
    const checkAuth = async () => {
      // First try local auth
      try {
        const localResponse = await fetch('/api/auth/local/user')
        const localData = await localResponse.json()
        if (localData.user) {
          setUser(localData.user)
          setLoading(false)
          return
        }
      } catch (e) {
        // Local auth not available, try Supabase
      }
      
      // Fall back to Supabase auth
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const response = await fetch('/api/auth/user')
          const data = await response.json()
          setUser(data.user)
        }
      } catch (e) {
        // Supabase not configured
      }
      setLoading(false)
    }
    
    checkAuth()
    
    // Only set up Supabase listener if available
    let subscription = null
    try {
      const result = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const response = await fetch('/api/auth/user')
          const data = await response.json()
          setUser(data.user)
        } else {
          // Check local auth before clearing user
          const localResponse = await fetch('/api/auth/local/user')
          const localData = await localResponse.json()
          if (!localData.user) {
            setUser(null)
          }
        }
      })
      subscription = result.data?.subscription
    } catch (e) {
      // Supabase not configured
    }
    
    return () => subscription?.unsubscribe?.()
  }, [])
  
  // Handle payment success - check URL params and refresh data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const paymentStatus = params.get('payment')
      
      if (paymentStatus === 'success') {
        // Show success toast
        setTimeout(() => {
          toast.success('Payment successful! Your new boxes are now available.')
        }, 500)
        
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname)
        
        // Refresh boxes data after a short delay (webhook needs time)
        setTimeout(async () => {
          const response = await fetch('/api/boxes')
          const data = await response.json()
          if (data.boxes) {
            setBoxes(data.boxes)
            setHasAllAccess(data.hasAllAccess || false)
            // Auto-select all accessible boxes
            const accessibleBoxIds = data.boxes.filter(b => b.hasAccess).map(b => b.id)
            setSelectedBoxIds(accessibleBoxIds)
          }
        }, 2000)
      }
    }
  }, [])
  
  // Load boxes and plans
  useEffect(() => {
    const loadBoxes = async () => {
      try {
        const response = await fetch('/api/boxes')
        const data = await response.json()
        if (data.boxes) {
          setBoxes(data.boxes)
          setHasAllAccess(data.hasAllAccess || false)
          // Auto-select sample boxes
          const sampleBoxIds = data.boxes.filter(b => b.is_sample && b.hasAccess).map(b => b.id)
          setSelectedBoxIds(sampleBoxIds)
        }
      } catch (err) {
        console.error('Failed to load boxes:', err)
      }
    }
    
    const loadPlans = async () => {
      try {
        const response = await fetch('/api/plans')
        const data = await response.json()
        if (data.plans) {
          setPlans(data.plans)
        }
      } catch (err) {
        console.error('Failed to load plans:', err)
      }
    }
    
    const loadCollectionSeries = async () => {
      try {
        const response = await fetch('/api/collection-series')
        const data = await response.json()
        if (data.series) {
          setCollectionSeries(data.series)
        }
      } catch (err) {
        console.error('Failed to load collection series:', err)
      }
    }
    
    const loadAppConfig = async () => {
      try {
        const response = await fetch('/api/app-config?slug=asweallare')
        const data = await response.json()
        if (data && !data.error) {
          setAppConfig(data)
        }
      } catch (err) {
        console.error('Failed to load app config:', err)
      }
    }
    
    loadBoxes()
    loadPlans()
    loadCollectionSeries()
    loadAppConfig()
  }, [user])
  
  // Shuffle deck helper
  const shuffleDeck = (deck) => {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Load cards for selected boxes
  const loadCards = async (boxIds) => {
    console.log('[loadCards] Loading cards for boxes:', boxIds)
    const queryParam = boxIds.length > 0 ? `?box_ids=${boxIds.join(',')}` : ''
    const response = await fetch(`/api/cards${queryParam}`)
    const data = await response.json()
    
    console.log('[loadCards] Received cards:', data.cards?.length || 0)
    
    if (data.cards) {
      const normalizedCards = data.cards.map(card => ({
        id: card.id,
        color: card.color,
        title: card.title,
        hint: card.hint,
        language: card.language,
        isSample: card.issample,
        isActive: card.isactive,
        boxId: card.box_id,
        imagePath: card.image_path,
        createdAt: card.createdat
      }))
      
      setAllCards(normalizedCards)
      const blacks = normalizedCards.filter(c => c.color === 'black')
      const whites = normalizedCards.filter(c => c.color === 'white')
      console.log('[loadCards] Black cards:', blacks.length, 'White cards:', whites.length)
      setBlackDeck(shuffleDeck([...blacks]))
      setWhiteDeck(shuffleDeck([...whites]))
    }
  }
  
  // Start playing with selected boxes
  const handleStartPlaying = async () => {
    await loadCards(selectedBoxIds)
    setGameStarted(true)
  }
  
  // Go back to box selection
  const handleBackToBoxes = () => {
    setGameStarted(false)
    setCurrentBlack(null)
    setCurrentWhite(null)
    setBlackFlipped(false)
    setWhiteFlipped(false)
  }
  
  // Next Player - reset for next turn
  const handleNextPlayer = () => {
    setCurrentBlack(null)
    setCurrentWhite(null)
    setBlackFlipped(false)
    setWhiteFlipped(false)
  }
  
  // Purchase box
  const handlePurchaseBox = async (box) => {
    if (!user) {
      setAuthOpen(true)
      return
    }
    
    const response = await fetch('/api/payment/purchase-box', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boxId: box.id })
    })
    
    const data = await response.json()
    if (data.url) {
      window.location.href = data.url
    }
  }
  
  // Subscribe to all access
  const handleSubscribe = async (plan) => {
    if (!user) {
      setAuthOpen(true)
      return
    }
    
    const response = await fetch('/api/payment/subscribe-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: plan.id })
    })
    
    const data = await response.json()
    if (data.url) {
      window.location.href = data.url
    }
  }
  
  // Go to store
  const handleGoToStore = () => {
    setView('store')
  }
  
  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthError('')
    setAuthSuccess('')
    setAuthLoading(true)
    
    try {
      // Handle password reset separately (Supabase only)
      if (authMode === 'forgot') {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        })
        
        const data = await response.json()
        
        if (data.error) {
          setAuthError(data.error)
        } else {
          setAuthSuccess('Password reset email sent! Check your inbox for a link to reset your password.')
          setEmail('')
          setTimeout(() => { setAuthMode('signin'); setAuthSuccess('') }, 5000)
        }
        setAuthLoading(false)
        return
      }
      
      // Try local auth first
      const localEndpoint = authMode === 'signin' ? '/api/auth/local/signin' : '/api/auth/local/signup'
      let response = await fetch(localEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      let data = await response.json()
      
      // If local auth fails with "not enabled", fall back to Supabase
      if (data.error === 'Local auth not enabled') {
        response = await fetch(`/api/auth/${authMode}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
        data = await response.json()
      }
      
      if (data.error) {
        if (data.error.includes('Email not confirmed')) {
          setAuthError('Please check your email and click the confirmation link before signing in.')
        } else if (data.error.includes('Invalid login credentials') || data.error.includes('Invalid email or password')) {
          setAuthError('Invalid email or password. Please try again.')
        } else if (data.error.includes('User already exists')) {
          setAuthError('An account with this email already exists. Try signing in instead.')
        } else {
          setAuthError(data.error)
        }
      } else {
        if (data.success) {
          // Local auth success - user is auto-logged in
          setAuthOpen(false)
          setEmail('')
          setPassword('')
          
          // Fetch fresh user data
          const userResponse = await fetch('/api/auth/local/user')
          const userData = await userResponse.json()
          if (userData.user) {
            setUser(userData.user)
          }
          
          // Refresh boxes
          const boxResponse = await fetch('/api/boxes')
          const boxData = await boxResponse.json()
          if (boxData.boxes) {
            setBoxes(boxData.boxes)
            setHasAllAccess(boxData.hasAllAccess || false)
            const accessibleBoxIds = boxData.boxes.filter(b => b.hasAccess).map(b => b.id)
            setSelectedBoxIds(accessibleBoxIds.length > 0 ? accessibleBoxIds : boxData.boxes.filter(b => b.is_sample && b.hasAccess).map(b => b.id))
          }
        } else if (authMode === 'signup') {
          // Supabase signup - needs email confirmation
          setAuthSuccess('Success! Please check your email to confirm your account before signing in.')
          setEmail('')
          setPassword('')
          setTimeout(() => { setAuthMode('signin'); setAuthSuccess('') }, 3000)
        } else {
          // Supabase sign in successful
          setAuthOpen(false)
          setEmail('')
          setPassword('')
          
          const userResponse = await fetch('/api/auth/user')
          const userData = await userResponse.json()
          if (userData.user) {
            setUser(userData.user)
          }
          
          const boxResponse = await fetch('/api/boxes')
          const boxData = await boxResponse.json()
          if (boxData.boxes) {
            setBoxes(boxData.boxes)
            setHasAllAccess(boxData.hasAllAccess || false)
            const accessibleBoxIds = boxData.boxes.filter(b => b.hasAccess).map(b => b.id)
            setSelectedBoxIds(accessibleBoxIds.length > 0 ? accessibleBoxIds : boxData.boxes.filter(b => b.is_sample && b.hasAccess).map(b => b.id))
          }
        }
      }
    } catch (error) {
      setAuthError('Authentication failed. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }
  
  const handleGoogleSignIn = async () => {
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await response.json()
      if (data.url) window.location.href = data.url
    } catch (error) {
      setAuthError('Google sign-in failed')
    }
  }
  
  const handleSignOut = async () => {
    try {
      // Try local signout first
      await fetch('/api/auth/local/signout', { method: 'POST' })
      
      // Also try Supabase signout
      try {
        await fetch('/api/auth/signout', { method: 'POST' })
        await supabase.auth.signOut({ scope: 'global' })
      } catch (e) {
        // Supabase not configured
      }
      
      // Clear any remaining localStorage items from Supabase
      if (typeof window !== 'undefined') {
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
    
    // Clear ALL user-related state regardless of API success
    setUser(null)
    setView('game')
    setGameStarted(false)
    setHasAllAccess(false)
    setSelectedBoxIds([])
    setPurchases([])
    setAllCards([])
    setBlackDeck([])
    setWhiteDeck([])
    setCurrentBlack(null)
    setCurrentWhite(null)
    setBlackFlipped(false)
    setWhiteFlipped(false)
    
    // Reload boxes to get fresh data without user access
    try {
      const response = await fetch('/api/boxes')
      const data = await response.json()
      if (data.boxes) {
        setBoxes(data.boxes)
        // Auto-select only sample boxes for non-authenticated user
        const sampleBoxIds = data.boxes.filter(b => b.is_sample && b.hasAccess).map(b => b.id)
        setSelectedBoxIds(sampleBoxIds)
      }
    } catch (error) {
      console.error('Failed to reload boxes:', error)
    }
  }
  
  // Load user purchases
  const loadPurchases = async () => {
    const response = await fetch('/api/purchases')
    const data = await response.json()
    if (data.purchases) {
      setPurchases(data.purchases)
    }
  }
  
  // Open cancel subscription dialog
  const openCancelDialog = (purchase) => {
    setPurchaseToCancel(purchase)
    setCancelDialogOpen(true)
  }
  
  // Cancel subscription (actual action)
  const handleCancelSubscription = async () => {
    if (!purchaseToCancel) return
    
    const response = await fetch('/api/payment/cancel-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchaseId: purchaseToCancel.id })
    })
    
    const data = await response.json()
    setCancelDialogOpen(false)
    setPurchaseToCancel(null)
    
    if (data.success) {
      toast.success('Subscription cancelled successfully')
      loadPurchases()
      // Refresh boxes to update access
      const boxResponse = await fetch('/api/boxes')
      const boxData = await boxResponse.json()
      if (boxData.boxes) {
        setBoxes(boxData.boxes)
        setHasAllAccess(boxData.hasAllAccess || false)
      }
    } else {
      toast.error(data.error || 'Failed to cancel subscription')
    }
  }
  
  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Get box folder from selected box
    let boxFolder = 'uploads'
    
    if (cardForm.boxId === 'box_sample') boxFolder = 'white-box-sample'
    else if (cardForm.boxId === 'box_white') boxFolder = 'white-box-108'
    else if (cardForm.boxId === 'box_white_xl') boxFolder = 'white-box-216'
    else if (cardForm.boxId === 'box_black') boxFolder = 'black-box-108'
    else if (cardForm.boxId === 'box_red') boxFolder = 'red-box-108'
    
    setUploadingImage(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('boxFolder', boxFolder)
      formData.append('cardColor', cardForm.color)
      
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success) {
        setCardForm(prev => ({ ...prev, imagePath: data.imagePath }))
        toast.success('Image uploaded successfully!')
      } else {
        toast.error(data.error || 'Failed to upload image')
      }
    } catch (error) {
      toast.error('Error uploading image: ' + error.message)
    } finally {
      setUploadingImage(false)
    }
  }
  
  const loadAdminCards = async () => {
    const response = await fetch('/api/admin/cards')
    const data = await response.json()
    if (data.cards) {
      const normalizedCards = data.cards.map(card => ({
        id: card.id,
        boxId: card.box_id,
        boxName: card.boxes?.name,
        pileId: card.pile_id,
        pileName: card.piles?.name,
        text: card.text,
        imagePath: card.image_path,
        isActive: card.is_active,
        createdAt: card.created_at,
        seriesId: card.boxes?.collection_series_id,
        seriesName: card.boxes?.collection_series?.name
      }))
      setAdminCards(normalizedCards)
    }
  }
  
  const loadAdminBoxes = async () => {
    const response = await fetch('/api/admin/boxes')
    const data = await response.json()
    if (data.boxes) {
      const normalizedBoxes = data.boxes.map(box => ({
        id: box.id,
        name: box.name,
        description: box.description,
        description_short: box.description_short,
        descriptionShort: box.description_short,
        tagline: box.tagline,
        topics: box.topics || [],
        price: box.price,
        price_id: box.price_id,
        priceId: box.price_id,
        color: box.color,
        color_palette: box.color_palette || [],
        colorPalette: box.color_palette || [],
        path: box.path,
        display_order: box.display_order,
        displayOrder: box.display_order,
        is_sample: box.is_sample,
        isSample: box.is_sample,
        full_box_id: box.full_box_id || null,
        fullBoxId: box.full_box_id || '',
        is_active: box.is_active,
        isActive: box.is_active,
        collection_series_id: box.collection_series_id,
        collectionSeriesId: box.collection_series_id,
        collection_series: box.collection_series,
        seriesName: box.collection_series?.name,
        prices: box.prices,
        cardStats: box.cardStats || { total: 0, byPile: {} }
      }))
      setAdminBoxes(normalizedBoxes)
    }
    // NOTE: Don't overwrite adminPiles here - let loadAdminPiles handle it properly
    // The piles returned from /api/admin/boxes are not normalized and lack seriesName
  }
  
  const loadAdminSeries = async () => {
    const response = await fetch('/api/admin/collection-series')
    const data = await response.json()
    if (data.series) {
      const normalizedSeries = data.series.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        displayOrder: s.display_order,
        isActive: s.is_active
      }))
      setAdminSeries(normalizedSeries)
    }
  }
  
  const loadAdminPrices = async () => {
    const response = await fetch('/api/admin/prices')
    const data = await response.json()
    if (data.prices) {
      const normalizedPrices = data.prices.map(p => ({
        id: p.id,
        label: p.label,
        paymentInfo: p.payment_info,
        hookInfo: p.hook_info,
        amount: p.amount,
        promo_amount: p.promo_amount,
        promo_enabled: p.promo_enabled,
        currency: p.currency,
        isMembership: p.is_membership,
        membership_days: p.membership_days,
        membershipDays: p.membership_days,
        stripePriceId: p.stripe_price_id,
        display_order: p.display_order,
        displayOrder: p.display_order,
        is_active: p.is_active,
        isActive: p.is_active,
        payment_info: p.payment_info,
        hook_info: p.hook_info
      }))
      setAdminPrices(normalizedPrices)
    }
  }
  
  const loadAdminPiles = async () => {
    try {
      const response = await fetch('/api/admin/piles')
      const data = await response.json()
      
      if (data.error) {
        console.error('Failed to load piles:', data.error)
        return
      }
      
      if (data.piles && Array.isArray(data.piles)) {
        const normalizedPiles = data.piles.map(p => {
          // Handle both join format (collection_series object) and manual enrichment format
          let seriesName = 'N/A'
          if (p.collection_series) {
            // Could be an object from join or manual enrichment
            seriesName = typeof p.collection_series === 'object' 
              ? (p.collection_series.name || 'N/A')
              : p.collection_series
          }
          
          return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            imagePath: p.image_path || p.imagePath || '',
            image_path: p.image_path || p.imagePath || '',
            collectionSeriesId: p.collection_series_id,
            seriesName: seriesName,
            displayOrder: p.display_order ?? 0,
            isActive: p.is_active !== false
          }
        })
        console.log('Loaded piles with series:', normalizedPiles.map(p => ({ name: p.name, seriesName: p.seriesName })))
        setAdminPiles(normalizedPiles)
      }
    } catch (err) {
      console.error('Error loading piles:', err)
    }
  }
  
  const loadAdminBundles = async () => {
    const response = await fetch('/api/admin/bundles')
    const data = await response.json()
    if (data.bundles) {
      const normalizedBundles = data.bundles.map(b => ({
        id: b.id,
        name: b.name,
        description: b.description,
        priceId: b.price_id,
        priceLabel: b.prices?.label,
        priceAmount: b.prices?.amount,
        boxIds: b.box_ids || [],
        displayOrder: b.display_order,
        isActive: b.is_active
      }))
      setAdminBundles(normalizedBundles)
    }
  }
  
  // Load mockups for a specific box
  const loadMockups = async (boxId) => {
    if (!boxId) {
      setMockupsData({ mainImage: null, secondaryImage: null, cardMockups: [] })
      return
    }
    
    setMockupsLoading(true)
    try {
      const response = await fetch(`/api/admin/mockups?boxId=${boxId}`)
      const data = await response.json()
      
      if (data.error) {
        console.error('Failed to load mockups:', data.error)
        setMockupsData({ mainImage: null, secondaryImage: null, cardMockups: [] })
      } else {
        setMockupsData({
          mainImage: data.mainImage,
          secondaryImage: data.secondaryImage,
          cardMockups: data.cardMockups || []
        })
      }
    } catch (err) {
      console.error('Error loading mockups:', err)
      setMockupsData({ mainImage: null, secondaryImage: null, cardMockups: [] })
    }
    setMockupsLoading(false)
  }
  
  // Upload mockup image
  const handleMockupUpload = async (file, imageType) => {
    if (!mockupsBoxId || !file) return
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('boxId', mockupsBoxId)
    formData.append('imageType', imageType)
    
    try {
      const response = await fetch('/api/admin/mockups', {
        method: 'POST',
        body: formData
      })
      
      // Check if response is OK before parsing JSON
      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorData = JSON.parse(errorText)
          toast({ title: 'Upload failed', description: errorData.error || 'Unknown error', variant: 'destructive' })
        } catch {
          toast({ title: 'Upload failed', description: `Server error: ${response.status}`, variant: 'destructive' })
        }
        return
      }
      
      const data = await response.json()
      
      if (data.error) {
        toast({ title: 'Upload failed', description: data.error, variant: 'destructive' })
      } else {
        toast({ title: 'Upload successful', description: data.message })
        loadMockups(mockupsBoxId)
      }
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' })
    }
  }
  
  // Delete mockup(s)
  const handleDeleteMockup = async (deleteType, imageId = null) => {
    if (!mockupsBoxId) return
    
    const confirmMsg = deleteType === 'all' 
      ? 'Delete ALL mockup images for this box?' 
      : `Delete ${deleteType} mockup image(s)?`
    
    if (!confirm(confirmMsg)) return
    
    try {
      let url = `/api/admin/mockups?boxId=${mockupsBoxId}`
      if (imageId) {
        url += `&imageId=${imageId}`
      } else {
        url += `&type=${deleteType}`
      }
      
      const response = await fetch(url, { method: 'DELETE' })
      const data = await response.json()
      
      if (data.error) {
        toast({ title: 'Delete failed', description: data.error, variant: 'destructive' })
      } else {
        toast({ title: 'Deleted', description: `Removed ${data.deleted} image(s)` })
        loadMockups(mockupsBoxId)
      }
    } catch (err) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' })
    }
  }
  
  // Download all mockups as ZIP
  const handleDownloadMockups = async () => {
    if (!mockupsBoxId) return
    
    try {
      const response = await fetch('/api/admin/mockups/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxId: mockupsBoxId })
      })
      
      if (!response.ok) {
        const data = await response.json()
        toast({ title: 'Download failed', description: data.error, variant: 'destructive' })
        return
      }
      
      // Download the ZIP file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mockups_${mockupsBoxId}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({ title: 'Download started' })
    } catch (err) {
      toast({ title: 'Download failed', description: err.message, variant: 'destructive' })
    }
  }
  
  const loadAllAdminData = async () => {
    await Promise.all([
      loadAdminAppConfig(),
      loadAdminCards(),
      loadAdminBoxes(),
      loadAdminSeries(),
      loadAdminPrices(),
      loadAdminPiles(),
      loadAdminBundles()
    ])
  }
  
  // Load Admin App Config
  const loadAdminAppConfig = async () => {
    setAdminAppConfigLoading(true)
    try {
      const response = await fetch('/api/admin/app-config')
      const data = await response.json()
      if (!data.error) {
        setAdminAppConfig(data)
      }
    } catch (err) {
      console.error('Failed to load app config:', err)
    }
    setAdminAppConfigLoading(false)
  }
  
  // Save Admin App Config
  const handleSaveAppConfig = async () => {
    try {
      const response = await fetch('/api/admin/app-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminAppConfig)
      })
      const data = await response.json()
      if (data.error) {
        toast({ title: 'Save failed', description: data.error, variant: 'destructive' })
      } else {
        toast({ title: 'App config saved' })
        setAdminAppConfig(data)
      }
    } catch (err) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' })
    }
  }
  
  // Add Social Link
  const handleAddSocialLink = async () => {
    if (!adminAppSocialForm.url) {
      toast({ title: 'URL required', variant: 'destructive' })
      return
    }
    try {
      const response = await fetch('/api/admin/app-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: adminAppConfig?.id || 'app_asweallare',
          platform: adminAppSocialForm.platform,
          url: adminAppSocialForm.url
        })
      })
      const data = await response.json()
      if (data.error) {
        toast({ title: 'Add failed', description: data.error, variant: 'destructive' })
      } else {
        toast({ title: 'Social link added' })
        setAdminAppSocialForm({ platform: 'Instagram', url: '' })
        loadAdminAppConfig()
      }
    } catch (err) {
      toast({ title: 'Add failed', description: err.message, variant: 'destructive' })
    }
  }
  
  // Delete Social Link
  const handleDeleteSocialLink = async (socialId) => {
    try {
      const response = await fetch(`/api/admin/app-config/socials?id=${socialId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.error) {
        toast({ title: 'Delete failed', description: data.error, variant: 'destructive' })
      } else {
        toast({ title: 'Social link deleted' })
        loadAdminAppConfig()
      }
    } catch (err) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' })
    }
  }
  
  // Update mockup display_order
  const handleUpdateMockupOrder = async (mockupId, newOrder) => {
    try {
      const response = await fetch('/api/admin/mockups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: mockupId, displayOrder: newOrder })
      })
      const data = await response.json()
      
      if (data.error) {
        toast({ title: 'Update failed', description: data.error, variant: 'destructive' })
      } else {
        toast({ title: 'Order updated' })
        loadMockups(mockupsBoxId)
      }
    } catch (err) {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' })
    }
    setEditingMockupOrder(null)
  }
  
  const handleSaveCard = async () => {
    const payload = {
      color: cardForm.color,
      title: cardForm.title,
      hint: cardForm.hint,
      language: cardForm.language,
      isSample: cardForm.isSample,
      isActive: cardForm.isActive,
      boxId: cardForm.boxId || null,
      imagePath: cardForm.imagePath || null
    }
    
    if (editingCard) {
      await fetch(`/api/admin/cards/${editingCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      toast({ title: 'Card updated successfully!' })
    } else {
      await fetch('/api/admin/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      toast({ title: 'Card created successfully!' })
    }
    
    setEditingCard(null)
    setShowCardForm(false)
    setCardForm({ color: 'black', title: '', hint: '', language: 'en', isSample: false, isActive: true, boxId: '', imagePath: '' })
    loadAdminCards()
  }
  
  const handleSaveBox = async () => {
    // Parse comma-separated text fields into arrays
    const topics = boxForm.topicsText 
      ? boxForm.topicsText.split(',').map(t => t.trim()).filter(Boolean)
      : []
    const colorPalette = boxForm.colorPaletteText
      ? boxForm.colorPaletteText.split(',').map(c => c.trim()).filter(Boolean)
      : []
    
    const payload = {
      id: boxForm.id || undefined,  // Include id for new boxes (slug)
      name: boxForm.name,
      description: boxForm.description,
      descriptionShort: boxForm.descriptionShort,
      tagline: boxForm.tagline,
      topics: topics,
      priceId: boxForm.priceId || null,
      color: boxForm.color,
      colorPalette: colorPalette,
      displayOrder: boxForm.displayOrder,
      isSample: boxForm.isSample,
      fullBoxId: boxForm.isSample ? (boxForm.fullBoxId || null) : null,  // Only set if sample
      isActive: boxForm.isActive,
      collectionSeriesId: boxForm.collectionSeriesId || null
    }
    
    if (editingBox) {
      await fetch(`/api/admin/boxes/${editingBox.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      toast({ title: 'Box updated successfully!' })
    } else {
      // For new box, use the form's id as the slug
      const newBoxPayload = { ...payload }
      await fetch('/api/admin/boxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBoxPayload)
      })
      toast({ title: 'Box created successfully!' })
    }
    
    setEditingBox(null)
    setShowBoxForm(false)
    setBoxForm({
      id: '', name: '', description: '', descriptionShort: '', tagline: '', topicsText: '',
      priceId: '', color: '#000000', colorPaletteText: '', displayOrder: 0,
      isSample: false, fullBoxId: '', isActive: true, collectionSeriesId: ''
    })
    loadAdminBoxes()
  }
  
  // Bulk upload cards from ZIP
  const handleBulkUploadCards = async (file) => {
    if (!editingBox || !bulkUploadPileId) {
      toast({ title: 'Please select a pile first', variant: 'destructive' })
      return
    }
    
    const pile = adminPiles.find(p => p.id === bulkUploadPileId)
    if (!pile) {
      toast({ title: 'Invalid pile selected', variant: 'destructive' })
      return
    }
    
    // Use box ID as the folder name (it's the slug)
    const boxSlug = editingBox.id
    
    setUploadingCards(true)
    setUploadResult(null)
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('boxId', editingBox.id)
    formData.append('boxSlug', boxSlug)
    formData.append('pileId', pile.id)
    formData.append('pileSlug', pile.slug)
    
    try {
      const response = await fetch('/api/admin/upload-cards', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success) {
        setUploadResult(data)
        toast({ title: `${data.created} cards created successfully!` })
        loadAdminCards() // Refresh cards list
      } else {
        toast({ title: data.error || 'Upload failed', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Upload failed: ' + err.message, variant: 'destructive' })
    }
    
    setUploadingCards(false)
  }
  
  const handleSaveSeries = async () => {
    const payload = {
      id: seriesForm.id || undefined,
      name: seriesForm.name,
      description: seriesForm.description,
      displayOrder: seriesForm.displayOrder,
      isActive: seriesForm.isActive
    }
    
    if (editingSeries) {
      await fetch(`/api/admin/collection-series/${editingSeries.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      toast({ title: 'Series updated successfully!' })
    } else {
      await fetch('/api/admin/collection-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      toast({ title: 'Series created successfully!' })
    }
    
    setEditingSeries(null)
    setShowSeriesForm(false)
    setSeriesForm({ id: '', name: '', description: '', displayOrder: 0, isActive: true })
    loadAdminSeries()
  }
  
  const handleSavePrice = async () => {
    const payload = {
      id: priceForm.id || undefined,
      label: priceForm.label,
      paymentInfo: priceForm.paymentInfo,
      hookInfo: priceForm.hookInfo,
      amount: priceForm.amount,
      promoAmount: priceForm.promoAmount,
      promoEnabled: priceForm.promoEnabled,
      currency: priceForm.currency,
      membershipDays: priceForm.membershipDays,
      displayOrder: priceForm.displayOrder,
      isActive: priceForm.isActive
    }
    
    try {
      if (editingPrice) {
        const res = await fetch(`/api/admin/prices/${editingPrice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error('Failed to update')
        toast({ title: 'Price updated successfully!' })
      } else {
        const res = await fetch('/api/admin/prices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to create')
        }
        toast({ title: 'Price created successfully!' })
      }
    } catch (err) {
      toast({ title: 'Error: ' + err.message, variant: 'destructive' })
      return
    }
    
    setEditingPrice(null)
    setShowPriceForm(false)
    setPriceForm({ id: '', label: '', paymentInfo: '', hookInfo: '', amount: 0, promoAmount: null, promoEnabled: false, currency: 'USD', membershipDays: 30, displayOrder: 0, isActive: true })
    loadAdminPrices()
  }
  
  const handleSavePile = async () => {
    // Auto-generate image path based on collection series
    let imagePath = pileForm.imagePath
    if (pileForm.collectionSeriesId && pileForm.slug && !imagePath) {
      const series = adminSeries.find(s => s.id === pileForm.collectionSeriesId)
      if (series) {
        imagePath = `collections/${series.id}/piles/${pileForm.slug}.png`
      }
    }
    
    const payload = {
      id: pileForm.id || undefined,
      slug: pileForm.slug || pileForm.name.toLowerCase().replace(/\s+/g, '_'),
      name: pileForm.name,
      imagePath: imagePath,
      collectionSeriesId: pileForm.collectionSeriesId || null,
      displayOrder: pileForm.displayOrder,
      isActive: pileForm.isActive
    }
    
    if (editingPile) {
      await fetch(`/api/admin/piles/${editingPile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      toast({ title: 'Pile updated successfully!' })
    } else {
      await fetch('/api/admin/piles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      toast({ title: 'Pile created successfully!' })
    }
    
    setEditingPile(null)
    setShowPileForm(false)
    setPileForm({ id: '', slug: '', name: '', imagePath: '', collectionSeriesId: '', displayOrder: 0, isActive: true })
    loadAdminPiles()
  }
  
  const handleSaveBundle = async () => {
    const payload = {
      id: bundleForm.id || undefined,
      name: bundleForm.name,
      description: bundleForm.description,
      priceId: bundleForm.priceId || null,
      boxIds: bundleForm.boxIds,
      displayOrder: bundleForm.displayOrder,
      isActive: bundleForm.isActive
    }
    
    if (editingBundle) {
      await fetch(`/api/admin/bundles/${editingBundle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      toast({ title: 'Bundle updated successfully!' })
    } else {
      await fetch('/api/admin/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      toast({ title: 'Bundle created successfully!' })
    }
    
    setEditingBundle(null)
    setShowBundleForm(false)
    setBundleForm({ id: '', name: '', description: '', priceId: '', boxIds: [], displayOrder: 0, isActive: true })
    loadAdminBundles()
  }
  
  // Save card text
  const handleSaveCardText = async (cardId, text) => {
    try {
      const response = await fetch(`/api/admin/cards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      
      if (response.ok) {
        toast({ title: 'Card text saved!' })
        setEditingCardId(null)
        setEditingCardText('')
        loadAdminCards()
      } else {
        toast({ title: 'Failed to save', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error: ' + err.message, variant: 'destructive' })
    }
  }
  
  const handleDeleteCard = async (cardId) => {
    await fetch(`/api/admin/cards/${cardId}`, { method: 'DELETE' })
    toast({ title: 'Card deleted' })
    loadAdminCards()
  }
  
  const handleDeleteBox = async (boxId) => {
    const res = await fetch(`/api/admin/boxes/${boxId}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'Box deleted' })
      loadAdminBoxes()
    } else {
      const err = await res.json()
      toast({ title: err.error || 'Failed to delete', variant: 'destructive' })
    }
  }
  
  const handleDeleteSeries = async (seriesId) => {
    await fetch(`/api/admin/collection-series/${seriesId}`, { method: 'DELETE' })
    toast({ title: 'Series deleted' })
    loadAdminSeries()
  }
  
  const handleDeletePrice = async (priceId) => {
    await fetch(`/api/admin/prices/${priceId}`, { method: 'DELETE' })
    toast({ title: 'Price deleted' })
    loadAdminPrices()
  }
  
  const handleDeletePile = async (pileId) => {
    await fetch(`/api/admin/piles/${pileId}`, { method: 'DELETE' })
    toast({ title: 'Pile deleted' })
    loadAdminPiles()
  }
  
  const handleDeleteBundle = async (bundleId) => {
    await fetch(`/api/admin/bundles/${bundleId}`, { method: 'DELETE' })
    toast({ title: 'Bundle deleted' })
    loadAdminBundles()
  }
  
  useEffect(() => {
    if (view === 'purchases' || view === 'profile') loadPurchases()
    else if (view === 'admin') { loadAllAdminData() }
  }, [view])
  
  // Navigation handler for bottom nav and mobile menu
  const handleNavigation = (newView) => {
    // Map bottom nav items to actual views
    const viewMap = {
      'home': 'home',
      'play': 'game',
      'store': 'store',
      'profile': 'profile'
    }
    const mappedView = viewMap[newView] || newView
    setView(mappedView)
    setGameStarted(false)
    setMobileMenuOpen(false)
  }
  
  // Check if we should show the bottom nav (hide during active game)
  const showBottomNav = !gameStarted && view !== 'admin'
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-2xl font-serif text-gray-900">Loading...</div>
      </div>
    )
  }
  
  // Landscape orientation check (only for game view)
  if (!isLandscape && view === 'game' && gameStarted) {
    return <RotateDeviceScreen />
  }
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}>
      {/* Main content - no top nav, only bottom nav */}
      <div style={{ 
        paddingBottom: showBottomNav ? paddingBottom : '0',
        paddingLeft: showBottomNav && bottomNavLandscape ? paddingLeft : '0'
      }}>
        {/* Home Screen */}
        {view === 'home' && (
          <HomeScreen 
            appConfig={appConfig}
            onPlay={() => { setView('game'); setGameStarted(false) }}
            onSignIn={() => setAuthOpen(true)}
            user={user}
          />
        )}
        
        {view === 'game' && !gameStarted && (
          <BoxSelectionScreen 
            boxes={boxes}
            selectedBoxIds={selectedBoxIds}
            setSelectedBoxIds={setSelectedBoxIds}
            onStartPlaying={handleStartPlaying}
            onGoToStore={handleGoToStore}
            user={user}
            collectionSeries={collectionSeries}
            onOpenCompleteGuide={() => {
              setBookletImages(BOOKLET_IMAGES)
              setBookletTitle("Unscripted Conversations Guide")
              setBookletOpen(true)
            }}
            onOpenQuickGuide={() => {
              setBookletImages(BOOKLET_30SECS)
              setBookletTitle("Quick Guide — 30 Second Read")
              setBookletOpen(true)
            }}
          />
        )}
        
        {view === 'store' && (
          <StoreScreen
            boxes={boxes}
            plans={plans}
            onPurchaseBox={handlePurchaseBox}
            onSubscribe={handleSubscribe}
            onBack={() => { setView('game'); setGameStarted(false) }}
            user={user}
            hasAllAccess={hasAllAccess}
          />
        )}
        
        {view === 'game' && gameStarted && (
          <GamePlayView 
            blackDeck={blackDeck}
            setBlackDeck={setBlackDeck}
            whiteDeck={whiteDeck}
            setWhiteDeck={setWhiteDeck}
            allCards={allCards}
            currentBlack={currentBlack}
            setCurrentBlack={setCurrentBlack}
            currentWhite={currentWhite}
            setCurrentWhite={setCurrentWhite}
            blackFlipped={blackFlipped}
            setBlackFlipped={setBlackFlipped}
            whiteFlipped={whiteFlipped}
            setWhiteFlipped={setWhiteFlipped}
            onBackToBoxes={handleBackToBoxes}
            onNextPlayer={handleNextPlayer}
            onOpenCompleteGuide={() => {
              setBookletImages(BOOKLET_IMAGES)
              setBookletTitle("Unscripted Conversations Guide")
              setBookletOpen(true)
            }}
            onOpenQuickGuide={() => {
              setBookletImages(BOOKLET_30SECS)
              setBookletTitle("Quick Guide — 30 Second Read")
              setBookletOpen(true)
            }}
            isPlayingSample={selectedBoxIds.length > 0 && boxes.filter(b => selectedBoxIds.includes(b.id)).every(b => b.is_sample)}
            totalCardsInDeck={allCards.length}
            onGoToStore={() => setView('store')}
            onResetGame={() => {
              // Reset the game to start again with all sample cards
              handleStartPlaying()
            }}
          />
        )}
        
        {view === 'purchases' && (
          <div className="max-w-4xl mx-auto p-8">
            <h2 className="text-3xl font-serif text-gray-900 mb-8">My Purchases</h2>
            {purchases.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No purchases yet.</p>
                <Button onClick={() => setView('store')} variant="outline">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Browse Store
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {purchases.map(purchase => (
                  <Card key={purchase.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: purchase.boxes?.color === '#FFFFFF' ? '#F3F4F6' : purchase.boxes?.color || '#9CA3AF' }}
                          >
                            <Package className={`w-5 h-5 ${purchase.boxes?.color === '#000000' || purchase.boxes?.color === '#D12128' ? 'text-white' : 'text-gray-600'}`} />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {purchase.purchase_type === 'all_access' ? 'All Access Subscription' : purchase.boxes?.name || 'Unknown Box'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {purchase.purchase_type === 'one_time' ? 'One-time purchase' : 
                               purchase.purchase_type === 'all_access' ? 'Subscription' : 
                               purchase.purchase_type}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Purchased: {new Date(purchase.created_at).toLocaleDateString()}</span>
                          {purchase.expires_at && (
                            <span>
                              {new Date(purchase.expires_at) > new Date() 
                                ? `Renews: ${new Date(purchase.expires_at).toLocaleDateString()}`
                                : `Expired: ${new Date(purchase.expires_at).toLocaleDateString()}`
                              }
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {purchase.is_active ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Active</span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Inactive</span>
                        )}
                        
                        {purchase.stripe_subscription_id && purchase.is_active && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => openCancelDialog(purchase)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Profile Screen */}
        {view === 'profile' && (
          <ProfileScreen 
            user={user}
            purchases={purchases}
            onSignOut={handleSignOut}
            onCancelSubscription={openCancelDialog}
            onSignIn={() => setAuthOpen(true)}
            isAdmin={isAdmin}
            onGoToAdmin={() => setView('admin')}
          />
        )}
        
        {view === 'admin' && isAdmin && (
          <div className="max-w-6xl mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
              <button 
                onClick={() => setView('home')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
                <span className="font-medium">Close Admin</span>
              </button>
              <h2 className="text-xl font-semibold text-gray-900">Admin Panel</h2>
              <div className="w-24" /> {/* Spacer for alignment */}
            </div>
            
            {/* Admin Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto pb-px">
              {['app', 'series', 'boxes', 'piles', 'mockups', 'cards', 'prices', 'bundles'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setAdminTab(tab)}
                  className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    adminTab === tab 
                      ? 'border-red-600 text-red-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'series' ? 'Collection Series' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* APP CONFIG TAB */}
            {adminTab === 'app' && (
              <div className="space-y-6">
                {adminAppConfigLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading app config...</div>
                ) : adminAppConfig ? (
                  <>
                    {/* Basic Info */}
                    <Card className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">App Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block">App Name</Label>
                          <Input 
                            value={adminAppConfig.name || ''} 
                            onChange={(e) => setAdminAppConfig({...adminAppConfig, name: e.target.value})}
                            placeholder="AS WE ALL ARE"
                          />
                        </div>
                        <div>
                          <Label className="mb-2 block">Build Version</Label>
                          <Input 
                            value={adminAppConfig.build_version || ''} 
                            onChange={(e) => setAdminAppConfig({...adminAppConfig, build_version: e.target.value})}
                            placeholder="1.0.0"
                          />
                        </div>
                        <div>
                          <Label className="mb-2 block">Title</Label>
                          <Input 
                            value={adminAppConfig.title || ''} 
                            onChange={(e) => setAdminAppConfig({...adminAppConfig, title: e.target.value})}
                            placeholder="Unscripted Conversations"
                          />
                        </div>
                        <div>
                          <Label className="mb-2 block">Tagline</Label>
                          <Input 
                            value={adminAppConfig.tagline || ''} 
                            onChange={(e) => setAdminAppConfig({...adminAppConfig, tagline: e.target.value})}
                            placeholder="A therapeutic conversational card game"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label className="mb-2 block">Promise</Label>
                          <Input 
                            value={adminAppConfig.promise || ''} 
                            onChange={(e) => setAdminAppConfig({...adminAppConfig, promise: e.target.value})}
                            placeholder="Know more about each other..."
                          />
                        </div>
                      </div>
                    </Card>
                    
                    {/* Admin Emails */}
                    <Card className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-2">Admin Users</h3>
                      <p className="text-sm text-gray-500 mb-4">Email addresses that have admin access to this panel.</p>
                      <div>
                        <Label className="mb-2 block">Admin Emails (one per line)</Label>
                        <textarea 
                          className="w-full min-h-[100px] p-3 border rounded-md text-sm font-mono"
                          value={adminAppConfig.admin_emails || ''} 
                          onChange={(e) => setAdminAppConfig({...adminAppConfig, admin_emails: e.target.value})}
                          placeholder="admin@example.com&#10;manager@example.com"
                        />
                        <p className="text-xs text-gray-400 mt-1">Enter one email address per line</p>
                      </div>
                    </Card>
                    
                    {/* Content Sections */}
                    <Card className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Content (Markdown Supported)</h3>
                      <div className="space-y-4">
                        <div>
                          <Label className="mb-2 block">Header Text</Label>
                          <textarea 
                            className="w-full min-h-[100px] p-3 border rounded-md text-sm font-mono"
                            value={adminAppConfig.header_text || ''} 
                            onChange={(e) => setAdminAppConfig({...adminAppConfig, header_text: e.target.value})}
                            placeholder="## Welcome..."
                          />
                        </div>
                        <div>
                          <Label className="mb-2 block">Body Text</Label>
                          <textarea 
                            className="w-full min-h-[200px] p-3 border rounded-md text-sm font-mono"
                            value={adminAppConfig.body_text || ''} 
                            onChange={(e) => setAdminAppConfig({...adminAppConfig, body_text: e.target.value})}
                            placeholder="### How It Works..."
                          />
                        </div>
                        <div>
                          <Label className="mb-2 block">Footer Text</Label>
                          <Input 
                            value={adminAppConfig.footer_text || ''} 
                            onChange={(e) => setAdminAppConfig({...adminAppConfig, footer_text: e.target.value})}
                            placeholder="Made with ❤️..."
                          />
                        </div>
                      </div>
                    </Card>
                    
                    {/* Theme Colors */}
                    <Card className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Theme Colors</h3>
                      <p className="text-sm text-gray-500 mb-4">These colors will be used throughout the app for buttons, active states, and highlights.</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="mb-2 block text-sm">Primary</Label>
                          <div className="flex gap-2 items-center">
                            <input 
                              type="color"
                              value={adminAppConfig.primary_color || '#D12128'}
                              onChange={(e) => setAdminAppConfig({...adminAppConfig, primary_color: e.target.value})}
                              className="w-10 h-10 rounded cursor-pointer border"
                            />
                            <Input 
                              value={adminAppConfig.primary_color || '#D12128'}
                              onChange={(e) => setAdminAppConfig({...adminAppConfig, primary_color: e.target.value})}
                              className="flex-1 font-mono text-sm"
                              placeholder="#D12128"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="mb-2 block text-sm">Secondary</Label>
                          <div className="flex gap-2 items-center">
                            <input 
                              type="color"
                              value={adminAppConfig.secondary_color || '#1F2937'}
                              onChange={(e) => setAdminAppConfig({...adminAppConfig, secondary_color: e.target.value})}
                              className="w-10 h-10 rounded cursor-pointer border"
                            />
                            <Input 
                              value={adminAppConfig.secondary_color || '#1F2937'}
                              onChange={(e) => setAdminAppConfig({...adminAppConfig, secondary_color: e.target.value})}
                              className="flex-1 font-mono text-sm"
                              placeholder="#1F2937"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="mb-2 block text-sm">Accent</Label>
                          <div className="flex gap-2 items-center">
                            <input 
                              type="color"
                              value={adminAppConfig.accent_color || '#6B7280'}
                              onChange={(e) => setAdminAppConfig({...adminAppConfig, accent_color: e.target.value})}
                              className="w-10 h-10 rounded cursor-pointer border"
                            />
                            <Input 
                              value={adminAppConfig.accent_color || '#6B7280'}
                              onChange={(e) => setAdminAppConfig({...adminAppConfig, accent_color: e.target.value})}
                              className="flex-1 font-mono text-sm"
                              placeholder="#6B7280"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="mb-2 block text-sm">Danger</Label>
                          <div className="flex gap-2 items-center">
                            <input 
                              type="color"
                              value={adminAppConfig.danger_color || '#DC2626'}
                              onChange={(e) => setAdminAppConfig({...adminAppConfig, danger_color: e.target.value})}
                              className="w-10 h-10 rounded cursor-pointer border"
                            />
                            <Input 
                              value={adminAppConfig.danger_color || '#DC2626'}
                              onChange={(e) => setAdminAppConfig({...adminAppConfig, danger_color: e.target.value})}
                              className="flex-1 font-mono text-sm"
                              placeholder="#DC2626"
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                    
                    {/* Social Links */}
                    <Card className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Social Links</h3>
                      
                      {/* Add Social Form */}
                      <div className="flex gap-2 mb-4">
                        <div className="flex items-center gap-2 px-3 h-10 border rounded-md bg-white">
                          <SocialIcon platform={adminAppSocialForm.platform} size={18} colored />
                          <SocialPlatformSelector
                            value={adminAppSocialForm.platform}
                            onChange={(platform) => setAdminAppSocialForm({...adminAppSocialForm, platform})}
                            className="border-0 p-0 bg-transparent"
                          />
                        </div>
                        <Input 
                          className="flex-1"
                          value={adminAppSocialForm.url}
                          onChange={(e) => setAdminAppSocialForm({...adminAppSocialForm, url: e.target.value})}
                          placeholder={getPlatformConfig(adminAppSocialForm.platform)?.placeholder || 'https://...'}
                        />
                        <Button onClick={handleAddSocialLink} className="bg-red-600 hover:bg-red-700 text-white">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Existing Socials with Reorder */}
                      {adminAppConfig.socials?.length > 0 ? (
                        <ReorderableList
                          items={adminAppConfig.socials}
                          onReorder={async (newItems) => {
                            // Update local state immediately
                            setAdminAppConfig({...adminAppConfig, socials: newItems})
                            // Update each item's display_order in the database
                            for (const item of newItems) {
                              try {
                                await fetch('/api/admin/app-config/socials', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: item.id, display_order: item.display_order })
                                })
                              } catch (err) {
                                console.error('Failed to update order:', err)
                              }
                            }
                            toast({ title: 'Order updated' })
                          }}
                          renderItem={(social) => (
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <SocialIcon platform={social.name} size={20} colored />
                              <span className="font-medium text-sm">{social.name}</span>
                              <span className="text-gray-500 text-sm truncate flex-1">{social.url}</span>
                              <button
                                onClick={() => handleDeleteSocialLink(social.id)}
                                className="text-red-600 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        />
                      ) : (
                        <p className="text-gray-500 text-sm">No social links added yet</p>
                      )}
                    </Card>
                    
                    {/* Save Button */}
                    <div className="flex justify-end">
                      <Button onClick={handleSaveAppConfig} className="bg-red-600 hover:bg-red-700 text-white">
                        Save App Config
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">Failed to load app config</div>
                )}
              </div>
            )}

            {/* SERIES TAB */}
            {adminTab === 'series' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="sr-only">Collection Series</h3>
                  <Button onClick={() => {
                    setEditingSeries(null)
                    setSeriesForm({ id: '', name: '', description: '', displayOrder: 0, isActive: true })
                    setShowSeriesForm(true)
                  }} className="bg-red-600 hover:bg-red-700 text-white" size="sm">
                    <Plus className="w-4 h-4 mr-2" />Add Series
                  </Button>
                </div>
                
                {showSeriesForm && (
                  <Card className="p-6 mb-6">
                    <h4 className="font-medium mb-4">{editingSeries ? 'Edit Series' : 'New Series'}</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>ID (slug)</Label>
                        <Input value={seriesForm.id} onChange={(e) => setSeriesForm({ ...seriesForm, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })} placeholder="e.g., unscripted_conversations" className="mt-1" disabled={!!editingSeries} />
                      </div>
                      <div>
                        <Label>Name</Label>
                        <Input value={seriesForm.name} onChange={(e) => setSeriesForm({ ...seriesForm, name: e.target.value })} placeholder="e.g., Unscripted Conversations" className="mt-1" />
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Description</Label>
                        <Input value={seriesForm.description} onChange={(e) => setSeriesForm({ ...seriesForm, description: e.target.value })} placeholder="Brief description" className="mt-1" />
                      </div>
                      <div>
                        <Label>Display Order</Label>
                        <Input type="number" value={seriesForm.displayOrder} onChange={(e) => setSeriesForm({ ...seriesForm, displayOrder: parseInt(e.target.value) || 0 })} className="mt-1" />
                      </div>
                      <div className="flex items-center gap-4">
                        <Label>Active</Label>
                        <Switch checked={seriesForm.isActive} onCheckedChange={(checked) => setSeriesForm({ ...seriesForm, isActive: checked })} />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleSaveSeries} className="bg-red-600 hover:bg-red-700 text-white">{editingSeries ? 'Update' : 'Create'}</Button>
                      <Button onClick={() => { setShowSeriesForm(false); setEditingSeries(null) }} variant="outline">Cancel</Button>
                    </div>
                  </Card>
                )}
                
                <div className="space-y-2">
                  {adminSeries.map(s => (
                    <Card key={s.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{s.name}</span>
                            <span className="text-xs text-gray-400">({s.id})</span>
                            {!s.isActive && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Inactive</span>}
                          </div>
                          <p className="text-sm text-gray-500">{s.description}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button onClick={() => { setEditingSeries(s); setSeriesForm(s); setShowSeriesForm(true) }} size="sm" variant="ghost"><Edit className="w-4 h-4" /></Button>
                          <Button onClick={() => { if(confirm('Delete this series?')) handleDeleteSeries(s.id) }} size="sm" variant="ghost" className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* BOXES TAB */}
            {adminTab === 'boxes' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="sr-only">Boxes (Decks)</h3>
                  <Button onClick={() => {
                    setEditingBox(null)
                    setBoxForm({ id: '', name: '', description: '', descriptionShort: '', tagline: '', topicsText: '', priceId: '', color: '#000000', colorPaletteText: '', displayOrder: 0, isSample: false, fullBoxId: '', isActive: true, collectionSeriesId: '' })
                    setShowBoxForm(true)
                  }} className="bg-red-600 hover:bg-red-700 text-white" size="sm">
                    <Plus className="w-4 h-4 mr-2" />Add Box
                  </Button>
                </div>
                
                {showBoxForm && (
                  <Card className="p-6 mb-6">
                    <h4 className="font-medium mb-4">{editingBox ? 'Edit Box' : 'New Box'}</h4>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label>ID (slug/folder name)</Label>
                        <Input 
                          value={boxForm.id} 
                          onChange={(e) => setBoxForm({ ...boxForm, id: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} 
                          placeholder="e.g., white-box-108" 
                          className="mt-1" 
                          disabled={!!editingBox}
                        />
                        <p className="text-xs text-gray-400 mt-1">Used as folder name for card images</p>
                      </div>
                      <div>
                        <Label>Name</Label>
                        <Input value={boxForm.name} onChange={(e) => setBoxForm({ ...boxForm, name: e.target.value })} placeholder="e.g., White Box: Level 1" className="mt-1" />
                      </div>
                      <div>
                        <Label>Collection Series</Label>
                        <select value={boxForm.collectionSeriesId || ''} onChange={(e) => setBoxForm({ ...boxForm, collectionSeriesId: e.target.value || null })} className="w-full mt-1 p-2 border rounded-md">
                          <option value="">-- Select Series --</option>
                          {adminSeries.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label>Price</Label>
                        <select value={boxForm.priceId || ''} onChange={(e) => setBoxForm({ ...boxForm, priceId: e.target.value || null })} className="w-full mt-1 p-2 border rounded-md">
                          <option value="">-- No Price (Free/Sample) --</option>
                          {adminPrices.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.label} - ${p.promo_enabled && p.promo_amount ? p.promo_amount : p.amount}
                              {p.promo_enabled && p.promo_amount && ` (was $${p.amount})`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Description</Label>
                        <Input value={boxForm.description} onChange={(e) => setBoxForm({ ...boxForm, description: e.target.value })} placeholder="Full description" className="mt-1" />
                      </div>
                      <div>
                        <Label>Short Description</Label>
                        <Input value={boxForm.descriptionShort} onChange={(e) => setBoxForm({ ...boxForm, descriptionShort: e.target.value })} placeholder="e.g., 108 cards" className="mt-1" />
                      </div>
                      <div>
                        <Label>Tagline</Label>
                        <Input value={boxForm.tagline} onChange={(e) => setBoxForm({ ...boxForm, tagline: e.target.value })} placeholder="e.g., Level 1 — Life" className="mt-1" />
                      </div>
                      <div>
                        <Label>Topics (comma-separated)</Label>
                        <Input value={boxForm.topicsText} onChange={(e) => setBoxForm({ ...boxForm, topicsText: e.target.value })} placeholder="Life, Growth, Dreams" className="mt-1" />
                      </div>
                      <div>
                        <Label>Primary Color</Label>
                        <div className="flex gap-2 mt-1">
                          <Input type="color" value={boxForm.color || '#000000'} onChange={(e) => setBoxForm({ ...boxForm, color: e.target.value })} className="w-16 h-10" />
                          <Input value={boxForm.color || '#000000'} onChange={(e) => setBoxForm({ ...boxForm, color: e.target.value })} className="flex-1" placeholder="#000000" />
                        </div>
                      </div>
                      <div>
                        <Label>Color Palette (comma-separated hex)</Label>
                        <Input value={boxForm.colorPaletteText} onChange={(e) => setBoxForm({ ...boxForm, colorPaletteText: e.target.value })} placeholder="#FF0000, #00FF00, #0000FF" className="mt-1" />
                      </div>
                      <div>
                        <Label>Display Order</Label>
                        <Input type="number" value={boxForm.displayOrder} onChange={(e) => setBoxForm({ ...boxForm, displayOrder: parseInt(e.target.value) || 0 })} className="mt-1" />
                      </div>
                      <div className="flex items-center gap-4">
                        <Label>Sample Box</Label>
                        <Switch 
                          checked={boxForm.isSample} 
                          onCheckedChange={(checked) => {
                            setBoxForm({ 
                              ...boxForm, 
                              isSample: checked,
                              fullBoxId: checked ? boxForm.fullBoxId : ''  // Clear fullBoxId if not sample
                            })
                          }} 
                        />
                        <span className="text-xs text-gray-500">
                          {boxForm.isSample ? 'Free sample box' : 'Paid/Full box'}
                        </span>
                      </div>
                      {/* Related Full Box dropdown - only visible when is_sample is true */}
                      {boxForm.isSample && (
                        <div>
                          <Label>Related Full Box</Label>
                          <select 
                            value={boxForm.fullBoxId} 
                            onChange={(e) => setBoxForm({ ...boxForm, fullBoxId: e.target.value })} 
                            className="w-full mt-1 p-2 border rounded-md"
                          >
                            <option value="">-- Select full version box --</option>
                            {adminBoxes
                              .filter(b => !b.is_sample && b.id !== boxForm.id)  // Only non-sample boxes, exclude current
                              .map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                              ))
                            }
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            When users purchase this full box, the sample will be hidden.
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        <Label>Active</Label>
                        <Switch checked={boxForm.isActive} onCheckedChange={(checked) => setBoxForm({ ...boxForm, isActive: checked })} />
                      </div>
                    </div>
                    
                    {/* Buttons - moved above bulk upload */}
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleSaveBox} className="bg-red-600 hover:bg-red-700 text-white">{editingBox ? 'Update' : 'Create'}</Button>
                      <Button onClick={() => { setShowBoxForm(false); setEditingBox(null); setUploadResult(null); setBulkUploadPileId('') }} variant="outline">Cancel</Button>
                    </div>
                    
                    {/* Bulk Card Upload - Only when editing */}
                    {editingBox && (
                      <div className="mt-6 pt-6 border-t">
                        <h5 className="font-medium mb-4 flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          Bulk Upload Cards (ZIP)
                        </h5>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label>Pile (Black/White)</Label>
                            <select 
                              value={bulkUploadPileId} 
                              onChange={(e) => setBulkUploadPileId(e.target.value)} 
                              className="w-full mt-1 p-2 border rounded-md"
                            >
                              <option value="">-- Select Pile --</option>
                              {adminPiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <Label>ZIP File (PNG/JPG images)</Label>
                            <div className="mt-1 relative">
                              <input
                                type="file"
                                accept=".zip"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleBulkUploadCards(file)
                                }}
                                disabled={uploadingCards || !bulkUploadPileId}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                              />
                              <Button 
                                variant="outline" 
                                disabled={uploadingCards || !bulkUploadPileId}
                                className="w-full"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                {uploadingCards ? 'Uploading...' : 'Select ZIP File'}
                              </Button>
                            </div>
                          </div>
                        </div>
                        {uploadResult && (
                          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-green-800 font-medium">✓ {uploadResult.created} cards created</p>
                            <p className="text-sm text-green-600">{uploadResult.message}</p>
                            {uploadResult.errors && uploadResult.errors.length > 0 && (
                              <div className="mt-2 text-sm text-red-600">
                                <p>Errors:</p>
                                {uploadResult.errors.map((err, i) => (
                                  <p key={i}>- {err.file}: {err.error}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Upload a ZIP file containing PNG/JPG images. Files will be stored at: 
                          <code className="bg-gray-100 px-1 rounded">
                            /cards/{editingBox.id}/{bulkUploadPileId ? adminPiles.find(p => p.id === bulkUploadPileId)?.slug || '{pile_slug}' : '{pile_slug}'}/{'{MD5}.{ext}'}
                          </code>
                        </p>
                      </div>
                    )}
                  </Card>
                )}
                
                <div className="space-y-2">
                  {adminBoxes.map(box => {
                    const linkedPrice = box.prices
                    const displayPrice = linkedPrice ? (linkedPrice.promo_enabled && linkedPrice.promo_amount ? linkedPrice.promo_amount : linkedPrice.amount) : null
                    const cardStats = box.cardStats || { total: 0, byPile: {} }
                    
                    return (
                      <Card key={box.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: box.color || '#ccc' }}>
                              <Package className={`w-5 h-5 ${box.color === '#000000' || box.color === '#D12128' ? 'text-white' : 'text-gray-600'}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{box.name}</span>
                                {displayPrice !== null && <span className="text-sm font-bold text-green-600">${displayPrice}</span>}
                                {linkedPrice?.promo_enabled && linkedPrice?.promo_amount && (
                                  <span className="text-xs line-through text-gray-400">${linkedPrice.amount}</span>
                                )}
                                {box.is_sample && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">Sample</span>}
                                {box.full_box_id && (
                                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                    → {adminBoxes.find(b => b.id === box.full_box_id)?.name || box.full_box_id}
                                  </span>
                                )}
                                {!box.is_active && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Inactive</span>}
                              </div>
                              <p className="text-sm text-gray-500">{box.tagline || box.description_short}</p>
                              <p className="text-xs text-gray-400">
                                Series: {box.collection_series?.name || 'N/A'} | 
                                Price: {linkedPrice?.label || 'Free'} | 
                                ID: {box.id}
                              </p>
                              
                              {/* Card Stats per Pile */}
                              <div className="mt-2 flex flex-wrap gap-2 items-center">
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-800">
                                  Total: {cardStats.total}
                                </span>
                                {Object.entries(cardStats.byPile).map(([pileId, pileInfo]) => (
                                  <div key={pileId} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                    <span>{pileInfo.pileName}: {pileInfo.count}</span>
                                    <Button 
                                      onClick={async () => {
                                        if (confirm(`Download ${pileInfo.count} ${pileInfo.pileName} cards as ZIP?`)) {
                                          toast({ title: 'Preparing download...' })
                                          try {
                                            const res = await fetch('/api/admin/download-cards', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ boxId: box.id, pileId })
                                            })
                                            if (res.ok) {
                                              const blob = await res.blob()
                                              const url = URL.createObjectURL(blob)
                                              const a = document.createElement('a')
                                              a.href = url
                                              a.download = `${box.id}_${pileInfo.pileSlug}_cards.zip`
                                              a.click()
                                              URL.revokeObjectURL(url)
                                              toast({ title: `Downloaded ${pileInfo.count} cards as ZIP` })
                                            } else {
                                              const data = await res.json()
                                              toast({ title: data.error || 'Download failed', variant: 'destructive' })
                                            }
                                          } catch (err) {
                                            toast({ title: 'Download failed', variant: 'destructive' })
                                          }
                                        }
                                      }}
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-5 w-5 p-0 hover:bg-blue-200"
                                      title="Download cards as ZIP"
                                    >
                                      <Download className="w-3 h-3" />
                                    </Button>
                                    <Button 
                                      onClick={async () => {
                                        if (confirm(`Delete ALL ${pileInfo.count} ${pileInfo.pileName} cards from ${box.name}?`)) {
                                          const res = await fetch('/api/admin/cards/bulk-delete', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ boxId: box.id, pileId })
                                          })
                                          if (res.ok) {
                                            toast({ title: `Deleted ${pileInfo.count} cards` })
                                            loadAdminBoxes()
                                            loadAdminCards()
                                          } else {
                                            toast({ title: 'Delete failed', variant: 'destructive' })
                                          }
                                        }
                                      }}
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-5 w-5 p-0 text-red-600 hover:bg-red-100"
                                      title="Delete all cards"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button onClick={() => { 
                              setEditingBox(box)
                              setBoxForm({
                                id: box.id || '',
                                name: box.name,
                                description: box.description || '',
                                descriptionShort: box.description_short || '',
                                tagline: box.tagline || '',
                                topicsText: (box.topics || []).join(', '),
                                collectionSeriesId: box.collection_series_id || '',
                                priceId: box.price_id || '',
                                color: box.color || '#000000',
                                colorPaletteText: (box.color_palette || []).join(', '),
                                isSample: box.is_sample || false,
                                fullBoxId: box.full_box_id || '',
                                isActive: box.is_active !== false,
                                displayOrder: box.display_order || 0
                              })
                              setShowBoxForm(true)
                            }} size="sm" variant="ghost"><Edit className="w-4 h-4" /></Button>
                            <Button onClick={() => { if(confirm('Delete this box?')) handleDeleteBox(box.id) }} size="sm" variant="ghost" className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* PILES TAB */}
            {adminTab === 'piles' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="sr-only">Piles (Card Backs)</h3>
                  <div className="flex gap-2">
                    <Button onClick={loadAdminPiles} variant="outline" size="sm">
                      <RefreshCcw className="w-4 h-4 mr-2" />Refresh
                    </Button>
                    <Button onClick={() => {
                      setEditingPile(null)
                      setPileForm({ id: '', slug: '', name: '', imagePath: '', collectionSeriesId: '', displayOrder: 0, isActive: true })
                      setShowPileForm(true)
                    }} className="bg-red-600 hover:bg-red-700 text-white" size="sm">
                      <Plus className="w-4 h-4 mr-2" />Add Pile
                    </Button>
                  </div>
                </div>
                
                {showPileForm && (
                  <Card className="p-6 mb-6">
                    <h4 className="font-medium mb-4">{editingPile ? 'Edit Pile' : 'New Pile'}</h4>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label>Name</Label>
                        <Input value={pileForm.name} onChange={(e) => setPileForm({ ...pileForm, name: e.target.value })} placeholder="e.g., Black" className="mt-1" />
                      </div>
                      <div>
                        <Label>Slug</Label>
                        <Input 
                          value={pileForm.slug} 
                          onChange={(e) => setPileForm({ ...pileForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })} 
                          placeholder="e.g., black" 
                          className="mt-1" 
                          disabled={!!editingPile}
                        />
                      </div>
                      <div>
                        <Label>Collection Series</Label>
                        <select value={pileForm.collectionSeriesId || ''} onChange={(e) => {
                          const seriesId = e.target.value || null
                          // Auto-generate image path when series changes
                          let newImagePath = pileForm.imagePath
                          if (seriesId && pileForm.slug) {
                            newImagePath = `collections/${seriesId}/piles/${pileForm.slug}.png`
                          }
                          setPileForm({ ...pileForm, collectionSeriesId: seriesId, imagePath: newImagePath })
                        }} className="w-full mt-1 p-2 border rounded-md">
                          <option value="">-- Select Series --</option>
                          {adminSeries.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <Label>Image Path (auto-generated from series + slug)</Label>
                        <div className="flex gap-2 mt-1">
                          <Input 
                            value={pileForm.imagePath} 
                            onChange={(e) => setPileForm({ ...pileForm, imagePath: e.target.value })} 
                            placeholder="collections/{series}/piles/{slug}.png" 
                            className="flex-1"
                          />
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                
                                if (!pileForm.slug) {
                                  toast({ title: 'Please enter a slug first', variant: 'destructive' })
                                  return
                                }
                                
                                setUploadingPileImage(true)
                                // Generate folder based on series
                                const folder = pileForm.collectionSeriesId 
                                  ? `collections/${pileForm.collectionSeriesId}/piles`
                                  : 'collections/piles'
                                
                                // Use slug as filename
                                const extension = file.name.split('.').pop() || 'png'
                                const filename = `${pileForm.slug}.${extension}`
                                
                                const formData = new FormData()
                                formData.append('file', file)
                                formData.append('folder', folder)
                                formData.append('filename', filename)
                                
                                try {
                                  const response = await fetch('/api/admin/upload', { method: 'POST', body: formData })
                                  const data = await response.json()
                                  console.log('[PILE UPLOAD] Response:', data)
                                  if (data.path || data.imagePath || data.image_path) {
                                    const newPath = data.path || data.imagePath || data.image_path
                                    setPileForm(prev => ({ ...prev, imagePath: newPath }))
                                    toast({ title: 'Image uploaded! Click Save to persist changes.' })
                                  } else if (data.error) {
                                    toast({ title: data.error, variant: 'destructive' })
                                  } else {
                                    console.log('[PILE UPLOAD] Unexpected response:', data)
                                    toast({ title: 'Upload completed but no path returned', variant: 'destructive' })
                                  }
                                } catch (err) {
                                  console.error('[PILE UPLOAD] Error:', err)
                                  toast({ title: 'Upload failed', variant: 'destructive' })
                                }
                                setUploadingPileImage(false)
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              disabled={uploadingPileImage}
                            />
                            <Button variant="outline" disabled={uploadingPileImage}>
                              <Image className="w-4 h-4 mr-2" />
                              {uploadingPileImage ? 'Uploading...' : 'Upload'}
                            </Button>
                          </div>
                        </div>
                        {pileForm.imagePath && (
                          <div className="mt-2">
                            <img 
                              src={`/${pileForm.imagePath}`} 
                              alt="Pile preview" 
                              className="h-24 object-contain rounded border"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <Label>Display Order</Label>
                        <Input type="number" value={pileForm.displayOrder} onChange={(e) => setPileForm({ ...pileForm, displayOrder: parseInt(e.target.value) || 0 })} className="mt-1" />
                      </div>
                      <div className="flex items-center gap-4">
                        <Label>Active</Label>
                        <Switch checked={pileForm.isActive} onCheckedChange={(checked) => setPileForm({ ...pileForm, isActive: checked })} />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleSavePile} className="bg-red-600 hover:bg-red-700 text-white">{editingPile ? 'Update' : 'Create'}</Button>
                      <Button onClick={() => { setShowPileForm(false); setEditingPile(null) }} variant="outline">Cancel</Button>
                    </div>
                  </Card>
                )}
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {adminPiles.map(pile => {
                    // Extra debugging - log what we have
                    console.log('Rendering pile:', pile.name, 'seriesName:', pile.seriesName, 'imagePath:', pile.imagePath)
                    
                    return (
                      <Card key={pile.id} className="p-4">
                        <div className="flex gap-4">
                          <div className="w-20 h-28 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                            {pile.imagePath ? (
                              <img 
                                src={pile.imagePath.startsWith('/') ? pile.imagePath : `/${pile.imagePath}`} 
                                alt={pile.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { 
                                  console.error('Image load failed:', pile.imagePath)
                                  e.target.style.display = 'none'
                                  e.target.parentElement.innerHTML = '<span class="text-xs text-gray-400">No image</span>'
                                }}
                              />
                            ) : (
                              <span className="text-xs text-gray-400">No image</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{pile.name}</span>
                              {!pile.isActive && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Inactive</span>}
                            </div>
                            <p className="text-xs text-gray-500 mb-1">Slug: {pile.slug}</p>
                            <p className="text-xs text-gray-400">Series: {pile.seriesName || 'N/A'}</p>
                            <div className="flex gap-1 mt-2">
                              <Button 
                                onClick={() => { 
                                  setEditingPile(pile)
                                  setPileForm({
                                    id: pile.id,
                                    slug: pile.slug,
                                    name: pile.name,
                                    imagePath: pile.imagePath || '',
                                    collectionSeriesId: pile.collectionSeriesId || '',
                                    displayOrder: pile.displayOrder || 0,
                                    isActive: pile.isActive !== false
                                  })
                                  setShowPileForm(true)
                                }} 
                                size="sm" 
                                variant="ghost"
                              >
                                <Edit className="w-4 h-4 mr-1" /> Edit
                              </Button>
                              <Button onClick={() => { if(confirm('Delete this pile?')) handleDeletePile(pile.id) }} size="sm" variant="ghost" className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* MOCKUPS TAB */}
            {adminTab === 'mockups' && (
              <div>
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div>
                    <Label className="mb-2 block text-sm">Collection Series</Label>
                    <select 
                      value={mockupsSeriesFilter} 
                      onChange={(e) => {
                        setMockupsSeriesFilter(e.target.value)
                        setMockupsBoxId('')  // Reset box selection when series changes
                        setMockupsData({ mainImage: null, secondaryImage: null, cardMockups: [] })
                      }}
                      className="w-48 p-2 border rounded-md text-sm"
                    >
                      <option value="">All Series</option>
                      {adminSeries.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm">Box</Label>
                    <select 
                      value={mockupsBoxId} 
                      onChange={(e) => {
                        setMockupsBoxId(e.target.value)
                        loadMockups(e.target.value)
                      }}
                      className="w-64 p-2 border rounded-md text-sm"
                    >
                      <option value="">-- Select a box --</option>
                      {adminBoxes
                        .filter(box => !mockupsSeriesFilter || box.collection_series_id === mockupsSeriesFilter)
                        .map(box => (
                          <option key={box.id} value={box.id}>{box.name}</option>
                        ))}
                    </select>
                  </div>
                  
                  {mockupsBoxId && (
                    <div className="flex items-end gap-2">
                      <Button 
                        onClick={() => loadMockups(mockupsBoxId)} 
                        variant="outline" 
                        size="sm"
                        disabled={mockupsLoading}
                      >
                        <RefreshCcw className={`w-4 h-4 mr-2 ${mockupsLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                      <Button 
                        onClick={handleDownloadMockups} 
                        variant="outline" 
                        size="sm"
                        disabled={!mockupsData.mainImage && !mockupsData.secondaryImage && mockupsData.cardMockups.length === 0}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download All
                      </Button>
                      <Button 
                        onClick={() => handleDeleteMockup('all')} 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        disabled={!mockupsData.mainImage && !mockupsData.secondaryImage && mockupsData.cardMockups.length === 0}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete All
                      </Button>
                    </div>
                  )}
                </div>
                
                {!mockupsBoxId && (
                  <Card className="p-8 text-center text-gray-500">
                    <Image className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Select a box to manage its mockup images</p>
                  </Card>
                )}
                
                {mockupsBoxId && mockupsLoading && (
                  <Card className="p-8 text-center text-gray-500">
                    <RefreshCcw className="w-8 h-8 mx-auto mb-4 animate-spin text-gray-400" />
                    <p>Loading mockups...</p>
                  </Card>
                )}
                
                {mockupsBoxId && !mockupsLoading && (
                  <div className="space-y-6">
                    {/* Main & Secondary Images */}
                    <div className="grid sm:grid-cols-2 gap-6">
                      {/* Main Image */}
                      <Card className="p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium">Main Image (Hero)</h4>
                          {mockupsData.mainImage && (
                            <Button 
                              onClick={() => handleDeleteMockup('main')} 
                              size="sm" 
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        {mockupsData.mainImage ? (
                          <div className="relative">
                            <img 
                              src={mockupsData.mainImage.image_path} 
                              alt="Main mockup" 
                              className="w-full h-48 object-contain bg-gray-50 rounded-lg"
                            />
                            <p className="text-xs text-gray-400 mt-2 truncate">{mockupsData.mainImage.image_path}</p>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                            <Image className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm text-gray-500 mb-3">No main image</p>
                          </div>
                        )}
                        
                        <div className="mt-3">
                          <input 
                            type="file" 
                            accept=".png,.jpg,.jpeg,.webp"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleMockupUpload(e.target.files[0], 'BOX_MAIN')
                                e.target.value = ''
                              }
                            }}
                            className="hidden"
                            id="mockup-main-upload"
                          />
                          <label htmlFor="mockup-main-upload">
                            <Button asChild size="sm" variant="outline" className="w-full cursor-pointer">
                              <span><Upload className="w-4 h-4 mr-2" />{mockupsData.mainImage ? 'Replace' : 'Upload'} Main Image</span>
                            </Button>
                          </label>
                        </div>
                      </Card>
                      
                      {/* Secondary Image */}
                      <Card className="p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium">Secondary Image</h4>
                          {mockupsData.secondaryImage && (
                            <Button 
                              onClick={() => handleDeleteMockup('secondary')} 
                              size="sm" 
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        {mockupsData.secondaryImage ? (
                          <div className="relative">
                            <img 
                              src={mockupsData.secondaryImage.image_path} 
                              alt="Secondary mockup" 
                              className="w-full h-48 object-contain bg-gray-50 rounded-lg"
                            />
                            <p className="text-xs text-gray-400 mt-2 truncate">{mockupsData.secondaryImage.image_path}</p>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                            <Image className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm text-gray-500 mb-3">No secondary image</p>
                          </div>
                        )}
                        
                        <div className="mt-3">
                          <input 
                            type="file" 
                            accept=".png,.jpg,.jpeg,.webp"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleMockupUpload(e.target.files[0], 'BOX_SECONDARY')
                                e.target.value = ''
                              }
                            }}
                            className="hidden"
                            id="mockup-secondary-upload"
                          />
                          <label htmlFor="mockup-secondary-upload">
                            <Button asChild size="sm" variant="outline" className="w-full cursor-pointer">
                              <span><Upload className="w-4 h-4 mr-2" />{mockupsData.secondaryImage ? 'Replace' : 'Upload'} Secondary Image</span>
                            </Button>
                          </label>
                        </div>
                      </Card>
                    </div>
                    
                    {/* Card Mockups */}
                    <Card className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h4 className="font-medium">Card Mockups</h4>
                          <p className="text-sm text-gray-500">{mockupsData.cardMockups.length} images</p>
                        </div>
                        <div className="flex gap-2">
                          {mockupsData.cardMockups.length > 0 && (
                            <Button 
                              onClick={() => handleDeleteMockup('cards')} 
                              size="sm" 
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete All Cards
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Upload ZIP */}
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">
                          Upload a ZIP file containing card mockup images. This will <strong>replace all existing</strong> card mockups. Order is determined by filename sorting.
                        </p>
                        <input 
                          type="file" 
                          accept=".zip"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleMockupUpload(e.target.files[0], 'CARD_ZIP')
                              e.target.value = ''
                            }
                          }}
                          className="hidden"
                          id="mockup-cards-zip-upload"
                        />
                        <label htmlFor="mockup-cards-zip-upload">
                          <Button asChild size="sm" className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">
                            <span><Upload className="w-4 h-4 mr-2" />Upload ZIP of Card Mockups</span>
                          </Button>
                        </label>
                      </div>
                      
                      {/* Card Mockups Grid */}
                      {mockupsData.cardMockups.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {mockupsData.cardMockups.map((mockup) => (
                            <div 
                              key={mockup.id} 
                              className="relative group border rounded-lg overflow-hidden bg-gray-50"
                              title={mockup.image_path}
                            >
                              <img 
                                src={mockup.image_path} 
                                alt={`Card mockup ${mockup.display_order}`}
                                className="w-full aspect-[3/4] object-cover"
                              />
                              {/* Order badge - click to edit */}
                              {editingMockupOrder === mockup.id ? (
                                <input
                                  type="number"
                                  autoFocus
                                  defaultValue={mockup.display_order}
                                  onBlur={(e) => {
                                    const newOrder = parseInt(e.target.value)
                                    if (!isNaN(newOrder) && newOrder !== mockup.display_order) {
                                      handleUpdateMockupOrder(mockup.id, newOrder)
                                    } else {
                                      setEditingMockupOrder(null)
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const newOrder = parseInt(e.target.value)
                                      if (!isNaN(newOrder) && newOrder !== mockup.display_order) {
                                        handleUpdateMockupOrder(mockup.id, newOrder)
                                      } else {
                                        setEditingMockupOrder(null)
                                      }
                                    } else if (e.key === 'Escape') {
                                      setEditingMockupOrder(null)
                                    }
                                  }}
                                  className="absolute top-1 left-1 w-12 text-xs p-1 rounded bg-white border shadow-sm text-center"
                                />
                              ) : (
                                <button
                                  onClick={() => setEditingMockupOrder(mockup.id)}
                                  className="absolute top-1 left-1 bg-black/70 hover:bg-black text-white text-xs px-2 py-1 rounded cursor-pointer transition-colors"
                                  title="Click to edit order"
                                >
                                  #{mockup.display_order}
                                </button>
                              )}
                              {/* Delete button */}
                              <button
                                onClick={() => handleDeleteMockup(null, mockup.id)}
                                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                              {/* Filename */}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                                {mockup.image_path.split('/').pop()}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <Image className="w-12 h-12 mx-auto mb-2" />
                          <p>No card mockups uploaded yet</p>
                        </div>
                      )}
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* CARDS TAB */}
            {adminTab === 'cards' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="sr-only">Cards</h3>
                  <p className="text-sm text-gray-500">Cards are created via bulk ZIP upload in the Boxes tab</p>
                </div>
                
                {/* Cascading Filters */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex flex-wrap items-end gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Collection Series</Label>
                      <select 
                        value={adminSeriesFilter} 
                        onChange={(e) => {
                          setAdminSeriesFilter(e.target.value)
                          setAdminBoxFilter('')
                          setAdminPileFilter('')
                        }} 
                        className="mt-1 block p-2 border rounded-md min-w-[180px]"
                      >
                        <option value="">All Series</option>
                        {adminSeries.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Box</Label>
                      <select 
                        value={adminBoxFilter} 
                        onChange={(e) => {
                          setAdminBoxFilter(e.target.value)
                          setAdminPileFilter('')
                        }} 
                        className="mt-1 block p-2 border rounded-md min-w-[180px]"
                      >
                        <option value="">All Boxes</option>
                        {adminBoxes
                          .filter(box => !adminSeriesFilter || box.collectionSeriesId === adminSeriesFilter)
                          .map(box => <option key={box.id} value={box.id}>{box.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Pile</Label>
                      <select 
                        value={adminPileFilter} 
                        onChange={(e) => setAdminPileFilter(e.target.value)} 
                        className="mt-1 block p-2 border rounded-md min-w-[120px]"
                      >
                        <option value="">All Piles</option>
                        {adminPiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="text-sm text-gray-500 pb-2">
                      {(() => {
                        const filtered = adminCards.filter(card => {
                          if (adminSeriesFilter && card.seriesId !== adminSeriesFilter) return false
                          if (adminBoxFilter && card.boxId !== adminBoxFilter) return false
                          if (adminPileFilter && card.pileId !== adminPileFilter) return false
                          return true
                        })
                        return `${filtered.length} cards`
                      })()}
                    </div>
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {adminCards
                    .filter(card => {
                      if (adminSeriesFilter && card.seriesId !== adminSeriesFilter) return false
                      if (adminBoxFilter && card.boxId !== adminBoxFilter) return false
                      if (adminPileFilter && card.pileId !== adminPileFilter) return false
                      return true
                    })
                    .map(card => {
                      const imgPath = card.imagePath || card.image_path
                      const imgSrc = imgPath ? (imgPath.startsWith('/') ? imgPath : `/${imgPath}`) : null
                      return (
                        <Card key={card.id} className="p-3 overflow-hidden">
                          <div className="aspect-[3/4] mb-2 rounded overflow-hidden bg-gray-100 relative">
                            {imgSrc ? (
                              <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image className="w-8 h-8 text-gray-300" />
                              </div>
                            )}
                            {!card.isActive && (
                              <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded">Inactive</div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="px-1.5 py-0.5 text-xs rounded bg-blue-100 text-blue-800 font-medium">
                                {card.boxName || 'N/A'}
                              </span>
                              <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${card.pileName?.toLowerCase() === 'black' ? 'bg-gray-900 text-white' : 'bg-gray-100 border border-gray-300 text-gray-800'}`}>
                                {card.pileName || 'N/A'}
                              </span>
                            </div>
                            
                            {editingCardId === card.id ? (
                              <div className="space-y-1">
                                <Input 
                                  value={editingCardText}
                                  onChange={(e) => setEditingCardText(e.target.value)}
                                  placeholder="Enter card text..."
                                  className="text-xs h-7"
                                />
                                <div className="flex gap-1">
                                  <Button 
                                    onClick={() => handleSaveCardText(card.id, editingCardText)}
                                    size="sm" 
                                    className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                                  >
                                    Save
                                  </Button>
                                  <Button 
                                    onClick={() => { setEditingCardId(null); setEditingCardText('') }}
                                    size="sm" 
                                    variant="outline"
                                    className="h-6 px-2 text-xs"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div 
                                onClick={() => { setEditingCardId(card.id); setEditingCardText(card.text || '') }}
                                className="text-xs text-gray-600 truncate cursor-pointer hover:bg-gray-100 p-1 rounded min-h-[20px]"
                                title="Click to edit text"
                              >
                                {card.text || <span className="text-gray-400 italic">Click to add text...</span>}
                              </div>
                            )}
                            
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-[10px] text-gray-400 truncate">ID: {card.id.slice(0, 8)}...</p>
                              <Button onClick={() => { if(confirm('Delete this card?')) handleDeleteCard(card.id) }} size="sm" variant="ghost" className="text-red-600 h-6 px-1">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                </div>
                
                {adminCards.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <p>No cards yet. Upload cards via the Boxes tab.</p>
                    <p className="text-sm mt-1">Edit a box → Select pile → Upload ZIP file</p>
                  </div>
                )}
              </div>
            )}

            {/* PRICES TAB */}
            {adminTab === 'prices' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="sr-only">Prices (Membership Options)</h3>
                  <Button onClick={() => {
                    setEditingPrice(null)
                    setPriceForm({ id: '', label: '', paymentInfo: '', hookInfo: '', amount: 0, promoAmount: null, promoEnabled: false, currency: 'USD', membershipDays: 30, displayOrder: 0, isActive: true })
                    setShowPriceForm(true)
                  }} className="bg-red-600 hover:bg-red-700 text-white" size="sm">
                    <Plus className="w-4 h-4 mr-2" />Add Price
                  </Button>
                </div>
                
                {showPriceForm && (
                <Card className="p-6 mb-6">
                  <h4 className="font-medium mb-4">{editingPrice ? 'Edit Price' : 'New Price'}</h4>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label>ID (slug)</Label>
                      <Input value={priceForm.id} onChange={(e) => setPriceForm({ ...priceForm, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })} placeholder="e.g., membership_30d" className="mt-1" disabled={!!editingPrice} />
                    </div>
                    <div>
                      <Label>Label</Label>
                      <Input value={priceForm.label} onChange={(e) => setPriceForm({ ...priceForm, label: e.target.value })} placeholder="e.g., 30-Day Membership" className="mt-1" />
                    </div>
                    <div>
                      <Label>Regular Amount ($)</Label>
                      <Input type="number" step="0.01" value={priceForm.amount} onChange={(e) => setPriceForm({ ...priceForm, amount: parseFloat(e.target.value) || 0 })} className="mt-1" />
                    </div>
                    <div>
                      <Label>Promo Amount ($)</Label>
                      <Input type="number" step="0.01" value={priceForm.promoAmount || ''} onChange={(e) => setPriceForm({ ...priceForm, promoAmount: e.target.value ? parseFloat(e.target.value) : null })} placeholder="Leave empty if no promo" className="mt-1" />
                    </div>
                    <div className="flex items-center gap-4">
                      <Label>Enable Promo</Label>
                      <Switch checked={priceForm.promoEnabled || false} onCheckedChange={(checked) => setPriceForm({ ...priceForm, promoEnabled: checked })} />
                      {priceForm.promoEnabled && priceForm.promoAmount && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Promo Active!</span>
                      )}
                    </div>
                    <div>
                      <Label>Payment Info</Label>
                      <Input value={priceForm.paymentInfo} onChange={(e) => setPriceForm({ ...priceForm, paymentInfo: e.target.value })} placeholder="e.g., One-time payment" className="mt-1" />
                    </div>
                    <div>
                      <Label>Hook Info</Label>
                      <Input value={priceForm.hookInfo} onChange={(e) => setPriceForm({ ...priceForm, hookInfo: e.target.value })} placeholder="Marketing hook text" className="mt-1" />
                    </div>
                    <div>
                      <Label>Membership Days</Label>
                      <Input type="number" value={priceForm.membershipDays} onChange={(e) => setPriceForm({ ...priceForm, membershipDays: parseInt(e.target.value) || 0 })} className="mt-1" />
                    </div>
                    <div>
                      <Label>Display Order</Label>
                      <Input type="number" value={priceForm.displayOrder} onChange={(e) => setPriceForm({ ...priceForm, displayOrder: parseInt(e.target.value) || 0 })} className="mt-1" />
                    </div>
                    <div className="flex items-center gap-4">
                      <Label>Active</Label>
                      <Switch checked={priceForm.isActive} onCheckedChange={(checked) => setPriceForm({ ...priceForm, isActive: checked })} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleSavePrice} className="bg-red-600 hover:bg-red-700 text-white">{editingPrice ? 'Update' : 'Create'}</Button>
                    <Button onClick={() => { setShowPriceForm(false); setEditingPrice(null) }} variant="outline">Cancel</Button>
                  </div>
                </Card>
                )}
                
                <div className="space-y-2">
                  {adminPrices.map(price => {
                    const effectivePrice = price.promo_enabled && price.promo_amount ? price.promo_amount : price.amount
                    return (
                      <Card key={price.id} className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{price.label}</span>
                              <span className="text-xs text-gray-400">({price.id})</span>
                              <span className="text-sm font-bold text-green-600">${effectivePrice}</span>
                              {price.promo_enabled && price.promo_amount && (
                                <>
                                  <span className="text-xs line-through text-gray-400">${price.amount}</span>
                                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">PROMO</span>
                                </>
                              )}
                              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">{price.membership_days} days</span>
                              {!price.is_active && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Inactive</span>}
                            </div>
                            <p className="text-sm text-gray-500">{price.hook_info}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button onClick={() => { 
                              setEditingPrice(price)
                              setPriceForm({
                                id: price.id,
                                label: price.label,
                                paymentInfo: price.payment_info || '',
                                hookInfo: price.hook_info || '',
                                amount: price.amount,
                                promoAmount: price.promo_amount,
                                promoEnabled: price.promo_enabled || false,
                                currency: price.currency || 'USD',
                                membershipDays: price.membership_days || 30,
                                displayOrder: price.display_order || 0,
                                isActive: price.is_active !== false
                              })
                              setShowPriceForm(true)
                            }} size="sm" variant="ghost"><Edit className="w-4 h-4" /></Button>
                            <Button onClick={() => { if(confirm('Delete this price?')) handleDeletePrice(price.id) }} size="sm" variant="ghost" className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* BUNDLES TAB */}
            {adminTab === 'bundles' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="sr-only">Bundles</h3>
                  <Button onClick={() => {
                    setEditingBundle(null)
                    setBundleForm({ id: '', name: '', description: '', priceId: '', boxIds: [], displayOrder: 0, isActive: true })
                    setShowBundleForm(true)
                  }} className="bg-red-600 hover:bg-red-700 text-white" size="sm">
                    <Plus className="w-4 h-4 mr-2" />Add Bundle
                  </Button>
                </div>
                
                {showBundleForm && (
                <Card className="p-6 mb-6">
                  <h4 className="font-medium mb-4">{editingBundle ? 'Edit Bundle' : 'New Bundle'}</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>ID (slug)</Label>
                      <Input value={bundleForm.id} onChange={(e) => setBundleForm({ ...bundleForm, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })} placeholder="e.g., all_access" className="mt-1" disabled={!!editingBundle} />
                    </div>
                    <div>
                      <Label>Name</Label>
                      <Input value={bundleForm.name} onChange={(e) => setBundleForm({ ...bundleForm, name: e.target.value })} placeholder="e.g., All Access Bundle" className="mt-1" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Description</Label>
                      <Input value={bundleForm.description} onChange={(e) => setBundleForm({ ...bundleForm, description: e.target.value })} placeholder="Bundle description" className="mt-1" />
                    </div>
                    <div>
                      <Label>Price</Label>
                      <select value={bundleForm.priceId || ''} onChange={(e) => setBundleForm({ ...bundleForm, priceId: e.target.value || null })} className="w-full mt-1 p-2 border rounded-md">
                        <option value="">-- Select Price --</option>
                        {adminPrices.map(p => <option key={p.id} value={p.id}>{p.label} (${p.amount})</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Display Order</Label>
                      <Input type="number" value={bundleForm.displayOrder} onChange={(e) => setBundleForm({ ...bundleForm, displayOrder: parseInt(e.target.value) || 0 })} className="mt-1" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Included Boxes</Label>
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {adminBoxes.map(box => (
                          <label key={box.id} className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={(bundleForm.boxIds || []).includes(box.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setBundleForm({ ...bundleForm, boxIds: [...(bundleForm.boxIds || []), box.id] })
                                } else {
                                  setBundleForm({ ...bundleForm, boxIds: (bundleForm.boxIds || []).filter(id => id !== box.id) })
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{box.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Label>Active</Label>
                      <Switch checked={bundleForm.isActive} onCheckedChange={(checked) => setBundleForm({ ...bundleForm, isActive: checked })} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleSaveBundle} className="bg-red-600 hover:bg-red-700 text-white">{editingBundle ? 'Update' : 'Create'}</Button>
                    <Button onClick={() => { setShowBundleForm(false); setEditingBundle(null) }} variant="outline">Cancel</Button>
                  </div>
                </Card>
                )}
                
                <div className="space-y-2">
                  {adminBundles.map(bundle => (
                    <Card key={bundle.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{bundle.name}</span>
                            <span className="text-xs text-gray-400">({bundle.id})</span>
                            {bundle.priceLabel && <span className="text-sm text-green-600">${bundle.priceAmount} ({bundle.priceLabel})</span>}
                            {!bundle.isActive && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Inactive</span>}
                          </div>
                          <p className="text-sm text-gray-500">{bundle.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(bundle.boxIds || []).map(boxId => {
                              const box = adminBoxes.find(b => b.id === boxId)
                              return box ? (
                                <span key={boxId} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{box.name}</span>
                              ) : null
                            })}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button onClick={() => { 
                            setEditingBundle(bundle)
                            setBundleForm({
                              id: bundle.id,
                              name: bundle.name,
                              description: bundle.description || '',
                              priceId: bundle.priceId || '',
                              boxIds: bundle.boxIds || [],
                              displayOrder: bundle.displayOrder || 0,
                              isActive: bundle.isActive !== false
                            })
                            setShowBundleForm(true)
                          }} size="sm" variant="ghost"><Edit className="w-4 h-4" /></Button>
                          <Button onClick={() => { if(confirm('Delete this bundle?')) handleDeleteBundle(bundle.id) }} size="sm" variant="ghost" className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {view === 'admin' && !isAdmin && (
          <div className="max-w-md mx-auto p-8 text-center">
            <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-serif text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access the admin panel.</p>
            <Button onClick={() => setView('game')} className="mt-6">Go to Game</Button>
          </div>
        )}
      </div>
      
      {/* Auth Dialog */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {authMode === 'signin' ? 'Welcome Back' : authMode === 'signup' ? 'Create Account' : 'Reset Password'}
            </DialogTitle>
            <DialogDescription>
              {authMode === 'signin' 
                ? 'Sign in to unlock full access' 
                : authMode === 'signup' 
                  ? 'Create an account to start your conversation journey'
                  : 'Enter your email and we\'ll send you a link to reset your password'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAuth} className="space-y-4">
            {authError && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">{authError}</div>}
            {authSuccess && <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">{authSuccess}</div>}
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="mt-2" disabled={authLoading} />
            </div>
            
            {/* Only show password field for signin and signup */}
            {authMode !== 'forgot' && (
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="mt-2" disabled={authLoading} />
              </div>
            )}
            
            <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white" disabled={authLoading}>
              {authLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {authMode === 'forgot' ? 'Sending...' : authMode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                authMode === 'signin' ? 'Sign In' : authMode === 'signup' ? 'Sign Up' : 'Send Reset Link'
              )}
            </Button>
            
            {/* Only show Google sign-in for signin/signup */}
            {authMode !== 'forgot' && (
              <>
                <Separator />
                <Button type="button" onClick={handleGoogleSignIn} variant="outline" className="w-full" disabled={authLoading}>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
              </>
            )}
            
            <div className="text-center text-sm space-y-2">
              {authMode === 'signin' && !authLoading && (
                <>
                  <button type="button" onClick={() => { setAuthMode('forgot'); setAuthError(''); setAuthSuccess('') }} className="text-gray-600 hover:underline block w-full">
                    Forgot your password?
                  </button>
                  <button type="button" onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccess('') }} className="text-red-600 hover:underline">
                    Don't have an account? Sign up
                  </button>
                </>
              )}
              {authMode === 'signup' && !authLoading && (
                <button type="button" onClick={() => { setAuthMode('signin'); setAuthError(''); setAuthSuccess('') }} className="text-red-600 hover:underline">
                  Already have an account? Sign in
                </button>
              )}
              {authMode === 'forgot' && !authLoading && (
                <button type="button" onClick={() => { setAuthMode('signin'); setAuthError(''); setAuthSuccess('') }} className="text-red-600 hover:underline">
                  Back to sign in
                </button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Cancel Subscription Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Cancel Subscription?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-3">
              <p>
                <strong>Warning:</strong> Canceling your subscription will immediately revoke your access to all premium boxes, even if you have remaining time on your subscription.
              </p>
              <p>
                Once canceled, you will need to purchase a new subscription to regain access.
              </p>
              <p className="text-red-600 font-medium">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelSubscription}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Cancel Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Booklet Viewer Modal */}
      <BookletViewer 
        isOpen={bookletOpen} 
        onClose={() => setBookletOpen(false)}
        images={bookletImages}
        title={bookletTitle}
      />
      
      {/* Bottom Navigation */}
      {showBottomNav && (
        <BottomNav 
          currentView={view === 'game' ? 'play' : view}
          onNavigate={handleNavigation}
        />
      )}
    </div>
  )
}

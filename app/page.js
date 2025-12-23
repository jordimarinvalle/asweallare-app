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
import { LogOut, Plus, Edit, Trash2, CreditCard, RotateCw, Smartphone, Lock, Check, Package, Play, ShoppingBag, Sparkles, Crown, Receipt, XCircle, Image, Menu, AlertTriangle, RefreshCcw, BookOpen, Upload } from 'lucide-react'
import { BookletViewer, GuideSelector, GuideSelectorCompact, BOOKLET_IMAGES, BOOKLET_30SECS } from '@/components/game/BookletViewer'
import { RotateDeviceScreen } from '@/components/game/RotateDeviceScreen'

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
                    src={`/cards/${currentCard.imagePath}`}
                    alt={currentCard.title || 'Card'}
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
  onOpenQuickGuide
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
  
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Top buttons row */}
      <div className="absolute top-20 left-4 right-4 flex justify-between items-center">
        <Button variant="ghost" size="sm" onClick={onBackToBoxes}>
          ← Change Boxes
        </Button>
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
// BOX SELECTION COMPONENT
// ============================================================================
function BoxSelectionScreen({ boxes, selectedBoxIds, setSelectedBoxIds, onStartPlaying, onGoToStore, user, onOpenCompleteGuide, onOpenQuickGuide }) {
  const toggleBox = (boxId) => {
    const box = boxes.find(b => b.id === boxId)
    if (!box?.hasAccess) return // Can't select locked boxes
    
    setSelectedBoxIds(prev => 
      prev.includes(boxId) 
        ? prev.filter(id => id !== boxId)
        : [...prev, boxId]
    )
  }
  
  // Smart box filtering logic:
  // - Hide demo box if white box (108) is owned
  // - Hide white box (108) if white box XL (216) is owned
  const hasWhiteBox = boxes.some(b => b.id === 'box_white' && b.hasAccess)
  const hasWhiteBoxXL = boxes.some(b => b.id === 'box_white_xl' && b.hasAccess)
  
  const filterAccessibleBoxes = (box) => {
    if (!box.hasAccess) return false
    // Hide demo if user has white box or white box XL
    if (box.id === 'box_demo' && (hasWhiteBox || hasWhiteBoxXL)) return false
    // Hide white box 108 if user has white box XL (216)
    if (box.id === 'box_white' && hasWhiteBoxXL) return false
    return true
  }
  
  const filterLockedBoxes = (box) => {
    if (box.hasAccess) return false
    // Don't show demo box in purchasable list
    if (box.is_demo) return false
    // Hide white box 108 from purchase if user already has XL
    if (box.id === 'box_white' && hasWhiteBoxXL) return false
    return true
  }
  
  const accessibleBoxes = boxes.filter(filterAccessibleBoxes)
  const lockedBoxes = boxes.filter(filterLockedBoxes)
  const canStart = selectedBoxIds.length > 0
  
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif text-gray-900 mb-2">Choose Your Boxes</h2>
          <p className="text-gray-600">Select which card collections you want to play with</p>
        </div>
        
        {/* Experience Guide Button */}
        <div className="flex justify-center mb-6">
          <GuideSelector
            onSelectComplete={onOpenCompleteGuide}
            onSelectQuick={onOpenQuickGuide}
            variant="outline"
            className="text-gray-700 border-gray-300 hover:bg-gray-50"
          />
        </div>
        
        {/* Accessible Boxes */}
        {accessibleBoxes.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Your Boxes</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {accessibleBoxes.map(box => (
                <div
                  key={box.id}
                  onClick={() => toggleBox(box.id)}
                  className={`relative cursor-pointer rounded-xl p-4 border-2 transition-all ${
                    selectedBoxIds.includes(box.id)
                      ? 'border-red-500 bg-red-50 shadow-lg scale-105'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow'
                  }`}
                >
                  {/* Selection indicator */}
                  {selectedBoxIds.includes(box.id) && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  {/* Box color indicator */}
                  <div 
                    className="w-12 h-12 rounded-lg mb-3 border border-gray-200 flex items-center justify-center"
                    style={{ backgroundColor: box.color === '#FFFFFF' ? '#F9FAFB' : box.color }}
                  >
                    <Package className={`w-6 h-6 ${box.color === '#000000' || box.color === '#D12128' ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  
                  <h4 className="font-medium text-gray-900">{box.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{box.description}</p>
                  
                  {box.is_demo && (
                    <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Free
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Start Playing Button */}
        <div className="flex flex-col items-center gap-4 mt-8">
          <Button 
            size="lg" 
            className="bg-red-600 hover:bg-red-700 text-white px-8"
            disabled={!canStart}
            onClick={onStartPlaying}
          >
            <Play className="w-5 h-5 mr-2" />
            Start Playing
            {selectedBoxIds.length > 0 && (
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-sm">
                {selectedBoxIds.length} box{selectedBoxIds.length > 1 ? 'es' : ''}
              </span>
            )}
          </Button>
          
          {!canStart && (
            <p className="text-sm text-gray-500">Select at least one box to start</p>
          )}
          
          {/* Simplified "More Boxes Available" - Compact button instead of large section */}
          {lockedBoxes.length > 0 && (
            <Button variant="outline" onClick={onGoToStore} className="mt-4">
              <ShoppingBag className="w-4 h-4 mr-2" />
              {lockedBoxes.length} more box{lockedBoxes.length > 1 ? 'es' : ''} available in Store
            </Button>
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
  const lockedBoxes = boxes.filter(b => !b.hasAccess && !b.is_demo)
  const ownedBoxes = boxes.filter(b => b.hasAccess && !b.is_demo)
  
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
                  {boxes.filter(b => !b.is_demo).map(box => (
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
                        Get unlimited access to all {boxes.filter(b => !b.is_demo).length} card boxes, 
                        plus any new boxes we release in the future.
                      </p>
                      
                      <ul className="space-y-2 mb-6">
                        <li className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-400" />
                          <span>Access to all {boxes.filter(b => !b.is_demo).length} premium boxes</span>
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
// MAIN APP COMPONENT
// ============================================================================
export default function App() {
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
  
  // Admin email restriction
  const ADMIN_EMAIL = 'mocasin@gmail.com'
  const isAdmin = user?.email === ADMIN_EMAIL
  
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
  
  // View state
  const [view, setView] = useState('game')
  const [purchases, setPurchases] = useState([])
  
  // Admin
  const [adminCards, setAdminCards] = useState([])
  const [adminBoxes, setAdminBoxes] = useState([])
  const [adminSeries, setAdminSeries] = useState([])
  const [adminPrices, setAdminPrices] = useState([])
  const [adminPiles, setAdminPiles] = useState([])
  const [adminBundles, setAdminBundles] = useState([])
  const [adminTab, setAdminTab] = useState('cards')
  
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
    isDemo: false,
    isActive: true,
    boxId: '',
    imagePath: ''
  })
  
  const [boxForm, setBoxForm] = useState({
    name: '',
    description: '',
    descriptionShort: '',
    tagline: '',
    topicsText: '',  // Store as text, parse on save
    priceId: '',
    color: '#000000',
    colorPaletteText: '',  // Store as text, parse on save
    path: '',
    displayOrder: 0,
    isDemo: false,
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
      const response = await fetch('/api/boxes')
      const data = await response.json()
      if (data.boxes) {
        setBoxes(data.boxes)
        setHasAllAccess(data.hasAllAccess || false)
        // Auto-select demo boxes
        const demoBoxIds = data.boxes.filter(b => b.is_demo && b.hasAccess).map(b => b.id)
        setSelectedBoxIds(demoBoxIds)
      }
    }
    
    const loadPlans = async () => {
      const response = await fetch('/api/plans')
      const data = await response.json()
      if (data.plans) {
        setPlans(data.plans)
      }
    }
    
    loadBoxes()
    loadPlans()
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
    const queryParam = boxIds.length > 0 ? `?box_ids=${boxIds.join(',')}` : ''
    const response = await fetch(`/api/cards${queryParam}`)
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
        boxId: card.box_id,
        imagePath: card.image_path,
        createdAt: card.createdat
      }))
      
      setAllCards(normalizedCards)
      const blacks = normalizedCards.filter(c => c.color === 'black')
      const whites = normalizedCards.filter(c => c.color === 'white')
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
      // Handle password reset separately
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
          setTimeout(() => { setAuthMode('signin'); setAuthSuccess('') }, 3000)
        } else {
          // Sign in successful - refresh user data and close dialog
          setAuthOpen(false)
          setEmail('')
          setPassword('')
          
          // Fetch fresh user data immediately
          const userResponse = await fetch('/api/auth/user')
          const userData = await userResponse.json()
          if (userData.user) {
            setUser(userData.user)
          }
          
          // Refresh boxes with new user access
          const boxResponse = await fetch('/api/boxes')
          const boxData = await boxResponse.json()
          if (boxData.boxes) {
            setBoxes(boxData.boxes)
            setHasAllAccess(boxData.hasAllAccess || false)
            // Auto-select accessible boxes
            const accessibleBoxIds = boxData.boxes.filter(b => b.hasAccess).map(b => b.id)
            setSelectedBoxIds(accessibleBoxIds.length > 0 ? accessibleBoxIds : boxData.boxes.filter(b => b.is_demo && b.hasAccess).map(b => b.id))
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
      // Sign out on server first (this clears server-side cookies)
      await fetch('/api/auth/signout', { method: 'POST' })
      
      // Also sign out on client to clear local session and any localStorage
      await supabase.auth.signOut({ scope: 'global' })
      
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
        // Auto-select only demo boxes for non-authenticated user
        const demoBoxIds = data.boxes.filter(b => b.is_demo && b.hasAccess).map(b => b.id)
        setSelectedBoxIds(demoBoxIds)
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
    
    if (cardForm.boxId === 'box_demo') boxFolder = 'white-box-demo'
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
        descriptionShort: box.description_short,
        tagline: box.tagline,
        topics: box.topics || [],
        price: box.price,
        color: box.color,
        colorPalette: box.color_palette || [],
        path: box.path,
        displayOrder: box.display_order,
        isDemo: box.is_demo,
        isActive: box.is_active,
        collectionSeriesId: box.collection_series_id,
        seriesName: box.collection_series?.name
      }))
      setAdminBoxes(normalizedBoxes)
    }
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
        currency: p.currency,
        isMembership: p.is_membership,
        membershipDays: p.membership_days,
        stripePriceId: p.stripe_price_id,
        displayOrder: p.display_order,
        isActive: p.is_active
      }))
      setAdminPrices(normalizedPrices)
    }
  }
  
  const loadAdminPiles = async () => {
    const response = await fetch('/api/admin/piles')
    const data = await response.json()
    if (data.piles) {
      const normalizedPiles = data.piles.map(p => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        imagePath: p.image_path,
        collectionSeriesId: p.collection_series_id,
        seriesName: p.collection_series?.name,
        displayOrder: p.display_order,
        isActive: p.is_active
      }))
      setAdminPiles(normalizedPiles)
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
  
  const loadAllAdminData = async () => {
    await Promise.all([
      loadAdminCards(),
      loadAdminBoxes(),
      loadAdminSeries(),
      loadAdminPrices(),
      loadAdminPiles(),
      loadAdminBundles()
    ])
  }
  
  const handleSaveCard = async () => {
    const payload = {
      color: cardForm.color,
      title: cardForm.title,
      hint: cardForm.hint,
      language: cardForm.language,
      isDemo: cardForm.isDemo,
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
    setCardForm({ color: 'black', title: '', hint: '', language: 'en', isDemo: false, isActive: true, boxId: '', imagePath: '' })
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
      name: boxForm.name,
      description: boxForm.description,
      descriptionShort: boxForm.descriptionShort,
      tagline: boxForm.tagline,
      topics: topics,
      priceId: boxForm.priceId || null,
      color: boxForm.color,
      colorPalette: colorPalette,
      path: boxForm.path,
      displayOrder: boxForm.displayOrder,
      isDemo: boxForm.isDemo,
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
      await fetch('/api/admin/boxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      toast({ title: 'Box created successfully!' })
    }
    
    setEditingBox(null)
    setShowBoxForm(false)
    setBoxForm({
      name: '', description: '', descriptionShort: '', tagline: '', topicsText: '',
      priceId: '', color: '#000000', colorPaletteText: '', path: '', displayOrder: 0,
      isDemo: false, isActive: true, collectionSeriesId: ''
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
    
    // Use box path or generate from name
    const boxSlug = editingBox.path || editingBox.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    
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
    if (view === 'purchases') loadPurchases()
    else if (view === 'admin') { loadAllAdminData() }
  }, [view])
  
  // Navigation handler for mobile menu
  const handleNavigation = (newView) => {
    setView(newView)
    setGameStarted(false)
    setMobileMenuOpen(false)
  }
  
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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="font-brand text-gray-900 cursor-pointer" onClick={() => { setView('game'); setGameStarted(false) }}>
              AS WE ALL ARE
            </h1>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              {!user ? (
                <>
                  <Button onClick={() => setView('store')} variant="ghost">
                    <ShoppingBag className="w-4 h-4 mr-2" />Store
                  </Button>
                  <Button onClick={() => setAuthOpen(true)} variant="outline">Sign In</Button>
                </>
              ) : (
                <>
                  <Button onClick={() => { setView('game'); setGameStarted(false) }} variant={view === 'game' ? 'default' : 'ghost'}>Play</Button>
                  <Button onClick={() => setView('store')} variant={view === 'store' ? 'default' : 'ghost'}>
                    <ShoppingBag className="w-4 h-4 mr-2" />Store
                  </Button>
                  <Button onClick={() => setView('purchases')} variant={view === 'purchases' ? 'default' : 'ghost'}>
                    <Receipt className="w-4 h-4 mr-2" />Purchases
                  </Button>
                  {isAdmin && (
                    <Button onClick={() => setView('admin')} variant={view === 'admin' ? 'default' : 'ghost'}>Admin</Button>
                  )}
                  <Button onClick={handleSignOut} variant="ghost" size="sm"><LogOut className="w-4 h-4" /></Button>
                  <div className="text-sm text-gray-600 max-w-[150px] truncate">{user.email}</div>
                </>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <SheetHeader>
                    <SheetTitle className="font-brand text-left">Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-2 mt-6">
                    {!user ? (
                      <>
                        <SheetClose asChild>
                          <Button onClick={() => handleNavigation('store')} variant="ghost" className="justify-start">
                            <ShoppingBag className="w-4 h-4 mr-2" />Store
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button onClick={() => { setAuthOpen(true); setMobileMenuOpen(false) }} variant="outline" className="justify-start">
                            Sign In
                          </Button>
                        </SheetClose>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-2 text-sm text-gray-600 border-b mb-2 truncate">{user.email}</div>
                        <SheetClose asChild>
                          <Button onClick={() => handleNavigation('game')} variant={view === 'game' ? 'default' : 'ghost'} className="justify-start">
                            <Play className="w-4 h-4 mr-2" />Play
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button onClick={() => handleNavigation('store')} variant={view === 'store' ? 'default' : 'ghost'} className="justify-start">
                            <ShoppingBag className="w-4 h-4 mr-2" />Store
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button onClick={() => handleNavigation('purchases')} variant={view === 'purchases' ? 'default' : 'ghost'} className="justify-start">
                            <Receipt className="w-4 h-4 mr-2" />Purchases
                          </Button>
                        </SheetClose>
                        {isAdmin && (
                          <SheetClose asChild>
                            <Button onClick={() => handleNavigation('admin')} variant={view === 'admin' ? 'default' : 'ghost'} className="justify-start">
                              Admin
                            </Button>
                          </SheetClose>
                        )}
                        <Separator className="my-2" />
                        <SheetClose asChild>
                          <Button onClick={() => { handleSignOut(); setMobileMenuOpen(false) }} variant="ghost" className="justify-start text-red-600">
                            <LogOut className="w-4 h-4 mr-2" />Sign Out
                          </Button>
                        </SheetClose>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main content */}
      <div className="pt-16">
        {view === 'game' && !gameStarted && (
          <BoxSelectionScreen 
            boxes={boxes}
            selectedBoxIds={selectedBoxIds}
            setSelectedBoxIds={setSelectedBoxIds}
            onStartPlaying={handleStartPlaying}
            onGoToStore={handleGoToStore}
            user={user}
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
        
        {view === 'admin' && isAdmin && (
          <div className="max-w-6xl mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-serif text-gray-900">Admin Panel</h2>
            </div>
            
            {/* Admin Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto pb-px">
              {['series', 'boxes', 'piles', 'cards', 'prices', 'bundles'].map(tab => (
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

            {/* SERIES TAB */}
            {adminTab === 'series' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-medium">Collection Series</h3>
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
                  <h3 className="text-xl font-medium">Boxes (Decks)</h3>
                  <Button onClick={() => {
                    setEditingBox(null)
                    setBoxForm({ name: '', description: '', descriptionShort: '', tagline: '', topics: [], priceId: '', color: '#000000', colorPalette: [], path: '', displayOrder: 0, isDemo: false, isActive: true, collectionSeriesId: '' })
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
                          <option value="">-- No Price (Free/Demo) --</option>
                          {adminPrices.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.label} - ${p.promoEnabled && p.promoAmount ? p.promoAmount : p.amount}
                              {p.promoEnabled && p.promoAmount && ` (was $${p.amount})`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Path (folder name)</Label>
                        <Input value={boxForm.path} onChange={(e) => setBoxForm({ ...boxForm, path: e.target.value })} placeholder="e.g., white-box-108" className="mt-1" />
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
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
                        <Label>Demo</Label>
                        <Switch checked={boxForm.isDemo} onCheckedChange={(checked) => setBoxForm({ ...boxForm, isDemo: checked })} />
                      </div>
                      <div className="flex items-center gap-4">
                        <Label>Active</Label>
                        <Switch checked={boxForm.isActive} onCheckedChange={(checked) => setBoxForm({ ...boxForm, isActive: checked })} />
                      </div>
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
                            <Label>ZIP File (PNG images)</Label>
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
                            /cards/{editingBox.path || '{box_path}'}/{bulkUploadPileId ? adminPiles.find(p => p.id === bulkUploadPileId)?.slug || '{pile_slug}' : '{pile_slug}'}/{'{MD5}.{ext}'}
                          </code>
                        </p>
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleSaveBox} className="bg-red-600 hover:bg-red-700 text-white">{editingBox ? 'Update' : 'Create'}</Button>
                      <Button onClick={() => { setShowBoxForm(false); setEditingBox(null); setUploadResult(null); setBulkUploadPileId('') }} variant="outline">Cancel</Button>
                    </div>
                  </Card>
                )}
                
                <div className="space-y-2">
                  {adminBoxes.map(box => {
                    const linkedPrice = box.prices
                    const displayPrice = linkedPrice ? (linkedPrice.promo_enabled && linkedPrice.promo_amount ? linkedPrice.promo_amount : linkedPrice.amount) : null
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
                                {box.is_demo && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">Demo</span>}
                                {!box.is_active && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Inactive</span>}
                              </div>
                              <p className="text-sm text-gray-500">{box.tagline || box.description_short}</p>
                              <p className="text-xs text-gray-400">
                                Series: {box.collection_series?.name || 'N/A'} | 
                                Price: {linkedPrice?.label || 'Free'} | 
                                Path: {box.path}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button onClick={() => { 
                              setEditingBox(box)
                              setBoxForm({
                                name: box.name,
                                description: box.description || '',
                                descriptionShort: box.description_short || '',
                                tagline: box.tagline || '',
                                topicsText: (box.topics || []).join(', '),
                                collectionSeriesId: box.collection_series_id || '',
                                priceId: box.price_id || '',
                                color: box.color || '#000000',
                                colorPaletteText: (box.color_palette || []).join(', '),
                                path: box.path || '',
                                isDemo: box.is_demo || false,
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
                  <h3 className="text-xl font-medium">Piles (Card Backs)</h3>
                  <Button onClick={() => {
                    setEditingPile(null)
                    setPileForm({ id: '', slug: '', name: '', imagePath: '', collectionSeriesId: '', displayOrder: 0, isActive: true })
                    setShowPileForm(true)
                  }} className="bg-red-600 hover:bg-red-700 text-white" size="sm">
                    <Plus className="w-4 h-4 mr-2" />Add Pile
                  </Button>
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
                                  if (data.path) {
                                    setPileForm({ ...pileForm, imagePath: data.path })
                                    toast({ title: 'Image uploaded!' })
                                  } else if (data.error) {
                                    toast({ title: data.error, variant: 'destructive' })
                                  }
                                } catch (err) {
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
                  {adminPiles.map(pile => (
                    <Card key={pile.id} className="p-4">
                      <div className="flex gap-4">
                        <div className="w-20 h-28 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {pile.imagePath && (
                            <img 
                              src={`/${pile.imagePath}`} 
                              alt={pile.name}
                              className="w-full h-full object-cover"
                              onError={(e) => e.target.style.display = 'none'}
                            />
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
                                  imagePath: pile.imagePath,
                                  collectionSeriesId: pile.collectionSeriesId || '',
                                  displayOrder: pile.displayOrder,
                                  isActive: pile.isActive
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
                  ))}
                </div>
              </div>
            )}

            {/* CARDS TAB */}
            {adminTab === 'cards' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-medium">Cards</h3>
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
                    .map(card => (
                    <Card key={card.id} className="p-3 overflow-hidden">
                      <div className="aspect-[3/4] mb-2 rounded overflow-hidden bg-gray-100 relative">
                        {card.imagePath ? (
                          <img src={`/${card.imagePath}`} alt="" className="w-full h-full object-cover" />
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
                          <span className={`px-1.5 py-0.5 text-xs rounded ${card.pileName?.toLowerCase() === 'black' ? 'bg-black text-white' : 'bg-white border text-black'}`}>
                            {card.pileName || 'N/A'}
                          </span>
                          <span className="text-xs text-gray-400 truncate">{card.boxName || 'N/A'}</span>
                        </div>
                        
                        {/* Editable text field */}
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
                  ))}
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
                  <h3 className="text-xl font-medium">Prices (Membership Options)</h3>
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
                  <h3 className="text-xl font-medium">Bundles</h3>
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
    </div>
  )
}

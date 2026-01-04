'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RotateCw } from 'lucide-react'

/**
 * CardPile - A single card pile component that handles:
 * - Showing a clickable pile when no card is drawn
 * - Showing the drawn card (face-down initially)
 * - Flipping the card on click
 * - Proper state isolation to fix the two-click bug
 */
export default function CardPile({ 
  color, // 'black' or 'white'
  deck,
  onDeckChange,
  onReshuffle,
  allCards
}) {
  // Local state for this pile only
  const [drawnCard, setDrawnCard] = useState(null)
  const [isFlipped, setIsFlipped] = useState(false)
  const [animating, setAnimating] = useState(false)
  
  // Determine styling based on color
  const isBlack = color === 'black'
  const cardBackImage = isBlack ? '/black-card-back.png' : '/white-card-back.png'
  const bgColor = isBlack ? 'bg-black' : 'bg-white'
  const textColor = isBlack ? 'text-white' : 'text-gray-900'
  const hintColor = isBlack ? 'text-gray-400' : 'text-gray-600'
  const borderColor = 'border-gray-400' // Light gray but noticeable
  
  // Handle click on the pile/card area
  const handleClick = () => {
    if (animating) return
    
    if (!drawnCard && deck.length > 0) {
      // Draw a new card from the deck
      const [card, ...remaining] = deck
      setDrawnCard(card)
      setIsFlipped(false) // Start face-down
      onDeckChange(remaining)
      
      // Brief animation
      setAnimating(true)
      setTimeout(() => setAnimating(false), 300)
    } else if (drawnCard) {
      // Toggle flip state
      setIsFlipped(prev => !prev)
    }
  }
  
  // Reset when "Next Player" is called (deck changes to include all cards)
  useEffect(() => {
    // When the deck is reset (shuffled with all cards), clear the drawn card
    if (deck.length === allCards.length && drawnCard) {
      setDrawnCard(null)
      setIsFlipped(false)
    }
  }, [deck.length, allCards.length])
  
  // Handle reshuffle click
  const handleReshuffle = (e) => {
    e.stopPropagation()
    setDrawnCard(null)
    setIsFlipped(false)
    onReshuffle()
  }
  
  // Get the current card to access (for saving draws)
  const getCurrentCard = () => drawnCard
  
  // Empty deck state
  if (deck.length === 0 && !drawnCard) {
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
        {!drawnCard ? (
          // Show the pile (clickable to draw)
          <div 
            className={`w-full h-full ${bgColor} border-2 ${borderColor} rounded-lg flex items-center justify-center hover:shadow-xl transition-shadow overflow-hidden relative`}
          >
            <img 
              src={cardBackImage} 
              alt="Card pile" 
              className="absolute inset-0 w-full h-full object-cover rounded-lg" 
            />
            {/* Stack effect */}
            <div className="absolute -bottom-1 -right-1 w-full h-full border-2 border-gray-400 rounded-lg -z-10 bg-gray-200"></div>
            <div className="absolute -bottom-2 -right-2 w-full h-full border-2 border-gray-300 rounded-lg -z-20 bg-gray-100"></div>
          </div>
        ) : (
          // Show the drawn card with flip animation
          <div 
            className={`w-full h-full transition-transform duration-500 ${animating ? 'scale-105' : ''}`}
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
                  <span className={`${isBlack ? 'text-white' : 'text-gray-700'} text-sm font-sans opacity-70 bg-black/20 px-3 py-1 rounded-full`}>
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
                    {drawnCard?.title || ''}
                  </h2>
                  {drawnCard?.hint && (
                    <p className={`${hintColor} text-sm italic`}>
                      {drawnCard.hint}
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

// Export a ref-accessible version
CardPile.displayName = 'CardPile'

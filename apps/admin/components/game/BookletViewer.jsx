'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, X, BookOpen, Clock, BookMarked } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RotateDeviceScreen } from './RotateDeviceScreen'

// Complete guide booklet images (21 pages)
const BOOKLET_COMPLETE_IMAGES = [
  '/booklet/Artboard 1.png',
  '/booklet/Artboard 3.png',
  '/booklet/Artboard 4.png',
  '/booklet/Artboard 5.png',
  '/booklet/Artboard 6.png',
  '/booklet/Artboard 7.png',
  '/booklet/Artboard 8.png',
  '/booklet/Artboard 9.png',
  '/booklet/Artboard 10.png',
  '/booklet/Artboard 11.png',
  '/booklet/Artboard 12.png',
  '/booklet/Artboard 13.png',
  '/booklet/Artboard 14.png',
  '/booklet/Artboard 15.png',
  '/booklet/Artboard 16.png',
  '/booklet/Artboard 17.png',
  '/booklet/Artboard 18.png',
  '/booklet/Artboard 19.png',
  '/booklet/Artboard 20.png',
  '/booklet/Artboard 21.png',
  '/booklet/Artboard 24.png',
]

// Quick 30-second guide booklet images (4 pages)
const BOOKLET_30SECS_IMAGES = [
  '/booklet-30secs/Artboard 1.png',
  '/booklet-30secs/Artboard 2.png',
  '/booklet-30secs/Artboard 3.png',
  '/booklet-30secs/Artboard 4.png',
]

/**
 * BookletViewer - A reusable modal component to display booklet pages as images
 * 
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Function to call when closing the modal
 * @param {string[]} images - Optional array of image paths (defaults to complete booklet images)
 * @param {string} title - Optional title for the booklet
 */
export function BookletViewer({ 
  isOpen, 
  onClose, 
  images = BOOKLET_COMPLETE_IMAGES,
  title = "Unscripted Conversations Guide"
}) {
  const [currentPage, setCurrentPage] = useState(0)
  const [isLandscape, setIsLandscape] = useState(true)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const containerRef = useRef(null)

  // Minimum swipe distance for navigation (in px)
  const minSwipeDistance = 50

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

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Reset page when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(0)
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return
      if (e.key === 'ArrowLeft') {
        goToPrevPage()
      } else if (e.key === 'ArrowRight') {
        goToNextPage()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentPage])

  const goToNextPage = useCallback(() => {
    if (currentPage < images.length - 1) {
      setCurrentPage(prev => prev + 1)
    }
  }, [currentPage, images.length])

  const goToPrevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1)
    }
  }, [currentPage])

  // Touch handlers for swipe gestures
  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe) {
      goToNextPage()
    } else if (isRightSwipe) {
      goToPrevPage()
    }
  }

  if (!isOpen) return null

  // Show rotate screen if in portrait mode (using shared component)
  if (!isLandscape) {
    return <RotateDeviceScreen onClose={onClose} showClose={true} />
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      ref={containerRef}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50">
        <div className="flex items-center gap-2 text-white">
          <BookOpen className="w-5 h-5" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/70 text-sm">
            {currentPage + 1} / {images.length}
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close booklet"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Image container with swipe support */}
      <div 
        className="flex-1 flex items-center justify-center relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Left navigation arrow - translucent gray background */}
        <button
          onClick={goToPrevPage}
          disabled={currentPage === 0}
          className={`absolute left-2 sm:left-4 z-10 p-2 sm:p-3 rounded-full transition-all ${
            currentPage === 0
              ? 'bg-gray-400/20 text-white/30 cursor-not-allowed'
              : 'bg-gray-600/60 hover:bg-gray-600/80 text-white shadow-lg'
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>

        {/* Current page image */}
        <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
          <img
            src={images[currentPage]}
            alt={`Page ${currentPage + 1}`}
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
          />
        </div>

        {/* Right navigation arrow - translucent gray background */}
        <button
          onClick={goToNextPage}
          disabled={currentPage === images.length - 1}
          className={`absolute right-2 sm:right-4 z-10 p-2 sm:p-3 rounded-full transition-all ${
            currentPage === images.length - 1
              ? 'bg-gray-400/20 text-white/30 cursor-not-allowed'
              : 'bg-gray-600/60 hover:bg-gray-600/80 text-white shadow-lg'
          }`}
          aria-label="Next page"
        >
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      </div>

      {/* Page indicator dots (for mobile) */}
      <div className="flex justify-center gap-1 py-3 bg-black/50 overflow-x-auto px-4">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(index)}
            className={`w-2 h-2 rounded-full transition-all flex-shrink-0 ${
              index === currentPage
                ? 'bg-white w-4'
                : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to page ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * GuideSelector - A popover component to select between complete and quick guide
 * 
 * @param {function} onSelectComplete - Called when user selects complete guide
 * @param {function} onSelectQuick - Called when user selects quick guide
 * @param {string} variant - Button variant for the trigger
 * @param {string} size - Button size for the trigger
 * @param {string} buttonLabel - Label for the trigger button
 * @param {string} className - Additional CSS classes for the trigger button
 */
export function GuideSelector({ 
  onSelectComplete, 
  onSelectQuick,
  variant = 'outline',
  size = 'default',
  buttonLabel = 'The Experience Guide',
  className = ''
}) {
  const [open, setOpen] = useState(false)
  
  const handleSelectComplete = () => {
    setOpen(false)
    onSelectComplete()
  }
  
  const handleSelectQuick = () => {
    setOpen(false)
    onSelectQuick()
  }
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={`gap-2 ${className}`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{buttonLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="center">
        <div className="p-3 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900">Choose your guide</p>
          <p className="text-xs text-gray-500 mt-0.5">How much time do you have?</p>
        </div>
        <div className="p-2 space-y-1">
          {/* Quick Guide Option */}
          <button
            onClick={handleSelectQuick}
            className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">Quick Guide</p>
              <p className="text-xs text-gray-500 mt-0.5">A 30-second read — the essentials</p>
            </div>
          </button>
          
          {/* Complete Guide Option */}
          <button
            onClick={handleSelectComplete}
            className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <BookMarked className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">Complete Guide</p>
              <p className="text-xs text-gray-500 mt-0.5">The full experience — take your time</p>
            </div>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * GuideSelectorCompact - A compact version for the game play screen
 */
export function GuideSelectorCompact({ 
  onSelectComplete, 
  onSelectQuick,
  className = ''
}) {
  return (
    <GuideSelector
      onSelectComplete={onSelectComplete}
      onSelectQuick={onSelectQuick}
      variant="ghost"
      size="sm"
      buttonLabel="Guide"
      className={`text-gray-600 ${className}`}
    />
  )
}

// Export booklet image arrays for external use
export const BOOKLET_IMAGES = BOOKLET_COMPLETE_IMAGES
export const BOOKLET_30SECS = BOOKLET_30SECS_IMAGES

export default BookletViewer

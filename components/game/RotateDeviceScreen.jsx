'use client'

import { X } from 'lucide-react'

/**
 * RotateDeviceScreen - Reusable component to prompt users to rotate to landscape mode
 * 
 * @param {function} onClose - Optional close handler (for modals like booklet viewer)
 * @param {boolean} showClose - Whether to show a close button
 */
export function RotateDeviceScreen({ onClose, showClose = false }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8 fixed inset-0 z-50">
      {/* Close button (optional, for modals) */}
      {showClose && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-6 h-6 text-gray-700" />
        </button>
      )}
      
      <div className="w-full max-w-xs">
        {/* Animated Phone */}
        <div className="animate-phone-rotate mx-auto mb-8" style={{ width: '180px' }}>
          <div className="relative">
            {/* Phone frame */}
            <img 
              src="/phone-transparent.png" 
              alt="Phone" 
              className="w-full rounded-3xl"
              style={{ backgroundColor: '#E8E8E8', border: '#000 solid 4px' }}
            />
            {/* Phone notch */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 rounded-xl"
              style={{ width: '25%', height: '4%', top: '4%', backgroundColor: 'black' }}
            />
            {/* Logo inside phone (rotated 90deg) */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 w-full p-4"
              style={{ top: '22%' }}
            >
              <img 
                src="/logo-asweallare.png" 
                alt="AS WE ALL ARE" 
                className="w-full"
                style={{ transform: 'rotate(90deg)' }}
              />
            </div>
            {/* Phone home indicator */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 rounded"
              style={{ width: '50%', height: '1%', bottom: '4%', backgroundColor: 'black' }}
            />
          </div>
        </div>
        
        {/* Instructions */}
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Please rotate your phone to landscape mode for the best experience.
          </p>
          
          {/* Do Not Disturb reminder */}
          <div className="bg-gray-100 rounded-xl p-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Enable "Do Not Disturb"</p>
                <p className="text-gray-600 text-xs mt-1">
                  Turn on Do Not Disturb mode to avoid notifications and distractions during your conversation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RotateDeviceScreen

'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, GripVertical } from 'lucide-react'
import { useTheme } from './ThemeProvider'

/**
 * ReorderableList - A reusable component for reordering items
 * 
 * @param {Array} items - Array of items to display, each should have an 'id' property
 * @param {Function} onReorder - Callback when order changes: (newItems) => void
 * @param {Function} renderItem - Render function for each item: (item, index) => ReactNode
 * @param {string} className - Additional CSS classes
 * @param {boolean} isDark - Dark mode flag
 */
export function ReorderableList({ 
  items = [], 
  onReorder, 
  renderItem,
  className = '',
  isDark = false 
}) {
  const { theme, isApple } = useTheme()
  
  const moveItem = (index, direction) => {
    const newItems = [...items]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= items.length) return
    
    // Swap items
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]]
    
    // Update display_order based on new positions
    const reorderedItems = newItems.map((item, i) => ({
      ...item,
      display_order: i + 1
    }))
    
    onReorder(reorderedItems)
  }
  
  if (items.length === 0) {
    return null
  }
  
  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item, index) => (
        <div 
          key={item.id}
          className={`flex items-center gap-2 p-2 rounded-lg group ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}
          style={{ borderRadius: isApple ? theme.borderRadius.lg : theme.borderRadius.md }}
        >
          {/* Grip handle (visual only for now) */}
          <div className={`cursor-grab ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>
            <GripVertical className="w-4 h-4" />
          </div>
          
          {/* Order number */}
          <div className={`w-6 h-6 flex items-center justify-center rounded text-xs font-medium ${isDark ? 'bg-[#2a2a2a] text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
            {index + 1}
          </div>
          
          {/* Item content */}
          <div className="flex-1 min-w-0">
            {renderItem(item, index)}
          </div>
          
          {/* Reorder buttons */}
          <div className="flex flex-col gap-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => moveItem(index, 'up')}
              disabled={index === 0}
              className={`p-0.5 rounded transition-colors ${
                index === 0 
                  ? `${isDark ? 'text-gray-700' : 'text-gray-300'} cursor-not-allowed` 
                  : `${isDark ? 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`
              }`}
              aria-label="Move up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => moveItem(index, 'down')}
              disabled={index === items.length - 1}
              className={`p-0.5 rounded transition-colors ${
                index === items.length - 1 
                  ? `${isDark ? 'text-gray-700' : 'text-gray-300'} cursor-not-allowed` 
                  : `${isDark ? 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`
              }`}
              aria-label="Move down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * SimpleReorderButtons - Just the up/down buttons for inline use
 */
export function SimpleReorderButtons({ 
  index, 
  total, 
  onMoveUp, 
  onMoveDown,
  size = 'sm' 
}) {
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  const buttonSize = size === 'sm' ? 'p-0.5' : 'p-1'
  
  return (
    <div className="flex gap-0.5">
      <button
        onClick={onMoveUp}
        disabled={index === 0}
        className={`${buttonSize} rounded transition-colors ${
          index === 0 
            ? 'text-gray-300 cursor-not-allowed' 
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
        }`}
        aria-label="Move up"
      >
        <ChevronUp className={iconSize} />
      </button>
      <button
        onClick={onMoveDown}
        disabled={index === total - 1}
        className={`${buttonSize} rounded transition-colors ${
          index === total - 1 
            ? 'text-gray-300 cursor-not-allowed' 
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
        }`}
        aria-label="Move down"
      >
        <ChevronDown className={iconSize} />
      </button>
    </div>
  )
}

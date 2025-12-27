'use client'

import { 
  FaInstagram, 
  FaTiktok, 
  FaWhatsapp, 
  FaTwitter, 
  FaFacebook, 
  FaYoutube, 
  FaLinkedin,
  FaGlobe,
  FaSpotify,
  FaPinterest,
  FaSnapchat,
  FaTelegram,
  FaDiscord,
  FaGithub,
  FaTwitch,
  FaReddit
} from 'react-icons/fa'
import { SiThreads } from 'react-icons/si'
import { useTheme } from './ThemeProvider'

// Social platform configurations
export const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: FaInstagram, color: '#E4405F', placeholder: 'https://instagram.com/...' },
  { id: 'tiktok', name: 'TikTok', icon: FaTiktok, color: '#000000', placeholder: 'https://tiktok.com/@...' },
  { id: 'whatsapp', name: 'WhatsApp', icon: FaWhatsapp, color: '#25D366', placeholder: 'https://wa.me/...' },
  { id: 'twitter', name: 'Twitter/X', icon: FaTwitter, color: '#1DA1F2', placeholder: 'https://twitter.com/...' },
  { id: 'threads', name: 'Threads', icon: SiThreads, color: '#000000', placeholder: 'https://threads.net/@...' },
  { id: 'facebook', name: 'Facebook', icon: FaFacebook, color: '#1877F2', placeholder: 'https://facebook.com/...' },
  { id: 'youtube', name: 'YouTube', icon: FaYoutube, color: '#FF0000', placeholder: 'https://youtube.com/@...' },
  { id: 'linkedin', name: 'LinkedIn', icon: FaLinkedin, color: '#0A66C2', placeholder: 'https://linkedin.com/in/...' },
  { id: 'spotify', name: 'Spotify', icon: FaSpotify, color: '#1DB954', placeholder: 'https://open.spotify.com/...' },
  { id: 'pinterest', name: 'Pinterest', icon: FaPinterest, color: '#E60023', placeholder: 'https://pinterest.com/...' },
  { id: 'snapchat', name: 'Snapchat', icon: FaSnapchat, color: '#FFFC00', placeholder: 'https://snapchat.com/add/...' },
  { id: 'telegram', name: 'Telegram', icon: FaTelegram, color: '#26A5E4', placeholder: 'https://t.me/...' },
  { id: 'discord', name: 'Discord', icon: FaDiscord, color: '#5865F2', placeholder: 'https://discord.gg/...' },
  { id: 'github', name: 'GitHub', icon: FaGithub, color: '#181717', placeholder: 'https://github.com/...' },
  { id: 'twitch', name: 'Twitch', icon: FaTwitch, color: '#9146FF', placeholder: 'https://twitch.tv/...' },
  { id: 'reddit', name: 'Reddit', icon: FaReddit, color: '#FF4500', placeholder: 'https://reddit.com/r/...' },
  { id: 'website', name: 'Website', icon: FaGlobe, color: '#718096', placeholder: 'https://...' },
]

// Get platform config by name (case-insensitive)
export function getPlatformConfig(name) {
  if (!name) return SOCIAL_PLATFORMS.find(p => p.id === 'website')
  const normalized = name.toLowerCase().replace(/[^a-z]/g, '')
  return SOCIAL_PLATFORMS.find(p => 
    p.id === normalized || 
    p.name.toLowerCase().replace(/[^a-z]/g, '') === normalized
  ) || SOCIAL_PLATFORMS.find(p => p.id === 'website')
}

// Social Icon Component - renders the appropriate icon for a platform
export function SocialIcon({ platform, size = 20, className = '', colored = false }) {
  const config = getPlatformConfig(platform)
  const Icon = config?.icon || FaGlobe
  
  return (
    <Icon 
      size={size} 
      className={className}
      style={colored ? { color: config?.color } : undefined}
    />
  )
}

// Social Link Component - renders a clickable social link with icon
export function SocialLink({ platform, url, size = 20, showLabel = false, className = '' }) {
  const config = getPlatformConfig(platform)
  const { theme, isApple } = useTheme()
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors ${className}`}
      style={{ borderRadius: isApple ? theme.borderRadius.full : theme.borderRadius.md }}
    >
      <SocialIcon platform={platform} size={size} colored />
      {showLabel && <span className="text-sm font-medium">{config?.name}</span>}
    </a>
  )
}

// Social Platform Selector - dropdown for selecting a platform
export function SocialPlatformSelector({ value, onChange, className = '' }) {
  const { theme, isApple } = useTheme()
  
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-2 border border-gray-300 bg-white text-sm font-medium ${className}`}
      style={{ borderRadius: isApple ? theme.borderRadius.md : theme.borderRadius.sm }}
    >
      {SOCIAL_PLATFORMS.map((platform) => (
        <option key={platform.id} value={platform.name}>
          {platform.name}
        </option>
      ))}
    </select>
  )
}

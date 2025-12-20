# Sound Files for AS WE ALL ARE

This directory contains audio files used in the game.

## Current Implementation

The timer bell sounds are currently generated programmatically using the Web Audio API.
This provides a reliable fallback without requiring external audio files.

## Sound File Placeholders

If you want to use custom audio files instead of the generated sounds, replace the following:

### Expected Files:

| File | Purpose | Duration | Notes |
|------|---------|----------|-------|
| `bell-1.mp3` | Single ding at 1 minute | ~0.5s | Boxing bell style, bright metallic |
| `bell-2.mp3` | Double ding at 2 minutes | ~1s | Two dings, 400ms apart |
| `bell-3.mp3` | Triple ding at 3 minutes | ~1.5s | Three dings, 400ms apart |

### Audio Specifications:
- **Format**: MP3 or WAV (MP3 preferred for smaller file size)
- **Sample Rate**: 44.1kHz or 48kHz
- **Bit Rate**: 128kbps minimum for MP3
- **Style**: Classic boxing bell / hotel bell / meditation bell
- **Volume**: Normalized, not too loud

## How to Replace

1. Create or source your bell sound files
2. Name them `bell-1.mp3`, `bell-2.mp3`, `bell-3.mp3`
3. Place them in this directory (`/public/sounds/`)
4. Update the `GameTimer.jsx` component to use `<audio>` elements instead of Web Audio API:

```jsx
// Example code to use audio files
const playBellFile = (count) => {
  const audio = new Audio(`/sounds/bell-${count}.mp3`)
  audio.play()
}
```

## Current Placeholder Files

- `bell-option-1.mp3.txt` - Placeholder note (delete after adding real file)
- `bell-option-2.mp3.txt` - Placeholder note (delete after adding real file)
- `bell-option-3.mp3.txt` - Placeholder note (delete after adding real file)

## Recommended Free Sound Sources

1. **Freesound.org** - Search for "boxing bell" or "hotel bell"
2. **Pixabay** - Free sound effects
3. **Zapsplat** - Free with attribution

Remember to check licensing before using any sounds commercially.

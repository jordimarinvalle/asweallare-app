import { state, startGame, app } from '../js/app.js'

export default (props, { $f7, $on, $el }) => {
  let selectedBoxIds = []
  
  $on('pageInit', () => {
    // Handle deck tile clicks
    $el.value.querySelectorAll('.deck-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        const boxId = tile.dataset.boxId
        const isLocked = tile.dataset.locked === 'true'
        const isSample = tile.dataset.sample === 'true'
        
        if (isLocked && !isSample) {
          $f7.dialog.alert('This deck is locked. Purchase it in the Store to unlock.', 'Locked')
          return
        }
        
        // Toggle selection
        if (selectedBoxIds.includes(boxId)) {
          selectedBoxIds = selectedBoxIds.filter(id => id !== boxId)
          tile.classList.remove('selected')
        } else {
          selectedBoxIds.push(boxId)
          tile.classList.add('selected')
        }
        
        // Update play button state
        const playBtn = $el.value.querySelector('.play-btn')
        if (playBtn) {
          playBtn.classList.toggle('disabled', selectedBoxIds.length === 0)
        }
      })
    })
    
    // Handle play button
    const playBtn = $el.value.querySelector('.play-btn')
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (selectedBoxIds.length > 0) {
          startGame(selectedBoxIds)
          $f7.views.main.router.navigate('/game/')
        }
      })
    }
  })
  
  return () => {
    const boxes = state.boxes || []
    
    // Filter for sample/owned boxes (simplified - show all for now)
    const availableBoxes = boxes.filter(b => b.is_sample || true)
    
    const renderDeckTile = (box) => {
      const isLocked = !box.is_sample // Simplified lock logic
      const heroImage = box.path ? `/assets/collections/${box.path}/hero.jpg` : '/assets/logo-asweallare.png'
      
      return /* html */ `
        <div class="deck-tile" data-box-id="${box.id}" data-locked="${isLocked}" data-sample="${box.is_sample}">
          <img src="${heroImage}" alt="${box.name}" onerror="this.src='/assets/logo-asweallare.png'" />
          ${box.is_sample ? '<span class="sample-badge">SAMPLE</span>' : ''}
          ${isLocked && !box.is_sample ? `
            <div class="lock-overlay">
              <i class="f7-icons" style="color: white; font-size: 32px;">lock_fill</i>
            </div>
          ` : ''}
          <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 12px; background: linear-gradient(transparent, rgba(0,0,0,0.7));">
            <p style="color: white; font-weight: 600; font-size: 14px; margin: 0;">${box.name}</p>
          </div>
        </div>
      `
    }
    
    return /* html */ `
      <div class="page" data-name="experience">
        <div class="navbar">
          <div class="navbar-bg"></div>
          <div class="navbar-inner">
            <div class="title">Select Deck</div>
          </div>
        </div>
        
        <div class="toolbar tabbar tabbar-labels tabbar-floating toolbar-bottom">
          <div class="toolbar-inner">
            <a href="/" class="tab-link">
              <i class="f7-icons">house_fill</i>
              <span class="tabbar-label">Home</span>
            </a>
            <a href="/experience/" class="tab-link tab-link-active">
              <i class="f7-icons">gamecontroller_fill</i>
              <span class="tabbar-label">Experience</span>
            </a>
            <a href="/store/" class="tab-link">
              <i class="f7-icons">bag_fill</i>
              <span class="tabbar-label">Store</span>
            </a>
            <a href="/profile/" class="tab-link">
              <i class="f7-icons">person_fill</i>
              <span class="tabbar-label">Profile</span>
            </a>
          </div>
        </div>
        
        <div class="page-content">
          <div class="block-title">Choose Your Decks</div>
          <div class="block">
            <p style="color: #8E8E93;">Select one or more decks to play with. Tap to select, then press Play.</p>
          </div>
          
          <div class="deck-scroll">
            ${availableBoxes.map(renderDeckTile).join('')}
          </div>
          
          <div class="block" style="margin-top: 24px;">
            <button class="button button-large button-fill play-btn disabled" style="max-width: 280px; margin: 0 auto;">
              <i class="f7-icons">play_fill</i>
              <span style="margin-left: 8px;">Play</span>
            </button>
          </div>
          
          <div class="block" style="padding-bottom: 100px;"></div>
        </div>
      </div>
    `
  }
}

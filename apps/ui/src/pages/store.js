import { state, app } from '../js/app.js'

export default (props, { $f7 }) => {
  return () => {
    const boxes = state.boxes || []
    const user = state.user
    
    const renderBoxCard = (box) => {
      const price = box.prices
      const priceDisplay = price ? `$${price.amount}` : 'Free'
      const heroImage = box.path ? `/assets/collections/${box.path}/hero.jpg` : '/assets/logo-asweallare.png'
      
      return /* html */ `
        <div class="card">
          <div class="card-header" style="height: 160px; padding: 0; overflow: hidden;">
            <img src="${heroImage}" alt="${box.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/assets/logo-asweallare.png'" />
            ${box.is_sample ? '<span style="position:absolute;top:8px;right:8px;background:#D12128;color:white;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:600;">SAMPLE</span>' : ''}
          </div>
          <div class="card-content card-content-padding">
            <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 4px 0;">${box.name}</h3>
            <p style="color: #8E8E93; font-size: 14px; margin: 0 0 12px 0;">${box.tagline || box.description_short || ''}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 20px; font-weight: 700; color: #D12128;">${priceDisplay}</span>
              ${!box.is_sample ? `
                <button class="button button-fill button-small" onclick="alert('Purchase coming soon!')">
                  Buy Now
                </button>
              ` : '<span style="color: #34C759; font-size: 14px; font-weight: 500;">Included</span>'}
            </div>
          </div>
        </div>
      `
    }
    
    return /* html */ `
      <div class="page" data-name="store">
        <div class="navbar">
          <div class="navbar-bg"></div>
          <div class="navbar-inner">
            <div class="title">Store</div>
          </div>
        </div>
        
        <div class="toolbar tabbar tabbar-labels tabbar-floating toolbar-bottom">
          <div class="toolbar-inner">
            <a href="/" class="tab-link">
              <i class="f7-icons">house_fill</i>
              <span class="tabbar-label">Home</span>
            </a>
            <a href="/experience/" class="tab-link">
              <i class="f7-icons">gamecontroller_fill</i>
              <span class="tabbar-label">Experience</span>
            </a>
            <a href="/store/" class="tab-link tab-link-active">
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
          ${!user ? `
            <div class="block block-strong inset margin-top" style="text-align: center; padding: 40px 20px;">
              <i class="f7-icons" style="font-size: 48px; color: #8E8E93;">bag</i>
              <h2 style="margin-top: 16px;">Sign in to Purchase</h2>
              <p style="color: #8E8E93;">Sign in to buy card decks and access your purchases</p>
              <a href="/profile/" class="button button-fill" style="margin-top: 16px; max-width: 200px; margin-left: auto; margin-right: auto;">Sign In</a>
            </div>
          ` : ''}
          
          <div class="block-title">Card Decks</div>
          
          <div class="list media-list inset">
            ${boxes.filter(b => !b.is_sample).map(renderBoxCard).join('')}
          </div>
          
          <div class="block-title">Sample Decks (Free)</div>
          <div class="list media-list inset">
            ${boxes.filter(b => b.is_sample).map(renderBoxCard).join('')}
          </div>
          
          <div class="block" style="padding-bottom: 100px;"></div>
        </div>
      </div>
    `
  }
}

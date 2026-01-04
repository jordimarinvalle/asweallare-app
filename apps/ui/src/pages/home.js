import { state, app } from '../js/app.js'

export default (props, { $f7 }) => {
  return () => {
    const config = state.appConfig || {}
    
    return /* html */ `
      <div class="page" data-name="home">
        <div class="navbar">
          <div class="navbar-bg"></div>
          <div class="navbar-inner">
            <div class="title">AS WE ALL ARE</div>
          </div>
        </div>
        
        <div class="toolbar tabbar tabbar-labels tabbar-floating toolbar-bottom">
          <div class="toolbar-inner">
            <a href="/" class="tab-link tab-link-active">
              <i class="f7-icons">house_fill</i>
              <span class="tabbar-label">Home</span>
            </a>
            <a href="/experience/" class="tab-link">
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
          <div class="block block-strong inset margin-top">
            <div style="text-align: center; padding: 40px 20px;">
              <img src="/assets/logo-asweallare.png" alt="AS WE ALL ARE" style="max-width: 200px; margin-bottom: 24px;" />
              <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 8px;">${config.title || 'Unscripted Conversations'}</h1>
              <p style="color: #8E8E93; font-size: 16px; margin-bottom: 32px;">${config.tagline || 'A therapeutic conversational card game'}</p>
              
              <a href="/experience/" class="button button-large button-fill" style="max-width: 280px; margin: 0 auto;">
                Start Playing
              </a>
            </div>
          </div>
          
          <div class="block-title">About</div>
          <div class="block block-strong inset">
            <p>${config.promise || 'Know more about each other without the need to ask any question'}</p>
          </div>
          
          <div class="block" style="padding-bottom: 100px;"></div>
        </div>
      </div>
    `
  }
}

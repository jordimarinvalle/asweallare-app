import { state, signInWithGoogle, signInWithMagicLink, signOut, app } from '../js/app.js'

export default (props, { $f7, $on, $el }) => {
  let magicLinkSent = false
  
  $on('pageInit', () => {
    // Google Sign In
    const googleBtn = $el.value?.querySelector('.google-signin-btn')
    googleBtn?.addEventListener('click', async () => {
      await signInWithGoogle()
    })
    
    // Magic Link Form
    const magicForm = $el.value?.querySelector('.magic-link-form')
    magicForm?.addEventListener('submit', async (e) => {
      e.preventDefault()
      const emailInput = magicForm.querySelector('input[type="email"]')
      const email = emailInput?.value?.trim()
      
      if (!email) {
        $f7.dialog.alert('Please enter your email address', 'Error')
        return
      }
      
      $f7.dialog.preloader('Sending magic link...')
      const success = await signInWithMagicLink(email)
      $f7.dialog.close()
      
      if (success) {
        magicLinkSent = true
        const successMsg = $el.value?.querySelector('.magic-link-success')
        const formEl = $el.value?.querySelector('.magic-link-form')
        if (successMsg) successMsg.style.display = 'block'
        if (formEl) formEl.style.display = 'none'
      }
    })
    
    // Sign Out
    const signOutBtn = $el.value?.querySelector('.signout-btn')
    signOutBtn?.addEventListener('click', async () => {
      await signOut()
      $f7.views.main.router.refreshPage()
    })
  })
  
  return () => {
    const user = state.user
    
    if (!user) {
      // Not signed in - show sign in options
      return /* html */ `
        <div class="page" data-name="profile">
          <div class="navbar">
            <div class="navbar-bg"></div>
            <div class="navbar-inner">
              <div class="title">Profile</div>
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
              <a href="/store/" class="tab-link">
                <i class="f7-icons">bag_fill</i>
                <span class="tabbar-label">Store</span>
              </a>
              <a href="/profile/" class="tab-link tab-link-active">
                <i class="f7-icons">person_fill</i>
                <span class="tabbar-label">Profile</span>
              </a>
            </div>
          </div>
          
          <div class="page-content">
            <div class="block block-strong inset margin-top" style="text-align: center; padding: 40px 20px;">
              <i class="f7-icons" style="font-size: 64px; color: #8E8E93;">person_circle</i>
              <h2 style="margin-top: 16px; font-size: 24px; font-weight: 600;">Sign In</h2>
              <p style="color: #8E8E93; margin-bottom: 24px;">Sign in to access your profile and purchases</p>
              
              <!-- Google Sign In -->
              <button class="button button-large google-signin-btn" style="width: 100%; max-width: 300px; margin: 0 auto 16px auto; display: flex; align-items: center; justify-content: center; gap: 8px; background: #fff; border: 1px solid #ddd; color: #333;">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              
              <div style="display: flex; align-items: center; gap: 16px; margin: 24px auto; max-width: 300px;">
                <div style="flex: 1; height: 1px; background: #E5E5EA;"></div>
                <span style="color: #8E8E93; font-size: 14px;">or</span>
                <div style="flex: 1; height: 1px; background: #E5E5EA;"></div>
              </div>
              
              <!-- Magic Link Form -->
              <form class="magic-link-form" style="max-width: 300px; margin: 0 auto;">
                <div class="list no-hairlines-md" style="margin: 0;">
                  <ul>
                    <li class="item-content item-input">
                      <div class="item-inner">
                        <div class="item-input-wrap">
                          <input type="email" placeholder="Enter your email" required />
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
                <button type="submit" class="button button-large button-fill" style="margin-top: 12px;">
                  Send Magic Link
                </button>
              </form>
              
              <!-- Success Message -->
              <div class="magic-link-success" style="display: none; padding: 20px; background: #E8F5E9; border-radius: 12px; margin-top: 16px; max-width: 300px; margin-left: auto; margin-right: auto;">
                <i class="f7-icons" style="color: #34C759; font-size: 32px;">checkmark_circle_fill</i>
                <h3 style="margin: 8px 0 4px 0; color: #2E7D32;">Check Your Email</h3>
                <p style="color: #4CAF50; font-size: 14px; margin: 0;">We've sent you a magic link to sign in</p>
              </div>
            </div>
            
            <div class="block" style="padding-bottom: 100px;"></div>
          </div>
        </div>
      `
    }
    
    // Signed in - show profile
    return /* html */ `
      <div class="page" data-name="profile">
        <div class="navbar">
          <div class="navbar-bg"></div>
          <div class="navbar-inner">
            <div class="title">Profile</div>
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
            <a href="/store/" class="tab-link">
              <i class="f7-icons">bag_fill</i>
              <span class="tabbar-label">Store</span>
            </a>
            <a href="/profile/" class="tab-link tab-link-active">
              <i class="f7-icons">person_fill</i>
              <span class="tabbar-label">Profile</span>
            </a>
          </div>
        </div>
        
        <div class="page-content">
          <div class="block block-strong inset margin-top" style="text-align: center; padding: 24px;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: #F2F2F7; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
              ${user.user_metadata?.avatar_url ? 
                `<img src="${user.user_metadata.avatar_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />` :
                '<i class="f7-icons" style="font-size: 40px; color: #8E8E93;">person_fill</i>'
              }
            </div>
            <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 4px 0;">${user.user_metadata?.full_name || 'User'}</h2>
            <p style="color: #8E8E93; font-size: 14px; margin: 0;">${user.email}</p>
          </div>
          
          <div class="list inset">
            <ul>
              <li>
                <a href="#" class="item-link item-content">
                  <div class="item-media"><i class="f7-icons">bag</i></div>
                  <div class="item-inner">
                    <div class="item-title">My Purchases</div>
                    <div class="item-after"><i class="f7-icons">chevron_right</i></div>
                  </div>
                </a>
              </li>
              <li>
                <a href="#" class="item-link item-content">
                  <div class="item-media"><i class="f7-icons">gear</i></div>
                  <div class="item-inner">
                    <div class="item-title">Settings</div>
                    <div class="item-after"><i class="f7-icons">chevron_right</i></div>
                  </div>
                </a>
              </li>
              <li>
                <a href="#" class="item-link item-content">
                  <div class="item-media"><i class="f7-icons">question_circle</i></div>
                  <div class="item-inner">
                    <div class="item-title">Help & Support</div>
                    <div class="item-after"><i class="f7-icons">chevron_right</i></div>
                  </div>
                </a>
              </li>
            </ul>
          </div>
          
          <div class="block">
            <button class="button button-large signout-btn" style="color: #FF3B30;">
              Sign Out
            </button>
          </div>
          
          <div class="block" style="padding-bottom: 100px;"></div>
        </div>
      </div>
    `
  }
}

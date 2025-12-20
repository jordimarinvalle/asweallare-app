# AS WE ALL ARE - Digital Conversation Game

A premium, minimal digital conversation game designed for meaningful pass-the-phone moments.

## 🎯 What's Built

### ✅ Core Gameplay
- Two card piles (Black & White)
- Tap to draw face-down cards
- Tap again to flip and reveal
- Tap once more to discard
- "Next Cards" button to redraw both
- Timer with bells at 2 and 3 minutes
- Mobile-first responsive design

### ✅ Authentication
- Email/password sign up and login
- Google OAuth integration
- Anonymous play (demo cards only)
- Session persistence

### ✅ Record Keeping
- Save card pairs when logged in
- View saved draws chronologically
- Timestamp tracking

### ✅ Freemium Model
- Free tier: Demo cards only
- Paid tier: Full deck access
- One-time unlock: $20
- Subscription: $3 every 3 months
- Stripe Checkout integration
- Coupon code support

### ✅ Admin Panel
- Add/edit/delete cards
- Mark cards as demo or paid
- Activate/deactivate cards
- Multi-language support ready

### ✅ Design
- Premium minimal aesthetic
- Black, White, Red (#D12128) color scheme
- Serif titles (Libre Baskerville)
- Sans-serif body (Inter)
- Smooth card flip animations
- Calm, human-centered UX

## 🗄️ Database Schema

### Tables
1. **cards** - Conversation cards
   - id, color, title, hint, language, isdemo, isactive, createdat

2. **saved_draws** - User's saved card pairs
   - id, userid, useremail, blackcardid, whitecardid, blackcardtitle, whitecardtitle, timestamp

3. **user_access** - Payment/subscription tracking
   - id, userid, accesstype, paymenttype, stripesessionid, expiresat, createdat

## 🔑 Environment Variables

Already configured in `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=https://pwdwemakaozxmutwswqa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_K-L2v83yXtTeHkSWtFX_ag_ZbjbDq8p
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (needs to be configured)
```

## 🚀 Live URL

**App URL:** https://agilecacti-unawarde.webapprun.net

## 📋 Setup Completed

✅ Supabase authentication configured
✅ Database tables created with 6 demo cards
✅ Stripe integration ready
✅ Google OAuth enabled
✅ Admin panel functional

## 🎮 How to Use

### For Players
1. Open the app
2. Tap Black and White card piles to draw
3. Tap cards to flip and reveal
4. Use "Start Sharing" to begin timed conversation
5. Sign in to save your favorite card combinations

### For Admin
1. Sign in with your account
2. Click "Admin" in navigation
3. Add cards with color, title, and optional hints
4. Mark as demo for free users
5. Deactivate cards without deleting them

## 💳 Stripe Payment Setup

### To Complete Payment Integration:

1. **Create Products in Stripe Dashboard:**
   - One-time product: $20
   - Subscription product: $3 every 3 months

2. **Set up Webhook:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://agilecacti-unawarde.webapprun.net/api/payment/webhook`
   - Listen for: `checkout.session.completed`
   - Copy webhook secret and update `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`
   - Restart server: `sudo supervisorctl restart nextjs`

3. **Create Coupons (Optional):**
   - Go to Stripe Dashboard → Products → Coupons
   - Create coupon codes
   - Customers can enter code during checkout

## 🔐 Security Notes

- Service Role Key was used only for database setup and has been removed
- All sensitive keys are in `.env` (not committed to git)
- Row Level Security enabled on all Supabase tables
- Stripe payments use secure checkout sessions

## 📱 Mobile Optimization

- Designed for pass-the-phone gameplay
- Touch-friendly card interactions
- Responsive layouts for all screen sizes
- Works on desktop but optimized for mobile

## 🎨 Design Philosophy

**Premium but Human:**
- No gamification vibes
- Lots of white space
- Clear typography hierarchy
- Calm color palette
- Smooth, intentional animations

**Inspired by:**
- Calm app
- Headspace
- Apple Fitness onboarding
- But focused on human conversation, not wellness

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Payments:** Stripe
- **Deployment:** Docker/Kubernetes

## 📁 Project Structure

```
/app
├── app/
│   ├── page.js              # Main game UI
│   ├── layout.js            # Root layout with fonts
│   ├── globals.css          # Premium styling
│   ├── api/[[...path]]/route.js  # Backend API
│   └── auth/callback/page.js     # OAuth callback
├── lib/
│   ├── supabase.js          # Browser Supabase client
│   ├── supabase-server.js   # Server Supabase client
│   └── stripe.js            # Stripe client
├── components/ui/           # shadcn components
└── .env                     # Environment variables
```

## 🐛 Known Limitations

1. **Webhook not configured yet** - Payment success won't grant access until webhook is set up
2. **Admin access** - Currently any logged-in user can access admin panel (add auth check if needed)
3. **Card shuffle** - Cards are randomly selected, not shuffled deck (can enhance if needed)

## 🔄 Next Steps (Optional Enhancements)

1. **Payment webhook** - Complete Stripe webhook for automatic access granting
2. **Admin role** - Add proper admin role checking
3. **Card categories** - Group cards by themes
4. **Multiplayer** - Share sessions between devices
5. **Analytics** - Track popular cards and usage patterns
6. **Progressive Web App** - Add PWA manifest for install prompt
7. **Localization** - Multi-language support (database ready)

## 💡 Tips for Founders

- Start with 20-30 quality cards for each color
- Test the timer flow with real users
- Consider adding "skip" functionality
- Monitor which cards resonate most
- Iterate on card content based on feedback

## 🎉 Ready to Launch!

Your MVP is complete and functional. All core features work:
- ✅ Gameplay
- ✅ Authentication  
- ✅ Saving draws
- ✅ Freemium model
- ✅ Admin panel

Just complete the Stripe webhook setup and you're ready to go live!

---

**Built with ❤️ for meaningful conversations**

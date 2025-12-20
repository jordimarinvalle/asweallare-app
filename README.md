# AS WE ALL ARE - Conversation Card Game

A mobile-first web app for meaningful conversations. Draw cards, share stories, and connect with others through thoughtful prompts.

## 🎮 Features

- **Card Drawing**: Draw black and white cards with a single tap
- **Card Boxes**: Multiple themed collections (Demo, White, Black, Red)
- **Timer**: Built-in sharing timer with bell sounds at 1, 2, and 3 minutes
- **Save Draws**: Logged-in users can save memorable card combinations
- **Store**: Purchase individual boxes or subscribe for all-access
- **Admin Panel**: Manage cards and boxes

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Supabase](https://supabase.com) account (free tier works)
- [Stripe](https://stripe.com) account (for payments)

### 1. Clone and Setup Environment

```bash
# Clone the repository
git clone <your-repo-url>
cd as-we-all-are

# Copy environment template
cp .env.example .env.local
```

### 2. Configure Environment Variables

Edit `.env.local` with your credentials:

```env
# Supabase (from https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Setup Database

Run these SQL files in your Supabase SQL Editor (Dashboard → SQL Editor):

1. **Initial Setup**: `supabase-setup.sql`
2. **Boxes System**: `supabase-boxes-setup.sql`
3. **Card Images**: `supabase-images-setup.sql`

### 4. Run with Docker

```bash
# Production mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

The app will be available at **http://localhost:3000**

### 5. Development Mode (with hot reload)

```bash
# Run in development mode
docker-compose --profile dev up app-dev

# Or without Docker
yarn install
yarn dev
```

## 📁 Project Structure

```
├── app/
│   ├── page.js                    # Main game UI
│   ├── layout.js                  # Root layout
│   ├── globals.css                # Styles
│   ├── api/
│   │   ├── [[...path]]/route.js   # Main API routes
│   │   ├── payment/webhook/       # Stripe webhook
│   │   └── admin/import-cards/    # Card import utility
│   └── auth/callback/             # OAuth callback
├── components/
│   └── ui/                        # shadcn components
├── lib/
│   ├── supabase.js                # Browser client
│   ├── supabase-server.js         # Server client
│   └── stripe.js                  # Stripe client
├── public/
│   ├── cards/                     # Card images by box
│   │   ├── white-box-demo/
│   │   ├── white-box-108/
│   │   ├── white-box-216/
│   │   ├── black-box-108/
│   │   └── red-box-108/
│   ├── black-card-back.png        # Card back image
│   └── white-card-back.png        # Card back image
├── docker-compose.yml
├── Dockerfile
├── Dockerfile.dev
└── .env.example
```

## 🗄️ Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `boxes` | Card collections (Demo, White, Black, Red) |
| `cards` | Individual cards with title, hint, image_path |
| `saved_draws` | User's saved card pairs |
| `user_products` | Box purchases and subscriptions |
| `subscription_plans` | Pricing configuration |
| `user_access` | Legacy payment tracking |

### Default Boxes

| Box ID | Name | Cards | Price |
|--------|------|-------|-------|
| `box_demo` | Demo Box | 24 | Free |
| `box_white` | White Box | 108 | $15 |
| `box_white_xl` | White Box XL | 216 | $25 |
| `box_black` | Black Box | 108 | $15 |
| `box_red` | Red Box | 108 | $15 |

## 🔧 API Endpoints

### Public
- `GET /api/boxes` - List all boxes with access info
- `GET /api/cards?box_ids=...` - Get cards for selected boxes
- `GET /api/plans` - Get subscription plans

### Authenticated
- `POST /api/auth/signup` - Create account
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/user` - Get current user
- `GET /api/draws` - Get saved draws
- `POST /api/draws/save` - Save a draw

### Payments
- `POST /api/payment/purchase-box` - Buy a single box
- `POST /api/payment/subscribe-all` - Subscribe to all boxes
- `POST /api/payment/webhook` - Stripe webhook

### Admin
- `GET/POST /api/admin/cards` - Manage cards
- `GET/POST /api/admin/boxes` - Manage boxes
- `GET/POST /api/admin/import-cards` - Import cards from images

## 🎨 Adding Card Images

1. Place PNG images in the appropriate folder:
   ```
   public/cards/{box-folder}/{box-folder}-blacks/  # Black cards
   public/cards/{box-folder}/{box-folder}-whites/  # White cards
   ```

2. Run the import (dry run first):
   ```bash
   # Preview what will be imported
   curl -X POST http://localhost:3000/api/admin/import-cards \
     -H "Content-Type: application/json" \
     -d '{"dryRun": true}'
   
   # Actually import
   curl -X POST http://localhost:3000/api/admin/import-cards \
     -H "Content-Type: application/json" \
     -d '{"dryRun": false}'
   ```

## 💳 Stripe Webhook Setup

### Local Development
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/payment/webhook
```

### Production
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/payment/webhook`
3. Select events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`
4. Copy the webhook secret to your environment

## 🔒 Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `NEXT_PUBLIC_BASE_URL` | App base URL |

## 📱 Mobile Experience

The app is designed mobile-first:
- Landscape mode enforced during gameplay
- Touch-optimized card interactions
- Single-tap to draw and reveal cards

---

**Built with ❤️ for meaningful conversations**

# AS WE ALL ARE - Conversation Card Game

A mobile-first web app for meaningful conversations. Draw cards, share stories, and connect with others through thoughtful prompts.

## 🎮 Features

- **Card Drawing**: Draw black and white cards with a single tap
- **Card Boxes**: Multiple themed collections (Demo, White, Black, Red)
- **Timer**: Built-in sharing timer with visual feedback
- **Experience Guide**: In-app booklet viewer (full + 30-second quick guide)
- **Store**: Purchase individual boxes or subscribe for all-access
- **Admin Panel**: Manage cards, boxes, collection series, prices, and bundles

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Supabase](https://supabase.com) account (free tier works) OR local PostgreSQL
- [Stripe](https://stripe.com) account (for payments)

### Option A: Using Supabase (Recommended for Production)

#### 1. Clone and Setup Environment

```bash
# Clone the repository
git clone <your-repo-url>
cd as-we-all-are

# Copy environment template
cp .env.example .env.local
```

#### 2. Configure Environment Variables

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

#### 3. Setup Supabase Database

Run these SQL files in order in the Supabase SQL Editor:

1. **Schema**: `/database/schema.sql` - Creates all tables and indexes
2. **Fixtures**: `/database/fixtures.sql` - Inserts initial data (boxes, prices, etc.)
3. **Fix RLS** (if needed): `/database/fix-rls-policies.sql` - Simplifies row-level security

#### 4. Run with Docker

```bash
docker-compose up app
```

### Option B: Using Local PostgreSQL (Development)

#### 1. Start Local Environment

```bash
# Start PostgreSQL + App + pgAdmin
docker-compose --profile local up

# PostgreSQL will auto-run schema.sql and fixtures.sql on first start
```

#### 2. Access Services

- **App**: http://localhost:3000
- **pgAdmin**: http://localhost:5050 (admin@admin.com / admin)
- **PostgreSQL**: localhost:5432 (postgres / postgres)

#### 3. Connect pgAdmin to PostgreSQL

1. Open http://localhost:5050
2. Add New Server:
   - Name: Local
   - Host: postgres
   - Port: 5432
   - Database: asweallare
   - Username: postgres
   - Password: postgres

## 📁 Database Files

| File | Purpose |
|------|---------|
| `/database/schema.sql` | Complete database schema (tables, indexes, triggers) |
| `/database/fixtures.sql` | Initial data (series, boxes, prices, bundles, sample cards) |
| `/database/fix-rls-policies.sql` | Simplified RLS policies for Supabase |

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
│   ├── ui/                        # shadcn components
│   └── game/
│       └── BookletViewer.jsx      # Reusable booklet viewer modal
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
│   ├── booklet/                   # Complete experience guide (21 pages)
│   ├── booklet-30secs/            # Quick 30-second guide (4 pages)
│   ├── black-card-back.png        # Card back image
│   └── white-card-back.png        # Card back image
├── docker-compose.yml
├── Dockerfile
├── Dockerfile.dev
└── .env.example
```

## 📖 Experience Guides

The app includes two in-app guides accessible via the "The Experience Guide" button:

| Guide | Location | Pages | Description |
|-------|----------|-------|-------------|
| `booklet/` | `/public/booklet/` | 21 | Complete guide with full instructions |
| `booklet-30secs/` | `/public/booklet-30secs/` | 4 | Quick 30-second read with essentials |

Both guides are displayed in a mobile-optimized viewer with swipe navigation and require landscape orientation.

## 🗄️ Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `collection_series` | Game families (e.g., Unscripted Conversations) |
| `boxes` | Card collections/decks with metadata |
| `cards` | Individual cards with title, hint, image_path |
| `prices` | Membership/access pricing options |
| `bundles` | Links boxes to prices |
| `user_products` | Legacy box purchases (maintained for backwards compatibility) |
| `user_memberships` | Time-based membership tracking |
| `subscription_plans` | Legacy pricing configuration |

### New Data Model (v2)

#### Collection Series
Represents a family of games that can be combined together.
- Boxes can only be combined if they belong to the same CollectionSeries
- UI groups boxes by CollectionSeries

#### Boxes (Decks)
Enhanced with:
- `collection_series_id` - Links to parent series
- `description_short` - Brief description
- `tagline` - Marketing tagline
- `topics` - Array of example topics
- `color_palette` - Array of 3 brand colors
- `path` - Asset folder path
- `display_order` - Intentional ordering

#### Prices (Membership Options)
Time-based access options:
- 24-hour pass ($1)
- 90-day membership ($3)
- 180-day membership ($5)
- Annual membership ($7)

#### Bundles
Links boxes to prices for purchasing.

### Default Boxes

| Box ID | Name | Cards | Tagline |
|--------|------|-------|---------|
| `box_demo` | Demo Box | 24 | Sample cards |
| `box_white` | White Box | 108 | Level 1 — Life · Vol 1 |
| `box_white_xl` | White Box XL | 216 | Level 1 — Life · Vols 1 & 2 |
| `box_black` | Black Box | 108 | Level 3 — Life Struggles |
| `box_red` | Red Box | 108 | Level 2 — Intimacy & Love |

## 🔧 API Endpoints

### Public
- `GET /api/boxes` - List all boxes with access info
- `GET /api/cards?box_ids=...` - Get cards for selected boxes
- `GET /api/plans` - Get subscription plans
- `GET /api/store/prices` - Get active pricing options
- `GET /api/store/bundles` - Get active bundles

### Authenticated
- `POST /api/auth/signup` - Create account
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/reset-password` - Request password reset
- `GET /api/auth/user` - Get current user

### Payments
- `POST /api/payment/purchase-box` - Buy a single box
- `POST /api/payment/subscribe-all` - Subscribe to all boxes
- `POST /api/payment/webhook` - Stripe webhook

### Admin (Protected)
- `GET/POST /api/admin/cards` - Manage cards
- `GET/POST /api/admin/boxes` - Manage boxes
- `PUT /api/admin/boxes/:id` - Update box
- `GET/POST /api/admin/collection-series` - Manage series
- `PUT /api/admin/collection-series/:id` - Update series
- `GET/POST /api/admin/prices` - Manage prices
- `PUT /api/admin/prices/:id` - Update price
- `GET/POST /api/admin/bundles` - Manage bundles
- `PUT /api/admin/bundles/:id` - Update bundle
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

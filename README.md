# AS WE ALL ARE - Monorepo

A therapeutic conversational card game with two separate applications:
- **UI App**: Consumer-facing mobile app (Framework7 + Vite)
- **Admin App**: Content management system (Next.js)

## Project Structure

```
/apps
  /ui        → Consumer app (Framework7, iOS style)
  /admin     → Admin app (Next.js)

/packages
  /shared    → Shared types, helpers (optional)

/database
  /migrations  → Database migration files

/public
  → Shared assets (cards, collections, sounds)

docker-compose.yml
```

## Running Locally

### Using Docker Compose (Recommended)

```bash
# Start all services
docker compose up

# Or start with database tools
docker compose --profile tools up
```

This will start:
- **UI App**: http://localhost:8080
- **Admin App**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **pgAdmin** (with tools profile): http://localhost:5050

### Manual Setup

#### UI App (Framework7)
```bash
cd apps/ui
yarn install
yarn dev
# Available at http://localhost:8080
```

#### Admin App (Next.js)
```bash
cd apps/admin
yarn install
yarn dev
# Available at http://localhost:3001
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe (for Admin App)
STRIPE_SECRET_KEY=your_stripe_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Architecture

### UI App
- Built with Framework7 + Vite
- iOS theme with native components
- 4 main screens: Home, Experience, Store, Profile
- Authentication: Google SSO + Magic Link
- Mobile-first, app-like behavior

### Admin App
- Built with Next.js + Tailwind CSS
- Content management for cards, boxes, prices
- Admin access is database-gated (via `admin_emails` in `app_config`)
- Protected routes with access logging

### Database
- PostgreSQL with Supabase (production)
- Local PostgreSQL for development
- Key tables: boxes, cards, piles, collection_series, prices, app_config

## Authentication

### UI App (Consumer)
- Google SSO (OAuth)
- Email Magic Link
- Any user can sign up

### Admin App
- Supabase Auth (Magic Link)
- Database-gated access:
  1. User authenticates
  2. App checks if email is in `app_config.admin_emails`
  3. If not allowed, logs attempt to `admin_access_attempts` and signs out
  4. Shows message: "Registration as an admin is not allowed."

## Play Experience

The game features:
- Two card piles (black and white)
- Tap to draw, tap to flip
- Timer system (countdown → sharing → finished)
- Landscape-only gameplay
- Shuffle/reshuffle functionality

## Tech Stack

- **UI**: Framework7 Core, Vite, JavaScript
- **Admin**: Next.js 14, React 18, Tailwind CSS
- **Database**: PostgreSQL, Supabase
- **Auth**: Supabase Auth (Google OAuth, Magic Link)
- **Payments**: Stripe

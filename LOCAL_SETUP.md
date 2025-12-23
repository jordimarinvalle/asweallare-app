# AS WE ALL ARE - Local Development Setup

Complete guide to run the application locally with Docker Compose.

---

## Prerequisites

- **Docker Desktop** installed and running
- **Git** (to clone the repo)
- A terminal (Terminal, iTerm, PowerShell, etc.)

---

## Quick Start (5 minutes)

### Step 1: Clone and Navigate

```bash
git clone <your-repo-url>
cd asweallare
```

### Step 2: Create Environment File

Create a file called `.env.local` in the project root:

```bash
# Copy this entire block into .env.local

# App URL (don't change for local)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Supabase (get from https://supabase.com/dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### Step 3: Start the Application

**Option A: With Local PostgreSQL (Recommended for development)**
```bash
docker-compose --profile local up
```

**Option B: With Supabase (Production-like setup)**
```bash
docker-compose --profile prod up
```

> ⚠️ **Important**: Always use `--profile` flag. Don't run `docker-compose up` without a profile.

### Step 4: Open the App

- **App**: http://localhost:3000
- **pgAdmin** (if using local profile): http://localhost:5050
  - Email: `admin@admin.com`
  - Password: `admin`

---

## Database Setup

### If Using Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project (or use existing)
3. Go to **SQL Editor**
4. Run these files in order:

**Step 1: Create Schema**
```sql
-- Copy contents of database/schema.sql and run
```

**Step 2: Load Fixtures**
```sql
-- Copy contents of database/fixtures.sql and run
```

### If Using Local PostgreSQL

The database is automatically initialized when you run:
```bash
docker-compose --profile local up
```

Files are auto-loaded:
- `database/schema.sql` - Creates tables
- `database/fixtures.sql` - Loads initial data

---

## Accessing pgAdmin (Local PostgreSQL Only)

1. Open http://localhost:5050
2. Login:
   - Email: `admin@admin.com`
   - Password: `admin`
3. Add a new server:
   - **Name**: `asweallare` (anything you want)
   - **Host**: `postgres` (the docker service name)
   - **Port**: `5432`
   - **Username**: `postgres`
   - **Password**: `postgres`
   - **Database**: `asweallare`

---

## Admin Panel Access

The admin panel is restricted to a specific email address.

### Current Admin Email
```
mocasin@gmail.com
```

### To Access Admin:

1. Sign up/Login with the admin email
2. Navigate to http://localhost:3000
3. Click your profile icon (top right)
4. You'll see the **Admin** option in the menu

### To Change Admin Email:

Edit `/app/app/page.js` and find:
```javascript
const ADMIN_EMAIL = 'mocasin@gmail.com'
```

Change it to your email.

---

## What's in the Fixtures?

### Collection Series
| ID | Name |
|----|------|
| `unscripted_conversations` | Unscripted Conversations |

### Prices
| ID | Label | Amount | Promo | Days |
|----|-------|--------|-------|------|
| `price_free` | Free | $0 | - | - |
| `price_box_standard` | Standard Box | $29 | $19 | - |
| `price_box_xl` | XL Box | $49 | $39 | - |
| `price_membership_30` | 30-Day Access | $9.99 | - | 30 |
| `price_membership_90` | 90-Day Access | $24.99 | - | 90 |
| `price_membership_365` | Annual Access | $79.99 | - | 365 |

### Boxes
| ID | Name | Price | Demo? |
|----|------|-------|-------|
| `box_demo` | Demo Box | Free | Yes |
| `box_placeholder` | Your First Box | Standard | No |

### Piles (Card Backs)
| ID | Slug | Name |
|----|------|------|
| `pile_black` | black | Black Pile |
| `pile_white` | white | White Pile |

---

## Common Commands

```bash
# Start with Supabase
docker-compose up app

# Start with local PostgreSQL
docker-compose --profile local up

# Start in background
docker-compose --profile local up -d

# Stop everything
docker-compose down

# Stop and remove volumes (reset database)
docker-compose --profile local down -v

# View logs
docker-compose logs -f app-local

# Rebuild after code changes
docker-compose --profile local up --build

# Access PostgreSQL directly
docker exec -it asweallare-postgres-1 psql -U postgres -d asweallare
```

---

## Resetting the Database

To completely reset and start fresh:

```bash
# Stop everything and remove volumes
docker-compose --profile local down -v

# Start fresh
docker-compose --profile local up
```

---

## Troubleshooting

### "Port 3000 already in use"
```bash
# Find what's using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>
```

### "Cannot connect to database"
```bash
# Check if postgres is running
docker-compose --profile local ps

# Check postgres logs
docker-compose --profile local logs postgres
```

### "Fixtures not loading"
Make sure the files exist:
```bash
ls -la database/
# Should show: schema.sql, fixtures.sql
```

### Reset everything and start over
```bash
docker-compose --profile local down -v
docker system prune -f
docker-compose --profile local up --build
```

---

## File Structure

```
/app
├── .env.local              # Your environment variables (create this)
├── docker-compose.yml      # Docker configuration
├── database/
│   ├── schema.sql         # Database structure
│   └── fixtures.sql       # Initial data
├── app/
│   ├── page.js            # Main app + Admin panel
│   └── api/               # Backend API routes
└── public/
    └── collections/       # Card images
```

---

## Need Help?

1. Check the logs: `docker-compose logs -f`
2. Reset the database: `docker-compose down -v && docker-compose up`
3. Rebuild: `docker-compose up --build`

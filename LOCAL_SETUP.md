# AS WE ALL ARE - Local Development Setup

Complete guide to run the application **100% locally** - no external services needed.

---

## Prerequisites

- **Docker Desktop** installed and running
- A terminal (Terminal, iTerm, PowerShell, etc.)

---

## Quick Start (2 minutes)

### Step 1: Clean Up Any Previous Runs

```bash
# Stop everything and remove old data
docker-compose down -v
docker volume prune -f
```

### Step 2: Start Everything

```bash
docker-compose up
```

That's it! Wait for the logs to show:
```
app-1  |  ✓ Ready in Xms
```

### Step 3: Open the App

| Service | URL | Login |
|---------|-----|-------|
| **App** | http://localhost:3000 | Auto-logged in as admin |
| **pgAdmin** | http://localhost:5050 | admin@admin.com / admin |

---

## What's Running?

| Container | Port | Purpose |
|-----------|------|---------|
| `app` | 3000 | Next.js application |
| `postgres` | 5432 | PostgreSQL database |
| `pgadmin` | 5050 | Database management UI |

---

## Local Mode Features

When running locally:
- **No Supabase needed** - Uses local PostgreSQL
- **No authentication required** - Auto-logged in as admin
- **Full admin access** - All features unlocked
- **No Stripe needed** - Payment features disabled

---

## Connecting pgAdmin to PostgreSQL

1. Open http://localhost:5050
2. Login: `admin@admin.com` / `admin`
3. Right-click "Servers" → "Register" → "Server"
4. Fill in:
   - **Name**: `local` (any name)
   - **Connection tab**:
     - Host: `postgres`
     - Port: `5432`
     - Username: `postgres`
     - Password: `postgres`
     - Database: `asweallare`

---

## Initial Data (Fixtures)

The database comes pre-loaded with:

### Collection Series
| ID | Name |
|----|------|
| `unscripted_conversations` | Unscripted Conversations |

### Prices
| ID | Label | Amount | Promo |
|----|-------|--------|-------|
| `price_free` | Free | $0 | - |
| `price_box_standard` | Standard Box | $29 | $19 |
| `price_box_xl` | XL Box | $49 | $39 |
| `price_membership_30` | 30-Day Access | $9.99 | - |
| `price_membership_90` | 90-Day Access | $24.99 | - |
| `price_membership_365` | Annual Access | $79.99 | - |

### Piles (Card Backs)
| ID | Slug | Name |
|----|------|------|
| `pile_black` | black | Black Pile |
| `pile_white` | white | White Pile |

### Boxes
| ID | Name | Demo? |
|----|------|-------|
| `box_demo` | Demo Box | Yes |
| `box_placeholder` | Your First Box | No |

---

## Common Commands

```bash
# Start everything
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# View only app logs
docker-compose logs -f app

# Stop everything
docker-compose down

# RESET DATABASE (start fresh)
docker-compose down -v

# Rebuild after code changes
docker-compose up --build

# Access PostgreSQL directly
docker exec -it asweallare-postgres-1 psql -U postgres -d asweallare
```

---

## Run SQL Manually

```bash
# Connect to database
docker exec -it asweallare-postgres-1 psql -U postgres -d asweallare

# Then run SQL commands:
SELECT * FROM boxes;
SELECT * FROM prices;
\dt   -- list tables
\q    -- quit
```

---

## Troubleshooting

### "Port 3000 already in use"
```bash
# Find and kill what's using port 3000
lsof -i :3000
kill -9 <PID>

# Or change the port in docker-compose.yml
ports:
  - "3001:3000"  # Use port 3001 instead
```

### "Database initialization failed"
```bash
# Complete reset
docker-compose down -v
docker volume prune -f
docker-compose up
```

### "Cannot connect to database"
Wait for PostgreSQL to be healthy. You should see:
```
postgres-1  | database system is ready to accept connections
```

### Changes not showing?
```bash
# Rebuild everything
docker-compose down
docker-compose up --build
```

---

## File Structure

```
/app
├── docker-compose.yml         # Docker configuration
├── database/
│   ├── schema-local.sql      # Local database structure
│   └── fixtures.sql          # Initial data
├── lib/
│   ├── db-local.js           # Local PostgreSQL client
│   └── supabase-server.js    # Auto-switches between local/Supabase
├── app/
│   ├── page.js               # Main app + Admin panel
│   └── api/                  # Backend API routes
└── public/
    └── collections/          # Card images
```

---

## Switching to Production (Supabase)

To deploy to production with Supabase:

1. Create `.env.local` with Supabase credentials
2. Remove `LOCAL_MODE=true` from environment
3. Run schema on Supabase SQL Editor
4. Deploy!

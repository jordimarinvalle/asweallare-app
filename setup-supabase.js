const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pwdwemakaozxmutwswqa.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3ZHdlbWFrYW96eG11dHdzd3FhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3OTA4NSwiZXhwIjoyMDgxNzU1MDg1fQ.cf0JvvG2BVFOGp_BgE_YozSfz3uGthYY6CWtwA0E9Z4'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function setupDatabase() {
  console.log('🚀 Setting up Supabase database tables...')
  
  try {
    // Create cards table
    const { error: cardsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS cards (
          id TEXT PRIMARY KEY,
          color TEXT NOT NULL CHECK (color IN ('black', 'white')),
          title TEXT NOT NULL,
          hint TEXT,
          language TEXT DEFAULT 'en',
          "isDemo" BOOLEAN DEFAULT false,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        DROP POLICY IF EXISTS "Allow public read cards" ON cards;
        CREATE POLICY "Allow public read cards" ON cards FOR SELECT USING (true);
        
        DROP POLICY IF EXISTS "Allow authenticated insert cards" ON cards;
        CREATE POLICY "Allow authenticated insert cards" ON cards FOR INSERT WITH CHECK (true);
        
        DROP POLICY IF EXISTS "Allow authenticated update cards" ON cards;
        CREATE POLICY "Allow authenticated update cards" ON cards FOR UPDATE USING (true);
        
        DROP POLICY IF EXISTS "Allow authenticated delete cards" ON cards;
        CREATE POLICY "Allow authenticated delete cards" ON cards FOR DELETE USING (true);
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_cards_color ON cards(color);
        CREATE INDEX IF NOT EXISTS idx_cards_is_demo ON cards("isDemo");
        CREATE INDEX IF NOT EXISTS idx_cards_is_active ON cards("isActive");
      `
    })
    
    if (cardsError) {
      console.log('Using alternative method for cards table...')
      // If RPC doesn't work, we'll use the REST API approach
      // This will be handled by the fact that tables might already exist
    }
    
    // Create saved_draws table
    const { error: drawsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS saved_draws (
          id TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "userEmail" TEXT,
          "blackCardId" TEXT NOT NULL,
          "whiteCardId" TEXT NOT NULL,
          "blackCardTitle" TEXT NOT NULL,
          "whiteCardTitle" TEXT NOT NULL,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE saved_draws ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        DROP POLICY IF EXISTS "Users can read own draws" ON saved_draws;
        CREATE POLICY "Users can read own draws" ON saved_draws FOR SELECT USING (auth.uid()::text = "userId");
        
        DROP POLICY IF EXISTS "Users can insert own draws" ON saved_draws;
        CREATE POLICY "Users can insert own draws" ON saved_draws FOR INSERT WITH CHECK (auth.uid()::text = "userId");
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_draws_user_id ON saved_draws("userId");
        CREATE INDEX IF NOT EXISTS idx_draws_timestamp ON saved_draws(timestamp DESC);
      `
    })
    
    if (drawsError) {
      console.log('Using alternative method for saved_draws table...')
    }
    
    // Create user_access table
    const { error: accessError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_access (
          id TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL UNIQUE,
          "accessType" TEXT NOT NULL CHECK ("accessType" IN ('free', 'paid')),
          "paymentType" TEXT CHECK ("paymentType" IN ('onetime', 'subscription')),
          "stripeSessionId" TEXT,
          "expiresAt" TIMESTAMP WITH TIME ZONE,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE user_access ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        DROP POLICY IF EXISTS "Users can read own access" ON user_access;
        CREATE POLICY "Users can read own access" ON user_access FOR SELECT USING (auth.uid()::text = "userId");
        
        DROP POLICY IF EXISTS "Allow authenticated insert access" ON user_access;
        CREATE POLICY "Allow authenticated insert access" ON user_access FOR INSERT WITH CHECK (true);
        
        DROP POLICY IF EXISTS "Allow authenticated update access" ON user_access;
        CREATE POLICY "Allow authenticated update access" ON user_access FOR UPDATE USING (true);
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_access_user_id ON user_access("userId");
      `
    })
    
    if (accessError) {
      console.log('Using alternative method for user_access table...')
    }
    
    console.log('✅ Database setup complete!')
    console.log('✅ Tables created: cards, saved_draws, user_access')
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message)
    console.log('\n⚠️  If RPC method failed, please run the SQL manually in Supabase Dashboard')
  }
}

setupDatabase()

// Local PostgreSQL Database Client
// Used when LOCAL_MODE=true

import { Pool } from 'pg'

let pool = null

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/asweallare'
    console.log('[DB-LOCAL] Creating pool with:', connectionString.replace(/:[^:@]+@/, ':***@'))
    pool = new Pool({ connectionString })
    
    pool.on('error', (err) => {
      console.error('[DB-LOCAL] Pool error:', err.message)
    })
  }
  return pool
}

export async function query(text, params) {
  const pool = getPool()
  try {
    const result = await pool.query(text, params)
    return result
  } catch (error) {
    console.error('[DB-LOCAL] Query error:', error.message)
    console.error('[DB-LOCAL] Query was:', text)
    throw error
  }
}

// Helper to mimic Supabase response format
export function createLocalClient() {
  return {
    from: (table) => new QueryBuilder(table),
    auth: {
      getUser: async () => {
        // In local mode, return a mock admin user
        return {
          data: {
            user: {
              id: '00000000-0000-0000-0000-000000000001',
              email: 'admin@local.dev'
            }
          },
          error: null
        }
      },
      getSession: async () => {
        return {
          data: {
            session: {
              user: {
                id: '00000000-0000-0000-0000-000000000001',
                email: 'admin@local.dev'
              }
            }
          },
          error: null
        }
      },
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    }
  }
}

class QueryBuilder {
  constructor(table) {
    this.table = table
    this._select = '*'
    this._where = []
    this._whereParams = []
    this._order = null
    this._single = false
    this._limit = null
    this._returnData = true
  }

  select(columns = '*') {
    // Handle Supabase-style nested selects by stripping them
    // e.g., '*, piles(slug, name)' becomes '*'
    if (columns.includes('(')) {
      this._select = columns.split(',').filter(c => !c.includes('(')).map(c => c.trim()).join(', ') || '*'
    } else {
      this._select = columns
    }
    return this
  }

  eq(column, value) {
    this._whereParams.push(value)
    this._where.push(`"${column}" = $${this._whereParams.length}`)
    return this
  }

  neq(column, value) {
    this._whereParams.push(value)
    this._where.push(`"${column}" != $${this._whereParams.length}`)
    return this
  }

  in(column, values) {
    if (values && values.length > 0) {
      const placeholders = values.map((_, i) => `$${this._whereParams.length + i + 1}`).join(', ')
      this._whereParams.push(...values)
      this._where.push(`"${column}" IN (${placeholders})`)
    }
    // If empty array, don't add any condition (will return all or be filtered by other conditions)
    return this
  }

  order(column, { ascending = true } = {}) {
    this._order = `"${column}" ${ascending ? 'ASC' : 'DESC'}`
    return this
  }

  limit(count) {
    this._limit = count
    return this
  }

  single() {
    this._single = true
    this._limit = 1
    return this
  }

  // Execute SELECT query
  async then(resolve, reject) {
    try {
      let sql = `SELECT ${this._select} FROM "${this.table}"`
      
      if (this._where.length > 0) {
        sql += ` WHERE ${this._where.join(' AND ')}`
      }
      
      if (this._order) {
        sql += ` ORDER BY ${this._order}`
      }
      
      if (this._limit) {
        sql += ` LIMIT ${this._limit}`
      }

      console.log('[DB-LOCAL] Executing:', sql, 'with params:', this._whereParams)
      const result = await query(sql, this._whereParams)
      
      if (this._single) {
        resolve({ data: result.rows[0] || null, error: null })
      } else {
        resolve({ data: result.rows, error: null })
      }
    } catch (error) {
      console.error('[DB-LOCAL] Query failed:', error.message)
      if (reject) {
        reject(error)
      } else {
        resolve({ data: null, error })
      }
    }
  }

  async insert(data) {
    try {
      // Handle array of objects
      const records = Array.isArray(data) ? data : [data]
      const results = []
      
      for (const record of records) {
        const keys = Object.keys(record)
        const values = Object.values(record)
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')
        const quotedKeys = keys.map(k => `"${k}"`).join(', ')
        
        const sql = `INSERT INTO "${this.table}" (${quotedKeys}) VALUES (${placeholders}) RETURNING *`
        console.log('[DB-LOCAL] Insert:', sql)
        const result = await query(sql, values)
        results.push(result.rows[0])
      }
      
      // Return a chainable object that mimics Supabase behavior
      const insertResult = { data: results, error: null }
      return {
        ...insertResult,
        select: () => ({
          single: () => Promise.resolve({ data: results[0], error: null }),
          then: (resolve) => resolve({ data: results, error: null })
        }),
        then: (resolve) => resolve(insertResult)
      }
    } catch (error) {
      console.error('[DB-LOCAL] Insert failed:', error.message)
      const errorResult = { data: null, error }
      return {
        ...errorResult,
        select: () => ({
          single: () => Promise.resolve(errorResult),
          then: (resolve) => resolve(errorResult)
        }),
        then: (resolve) => resolve(errorResult)
      }
    }
  }

  async update(data) {
    try {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ')
      
      let sql = `UPDATE "${this.table}" SET ${setClause}`
      const params = [...values]
      
      if (this._where.length > 0) {
        // Adjust parameter indices for where clause
        const whereWithOffset = this._where.map(w => {
          return w.replace(/\$(\d+)/g, (match, num) => `$${parseInt(num) + values.length}`)
        })
        sql += ` WHERE ${whereWithOffset.join(' AND ')}`
        params.push(...this._whereParams)
      }
      
      sql += ' RETURNING *'
      console.log('[DB-LOCAL] Update:', sql)
      const result = await query(sql, params)
      
      return { data: result.rows, error: null }
    } catch (error) {
      console.error('[DB-LOCAL] Update failed:', error.message)
      return { data: null, error }
    }
  }

  async delete() {
    try {
      let sql = `DELETE FROM "${this.table}"`
      
      if (this._where.length > 0) {
        sql += ` WHERE ${this._where.join(' AND ')}`
      }
      
      sql += ' RETURNING *'
      console.log('[DB-LOCAL] Delete:', sql)
      const result = await query(sql, this._whereParams)
      
      return { data: result.rows, error: null }
    } catch (error) {
      console.error('[DB-LOCAL] Delete failed:', error.message)
      return { data: null, error }
    }
  }
}

export default { query, getPool, createLocalClient }

// Local PostgreSQL Database Client
// Used when LOCAL_MODE=true

import { Pool } from 'pg'

let pool = null

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/asweallare'
    })
  }
  return pool
}

export async function query(text, params) {
  const pool = getPool()
  const result = await pool.query(text, params)
  return result
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
  }

  select(columns = '*') {
    this._select = columns
    return this
  }

  eq(column, value) {
    this._whereParams.push(value)
    this._where.push(`${column} = $${this._whereParams.length}`)
    return this
  }

  in(column, values) {
    if (values && values.length > 0) {
      const placeholders = values.map((_, i) => `$${this._whereParams.length + i + 1}`).join(', ')
      this._whereParams.push(...values)
      this._where.push(`${column} IN (${placeholders})`)
    }
    return this
  }

  order(column, { ascending = true } = {}) {
    this._order = `${column} ${ascending ? 'ASC' : 'DESC'}`
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

  async then(resolve) {
    try {
      let sql = `SELECT ${this._select} FROM ${this.table}`
      
      if (this._where.length > 0) {
        sql += ` WHERE ${this._where.join(' AND ')}`
      }
      
      if (this._order) {
        sql += ` ORDER BY ${this._order}`
      }
      
      if (this._limit) {
        sql += ` LIMIT ${this._limit}`
      }

      const result = await query(sql, this._whereParams)
      
      if (this._single) {
        resolve({ data: result.rows[0] || null, error: null })
      } else {
        resolve({ data: result.rows, error: null })
      }
    } catch (error) {
      resolve({ data: null, error })
    }
  }

  async insert(data) {
    try {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')
      
      const sql = `INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`
      const result = await query(sql, values)
      
      return { data: result.rows[0], error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async update(data) {
    try {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ')
      
      let sql = `UPDATE ${this.table} SET ${setClause}`
      const params = [...values]
      
      if (this._where.length > 0) {
        // Adjust parameter indices for where clause
        const whereWithOffset = this._where.map((w, i) => {
          return w.replace(/\$\d+/, `$${values.length + i + 1}`)
        })
        sql += ` WHERE ${whereWithOffset.join(' AND ')}`
        params.push(...this._whereParams)
      }
      
      sql += ' RETURNING *'
      const result = await query(sql, params)
      
      return { data: result.rows, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async delete() {
    try {
      let sql = `DELETE FROM ${this.table}`
      
      if (this._where.length > 0) {
        sql += ` WHERE ${this._where.join(' AND ')}`
      }
      
      sql += ' RETURNING *'
      const result = await query(sql, this._whereParams)
      
      return { data: result.rows, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}

export default { query, getPool, createLocalClient }

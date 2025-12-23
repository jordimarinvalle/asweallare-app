// Local Authentication System
// Used when LOCAL_MODE=true - no Supabase needed

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from './db-local'

const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-secret-change-in-production'
const TOKEN_EXPIRY = '7d'

export async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, is_admin: user.is_admin },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  )
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export async function createUser(email, password) {
  const passwordHash = await hashPassword(password)
  const id = crypto.randomUUID()
  
  try {
    const result = await query(
      `INSERT INTO local_users (id, email, password_hash, is_admin) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, is_admin, created_at`,
      [id, email.toLowerCase(), passwordHash, false]
    )
    return { user: result.rows[0], error: null }
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return { user: null, error: 'User already exists' }
    }
    return { user: null, error: error.message }
  }
}

export async function signIn(email, password) {
  try {
    const result = await query(
      'SELECT * FROM local_users WHERE email = $1',
      [email.toLowerCase()]
    )
    
    if (result.rows.length === 0) {
      return { user: null, token: null, error: 'Invalid email or password' }
    }
    
    const user = result.rows[0]
    const validPassword = await verifyPassword(password, user.password_hash)
    
    if (!validPassword) {
      return { user: null, token: null, error: 'Invalid email or password' }
    }
    
    const token = generateToken(user)
    return {
      user: { id: user.id, email: user.email, is_admin: user.is_admin },
      token,
      error: null
    }
  } catch (error) {
    return { user: null, token: null, error: error.message }
  }
}

export async function getUserFromToken(token) {
  const decoded = verifyToken(token)
  if (!decoded) return null
  
  try {
    const result = await query(
      'SELECT id, email, is_admin, created_at FROM local_users WHERE id = $1',
      [decoded.id]
    )
    return result.rows[0] || null
  } catch (error) {
    return null
  }
}

export async function getUserById(id) {
  try {
    const result = await query(
      'SELECT id, email, is_admin, created_at FROM local_users WHERE id = $1',
      [id]
    )
    return result.rows[0] || null
  } catch (error) {
    return null
  }
}

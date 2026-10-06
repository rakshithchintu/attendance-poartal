import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin, memoryStore, Profile } from '../lib/supabaseAdmin.js';

export interface AuthenticatedRequest extends Request {
  user?: Profile;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const customUserId = req.headers['x-user-id'] as string;

  // 1. If Supabase is connected and token is provided
  const supabase = getSupabaseAdmin();
  if (supabase && authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid Supabase token' });
      }
      
      // Look up profile
      const profile = memoryStore.profiles.find(p => p.id === user.id) || {
        id: user.id,
        email: user.email || 'user@school.edu',
        full_name: user.user_metadata?.full_name || 'Faculty Member',
        role: (user.user_metadata?.role as 'TEACHER' | 'ADMIN') || 'TEACHER',
      };

      req.user = profile;
      return next();
    } catch (err) {
      console.error('Supabase auth verification error:', err);
    }
  }

  // 2. Demo mode / local development fallback
  if (customUserId) {
    const found = memoryStore.profiles.find(p => p.id === customUserId);
    if (found) {
      req.user = found;
      return next();
    }
  }

  // Default to Dr. Eleanor Vance (Teacher)
  const defaultUser = memoryStore.profiles[0]; // Dr. Eleanor Vance
  req.user = defaultUser;
  return next();
}

export function requireRole(role: 'TEACHER' | 'ADMIN') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role !== role && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: `Forbidden: Requires ${role} role` });
    }
    next();
  };
}

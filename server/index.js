import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase client with service role (for admin operations)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT middleware
function verifyToken(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Auth API is running' });
});

// Sign up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Create auth user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm for development
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: data.user.id,
        email: data.user.email,
        full_name: null,
        avatar_url: null
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't fail signup if profile creation fails
    }

    const token = generateToken(data.user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sign in
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // Safety check: ensure profile exists
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      // Profile missing, create it
      await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name: null,
          avatar_url: null
        });
    }

    const token = generateToken(data.user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sign out
app.post('/api/auth/signout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Signed out successfully' });
});

// Get current user with their drawings (protected route)
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // LEFT JOIN - returns user even with 0 drawings
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        drawings:tldraw_drawings(*)
      `)
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        created_at: data.created_at,
        updated_at: data.updated_at
      },
      drawings: data.drawings || []
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint
app.get('/api/auth/verify', verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Protected route example
app.get('/api/protected', verifyToken, (req, res) => {
  res.json({
    message: 'This is protected data',
    user: req.user
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
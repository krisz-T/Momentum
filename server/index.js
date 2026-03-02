require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const cors = require('cors');

const app = express();
// Render provides a PORT environment variable. Use it, or default to 3001 for local dev.
const port = process.env.PORT || 3001;

// Middleware to parse JSON bodies. This is crucial for POST/PUT requests.
app.use(express.json());

// Enable CORS for all routes, allowing the React frontend to communicate with this server.
app.use(cors());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use the service role key for backend operations
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to get the user from the Supabase-provided JWT
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.user = user;
  next();
};

// Middleware to check if the authenticated user is an admin
const isAdmin = async (req, res, next) => {
  const { data, error } = await supabase.from('users').select('role').eq('id', req.user.id).single();

  if (error || !data) {
    return res.status(500).json({ error: 'Could not verify user role' });
  }

  if (data.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  next();
};

// A protected route to get the current user's profile from our public.users table
app.get('/api/profile', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', req.user.id).single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching profile:', error.message);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, total_xp')
      .eq('is_banned', false) // Banned users should not appear on the leaderboard
      .order('total_xp', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching leaderboard:', error.message);
    res.status(500).json({ error: 'Failed to fetch leaderboard data' });
  }
});

// This should be a protected admin route
app.get('/api/users', authenticate, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, is_banned'); // Add is_banned to the selection

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/workouts', authenticate, async (req, res) => {
  try {
    const { type, duration } = req.body;
    const userId = req.user.id;

    // 1. Input validation
    if (!type || !duration) {
      return res.status(400).json({ error: 'Missing required fields: type, duration' });
    }

    // Server-side check to see if the user is banned
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('is_banned')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) return res.status(404).json({ error: 'User profile not found.' });

    if (userProfile.is_banned) return res.status(403).json({ error: 'This account is suspended and cannot log workouts.' });

    // 2. Gamification Logic: Calculate XP. Let's say 15 XP per minute.
    const xpGained = duration * 15;

    // 3. Insert the new workout into the 'workouts' table
    const { data: workoutData, error: workoutError } = await supabase
      .from('workouts')
      .insert([
        { user_id: userId, type, duration },
      ])
      .select()
      .single(); // .single() returns the created object directly

    if (workoutError) {
      // This could fail if the userId does not exist, due to the foreign key constraint.
      throw workoutError;
    }

    // 4. Atomically update the user's total_xp using our database function
    const { error: rpcError } = await supabase.rpc('increment_user_xp', {
      user_uuid: userId,
      xp_to_add: xpGained,
    });

    if (rpcError) {
      throw rpcError;
    }

    // 5. Return the newly created workout data with a 201 Created status
    res.status(201).json(workoutData);

  } catch (error) {
    console.error('Error logging workout:', error.message);
    res.status(500).json({ error: 'Failed to log workout' });
  }
});

// Admin-only route to ban a user
app.patch('/api/users/:id/ban', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('users').update({ is_banned: true }).eq('id', id).select();

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error('Error banning user:', error.message);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// Admin-only route to unban a user
app.patch('/api/users/:id/unban', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('users').update({ is_banned: false }).eq('id', id).select();

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error('Error unbanning user:', error.message);
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
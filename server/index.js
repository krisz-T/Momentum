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

app.get('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name');

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/workouts', async (req, res) => {
  try {
    const { userId, type, duration } = req.body;

    // 1. Input validation
    if (!userId || !type || !duration) {
      return res.status(400).json({ error: 'Missing required fields: userId, type, duration' });
    }

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

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
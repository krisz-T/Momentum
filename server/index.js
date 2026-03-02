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

// A protected route to get the user's current plan enrollments
app.get('/api/profile/enrollments', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_plan_enrollments')
      .select('plan_id')
      .eq('user_id', req.user.id)
      .eq('status', 'active');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// A protected route to get the current user's earned badges
app.get('/api/profile/badges', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('badges')
      .select('badge_name, earned_at')
      .eq('user_id', req.user.id)
      .order('earned_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching user badges:', error.message);
    res.status(500).json({ error: 'Failed to fetch user badges' });
  }
});

// Public route to get all available training plans
app.get('/api/plans', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('training_plans')
      .select('id, title, description, duration_weeks');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching training plans:', error.message);
    res.status(500).json({ error: 'Failed to fetch training plans' });
  }
});

// Public route to get a single training plan by ID, including its scheduled workouts
app.get('/api/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('training_plans')
      .select('*, plan_workouts(*, workout_exercises(*, exercises(name, description, video_url)))') // Explicitly select exercise columns
      .eq('id', id)
      .single(); // We expect only one plan

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching single training plan:', error.message);
    res.status(500).json({ error: 'Failed to fetch training plan details' });
  }
});

// Protected route to enroll a user in a plan
app.post('/api/plans/:id/enroll', authenticate, async (req, res) => {
  try {
    const planId = req.params.id;
    const userId = req.user.id;

    // Check if user is already enrolled
    const { data: existing, error: existingError } = await supabase
      .from('user_plan_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('plan_id', planId)
      .eq('status', 'active')
      .single();

    if (existing) return res.status(409).json({ error: 'Already enrolled in this plan.' });

    const { data, error } = await supabase.from('user_plan_enrollments').insert({ user_id: userId, plan_id: planId }).select().single();
    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to enroll in plan.' });
  }
});

// Admin-only route to create a new exercise in the library
app.post('/api/exercises', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, description, video_url } = req.body;
    if (!name) return res.status(400).json({ error: 'Exercise name is required.' });

    const { data, error } = await supabase.from('exercises').insert({ name, description, video_url }).select().single();
    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create exercise.' });
  }
});

// Admin-only route to create a new training plan
app.post('/api/plans', authenticate, isAdmin, async (req, res) => {
  try {
    const { title, description, duration_weeks } = req.body;
    if (!title || !duration_weeks) return res.status(400).json({ error: 'Title and duration are required.' });

    const { data, error } = await supabase.from('training_plans').insert({ title, description, duration_weeks }).select().single();
    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create training plan.' });
  }
});

// Admin-only route to add a scheduled workout to a plan
app.post('/api/plans/:planId/workouts', authenticate, isAdmin, async (req, res) => {
  try {
    const { planId } = req.params;
    const { day_of_plan, workout_type, suggested_duration } = req.body;
    if (!day_of_plan || !workout_type) {
      return res.status(400).json({ error: 'Day and workout type are required.' });
    }

    const { data, error } = await supabase.from('plan_workouts').insert({
      plan_id: planId,
      day_of_plan: Number(day_of_plan),
      workout_type,
      suggested_duration: Number(suggested_duration)
    }).select().single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add workout to plan.' });
  }
});

// Admin-only route to get all exercises from the library
app.get('/api/exercises', authenticate, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('exercises').select('id, name');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exercises.' });
  }
});

// Admin-only route to get details for a single scheduled workout
app.get('/api/plan-workouts/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('plan_workouts')
      .select('*, workout_exercises(*, exercises(name))')
      .eq('id', id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workout details.' });
  }
});

// Admin-only route to add an exercise to a scheduled workout
app.post('/api/plan-workouts/:workoutId/exercises', authenticate, isAdmin, async (req, res) => {
  try {
    const { workoutId } = req.params;
    const { exercise_id, sets, reps } = req.body;
    if (!exercise_id || !sets || !reps) {
      return res.status(400).json({ error: 'Exercise, sets, and reps are required.' });
    }

    const { data, error } = await supabase.from('workout_exercises').insert({
      plan_workout_id: workoutId,
      exercise_id,
      sets: Number(sets),
      reps
    }).select().single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error adding exercise to workout:', error.message);
    res.status(500).json({ error: 'Failed to add exercise to workout.' });
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

    // 4.5. Check for and award the "First Workout" badge
    try {
      console.log(`Checking for badges for user ${userId}...`);
      const { count, error: countError } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) throw countError;

      console.log(`User ${userId} has ${count} total workouts.`);

      // If this is the user's first workout, award the badge
      if (count === 1) {
        console.log(`Attempting to award 'First Workout' badge...`);
        await supabase.from('badges').insert({
          user_id: userId,
          badge_name: 'First Workout',
        });
        console.log(`Successfully awarded 'First Workout' badge to user ${userId}`);
      }

      // If this is the user's fifth workout, award a new badge
      if (count === 5) {
        console.log(`Attempting to award '5-Workout Mark' badge...`);
        await supabase.from('badges').insert({
          user_id: userId,
          badge_name: '5-Workout Mark',
        });
        console.log(`Successfully awarded '5-Workout Mark' badge to user ${userId}`);
      }
    } catch (badgeError) {
      // Log the error but don't fail the whole request, as badge awarding is secondary.
      console.error('Could not award badge:', badgeError.message);
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
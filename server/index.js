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

// A protected route to UPDATE the current user's profile
app.patch('/api/profile', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required.' });

    const { data, error } = await supabase.from('users').update({ name }).eq('id', req.user.id).select().single();
    if (error) throw error;

    res.json(data);
  } catch (error) {
    if (error.code === '23505') { // Postgres code for unique violation
      return res.status(409).json({ error: 'This username is already taken. Please choose another.' });
    }
    console.error('Error updating profile:', error.message);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// A protected route to get the user's current plan enrollments
app.get('/api/profile/enrollments', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_plan_enrollments')
      .select('*, training_plans(title, description)') // Fetch plan details along with enrollment
      .eq('user_id', req.user.id)
      .eq('status', 'active');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// A protected route to get the current user's workout history
app.get('/api/profile/workouts', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('id, type, duration, date_logged')
      .eq('user_id', req.user.id)
      .order('date_logged', { ascending: false })
      .limit(20); // Limit to the last 20 workouts for performance

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workout history.' });
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
      .select('*, plan_workouts(*, workout_exercises(*, exercises(name, description, video_url)))')
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

    // Award "Plan Starter" badge
    try {
      const { count, error: countError } = await supabase
        .from('user_plan_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) throw countError;

      if (count === 1) {
        await supabase.from('badges').insert({
          user_id: userId,
          badge_name: 'Plan Starter',
        });
        console.log(`Awarded 'Plan Starter' badge to user ${userId}`);
      }
    } catch (badgeError) {
      console.error('Could not award enrollment badge:', badgeError.message);
    }

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

// Admin-only route to get details for a single exercise
app.get('/api/exercises/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exercise details.' });
  }
});

// Admin-only route to update an exercise
app.patch('/api/exercises/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, video_url } = req.body;
    if (!name) return res.status(400).json({ error: 'Exercise name is required.' });

    const { data, error } = await supabase.from('exercises').update({ name, description, video_url }).eq('id', id).select().single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update exercise.' });
  }
});

// Admin-only route to create a new training plan
app.post('/api/plans', authenticate, isAdmin, async (req, res) => {
  try {
    const { title, description, duration_weeks } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });

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
    const { exercise_id, sets, reps, duration_seconds } = req.body;
    if (!exercise_id || !sets || (!reps && !duration_seconds)) {
      return res.status(400).json({ error: 'Exercise, sets, and either reps or a duration are required.' });
    }

    const insertData = {
      plan_workout_id: workoutId,
      exercise_id,
      sets: Number(sets),
      reps: reps || null,
      duration_seconds: duration_seconds ? Number(duration_seconds) : null,
    };

    const { data, error } = await supabase.from('workout_exercises').insert(insertData).select().single();

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

    // 2. Gamification Logic: Calculate XP at 1 per 4 seconds. Duration is now expected in seconds.
    const xpGained = Math.floor(duration / 4);

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

      // Check for 10, 50, 100, etc.
      const milestoneBadges = {
        1: 'First Workout',
        5: '5-Workout Mark',
        10: '10 Workouts',
        50: '50 Workouts',
        100: '100 Workouts Club',
        500: '500 Workouts!',
        1000: '1000 Workout Legend'
      };

      if (milestoneBadges[count]) {
        const badgeName = milestoneBadges[count];
        // Check if user already has this badge to prevent duplicates if logic ever re-runs
        const { data: existingBadge, error: badgeCheckError } = await supabase
          .from('badges')
          .select('id')
          .eq('user_id', userId)
          .eq('badge_name', badgeName)
          .single();

        if (!existingBadge && !badgeCheckError) {
          console.log(`Attempting to award '${badgeName}' badge...`);
          await supabase.from('badges').insert({ user_id: userId, badge_name: badgeName });
          console.log(`Successfully awarded '${badgeName}' badge to user ${userId}`);
        }
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

// Admin-only route to DELETE a user
app.delete('/api/users/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // Step 1: Delete the user from the public profile table.
    // The ON DELETE CASCADE constraints will clean up workouts, badges, enrollments.
    const { error: profileError } = await supabase.from('users').delete().eq('id', id);
    if (profileError) throw profileError;

    // Step 2: Delete the user from the authentication system.
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError && authError.message !== 'User not found') {
      // This is a problem: the profile is gone but the login remains.
      // In a real production app, we'd need a more robust transaction or cleanup job.
      console.error(`CRITICAL: Profile for user ${id} was deleted, but auth entry could not be removed: ${authError.message}`);
    }

    res.status(204).send(); // 204 No Content is standard for successful DELETE
  } catch (error) {
    console.error('Error deleting user:', error.message);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// Admin-only route to DELETE a training plan
app.delete('/api/plans/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // ON DELETE CASCADE in the DB will handle associated plan_workouts
    const { error } = await supabase.from('training_plans').delete().eq('id', id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete training plan.' });
  }
});

// Admin-only route to DELETE a scheduled workout from a plan
app.delete('/api/plan-workouts/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // ON DELETE CASCADE will handle associated workout_exercises
    const { error } = await supabase.from('plan_workouts').delete().eq('id', id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete scheduled workout.' });
  }
});

// Admin-only route to DELETE an exercise from the library
app.delete('/api/exercises/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('exercises').delete().eq('id', id);
    if (error) {
      // This will fail if the exercise is in use due to foreign key constraints
      if (error.code === '23503') {
        return res.status(409).json({ error: 'Cannot delete: Exercise is currently used in a workout plan.' });
      }
      throw error;
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete exercise.' });
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
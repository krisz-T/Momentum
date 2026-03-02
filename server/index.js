require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

// --- USER PROFILE ROUTES ---
app.get('/api/profile', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', req.user.id).single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

app.patch('/api/profile', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required.' });
    const { data, error } = await supabase.from('users').update({ name }).eq('id', req.user.id).select().single();
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'This username is already taken. Please choose another.' });
      throw error;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

app.get('/api/profile/enrollments', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('user_plan_enrollments').select('*, training_plans(title, description)').eq('user_id', req.user.id).eq('status', 'active');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

app.get('/api/profile/badges', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('badges').select('badge_name, earned_at').eq('user_id', req.user.id).order('earned_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user badges' });
  }
});

app.get('/api/profile/workouts', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('workouts').select('id, type, duration, date_logged').eq('user_id', req.user.id).order('date_logged', { ascending: false }).limit(20);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workout history.' });
  }
});


// --- PUBLIC & USER ROUTES ---
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('id, name, total_xp').eq('is_banned', false).order('total_xp', { ascending: false }).limit(10);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard data' });
  }
});

app.get('/api/plans', async (req, res) => {
  try {
    const { data, error } = await supabase.from('training_plans').select('id, title, description, duration_weeks');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch training plans' });
  }
});

app.get('/api/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('training_plans').select('*, plan_workouts(*, workout_exercises(*, exercises(name, description, video_url)))').eq('id', id).single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch training plan details' });
  }
});

app.post('/api/plans/:id/enroll', authenticate, async (req, res) => {
  try {
    const planId = req.params.id;
    const userId = req.user.id;
    const { data: existing } = await supabase.from('user_plan_enrollments').select('id').eq('user_id', userId).eq('plan_id', planId).eq('status', 'active').single();
    if (existing) return res.status(409).json({ error: 'Already enrolled in this plan.' });
    const { data, error } = await supabase.from('user_plan_enrollments').insert({ user_id: userId, plan_id: planId }).select().single();
    if (error) throw error;
    try {
      const { count } = await supabase.from('user_plan_enrollments').select('id', { count: 'exact', head: true }).eq('user_id', userId);
      if (count === 1) {
        await supabase.from('badges').insert({ user_id: userId, badge_name: 'Plan Starter' });
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

app.post('/api/workouts', authenticate, async (req, res) => {
  try {
    const { type, duration } = req.body;
    const userId = req.user.id;
    if (!type || !duration) return res.status(400).json({ error: 'Missing required fields: type, duration' });
    const { data: userProfile } = await supabase.from('users').select('is_banned').eq('id', userId).single();
    if (!userProfile) return res.status(404).json({ error: 'User profile not found.' });
    if (userProfile.is_banned) return res.status(403).json({ error: 'This account is suspended and cannot log workouts.' });
    const xpGained = Math.floor(duration / 4);
    const { data: workoutData, error: workoutError } = await supabase.from('workouts').insert([{ user_id: userId, type, duration }]).select().single();
    if (workoutError) throw workoutError;
    const { error: rpcError } = await supabase.rpc('increment_user_xp', { user_uuid: userId, xp_to_add: xpGained });
    if (rpcError) throw rpcError;
    try {
      const { count } = await supabase.from('workouts').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      const milestoneBadges = { 1: 'First Workout', 5: '5-Workout Mark', 10: '10 Workouts', 50: '50 Workouts', 100: '100 Workouts Club' };
      if (milestoneBadges[count]) {
        const badgeName = milestoneBadges[count];
        const { data: existingBadge } = await supabase.from('badges').select('id').eq('user_id', userId).eq('badge_name', badgeName).single();
        if (!existingBadge) {
          await supabase.from('badges').insert({ user_id: userId, badge_name: badgeName });
          console.log(`Successfully awarded '${badgeName}' badge to user ${userId}`);
        }
      }
    } catch (badgeError) {
      console.error('Could not award badge:', badgeError.message);
    }
    res.status(201).json(workoutData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log workout' });
  }
});


// --- ADMIN-ONLY ROUTES ---
app.get('/api/users', authenticate, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('id, name, is_banned');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.patch('/api/users/:id/ban', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('users').update({ is_banned: true }).eq('id', id).select();
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

app.patch('/api/users/:id/unban', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('users').update({ is_banned: false }).eq('id', id).select();
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

app.delete('/api/users/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from('users').delete().eq('id', id);
    await supabase.auth.admin.deleteUser(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

app.get('/api/exercises', authenticate, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('exercises').select('id, name');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exercises.' });
  }
});

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

app.get('/api/exercises/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('exercises').select('*').eq('id', id).single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exercise details.' });
  }
});

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

app.delete('/api/exercises/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('exercises').delete().eq('id', id);
    if (error) {
      if (error.code === '23503') return res.status(409).json({ error: 'Cannot delete: Exercise is currently used in a workout plan.' });
      throw error;
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete exercise.' });
  }
});

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

app.delete('/api/plans/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('training_plans').delete().eq('id', id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete training plan.' });
  }
});

app.post('/api/plans/:planId/workouts', authenticate, isAdmin, async (req, res) => {
  try {
    const { planId } = req.params;
    const { day_of_plan, workout_type, suggested_duration } = req.body;
    if (!day_of_plan || !workout_type) return res.status(400).json({ error: 'Day and workout type are required.' });
    const { data, error } = await supabase.from('plan_workouts').insert({ plan_id: planId, day_of_plan: Number(day_of_plan), workout_type, suggested_duration: Number(suggested_duration) }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add workout to plan.' });
  }
});

app.get('/api/plan-workouts/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('plan_workouts').select('*, workout_exercises(*, exercises(name))').eq('id', id).single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workout details.' });
  }
});

app.delete('/api/plan-workouts/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('plan_workouts').delete().eq('id', id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete scheduled workout.' });
  }
});

app.post('/api/plan-workouts/:workoutId/exercises', authenticate, isAdmin, async (req, res) => {
  try {
    const { workoutId } = req.params;
    const { exercise_id, sets, reps, duration_seconds } = req.body;
    if (!exercise_id || !sets || (!reps && !duration_seconds)) return res.status(400).json({ error: 'Exercise, sets, and either reps or a duration are required.' });
    const insertData = { plan_workout_id: workoutId, exercise_id, sets: Number(sets), reps: reps || null, duration_seconds: duration_seconds ? Number(duration_seconds) : null };
    const { data, error } = await supabase.from('workout_exercises').insert(insertData).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add exercise to workout.' });
  }
});

app.delete('/api/workout-exercises/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('workout_exercises').delete().eq('id', id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove exercise from workout.' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});

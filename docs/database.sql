SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";



CREATE OR REPLACE FUNCTION "public"."create_user_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- The 'new' object refers to the new row in auth.users
  insert into public.users (id, name)
  values (new.id, new.email);
  return new;
end;
$$;



ALTER FUNCTION "public"."create_user_profile"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."increment_user_xp"("user_uuid" "uuid", "xp_to_add" integer) RETURNS "void"
    LANGUAGE "sql"
    AS $$
  UPDATE public.users
  SET total_xp = COALESCE(total_xp, 0) + xp_to_add
  WHERE id = user_uuid;
$$;

ALTER FUNCTION "public"."increment_user_xp"("user_uuid" "uuid", "xp_to_add" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "badge_name" "text" NOT NULL,
    "earned_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."badges" OWNER TO "postgres";

COMMENT ON TABLE "public"."badges" IS 'Stores badges earned by users for achievements.';

CREATE TABLE IF NOT EXISTS "public"."exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "video_url" "text"
);

ALTER TABLE "public"."exercises" OWNER TO "postgres";

COMMENT ON TABLE "public"."exercises" IS 'A library of all possible exercises.';

CREATE TABLE IF NOT EXISTS "public"."plan_workouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "day_of_plan" integer NOT NULL,
    "workout_type" "text" NOT NULL,
    "suggested_duration" integer
);

ALTER TABLE "public"."plan_workouts" OWNER TO "postgres";

COMMENT ON TABLE "public"."plan_workouts" IS 'Defines the schedule of workouts for each training plan.';

CREATE TABLE IF NOT EXISTS "public"."training_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "duration_weeks" integer
);

ALTER TABLE "public"."training_plans" OWNER TO "postgres";

COMMENT ON TABLE "public"."training_plans" IS 'Stores high-level information about available training plans.';

CREATE TABLE IF NOT EXISTS "public"."user_plan_enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "start_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    CONSTRAINT "user_plan_enrollments_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text"])))
);

ALTER TABLE "public"."user_plan_enrollments" OWNER TO "postgres";

COMMENT ON TABLE "public"."user_plan_enrollments" IS 'Tracks user enrollments in training plans.';

CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" DEFAULT 'Athlete'::"text" NOT NULL,
    "total_xp" integer DEFAULT 0 NOT NULL,
    "is_banned" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['Athlete'::"text", 'Admin'::"text"])))
);

ALTER TABLE "public"."users" OWNER TO "postgres";

COMMENT ON TABLE "public"."users" IS 'Stores user profiles and authentication info.';

CREATE TABLE IF NOT EXISTS "public"."workout_exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_workout_id" "uuid" NOT NULL,
    "exercise_id" "uuid" NOT NULL,
    "sets" integer,
    "reps" "text",
    "duration_seconds" integer,
    CONSTRAINT "reps_or_duration_check" CHECK (((("reps" IS NOT NULL) AND ("duration_seconds" IS NULL)) OR (("reps" IS NULL) AND ("duration_seconds" IS NOT NULL))))
);

ALTER TABLE "public"."workout_exercises" OWNER TO "postgres";

COMMENT ON TABLE "public"."workout_exercises" IS 'Defines the exercises, sets, and reps for a scheduled workout.';

CREATE TABLE IF NOT EXISTS "public"."workouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "duration" integer NOT NULL,
    "date_logged" timestamp with time zone DEFAULT "now"() NOT NULL
);



ALTER TABLE "public"."workouts" OWNER TO "postgres";

COMMENT ON TABLE "public"."workouts" IS 'Records individual workout sessions for each user.';



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "exercises_name_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "exercises_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."plan_workouts"
    ADD CONSTRAINT "plan_workouts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."training_plans"
    ADD CONSTRAINT "training_plans_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."user_plan_enrollments"
    ADD CONSTRAINT "user_plan_enrollments_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_name_unique" UNIQUE ("name");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."workout_exercises"
    ADD CONSTRAINT "workout_exercises_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."workouts"
    ADD CONSTRAINT "workouts_pkey" PRIMARY KEY ("id");

CREATE INDEX "idx_users_total_xp" ON "public"."users" USING "btree" ("total_xp" DESC);

COMMENT ON INDEX "public"."idx_users_total_xp" IS 'Optimizes fetching users sorted by experience points for leaderboards.';

ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."plan_workouts"
    ADD CONSTRAINT "plan_workouts_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."training_plans"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."user_plan_enrollments"
    ADD CONSTRAINT "user_plan_enrollments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."training_plans"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."user_plan_enrollments"
    ADD CONSTRAINT "user_plan_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."workout_exercises"
    ADD CONSTRAINT "workout_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."workout_exercises"
    ADD CONSTRAINT "workout_exercises_plan_workout_id_fkey" FOREIGN KEY ("plan_workout_id") REFERENCES "public"."plan_workouts"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."workouts"
    ADD CONSTRAINT "workouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_profile"() TO "service_role";

GRANT ALL ON FUNCTION "public"."increment_user_xp"("user_uuid" "uuid", "xp_to_add" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_user_xp"("user_uuid" "uuid", "xp_to_add" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_user_xp"("user_uuid" "uuid", "xp_to_add" integer) TO "service_role";



GRANT ALL ON TABLE "public"."badges" TO "anon";
GRANT ALL ON TABLE "public"."badges" TO "authenticated";
GRANT ALL ON TABLE "public"."badges" TO "service_role";

GRANT ALL ON TABLE "public"."exercises" TO "anon";
GRANT ALL ON TABLE "public"."exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."exercises" TO "service_role";

GRANT ALL ON TABLE "public"."plan_workouts" TO "anon";
GRANT ALL ON TABLE "public"."plan_workouts" TO "authenticated";
GRANT ALL ON TABLE "public"."plan_workouts" TO "service_role";

GRANT ALL ON TABLE "public"."training_plans" TO "anon";
GRANT ALL ON TABLE "public"."training_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."training_plans" TO "service_role";

GRANT ALL ON TABLE "public"."user_plan_enrollments" TO "anon";
GRANT ALL ON TABLE "public"."user_plan_enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."user_plan_enrollments" TO "service_role";

GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";

GRANT ALL ON TABLE "public"."workout_exercises" TO "anon";
GRANT ALL ON TABLE "public"."workout_exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_exercises" TO "service_role";

GRANT ALL ON TABLE "public"."workouts" TO "anon";
GRANT ALL ON TABLE "public"."workouts" TO "authenticated";
GRANT ALL ON TABLE "public"."workouts" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
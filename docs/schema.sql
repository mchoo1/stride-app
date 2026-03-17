-- ============================================================
--  Stride — PostgreSQL Database Schema
--  Version: 1.0  |  Phase 1 + Phase 2 tables
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
--  ENUM TYPES
-- ============================================================

CREATE TYPE goal_type         AS ENUM ('weight_loss', 'muscle_gain', 'maintenance');
CREATE TYPE activity_level    AS ENUM ('sedentary', 'light', 'moderate', 'active', 'very_active');
CREATE TYPE meal_type         AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
CREATE TYPE intensity_level   AS ENUM ('low', 'medium', 'high');
CREATE TYPE activity_source   AS ENUM ('manual', 'ai_estimate', 'apple_health', 'fitbit', 'garmin', 'google_fit');
CREATE TYPE post_type         AS ENUM ('meal', 'workout', 'restaurant', 'grocery');
CREATE TYPE provider_type     AS ENUM ('restaurant', 'gym', 'supermarket', 'delivery_app', 'nutritionist', 'pt');
CREATE TYPE booking_status    AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE dietary_flag      AS ENUM ('vegetarian', 'vegan', 'gluten_free', 'lactose_free', 'keto', 'halal', 'kosher');
CREATE TYPE wearable_type     AS ENUM ('apple_health', 'fitbit', 'garmin', 'google_fit', 'strava', 'wahoo');

-- ============================================================
--  USERS
-- ============================================================

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email               TEXT UNIQUE NOT NULL,
    name                TEXT,
    avatar_url          TEXT,
    goal_type           goal_type NOT NULL DEFAULT 'maintenance',
    current_weight_kg   NUMERIC(5,2),
    target_weight_kg    NUMERIC(5,2),
    height_cm           NUMERIC(5,1),
    age                 SMALLINT,
    activity_level      activity_level NOT NULL DEFAULT 'moderate',
    -- Calculated daily targets
    target_calories     INTEGER NOT NULL DEFAULT 2000,
    target_protein_g    INTEGER NOT NULL DEFAULT 150,
    target_carbs_g      INTEGER NOT NULL DEFAULT 200,
    target_fat_g        INTEGER NOT NULL DEFAULT 67,
    target_water_ml     INTEGER NOT NULL DEFAULT 2500,
    dietary_flags       dietary_flag[] DEFAULT '{}',
    -- Gamification
    streak_days         INTEGER NOT NULL DEFAULT 0,
    last_log_date       DATE,
    total_logs          INTEGER NOT NULL DEFAULT 0,
    -- Flags
    is_verified_pro     BOOLEAN NOT NULL DEFAULT false,  -- nutritionist / PT
    onboarding_done     BOOLEAN NOT NULL DEFAULT false,
    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================
--  WEARABLE CONNECTIONS
-- ============================================================

CREATE TABLE wearable_connections (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wearable_type   wearable_type NOT NULL,
    access_token    TEXT,           -- encrypted at application layer
    refresh_token   TEXT,           -- encrypted at application layer
    token_expires   TIMESTAMPTZ,
    last_synced_at  TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, wearable_type)
);

-- ============================================================
--  FOOD DATABASE
-- ============================================================

CREATE TABLE foods (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    brand           TEXT,
    emoji           TEXT DEFAULT '🍽️',
    -- Macros per 100g
    calories_per_100g   NUMERIC(7,2) NOT NULL,
    protein_g_per_100g  NUMERIC(6,2) NOT NULL DEFAULT 0,
    carbs_g_per_100g    NUMERIC(6,2) NOT NULL DEFAULT 0,
    fat_g_per_100g      NUMERIC(6,2) NOT NULL DEFAULT 0,
    fibre_g_per_100g    NUMERIC(6,2),
    sodium_mg_per_100g  NUMERIC(7,2),
    -- Source & verification
    source          TEXT NOT NULL DEFAULT 'community',  -- 'usda', 'open_food_facts', 'community', 'provider'
    fdc_id          TEXT,           -- USDA FoodData Central ID
    barcode         TEXT,           -- EAN/UPC
    confidence_score    NUMERIC(4,3) DEFAULT 0.5,  -- 0.000–1.000
    upvote_count        INTEGER NOT NULL DEFAULT 0,
    downvote_count      INTEGER NOT NULL DEFAULT 0,
    submitted_by        UUID REFERENCES users(id) ON DELETE SET NULL,
    -- Flags
    is_verified         BOOLEAN NOT NULL DEFAULT false,
    dietary_flags       dietary_flag[] DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_foods_name      ON foods USING GIN (to_tsvector('english', name));
CREATE INDEX idx_foods_barcode   ON foods(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_foods_fdc_id    ON foods(fdc_id)  WHERE fdc_id  IS NOT NULL;
CREATE INDEX idx_foods_source    ON foods(source);

-- ============================================================
--  FOOD LOG
-- ============================================================

CREATE TABLE food_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    food_id         UUID REFERENCES foods(id) ON DELETE SET NULL,
    -- Denormalised for historical accuracy
    food_name       TEXT NOT NULL,
    food_emoji      TEXT DEFAULT '🍽️',
    meal_type       meal_type NOT NULL DEFAULT 'snack',
    quantity_g      NUMERIC(7,2) NOT NULL DEFAULT 100,
    -- Calculated values (quantity-adjusted)
    calories        NUMERIC(7,2) NOT NULL,
    protein_g       NUMERIC(6,2) NOT NULL DEFAULT 0,
    carbs_g         NUMERIC(6,2) NOT NULL DEFAULT 0,
    fat_g           NUMERIC(6,2) NOT NULL DEFAULT 0,
    -- Scan data
    image_url       TEXT,
    scan_confidence NUMERIC(4,3),
    source          TEXT DEFAULT 'manual',  -- 'manual', 'scan', 'barcode', 'community'
    logged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, logged_at DESC);

-- ============================================================
--  ACTIVITY LOG
-- ============================================================

CREATE TABLE activity_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    emoji           TEXT DEFAULT '🏃',
    duration_mins   INTEGER NOT NULL,
    intensity       intensity_level NOT NULL DEFAULT 'medium',
    calories_burned INTEGER NOT NULL DEFAULT 0,
    met_value       NUMERIC(4,2),
    -- GPS / route data (optional)
    distance_km     NUMERIC(6,3),
    steps           INTEGER,
    heart_rate_avg  SMALLINT,
    heart_rate_max  SMALLINT,
    -- Source
    source          activity_source NOT NULL DEFAULT 'manual',
    wearable_id     UUID REFERENCES wearable_connections(id) ON DELETE SET NULL,
    notes           TEXT,
    logged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user_date ON activity_logs(user_id, logged_at DESC);

-- ============================================================
--  WATER LOG
-- ============================================================

CREATE TABLE water_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_ml   INTEGER NOT NULL,
    logged_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_water_logs_user_date ON water_logs(user_id, logged_at DESC);

-- ============================================================
--  MEAL RECOMMENDATIONS ENGINE DATA
-- ============================================================

CREATE TABLE restaurant_menu_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id         UUID NOT NULL,  -- references providers(id)
    name                TEXT NOT NULL,
    description         TEXT,
    image_url           TEXT,
    price               NUMERIC(8,2),
    currency            CHAR(3) DEFAULT 'SGD',
    -- Macros
    calories            NUMERIC(7,2),
    protein_g           NUMERIC(6,2),
    carbs_g             NUMERIC(6,2),
    fat_g               NUMERIC(6,2),
    confidence_score    NUMERIC(4,3) DEFAULT 0.8,
    -- Flags
    dietary_flags       dietary_flag[] DEFAULT '{}',
    is_available        BOOLEAN NOT NULL DEFAULT true,
    -- Delivery app links
    grab_link           TEXT,
    deliveroo_link      TEXT,
    uber_eats_link      TEXT,
    -- Crowd verification
    upvote_count        INTEGER NOT NULL DEFAULT 0,
    log_count           INTEGER NOT NULL DEFAULT 0,  -- how many users logged this
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menu_items_provider ON restaurant_menu_items(provider_id);

-- ============================================================
--  PROVIDERS (Gyms, Restaurants, Delivery Apps, Professionals)
-- ============================================================

CREATE TABLE providers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,  -- portal login
    name            TEXT NOT NULL,
    type            provider_type NOT NULL,
    description     TEXT,
    logo_url        TEXT,
    cover_url       TEXT,
    -- Location
    address         TEXT,
    city            TEXT,
    country_code    CHAR(2),
    latitude        NUMERIC(10,7),
    longitude       NUMERIC(10,7),
    -- Contact
    website         TEXT,
    phone           TEXT,
    email           TEXT,
    -- Delivery integrations
    grab_store_id   TEXT,
    deliveroo_store_id TEXT,
    uber_eats_store_id TEXT,
    -- Status
    is_verified     BOOLEAN NOT NULL DEFAULT false,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    -- Analytics (denormalised)
    profile_views   INTEGER NOT NULL DEFAULT 0,
    macro_logs      INTEGER NOT NULL DEFAULT 0,  -- times users logged their food
    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_providers_location ON providers USING GIST (
    ll_to_earth(latitude, longitude)
) WHERE latitude IS NOT NULL;
CREATE INDEX idx_providers_type ON providers(type);

-- ============================================================
--  PROVIDER CLASSES / SESSIONS
-- ============================================================

CREATE TABLE provider_classes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id     UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    instructor      TEXT,
    description     TEXT,
    duration_mins   INTEGER NOT NULL,
    calories_burn_est INTEGER,
    max_spots       INTEGER NOT NULL DEFAULT 20,
    spots_booked    INTEGER NOT NULL DEFAULT 0,
    -- Schedule
    schedule_days   TEXT[],   -- ['Mon', 'Wed', 'Fri']
    schedule_time   TIME,
    price           NUMERIC(8,2),
    currency        CHAR(3) DEFAULT 'SGD',
    booking_url     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  COMMUNITY POSTS
-- ============================================================

CREATE TABLE community_posts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_type       post_type NOT NULL,
    title           TEXT NOT NULL,
    content         TEXT,
    image_url       TEXT,
    -- Food/restaurant metadata
    food_id         UUID REFERENCES foods(id)          ON DELETE SET NULL,
    provider_id     UUID REFERENCES providers(id)       ON DELETE SET NULL,
    menu_item_id    UUID REFERENCES restaurant_menu_items(id) ON DELETE SET NULL,
    price           NUMERIC(8,2),
    -- Macros (for food/restaurant posts)
    calories        NUMERIC(7,2),
    protein_g       NUMERIC(6,2),
    carbs_g         NUMERIC(6,2),
    fat_g           NUMERIC(6,2),
    macro_accuracy_score NUMERIC(4,3) DEFAULT 0.5,
    macro_verified_count INTEGER NOT NULL DEFAULT 0,
    -- Workout metadata (for workout posts)
    calories_burned INTEGER,
    duration_mins   INTEGER,
    distance_km     NUMERIC(6,3),
    -- Social
    like_count      INTEGER NOT NULL DEFAULT 0,
    comment_count   INTEGER NOT NULL DEFAULT 0,
    save_count      INTEGER NOT NULL DEFAULT 0,
    share_count     INTEGER NOT NULL DEFAULT 0,
    -- Tags
    tags            TEXT[] DEFAULT '{}',
    -- Moderation
    is_flagged      BOOLEAN NOT NULL DEFAULT false,
    is_visible      BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_community_posts_user ON community_posts(user_id, created_at DESC);
CREATE INDEX idx_community_posts_type ON community_posts(post_type, created_at DESC);
CREATE INDEX idx_community_posts_tags ON community_posts USING GIN(tags);

-- ============================================================
--  POST INTERACTIONS
-- ============================================================

CREATE TABLE post_likes (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id     UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

CREATE TABLE post_saves (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id     UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    folder_name TEXT DEFAULT 'Default',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

CREATE TABLE post_comments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id     UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    like_count  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_comments_post ON post_comments(post_id, created_at ASC);

-- ============================================================
--  WORKOUT PLANS
-- ============================================================

CREATE TABLE workout_plans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    workout_type    TEXT NOT NULL,  -- 'strength', 'hiit', 'cardio', 'yoga', etc.
    difficulty      TEXT NOT NULL DEFAULT 'intermediate',  -- 'beginner', 'intermediate', 'advanced'
    duration_mins   INTEGER,
    calories_burn_est INTEGER,
    muscle_groups   TEXT[] DEFAULT '{}',
    tags            TEXT[] DEFAULT '{}',
    -- Social
    save_count      INTEGER NOT NULL DEFAULT 0,
    rating_avg      NUMERIC(3,2) DEFAULT 0,
    rating_count    INTEGER NOT NULL DEFAULT 0,
    is_public       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workout_exercises (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id         UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    sets            SMALLINT,
    reps            TEXT,   -- e.g. '8-10', '45s', '1 min'
    rest_seconds    INTEGER,
    notes           TEXT,
    order_index     SMALLINT NOT NULL DEFAULT 0
);

-- ============================================================
--  BOOKINGS (PT / Nutritionist sessions)
-- ============================================================

CREATE TABLE bookings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id     UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    class_id        UUID REFERENCES provider_classes(id) ON DELETE SET NULL,
    -- Session details
    booking_type    TEXT NOT NULL DEFAULT 'class',  -- 'class', '1on1', 'plan'
    scheduled_at    TIMESTAMPTZ NOT NULL,
    duration_mins   INTEGER,
    price           NUMERIC(8,2),
    currency        CHAR(3) DEFAULT 'SGD',
    notes           TEXT,
    -- Status
    status          booking_status NOT NULL DEFAULT 'pending',
    confirmed_at    TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,
    cancel_reason   TEXT,
    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_user       ON bookings(user_id, scheduled_at DESC);
CREATE INDEX idx_bookings_provider   ON bookings(provider_id, scheduled_at DESC);
CREATE INDEX idx_bookings_status     ON bookings(status, scheduled_at);

-- ============================================================
--  FOLLOW GRAPH
-- ============================================================

CREATE TABLE user_follows (
    follower_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- ============================================================
--  DAILY SUMMARIES (materialised for fast dashboard queries)
-- ============================================================

CREATE TABLE daily_summaries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    summary_date    DATE NOT NULL,
    -- Intake
    total_calories  NUMERIC(8,2) NOT NULL DEFAULT 0,
    total_protein_g NUMERIC(7,2) NOT NULL DEFAULT 0,
    total_carbs_g   NUMERIC(7,2) NOT NULL DEFAULT 0,
    total_fat_g     NUMERIC(7,2) NOT NULL DEFAULT 0,
    total_water_ml  INTEGER NOT NULL DEFAULT 0,
    -- Activity
    calories_burned INTEGER NOT NULL DEFAULT 0,
    active_mins     INTEGER NOT NULL DEFAULT 0,
    steps           INTEGER,
    -- Goals
    calorie_goal    INTEGER,
    protein_goal    INTEGER,
    carbs_goal      INTEGER,
    fat_goal        INTEGER,
    goal_met        BOOLEAN,
    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, summary_date)
);

CREATE INDEX idx_daily_summaries_user_date ON daily_summaries(user_id, summary_date DESC);

-- ============================================================
--  NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        TEXT NOT NULL,  -- 'like', 'comment', 'follow', 'macro_nudge', 'streak', 'booking'
    title       TEXT NOT NULL,
    body        TEXT,
    data        JSONB DEFAULT '{}',
    is_read     BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE NOT is_read;

-- ============================================================
--  MACRO VERIFICATION (community crowd-sourcing)
-- ============================================================

CREATE TABLE macro_verifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_id     UUID REFERENCES foods(id) ON DELETE CASCADE,
    post_id     UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_accurate BOOLEAN NOT NULL,  -- upvote (true) or dispute (false)
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, food_id),
    CHECK (food_id IS NOT NULL OR post_id IS NOT NULL)
);

-- ============================================================
--  UTILITY FUNCTIONS
-- ============================================================

-- Update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['users','foods','food_logs','providers',
    'provider_classes','restaurant_menu_items','community_posts',
    'post_comments','workout_plans','bookings','daily_summaries'] LOOP
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at()', tbl, tbl);
  END LOOP;
END;
$$;

-- ============================================================
--  ROW LEVEL SECURITY (enable for Supabase/Postgres deployments)
-- ============================================================

ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own data
CREATE POLICY "users_own_data" ON users         FOR ALL USING (auth.uid() = id);
CREATE POLICY "food_logs_own"  ON food_logs     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "activity_own"   ON activity_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "water_own"      ON water_logs    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "bookings_own"   ON bookings      FOR ALL USING (auth.uid() = user_id);
-- Community posts: users can read all, write their own
CREATE POLICY "posts_read_all"  ON community_posts FOR SELECT USING (is_visible = true);
CREATE POLICY "posts_write_own" ON community_posts FOR ALL   USING (auth.uid() = user_id);
-- Foods: readable by all, writable by authenticated users
CREATE POLICY "foods_read_all"  ON foods FOR SELECT USING (true);
CREATE POLICY "foods_write_auth"ON foods FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
--  SEED DATA (sample foods for Open Food Facts baseline)
-- ============================================================

INSERT INTO foods (name, brand, emoji, calories_per_100g, protein_g_per_100g, carbs_g_per_100g, fat_g_per_100g, source, is_verified)
VALUES
  ('Chicken Breast, Grilled',     NULL,           '🍗', 165, 31.0,  0.0,  3.6, 'usda', true),
  ('Brown Rice, Cooked',          NULL,           '🍚', 112,  2.6, 23.5,  0.8, 'usda', true),
  ('Whole Egg, Boiled',           NULL,           '🥚', 155, 13.0,  1.1, 11.0, 'usda', true),
  ('Broccoli, Steamed',           NULL,           '🥦',  35,  2.4,  5.1,  0.4, 'usda', true),
  ('Salmon, Baked',               NULL,           '🐟', 208, 20.4,  0.0, 13.4, 'usda', true),
  ('Greek Yogurt, 0% Fat',        'Chobani',      '🥛',  59,  9.9,  3.6,  0.4, 'usda', true),
  ('Oats, Rolled Dry',            NULL,           '🌾', 389, 16.9, 66.3,  6.9, 'usda', true),
  ('Avocado',                     NULL,           '🥑', 160,  2.0,  8.5, 14.7, 'usda', true),
  ('Sweet Potato, Baked',         NULL,           '🍠',  90,  2.0, 20.7,  0.1, 'usda', true),
  ('Banana',                      NULL,           '🍌',  89,  1.1, 22.8,  0.3, 'usda', true),
  ('Almonds, Raw',                NULL,           '🥜', 579, 21.2, 21.6, 49.9, 'usda', true),
  ('Cottage Cheese, Low-fat',     NULL,           '🧀',  98, 11.1,  3.4,  4.3, 'usda', true),
  ('Beef, Lean Mince 90%',        NULL,           '🥩', 176, 20.0,  0.0, 10.0, 'usda', true),
  ('Tuna, Canned in Water',       NULL,           '🐠', 116, 25.5,  0.0,  0.8, 'usda', true),
  ('White Rice, Cooked',          NULL,           '🍚', 130,  2.4, 28.6,  0.3, 'usda', true);

-- ============================================================
--  END OF SCHEMA
-- ============================================================

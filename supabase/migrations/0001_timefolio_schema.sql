-- ============================================================
-- TimeFolio — "Investasi Waktu"
-- 9 tabel: profiles, ai_settings, categories, time_entries,
--          goals, projections, challenges, streaks, chat_messages
-- ============================================================

-- ==================== EXTENSIONS ====================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== PROFILES ====================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT DEFAULT '',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  reset_time INTEGER NOT NULL DEFAULT 0,          -- jam reset (0 = 00:00)
  daily_hours INTEGER NOT NULL DEFAULT 24,
  theme TEXT NOT NULL DEFAULT 'system',           -- system | light | dark
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== AI SETTINGS (BYOK) ====================
CREATE TABLE public.ai_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  base_url TEXT NOT NULL,                          -- base URL OpenAI-compatible (Groq / SumoPod / dll)
  model TEXT NOT NULL,
  api_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- ==================== CATEGORIES (atau "Aset") ====================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '',                  -- nama ikon Lucide
  color TEXT NOT NULL DEFAULT '#2563EB',           -- warna aksen aset
  target_minutes INTEGER NOT NULL DEFAULT 0,       -- target per hari
  sort_order INTEGER NOT NULL DEFAULT 0,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== TIME ENTRIES ====================
CREATE TABLE public.time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  minutes INTEGER NOT NULL CHECK (minutes > 0 AND minutes <= 1440),
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS time_entries_user_date_idx
  ON public.time_entries (user_id, entry_date);
CREATE INDEX IF NOT EXISTS time_entries_category_idx
  ON public.time_entries (category_id);

-- ==================== GOALS ====================
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  weekly_hours NUMERIC(5,2) NOT NULL DEFAULT 0,    -- investasi jam/minggu
  horizon_months INTEGER NOT NULL DEFAULT 6,       -- durasi proyeksi
  expected_outcome TEXT DEFAULT '',                -- hasil yang diharapkan
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'done', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== PROJECTIONS (ROI) ====================
CREATE TABLE public.projections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  scenario TEXT NOT NULL DEFAULT 'base',           -- base | optimistic | conservative
  weekly_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  horizon_months INTEGER NOT NULL DEFAULT 6,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai')),
  result_summary TEXT DEFAULT '',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== CHALLENGES ====================
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  required_days INTEGER NOT NULL DEFAULT 7,          -- mis. 7 hari berturut-turut
  min_minutes INTEGER NOT NULL DEFAULT 0,          -- minimal menit per hari
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'done', 'failed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== STREAKS ====================
CREATE TABLE public.streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_day DATE,                                   -- hari terakhir memenuhi target
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id)
);

-- ==================== CHAT MESSAGES ====================
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_user_idx
  ON public.chat_messages (user_id, created_at);

-- ==================== TRIGGERS: updated_at ====================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_goals_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_ai_settings_updated_at BEFORE UPDATE ON public.ai_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==================== RLS ====================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- helper: kebijakan "user_id = auth.uid()"
CREATE OR REPLACE FUNCTION public.is_owner(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN uid = auth.uid();
END;
$$ LANGUAGE plpgsql STABLE;

-- profiles
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (id = auth.uid());

-- ai_settings: user punya tepat satu baris
CREATE POLICY ai_settings_select_own ON public.ai_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY ai_settings_insert_own ON public.ai_settings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY ai_settings_update_own ON public.ai_settings FOR UPDATE USING (user_id = auth.uid());

-- categories
CREATE POLICY cats_select_own ON public.categories FOR SELECT USING (user_id = auth.uid());
CREATE POLICY cats_insert_own ON public.categories FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY cats_update_own ON public.categories FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY cats_delete_own ON public.categories FOR DELETE USING (user_id = auth.uid());

-- time_entries
CREATE POLICY entries_select_own ON public.time_entries FOR SELECT USING (user_id = auth.uid());
CREATE POLICY entries_insert_own ON public.time_entries FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY entries_update_own ON public.time_entries FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY entries_delete_own ON public.time_entries FOR DELETE USING (user_id = auth.uid());

-- goals
CREATE POLICY goals_select_own ON public.goals FOR SELECT USING (user_id = auth.uid());
CREATE POLICY goals_insert_own ON public.goals FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY goals_update_own ON public.goals FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY goals_delete_own ON public.goals FOR DELETE USING (user_id = auth.uid());

-- projections
CREATE POLICY proj_select_own ON public.projections FOR SELECT USING (user_id = auth.uid());
CREATE POLICY proj_insert_own ON public.projections FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY proj_delete_own ON public.projections FOR DELETE USING (user_id = auth.uid());

-- challenges
CREATE POLICY challenges_select_own ON public.challenges FOR SELECT USING (user_id = auth.uid());
CREATE POLICY challenges_insert_own ON public.challenges FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY challenges_update_own ON public.challenges FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY challenges_delete_own ON public.challenges FOR DELETE USING (user_id = auth.uid());

-- streaks
CREATE POLICY streaks_select_own ON public.streaks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY streaks_insert_own ON public.streaks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY streaks_update_own ON public.streaks FOR UPDATE USING (user_id = auth.uid());

-- chat_messages
CREATE POLICY chat_select_own ON public.chat_messages FOR SELECT USING (user_id = auth.uid());
CREATE POLICY chat_insert_own ON public.chat_messages FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY chat_delete_own ON public.chat_messages FOR DELETE USING (user_id = auth.uid());
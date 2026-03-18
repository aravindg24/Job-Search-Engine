-- Run this in your Supabase SQL editor (https://supabase.com/dashboard/project/_/sql)
-- Creates all tables needed for RoleGPT

CREATE TABLE IF NOT EXISTS resume_profiles (
    id SERIAL PRIMARY KEY,
    raw_text TEXT NOT NULL,
    parsed_profile JSONB NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tracked_jobs (
    id SERIAL PRIMARY KEY,
    job_id TEXT NOT NULL UNIQUE,
    job_title TEXT,
    company TEXT,
    match_score REAL,
    status TEXT DEFAULT 'saved',
    notes TEXT,
    pitch TEXT,
    applied_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on tracked_jobs
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tracked_jobs_updated_at
  BEFORE UPDATE ON tracked_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS watch_preferences (
    id SERIAL PRIMARY KEY,
    min_match_score REAL DEFAULT 70,
    keywords JSONB DEFAULT '[]',
    locations JSONB DEFAULT '[]',
    company_stages JSONB DEFAULT '[]',
    last_checked_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS search_history (
    id SERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    results_count INTEGER,
    top_match_score REAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

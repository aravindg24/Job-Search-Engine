-- Run this in your Supabase SQL editor (https://supabase.com/dashboard/project/_/sql)
-- Creates all tables needed for Direct

CREATE TABLE IF NOT EXISTS resume_profiles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    raw_text TEXT NOT NULL,
    parsed_profile JSONB NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tracked_jobs (
    id SERIAL PRIMARY KEY,
    job_id TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    min_match_score REAL DEFAULT 70,
    keywords JSONB DEFAULT '[]',
    locations JSONB DEFAULT '[]',
    company_stages JSONB DEFAULT '[]',
    last_checked_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS search_history (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    results_count INTEGER,
    top_match_score REAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: add user_id to existing tables if already created without it
ALTER TABLE resume_profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE tracked_jobs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE watch_preferences ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE search_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ── Persistent Jobs ────────────────────────────────────────────────────────────
-- Stores every scraped job for historical record; soft-deleted when no longer live.
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT,
    location TEXT,
    remote BOOLEAN DEFAULT false,
    description TEXT,
    requirements JSONB DEFAULT '[]',
    salary_range TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    company_stage TEXT,
    stream TEXT,
    source TEXT,
    source_url TEXT UNIQUE,
    posted_date DATE,
    indexed_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS jobs_source_idx ON jobs(source);
CREATE INDEX IF NOT EXISTS jobs_stream_idx ON jobs(stream);
CREATE INDEX IF NOT EXISTS jobs_company_idx ON jobs(company);
CREATE INDEX IF NOT EXISTS jobs_remote_idx ON jobs(remote);
CREATE INDEX IF NOT EXISTS jobs_salary_min_idx ON jobs(salary_min);
CREATE INDEX IF NOT EXISTS jobs_is_deleted_idx ON jobs(is_deleted);

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Ingest Run Metrics ─────────────────────────────────────────────────────────
-- One row per indexer execution; tracks per-source job counts and dedup stats.
CREATE TABLE IF NOT EXISTS ingest_runs (
    id SERIAL PRIMARY KEY,
    run_at TIMESTAMPTZ DEFAULT NOW(),
    source_counts JSONB NOT NULL DEFAULT '{}',
    total_before_dedup INTEGER,
    total_after_dedup INTEGER,
    total_indexed INTEGER,
    duration_seconds REAL
);

-- ── STAR Story Bank (F4) ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stories (
    id                   SERIAL PRIMARY KEY,
    user_id              UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    situation            TEXT NOT NULL,
    task                 TEXT NOT NULL,
    action               TEXT NOT NULL,
    result               TEXT NOT NULL,
    skills_demonstrated  TEXT[] DEFAULT '{}',
    created_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS stories_user_id_idx ON stories(user_id);

-- ── Company Watchlist (F7) ────────────────────────────────────────────────────
ALTER TABLE watch_preferences ADD COLUMN IF NOT EXISTS target_companies JSONB DEFAULT '[]';

-- ── Saved Jobs (Search Pagination + Save Feature) ────────────────────────────
-- Tracks jobs saved by users for later review
CREATE TABLE IF NOT EXISTS saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

CREATE INDEX IF NOT EXISTS saved_jobs_user_idx ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS saved_jobs_job_idx ON saved_jobs(job_id);

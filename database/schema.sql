-- profiles
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    current_title TEXT,
    experience_level TEXT,
    years_experience INTEGER,
    skills TEXT[],
    industries TEXT[],
    work_experience JSONB,
    education JSONB,
    job_titles_seeking TEXT[],
    remote_preference TEXT,
    preferred_locations TEXT[],
    salary_expectation TEXT,
    cover_letter_tone TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    work_authorization TEXT,
    resume_pdf_url TEXT,
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- agent_runs
CREATE TABLE agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    status TEXT,
    job_title_searched TEXT,
    location_searched TEXT,
    jobs_found INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- jobs
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES agent_runs(id),
    user_id UUID REFERENCES profiles(id),
    source TEXT CHECK (source IN ('search', 'url')),
    source_url TEXT,
    external_apply_url TEXT,
    title TEXT,
    company TEXT,
    location TEXT,
    salary TEXT,
    job_type TEXT,
    about_role TEXT,
    responsibilities TEXT[],
    requirements TEXT[],
    nice_to_have TEXT[],
    benefits TEXT[],
    about_company TEXT,
    match_score INTEGER,
    match_reason TEXT,
    matched_skills TEXT[],
    missing_skills TEXT[],
    company_research JSONB,
    found_at TIMESTAMPTZ DEFAULT NOW()
);

-- agent_logs
CREATE TABLE agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES agent_runs(id),
    user_id UUID REFERENCES profiles(id),
    message TEXT,
    level TEXT,
    job_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Enable
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage their own agent runs" ON agent_runs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own jobs" ON jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own agent logs" ON agent_logs FOR ALL USING (auth.uid() = user_id);

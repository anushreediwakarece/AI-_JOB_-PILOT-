export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  location: string | null
  current_title: string | null
  experience_level: 'junior' | 'mid' | 'senior' | 'lead' | null
  years_experience: number | null
  skills: string[] | null
  industries: string[] | null
  work_experience: Json | null
  education: Json | null
  job_titles_seeking: string[] | null
  remote_preference: 'remote' | 'onsite' | 'hybrid' | 'any' | null
  preferred_locations: string[] | null
  salary_expectation: string | null
  cover_letter_tone: 'formal' | 'casual' | 'enthusiastic' | null
  linkedin_url: string | null
  portfolio_url: string | null
  work_authorization: 'citizen' | 'permanent_resident' | 'visa_required' | null
  resume_pdf_url: string | null
  is_complete: boolean
  created_at: string
  updated_at: string
}

export interface AgentRun {
  id: string
  user_id: string
  status: 'running' | 'completed' | 'failed'
  job_title_searched: string | null
  location_searched: string | null
  jobs_found: number | null
  started_at: string
  completed_at: string | null
}

export interface Job {
  id: string
  run_id: string | null
  user_id: string
  source: 'search' | 'url'
  source_url: string | null
  external_apply_url: string | null
  title: string | null
  company: string | null
  location: string | null
  salary: string | null
  job_type: 'fulltime' | 'parttime' | 'contract' | null
  about_role: string | null
  responsibilities: string[] | null
  requirements: string[] | null
  nice_to_have: string[] | null
  benefits: string[] | null
  about_company: string | null
  match_score: number | null
  match_reason: string | null
  matched_skills: string[] | null
  missing_skills: string[] | null
  company_research: Json | null
  found_at: string
}

export interface AgentLog {
  id: string
  run_id: string | null
  user_id: string
  message: string | null
  level: 'info' | 'success' | 'warning' | 'error' | null
  job_id: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string }
        Update: Partial<Profile>
      }
      agent_runs: {
        Row: AgentRun
        Insert: Partial<AgentRun> & { user_id: string }
        Update: Partial<AgentRun>
      }
      jobs: {
        Row: Job
        Insert: Partial<Job> & { user_id: string }
        Update: Partial<Job>
      }
      agent_logs: {
        Row: AgentLog
        Insert: Partial<AgentLog> & { user_id: string }
        Update: Partial<AgentLog>
      }
    }
  }
}

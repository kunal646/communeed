-- Create profiles table for both therapists and clients
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text not null,
  role text check (role in ('therapist', 'client')) not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create clients table (replacing therapist_client_relationships)
create table clients (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade,
  therapist_id uuid references profiles(id) on delete cascade,
  phone_number text,
  is_high_risk boolean default false,
  status text check (status in ('active', 'archived')) default 'active',
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  -- Ensure unique profile-therapist pairs
  unique(profile_id, therapist_id)
);

-- Create sessions table
create table sessions (
  id uuid default uuid_generate_v4() primary key,
  therapist_id uuid references profiles(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  title text,
  session_type text check (session_type in ('individual', 'couple')) not null,
  note_type text check (note_type in ('SOAP', 'DAP', 'BIRP')) not null,
  primary_treatment_approach text check (
    primary_treatment_approach in (
      'CBT', 
      'DBT', 
      'psychodynamic',
      'person_centered',
      'solution_focused',
      'narrative',
      'gestalt',
      'existential',
      'other'
    )
  ) not null,
  setting text check (setting in ('in_person', 'telehealth')) not null,
  session_date timestamp with time zone not null,
  recording_time integer, -- in minutes
  status text check (status in ('scheduled', 'completed', 'cancelled', 'in_progress')) not null,
  notes text,
  clinician_summary text,
  client_summary text,
  recording_url text,
  recording_transcription text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS (Row Level Security)
alter table profiles enable row level security;
alter table clients enable row level security;
alter table sessions enable row level security;

-- Create policies
-- Profiles policies
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Clients policies
create policy "Therapists can view their clients"
  on clients for select
  using (auth.uid() = therapist_id);

create policy "Therapists can manage their clients"
  on clients for all
  using (auth.uid() = therapist_id);

-- Sessions policies
create policy "Therapists can view their sessions"
  on sessions for select
  using (auth.uid() = therapist_id);

create policy "Clients can view their sessions"
  on sessions for select
  using (
    exists (
      select 1 from clients
      where clients.id = sessions.client_id
      and clients.profile_id = auth.uid()
    )
  );

create policy "Therapists can manage their sessions"
  on sessions for all
  using (auth.uid() = therapist_id); 
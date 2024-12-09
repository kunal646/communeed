export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'therapist' | 'client';
  created_at: string;
  updated_at: string;
};

export type Client = {
  id: string;
  profile_id: string;
  therapist_id: string;
  phone_number?: string;
  is_high_risk: boolean;
  status: 'active' | 'archived';
  notes?: string;
  created_at: string;
  updated_at: string;
  pronouns: string;
};

export type Message = {
  id: string
  client_id: string
  text_message: string | null
  recording_url: string | null
  emotions: string | null
  message_type: 'text' | 'recording'
  created_at: string
  updated_at: string
  event_date: string
}

export type Session = {
  id: string;
  therapist_id: string;
  client_id: string;
  title?: string;
  session_type: 'individual' | 'couple';
  note_type: 'SOAP' | 'DAP' | 'BIRP';
  primary_treatment_approach: 
    | 'CBT'
    | 'DBT'
    | 'psychodynamic'
    | 'person_centered'
    | 'solution_focused'
    | 'narrative'
    | 'gestalt'
    | 'existential'
    | 'other';
  setting: 'in_person' | 'telehealth';
  session_date: string;
  recording_time?: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'in_progress';
  notes?: string;
  recording_url?: string;
  recording_transcription?: string;
  created_at: string;
  updated_at: string;
};

// Database response types with joins
export type ClientWithProfile = Client & {
  profile: Profile;
};

export type SessionWithProfiles = Session & {
  client: ClientWithProfile;
  therapist: Profile;
}; 
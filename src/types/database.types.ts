export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      autosave_ballots: {
        Row: {
          id: string
          event_id: string
          judge_profile_id: string | null
          team_id: string | null
          payload: Json
          comment_strength: string | null
          comment_improvement: string | null
          is_locked: boolean | null
          locked_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          judge_profile_id?: string | null
          team_id?: string | null
          payload?: Json
          comment_strength?: string | null
          comment_improvement?: string | null
          is_locked?: boolean | null
          locked_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          judge_profile_id?: string | null
          team_id?: string | null
          payload?: Json
          comment_strength?: string | null
          comment_improvement?: string | null
          is_locked?: boolean | null
          locked_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      brief_content: {
        Row: {
          id: string
          event_id: string
          sections: Json
          is_published: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          sections?: Json
          is_published?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          sections?: Json
          is_published?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      judge_profiles: {
        Row: {
          id: string
          user_id: string | null
          event_id: string
          pin_hash: string
          pin_salt: string
          pin_valid_until: string
          requires_reset: boolean | null
          created_at: string | null
          updated_at: string | null
          last_login_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_id: string
          pin_hash: string
          pin_salt: string
          pin_valid_until: string
          requires_reset?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          last_login_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          event_id?: string
          pin_hash?: string
          pin_salt?: string
          pin_valid_until?: string
          requires_reset?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          last_login_at?: string | null
        }
      }
      judges: {
        Row: {
          id: string
          event_id: string
          user_id: string | null
          full_name: string
          bio: string | null
          headshot_url: string | null
          is_published: boolean | null
          display_order: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          user_id?: string | null
          full_name: string
          bio?: string | null
          headshot_url?: string | null
          is_published?: boolean | null
          display_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string | null
          full_name?: string
          bio?: string | null
          headshot_url?: string | null
          is_published?: boolean | null
          display_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      scores: {
        Row: {
          id: string
          event_id: string
          team_id: string | null
          judge_profile_id: string | null
          criterion_id: string
          score_value: number
          comment: string | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          team_id?: string | null
          judge_profile_id?: string | null
          criterion_id: string
          score_value: number
          comment?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          team_id?: string | null
          judge_profile_id?: string | null
          criterion_id?: string
          score_value?: number
          comment?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
      }
      scoring_criteria: {
        Row: {
          id: string
          event_id: string
          criterion_id: string
          label: string
          helper_copy: string | null
          weight: number
          default_value: number | null
          ordering: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          criterion_id: string
          label: string
          helper_copy?: string | null
          weight: number
          default_value?: number | null
          ordering?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          criterion_id?: string
          label?: string
          helper_copy?: string | null
          weight?: number
          default_value?: number | null
          ordering?: number
          created_at?: string | null
          updated_at?: string | null
        }
      }
      teams: {
        Row: {
          id: string
          event_id: string
          team_name: string
          problem_track: string | null
          presentation_order: number | null
          is_finalist: boolean | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          team_name: string
          problem_track?: string | null
          presentation_order?: number | null
          is_finalist?: boolean | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          team_name?: string
          problem_track?: string | null
          presentation_order?: number | null
          is_finalist?: boolean | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      ballot_audit: {
        Row: {
          id: string
          ballot_id: string | null
          judge_profile_id: string | null
          event_id: string
          team_id: string | null
          action: 'submitted' | 'unlock_requested' | 'unlock_approved' | 'unlock_rejected' | 'unlock_revoked'
          metadata: Json
          created_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          ballot_id?: string | null
          judge_profile_id?: string | null
          event_id: string
          team_id?: string | null
          action: 'submitted' | 'unlock_requested' | 'unlock_approved' | 'unlock_rejected' | 'unlock_revoked'
          metadata?: Json
          created_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          ballot_id?: string | null
          judge_profile_id?: string | null
          event_id?: string
          team_id?: string | null
          action?: 'submitted' | 'unlock_requested' | 'unlock_approved' | 'unlock_rejected' | 'unlock_revoked'
          metadata?: Json
          created_at?: string | null
          created_by?: string | null
        }
      }
      ballot_unlock_requests: {
        Row: {
          id: string
          ballot_id: string | null
          judge_profile_id: string | null
          event_id: string
          team_id: string | null
          reason: string | null
          status: 'pending' | 'approved' | 'rejected'
          created_at: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolution_notes: string | null
        }
        Insert: {
          id?: string
          ballot_id?: string | null
          judge_profile_id?: string | null
          event_id: string
          team_id?: string | null
          reason?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolution_notes?: string | null
        }
        Update: {
          id?: string
          ballot_id?: string | null
          judge_profile_id?: string | null
          event_id?: string
          team_id?: string | null
          reason?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolution_notes?: string | null
        }
      }
      events: {
        Row: {
          id: string
          name: string
          description: string | null
          rankings_unlocked_at: string | null
          rankings_auto_unlock: boolean | null
          created_at: string | null
          updated_at: string | null
          metadata: Json
        }
        Insert: {
          id: string
          name: string
          description?: string | null
          rankings_unlocked_at?: string | null
          rankings_auto_unlock?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          rankings_unlocked_at?: string | null
          rankings_auto_unlock?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          metadata?: Json
        }
      }
      rankings_refresh_log: {
        Row: {
          id: string
          event_id: string
          refreshed_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          refreshed_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          refreshed_at?: string | null
        }
      }
    }
    Views: {
      finalists_view: {
        Row: {
          id: string | null
          event_id: string | null
          team_name: string | null
          problem_track: string | null
          presentation_order: number | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
      }
      judges_view: {
        Row: {
          id: string | null
          event_id: string | null
          full_name: string | null
          bio: string | null
          headshot_url: string | null
          display_order: number | null
          created_at: string | null
          updated_at: string | null
        }
      }
      rankings_materialized: {
        Row: {
          event_id: string | null
          team_id: string | null
          team_name: string | null
          total_score: number | null
          rank: number | null
          delta_to_prev: number | null
          submitted_count: number | null
          criterion_scores: Json | null
        }
      }
    }
    Functions: {
      autosave_ballot: {
        Args: {
          p_event_id: string
          p_team_id: string
          p_payload: Json
          p_comment_strength?: string | null
          p_comment_improvement?: string | null
        }
        Returns: Json
      }
      finalize_ballot: {
        Args: {
          p_event_id: string
          p_team_id: string
        }
        Returns: Json
      }
      submit_score: {
        Args: {
          p_event_id: string
          p_team_id: string
          p_criterion_id: string
          p_score_value: number
          p_comment?: string | null
        }
        Returns: Json
      }
      submit_ballot: {
        Args: {
          p_event_id: string
          p_team_id: string
          p_payload: Json
          p_comment_strength?: string | null
          p_comment_improvement?: string | null
        }
        Returns: Json
      }
      request_unlock: {
        Args: {
          p_event_id: string
          p_team_id: string
          p_reason?: string | null
        }
        Returns: Json
      }
      approve_unlock_request: {
        Args: {
          p_request_id: string
          p_resolution_notes?: string | null
        }
        Returns: Json
      }
      reject_unlock_request: {
        Args: {
          p_request_id: string
          p_resolution_notes?: string | null
        }
        Returns: Json
      }
      get_rankings: {
        Args: {
          p_event_id: string
        }
        Returns: {
          event_id: string
          team_id: string
          team_name: string
          total_score: number
          rank: number
          delta_to_prev: number | null
          submitted_count: number
          criterion_scores: Json
          is_unlocked: boolean
          unlocked_at: string | null
        }[]
      }
      unlock_rankings: {
        Args: {
          p_event_id: string
        }
        Returns: Json
      }
      check_rankings_auto_unlock: {
        Args: {
          p_event_id: string
        }
        Returns: Json
      }
    }
  }
}

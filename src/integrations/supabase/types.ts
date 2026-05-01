export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      join_requests: {
        Row: {
          created_at: string
          id: string
          player_names: string[] | null
          player_photos: string[] | null
          requested_by: string | null
          status: string
          team_logo_url: string | null
          team_name: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_names?: string[] | null
          player_photos?: string[] | null
          requested_by?: string | null
          status?: string
          team_logo_url?: string | null
          team_name: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          player_names?: string[] | null
          player_photos?: string[] | null
          requested_by?: string | null
          status?: string
          team_logo_url?: string | null
          team_name?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "join_requests_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number | null
          away_sets: number | null
          away_team_id: string | null
          created_at: string
          group_name: string | null
          home_score: number | null
          home_sets: number | null
          home_team_id: string | null
          id: string
          man_of_match_name: string | null
          match_date: string | null
          match_order: number
          match_time: string | null
          next_match_id: string | null
          round: number
          sets_detail: Json | null
          status: Database["public"]["Enums"]["match_status"]
          tournament_id: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          away_score?: number | null
          away_sets?: number | null
          away_team_id?: string | null
          created_at?: string
          group_name?: string | null
          home_score?: number | null
          home_sets?: number | null
          home_team_id?: string | null
          id?: string
          man_of_match_name?: string | null
          match_date?: string | null
          match_order?: number
          match_time?: string | null
          next_match_id?: string | null
          round?: number
          sets_detail?: Json | null
          status?: Database["public"]["Enums"]["match_status"]
          tournament_id: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          away_score?: number | null
          away_sets?: number | null
          away_team_id?: string | null
          created_at?: string
          group_name?: string | null
          home_score?: number | null
          home_sets?: number | null
          home_team_id?: string | null
          id?: string
          man_of_match_name?: string | null
          match_date?: string | null
          match_order?: number
          match_time?: string | null
          next_match_id?: string | null
          round?: number
          sets_detail?: Json | null
          status?: Database["public"]["Enums"]["match_status"]
          tournament_id?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_next_match_id_fkey"
            columns: ["next_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_organizer_id: string | null
          related_tournament_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_organizer_id?: string | null
          related_tournament_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_organizer_id?: string | null
          related_tournament_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_tournament_id_fkey"
            columns: ["related_tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      player_pool: {
        Row: {
          age_category: string | null
          birth_date: string | null
          created_at: string
          full_name: string
          id: string
          organizer_id: string
          photo_url: string | null
          season: string
        }
        Insert: {
          age_category?: string | null
          birth_date?: string | null
          created_at?: string
          full_name: string
          id?: string
          organizer_id: string
          photo_url?: string | null
          season?: string
        }
        Update: {
          age_category?: string | null
          birth_date?: string | null
          created_at?: string
          full_name?: string
          id?: string
          organizer_id?: string
          photo_url?: string | null
          season?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          birth_date: string | null
          created_at: string
          id: string
          is_captain: boolean
          name: string
          number: number
          photo_url: string | null
          position: string
          team_id: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          id?: string
          is_captain?: boolean
          name: string
          number?: number
          photo_url?: string | null
          position?: string
          team_id: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          id?: string
          is_captain?: boolean
          name?: string
          number?: number
          photo_url?: string | null
          position?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          file_names: string[] | null
          id: string
          media_types: string[] | null
          media_urls: string[] | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          file_names?: string[] | null
          id?: string
          media_types?: string[] | null
          media_urls?: string[] | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          file_names?: string[] | null
          id?: string
          media_types?: string[] | null
          media_urls?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          is_organizer: boolean | null
          pin_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_organizer?: boolean | null
          pin_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_organizer?: boolean | null
          pin_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      standings: {
        Row: {
          created_at: string
          drawn: number | null
          goal_difference: number | null
          goals_against: number | null
          goals_for: number | null
          group_name: string | null
          id: string
          lost: number | null
          played: number | null
          points: number | null
          position: number | null
          team_id: string
          tournament_id: string
          updated_at: string
          won: number | null
        }
        Insert: {
          created_at?: string
          drawn?: number | null
          goal_difference?: number | null
          goals_against?: number | null
          goals_for?: number | null
          group_name?: string | null
          id?: string
          lost?: number | null
          played?: number | null
          points?: number | null
          position?: number | null
          team_id: string
          tournament_id: string
          updated_at?: string
          won?: number | null
        }
        Update: {
          created_at?: string
          drawn?: number | null
          goal_difference?: number | null
          goals_against?: number | null
          goals_for?: number | null
          group_name?: string | null
          id?: string
          lost?: number | null
          played?: number | null
          points?: number | null
          position?: number | null
          team_id?: string
          tournament_id?: string
          updated_at?: string
          won?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standings_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          group_name: string | null
          id: string
          is_eliminated: boolean | null
          logo_url: string | null
          name: string
          seed: number | null
          tournament_id: string
        }
        Insert: {
          created_at?: string
          group_name?: string | null
          id?: string
          is_eliminated?: boolean | null
          logo_url?: string | null
          name: string
          seed?: number | null
          tournament_id: string
        }
        Update: {
          created_at?: string
          group_name?: string | null
          id?: string
          is_eliminated?: boolean | null
          logo_url?: string | null
          name?: string
          seed?: number | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          accept_join_requests: boolean | null
          age_category: string | null
          completed_at: string | null
          created_at: string
          current_round: number | null
          end_date: string | null
          id: string
          is_archived: boolean
          logo_url: string | null
          max_teams: number | null
          name: string
          num_groups: number | null
          num_teams: number
          owner_id: string | null
          referee_name: string | null
          season: string | null
          sport_type: Database["public"]["Enums"]["sport_type"]
          start_date: string | null
          status: Database["public"]["Enums"]["tournament_status"]
          teams_per_group: number | null
          type: Database["public"]["Enums"]["tournament_type"]
          updated_at: string
          venue_address: string | null
          venue_name: string | null
          venue_photos: string[] | null
          volleyball_format: string | null
        }
        Insert: {
          accept_join_requests?: boolean | null
          age_category?: string | null
          completed_at?: string | null
          created_at?: string
          current_round?: number | null
          end_date?: string | null
          id?: string
          is_archived?: boolean
          logo_url?: string | null
          max_teams?: number | null
          name: string
          num_groups?: number | null
          num_teams?: number
          owner_id?: string | null
          referee_name?: string | null
          season?: string | null
          sport_type?: Database["public"]["Enums"]["sport_type"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          teams_per_group?: number | null
          type?: Database["public"]["Enums"]["tournament_type"]
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
          venue_photos?: string[] | null
          volleyball_format?: string | null
        }
        Update: {
          accept_join_requests?: boolean | null
          age_category?: string | null
          completed_at?: string | null
          created_at?: string
          current_round?: number | null
          end_date?: string | null
          id?: string
          is_archived?: boolean
          logo_url?: string | null
          max_teams?: number | null
          name?: string
          num_groups?: number | null
          num_teams?: number
          owner_id?: string | null
          referee_name?: string | null
          season?: string | null
          sport_type?: Database["public"]["Enums"]["sport_type"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          teams_per_group?: number | null
          type?: Database["public"]["Enums"]["tournament_type"]
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
          venue_photos?: string[] | null
          volleyball_format?: string | null
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "organizer" | "viewer"
      match_status: "scheduled" | "live" | "completed"
      sport_type: "football" | "basketball" | "volleyball"
      tournament_status: "draft" | "upcoming" | "live" | "completed"
      tournament_type: "knockout" | "league" | "groups"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["organizer", "viewer"],
      match_status: ["scheduled", "live", "completed"],
      sport_type: ["football", "basketball", "volleyball"],
      tournament_status: ["draft", "upcoming", "live", "completed"],
      tournament_type: ["knockout", "league", "groups"],
    },
  },
} as const

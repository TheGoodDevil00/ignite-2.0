export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "scorer" | "viewer";
export type MatchStatus = "scheduled" | "live" | "completed" | "cancelled";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: number;
          name: string;
          group: string | null;
          captain_id: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          group?: string | null;
          captain_id?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          group?: string | null;
          captain_id?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_captain_id_fkey";
            columns: ["captain_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
        ];
      };
      players: {
        Row: {
          id: number;
          name: string;
          jersey_number: number | null;
          team_id: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          jersey_number?: number | null;
          team_id: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          jersey_number?: number | null;
          team_id?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      rounds: {
        Row: {
          id: number;
          name: string;
          round_number: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          round_number: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          round_number?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: number;
          home_team_id: number | null;
          away_team_id: number | null;
          round_id: number;
          status: MatchStatus;
          estimated_start: string | null;
          venue_detail: string | null;
          is_bye: boolean;
          bye_team_id: number | null;
          scorer_id: string | null;
          match_number: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          home_team_id?: number | null;
          away_team_id?: number | null;
          round_id: number;
          status?: MatchStatus;
          estimated_start?: string | null;
          venue_detail?: string | null;
          is_bye?: boolean;
          bye_team_id?: number | null;
          scorer_id?: string | null;
          match_number: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          home_team_id?: number | null;
          away_team_id?: number | null;
          round_id?: number;
          status?: MatchStatus;
          estimated_start?: string | null;
          venue_detail?: string | null;
          is_bye?: boolean;
          bye_team_id?: number | null;
          scorer_id?: string | null;
          match_number?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matches_home_team_id_fkey";
            columns: ["home_team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_away_team_id_fkey";
            columns: ["away_team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_round_id_fkey";
            columns: ["round_id"];
            isOneToOne: false;
            referencedRelation: "rounds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_bye_team_id_fkey";
            columns: ["bye_team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_scorer_id_fkey";
            columns: ["scorer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      match_scores: {
        Row: {
          match_id: number;
          home_score: number;
          away_score: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          match_id: number;
          home_score?: number;
          away_score?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          match_id?: number;
          home_score?: number;
          away_score?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "match_scores_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: true;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_scores_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      site_config: {
        Row: {
          key: string;
          value: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          value?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          key?: string;
          value?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "site_config_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      match_status: MatchStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Row"];

export type TablesInsert<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Update"];

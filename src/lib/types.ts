export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      applications: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          repository_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          repository_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          repository_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      checkpoints: {
        Row: {
          changes_description: string
          current_thinking: string
          id: string
          next_steps: string | null
          progress: string
          session_id: string | null
          timestamp: string
        }
        Insert: {
          changes_description: string
          current_thinking: string
          id?: string
          next_steps?: string | null
          progress: string
          session_id?: string | null
          timestamp?: string
        }
        Update: {
          changes_description?: string
          current_thinking?: string
          id?: string
          next_steps?: string | null
          progress?: string
          session_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkpoints_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          alternatives: string | null
          description: string
          id: string
          reasoning: string
          session_id: string
          timestamp: string
        }
        Insert: {
          alternatives?: string | null
          description: string
          id?: string
          reasoning: string
          session_id: string
          timestamp?: string
        }
        Update: {
          alternatives?: string | null
          description?: string
          id?: string
          reasoning?: string
          session_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          application_id: string
          blocked_by_id: string | null
          blocking_reason: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json
          name: string
          priority: number
          status: Database["public"]["Enums"]["feature_status"]
          status_history: Json
          status_updated_at: string
          updated_at: string
        }
        Insert: {
          application_id: string
          blocked_by_id?: string | null
          blocking_reason?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          name: string
          priority?: number
          status?: Database["public"]["Enums"]["feature_status"]
          status_history?: Json
          status_updated_at?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          blocked_by_id?: string | null
          blocking_reason?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          name?: string
          priority?: number
          status?: Database["public"]["Enums"]["feature_status"]
          status_history?: Json
          status_updated_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "features_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "features_blocked_by_id_fkey"
            columns: ["blocked_by_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          applicable_task_types: string[]
          created_at: string
          decision_id: string | null
          description: string
          feedback_type: string
          id: string
          reusability_score: number | null
          session_id: string | null
          tags: string[] | null
        }
        Insert: {
          applicable_task_types: string[]
          created_at?: string
          decision_id?: string | null
          description: string
          feedback_type: string
          id?: string
          reusability_score?: number | null
          session_id?: string | null
          tags?: string[] | null
        }
        Update: {
          applicable_task_types?: string[]
          created_at?: string
          decision_id?: string | null
          description?: string
          feedback_type?: string
          id?: string
          reusability_score?: number | null
          session_id?: string | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      file_changes: {
        Row: {
          change_type: string
          file_path: string
          id: string
          session_id: string | null
          timestamp: string
        }
        Insert: {
          change_type: string
          file_path: string
          id?: string
          session_id?: string | null
          timestamp?: string
        }
        Update: {
          change_type?: string
          file_path?: string
          id?: string
          session_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_changes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      scope_validations: {
        Row: {
          details: string
          id: string
          result: string
          session_id: string
          timestamp: string
          validation_type: string
        }
        Insert: {
          details: string
          id?: string
          result: string
          session_id: string
          timestamp?: string
          validation_type: string
        }
        Update: {
          details?: string
          id?: string
          result?: string
          session_id?: string
          timestamp?: string
          validation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "scope_validations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          application_id: string | null
          compliance_score: number | null
          context_description: string | null
          end_time: string | null
          feature_id: string | null
          id: string
          last_checkpoint_at: string | null
          last_decision_at: string | null
          last_file_change_at: string | null
          start_time: string
          status: string
          summary: string | null
          task_id: string | null
          task_type: string
        }
        Insert: {
          application_id?: string | null
          compliance_score?: number | null
          context_description?: string | null
          end_time?: string | null
          feature_id?: string | null
          id: string
          last_checkpoint_at?: string | null
          last_decision_at?: string | null
          last_file_change_at?: string | null
          start_time?: string
          status?: string
          summary?: string | null
          task_id?: string | null
          task_type: string
        }
        Update: {
          application_id?: string | null
          compliance_score?: number | null
          context_description?: string | null
          end_time?: string | null
          feature_id?: string | null
          id?: string
          last_checkpoint_at?: string | null
          last_decision_at?: string | null
          last_file_change_at?: string | null
          start_time?: string
          status?: string
          summary?: string | null
          task_id?: string | null
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      snapshots: {
        Row: {
          content: string
          content_hash: string | null
          file_path: string
          id: string
          session_id: string
          timestamp: string
        }
        Insert: {
          content: string
          content_hash?: string | null
          file_path: string
          id?: string
          session_id: string
          timestamp?: string
        }
        Update: {
          content?: string
          content_hash?: string | null
          file_path?: string
          id?: string
          session_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "snapshots_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      task_requirements: {
        Row: {
          created_at: string
          description: string
          id: string
          priority: number
          requirement_type: string
          task_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          priority?: number
          requirement_type: string
          task_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          priority?: number
          requirement_type?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_requirements_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          acceptance_criteria: string | null
          blocked_by_id: string | null
          blocking_reason: string | null
          created_at: string
          description: string | null
          feature_id: string
          id: string
          metadata: Json
          name: string
          priority: number
          status: Database["public"]["Enums"]["task_status"]
          status_history: Json
          status_updated_at: string
          updated_at: string
        }
        Insert: {
          acceptance_criteria?: string | null
          blocked_by_id?: string | null
          blocking_reason?: string | null
          created_at?: string
          description?: string | null
          feature_id: string
          id?: string
          metadata?: Json
          name: string
          priority?: number
          status?: Database["public"]["Enums"]["task_status"]
          status_history?: Json
          status_updated_at?: string
          updated_at?: string
        }
        Update: {
          acceptance_criteria?: string | null
          blocked_by_id?: string | null
          blocking_reason?: string | null
          created_at?: string
          description?: string | null
          feature_id?: string
          id?: string
          metadata?: Json
          name?: string
          priority?: number
          status?: Database["public"]["Enums"]["task_status"]
          status_history?: Json
          status_updated_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_blocked_by_id_fkey"
            columns: ["blocked_by_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      feature_status:
        | "planned"
        | "backlog"
        | "ready"
        | "in_progress"
        | "blocked"
        | "on_hold"
        | "in_review"
        | "completed"
        | "wont_do"
        | "abandoned"
        | "archived"
      task_status:
        | "backlog"
        | "ready"
        | "blocked"
        | "on_hold"
        | "in_progress"
        | "in_review"
        | "needs_revision"
        | "completed"
        | "wont_do"
        | "abandoned"
        | "archived"
    }
    CompositeTypes: {
      status_history_entry: {
        status: string | null
        changed_at: string | null
        changed_by: string | null
        reason: string | null
      }
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never


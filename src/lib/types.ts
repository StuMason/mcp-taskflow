// Application represents a top-level software product
export interface Application {
  id: string;
  name: string;
  description: string | null;
  repository_url: string | null;
  created_at: string;
  updated_at: string;
}

// Feature represents a major functionality group within an application
export interface Feature {
  id: string;
  application_id: string;
  name: string;
  description: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'abandoned';
  priority: number;
  created_at: string;
  updated_at: string;
}

// Task represents a specific work item within a feature
export interface Task {
  id: string;
  feature_id: string;
  name: string;
  description: string | null;
  acceptance_criteria: string | null;
  status: 'backlog' | 'ready' | 'in_progress' | 'review' | 'completed';
  priority: number;
  created_at: string;
  updated_at: string;
}

// Session represents an AI assistant working session
export interface Session {
  id: string;
  task_id: string | null;
  application_id: string | null;
  feature_id: string | null;
  task_type: string;
  context_description: string | null;
  status: 'active' | 'completed' | 'abandoned';
  start_time: string;
  end_time: string | null;
  summary: string | null;
}

// FileChange represents a modification to a file during a session
export interface FileChange {
  id: string;
  session_id: string;
  file_path: string;
  change_type: 'created' | 'modified' | 'deleted';
  timestamp: string;
}

// Checkpoint represents a progress marker during a session
export interface Checkpoint {
  id: string;
  session_id: string;
  progress: string;
  changes_description: string;
  current_thinking: string;
  next_steps: string | null;
  timestamp: string;
}

// Snapshot captures the actual content of a file at a point in time
export interface Snapshot {
  id: string;
  session_id: string;
  file_path: string;
  content: string;
  content_hash: string | null;
  timestamp: string;
}

// Decision records a key decision made during development
export interface Decision {
  id: string;
  session_id: string;
  description: string;
  reasoning: string;
  alternatives: string | null;
  timestamp: string;
}

// Database schema types for Supabase
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      applications: {
        Row: {
          id: string
          name: string
          description: string | null
          repository_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          repository_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          repository_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      features: {
        Row: {
          id: string
          application_id: string
          name: string
          description: string | null
          status: 'planned' | 'backlog' | 'ready' | 'in_progress' | 'blocked' | 'on_hold' | 'in_review' | 'completed' | 'wont_do' | 'abandoned' | 'archived'
          priority: number
          blocking_reason: string | null
          blocked_by_id: string | null
          status_updated_at: string
          status_history: Json[]
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          name: string
          description?: string | null
          status?: 'planned' | 'backlog' | 'ready' | 'in_progress' | 'blocked' | 'on_hold' | 'in_review' | 'completed' | 'wont_do' | 'abandoned' | 'archived'
          priority?: number
          blocking_reason?: string | null
          blocked_by_id?: string | null
          status_updated_at?: string
          status_history?: Json[]
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          name?: string
          description?: string | null
          status?: 'planned' | 'backlog' | 'ready' | 'in_progress' | 'blocked' | 'on_hold' | 'in_review' | 'completed' | 'wont_do' | 'abandoned' | 'archived'
          priority?: number
          blocking_reason?: string | null
          blocked_by_id?: string | null
          status_updated_at?: string
          status_history?: Json[]
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "features_application_id_fkey"
            columns: ["application_id"]
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "features_blocked_by_id_fkey"
            columns: ["blocked_by_id"]
            referencedRelation: "features"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          feature_id: string
          name: string
          description: string | null
          acceptance_criteria: string | null
          status: 'backlog' | 'ready' | 'blocked' | 'on_hold' | 'in_progress' | 'in_review' | 'needs_revision' | 'completed' | 'wont_do' | 'abandoned' | 'archived'
          priority: number
          blocking_reason: string | null
          blocked_by_id: string | null
          status_updated_at: string
          status_history: Json[]
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          feature_id: string
          name: string
          description?: string | null
          acceptance_criteria?: string | null
          status?: 'backlog' | 'ready' | 'blocked' | 'on_hold' | 'in_progress' | 'in_review' | 'needs_revision' | 'completed' | 'wont_do' | 'abandoned' | 'archived'
          priority?: number
          blocking_reason?: string | null
          blocked_by_id?: string | null
          status_updated_at?: string
          status_history?: Json[]
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          feature_id?: string
          name?: string
          description?: string | null
          acceptance_criteria?: string | null
          status?: 'backlog' | 'ready' | 'blocked' | 'on_hold' | 'in_progress' | 'in_review' | 'needs_revision' | 'completed' | 'wont_do' | 'abandoned' | 'archived'
          priority?: number
          blocking_reason?: string | null
          blocked_by_id?: string | null
          status_updated_at?: string
          status_history?: Json[]
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_feature_id_fkey"
            columns: ["feature_id"]
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_blocked_by_id_fkey"
            columns: ["blocked_by_id"]
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      sessions: {
        Row: {
          id: string
          task_id: string
          task_type: string
          context_description: string | null
          compliance_score: number | null
          timestamp: string
        }
        Insert: {
          id?: string
          task_id: string
          task_type: string
          context_description?: string | null
          compliance_score?: number | null
          timestamp?: string
        }
        Update: {
          id?: string
          task_id?: string
          task_type?: string
          context_description?: string | null
          compliance_score?: number | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_task_id_fkey"
            columns: ["task_id"]
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      file_changes: {
        Row: {
          id: string
          session_id: string | null
          file_path: string
          change_type: 'created' | 'modified' | 'deleted'
          timestamp: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          file_path: string
          change_type: 'created' | 'modified' | 'deleted'
          timestamp?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          file_path?: string
          change_type?: 'created' | 'modified' | 'deleted'
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_changes_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      checkpoints: {
        Row: {
          id: string
          session_id: string
          progress: string
          changes_description: string
          current_thinking: string
          next_steps: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          session_id: string
          progress: string
          changes_description: string
          current_thinking: string
          next_steps?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          session_id?: string
          progress?: string
          changes_description?: string
          current_thinking?: string
          next_steps?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkpoints_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      snapshots: {
        Row: {
          id: string
          session_id: string
          file_path: string
          content: string
          content_hash: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          session_id: string
          file_path: string
          content: string
          content_hash?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          session_id?: string
          file_path?: string
          content?: string
          content_hash?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "snapshots_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      decisions: {
        Row: {
          id: string
          session_id: string
          description: string
          reasoning: string
          alternatives: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          session_id: string
          description: string
          reasoning: string
          alternatives?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          session_id?: string
          description?: string
          reasoning?: string
          alternatives?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
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
      feature_status: 'planned' | 'backlog' | 'ready' | 'in_progress' | 'blocked' | 'on_hold' | 'in_review' | 'completed' | 'wont_do' | 'abandoned' | 'archived'
      task_status: 'backlog' | 'ready' | 'blocked' | 'on_hold' | 'in_progress' | 'in_review' | 'needs_revision' | 'completed' | 'wont_do' | 'abandoned' | 'archived'
    }
  }
}
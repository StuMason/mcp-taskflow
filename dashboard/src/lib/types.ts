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

// Complete Database type for Supabase
export interface Database {
  public: {
    Tables: {
      applications: {
        Row: Application;
        Insert: Omit<Application, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Application, 'id' | 'created_at' | 'updated_at'>>;
      };
      features: {
        Row: Feature;
        Insert: Omit<Feature, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Feature, 'id' | 'created_at' | 'updated_at'>>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>;
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, 'id'>;
        Update: Partial<Omit<Session, 'id'>>;
      };
      file_changes: {
        Row: FileChange;
        Insert: Omit<FileChange, 'id'>;
        Update: Partial<Omit<FileChange, 'id'>>;
      };
      checkpoints: {
        Row: Checkpoint;
        Insert: Omit<Checkpoint, 'id'>;
        Update: Partial<Omit<Checkpoint, 'id'>>;
      };
      snapshots: {
        Row: Snapshot;
        Insert: Omit<Snapshot, 'id'>;
        Update: Partial<Omit<Snapshot, 'id'>>;
      };
      decisions: {
        Row: Decision;
        Insert: Omit<Decision, 'id'>;
        Update: Partial<Omit<Decision, 'id'>>;
      };
    };
  };
} 
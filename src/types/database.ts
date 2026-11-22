export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      charges: {
        Row: {
          amount_cents: number;
          duration_minutes: number;
          hourly_rate: number;
          lesson_id: string;
          payment_id: string | null;
          student_id: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount_cents?: never;
          duration_minutes: number;
          hourly_rate: number;
          lesson_id: string;
          payment_id?: string | null;
          student_id: string;
          workspace_id: string;
        };
        Update: {
          amount_cents?: never;
          duration_minutes?: number;
          hourly_rate?: number;
          lesson_id?: string;
          payment_id?: string | null;
          student_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "charges_workspace_id_student_id_lesson_id_fkey";
            columns: ["workspace_id", "student_id", "lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["workspace_id", "student_id", "id"];
          },
          {
            foreignKeyName: "charges_workspace_id_student_id_payment_id_fkey";
            columns: ["workspace_id", "student_id", "payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["workspace_id", "student_id", "id"];
          },
        ];
      };
      grades: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "grades_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["workspace_id"];
          },
        ];
      };
      guardians: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          phone: string | null;
          updated_at: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          phone?: string | null;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          phone?: string | null;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guardians_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["workspace_id"];
          },
        ];
      };
      lesson_notes: {
        Row: {
          created_at: string;
          difficulties: string;
          id: number;
          lesson_id: string;
          next_steps: string;
          supersedes_id: number | null;
          worked_on: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          difficulties?: string;
          id?: never;
          lesson_id: string;
          next_steps?: string;
          supersedes_id?: number | null;
          worked_on: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          difficulties?: string;
          id?: never;
          lesson_id?: string;
          next_steps?: string;
          supersedes_id?: number | null;
          worked_on?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_notes_workspace_id_lesson_id_fkey";
            columns: ["workspace_id", "lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "lesson_notes_workspace_id_lesson_id_supersedes_id_fkey";
            columns: ["workspace_id", "lesson_id", "supersedes_id"];
            isOneToOne: true;
            referencedRelation: "lesson_notes";
            referencedColumns: ["workspace_id", "lesson_id", "id"];
          },
        ];
      };
      lesson_plans: {
        Row: {
          activities: string;
          content: string;
          created_at: string;
          lesson_id: string;
          materials: string;
          objective: string;
          updated_at: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          activities?: string;
          content?: string;
          created_at?: string;
          lesson_id: string;
          materials?: string;
          objective: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          activities?: string;
          content?: string;
          created_at?: string;
          lesson_id?: string;
          materials?: string;
          objective?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_plans_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["workspace_id"];
          },
          {
            foreignKeyName: "lesson_plans_workspace_id_lesson_id_fkey";
            columns: ["workspace_id", "lesson_id"];
            isOneToOne: true;
            referencedRelation: "lessons";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      lessons: {
        Row: {
          created_at: string;
          duration_minutes: number;
          id: string;
          meeting_url: string | null;
          modality: Database["public"]["Enums"]["lesson_modality"];
          pending_reason: Database["public"]["Enums"]["lesson_status"] | null;
          recurrence_id: string | null;
          rescheduled_from_id: string | null;
          starts_at: string;
          status: Database["public"]["Enums"]["lesson_status"];
          student_id: string;
          subject_id: string;
          updated_at: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          duration_minutes: number;
          id?: string;
          meeting_url?: string | null;
          modality: Database["public"]["Enums"]["lesson_modality"];
          pending_reason?: Database["public"]["Enums"]["lesson_status"] | null;
          recurrence_id?: string | null;
          rescheduled_from_id?: string | null;
          starts_at: string;
          status?: Database["public"]["Enums"]["lesson_status"];
          student_id: string;
          subject_id: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          meeting_url?: string | null;
          modality?: Database["public"]["Enums"]["lesson_modality"];
          pending_reason?: Database["public"]["Enums"]["lesson_status"] | null;
          recurrence_id?: string | null;
          rescheduled_from_id?: string | null;
          starts_at?: string;
          status?: Database["public"]["Enums"]["lesson_status"];
          student_id?: string;
          subject_id?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lessons_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["workspace_id"];
          },
          {
            foreignKeyName: "lessons_workspace_id_student_id_fkey";
            columns: ["workspace_id", "student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "lessons_workspace_id_student_id_recurrence_id_fkey";
            columns: ["workspace_id", "student_id", "recurrence_id"];
            isOneToOne: false;
            referencedRelation: "recurrences";
            referencedColumns: ["workspace_id", "student_id", "id"];
          },
          {
            foreignKeyName: "lessons_workspace_id_student_id_rescheduled_from_id_fkey";
            columns: ["workspace_id", "student_id", "rescheduled_from_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["workspace_id", "student_id", "id"];
          },
          {
            foreignKeyName: "lessons_workspace_id_subject_id_fkey";
            columns: ["workspace_id", "subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      memberships: {
        Row: {
          role: Database["public"]["Enums"]["workspace_role"];
          user_id: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          role: Database["public"]["Enums"]["workspace_role"];
          user_id: string;
          workspace_id: string;
        };
        Update: {
          role?: Database["public"]["Enums"]["workspace_role"];
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["workspace_id"];
          },
        ];
      };
      payments: {
        Row: {
          amount_cents: number;
          id: string;
          method: Database["public"]["Enums"]["payment_method"];
          note: string;
          paid_on: string;
          reversed_at: string | null;
          student_id: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount_cents: number;
          id?: string;
          method: Database["public"]["Enums"]["payment_method"];
          note?: string;
          paid_on: string;
          reversed_at?: string | null;
          student_id: string;
          workspace_id: string;
        };
        Update: {
          amount_cents?: number;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          note?: string;
          paid_on?: string;
          reversed_at?: string | null;
          student_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_workspace_id_student_id_fkey";
            columns: ["workspace_id", "student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      recurrences: {
        Row: {
          created_at: string;
          day_of_week: number;
          duration_minutes: number;
          end_date: string | null;
          ended_at: string | null;
          id: string;
          meeting_url: string | null;
          modality: Database["public"]["Enums"]["lesson_modality"];
          start_date: string;
          start_time: string;
          student_id: string;
          subject_id: string;
          updated_at: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          day_of_week: number;
          duration_minutes: number;
          end_date?: string | null;
          ended_at?: string | null;
          id?: string;
          meeting_url?: string | null;
          modality: Database["public"]["Enums"]["lesson_modality"];
          start_date: string;
          start_time: string;
          student_id: string;
          subject_id: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          day_of_week?: number;
          duration_minutes?: number;
          end_date?: string | null;
          ended_at?: string | null;
          id?: string;
          meeting_url?: string | null;
          modality?: Database["public"]["Enums"]["lesson_modality"];
          start_date?: string;
          start_time?: string;
          student_id?: string;
          subject_id?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recurrences_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["workspace_id"];
          },
          {
            foreignKeyName: "recurrences_workspace_id_student_id_fkey";
            columns: ["workspace_id", "student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "recurrences_workspace_id_subject_id_fkey";
            columns: ["workspace_id", "subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      student_guardians: {
        Row: {
          created_at: string;
          guardian_id: string;
          is_financial_guardian: boolean;
          relationship: string;
          student_id: string;
          updated_at: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          guardian_id: string;
          is_financial_guardian?: boolean;
          relationship: string;
          student_id: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          guardian_id?: string;
          is_financial_guardian?: boolean;
          relationship?: string;
          student_id?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_guardians_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["workspace_id"];
          },
          {
            foreignKeyName: "student_guardians_workspace_id_guardian_id_fkey";
            columns: ["workspace_id", "guardian_id"];
            isOneToOne: false;
            referencedRelation: "guardians";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "student_guardians_workspace_id_student_id_fkey";
            columns: ["workspace_id", "student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      student_rate_history: {
        Row: {
          changed_on: string;
          previous_hourly_rate: number;
          student_id: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          changed_on: string;
          previous_hourly_rate: number;
          student_id: string;
          workspace_id: string;
        };
        Update: {
          changed_on?: string;
          previous_hourly_rate?: number;
          student_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_rate_history_workspace_id_student_id_fkey";
            columns: ["workspace_id", "student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      student_subjects: {
        Row: {
          created_at: string;
          student_id: string;
          subject_id: string;
          updated_at: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          student_id: string;
          subject_id: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          student_id?: string;
          subject_id?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_subjects_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["workspace_id"];
          },
          {
            foreignKeyName: "student_subjects_workspace_id_student_id_fkey";
            columns: ["workspace_id", "student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "student_subjects_workspace_id_subject_id_fkey";
            columns: ["workspace_id", "subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      students: {
        Row: {
          archived_at: string | null;
          birth_date: string | null;
          created_at: string;
          grade_id: string | null;
          hourly_rate: number;
          id: string;
          is_free: boolean;
          name: string;
          notes: string | null;
          school: string | null;
          updated_at: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          birth_date?: string | null;
          created_at?: string;
          grade_id?: string | null;
          hourly_rate: number;
          id?: string;
          is_free?: boolean;
          name: string;
          notes?: string | null;
          school?: string | null;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          archived_at?: string | null;
          birth_date?: string | null;
          created_at?: string;
          grade_id?: string | null;
          hourly_rate?: number;
          id?: string;
          is_free?: boolean;
          name?: string;
          notes?: string | null;
          school?: string | null;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "students_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["workspace_id"];
          },
          {
            foreignKeyName: "students_workspace_id_grade_id_fkey";
            columns: ["workspace_id", "grade_id"];
            isOneToOne: false;
            referencedRelation: "grades";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      subjects: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subjects_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["workspace_id"];
          },
        ];
      };
      workspaces: {
        Row: {
          brand: string;
          name: string;
          settings: NonNullable<Json>;
          time_zone: string;
          updated_at: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          brand?: string;
          name?: string;
          settings?: NonNullable<Json>;
          time_zone?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Update: {
          brand?: string;
          name?: string;
          settings?: NonNullable<Json>;
          time_zone?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      student_timeline: {
        Row: {
          event_type: string | null;
          lesson_id: string | null;
          occurred_at: string | null;
          status: Database["public"]["Enums"]["lesson_status"] | null;
          student_id: string | null;
          subject_name: string | null;
          summary: string | null;
          workspace_id: string | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
    };
    Functions: {
      can_delete_lesson: {
        Args: { target_lesson_id: string; target_workspace_id: string };
        Returns: boolean;
      };
      create_lesson_days: {
        Args: {
          allow_conflicts?: boolean;
          lesson_days: Json;
          lesson_student_id: string;
          target_workspace_id: string;
        };
        Returns: boolean;
      };
      create_weekly_lesson: {
        Args: {
          first_date: string;
          first_time: string;
          last_date?: string;
          lesson_duration_minutes: number;
          lesson_meeting_url?: string;
          lesson_modality: Database["public"]["Enums"]["lesson_modality"];
          lesson_student_id: string;
          lesson_subject_id: string;
          target_workspace_id: string;
        };
        Returns: boolean;
      };
      delete_lesson: {
        Args: { target_lesson_id: string; target_workspace_id: string };
        Returns: string;
      };
      generate_recurrence: {
        Args: {
          r: Omit<
            Database["public"]["Tables"]["recurrences"]["Row"],
            Database["public"]["Tables"]["recurrences"]["ComputedFields"]
          >;
          weeks: number;
        };
        Returns: undefined;
      };
      generate_recurring_lessons: {
        Args: { weeks?: number };
        Returns: undefined;
      };
      has_lesson_conflict: {
        Args: {
          excluded_lesson_id?: string;
          lesson_duration_minutes: number;
          lesson_starts_at: string;
          target_workspace_id: string;
        };
        Returns: boolean;
      };
      has_role: {
        Args: {
          required_role: Database["public"]["Enums"]["workspace_role"];
          ws: string;
        };
        Returns: boolean;
      };
      is_workspace_member: { Args: { ws: string }; Returns: boolean };
      link_existing_student_guardian: {
        Args: {
          financial_guardian: boolean;
          guardian_relationship: string;
          target_guardian_id: string;
          target_student_id: string;
          target_workspace_id: string;
        };
        Returns: boolean;
      };
      record_payment: {
        Args: {
          lesson_ids: string[];
          payment_date: string;
          payment_method: Database["public"]["Enums"]["payment_method"];
          payment_note: string;
          target_student_id: string;
          target_workspace_id: string;
        };
        Returns: string;
      };
      remove_student_guardian: {
        Args: {
          target_guardian_id: string;
          target_student_id: string;
          target_workspace_id: string;
        };
        Returns: boolean;
      };
      reverse_payment: {
        Args: { target_payment_id: string; target_workspace_id: string };
        Returns: boolean;
      };
      save_lesson: {
        Args: {
          lesson_duration_minutes: number;
          lesson_meeting_url?: string;
          lesson_modality: Database["public"]["Enums"]["lesson_modality"];
          lesson_starts_at: string;
          lesson_status: Database["public"]["Enums"]["lesson_status"];
          lesson_student_id: string;
          lesson_subject_id: string;
          target_lesson_id?: string;
          target_workspace_id: string;
        };
        Returns: boolean;
      };
      save_lesson_note: {
        Args: {
          note_difficulties: string;
          note_next_steps: string;
          note_worked_on: string;
          previous_note_id?: number;
          target_lesson_id: string;
          target_workspace_id: string;
        };
        Returns: boolean;
      };
      save_student: {
        Args: {
          existing_guardian_id?: string;
          financial_guardian?: boolean;
          guardian_name?: string;
          guardian_phone?: string;
          guardian_relationship?: string;
          selected_subject_ids: string[];
          student_birth_date?: string;
          student_grade_id?: string;
          student_hourly_rate: number;
          student_is_free: boolean;
          student_name: string;
          student_notes?: string;
          student_school?: string;
          target_student_id?: string;
          target_workspace_id: string;
        };
        Returns: boolean;
      };
      save_student_guardian: {
        Args: {
          financial_guardian: boolean;
          guardian_name: string;
          guardian_phone?: string;
          guardian_relationship: string;
          target_guardian_id?: string;
          target_student_id: string;
          target_workspace_id: string;
        };
        Returns: boolean;
      };
      schedule_makeup: {
        Args: {
          new_start: string;
          original_id: string;
          target_workspace_id: string;
        };
        Returns: boolean;
      };
      weekly_lesson_slots: {
        Args: {
          first_date: string;
          from_date: string;
          last_date: string;
          slot_time: string;
          through_date: string;
          weekday: number;
          zone: string;
        };
        Returns: string[];
      };
    };
    Enums: {
      lesson_modality: "presencial" | "online";
      lesson_status:
        | "agendada"
        | "confirmada"
        | "realizada"
        | "cancelada"
        | "falta"
        | "reposicao_pendente";
      payment_method: "pix" | "cash" | "transfer" | "other";
      workspace_role: "teacher" | "student" | "guardian";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      lesson_modality: ["presencial", "online"],
      lesson_status: [
        "agendada",
        "confirmada",
        "realizada",
        "cancelada",
        "falta",
        "reposicao_pendente",
      ],
      payment_method: ["pix", "cash", "transfer", "other"],
      workspace_role: ["teacher", "student", "guardian"],
    },
  },
} as const;

// Bu dosya normalde `supabase gen types typescript` komutuyla otomatik
// üretilir. Elle yazılmış özet bir sürümdür — şema değiştikçe regenerate edin:
//   npx supabase gen types typescript --project-id <PROJECT_ID> > lib/database.types.ts

export type UserRole = "admin" | "coach" | "student" | "parent";
export type HomeworkStatus = "pending" | "submitted" | "reviewed" | "late";
export type MeetingStatus = "scheduled" | "completed" | "cancelled" | "no_show";
export type PlanItemStatus = "todo" | "in_progress" | "done" | "skipped";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  coach_id: string | null;
  target_field: "sayisal" | "esit_agirlik" | "sozel" | "dil" | null;
  target_score: number | null;
  target_universities: string[] | null;
  grade: string | null;
  school_name: string | null;
  net_history: { date: string; tyt_net: number; ayt_net: number; exam_name: string }[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Plan {
  id: string;
  student_id: string;
  coach_id: string | null;
  week_start: string;
  title: string;
  created_at: string;
  updated_at: string;
  plan_items?: PlanItem[];
}

export interface PlanItem {
  id: string;
  plan_id: string;
  subject: string;
  topic: string;
  exam_type: "TYT" | "AYT";
  target_question_count: number;
  status: PlanItemStatus;
  day_of_week: number | null;
  created_at: string;
}

export interface Homework {
  id: string;
  student_id: string;
  coach_id: string | null;
  plan_item_id: string | null;
  title: string;
  description: string | null;
  subject: string;
  due_date: string;
  status: HomeworkStatus;
  submitted_at: string | null;
  submission_note: string | null;
  coach_feedback: string | null;
  score: number | null;
  created_at: string;
  updated_at: string;
  student?: Student & { profile: Profile };
}

export interface Meeting {
  id: string;
  student_id: string;
  coach_id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  zoom_join_url: string | null;
  zoom_start_url: string | null;
  zoom_meeting_id: string | null;
  status: MeetingStatus;
  agenda: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
  student?: Student & { profile: Profile };
  coach?: Profile;
}

export interface CoachingNote {
  id: string;
  student_id: string;
  coach_id: string;
  meeting_id: string | null;
  category: "genel" | "motivasyon" | "akademik" | "davranis" | "aile";
  content: string;
  visible_to_student: boolean;
  created_at: string;
  updated_at: string;
  coach?: Profile;
}

export interface AiConversation {
  id: string;
  student_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

// Supabase generic Database tipi (kısaltılmış — gerçek projede CLI çıktısını kullanın)
export interface Database {
  public: {
    Tables: Record<string, {
      Row: Record<string, unknown>;
      Insert: Record<string, unknown>;
      Update: Record<string, unknown>;
    }>;
    Views: Record<string, { Row: Record<string, unknown> }>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
}

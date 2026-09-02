export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "coach" | "student";
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  coach_id: string;
  target_score: number;
  current_score: number;
  grade: number;
  notes: string;
  created_at: string;
  profiles?: Profile;
}

export interface Coach {
  id: string;
  name: string;
  email: string;
  specialty: string;
  phone: string;
  bio: string;
  status: "Aktif" | "Pasif";
  students_count: number;
  rating: number;
  experience: string;
  created_at: string;
}

export interface Plan {
  id: string;
  student_id: string;
  coach_id: string;
  week_start: string;
  title: string;
  description: string;
  subjects: SubjectPlan[];
  status: "active" | "completed" | "cancelled";
  created_at: string;
  student?: Student;
}

export interface SubjectPlan {
  subject: string;
  topics: string[];
  days: number[];
  duration_min: number;
}

export interface Homework {
  id: string;
  student_id: string;
  coach_id: string;
  title: string;
  description: string;
  subject: string;
  due_date: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  priority: "low" | "medium" | "high";
  score?: number;
  feedback?: string;
  created_at: string;
  student?: Student;
}

export interface Meeting {
  id: string;
  student_id: string;
  coach_id: string;
  title: string;
  description: string;
  meeting_date: string;
  duration_min: number;
  zoom_link?: string;
  status: "scheduled" | "completed" | "cancelled";
  notes: string;
  created_at: string;
  student?: Student;
}

export interface CoachingNote {
  id: string;
  student_id: string;
  coach_id: string;
  category: "academic" | "behavioral" | "motivational" | "general";
  title: string;
  content: string;
  rating: number;
  created_at: string;
  student?: Student;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  is_popular: boolean;
  created_at: string;
}

export interface ExamResult {
  id: string;
  student_id: string;
  coach_id: string;
  exam_date: string;
  exam_name: string;
  correct: number;
  incorrect: number;
  blank: number;
  total_score?: number;
  created_at: string;
}

export interface StudyLog {
  id: string;
  student_id: string;
  coach_id: string;
  log_date: string;
  subject: string;
  duration_min: number;
  notes: string;
  created_at: string;
}

export interface AiChat {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface DashboardStats {
  totalStudents: number;
  activePlans: number;
  pendingHomework: number;
  weeklyMeetings: number;
}

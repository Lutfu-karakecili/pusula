import { supabase } from './supabase.js';
import './sentry.js';

/* ================================================
   COACHES
   ================================================ */

export async function getCoaches() {
  const { data, error } = await supabase
    .from('coaches')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getCoachById(id) {
  const { data, error } = await supabase
    .from('coaches')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getCoachByEmail(email) {
  const { data, error } = await supabase
    .from('coaches')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCoachesBySpecialty(specialty) {
  const { data, error } = await supabase
    .from('coaches')
    .select('*')
    .ilike('specialty', `%${specialty}%`)
    .order('rating', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function insertCoach(coach) {
  const { data, error } = await supabase
    .from('coaches')
    .insert(coach)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCoach(id, updates) {
  const { data, error } = await supabase
    .from('coaches')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCoach(id) {
  const { error } = await supabase
    .from('coaches')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/* ================================================
   PACKAGES
   ================================================ */

export async function getPackages() {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .order('price', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getPackageById(id) {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function insertPackage(pkg) {
  const { data, error } = await supabase
    .from('packages')
    .insert(pkg)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePackage(id, updates) {
  const { data, error } = await supabase
    .from('packages')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePackage(id) {
  const { error } = await supabase
    .from('packages')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/* ================================================
   STUDENTS (profiles with role=student)
   ================================================ */

export async function getStudents() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getStudentById(id) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateStudent(id, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteStudentAccount(id) {
  const { error } = await supabase.rpc('admin_delete_user', { target_id: id });
  if (error) throw error;
}

/* ================================================
   STUDENT-COACH ASSIGNMENTS
   ================================================ */

export async function getStudentCoaches() {
  const { data, error } = await supabase
    .from('student_coaches')
    .select('*, coaches(*), profiles!student_id(full_name, email, phone, grade)');
  if (error) throw error;
  return data || [];
}

export async function getStudentCoachByStudentId(studentId) {
  const { data, error } = await supabase
    .from('student_coaches')
    .select('*, coaches(*)')
    .eq('student_id', studentId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function assignStudentToCoach(studentId, coachId) {
  const { data, error } = await supabase
    .from('student_coaches')
    .upsert({ student_id: studentId, coach_id: coachId }, { onConflict: 'student_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeStudentCoach(studentId) {
  const { error } = await supabase
    .from('student_coaches')
    .delete()
    .eq('student_id', studentId);
  if (error) throw error;
}

export async function getCoachStudents() {
  const { data, error } = await supabase
    .from('student_coaches')
    .select('*, profiles!student_id(id, full_name, email, phone, grade, created_at), coaches(*)');
  if (error) throw error;
  return data || [];
}

/* ================================================
   STUDENT-PACKAGES
   ================================================ */

export async function getStudentPackages() {
  const { data, error } = await supabase
    .from('student_packages')
    .select('*, packages(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getStudentPackageByStudentId(studentId) {
  const { data, error } = await supabase
    .from('student_packages')
    .select('*, packages(*)')
    .eq('student_id', studentId)
    .eq('status', 'Aktif')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function assignPackageToStudent(studentId, packageId) {
  const { data, error } = await supabase
    .from('student_packages')
    .insert({ student_id: studentId, package_id: packageId, start_date: new Date().toISOString().split('T')[0] })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateStudentPackage(id, updates) {
  const { data, error } = await supabase
    .from('student_packages')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ================================================
   MESSAGES
   ================================================ */

export async function getMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getMessagesForStudent(studentId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`target_student_id.eq.${studentId},sender_id.eq.${studentId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function sendMessage(msg) {
  const { data, error } = await supabase
    .from('messages')
    .insert(msg)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markMessageRead(id) {
  const { data, error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMessage(id) {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/* ================================================
   PROFILE
   ================================================ */

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ================================================
   CONTACT FORM (iletisim.html)
   ================================================ */

export async function sendContactMessage({ name, email, phone, subject, message }) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_name: name,
      sender_email: email,
      sender_phone: phone,
      subject: subject,
      body: message
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

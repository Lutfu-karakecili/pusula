import { supabase } from './supabase.js';
import './sentry.js';

/**
 * Yeni kullanıcı kaydı.
 * full_name, phone, grade → profiles tablosuna otomatik yazılır
 * (Faz 1'de kurduğumuz "handle_new_user" trigger'ı sayesinde).
 */
export async function registerUser({ fullName, email, phone, password, grade }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        grade
      }
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Giriş yapma.
 */
export async function loginUser({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

/**
 * Çıkış yapma.
 */
export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Şu an giriş yapmış kullanıcının oturumunu getirir.
 * Sayfa yüklendiğinde "giriş yapılmış mı?" kontrolü için kullanılır.
 */
export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Giriş yapmış kullanıcının profil bilgilerini (isim, telefon, sınıf, rol) getirir.
 */
export async function getCurrentProfile() {
  const session = await getCurrentSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Şifre sıfırlama maili gönderir.
 * redirectTo: kullanıcının maildeki linke tıkladığında düşeceği sayfa.
 */
export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/pages/yeni-sifre.html`
  });
  if (error) throw error;
}

/**
 * Şifre sıfırlama akışında, kullanıcı e-postadaki linke tıklayıp
 * pages/yeni-sifre.html sayfasına düştüğünde yeni şifresini günceller.
 * Supabase recovery oturumunu (URL'deki token) otomatik algılar.
 */
export async function updateUserPassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/**
 * Giriş zorunlu sayfalarda (kullanici-paneli.html gibi) en üstte çağırın.
 * Giriş yapılmamışsa otomatik olarak giris.html'e yönlendirir.
 */
export async function requireAuth() {
  const session = await getCurrentSession();
  if (!session) {
    window.location.replace('giris.html');
    return null;
  }
  return session;
}

/**
 * Admin sayfalarında (admin-dashboard.html) en üstte çağırın.
 * Giriş yapılmamışsa veya rol admin değilse admin.html'e yönlendirir.
 */
export async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    window.location.replace('admin.html');
    return null;
  }
  return profile;
}

/**
 * server-verify.js — Sunucu tarafı (Edge Function) doğrulama köprüsü.
 *
 * Güvenlik: Turnstile secret key ve Supabase service_role key SADECE Edge
 * Function içinde tutulur; bu modül yalnızca supabase.functions.invoke()
 * üzerinden çağrı yapar. İletişim formu entegrasyonu (AJAN-A) bu fonksiyonları
 * kullanır; burada hiçbir gizli anahtar bulunmaz.
 *
 * Sözleşme (birebir):
 *   verifyTurnstile(token)  -> Promise<boolean>   ('verify-turnstile' invoke)
 *   submitContact(payload)  -> Promise<any>       ('contact-guard' invoke)
 */

import { supabase } from './supabase.js';

export async function verifyTurnstile(token) { const { data, error } = await supabase.functions.invoke('verify-turnstile', { body: { token } }); if (error) return false; return !!(data && data.ok); }
export async function submitContact(payload) { const { data, error } = await supabase.functions.invoke('contact-guard', { body: payload }); if (error) throw error; return data; }

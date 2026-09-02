"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

export default function IletisimPage() {
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", subject: "", message: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();

    const { error: insertError } = await supabase.from("messages").insert({
      sender_name: formData.name,
      sender_email: formData.email,
      sender_phone: formData.phone,
      subject: formData.subject,
      body: formData.message,
      sender_id: user?.id || null,
    });

    if (insertError) {
      setError("Mesajınız gönderilemedi. Lütfen tekrar deneyin.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      {/* Header */}
      <header className="pt-24 pb-12 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/landing" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
            Ana Sayfaya Dön
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: "var(--lp-font-heading)" }}>İletişim</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">Sorularınız için bize ulaşın. En kısa sürede yanıtlayacağız.</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 pb-20">
        {success ? (
          <div className="bg-gradient-to-br from-indigo-950/80 via-purple-900/60 to-indigo-950/80 border border-indigo-500/20 rounded-xl p-12 text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-emerald-400" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Mesajınız Gönderildi!</h2>
            <p className="text-slate-400 mb-8">En kısa sürede size geri dönüş yapacağız.</p>
            <Link href="/landing" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all">
              Ana Sayfaya Dön
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-gradient-to-br from-indigo-950/80 via-purple-900/60 to-indigo-950/80 border border-indigo-500/20 rounded-xl p-8">
              <h2 className="text-xl font-bold text-white mb-6">Bize Yazın</h2>
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">{error}</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Adınız</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="Adınız Soyadınız" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">E-posta</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="ornek@email.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Telefon</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="05XX XXX XX XX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Konu</label>
                  <input type="text" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="Mesajınızın konusu" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Mesajınız</label>
                  <textarea required rows={5} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-y"
                    placeholder="Mesajınızı yazın..." />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold transition-all disabled:opacity-50">
                  {loading ? "Gönderiliyor..." : "Mesaj Gönder"}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-indigo-950/80 via-purple-900/60 to-indigo-950/80 border border-indigo-500/20 rounded-xl p-8">
                <h3 className="text-lg font-bold text-white mb-6">İletişim Bilgileri</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                    </div>
                    <div><p className="text-slate-500 text-sm">Telefon</p><a href="tel:+905001234567" className="text-white hover:text-purple-400 transition-colors">+90 500 123 45 67</a></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                    </div>
                    <div><p className="text-slate-500 text-sm">E-posta</p><a href="mailto:info@pusula.com" className="text-white hover:text-purple-400 transition-colors">info@pusula.com</a></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </div>
                    <div><p className="text-slate-500 text-sm">WhatsApp</p><a href="https://wa.me/905001234567" target="_blank" rel="noopener" className="text-white hover:text-emerald-400 transition-colors">WhatsApp ile İletişim</a></div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-950/80 via-purple-900/60 to-indigo-950/80 border border-indigo-500/20 rounded-xl p-8">
                <h3 className="text-lg font-bold text-white mb-4">Çalışma Saatleri</h3>
                <div className="space-y-2 text-slate-400">
                  <div className="flex justify-between"><span>Pazartesi - Cuma</span><span className="text-white">09:00 - 18:00</span></div>
                  <div className="flex justify-between"><span>Cumartesi</span><span className="text-white">10:00 - 14:00</span></div>
                  <div className="flex justify-between"><span>Pazar</span><span className="text-slate-500">Kapalı</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

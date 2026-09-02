"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const FAQ_ITEMS = [
  { q: "Pusula koçluk sistemi nasıl çalışıyor?", a: "Öncelikle seviyenizi belirleyen bir değerlendirme yapılır. Ardından uzman koçunuz size özel haftalık çalışma programı hazırlar. Düzenli koçluk görüşmeleri, deneme analizleri ve 7/24 WhatsApp desteği ile süreç takip edilir." },
  { q: "Koçumu kendim seçebilir miyim?", a: "Evet, koçlarımızın profil sayfalarından uzmanlık alanlarını, deneyimlerini ve öğrenci yorumlarını inceleyerek size en uygun koçu seçebilirsiniz." },
  { q: "Maarif Modeli'ne uyumlu çalışma nedir?", a: "Türkiye Yüzyılı Maarif Modeli, ezber yerine beceri odaklı, bütüncül ve gerçek dünya bağlantılı bir eğitim anlayışını benimser. Koçluk sistemimiz bu modele uygun olarak kişilerin anlama ve uygulama becerilerini geliştirmeyi hedefler." },
  { q: "PDR desteği almak zorunlu mu?", a: "Hayır, zorunlu değildir ancak sınav kaygısı, motivasyon kaybı veya zaman yönetimi gibi konularda desteğe ihtiyacınız varsa PDR uzmanlarımızdan faydalanmanızı şiddetle tavsiye ederiz." },
  { q: "Fiyatlandırma nasıl yapılıyor?", a: "Fiyatlandırma seçeceğiniz koçluk paketine göre değişiklik gösterir. Detaylı bilgi için iletişim sayfamızdan bize ulaşabilirsiniz." },
];

const COACHES = [
  { name: "Emre Demir", specialty: "TYT Matematik", students: 500, rating: 4.9 },
  { name: "Selin Çelik", specialty: "AYT Fen Bilimleri", students: 350, rating: 4.8 },
  { name: "Ahmet Korkmaz", specialty: "TYT Türkçe", students: 420, rating: 4.9 },
  { name: "Zeynep Arslan", specialty: "AYT Matematik", students: 280, rating: 4.7 },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-md border-b transition-all ${scrolled ? "shadow-md" : ""}`}>
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex items-center justify-between h-16">
            <Link href="/landing" className="flex items-center gap-2">
              <div className="h-10 w-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
              <span className="text-xl font-bold text-indigo-900">Pusula</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#hakkimizda" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Hakkımızda</a>
              <a href="#hizmetler" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Hizmetlerimiz</a>
              <a href="#koclar" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Koçlarımız</a>
              <a href="#sss" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">SSS</a>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login"><Button variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50">Giriş Yap</Button></Link>
              <Link href="/login"><Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500">Kayıt Ol</Button></Link>
            </div>
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white md:hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <span className="text-lg font-bold text-indigo-900">Pusula</span>
            <button onClick={() => setMobileMenuOpen(false)}>
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="flex flex-col p-6 gap-4">
            <a href="#hakkimizda" className="text-lg font-medium py-2 border-b" onClick={() => setMobileMenuOpen(false)}>Hakkımızda</a>
            <a href="#hizmetler" className="text-lg font-medium py-2 border-b" onClick={() => setMobileMenuOpen(false)}>Hizmetlerimiz</a>
            <a href="#koclar" className="text-lg font-medium py-2 border-b" onClick={() => setMobileMenuOpen(false)}>Koçlarımız</a>
            <a href="#sss" className="text-lg font-medium py-2 border-b" onClick={() => setMobileMenuOpen(false)}>SSS</a>
            <Link href="/login" className="mt-4"><Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600">Giriş Yap</Button></Link>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-6 backdrop-blur-sm border border-white/20">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                Maarif Modeli Uyumlu
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                YKS&apos;de <span className="text-purple-400">Pusulanı</span> Doğru Kullan, <span className="text-purple-400">Hedefine</span> Ulaş
              </h1>
              <p className="text-lg text-gray-300 mb-8 max-w-lg">
                Türkiye Yüzyılı Maarif Modeli&apos;ne uyumlu, kişiye özel koçluk sistemiyle TYT ve AYT&apos;de başarını artır.
              </p>
              <div className="flex flex-wrap gap-4 mb-12">
                <Link href="/login"><Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500">Hemen Başla</Button></Link>
                <a href="#hizmetler"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Hizmetleri İncele</Button></a>
              </div>
              <div className="flex gap-12">
                <div><div className="text-3xl font-bold text-purple-400">5000+</div><div className="text-sm text-gray-400">Öğrenci</div></div>
                <div><div className="text-3xl font-bold text-purple-400">150+</div><div className="text-sm text-gray-400">Uzman Koç</div></div>
                <div><div className="text-3xl font-bold text-purple-400">%95</div><div className="text-sm text-gray-400">Memnuniyet</div></div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-white rounded-2xl p-6 shadow-2xl transform rotate-2">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">AY</div>
                  <div><div className="font-semibold text-gray-800">Öğrenci Paneli</div><div className="text-sm text-gray-500">Gelişim takibi</div></div>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">TYT Hazırlık</span><span className="text-purple-600 font-semibold">%75</span></div>
                  <div className="h-3 bg-gray-200 rounded-full"><div className="h-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full" style={{width:"75%"}} /></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-full">Matematik</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Fen Bilimleri</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Türkçe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hakkımızda */}
      <section id="hakkimizda" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Pusula Nedir?</h2>
          <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">YKS öğrencileri için tasarlanmış, Maarif Modeli uyumlu profesyonel koçluk platformu.</p>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: "✓", title: "Kişiye Özel Program", desc: "Seviyenize ve hızınıza uygun çalışma programları." },
              { icon: "👥", title: "Uzman Koç Desteği", desc: "Derece yapmış koçlarımızla birebir görüşmeler." },
              { icon: "📊", title: "Detaylı Analiz", desc: "Deneme sonuçlarınızı analiz edin, stratejinizi belirleyin." },
              { icon: "🎯", title: "Maarif Modeli Uyumlu", desc: "Yeni nesil eğitim anlayışına uygun koçluk." },
            ].map((f, i) => (
              <div key={i} className="flex gap-4 p-6 rounded-xl border hover:shadow-lg transition-all">
                <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-xl flex-shrink-0">{f.icon}</div>
                <div><h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3><p className="text-gray-500 text-sm">{f.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hizmetler */}
      <section id="hizmetler" className="py-20 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Hizmetlerimiz</h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">YKS hazırlığınız için ihtiyacınız olan her şey tek bir platformda.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "TYT Koçluk", desc: "Temel Yeterlilik Testi&apos;ne hazırlık için kapsamlı destek.", items: ["Kişiselleştirilmiş program", "Haftalık koçluk", "Deneme analizi", "7/24 WhatsApp"] },
              { title: "AYT Koçluk", desc: "Alan Yeterlilik Testi&apos;nde hedefinize ulaşmak için uzman desteği.", items: ["Alan derslerine odaklı", "Soru çözüm stratejileri", "Zaman yönetimi", "Motivasyon desteği"] },
              { title: "PDR Desteği", desc: "Psikolojik danışmanlık ile sınav sürecini sağlıklı yönetin.", items: ["Sınav kaygısı yönetimi", "Motivasyon artırma", "Zaman yönetimi", "Hedef belirleme"] },
            ].map((s, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
                <div className="h-14 w-14 rounded-lg bg-purple-600 flex items-center justify-center text-white text-xl mb-4">📚</div>
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{s.desc}</p>
                <ul className="space-y-2 mb-6">
                  {s.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-300">
                      <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/login"><Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10">Detaylı Bilgi</Button></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Koçlar */}
      <section id="koclar" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Koçlarımız</h2>
          <p className="text-center text-gray-500 mb-12">Alanında uzman, derece yapmış koçlarımızla tanışın.</p>
          <div className="grid md:grid-cols-4 gap-6">
            {COACHES.map((c, i) => (
              <div key={i} className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all">
                <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <svg className="h-20 w-20 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900">{c.name}</h3>
                  <p className="text-purple-600 text-sm mb-3">{c.specialty}</p>
                  <div className="flex justify-between text-sm border-t pt-3">
                    <div className="text-center"><div className="font-bold text-indigo-600">{c.students}+</div><div className="text-gray-500 text-xs">Öğrenci</div></div>
                    <div className="text-center"><div className="font-bold text-indigo-600">{c.rating}</div><div className="text-gray-500 text-xs">Puan</div></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SSS */}
      <section id="sss" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Sıkça Sorulan Sorular</h2>
          <p className="text-center text-gray-500 mb-12">Merak ettiğiniz tüm soruların yanıtları burada.</p>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className={`bg-white rounded-xl border overflow-hidden transition-all ${openFaq === i ? "shadow-md" : ""}`}>
                <button className="w-full flex items-center justify-between p-5 text-left" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="font-semibold text-gray-900">{item.q}</span>
                  <svg className={`w-5 h-5 text-gray-500 transition-transform ${openFaq === i ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
                </button>
                {openFaq === i && <div className="px-5 pb-5 text-gray-500 text-sm leading-relaxed">{item.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">Hedefine Giden Yolda İlk Adımı At</h2>
          <p className="text-lg opacity-90 mb-8">Ücretsiz ön görüşme ile koçluk sistemimizi tanıyın, hemen başlayın.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/login"><Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">Ücretsiz Görüşme Talep Et</Button></Link>
            <a href="mailto:info@pusula.com"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Bize Ulaşın</Button></a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <span className="text-white font-bold">Pusula</span>
              </div>
              <p className="text-sm">YKS öğrencileri için profesyonel koçluk platformu.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Hizmetler</h4>
              <ul className="space-y-2 text-sm"><li>TYT Koçluk</li><li>AYT Koçluk</li><li>PDR Desteği</li></ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Kurumsal</h4>
              <ul className="space-y-2 text-sm"><li>Hakkımızda</li><li>Koçlarımız</li><li>SSS</li></ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">İletişim</h4>
              <ul className="space-y-2 text-sm"><li>+90 500 123 45 67</li><li>info@pusula.com</li></ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Pusula Eğitim Platformu. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

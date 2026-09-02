"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

const COACHES = [
  { name: "Emre Demir", specialty: "TYT Matematik", students: 500, rating: 4.9 },
  { name: "Selin Çelik", specialty: "AYT Fen Bilimleri", students: 350, rating: 4.8 },
  { name: "Ahmet Korkmaz", specialty: "TYT Türkçe", students: 420, rating: 4.9 },
  { name: "Zeynep Arslan", specialty: "AYT Matematik", students: 280, rating: 4.7 },
  { name: "Merve Yıldız", specialty: "PDR Uzmanı", students: 600, rating: 5.0 },
  { name: "Burak Özkan", specialty: "TYT Sosyal Bilimler", students: 310, rating: 4.8 },
];

const FAQ_ITEMS = [
  { q: "Pusula koçluk sistemi nasıl çalışıyor?", a: "Öncelikle seviyenizi belirleyen bir değerlendirme yapılır. Ardından uzman koçunuz size özel haftalık çalışma programı hazırlar. Düzenli koçluk görüşmeleri, deneme analizleri ve 7/24 WhatsApp desteği ile süreç takip edilir." },
  { q: "Koçumu kendim seçebilir miyim?", a: "Evet, koçlarımızın profil sayfalarından uzmanlık alanlarını, deneyimlerini ve öğrenci yorumlarını inceleyerek size en uygun koçu seçebilirsiniz." },
  { q: "Maarif Modeli'ne uyumlu çalışma nedir?", a: "Türkiye Yüzyılı Maarif Modeli, ezber yerine beceri odaklı, bütüncül ve gerçek dünya bağlantılı bir eğitim anlayışını benimser. Koçluk sistemimiz bu modele uygun olarak kişilerin anlama ve uygulama becerilerini geliştirmeyi hedefler." },
  { q: "PDR desteği almak zorunlu mu?", a: "Hayır, zorunlu değildir ancak sınav kaygısı, motivasyon kaybı veya zaman yönetimi gibi konularda desteğe ihtiyacınız varsa PDR uzmanlarımızdan faydalanmanızı şiddetle tavsiye ederiz." },
  { q: "Fiyatlandırma nasıl yapılıyor?", a: "Fiyatlandırma seçeceğiniz koçluk paketine göre değişiklik gösterir. Detaylı bilgi için iletişim sayfamızdan bize ulaşabilir veya ücretsiz ön görüşme talep edebilirsiniz." },
];

const TESTIMONIALS = [
  { text: "Koçum sayesinde düzenli çalışmaya başladım. Haftalık programlar ve deneme analizleri çok faydalı oluyor. TYT netlerim ciddi şekilde arttı.", name: "Ahmet Y.", role: "12. Sınıf Öğrencisi", initials: "AY" },
  { text: "Maarif modeline uygun çalışma yöntemleri gerçekten fark yaratıyor. Sadece ezber değil, anlayarak öğreniyorum artık.", name: "Zeynep K.", role: "Mezun Öğrencisi", initials: "ZK" },
  { text: "PDR desteği almak benim için çok doğru bir karardı. Sınav kaygımı yendiğim için artık çok daha verimli çalışıyorum.", name: "Emre A.", role: "12. Sınıf Öğrencisi", initials: "EA" },
  { text: "Koçumun bana özel hazırladığı program sayesinde zamanım çok daha verimli geçiyor. Kesinlikle tavsiye ederim.", name: "Selin Ç.", role: "Mezun Öğrencisi", initials: "SÇ" },
];

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let current = 0;
          const increment = target / 50;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, 40);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <div ref={ref} className="landing-stat-number">{count.toLocaleString("tr-TR")}</div>;
}

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
    <div className="landing-page">
      {/* Header */}
      <header className={`landing-header ${scrolled ? "scrolled" : ""}`}>
        <div className="landing-container">
          <nav className="landing-nav">
            <Link href="/landing" className="landing-logo">
              <div className="landing-logo-icon">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="landing-logo-text">Pusula</span>
            </Link>

            <div className="landing-nav-links">
              <a href="#hakkimizda">Hakkımızda</a>
              <a href="#maarif">Maarif Modeli</a>
              <a href="#hizmetler">Hizmetlerimiz</a>
              <a href="#koclar">Koçlarımız</a>
              <a href="#sss">SSS</a>
              <a href="#iletisim">İletişim</a>
            </div>

            <div className="landing-nav-buttons">
              <Link href="/login" className="landing-btn landing-btn-secondary">Giriş Yap</Link>
              <Link href="/login" className="landing-btn landing-btn-primary">Kayıt Ol</Link>
            </div>

            <button className="landing-mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menüyü aç">
              <span /><span /><span />
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`landing-mobile-menu ${mobileMenuOpen ? "active" : ""}`}>
        <div className="landing-mobile-menu-header">
          <Link href="/landing" className="landing-logo">
            <div className="landing-logo-icon"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
            <span className="landing-logo-text">Pusula</span>
          </Link>
          <button className="landing-mobile-menu-close" onClick={() => setMobileMenuOpen(false)} aria-label="Menüyü kapat">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
        <div className="landing-mobile-menu-links">
          <a href="#hakkimizda" onClick={() => setMobileMenuOpen(false)}>Hakkımızda</a>
          <a href="#maarif" onClick={() => setMobileMenuOpen(false)}>Maarif Modeli</a>
          <a href="#hizmetler" onClick={() => setMobileMenuOpen(false)}>Hizmetlerimiz</a>
          <a href="#koclar" onClick={() => setMobileMenuOpen(false)}>Koçlarımız</a>
          <a href="#sss" onClick={() => setMobileMenuOpen(false)}>SSS</a>
          <a href="#iletisim" onClick={() => setMobileMenuOpen(false)}>İletişim</a>
        </div>
        <div className="landing-mobile-menu-buttons">
          <Link href="/login" className="landing-btn landing-btn-secondary" onClick={() => setMobileMenuOpen(false)}>Giriş Yap</Link>
          <Link href="/login" className="landing-btn landing-btn-primary" onClick={() => setMobileMenuOpen(false)}>Kayıt Ol</Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-container">
          <div className="landing-hero-content">
            <div className="landing-hero-text">
              <div className="landing-hero-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                Maarif Modeli Uyumlu
              </div>
              <h1 className="landing-hero-title">
                YKS&apos;de <span>Pusulanı</span> Doğru Kullan, <span>Hedefine</span> Ulaş
              </h1>
              <p className="landing-hero-description">
                Türkiye Yüzyılı Maarif Modeli&apos;ne uyumlu, kişiye özel koçluk sistemiyle TYT ve AYT&apos;de başarını artır.
              </p>
              <div className="landing-hero-buttons">
                <Link href="/login" className="landing-btn landing-btn-primary">
                  Hemen Başla
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
                </Link>
                <a href="#hizmetler" className="landing-btn landing-btn-outline">Hizmetleri İncele</a>
              </div>
              <div className="landing-hero-stats">
                <div className="landing-stat-item"><AnimatedCounter target={5000} /><div className="landing-stat-label">Öğrenci</div></div>
                <div className="landing-stat-item"><AnimatedCounter target={150} /><div className="landing-stat-label">Uzman Koç</div></div>
                <div className="landing-stat-item"><AnimatedCounter target={95} /><div className="landing-stat-label">% Memnuniyet</div></div>
              </div>
            </div>
            <div className="landing-hero-visual">
              <div className="landing-hero-card">
                <div className="landing-hero-card-header">
                  <div className="landing-hero-card-avatar">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  </div>
                  <div className="landing-hero-card-info">
                    <h4>Öğrenci Paneli</h4>
                    <p>Gelişim takibi</p>
                  </div>
                </div>
                <div className="landing-hero-card-progress">
                  <div className="landing-progress-header">
                    <span className="landing-progress-label">TYT Hazırlık</span>
                    <span className="landing-progress-value">%75</span>
                  </div>
                  <div className="landing-progress-bar"><div className="landing-progress-fill" /></div>
                </div>
                <div className="landing-hero-card-subjects">
                  <span className="landing-subject-tag active">Matematik</span>
                  <span className="landing-subject-tag">Fen Bilimleri</span>
                  <span className="landing-subject-tag">Türkçe</span>
                  <span className="landing-subject-tag">Sosyal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="landing-floating-badge badge-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#e63946"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </div>
        <div className="landing-floating-badge badge-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#457b9d"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
        </div>
      </section>

      {/* Hakkımızda */}
      <section id="hakkimizda" className="landing-section">
        <div className="landing-container">
          <h2 className="landing-section-title">Pusula Nedir?</h2>
          <p className="landing-section-subtitle">YKS öğrencileri için tasarlanmış, Maarif Modeli uyumlu profesyonel koçluk platformu.</p>
          <div className="landing-features-grid">
            {[
              { icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z", title: "Kişiye Özel Program", desc: "Her öğrenci farklıdır. Seviyenize ve hızınıza uygun, size özel hazırlanmış çalışma programları ile verimli çalışın." },
              { icon: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z", title: "Uzman Koç Desteği", desc: "Derece yapmış veya alanında uzman koçlarımızla birebir görüşmeler, 7/24 WhatsApp desteği." },
              { icon: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z", title: "Detaylı Analiz", desc: "Deneme sonuçlarınızı analiz edin, eksiklerinizi görün, stratejinizi buna göre belirleyin." },
              { icon: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z", title: "Maarif Modeli Uyumlu", desc: "Türkiye Yüzyılı Maarif Modeli müfredatına uygun içerik ve stratejilerle çalışın." },
            ].map((f, i) => (
              <div key={i} className="landing-feature-card">
                <div className="landing-feature-icon"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d={f.icon}/></svg></div>
                <div className="landing-feature-content"><h3>{f.title}</h3><p>{f.desc}</p></div>
              </div>
            ))}
          </div>
          <div className="landing-team">
            <h3 className="landing-section-title" style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>Ekibimiz</h3>
            <div className="landing-team-grid">
              {["Berfin", "Fatih", "Lütfü"].map((name, i) => (
                <div key={i} className="landing-team-member">
                  <div className="landing-team-avatar">{name[0]}</div>
                  <p className="landing-team-name">{name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Maarif Modeli */}
      <section id="maarif" className="landing-section landing-maarif-section">
        <div className="landing-container">
          <h2 className="landing-section-title">Türkiye Yüzyılı Maarif Modeli</h2>
          <p className="landing-section-subtitle">Yeni nesil eğitim anlayışına uyumlu koçluk sistemimiz.</p>
          <div className="landing-maarif-grid">
            {[
              { icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z", title: "Beceri Odaklı Eğitim", desc: "Ezber yerine anlama ve uygulama odaklı çalışma yöntemleri." },
              { icon: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z", title: "Bütüncül Yaklaşım", desc: "Akademik ve kişisel gelişimi birlikte ele alan kapsamlı koçluk." },
              { icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", title: "Gerçek Dünya Bağlantısı", desc: "Öğrendiklerinizi gerçek hayat problemlerine uygulama becerisi." },
              { icon: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z", title: "İşbirlikçi Öğrenme", desc: "Koç ve öğrenci arasında sürekli iletişim ve geri bildirim döngüsü." },
              { icon: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z", title: "Veriye Dayalı Karar", desc: "Analitik araçlarla performansınızı ölçün, stratejinizi buna göre belirleyin." },
              { icon: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z", title: "Sürekli Gelişim", desc: "Düzenli evalüasyon ve program güncellemeleri ile kesintisiz ilerleme." },
            ].map((m, i) => (
              <div key={i} className="landing-maarif-card">
                <div className="landing-maarif-icon"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d={m.icon}/></svg></div>
                <h3>{m.title}</h3><p>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hizmetler */}
      <section id="hizmetler" className="landing-section landing-services-section">
        <div className="landing-container">
          <h2 className="landing-section-title">Hizmetlerimiz</h2>
          <p className="landing-section-subtitle">YKS hazırlığınız için ihtiyacınız olan her şey tek bir platformda.</p>
          <div className="landing-services-grid">
            {[
              { icon: "M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z", title: "TYT Koçluk", desc: "Temel Yeterlilik Testi'ne hazırlık için kapsamlı koçluk desteği.", items: ["Kişiselleştirilmiş çalışma programı", "Haftalık koçluk görüşmesi", "Deneme analizi ve değerlendirme", "7/24 WhatsApp desteği"] },
              { icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", title: "AYT Koçluk", desc: "Alan Yeterlilik Testi'nde hedefinize ulaşmak için uzman desteği.", items: ["Alan derslerine odaklı program", "Soru çözüm stratejileri", "Zaman yönetimi eğitimi", "Motivasyon ve psikolojik destek"] },
              { icon: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z", title: "PDR Desteği", desc: "Psikolojik danışmanlık ile sınav sürecini sağlıklı yönetin.", items: ["Sınav kaygısı yönetimi", "Motivasyon artırma", "Zaman yönetimi", "Hedef belirleme"] },
            ].map((s, i) => (
              <div key={i} className="landing-service-card">
                <div className="landing-service-icon"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d={s.icon}/></svg></div>
                <h3>{s.title}</h3><p>{s.desc}</p>
                <ul className="landing-service-list">{s.items.map((item, j) => <li key={j}>{item}</li>)}</ul>
                <Link href="/login" className="landing-btn landing-btn-secondary">Detaylı Bilgi</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Koçlar */}
      <section id="koclar" className="landing-section">
        <div className="landing-container">
          <h2 className="landing-section-title">Koçlarımız</h2>
          <p className="landing-section-subtitle">Alanında uzman, derece yapmış koçlarımızla tanışın.</p>
          <div className="landing-coaches-grid">
            {COACHES.map((c, i) => (
              <div key={i} className="landing-coach-card">
                <div className="landing-coach-image">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
                <div className="landing-coach-info">
                  <h4 className="landing-coach-name">{c.name}</h4>
                  <p className="landing-coach-specialty">{c.specialty}</p>
                  <div className="landing-coach-stats">
                    <div className="landing-coach-stat"><div className="landing-coach-stat-number">{c.students}+</div><div className="landing-coach-stat-label">Öğrenci</div></div>
                    <div className="landing-coach-stat"><div className="landing-coach-stat-number">{c.rating}</div><div className="landing-coach-stat-label">Puan</div></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Yorumlar */}
      <section className="landing-section landing-testimonials-section">
        <div className="landing-container">
          <h2 className="landing-section-title">Öğrencilerimiz Ne Diyor?</h2>
          <p className="landing-section-subtitle">Pusula deneyimini yaşayan öğrencilerimizin yorumları.</p>
          <div className="landing-testimonials-slider">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="landing-testimonial-card">
                <p className="landing-testimonial-text">&quot;{t.text}&quot;</p>
                <div className="landing-testimonial-author">
                  <div className="landing-testimonial-avatar">{t.initials}</div>
                  <div className="landing-testimonial-info"><h4>{t.name}</h4><p>{t.role}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SSS */}
      <section id="sss" className="landing-section">
        <div className="landing-container">
          <h2 className="landing-section-title">Sıkça Sorulan Sorular</h2>
          <p className="landing-section-subtitle">Merak ettiğiniz tüm soruların yanıtları burada.</p>
          <div className="landing-faq-list">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className={`landing-faq-item ${openFaq === i ? "active" : ""}`}>
                <button className="landing-faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {item.q}
                  <span className="landing-faq-icon"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg></span>
                </button>
                <div className="landing-faq-answer"><div className="landing-faq-answer-content">{item.a}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="iletisim" className="landing-section landing-cta-section">
        <div className="landing-container">
          <div className="landing-cta-content">
            <h2 className="landing-cta-title">Hedefine Giden Yolda İlk Adımı At</h2>
            <p className="landing-cta-text">Ücretsiz ön görüşme ile koçluk sistemimizi tanıyın, hemen başlayın.</p>
            <div className="landing-cta-buttons">
              <Link href="/login" className="landing-btn landing-btn-primary">Ücretsiz Görüşme Talep Et</Link>
              <a href="mailto:info@pusula.com" className="landing-btn landing-btn-outline">Bize Ulaşın</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-grid">
            <div className="landing-footer-brand">
              <Link href="/landing" className="landing-logo">
                <div className="landing-logo-icon"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
                <span className="landing-logo-text">Pusula</span>
              </Link>
              <p>YKS öğrencileri için tasarlanmış, Maarif Modeli uyumlu profesyonel koçluk platformu.</p>
              <div className="landing-footer-social">
                <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg></a>
                <a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/></svg></a>
                <a href="#" aria-label="Twitter"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.05c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/></svg></a>
              </div>
            </div>
            <div className="landing-footer-column">
              <h4 className="landing-footer-title">Hizmetler</h4>
              <ul className="landing-footer-links"><li><Link href="/login">TYT Koçluk</Link></li><li><Link href="/login">AYT Koçluk</Link></li><li><Link href="/login">PDR Desteği</Link></li><li><Link href="/login">Koçluk Paketleri</Link></li></ul>
            </div>
            <div className="landing-footer-column">
              <h4 className="landing-footer-title">Kurumsal</h4>
              <ul className="landing-footer-links"><li><a href="#hakkimizda">Hakkımızda</a></li><li><a href="#koclar">Koçlarımız</a></li><li><a href="#sss">SSS</a></li><li><a href="#iletisim">İletişim</a></li></ul>
            </div>
            <div className="landing-footer-column">
              <h4 className="landing-footer-title">İletişim</h4>
              <ul className="landing-footer-links"><li><a href="tel:+905001234567">+90 500 123 45 67</a></li><li><a href="mailto:info@pusula.com">info@pusula.com</a></li><li><a href="https://wa.me/905001234567">WhatsApp</a></li></ul>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <p>&copy; 2026 Pusula Eğitim Platformu. Tüm hakları saklıdır.</p>
            <div className="landing-footer-legal">
              <a href="#">Gizlilik Politikası</a>
              <a href="#">Kullanım Şartları</a>
              <a href="#">Çerez Politikası</a>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Float */}
      <a href="https://wa.me/905001234567" className="landing-whatsapp-float" target="_blank" rel="noopener" aria-label="WhatsApp ile iletişim">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
    </div>
  );
}

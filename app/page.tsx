import Link from "next/link";
import { Compass, Star, Users, BookOpen, BarChart3, Heart, GraduationCap, Calendar, ClipboardList, MessageSquare, Phone, Mail, ChevronDown, ArrowRight } from "lucide-react";

const FEATURES = [
  { icon: BookOpen, title: "Kişiye Özel Program", desc: "Seviyenize ve hızınıza uygun, size özel hazırlanmış çalışma programları ile verimli çalışın." },
  { icon: Users, title: "Uzman Koç Desteği", desc: "Derece yapmış veya alanında uzman koçlarımızla birebir görüşmeler, 7/24 WhatsApp desteği." },
  { icon: BarChart3, title: "Detaylı Analiz", desc: "Deneme sonuçlarınızı analiz edin, eksiklerinizi görün, stratejinizi buna göre belirleyin." },
  { icon: GraduationCap, title: "Maarif Modeli Uyumlu", desc: "Türkiye Yüzyılı Maarif Modeli müfredatına uygun içerik ve stratejilerle çalışın." },
];

const MAARIF = [
  { icon: BookOpen, title: "Beceri Odaklı Eğitim", desc: "Ezber yerine anlama ve uygulama odaklı çalışma yöntemleri." },
  { icon: Heart, title: "Bütüncül Yaklaşım", desc: "Akademik ve kişisel gelişimi birlikte ele alan kapsamlı koçluk." },
  { icon: Star, title: "Gerçek Dünya Bağlantısı", desc: "Öğrendiklerinizi gerçek hayat problemlerine uygulama becerisi." },
  { icon: Users, title: "İşbirlikçi Öğrenme", desc: "Koç ve öğrenci arasında sürekli iletişim ve geri bildirim döngüsü." },
  { icon: BarChart3, title: "Veriye Dayalı Karar", desc: "Analitik araçlarla performansınızı ölçün, stratejinizi buna göre belirleyin." },
  { icon: Calendar, title: "Sürekli Gelişim", desc: "Düzenli evalüasyon ve program güncellemeleri ile kesintisiz ilerleme." },
];

const SERVICES = [
  { icon: BookOpen, title: "TYT Koçluk", desc: "Temel Yeterlilik Testi'ne hazırlık için kapsamlı koçluk desteği.", items: ["Kişiselleştirilmiş çalışma programı", "Haftalık koçluk görüşmesi", "Deneme analizi ve değerlendirme", "7/24 WhatsApp desteği"] },
  { icon: Star, title: "AYT Koçluk", desc: "Alan Yeterlilik Testi'nde hedefinize ulaşmak için uzman desteği.", items: ["Alan derslerine odaklı program", "Soru çözüm stratejileri", "Zaman yönetimi eğitimi", "Motivasyon ve psikolojik destek"] },
  { icon: Heart, title: "PDR Desteği", desc: "Psikolojik danışmanlık ile sınav sürecini sağlıklı yönetin.", items: ["Sınav kaygısı yönetimi", "Motivasyon artırma", "Zaman yönetimi", "Hedef belirleme"] },
];

const TESTIMONIALS = [
  { text: "Koçum sayesinde düzenli çalışmaya başladım. Haftalık programlar ve deneme analizleri çok faydalı oluyor. TYT netlerim ciddi şekilde arttı.", name: "Ahmet Y.", role: "12. Sınıf Öğrencisi", initials: "AY" },
  { text: "Maarif modeline uygun çalışma yöntemleri gerçekten fark yaratıyor. Sadece ezber değil, anlayarak öğreniyorum artık.", name: "Zeynep K.", role: "Mezun Öğrencisi", initials: "ZK" },
  { text: "PDR desteği almak benim için çok doğru bir karardı. Sınav kaygımı yendiğim için artık çok daha verimli çalışıyorum.", name: "Emre A.", role: "12. Sınıf Öğrencisi", initials: "EA" },
  { text: "Koçumun bana özel hazırladığı program sayesinde zamanım çok daha verimli geçiyor. Kesinlikle tavsiye ederim.", name: "Selin Ç.", role: "Mezun Öğrencisi", initials: "SÇ" },
];

const FAQ = [
  { q: "Pusula koçluk sistemi nasıl çalışıyor?", a: "Öncelikle seviyenizi belirleyen bir değerlendirme yapılır. Ardından uzman koçunuz size özel haftalık çalışma programı hazırlar. Düzenli koçluk görüşmeleri, deneme analizleri ve 7/24 WhatsApp desteği ile süreç takip edilir." },
  { q: "Koçumu kendim seçebilir miyim?", a: "Evet, koçlarımızın profil sayfalarından uzmanlık alanlarını, deneyimlerini ve öğrenci yorumlarını inceleyerek size en uygun koçu seçebilirsiniz." },
  { q: "Maarif Modeli'ne uyumlu çalışma nedir?", a: "Türkiye Yüzyılı Maarif Modeli, ezber yerine beceri odaklı, bütüncül ve gerçek dünya bağlantılı bir eğitim anlayışını benimser. Koçluk sistemimiz bu modele uygun olarak kişilerin anlama ve uygulama becerilerini geliştirmeyi hedefler." },
  { q: "PDR desteği almak zorunlu mu?", a: "Hayır, zorunlu değildir ancak sınav kaygısı, motivasyon kaybı veya zaman yönetimi gibi konularda desteğe ihtiyacınız varsa PDR uzmanlarımızdan faydalanmanızı şiddetle tavsiye ederiz." },
  { q: "Fiyatlandırma nasıl yapılıyor?", a: "Fiyatlandırma seçeceğiniz koçluk paketine göre değişiklik gösterir. Detaylı bilgi için iletişim sayfamızdan bize ulaşabilir veya ücretsiz ön görüşme talep edebilirsiniz." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Compass className="h-6 w-6 text-primary" />
            <span>Pusula</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#hakkimizda" className="text-sm text-muted-foreground hover:text-foreground">Hakkımızda</a>
            <a href="#maarif" className="text-sm text-muted-foreground hover:text-foreground">Maarif Modeli</a>
            <a href="#hizmetler" className="text-sm text-muted-foreground hover:text-foreground">Hizmetlerimiz</a>
            <a href="#koclar" className="text-sm text-muted-foreground hover:text-foreground">Koçlarımız</a>
            <Link href="/sss" className="text-sm text-muted-foreground hover:text-foreground">SSS</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">Giriş Yap</Link>
            <Link href="/register" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Kayıt Ol</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20 md:py-32">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Star className="h-3 w-3" /> Maarif Modeli Uyumlu
              </span>
              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                YKS&apos;de <span className="text-primary">Pusulanı</span> Doğru Kullan, <span className="text-primary">Hedefine</span> Ulaş
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Türkiye Yüzyılı Maarif Modeli&apos;ne uyumlu, kişiye özel koçluk sistemiyle TYT ve AYT&apos;de başarını artır.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  Hemen Başla <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#hizmetler" className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium hover:bg-accent">
                  Hizmetleri İncele
                </a>
              </div>
              <div className="mt-10 flex gap-8">
                <div><p className="text-2xl font-bold">5000+</p><p className="text-sm text-muted-foreground">Öğrenci</p></div>
                <div><p className="text-2xl font-bold">150+</p><p className="text-sm text-muted-foreground">Uzman Koç</p></div>
                <div><p className="text-2xl font-bold">%95</p><p className="text-sm text-muted-foreground">Memnuniyet</p></div>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><GraduationCap className="h-5 w-5 text-primary" /></div>
                  <div><p className="font-semibold">Öğrenci Paneli</p><p className="text-xs text-muted-foreground">Gelişim takibi</p></div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm"><span>TYT Hazırlık</span><span className="font-medium">%75</span></div>
                  <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 w-3/4 rounded-full bg-primary" /></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Matematik", "Fen Bilimleri", "Türkçe", "Sosyal"].map((s) => (
                    <span key={s} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hakkımızda */}
      <section id="hakkimizda" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">Pusula Nedir?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">YKS öğrencileri için tasarlanmış, Maarif Modeli uyumlu profesyonel koçluk platformu.</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6 transition-colors hover:bg-accent/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><f.icon className="h-5 w-5 text-primary" /></div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Maarif Modeli */}
      <section id="maarif" className="bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">Türkiye Yüzyılı Maarif Modeli</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">Yeni nesil eğitim anlayışına uyumlu koçluk sistemimiz.</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MAARIF.map((m) => (
              <div key={m.title} className="rounded-xl border border-border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><m.icon className="h-5 w-5 text-primary" /></div>
                <h3 className="mt-4 font-semibold">{m.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hizmetler */}
      <section id="hizmetler" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">Hizmetlerimiz</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">YKS hazırlığınız için ihtiyacınız olan her şey tek bir platformda.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {SERVICES.map((s) => (
              <div key={s.title} className="rounded-xl border border-border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><s.icon className="h-5 w-5 text-primary" /></div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                <ul className="mt-4 space-y-2">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />{item}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-accent">
                  Detaylı Bilgi
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Koçlar */}
      <section id="koclar" className="bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">Koçlarımız</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">Alanında uzman, derece yapmış koçlarımızla tanışın.</p>
          <div className="mt-12 flex justify-center">
            <p className="text-sm text-muted-foreground">Koçlar yükleniyor...</p>
          </div>
        </div>
      </section>

      {/* Yorumlar */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">Öğrencilerimiz Ne Diyor?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">Pusula deneyimini yaşayan öğrencilerimizin yorumları.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{t.initials}</div>
                  <div><p className="text-sm font-semibold">{t.name}</p><p className="text-xs text-muted-foreground">{t.role}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SSS */}
      <section id="sss" className="bg-muted/30 py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-3xl font-bold">Sıkça Sorulan Sorular</h2>
          <div className="mt-12 space-y-4">
            {FAQ.map((f, i) => (
              <details key={i} className="group rounded-xl border border-border bg-card">
                <summary className="flex cursor-pointer items-center justify-between p-5 font-medium">
                  {f.q}
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-border px-5 pb-5 pt-4 text-sm text-muted-foreground">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold">Hedefine Giden Yolda İlk Adımı At</h2>
          <p className="mt-4 text-muted-foreground">Ücretsiz ön görüşme ile koçluk sistemimizi tanıyın, hemen başlayın.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Ücretsiz Görüşme Talep Et
            </Link>
            <a href="https://wa.me/905001234567" className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium hover:bg-accent">
              <Phone className="h-4 w-4" /> Bize Ulaşın
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Link href="/" className="flex items-center gap-2 font-bold"><Compass className="h-5 w-5 text-primary" /> Pusula</Link>
              <p className="mt-3 text-sm text-muted-foreground">YKS öğrencileri için tasarlanmış, Maarif Modeli uyumlu profesyonel koçluk platformu.</p>
            </div>
            <div>
              <h4 className="font-semibold">Hizmetler</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><a href="#hizmetler" className="hover:text-foreground">TYT Koçluk</a></li>
                <li><a href="#hizmetler" className="hover:text-foreground">AYT Koçluk</a></li>
                <li><a href="#hizmetler" className="hover:text-foreground">PDR Desteği</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Kurumsal</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><a href="#hakkimizda" className="hover:text-foreground">Hakkımızda</a></li>
                <li><a href="#koclar" className="hover:text-foreground">Koçlarımız</a></li>
                <li><Link href="/sss" className="hover:text-foreground">SSS</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Yasal</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/paketler" className="hover:text-foreground">Paketler</Link></li>
                <li><Link href="/mesafeli-satis-sozlesmesi" className="hover:text-foreground">Mesafeli Satış Sözleşmesi</Link></li>
                <li><Link href="/gizlilik-sozlesmesi" className="hover:text-foreground">Gizlilik Politikası</Link></li>
                <li><Link href="/odeme-teslimat" className="hover:text-foreground">Ödeme ve Teslimat</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">İletişim</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> +90 500 123 45 67</li>
                <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> info@pusula.com</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            &copy; 2026 Pusula Eğitim Platformu. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  );
}

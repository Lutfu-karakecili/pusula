import { Card, CardContent } from "@/components/ui/card";

export default function GizlilikSozlesmesiPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">Gizlilik Politikası</h1>
      <p className="text-sm text-muted-foreground mb-8">Son güncelleme: 2026</p>
      <Card>
        <CardContent className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Toplanan Veriler</h2>
            <p>Platformumuzda kayıt olurken ve kullanırken; ad-soyad, e-posta adresi, telefon numarası, okul/sınıf bilgileri, sınav hedefleri ve deneme sonuçları gibi eğitim sürecine ilişkin bilgiler toplanır. Ödeme işlemleri sırasında kart bilgileri doğrudan ödeme sağlayıcı tarafından alınır; tarafımızca saklanmaz.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">2. Verilerin Kullanımı</h2>
            <p>Toplanan veriler; size özel koçluk ve eğitim hizmeti sunmak, haftalık planlar hazırlamak, ilerlemenizi takip etmek, hizmet kalitesini artırmak ve yasal yükümlülükleri yerine getirmek amacıyla işlenir.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">3. Verilerin Paylaşımı</h2>
            <p>Verileriniz; yalnızca hizmetin sunulması amacıyla, yetkili koçlarınız ve sistem yöneticileri ile paylaşılır. Üçüncü kişilere, yasal zorunluluklar dışında satılmaz veya kiralanmaz.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">4. Veri Güvenliği</h2>
            <p>Verileriniz, endüstri standardı güvenlik önlemleri (şifreleme, erişim kontrolü, RLS gibi veritabanı politikaları) ile korunur.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">5. Kişisel Verilerin Korunması</h2>
            <p>6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında; verilerinize erişim, düzeltme ve silme hakkınız bulunmaktadır. Talepleriniz için info@pusula.com adresinden bizimle iletişime geçebilirsiniz.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

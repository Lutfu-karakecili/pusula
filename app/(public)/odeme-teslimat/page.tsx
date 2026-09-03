import { Card, CardContent } from "@/components/ui/card";

export default function OdemeTeslimatPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">Ödeme ve Teslimat</h1>
      <p className="text-sm text-muted-foreground mb-8">Son gücelleme: 2026</p>
      <Card>
        <CardContent className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-2">Ödeme Yöntemleri</h2>
            <p>Platformumuz üzerinden şu yöntemlerle ödeme yapabilirsiniz:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Kredi kartı / Banka kartı (3D Secure)</li>
              <li>Havale / EFT</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">Ödeme Güvenliği</h2>
            <p>Ödemeleriniz, uluslararası PCI-DSS standartlarına uygun güvenli ödeme altyapısı (Iyzico) üzerinden gerçekleştirilir. Kart bilgileriniz işlem anında ödeme sağlayıcı tarafından şifrelenir; tarafımızca saklanmaz.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">Hizmet Teslimatı</h2>
            <p>Eğitim hizmetlerimiz dijital olarak sunulur. Ödemenin onaylanmasının ardından:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Aboneliğiniz anında aktifleştirilir.</li>
              <li>Koç ataması ekibimiz tarafından en geç 2 iş günü içinde yapılır.</li>
              <li>İlk haftalık çalışma planınız belirlenir.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">İade ve Cayma</h2>
            <p>Elektronik ortamda anında ifa edilen eğitim hizmetleri, mesafeli satış sözleşmesi kapsamında cayma hakkı istisnalarına tabidir. Hizmet başlamadan önce yapılan iptal taleplerinde ödeme iade edilir.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">Fatura</h2>
            <p>Ödeme sonrası e-posta adresinize elektronik fatura iletilir. Fatura bilgilerinizin güncel olduğundan emin olunuz.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

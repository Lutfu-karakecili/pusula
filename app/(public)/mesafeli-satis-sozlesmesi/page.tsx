import { Card, CardContent } from "@/components/ui/card";

export default function MesafeliSatisPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">Mesafeli Satış Sözleşmesi</h1>
      <p className="text-sm text-muted-foreground mb-8">Son güncelleme: 2026</p>
      <Card>
        <CardContent className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Taraflar</h2>
            <p>İşbu Mesafeli Satış Sözleşmesi ("Sözleşme"), Pusula Eğitim Platformu ("Satıcı") ile internet sitesi üzerinden eğitim paketi satın alan kullanıcı ("Alıcı") arasında elektronik ortamda akdedilmiştir.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">2. Konu</h2>
            <p>Sözleşmenin konusu, Alıcı'nın satıcıya ait internet sitesinden satın aldığı eğitim/koçluk paketinin satışı ve teslimatı ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca tarafların hak ve yükümlülüklerinin belirlenmesidir.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">3. Ödeme</h2>
            <p>Ödeme, güvenli ödeme altyapısı aracılığıyla kredi kartı, banka kartı veya havale/EFT yoluyla yapılır. Ödeme anında işlem güvenli şifreleme yöntemleriyle korunur. Ödeme sağlayıcıya ait kart bilgileri satıcı tarafında saklanmaz.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">4. Cayma Hakkı</h2>
            <p>Elektronik ortamda anında ifa edilen hizmet alımlarında, hizmetin ifasına Alıcı'nın onayı ile başlanmış ise Alıcı cayma hakkını kullanamaz. Eğitim/koçluk hizmetleri anında ifa edilen hizmet kapsamında değerlendirilir. Ancak hizmet başlamadan önce cayma hakkı saklıdır.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">5. Hizmetin İfası</h2>
            <p>Hizmet, ödemenin onaylanmasını takiben paketin içeriğine göre (koç ataması, haftalık plan oluşturma vb.) başlatılır. Paket süresi, satın alma anında belirtilen süre kadardır.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">6. Yürürlük</h2>
            <p>İşbu Sözleşme, Alıcı'nın site üzerinden paket seçip ödeme adımını tamamlamasıyla yürürlüğe girer.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

const FAQ = [
  { q: "Pusula koçluk sistemi nasıl çalışıyor?", a: "Öncelikle seviyenizi belirleyen bir değerlendirme yapılır. Ardından uzman koçunuz size özel haftalık çalışma programı hazırlar. Düzenli koçluk görüşmeleri, deneme analizleri ve 7/24 WhatsApp desteği ile süreç takip edilir." },
  { q: "Koçumu kendim seçebilir miyim?", a: "Evet, koçlarımızın profil sayfalarından uzmanlık alanlarını, deneyimlerini ve öğrenci yorumlarını inceleyerek size en uygun koçu seçebilirsiniz." },
  { q: "Maarif Modeli'ne uyumlu çalışma nedir?", a: "Türkiye Yüzyılı Maarif Modeli, ezber yerine beceri odaklı, bütüncül ve gerçek dünya bağlantılı bir eğitim anlayışını benimser. Koçluk sistemimiz bu modele uygun olarak kişilerin anlama ve uygulama becerilerini geliştirmeyi hedefler." },
  { q: "PDR desteği almak zorunlu mu?", a: "Hayır, zorunlu değildir ancak sınav kaygısı, motivasyon kaybı veya zaman yönetimi gibi konularda desteğe ihtiyacınız varsa PDR uzmanlarımızdan faydalanmanızı şiddetle tavsiye ederiz." },
  { q: "Fiyatlandırma nasıl yapılıyor?", a: "Fiyatlandırma seçeceğiniz koçluk paketine göre değişiklik gösterir. Güncel paketlerimize /paketler sayfasından ulaşabilirsiniz." },
  { q: "Ödemeyi nasıl yapabilirim?", a: "Paket seçiminin ardından kredi kartı, banka kartı veya havale/EFT ile ödeme yapabilirsiniz. Ödeme sürecinde güvenli ödeme altyapısı kullanılır." },
  { q: "Aboneliğimi iptal edebilir miyim?", a: "Evet, mesafeli satış sözleşmesi kapsamındaki haklarınız dâhilinde aboneliğinizi iptal edebilirsiniz. Detaylı bilgi için mesafeli satış sözleşmemizi inceleyebilirsiniz." },
  { q: "Koç değiştirebilir miyim?", a: "Evet, mevcut koçunuzdan memnun değilseniz profil sayfanızdan koçunuzu değiştirebilirsiniz. Yeni koç seçimi, koçlar sayfasından yapılır." },
];

export default function SssPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 space-y-8">
      <h1 className="text-3xl font-bold text-center">Sıkça Sorulan Sorular</h1>
      <p className="text-center text-muted-foreground">Merak ettiğiniz konular hakkında sıkça sorulan soruların yanıtları.</p>
      <div className="space-y-4">
        {FAQ.map((f) => (
          <details key={f.q} className="group rounded-xl border border-border bg-card">
            <summary className="flex cursor-pointer items-center justify-between p-5 font-medium">
              {f.q}
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-border px-5 pb-5 pt-4 text-sm text-muted-foreground">{f.a}</div>
          </details>
        ))}
      </div>
    </div>
  );
}

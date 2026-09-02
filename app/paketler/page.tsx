"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

interface Package {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  is_popular: boolean;
}

const FALLBACK_PACKAGES: Package[] = [
  { id: "1", name: "Başlangıç", price: 499, period: "/ay", description: "İlk adımı atmak isteyenler için", features: ["TYT Koçluk", "Haftalık Plan", "SMS Desteği", "2 Koç Görüşmesi"], is_popular: false },
  { id: "2", name: "Standart", price: 999, period: "/ay", description: "Kapsamlı hazırlık için ideal", features: ["TYT + AYT Koçluk", "Günlük Plan", "WhatsApp Desteği", "4 Koç Görüşmesi", "Deneme Analizi"], is_popular: true },
  { id: "3", name: "Premium", price: 1499, period: "/ay", description: "Tam destek, tam başarı", features: ["TYT + AYT + PDR", "Sınırsız Plan", "7/24 Destek", "Sınırsız Koç Görüşmesi", "Deneme Analizi", "Bireysel Motivasyon"], is_popular: false },
];

export default function PaketlerPage() {
  const [packages, setPackages] = useState<Package[]>(FALLBACK_PACKAGES);
  const supabase = createClient();

  useEffect(() => {
    async function loadPackages() {
      const { data } = await supabase.from("packages").select("*").order("price");
      if (data && data.length > 0) setPackages(data);
    }
    loadPackages();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      {/* Header */}
      <header className="pt-24 pb-12 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/landing" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
            Ana Sayfaya Dön
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: "var(--lp-font-heading)" }}>Koçluk Paketleri</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">Size en uygun paketi seçin, hemen başlayın.</p>
        </div>
      </header>

      {/* Packages */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div key={pkg.id} className={`relative bg-gradient-to-br from-indigo-950/80 via-purple-900/60 to-indigo-950/80 border rounded-xl p-8 transition-all hover:transform hover:-translate-y-1 ${pkg.is_popular ? "border-purple-500 shadow-lg shadow-purple-500/25" : "border-indigo-500/20"}`}>
              {pkg.is_popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                  Popüler
                </div>
              )}
              <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
              <p className="text-slate-400 text-sm mb-4">{pkg.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">₺{pkg.price}</span>
                <span className="text-slate-400 ml-1">{pkg.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/login"
                className={`block w-full py-3 rounded-lg text-center font-semibold transition-all ${pkg.is_popular ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"}`}>
                Hemen Başla
              </Link>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Tüm Paketlerde Dahildir</h2>
          <p className="text-slate-400 mb-12 max-w-lg mx-auto">Her paketimizde temel özellikler ücretsiz olarak sunulmaktadır.</p>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z", title: "Güvenli Ödeme", desc: "256-bit SSL şifreleme" },
              { icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", title: "Memnuniyet Garantisi", desc: "14 gün para iade" },
              { icon: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z", title: "7/24 Destek", desc: "WhatsApp desteği" },
              { icon: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z", title: "Detaylı Rapor", desc: "Haftalık analiz" },
            ].map((f, i) => (
              <div key={i} className="bg-gradient-to-br from-indigo-950/80 via-purple-900/60 to-indigo-950/80 border border-indigo-500/20 rounded-xl p-6">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="currentColor"><path d={f.icon}/></svg>
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

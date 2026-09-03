"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Loader2, CheckCircle } from "lucide-react";

export default function UcretsizGorusmePage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName || !phone || !email) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("consultation_bookings").insert({
      full_name: fullName,
      phone,
      email,
      preferred_date: preferredDate || null,
      preferred_time: preferredTime || null,
      note: note || null,
    });
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="text-xl font-bold">Talebiniz Alındı!</h2>
            <p className="text-sm text-muted-foreground">
              Ekibimiz en kısa sürede sizinle iletişime geçecektir.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Ücretsiz Ön Görüşme</CardTitle>
          <CardDescription>
            Koçlarımızdan biriyle ücretsiz ön görüşme randevusu alın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Ad Soyad *</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Telefon *</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xx xxx xx xx" required />
              </div>
              <div className="space-y-2">
                <Label>E-posta *</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tercih Edilen Tarih</Label>
                <Input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tercih Edilen Saat</Label>
                <Input type="time" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Not</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Eklemek istediğiniz bir not varsa yazın..." rows={3} />
            </div>
            <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Randevu Talep Et"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PaketlerPage() {
  const supabase = await createClient();

  const { data: packages } = await supabase
    .from("packages")
    .select("*")
    .eq("active", true)
    .order("price");

  return (
    <div className="space-y-8 px-4 py-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Eğitim Paketleri</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          YKS hazırlığında ihtiyacına uygun paketi seç, hemen başla.
        </p>
      </div>

      {(!packages || packages.length === 0) ? (
        <Card className="max-w-md mx-auto">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Henüz paket bulunmuyor.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {packages.map((pkg: any) => (
            <Card key={pkg.id} className={`relative flex flex-col ${pkg.is_popular ? "border-primary shadow-lg" : ""}`}>
              {pkg.is_popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Popüler</Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle>{pkg.name}</CardTitle>
                <CardDescription>{pkg.duration_months} ay süreli</CardDescription>
                <div className="mt-4">
                  {pkg.discounted_price ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl font-bold">{pkg.discounted_price}₺</span>
                      <span className="text-lg line-through text-muted-foreground">{pkg.price}₺</span>
                    </div>
                  ) : (
                    <span className="text-3xl font-bold">{pkg.price}₺</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2 flex-1">
                  {(pkg.features ?? []).map((feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="mt-6">
                  <Button variant={pkg.is_popular ? "gradient" : "outline"} className="w-full">
                    Paketi Seç
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

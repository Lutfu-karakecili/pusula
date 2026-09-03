import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutForm } from "@/lib/iyzico";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });

  const body = await request.json();
  const { package_id } = body;
  if (!package_id) return NextResponse.json({ error: "Paket ID gerekli." }, { status: 400 });

  // Paketi çek
  const { data: pkg } = await supabase
    .from("packages")
    .select("*")
    .eq("id", package_id)
    .eq("active", true)
    .single();

  if (!pkg) return NextResponse.json({ error: "Paket bulunamadı." }, { status: 404 });

  // Profil bilgisini çek
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone")
    .eq("id", user.id)
    .single();

  // Pending subscription oluştur
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .insert({
      student_id: user.id,
      package_id: pkg.id,
      status: "pending_payment",
    })
    .select()
    .single();

  if (subError || !subscription) {
    return NextResponse.json({ error: "Abonelik oluşturulamadı." }, { status: 500 });
  }

  const paidPrice = pkg.discounted_price ?? pkg.price;
  const nameParts = (profile?.full_name ?? "Kullanıcı").split(" ");
  const firstName = nameParts[0] || "Kullanıcı";
  const lastName = nameParts.slice(1).join(" ") || "";

  try {
    const result = await createCheckoutForm({
      price: Number(pkg.price),
      paidPrice: Number(paidPrice),
      currency: "TRY",
      basketId: `sub_${subscription.id}`,
      paymentGroup: "SUBSCRIPTION",
      buyer: {
        id: user.id,
        name: firstName,
        surname: lastName,
        gsmNumber: profile?.phone || "+905000000000",
        email: profile?.email || user.email || "",
        identityNumber: "11111111111",
        lastLoginDate: new Date().toISOString(),
        registrationDate: new Date().toISOString(),
        registrationAddress: "İstanbul",
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        city: "İstanbul",
        country: "Turkey",
      },
      shippingAddress: {
        contactName: profile?.full_name || "Kullanıcı",
        city: "İstanbul",
        country: "Turkey",
        address: "İstanbul",
        zipCode: "34000",
      },
      billingAddress: {
        contactName: profile?.full_name || "Kullanıcı",
        city: "İstanbul",
        country: "Turkey",
        address: "İstanbul",
        zipCode: "34000",
      },
      basketItems: [
        {
          id: pkg.id,
          name: pkg.name,
          category1: "Eğitim",
          category2: "Paket",
          itemType: "VIRTUAL",
          price: Number(paidPrice),
        },
      ],
    });

    if (result.status === "success") {
      return NextResponse.json({
        checkoutFormContent: result.checkoutFormContent,
        paymentToken: result.paymentToken,
      });
    }

    return NextResponse.json({ error: result.errorMessage || "Ödeme başlatılamadı." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Ödeme sistemiyle bağlantı kurulamadı." }, { status: 500 });
  }
}

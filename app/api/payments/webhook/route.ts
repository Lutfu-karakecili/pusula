import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { retrieveCheckoutForm } from "@/lib/iyzico";

// Iyzico webhook callback — PaymentStatus parametresi ile çağrılır
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/student/dashboard?payment=error", request.url));
  }

  const supabase = await createClient();

  try {
    const result = await retrieveCheckoutForm(token);

    if (result.status === "success" && result.paymentStatus === "SUCCESS") {
      const basketId = result.basketId; // "sub_{subscription_id}"
      const subscriptionId = basketId?.replace("sub_", "");

      if (subscriptionId) {
        // Subscription'ı aktifleştir
        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            starts_at: new Date().toISOString(),
            ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 gün
          })
          .eq("id", subscriptionId);

        // Payment kaydı oluştur
        await supabase.from("payments").insert({
          subscription_id: subscriptionId,
          amount: result.paidPrice ? Number(result.paidPrice) : 0,
          provider: "iyzico",
          provider_payment_id: result.paymentId || token,
          status: "success",
          raw_response: result as any,
        });
      }

      return NextResponse.redirect(new URL("/student/dashboard?payment=success", request.url));
    }

    return NextResponse.redirect(new URL("/student/dashboard?payment=failed", request.url));
  } catch {
    return NextResponse.redirect(new URL("/student/dashboard?payment=error", request.url));
  }
}

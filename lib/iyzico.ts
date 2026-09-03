// Iyzico ödeme entegrasyonu (Sunucu tarafı)
// Ortam değişkenleri: IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_BASE_URL
// Iyzico Panel > Ayarlar > API Anahtarları'ndan alınır.

const IYZICO_BASE = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";

function getAuthHeaders() {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  if (!apiKey || !secretKey) throw new Error("Iyzico API anahtarları tanımlı değil.");

  const crypto = require("crypto");
  const randomStr = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now().toString();

  const encryptData = `${apiKey}${randomStr}${secretKey}${timestamp}`;
  const encryptionKey = crypto.createHash("sha256").update(encryptData).digest("base64");

  return {
    "Content-Type": "application/json",
    "Authorization": `PIIJK ${apiKey}:${encryptionKey}:${timestamp}`,
    "x-iyzipay-random": randomStr,
  };
}

export interface CreateCheckoutFormParams {
  price: number;
  paidPrice: number;
  currency: string;
  basketId: string;
  paymentGroup: string;
  buyer: {
    id: string;
    name: string;
    surname: string;
    gsmNumber: string;
    email: string;
    identityNumber: string;
    lastLoginDate: string;
    registrationDate: string;
    registrationAddress: string;
    ip: string;
    city: string;
    country: string;
  };
  shippingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode: string;
  };
  billingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode: string;
  };
  basketItems: Array<{
    id: string;
    name: string;
    category1: string;
    category2: string;
    itemType: string;
    price: number;
  }>;
}

export async function createCheckoutForm(params: CreateCheckoutFormParams) {
  const res = await fetch(`${IYZICO_BASE}/payment/checkoutform/auth/initialize`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      locale: "tr",
      conversationId: `conv_${Date.now()}`,
      price: params.price.toString(),
      paidPrice: params.paidPrice.toString(),
      currency: params.currency || "TRY",
      basketId: params.basketId,
      paymentGroup: params.paymentGroup || "SUBSCRIPTION",
      buyer: params.buyer,
      shippingAddress: params.shippingAddress,
      billingAddress: params.billingAddress,
      basketItems: params.basketItems,
    }),
  });

  const data = await res.json();
  return data;
}

export async function retrieveCheckoutForm(token: string) {
  const res = await fetch(`${IYZICO_BASE}/payment/checkoutform/auth/retrieve`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      locale: "tr",
      token,
    }),
  });

  const data = await res.json();
  return data;
}

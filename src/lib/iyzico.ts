import "server-only"

import Iyzipay from "iyzipay"

/**
 * iyzico Checkout Form V2 (resmi Node SDK) ince sarmalayıcısı — taşeron firmaların
 * bakiye yüklemesi için kullanılır.
 *
 * Not: `@types/iyzipay` paketi checkoutFormInitialize/checkoutForm için yanlış/eksik
 * tipler içeriyor (ör. gerçek API `paymentPageUrl` döndürür ama tip tanımında yok, ve
 * istek tipi olmayan `installments`/`paymentCard` gibi alanları zorunlu gösteriyor).
 * Bu yüzden bu iki çağrı burada kendi minimal tiplerimizle, istemciyi `any`'e daraltarak
 * yapılıyor — gerçek iyzico REST sözleşmesi baz alınıyor, paketin (yanlış) tipleri değil.
 *
 * Gerekli ortam değişkenleri (https://sandbox-merchant.iyzipay.com'dan ücretsiz sandbox
 * hesabı açılıp alınabilir, şirket doğrulaması gerekmez):
 * - IYZICO_API_KEY / IYZICO_SECRET_KEY: iyzico panelinden alınan API anahtarları.
 * - IYZICO_BASE_URL: sandbox için https://sandbox-api.iyzipay.com, canlıda
 *   https://api.iyzipay.com.
 * - APP_URL: bu uygulamanın kendi adresi (örn. http://localhost:3000 ya da
 *   https://apexreklam.vercel.app) — iyzico ödeme sonrası buraya geri döner.
 */

export interface TopupBuyer {
  id: string
  name: string
  surname: string
  identityNumber: string
  email: string
  gsmNumber: string
  address: string
  city: string
  ip: string
}

interface CheckoutFormInitializeResponse {
  status: string
  errorMessage?: string
  token?: string
  paymentPageUrl?: string
}

interface CheckoutFormRetrieveResponse {
  status: string
  paymentStatus?: string
  paymentId?: string
}

function isConfigured(): boolean {
  return Boolean(process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET_KEY && process.env.APP_URL)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getClient(): any {
  return new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY!,
    secretKey: process.env.IYZICO_SECRET_KEY!,
    uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
  })
}

export async function createTopupCheckout(params: {
  conversationId: string
  amount: number
  buyer: TopupBuyer
}): Promise<{ ok: true; paymentPageUrl: string; token: string } | { ok: false; error: string }> {
  if (!isConfigured()) {
    return {
      ok: false,
      error:
        "iyzico henüz yapılandırılmadı (.env.local içinde IYZICO_API_KEY / IYZICO_SECRET_KEY / APP_URL boş).",
    }
  }

  const price = params.amount.toFixed(2)

  const request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: params.conversationId,
    price,
    paidPrice: price,
    currency: Iyzipay.CURRENCY.TRY,
    basketId: params.conversationId,
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    callbackUrl: `${process.env.APP_URL}/api/iyzico/callback`,
    enabledInstallments: [1],
    buyer: {
      id: params.buyer.id,
      name: params.buyer.name,
      surname: params.buyer.surname,
      identityNumber: params.buyer.identityNumber,
      email: params.buyer.email,
      gsmNumber: params.buyer.gsmNumber,
      registrationAddress: params.buyer.address,
      city: params.buyer.city,
      country: "Turkey",
      ip: params.buyer.ip,
    },
    billingAddress: {
      contactName: `${params.buyer.name} ${params.buyer.surname}`,
      address: params.buyer.address,
      city: params.buyer.city,
      country: "Turkey",
    },
    basketItems: [
      {
        id: "bakiye-yukleme",
        name: "Taşeron Bakiye Yükleme",
        category1: "Bakiye",
        itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
        price,
      },
    ],
  }

  return new Promise((resolve) => {
    getClient().checkoutFormInitialize.create(
      request,
      (err: Error | null, result: CheckoutFormInitializeResponse) => {
        if (err) {
          resolve({ ok: false, error: err.message || "iyzico isteği başarısız." })
          return
        }
        if (result.status !== "success" || !result.paymentPageUrl || !result.token) {
          resolve({ ok: false, error: result.errorMessage || "iyzico isteği başarısız." })
          return
        }
        resolve({ ok: true, paymentPageUrl: result.paymentPageUrl, token: result.token })
      }
    )
  })
}

export async function retrieveCheckout(
  token: string
): Promise<{ status: "success" | "failure"; paymentId?: string }> {
  if (!isConfigured()) return { status: "failure" }

  return new Promise((resolve) => {
    getClient().checkoutForm.retrieve(
      { locale: Iyzipay.LOCALE.TR, token },
      (err: Error | null, result: CheckoutFormRetrieveResponse) => {
        if (err || result.paymentStatus !== "SUCCESS") {
          resolve({ status: "failure" })
          return
        }
        resolve({ status: "success", paymentId: result.paymentId })
      }
    )
  })
}

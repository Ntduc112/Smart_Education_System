import { PayOS, APIError } from "@payos/node";
import type { Webhook, WebhookData, PaymentLinkStatus } from "@payos/node";

let _client: PayOS | null = null;

function getClient(): PayOS {
    if (!_client) {
        _client = new PayOS({
            clientId:    process.env.PAYOS_CLIENT_ID!,
            apiKey:      process.env.PAYOS_API_KEY!,
            checksumKey: process.env.PAYOS_CHECKSUM_KEY!,
        });
    }
    return _client;
}

export async function createPaymentLink(params: {
    orderCode:   number;
    amount:      number;
    description: string;
    returnUrl:   string;
    cancelUrl:   string;
}): Promise<string> {
    const link = await getClient().paymentRequests.create(params);
    return link.checkoutUrl;
}

export async function verifyWebhook(body: Webhook): Promise<WebhookData> {
    return getClient().webhooks.verify(body);
}

// Hỏi trạng thái trực tiếp từ PayOS (dùng khi webhook chưa về).
export async function getPaymentInfo(orderCode: number) {
    return getClient().paymentRequests.get(orderCode);
}

export function isPaymentSuccess(webhookData: WebhookData): boolean {
    return webhookData.code === "00";
}

// Hủy link thanh toán phía PayOS (orderCode không tái dùng được nên phải hủy trước khi tạo đơn mới).
export async function cancelPaymentLink(orderCode: number, reason?: string) {
    return getClient().paymentRequests.cancel(orderCode, reason);
}

// Trạng thái đơn phía PayOS. "NOT_FOUND" = PayOS trả lỗi API cho orderCode này
// (đơn chưa từng tạo được — ví dụ createPaymentLink fail sau khi đã ghi DB).
// Lỗi mạng/timeout vẫn throw để caller không nhầm với đơn chết.
export async function getPayosStatus(orderCode: number): Promise<PaymentLinkStatus | "NOT_FOUND"> {
    try {
        const info = await getClient().paymentRequests.get(orderCode);
        return info.status;
    } catch (e) {
        if (e instanceof APIError && typeof e.status === "number") return "NOT_FOUND";
        throw e;
    }
}

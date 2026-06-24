import { PayOS } from "@payos/node";
import type { Webhook, WebhookData } from "@payos/node";

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

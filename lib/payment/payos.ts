import PayOS from "@payos/node";

const payos = new PayOS({
    clientId:    process.env.PAYOS_CLIENT_ID!,
    apiKey:      process.env.PAYOS_API_KEY!,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY!,
});

export async function createPaymentLink(params: {
    orderCode:   number;
    amount:      number;
    description: string;
    returnUrl:   string;
    cancelUrl:   string;
}): Promise<string> {
    const link = await payos.paymentRequests.create(params);
    return link.checkoutUrl;
}

export function verifyWebhook(body: Record<string, unknown>) {
    return payos.webhooks.verify(body);
}

export function isPaymentSuccess(webhookData: { code: string }): boolean {
    return webhookData.code === "00";
}

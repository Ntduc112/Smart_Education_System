import Groq from "groq-sdk";

// Lazy-init (như lib/payment/payos.ts): Groq SDK throw ngay trong constructor
// khi thiếu GROQ_API_KEY, nên không được tạo client ở module scope —
// `next build` import route lúc collect page data sẽ sập dù không gọi API.
let _client: Groq | null = null;

export function getGroq(): Groq {
    if (!_client) {
        _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return _client;
}

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export interface VideoTokenPayload extends JWTPayload {
    lessonId: string;
    userId: string;
    videoKey: string;
}

function getSecret() {
    const value = process.env.VIDEO_TOKEN_SECRET;
    if (!value) throw new Error("Missing env var: VIDEO_TOKEN_SECRET");
    return new TextEncoder().encode(value);
}

export async function signVideoToken(payload: Omit<VideoTokenPayload, keyof JWTPayload>): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("2h")
        .sign(getSecret());
}

export async function verifyVideoToken(token: string): Promise<VideoTokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
        return payload as VideoTokenPayload;
    } catch {
        return null;
    }
}

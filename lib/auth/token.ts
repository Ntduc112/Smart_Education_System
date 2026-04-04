import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export interface TokenPayload extends JWTPayload {
    userId: string;
    role: string;
}

function getSecret(key: "ACCESS_TOKEN_SECRET" | "REFRESH_TOKEN_SECRET") {
    const value = process.env[key];
    if (!value) throw new Error(`Missing env var: ${key}`);
    return new TextEncoder().encode(value);
}
export async function signAccessToken(payload: Omit<TokenPayload, keyof JWTPayload>): Promise<string> {
    try {
        const accessToken = await new SignJWT({ ...payload })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime(process.env.ACCESS_TOKEN_EXPIRES_IN!)
            .sign(getSecret("ACCESS_TOKEN_SECRET"))
        return accessToken;
    } catch (error) {
        console.error("Error signing access token:", error);
        throw error;
    }
}
export async function signRefreshToken(payload: Omit<TokenPayload, keyof JWTPayload>): Promise<string> {
    try {
        const refreshToken = await new SignJWT({ ...payload })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime(process.env.REFRESH_TOKEN_EXPIRES_IN!)
            .sign(getSecret("REFRESH_TOKEN_SECRET"))
        return refreshToken;
    } catch (error) {
        console.error("Error signing refresh token:", error);
        throw error;
    }
}
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getSecret("ACCESS_TOKEN_SECRET"));
        return payload as TokenPayload;
    } catch (error) {
        console.error("Error verifying access token:", error);
        return null;
    }
}
export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getSecret("REFRESH_TOKEN_SECRET"));
        return payload as TokenPayload;
    } catch (error) {
        console.error("Error verifying refresh token:", error);
        return null;
    }
}

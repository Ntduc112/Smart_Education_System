import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS =10;

export function generateTempPassword(): string {
    return crypto.randomBytes(9).toString("base64url");
}
export async function hashPassword(password: string):Promise<string> {
    try{
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        return hashedPassword;
    }catch(error){
        console.error("Error hashing password:", error);
        throw new Error("Failed to hash password");
    }
  
}

export async function verifyPassword(password: string, hashedPassword: string):Promise<boolean> {
    try{
        const isMatch = await bcrypt.compare(password, hashedPassword);
        return isMatch;

    }catch(error){
        console.error("Error verifying password:", error);
        throw new Error("Failed to verify password");
    }
}
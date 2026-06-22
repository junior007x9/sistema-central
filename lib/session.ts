import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Pega a chave secreta que acabamos de colocar no .env.local
const secretKey = process.env.JWT_SECRET;
const key = new TextEncoder().encode(secretKey);

// Função para criar o Token criptografado
export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1 day from now") // O login vai durar 1 dia
    .sign(key);
}

// Função para ler/descriptografar o Token
export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, { algorithms: ["HS256"] });
  return payload;
}

// Função que salva o Token nos Cookies do navegador do usuário
export async function createSession(userId: string, role: string, centerId: string | null) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 dia
  const session = await encrypt({ userId, role, centerId, expires });

  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}
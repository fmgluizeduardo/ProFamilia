import crypto from "node:crypto";

/**
 * Hash de senha com scrypt (nativo do Node, resistente a força bruta por GPU).
 * Formato armazenado: scrypt$N$r$p$salBase64$hashBase64
 */
const N = 16384;
const R = 8;
const P = 1;
const TAMANHO = 64;

function scrypt(senha: string, sal: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(senha.normalize("NFKC"), sal, TAMANHO, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (err, chave) =>
      err ? reject(err) : resolve(chave),
    );
  });
}

export async function hashSenha(senha: string): Promise<string> {
  const sal = crypto.randomBytes(16);
  const chave = await scrypt(senha, sal, N, R, P);
  return `scrypt$${N}$${R}$${P}$${sal.toString("base64")}$${chave.toString("base64")}`;
}

export async function verificarSenha(senha: string, armazenado: string): Promise<boolean> {
  const partes = armazenado.split("$");
  if (partes.length !== 6 || partes[0] !== "scrypt") return false;
  const [, n, r, p, salB64, hashB64] = partes;
  const esperado = Buffer.from(hashB64, "base64");
  try {
    const calculado = await scrypt(senha, Buffer.from(salB64, "base64"), Number(n), Number(r), Number(p));
    return calculado.length === esperado.length && crypto.timingSafeEqual(calculado, esperado);
  } catch {
    return false;
  }
}

/** Hash fictício para igualar o tempo de resposta quando o usuário não existe. */
let hashFicticio: Promise<string> | null = null;
export function obterHashFicticio(): Promise<string> {
  hashFicticio ??= hashSenha(crypto.randomBytes(12).toString("hex"));
  return hashFicticio;
}

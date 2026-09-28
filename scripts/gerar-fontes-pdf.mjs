// Gera src/lib/fontes-pdf.ts com as fontes do relatório em base64.
// Uso (após trocar os arquivos em assets/fonts): node scripts/gerar-fontes-pdf.mjs
//
// Por quê: na hospedagem serverless (Vercel), arquivos lidos do disco podem não
// acompanhar a função. Com as fontes embutidas no código, o PDF não depende de
// nenhum arquivo externo em tempo de execução.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ler = (nome) => fs.readFileSync(path.join(raiz, "assets", "fonts", nome)).toString("base64");

const regular = ler("DejaVuSans-Regular.ttf");
const negrito = ler("DejaVuSans-Bold.ttf");

const conteudo = `// ARQUIVO GERADO por scripts/gerar-fontes-pdf.mjs — não edite manualmente.
// Fontes DejaVu Sans (licença livre, derivada da Bitstream Vera) embutidas em base64
// para que o relatório PDF não dependa de arquivos em disco na hospedagem (Vercel).
export const DEJAVU_SANS_REGULAR_BASE64 =
  "${regular}";

export const DEJAVU_SANS_BOLD_BASE64 =
  "${negrito}";
`;

const destino = path.join(raiz, "src", "lib", "fontes-pdf.ts");
fs.writeFileSync(destino, conteudo);
console.log(`Gerado ${path.relative(raiz, destino)} (${(conteudo.length / 1024 / 1024).toFixed(2)} MB)`);

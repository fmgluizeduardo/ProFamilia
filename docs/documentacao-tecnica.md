# Documentação Técnica — Sistema PróFamília

Referência para desenvolvedores e para o responsável técnico pela manutenção.

## 1. Visão geral

Aplicação fullstack Next.js (App Router) que digitaliza a Ficha de Atendimento
do Serviço Especializado em Abordagem Social. Três perfis de uso no mesmo app:

- **Campo (mobile-first):** wizard de nova ficha em 6 etapas, evoluções,
  controle de veículo, impressão individual.
- **Coordenação:** painel de gerência com KPIs, gráficos, PDFs gerenciais e CSV.
- **Referência:** Guia de campo (doutrina operacional) + Manual do usuário.

Deploy de referência: **Vercel** (app) + **Neon** (PostgreSQL). Detalhes
operacionais em `docs/guia-deploy-neon-vercel.md`.

## 2. Stack e versões

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) + React 19 |
| Estilo | Tailwind CSS 4 (+ tokens customizados em `globals.css`) |
| Banco | PostgreSQL via Drizzle ORM (`drizzle-orm/node-postgres` + `pg`) |
| Migrações | Drizzle Kit (`drizzle/`, config em `drizzle.config.ts`) |
| PDF gerencial | PDFKit, A4, fontes DejaVu Sans TTF embutidas (`assets/fonts/`) |
| Ícones | lucide-react |
| PWA | `public/manifest.webmanifest` + ícones (instalável, sem service worker offline) |
| Fuso horário | `America/Sao_Paulo` centralizado em `src/lib/format.ts` |

## 3. Estrutura do projeto

```
src/
  app/
    page.tsx                  Início (indicadores + fichas recentes)
    nova/wizard.tsx           Wizard da ficha (client, 6 etapas, rascunho localStorage)
    fichas/page.tsx           Lista + busca + filtros (server)
    fichas/[id]/page.tsx      Detalhe + linha do tempo de evoluções
    veiculos/                 Controle de veículo (saída/chegada)
    imprimir/[id]/            Ficha formal para impressão/PDF individual
    gerencia/page.tsx         Painel da coordenação (server)
    guia/page.tsx             Diretrizes operacionais (estático)
    manual/page.tsx           Manual do usuário (estático, imprimível)
    api/
      atendimentos/route.ts            POST cria ficha
      atendimentos/[id]/evolucoes/     POST registra evolução
      atendimentos/export/             GET exporta CSV do período
      veiculos/route.ts                POST registra saída
      veiculos/[id]/route.ts           PATCH registra chegada
      gerencia/relatorio/route.ts      GET gera PDF gerencial (4 tipos)
      health/route.ts                  GET healthcheck (usado no deploy)
  components/                 ui.tsx, charts.tsx (SVG puro), signature-pad,
                              app-shell.tsx (sidebar + bottom nav), report-actions.tsx
  db/
    schema.ts                 3 tabelas + índices (fonte única do banco)
    index.ts                  Pool pg (max 5, singleton) + client Drizzle
    seed.ts                   Demonstração local (COM TRAVA anti-produção)
  lib/
    constants.ts              Opções oficiais da ficha + diretrizes do Guia
    format.ts                 Datas, moeda, máscaras, número da ficha
    validacoes.ts             Validações de API (data real, hora, UUID, KM)
    relatorios.ts             Consulta + agregações (painel e PDFs usam a mesma base)
    report-config.ts          Tipos de relatório (client-safe, sem imports de banco)
    gerar-relatorio-pdf.ts    Motor PDFKit (capa, gráficos vetoriais, paginação)
assets/fonts/                 DejaVuSans TTF (incluídas na função via next.config)
drizzle/                      Migrações SQL versionadas
docs/                         Deploy, técnica (este arquivo), manual do usuário
```

## 4. Rotas

### Páginas (App Router)

| Rota | Render | Descrição |
|---|---|---|
| `/` | Dinâmica | Dashboard operacional |
| `/nova` | Estática (client) | Wizard da ficha |
| `/fichas` | Dinâmica | Lista com `?q=&situacao=&motivo=&de=&ate=` |
| `/fichas/[id]` | Dinâmica | Detalhe + evoluções (`?novo=1` mostra confirmação) |
| `/veiculos` | Dinâmica | Controle de veículo |
| `/imprimir/[id]` | Dinâmica | Documento formal (sem chrome do app) |
| `/gerencia` | Dinâmica | Painel + `#relatorios` + tabela do período |
| `/guia`, `/manual` | Estáticas | Conteúdo institucional/ajuda |

`error.tsx`, `not-found.tsx` e `gerencia/loading.tsx` cobrem falha, 404 e
carregamento. Páginas com `[id]` validam UUID antes de consultar o banco.

### APIs

| Método + rota | Entrada | Respostas |
|---|---|---|
| `POST /api/atendimentos` | JSON da ficha (6 obrigatórios) | `201 {id, numero}` · `422` validação · `500` |
| `POST /api/atendimentos/[id]/evolucoes` | `{texto, autorNome, autorCargo?}` | `201` · `404` · `422` |
| `GET /api/atendimentos/export?de=&ate=` | — | CSV `;`-separado com BOM (Excel PT-BR) |
| `POST /api/veiculos` | `{data, motorista, saidaHora, saidaKm, saidaLocal}` | `201` · `409` rota aberta · `422` |
| `PATCH /api/veiculos/[id]` | `{chegadaHora, chegadaKm, chegadaLocal}` | `200` · `404` · `409` concluído · `422` |
| `GET /api/gerencia/relatorio?de=&ate=&tipo=&baixar=` | `tipo=completo\|indicadores\|fichas\|veiculos` | PDF `inline`/`attachment` · `400` período · `413` >1500 fichas |
| `GET /api/health` | — | `{"ok":true}` (+ checagem `select 1`) |

Sem autenticação nesta versão (decisão registrada com o cliente; ver §9).

## 5. Modelo de dados

`atendimentos` (ficha completa, ~66 colunas):
identificação (`nome_completo`, `nome_social`, `sexo` + `sexo_outro`
autodescrito, documentos), atendimento (data, hora, local, motivo),
situação (arrays `situacao_atual`, rua, vínculos `vinculo_preservado`/
`vinculo_familiar`, moradia), saúde, escolaridade, renda/benefícios, atuação
(`demandas`, `providencias`, `procedimentos`, `encaminhamentos`,
acompanhamento), registro (`responsavel_*`, `assinatura_usuario` base64) e
`numero` serial (nº da ficha). Índice em `data_atendimento`.

`evolucoes`: `atendimento_id` FK com `ON DELETE CASCADE`, `texto`, `autor_*`,
`created_at`. Índice na FK.

`veiculo_registros`: `data`, `veiculo`, `motorista`, saída (hora/km/local),
chegada (hora/km/local, nulos = em rota). Índice em `data`.

Regras de integridade implementadas na API (não só na UI): datas de
calendário real, horas `HH:MM`, UUID válido, KM monotônico por veículo,
uma única rota aberta por veículo, evolução exige ficha existente.

## 6. Relatórios PDF (decisões importantes)

- **PDFKit nativo no servidor**, documento A4 diagramado (não é print da tela):
  capa, sumário executivo, distribuições com barras vetoriais, índice, fichas
  integrais com evoluções, diário de veículo, rodapés numerados.
- **Fontes:** DejaVu Sans TTF em `assets/fonts/` (WOFF2 quebrava a
  incorporação no fontkit — documentado no histórico). `public/` **não** serve:
  na Vercel ela vai para o CDN e some da função; o `next.config.ts` usa
  `outputFileTracingIncludes` para empacotar as TTFs, e o código tem fallback
  de pastas com erro explícito se ausentes.
- **Paginação própria:** quebra de linha manual + `bufferPages` para nunca
  criar página sem cabeçalho; textos longos (evoluções) continuam na página
  seguinte marcadas como “continuação”.
- **Limites:** PDFs nominais bloqueados acima de 1.500 fichas no período
  (interface + API retornam 413 orientando CSV/período menor). Medição de
  referência: ~10 ms/ficha.
- **Confidencialidade:** `Cache-Control: private, no-store`; tipo
  `indicadores` não lista pessoas atendidas (mas mostra nomes de equipe em
  agregações operacionais).

## 7. Convenções de código

- Português no produto (UI, mensagens, docs); código em inglês onde o
  ecossistema exige.
- Datas como `YYYY-MM-DD` (string) até o banco; formatação só na borda
  (`format.ts`); fuso `America/Sao_Paulo` fixo.
- `labelSN`/`rotuloSN` para `sim|nao|parcialmente`; “Não informado” é o nulo
  canônico nos relatórios.
- Agregações sempre em `relatorios.ts` (nunca duplicar contagem na página).
- Componentes client só onde há interatividade (`"use client"`); gráficos em
  SVG puro SSR-friendly.
- `report-config.ts` é o único módulo de relatório importável no cliente.

## 8. Comandos e variáveis

Comandos no `README.md`. Variável única obrigatória: **`DATABASE_URL`**
(produção: string **pooled** do Neon com `sslmode=require`). Opcional:
`CONFIRM_SEED_DESTROY` (destrava o seed fora de localhost — não usar em
produção). O app lança erro explícito no boot se `DATABASE_URL` ausente.

## 9. Autenticação, autorização e auditoria

**Modelo:** papéis `admin` (acesso total implícito + gestão de usuários/auditoria)
e `usuario` (lista explícita de permissões). Catálogo em `src/lib/permissoes.ts`
(client-safe): `fichas.ver|criar|editar|excluir`, `evolucoes.criar|excluir`,
`veiculos.ver|registrar|excluir`, `gerencia.ver`, `relatorios.exportar`.
Dependências aplicadas automaticamente (`normalizarPermissoes`: editar/excluir/
evoluir ⇒ `fichas.ver`; registrar/excluir ⇒ `veiculos.ver`; exportar ⇒
`gerencia.ver`). Perfis prontos: Equipe de campo, Coordenação, Motorista,
Somente leitura.

**Tabelas:** `usuarios` (login único minúsculo, `senha_hash`, papel,
permissões, ativo, `deve_trocar_senha`, tentativas/bloqueio, último acesso),
`sessoes` (hash SHA-256 do token, expiração, IP, user-agent), `auditoria`
(ação, entidade, detalhes, IP, nome do usuário copiado). Rastreabilidade em
`atendimentos.criado_por_id/atualizado_por_id/atualizado_em`,
`evolucoes.autor_id`, `veiculo_registros.registrado_por_id`.

A opção “Manter conectado” **não armazena a senha**: apenas muda a duração da
sessão server-side/cookie de 12 horas (cookie de sessão) para 30 dias (cookie
persistente), sempre revogável por logout, desativação ou redefinição de senha.
Migração: `drizzle/0001_*.sql`.

**Sessões (`src/lib/auth.ts`):** token aleatório de 256 bits em cookie
`pf_sessao` (`httpOnly`, `secure` em produção, `sameSite=lax`, 12 h). O banco
guarda só o hash — um vazamento do banco não permite sequestrar sessões.
`obterUsuarioAtual()` é memorizado por requisição (`React.cache`) e relê papel/
permissões do banco a cada requisição: alterações do admin valem na hora;
desativação e redefinição de senha apagam as sessões do usuário.

**Senhas (`src/lib/senha.ts`):** scrypt (N=16384, r=8, p=1) com sal individual,
comparação em tempo constante; usuário inexistente consome o mesmo tempo (hash
fictício) para não permitir enumeração. Política: ≥ 8 caracteres, letras e
números, ≠ login e ≠ "admin", ≠ senha atual. 5 falhas ⇒ bloqueio de 15 min.

**Primeiro acesso:** `garantirAdminInicial()` roda no login; se a tabela
`usuarios` estiver vazia, cria `admin`/`admin` com troca obrigatória. A tela de
login mostra a dica somente enquanto não houver usuários. **Após o deploy,
faça o primeiro login imediatamente.**

**Aplicação das regras (defesa em profundidade):**
- Páginas: `exigirUsuario(requisito?)` → `/login`, `/trocar-senha` ou `/sem-acesso` (307).
- APIs: `autorizarApi(req, requisito?)` → 401 (sem sessão), 403 `TROCAR_SENHA`,
  403 `PERMISSAO`, 403 `ORIGEM` (checagem de `Origin` contra CSRF em métodos de escrita).
- UI: menu e botões filtrados por `temPermissao` — conveniência, nunca a única barreira.
- Autoria de evoluções vem da sessão (campos do cliente são ignorados).
- Salvaguardas do admin: não desativa nem rebaixa a si mesmo; sempre ≥ 1 admin ativo;
  usuários são desativados, nunca excluídos.
- Senha temporária é exibida uma única vez na tela (nunca em URL/log).

**Auditoria:** `registrarAuditoria()` em login/logout/falhas/bloqueio, troca e
redefinição de senha, CRUD de fichas/evoluções/veículo, exportações PDF/CSV e
gestão de usuários. Falha ao auditar nunca interrompe a operação. Tela em
`/usuarios/auditoria` com filtros.

**Rotas novas:** `/login`, `/trocar-senha`, `/sem-acesso`, `/usuarios`,
`/usuarios/novo`, `/usuarios/[id]`, `/usuarios/auditoria`, `/fichas/[id]/editar`;
APIs `POST /api/auth/login|logout|trocar-senha`, `POST /api/usuarios`,
`PATCH /api/usuarios/[id]` (dados, papel, permissões, ativo, `acao: desbloquear`),
`POST /api/usuarios/[id]/senha`, `PUT|DELETE /api/atendimentos/[id]`,
`DELETE /api/evolucoes/[id]`, `DELETE /api/veiculos/[id]`.

**Próximos passos sugeridos:** rate limit por IP (além do bloqueio por conta);
expiração de senha/2FA para administradores; política de retenção da
auditoria; revisão da exposição de `assinatura_usuario` conforme LGPD.

## 10. Manutenção

- **Evoluir schema:** editar `schema.ts` → `npx drizzle-kit generate` →
  revisar SQL em `drizzle/` → `npx drizzle-kit migrate` (dev local e Neon) →
  commit (migração + código juntos).
- **Observabilidade:** logs da rota no painel Vercel → Logs; erros de API
  usam `console.error` com contexto; `error.tsx` exibe `digest` ao usuário.
- **Backup:** Neon (PITR conforme o plano) + CSVs periódicos da gerência como
  segunda cópia legível.
- **Dependências:** `pdfkit`, `drizzle-orm`, `pg`, `next`, `react`,
  `lucide-react`; dev: `drizzle-kit`, `tsx`, `tailwindcss`, TS/ESLint.

## 11. Frota e níveis de acesso (versão 2)

**Frota (`veiculos`)**: modelo, marca, placa (normalizada, padrão antigo ou Mercosul,
única), ano, cor, KM inicial, observações, ativo. Veículos nunca são excluídos —
apenas desativados (preserva histórico). `veiculo_registros.veiculo_id` vincula
cada percurso ao veículo; o texto `veiculo` ("Kombi · DMN-4326") é mantido para
relatórios e é atualizado em todo o histórico quando modelo/placa são corrigidos.
Migração `drizzle/0002_*.sql` cria a tabela, cadastra a Kombi DMN-4326 e vincula os
percursos existentes.

Regras (servidor): um percurso aberto por veículo; veículo inativo não sai;
KM de saída ≥ maior KM registrado **até a data da saída** (permite digitar folhas
antigas); KM inicial ≤ menor KM já registrado; não desativa veículo em rota;
correção de percurso não reabre percurso concluído e exige chegada ≥ saída.

APIs: `POST /api/frota` (`frota.cadastrar`), `PATCH /api/frota/[id]` (`frota.editar`,
dados e/ou `ativo`), `POST /api/veiculos` (agora exige `veiculoId`),
`PUT /api/veiculos/[id]` (`veiculos.editar`, correção completa com diff na auditoria).
Telas: `/veiculos` (percursos, filtro `?veiculo=`) e `/veiculos/frota`.
Camada de dados em `src/lib/frota-dados.ts`; utilitários client-safe em `src/lib/frota.ts`.

**Catálogo atualizado de permissões**: `fichas.ver`, `fichas.ver_todas`, `fichas.criar`,
`fichas.editar`, `fichas.excluir`, `evolucoes.criar`, `evolucoes.excluir`,
`veiculos.ver`, `veiculos.registrar`, `veiculos.editar`, `veiculos.excluir`,
`frota.cadastrar`, `frota.editar`, `gerencia.ver`, `relatorios.exportar`.
Perfis: Equipe de campo, Apoio temporário, Motorista, Gestor de frota, Coordenação,
Somente leitura.

**Escopo de fichas (`src/lib/escopo.ts`)**: sem `fichas.ver_todas`, o usuário acessa
somente fichas com `criado_por_id` igual ao seu id — em lista, início, detalhe,
impressão, edição, exclusão e evoluções. Fora do escopo, a ficha responde **404**
(não revela existência). Indicadores da gerência continuam estatísticos (todos os
registros); a lista nominal da gerência respeita o escopo. PDF Completo/Prontuários
e CSV exigem `fichas.ver_todas` (403 caso contrário).
Na atualização, usuários existentes com `fichas.ver` receberam `fichas.ver_todas`
para manter o acesso que já tinham (registrado na auditoria).

**Validade do acesso (`usuarios.acesso_ate`)**: vale até o fim do dia (horário de
Brasília). Verificada no login (mensagem específica) e em toda requisição
(`obterUsuarioAtual`), derrubando sessões automaticamente após o prazo. Não pode ser
data passada na criação; administradores nunca expiram.

**Sessões**: admin lista e encerra sessões de qualquer usuário
(`PATCH /api/usuarios/[id]` com `acao: "encerrar_sessoes"`, preservando a própria);
cada usuário vê as suas em `/conta` e encerra as dos outros aparelhos
(`POST /api/auth/sessoes`). Aparelho identificado pelo user-agent.

**Transparência e revisão**: `/conta` mostra permissões do próprio usuário;
`/usuarios/matriz` mostra usuários ativos × permissões (revisão periódica de acessos).
Novas ações auditadas: `frota.criado|editado|desativado|reativado`,
`veiculo.editado`, `usuario.sessoes_encerradas`.

**Ambiente de preview**: a plataforma reescreve o `.env` (banco local) ao reiniciar;
o `.env.local` (ignorado pelo Git) aponta o preview para o Neon e tem precedência.
`drizzle-kit` e o seed leem apenas o `.env`, evitando alterar a produção por engano.

# Guia de Deploy — VSCode + Neon + Vercel

Passo a passo para colocar o sistema do Instituto PróFamília no ar, do zero,
usando o **VSCode** no seu computador, banco **Neon** (PostgreSQL gerenciado)
e hospedagem **Vercel**. Não é preciso saber programar — basta seguir as
etapas na ordem.

> Tempo estimado: 40–60 minutos (a maior parte esperando instalações).

---

## 0. O que você precisa antes de começar

1. **Node.js 20 ou superior** instalado ([nodejs.org](https://nodejs.org)).
   Confira no terminal do VSCode (`Ctrl+` ` ` para abrir):
   ```bash
   node --version   # deve mostrar v20.x ou maior
   npm --version
   ```
2. **Git** instalado (`git --version`).
3. Contas gratuitas criadas: **GitHub**, **Neon** ([neon.tech](https://neon.tech))
   e **Vercel** ([vercel.com](https://vercel.com) — entre com a conta do GitHub).
4. A pasta do projeto aberta no VSCode.

---

## 1. Preparar o projeto no VSCode

```bash
npm install
```

Esse comando baixa as dependências (pode levar alguns minutos na primeira vez).

---

## 2. Criar o banco de dados no Neon

1. Acesse [console.neon.tech](https://console.neon.tech) → **New Project**.
2. Configurações sugeridas:
   - **Name:** `profamilia`
   - **Region:** `South America (São Paulo)` — mais rápido para Barretos/SP.
   - **Postgres version:** a padrão (mais recente).
   - **Database name:** `profamilia`
3. Ao concluir, o Neon mostra a **Connection String**. Clique em **Pooled
   connection** (conexão com pool — essencial para aguentar os acessos do site)
   e copie a string completa. Ela se parece com:
   ```
   postgresql://usuario:senha@ep-xxxx-pooler.sa-east-1.aws.neon.tech/profamilia?sslmode=require
   ```
   > Guarde essa string: ela é a senha do banco. Nunca a publique nem a envie
   > por mensagens — ela vai apenas no seu `.env` local e nas variáveis da Vercel.

---

## 3. Configurar o `.env` local

Na pasta do projeto, crie o arquivo `.env` a partir do modelo:

```bash
cp .env.example .env
```

Abra o `.env` e cole a string do Neon em `DATABASE_URL` (entre aspas):

```env
DATABASE_URL="postgresql://usuario:senha@ep-xxxx-pooler.../profamilia?sslmode=require"
```

> O `.gitignore` já impede que o `.env` seja enviado ao GitHub. Confira que
> ele existe na raiz do projeto antes de prosseguir.

---

## 4. Criar as tabelas no Neon

Com o `.env` apontando para o Neon, rode **na pasta do projeto**:

```bash
npx drizzle-kit migrate
```

Esse comando aplica as migrações versionadas da pasta `drizzle/`: tabelas de
atendimento (`atendimentos`, `evolucoes`, `veiculo_registros`) e de segurança
(`usuarios`, `sessoes`, `auditoria`), com índices. Saída esperada:
`✓ Changes applied` ou lista de migrações aplicadas.

Para conferir visualmente (opcional):

```bash
npx drizzle-kit studio
```

> ⛔ **NUNCA rode `npx tsx src/db/seed.ts` com o `.env` apontando para o Neon.**
> O seed apaga todas as tabelas e insere dados fictícios — ele é exclusivo
> para banco local e possui uma trava que bloqueia a execução fora de
> `localhost`, mas não conte só com ela.

---

## 5. Testar localmente antes de publicar

```bash
npm run dev
```

Abra http://localhost:3000 e faça o **checklist de fumaça**:

- [ ] A página inicial carrega com os indicadores zerados.
- [ ] **Nova ficha:** preencha e salve uma ficha de teste.
- [ ] **Fichas:** localize a ficha criada e registre uma evolução de teste.
- [ ] **Veículo:** registre uma saída e uma chegada de teste.
- [ ] **Impressão:** abra a “Versão para impressão” da ficha.
- [ ] **Gerência:** confira gráficos e baixe os 4 PDFs + o CSV.
- [ ] **Manual:** abra `/manual` e confira o conteúdo.
- [ ] Apague os registros de teste (ou recrie o banco):
      `psql "$DATABASE_URL" -c "DELETE FROM atendimentos;"` remove fichas e
      evoluções (as evoluções são apagadas em cascata); repita para
      `veiculo_registros` se necessário.
- [ ] Rode a validação completa:
      ```bash
      npx next typegen && npm exec tsc -- --noEmit && npm run lint && npm run build
      ```

Se o build passar, o código está pronto para a nuvem.

---

## 6. Enviar o código para o GitHub (pelo terminal do VSCode)

Este projeto já está preparado para o remoto:
`https://github.com/fmgluizeduardo/ProFamilia.git`.

No terminal integrado do VSCode, na raiz do projeto:

```bash
git status                 # confira que .env NÃO aparece
# Se .env aparecer, pare: ele contém a senha do Neon e não pode ser enviado.
git add .
git commit -m "Sistema PróFamília: autenticação, permissões e deploy"
git push -u origin main
```

Se o Git pedir identidade na primeira vez, configure **somente neste projeto**:

```bash
git config user.name "Seu Nome"
git config user.email "seu-email@exemplo.com"
```

O repositório deve permanecer **privado**, pois o projeto trata dados pessoais
sensíveis. O `.gitignore` já protege `.env` e `.vercel/`.

---

## 7. Publicar na Vercel inteiramente pelo VSCode

Você só precisa criar uma conta gratuita em [vercel.com](https://vercel.com)
(entre com GitHub) uma vez. Depois faça tudo abaixo no terminal do VSCode:

### 7.1 Instalar/autenticar a Vercel CLI

```bash
npx vercel login
```

Escolha **Continue with GitHub** no navegador que abrir. Volte ao terminal
quando aparecer confirmação de login.

### 7.2 Vincular a pasta ao projeto Vercel

```bash
npx vercel link
```

Responda:

- **Set up and deploy?** `Y`
- **Which scope?** escolha sua conta
- **Link to existing project?** `N`
- **Project name:** `profamilia` (ou aceite o sugerido)
- **Directory:** `.` (ponto, a pasta atual)
- **Override settings?** `N`

Isso cria `.vercel/project.json` localmente, já ignorado pelo Git.

### 7.3 Enviar a variável do Neon para a Vercel

> O comando pede o valor de forma oculta. Cole a conexão **pooled** do Neon
> quando solicitado. Não a coloque no código nem faça commit.

```bash
npx vercel env add DATABASE_URL production
```

Quando a CLI perguntar o valor, cole a mesma `DATABASE_URL` que está no seu
`.env`. Para também testar deploys de preview (opcional), rode:

```bash
npx vercel env add DATABASE_URL preview
```

### 7.4 Fazer o primeiro deploy de produção

```bash
npx vercel --prod
```

No final, a CLI mostra a URL pública (`https://...vercel.app`). Guarde esse
endereço e abra-o no celular e no computador.

> A Vercel detecta Next.js automaticamente. O projeto já inclui a configuração
> necessária para os PDFs (`maxDuration` e fontes TTF na função serverless).
> Depois do primeiro deploy, cada `git push` na `main` publica uma nova versão
> automaticamente; para publicar manualmente pelo VSCode, use novamente
> `npx vercel --prod`.

---

## 8. Verificação pós-deploy (obrigatória)

> 🔐 **Faça isto primeiro, logo após o deploy:** abra o site, entre com usuário
> **`admin`** e senha **`admin`** e cadastre imediatamente a senha definitiva do
> administrador. Enquanto isso não for feito, qualquer pessoa com o endereço
> poderia usar o acesso padrão. Depois, em **Usuários e acessos**, crie os
> usuários da equipe com as permissões de cada função.

Com o endereço `https://profamilia-....vercel.app` aberto:

- [ ] `/api/health` retorna `{"ok":true}` (prova de que o site fala com o Neon).
- [ ] Página inicial carrega.
- [ ] Criar **1 ficha de teste** e **apagar em seguida** (confirma escrita real).
- [ ] Gerar **1 PDF** na Gerência (confirma as fontes do relatório no deploy).
- [ ] Abrir `/manual` e `/guia`.
- [ ] No celular: abrir o endereço, adicionar à tela inicial e testar 1 ficha.

Se `/api/health` falhar, o problema é quase sempre a `DATABASE_URL` na Vercel:
Settings → Environment Variables → confira valor/escopo → **Redeploy**.

---

## 9. Rotina após o go-live

| Tarefa | Como fazer |
|---|---|
| Atualizar o site | Altere o código, `git add .`, `git commit -m "..."`, `git push` — a Vercel publica sozinha |
| Ver publicações e voltar atrás | Vercel → projeto → **Deployments** (cada deploy pode ser promovido/visitado) |
| Ver erros em produção | Vercel → projeto → **Logs** (filtrar pela rota) |
| Mudar o banco de dados (novas colunas) | Edite `src/db/schema.ts` → `npx drizzle-kit generate` → rode `npx drizzle-kit migrate` com o `.env` apontando ao Neon → commit + push |
| Backup do banco | Neon → projeto → **Backups/Restore** (plano gratuito guarda ~7 dias; exporte CSVs periódicos como segunda cópia) |
| Domínio próprio (opcional) | Vercel → Settings → **Domains** → siga o assistente de DNS |

---

## 10. Solução de problemas

| Sintoma | Causa provável | Correção |
|---|---|---|
| Build falha: `DATABASE_URL is required` | Variável ausente na Vercel | Adicione `DATABASE_URL` em Settings → Environment Variables e faça Redeploy |
| `/api/health` retorna `{"ok":false}` | String errada, banco pausado ou IP | Confira a string pooled; no Neon, verifique se o projeto está ativo |
| `too many connections` | Conexão direta em vez de pooled | Troque para a string **pooled** (`...-pooler...`) na Vercel |
| Relatório/ação mostra aviso de erro | Qualquer falha | Anote o código e a referência do aviso e busque a referência em **Usuários › Erros do sistema** (detalhe técnico). BD-003 = aplicar `npx drizzle-kit migrate`; BD-001 = banco indisponível |
| Relatório/CSV mostra erro de conexão (503) | Neon retomando após inatividade | Normal na primeira geração do dia: o sistema tenta de novo sozinho; se persistir, aguarde ~30 s e tente novamente |
| Páginas de relatório lentas | Período muito longo | O sistema limita PDFs nominais a 250 fichas; reduza o período ou use o CSV |
| `drizzle-kit migrate` não acha o banco | `.env` errado ou ausente | `cat .env` deve mostrar a URL do Neon; rode o comando na raiz do projeto |
| Seed apagou dados | Rodado contra produção | Restaure pelo backup do Neon; o seed tem trava anti-produção, não a desative |

---

## Checklist final de entrega

- [ ] `.env` local com Neon pooled; `.env` fora do Git (`git status` limpo).
- [ ] Migrações aplicadas no Neon (`drizzle-kit migrate` OK).
- [ ] Build local passa (`npm run build`).
- [ ] Repositório GitHub privado atualizado.
- [ ] Vercel com `DATABASE_URL` em Production; deploy verde.
- [ ] Pós-deploy verificado (health, ficha teste, PDF, manual, celular).
- [ ] Equipe orientada a ler o `/manual` e o Guia de campo (`/guia`).

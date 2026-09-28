# Instituto PróFamília — Sistema de Abordagem Social

Sistema web (mobile-first, instalável como aplicativo) para digitalizar a
**Ficha de Atendimento do Serviço Especializado em Abordagem Social** —
Instituto PróFamília · Prefeitura da Estância Turística de Barretos/SP.

- **Equipe de campo:** registra fichas em 6 etapas pelo celular, com rascunho
  automático, assinatura na tela e controle de veículo (saída/chegada com KM).
- **Coordenação:** painel de gerência com indicadores, gráficos, relatórios em
  PDF diagramado (4 formatos), planilha CSV e impressão formal da ficha.
- **Todos:** Guia de campo com as diretrizes oficiais + Manual do usuário
  dentro do sistema (`/manual`).

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · PostgreSQL (Neon) ·
Drizzle ORM · PDFKit (relatórios A4 gerados no servidor) · Lucide Icons.

## Início rápido (desenvolvimento)

```bash
npm install
cp .env.example .env        # ajuste a DATABASE_URL para o seu Postgres local
npx drizzle-kit push        # cria as tabelas
npm run dev                 # http://localhost:3000
```

Dados fictícios de demonstração (opcional, **só em banco local**):

```bash
npx tsx src/db/seed.ts
```

## Primeiro acesso ao sistema

Depois de aplicar as migrações em um banco novo, entre no site com:

- **Usuário:** `admin`
- **Senha:** `admin`

A troca imediata de senha é obrigatória. Em seguida, o administrador cria os
usuários da equipe em **Usuários e acessos**, definindo permissões individuais.
Na tela de login, **“Manter conectado neste aparelho”** prolonga somente a
sessão (até 30 dias); a senha nunca é armazenada no navegador.

## Publicação (Neon + Vercel via VSCode)

Siga o passo a passo completo em
**[`docs/guia-deploy-neon-vercel.md`](docs/guia-deploy-neon-vercel.md)** —
do `npm install` no VSCode até o site no ar, incluindo criação do banco,
migrações, GitHub, variáveis de ambiente e verificação pós-deploy.

## Documentação

| Documento                                                        | Público              |
|------------------------------------------------------------------|----------------------|
| [`docs/manual-do-usuario.md`](docs/manual-do-usuario.md)           | Equipe (também em `/manual` no sistema) |
| [`docs/guia-deploy-neon-vercel.md`](docs/guia-deploy-neon-vercel.md) | Responsável técnico  |
| [`docs/documentacao-tecnica.md`](docs/documentacao-tecnica.md)     | Desenvolvedores      |

## Comandos úteis

| Comando                        | Para que serve                              |
|--------------------------------|---------------------------------------------|
| `npm run dev`                  | Servidor de desenvolvimento                 |
| `npm run build` / `npm start`  | Build e servidor de produção                |
| `npm run lint`                 | Verificação de código                       |
| `npx drizzle-kit push`         | Aplica o schema direto (desenvolvimento)    |
| `npx drizzle-kit generate`     | Gera migração SQL versionada (`drizzle/`)   |
| `npx drizzle-kit migrate`      | Aplica migrações (recomendado p/ produção)  |
| `npx drizzle-kit studio`       | Visualiza o banco no navegador              |

## Aviso importante

O sistema armazena dados pessoais e sensíveis de pessoas em vulnerabilidade.
Relatórios nominais (PDF Completo, Prontuários, CSV) só devem ser
compartilhados com equipe autorizada. Login e controle de usuários estão
previstos como próxima etapa (ver documentação técnica).

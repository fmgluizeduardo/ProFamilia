"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  Eye,
  KeyRound,
  Loader2,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  Power,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  DEPENDENCIAS,
  LOGIN_REGEX,
  MODULOS,
  PERFIS,
  normalizarPermissoes,
  type Papel,
  type Permissao,
} from "@/lib/permissoes";
import { AvisoErro } from "@/components/aviso-erro";
import { chamarApi } from "@/lib/api-cliente";

export type UsuarioEditavel = {
  id: string;
  nome: string;
  login: string;
  cargo: string | null;
  papel: Papel;
  permissoes: string[];
  ativo: boolean;
  bloqueado: boolean;
  deveTrocarSenha: boolean;
  acessoAte: string | null;
};

const inputCls =
  "h-12 w-full rounded-xl border border-ink-200/90 bg-white px-4 text-[0.92rem] font-medium text-ink-900 placeholder:font-normal placeholder:text-ink-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:bg-ink-50 disabled:text-ink-400";
const labelCls = "mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-ink-500";

const ICONE_TIPO = { ver: Eye, escopo: UsersRound, criar: Plus, editar: Pencil, excluir: Trash2 };

function gerarSenhaTemporaria(): string {
  const letras = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const numeros = "23456789";
  const todos = letras + numeros;
  const bytes = new Uint32Array(10);
  crypto.getRandomValues(bytes);
  const escolher = (fonte: string, n: number) => fonte[n % fonte.length];
  const corpo = Array.from(bytes.slice(0, 8), (b) => escolher(todos, b)).join("");
  return `${corpo.slice(0, 4)}-${corpo.slice(4)}${escolher(numeros, bytes[8])}${escolher(letras, bytes[9])}`;
}

function Mensagem({ tipo, texto, erro }: { tipo: "erro" | "ok"; texto: string; erro?: unknown }) {
  if (tipo === "erro") return <AvisoErro erro={erro ?? texto} />;
  return (
    <p role="status" className="rounded-xl border border-leaf-200 bg-leaf-50 px-3.5 py-2.5 text-[0.8rem] font-semibold text-leaf-800">
      {texto}
    </p>
  );
}

function chamar(url: string, metodo: string, corpo: unknown) {
  return chamarApi<{ id: string }>(url, { method: metodo, json: corpo });
}

function CampoSenhaTemporaria({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div>
      <label className={labelCls}>Senha temporária</label>
      <div className="flex gap-2">
        <input className={`${inputCls} font-mono`} value={valor} onChange={(e) => onChange(e.target.value)} maxLength={128} placeholder="Mínimo 8 caracteres" autoComplete="off" />
        <button type="button" onClick={() => { onChange(gerarSenhaTemporaria()); setCopiado(false); }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3.5 text-[0.78rem] font-bold text-ink-700 hover:border-ink-300" title="Gerar senha segura">
          <Sparkles className="h-4 w-4 text-sun-600" /> Gerar
        </button>
        {valor && (
          <button type="button" onClick={async () => { await navigator.clipboard?.writeText(valor); setCopiado(true); }}
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-ink-200 bg-white px-3 text-ink-600 hover:border-ink-300" title="Copiar">
            {copiado ? <CheckCircle2 className="h-4 w-4 text-leaf-600" /> : <Copy className="h-4 w-4" />}
          </button>
        )}
      </div>
      <p className="mt-1.5 text-[0.72rem] text-ink-400">
        Entregue pessoalmente ao funcionário. No primeiro acesso ele será obrigado a criar uma senha própria.
      </p>
    </div>
  );
}

export function UsuarioForm({ usuario, ehProprio = false }: { usuario?: UsuarioEditavel; ehProprio?: boolean }) {
  const router = useRouter();
  const editando = !!usuario;
  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [login, setLogin] = useState(usuario?.login ?? "");
  const [cargo, setCargo] = useState(usuario?.cargo ?? "");
  const [acessoAte, setAcessoAte] = useState(usuario?.acessoAte ?? "");
  const [papel, setPapel] = useState<Papel>(usuario?.papel ?? "usuario");
  const [permissoes, setPermissoes] = useState<Permissao[]>(normalizarPermissoes(usuario?.permissoes ?? PERFIS[0].permissoes));
  const [senha, setSenha] = useState(editando ? "" : gerarSenhaTemporaria());
  const [enviando, setEnviando] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tipo: "erro" | "ok"; texto: string; erro?: unknown } | null>(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [senhaDefinida, setSenhaDefinida] = useState<string | null>(null);
  const [criado, setCriado] = useState<{ id: string; login: string; senha: string } | null>(null);

  const perfilAtual = useMemo(
    () => PERFIS.find((p) => {
      const a = normalizarPermissoes(p.permissoes);
      return a.length === permissoes.length && a.every((x) => permissoes.includes(x));
    })?.id ?? null,
    [permissoes],
  );

  function alternar(chave: Permissao) {
    setPermissoes((atual) => {
      if (atual.includes(chave)) {
        // Remover uma permissão remove também as que dependem dela.
        const dependentes = Object.entries(DEPENDENCIAS)
          .filter(([, deps]) => deps?.includes(chave))
          .map(([p]) => p);
        return atual.filter((p) => p !== chave && !dependentes.includes(p));
      }
      return normalizarPermissoes([...atual, chave]);
    });
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!nome.trim()) return setMsg({ tipo: "erro", texto: "Informe o nome completo." });
    if (!editando && !LOGIN_REGEX.test(login.trim().toLowerCase())) {
      return setMsg({ tipo: "erro", texto: "Usuário inválido: 3 a 32 caracteres (letras minúsculas, números, ponto, hífen ou sublinhado)." });
    }
    if (!editando && senha.length < 8) return setMsg({ tipo: "erro", texto: "A senha temporária precisa ter ao menos 8 caracteres." });
    if (papel === "usuario" && permissoes.length === 0) return setMsg({ tipo: "erro", texto: "Selecione ao menos uma permissão." });

    setEnviando("salvar");
    try {
      if (editando) {
        await chamar(`/api/usuarios/${usuario.id}`, "PATCH", { nome, cargo, papel, permissoes, acessoAte });
        setMsg({ tipo: "ok", texto: "Alterações salvas. Elas valem imediatamente para o usuário." });
        router.refresh();
      } else {
        const json = await chamar("/api/usuarios", "POST", {
          nome, login: login.trim().toLowerCase(), cargo, papel, permissoes, acessoAte, senhaTemporaria: senha,
        });
        // A senha é mostrada só nesta tela (nunca em URL, histórico ou logs).
        setCriado({ id: json.id, login: login.trim().toLowerCase(), senha });
        setEnviando(null);
        return;
      }
    } catch (err) {
      setMsg({ tipo: "erro", texto: "", erro: err });
    }
    setEnviando(null);
  }

  async function acaoStatus(acao: "ativar" | "desativar" | "desbloquear") {
    if (!usuario) return;
    if (acao === "desativar" && !confirm(`Desativar ${usuario.nome}? O acesso será bloqueado imediatamente em todos os aparelhos. Os registros feitos por ele serão preservados.`)) return;
    setEnviando(acao);
    setMsg(null);
    try {
      await chamar(`/api/usuarios/${usuario.id}`, "PATCH", acao === "desbloquear" ? { acao } : { ativo: acao === "ativar" });
      setMsg({ tipo: "ok", texto: acao === "desbloquear" ? "Usuário desbloqueado." : acao === "ativar" ? "Usuário reativado." : "Usuário desativado." });
      router.refresh();
    } catch (err) {
      setMsg({ tipo: "erro", texto: "", erro: err });
    }
    setEnviando(null);
  }

  async function redefinirSenha() {
    if (!usuario || novaSenha.length < 8) return setMsg({ tipo: "erro", texto: "Gere ou digite uma senha temporária de ao menos 8 caracteres." });
    setEnviando("senha");
    setMsg(null);
    try {
      await chamar(`/api/usuarios/${usuario.id}/senha`, "POST", { senhaTemporaria: novaSenha });
      setSenhaDefinida(novaSenha);
      setNovaSenha("");
      router.refresh();
    } catch (err) {
      setMsg({ tipo: "erro", texto: "", erro: err });
    }
    setEnviando(null);
  }

  if (criado) {
    return (
      <div className="animate-pop rounded-2xl border border-leaf-200 bg-card p-6 shadow-card">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-leaf-100 text-leaf-700">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h2 className="font-display mt-3 text-lg font-bold text-ink-900">Usuário criado com sucesso</h2>
        <p className="mt-1 text-[0.84rem] text-ink-500">
          Entregue estes dados pessoalmente ao funcionário. A senha não será exibida novamente.
        </p>
        <dl className="mt-4 grid gap-3 rounded-xl bg-paper p-4 sm:grid-cols-2">
          <div>
            <dt className="text-[0.66rem] font-bold uppercase tracking-wider text-ink-400">Usuário</dt>
            <dd className="select-all font-mono text-lg font-bold text-ink-900">{criado.login}</dd>
          </div>
          <div>
            <dt className="text-[0.66rem] font-bold uppercase tracking-wider text-ink-400">Senha temporária</dt>
            <dd className="select-all font-mono text-lg font-bold text-ink-900">{criado.senha}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[0.76rem] text-ink-500">No primeiro acesso, o sistema exigirá a criação de uma senha pessoal.</p>
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <button type="button" onClick={() => router.push(`/usuarios/${criado.id}`)}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-ink-900 text-[0.86rem] font-bold text-white hover:bg-ink-800">
            Ver usuário
          </button>
          <button type="button" onClick={() => router.push("/usuarios")}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-ink-200 bg-white text-[0.86rem] font-bold text-ink-700 hover:border-ink-300">
            Voltar à lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form onSubmit={salvar} className="space-y-5">
        {/* ——— Dados ——— */}
        <section className="rounded-2xl border border-ink-100/80 bg-card p-5 shadow-card sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-[0.98rem] font-bold text-ink-900">
            <UserRound className="h-4.5 w-4.5 text-brand-600" /> Dados do funcionário
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Nome completo *</label>
              <input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} />
            </div>
            <div>
              <label className={labelCls}>Usuário de acesso *</label>
              <input
                className={`${inputCls} font-mono`}
                value={login}
                disabled={editando}
                onChange={(e) => setLogin(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                placeholder="ex.: maria.silva"
                maxLength={32}
                autoCapitalize="none"
              />
              {editando && <p className="mt-1 text-[0.7rem] text-ink-400">O usuário não pode ser alterado (preserva o histórico).</p>}
            </div>
            <div>
              <label className={labelCls}>Cargo / função</label>
              <input className={inputCls} value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="ex.: Assistente Social" maxLength={120} />
            </div>
            {papel === "usuario" && (
              <div className="sm:col-span-2">
                <label className={labelCls}>Acesso válido até (opcional)</label>
                <div className="flex flex-wrap items-center gap-2">
                  <input type="date" className={`${inputCls} max-w-56`} value={acessoAte} onChange={(e) => setAcessoAte(e.target.value)} />
                  {acessoAte && (
                    <button type="button" onClick={() => setAcessoAte("")} className="text-[0.76rem] font-bold text-ink-500 hover:text-ink-800">
                      Remover prazo
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-[0.72rem] text-ink-400">
                  Para equipes temporárias (ex.: reforço na Festa do Peão, estagiários). Após essa data o acesso é
                  bloqueado automaticamente, sem precisar desativar.
                </p>
              </div>
            )}
            {!editando && (
              <div className="sm:col-span-2">
                <CampoSenhaTemporaria valor={senha} onChange={setSenha} />
              </div>
            )}
          </div>
        </section>

        {/* ——— Nível de acesso ——— */}
        <section className="rounded-2xl border border-ink-100/80 bg-card p-5 shadow-card sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-[0.98rem] font-bold text-ink-900">
            <ShieldCheck className="h-4.5 w-4.5 text-brand-600" /> Nível de acesso
          </h2>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {([
              { v: "usuario", t: "Usuário", d: "Acessa somente o que for liberado abaixo." },
              { v: "admin", t: "Administrador", d: "Acesso total, gestão de usuários e auditoria." },
            ] as const).map((op) => (
              <button
                key={op.v}
                type="button"
                disabled={ehProprio}
                onClick={() => setPapel(op.v)}
                className={`rounded-xl border p-3.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                  papel === op.v ? (op.v === "admin" ? "border-sun-400 bg-sun-50 ring-2 ring-sun-100" : "border-brand-400 bg-brand-50 ring-2 ring-brand-100") : "border-ink-100 bg-white hover:border-ink-200"
                }`}
              >
                <span className="block text-[0.86rem] font-bold text-ink-900">{op.t}</span>
                <span className="mt-0.5 block text-[0.74rem] text-ink-500">{op.d}</span>
              </button>
            ))}
          </div>
          {ehProprio && <p className="mt-2 text-[0.72rem] text-ink-400">Você não pode alterar o seu próprio nível de acesso.</p>}

          {papel === "admin" ? (
            <div className="mt-4 rounded-xl border border-sun-200 bg-sun-50 p-4 text-[0.8rem] leading-relaxed text-sun-900">
              <strong>Administradores têm acesso completo</strong>: visualizar, cadastrar, editar e excluir fichas,
              evoluções e veículos; relatórios; criação de usuários, definição de permissões e trilha de auditoria.
              Conceda apenas a quem é responsável pelo sistema.
            </div>
          ) : (
            <>
              <p className="mb-2 mt-5 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-ink-400">Perfis prontos (ajuste depois se quiser)</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {PERFIS.map((p) => (
                  <button key={p.id} type="button" onClick={() => setPermissoes(normalizarPermissoes(p.permissoes))}
                    className={`rounded-xl border p-3 text-left transition-all ${perfilAtual === p.id ? "border-leaf-400 bg-leaf-50 ring-2 ring-leaf-100" : "border-ink-100 bg-white hover:border-ink-200"}`}>
                    <span className="block text-[0.8rem] font-bold text-ink-900">{p.nome}</span>
                    <span className="mt-0.5 block text-[0.7rem] leading-snug text-ink-500">{p.descricao}</span>
                  </button>
                ))}
              </div>

              <p className="mb-2 mt-5 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-ink-400">
                Permissões detalhadas {perfilAtual === null && <span className="ml-1 rounded bg-ink-100 px-1.5 py-0.5 normal-case tracking-normal text-ink-600">personalizado</span>}
              </p>
              <div className="space-y-3">
                {MODULOS.map((m) => (
                  <div key={m.id} className="rounded-xl border border-ink-100 p-3.5">
                    <p className="text-[0.84rem] font-bold text-ink-900">{m.titulo}</p>
                    <p className="text-[0.72rem] text-ink-400">{m.descricao}</p>
                    <div className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      {m.acoes.map((a) => {
                        const ativo = permissoes.includes(a.chave);
                        const Icone = ICONE_TIPO[a.tipo];
                        const perigo = a.tipo === "excluir";
                        return (
                          <button key={a.chave} type="button" role="switch" aria-checked={ativo} onClick={() => alternar(a.chave)}
                            className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-all ${
                              ativo ? (perigo ? "border-red-300 bg-red-50" : "border-leaf-400 bg-leaf-50") : "border-ink-100 bg-white hover:border-ink-200"
                            }`}>
                            <span className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${ativo ? (perigo ? "bg-red-500" : "bg-leaf-500") : "bg-ink-200"}`}>
                              <span className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${ativo ? "translate-x-4" : ""}`} />
                            </span>
                            <span className="min-w-0">
                              <span className="flex items-center gap-1 text-[0.78rem] font-bold text-ink-900">
                                <Icone className="h-3.5 w-3.5 text-ink-400" /> {a.rotulo}
                              </span>
                              <span className="block text-[0.68rem] leading-snug text-ink-500">{a.detalhe}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[0.7rem] text-ink-400">
                Dependências são aplicadas automaticamente (ex.: “Editar fichas” exige “Visualizar fichas”).
              </p>
            </>
          )}
        </section>

        {msg && <Mensagem {...msg} />}
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <button type="submit" disabled={!!enviando}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-ink-900 px-6 text-[0.88rem] font-bold text-white shadow-lift transition-all hover:bg-ink-800 active:scale-[0.98] disabled:opacity-60">
            {enviando === "salvar" && <Loader2 className="h-4 w-4 animate-spin" />}
            {editando ? "Salvar alterações" : "Criar usuário"}
          </button>
          <button type="button" onClick={() => router.push("/usuarios")}
            className="inline-flex h-12 items-center justify-center rounded-xl border border-ink-200 bg-white px-6 text-[0.86rem] font-bold text-ink-600 hover:border-ink-300">
            Voltar
          </button>
        </div>
      </form>

      {editando && usuario && (
        <>
          {/* ——— Senha ——— */}
          <section className="rounded-2xl border border-ink-100/80 bg-card p-5 shadow-card sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-[0.98rem] font-bold text-ink-900">
              <KeyRound className="h-4.5 w-4.5 text-brand-600" /> Redefinir senha
            </h2>
            <p className="mt-1 text-[0.8rem] text-ink-500">
              Use quando o funcionário esquecer a senha. Ele será desconectado e deverá criar uma nova senha no próximo acesso.
            </p>
            {senhaDefinida ? (
              <div className="mt-4 rounded-xl border border-leaf-200 bg-leaf-50 p-4">
                <p className="text-[0.82rem] font-bold text-leaf-800">Senha temporária definida:</p>
                <p className="mt-1 select-all font-mono text-lg font-bold text-ink-900">{senhaDefinida}</p>
                <p className="mt-1 text-[0.72rem] text-leaf-800">Anote e entregue pessoalmente. Ela não será exibida novamente.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <CampoSenhaTemporaria valor={novaSenha} onChange={setNovaSenha} />
                <button type="button" onClick={redefinirSenha} disabled={!!enviando}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-ink-200 bg-white px-5 text-[0.84rem] font-bold text-ink-800 hover:border-ink-300 disabled:opacity-60">
                  {enviando === "senha" ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Redefinir senha
                </button>
              </div>
            )}
          </section>

          {/* ——— Status ——— */}
          <section className="rounded-2xl border border-ink-100/80 bg-card p-5 shadow-card sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-[0.98rem] font-bold text-ink-900">
              <Power className="h-4.5 w-4.5 text-brand-600" /> Situação do acesso
            </h2>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {usuario.bloqueado && (
                <button type="button" onClick={() => acaoStatus("desbloquear")} disabled={!!enviando}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-[0.84rem] font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                  <LockOpen className="h-4 w-4" /> Desbloquear acesso
                </button>
              )}
              {usuario.ativo ? (
                <button type="button" onClick={() => acaoStatus("desativar")} disabled={!!enviando || ehProprio}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 text-[0.84rem] font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50">
                  <Lock className="h-4 w-4" /> Desativar usuário
                </button>
              ) : (
                <button type="button" onClick={() => acaoStatus("ativar")} disabled={!!enviando}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-leaf-600 px-5 text-[0.84rem] font-bold text-white hover:bg-leaf-700 disabled:opacity-60">
                  <Power className="h-4 w-4" /> Reativar usuário
                </button>
              )}
            </div>
            <p className="mt-2.5 text-[0.72rem] text-ink-400">
              Usuários não são excluídos: a desativação bloqueia o acesso e preserva a autoria dos registros para auditoria.
              {ehProprio && " Você não pode desativar a si mesmo."}
            </p>
          </section>
        </>
      )}
    </div>
  );
}

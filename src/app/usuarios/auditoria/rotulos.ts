export const ROTULOS_ACAO: Record<string, string> = {
  "login.sucesso": "Entrou no sistema",
  "login.falha": "Tentativa de acesso recusada",
  "login.bloqueio": "Acesso bloqueado por tentativas",
  logout: "Saiu do sistema",
  "senha.alterada": "Alterou a própria senha",
  "ficha.criada": "Cadastrou ficha",
  "ficha.editada": "Editou ficha",
  "ficha.excluida": "Excluiu ficha",
  "evolucao.criada": "Registrou evolução",
  "evolucao.excluida": "Excluiu evolução",
  "veiculo.saida": "Registrou saída de veículo",
  "veiculo.chegada": "Registrou chegada de veículo",
  "veiculo.excluido": "Excluiu lançamento de veículo",
  "relatorio.pdf": "Gerou relatório PDF",
  "relatorio.csv": "Exportou planilha CSV",
  "usuario.criado": "Criou usuário",
  "usuario.editado": "Alterou usuário/permissões",
  "usuario.desativado": "Desativou usuário",
  "usuario.reativado": "Reativou usuário",
  "usuario.desbloqueado": "Desbloqueou usuário",
  "usuario.senha_redefinida": "Redefiniu senha de usuário",
};

export function rotuloAcao(acao: string): string {
  return ROTULOS_ACAO[acao] ?? acao;
}

export function tomAcao(acao: string): string {
  if (acao.endsWith("excluida") || acao.endsWith("excluido") || acao === "login.bloqueio" || acao === "usuario.desativado") {
    return "bg-red-100 text-red-700";
  }
  if (acao === "login.falha") return "bg-sun-100 text-sun-700";
  if (acao.startsWith("usuario.") || acao.startsWith("senha.")) return "bg-brand-100 text-brand-700";
  if (acao.startsWith("relatorio.")) return "bg-ink-100 text-ink-700";
  return "bg-leaf-100 text-leaf-700";
}

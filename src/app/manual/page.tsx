import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CircleHelp,
  ClipboardPlus,
  Files,
  History,
  House,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Printer,
  ShieldCheck,
  Smartphone,
  Truck,
} from "lucide-react";
import { BotaoImprimirManual } from "./botao-imprimir-manual";
import { exigirUsuario } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Manual do Usuário",
  description:
    "Aprenda a usar o sistema do Instituto PróFamília: nova ficha, evoluções, veículo, impressão e relatórios.",
};

const INDICE = [
  { n: "1", href: "#primeiros-passos", label: "Primeiros passos e instalação" },
  { n: "2", href: "#inicio", label: "Tela inicial" },
  { n: "3", href: "#nova-ficha", label: "Nova ficha de atendimento" },
  { n: "4", href: "#fichas", label: "Fichas e evoluções" },
  { n: "5", href: "#veiculo", label: "Controle de veículo" },
  { n: "6", href: "#impressao", label: "Impressão da ficha" },
  { n: "7", href: "#gerencia", label: "Gerência e relatórios" },
  { n: "8", href: "#problemas", label: "Solução de problemas" },
  { n: "9", href: "#cuidados", label: "Cuidados com os dados" },
  { n: "10", href: "#glossario", label: "Glossário de siglas" },
  { n: "11", href: "#acesso", label: "Acesso, senha e permissões" },
  { n: "12", href: "#administracao", label: "Administração de usuários" },
];

function Secao({
  numero,
  id,
  titulo,
  icone: Icone,
  children,
}: {
  numero: string;
  id: string;
  titulo: string;
  icone: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-ink-100/80 bg-card p-5 shadow-card sm:p-6"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 font-display text-sm font-bold text-brand-700">
          {numero}
        </span>
        <Icone className="h-5 w-5 text-brand-600" />
        <h2 className="font-display text-base font-bold text-ink-900 sm:text-lg">
          {titulo}
        </h2>
      </div>
      <div className="mt-4 space-y-3 text-[0.86rem] leading-relaxed text-ink-700">
        {children}
      </div>
    </section>
  );
}

function Passo({ n, titulo, texto }: { n: string; titulo: string; texto: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-ink-100 bg-paper/60 p-3.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-900 font-display text-xs font-bold text-white">
        {n}
      </span>
      <div>
        <p className="font-bold text-ink-900">{titulo}</p>
        <p className="mt-0.5 text-[0.82rem] text-ink-600">{texto}</p>
      </div>
    </div>
  );
}

function Dica({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-leaf-200 bg-leaf-50 p-3.5 text-[0.82rem] text-leaf-900">
      <span className="font-bold">💡 Dica: </span>
      {children}
    </div>
  );
}

function Atencao({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-sun-300 bg-sun-50 p-3.5 text-[0.82rem] text-sun-900">
      <span className="font-bold">⚠️ Atenção: </span>
      {children}
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function ManualPage() {
  await exigirUsuario();
  return (
    <div className="space-y-5">
      {/* ——— Cabeçalho ——— */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-brand-600">
            <LifeBuoy className="h-4 w-4" />
            Central de ajuda
          </div>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Manual do usuário
          </h1>
          <p className="mt-1 max-w-xl text-[0.84rem] text-ink-500">
            Tudo o que a equipe de campo e a coordenação precisam para usar o
            sistema no celular e no computador.
          </p>
        </div>
        <BotaoImprimirManual />
      </div>

      {/* ——— Índice ——— */}
      <nav className="no-print rounded-2xl border border-ink-100/80 bg-card p-4 shadow-card">
        <p className="mb-2.5 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-ink-400">
          Neste manual
        </p>
        <ol className="grid gap-1.5 sm:grid-cols-2">
          {INDICE.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.82rem] font-semibold text-ink-600 transition-colors hover:bg-ink-50 hover:text-brand-700"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink-100 font-display text-[0.7rem] font-bold text-ink-600">
                  {item.n}
                </span>
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <Secao numero="1" id="primeiros-passos" titulo="Primeiros passos e instalação" icone={Smartphone}>
        <p>
          O sistema funciona no navegador do celular e do computador, sem
          instalar nada pela loja de aplicativos. Basta abrir o endereço do
          sistema e começar a usar.
        </p>
        <Passo
          n="1"
          titulo="No celular: adicione à tela inicial"
          texto="Android (Chrome): abra o menu ⋮ e toque em “Adicionar à tela inicial” ou “Instalar aplicativo”. iPhone (Safari): toque em Compartilhar e depois em “Adicionar à Tela de Início”. O sistema ganha ícone próprio e abre em tela cheia, como um aplicativo."
        />
        <Passo
          n="2"
          titulo="No computador: favorite o endereço"
          texto="Salve o endereço nos favoritos do navegador para acesso rápido na sede."
        />
        <Dica>
          Cada profissional deve informar o próprio nome nos campos
          “Profissional responsável” e “Responsável pelo registro” — é assim que
          a gerência sabe quem fez cada atendimento.
        </Dica>
      </Secao>

      <Secao numero="2" id="inicio" titulo="Tela inicial" icone={House}>
        <p>
          A tela <strong>Início</strong> mostra o resumo do trabalho: fichas
          feitas hoje, total de fichas, pessoas em acompanhamento e em situação
          de rua, além das fichas mais recentes e dos quilômetros rodados no mês.
        </p>
        <p>
          O botão laranja <strong>“Nova ficha de atendimento”</strong> é o
          atalho principal da equipe de campo. Os botões abaixo levam às fichas,
          ao veículo, às diretrizes e à gerência.
        </p>
      </Secao>

      <Secao numero="3" id="nova-ficha" titulo="Nova ficha de atendimento" icone={ClipboardPlus}>
        <p>
          A ficha é preenchida em <strong>6 etapas</strong>, uma tela de cada
          vez. Você pode voltar às etapas anteriores tocando no nome da etapa no
          topo. Só é possível avançar quando os campos obrigatórios (marcados
          com <span className="font-bold text-sun-600">*</span>) estiverem
          preenchidos.
        </p>
        <Passo
          n="1"
          titulo="Atendimento"
          texto="Data e hora (já vêm preenchidas), local da abordagem, ponto de referência, profissional responsável, equipe e motivo da abordagem."
        />
        <Passo
          n="2"
          titulo="Identificação"
          texto="Nome completo (obrigatório), nome social, nascimento, idade, telefone, filiação, sexo/identidade autodeclarada, estado civil, naturalidade, documentos e situação da documentação."
        />
        <Passo
          n="3"
          titulo="Situação"
          texto="Situações identificadas (pode marcar várias), detalhes da situação de rua quando houver, vínculos familiares e condição de moradia."
        />
        <Passo
          n="4"
          titulo="Saúde e perfil"
          texto="Condições de saúde, medicação, necessidade de atendimento imediato, uso de álcool/drogas, escolaridade, renda e benefícios sociais."
        />
        <Passo
          n="5"
          titulo="Ações"
          texto="Demandas identificadas, providências adotadas, procedimentos, encaminhamentos e necessidade de acompanhamento."
        />
        <Passo
          n="6"
          titulo="Finalizar"
          texto="Responsável pelo registro, assinatura da pessoa atendida na tela (quando possível) e conferência do resumo antes de salvar."
        />
        <Dica>
          O preenchimento é <strong>salvo automaticamente no aparelho</strong> a
          cada etapa. Se a internet cair ou o celular descarregar, ao voltar o
          sistema recupera o rascunho de onde você parou.
        </Dica>
        <Atencao>
          Preencha com calma os campos de <strong>sexo/identidade</strong>:
          pergunte com respeito como a pessoa se identifica, sem presumir pela
          aparência. Se ela preferir não informar, existe opção própria para isso.
        </Atencao>
      </Secao>

      <Secao numero="4" id="fichas" titulo="Fichas e evoluções" icone={Files}>
        <p>
          Em <strong>Fichas</strong> você consulta tudo o que foi registrado.
          Use a busca por nome, CPF, local ou profissional, e os filtros por
          situação, motivo e período.
        </p>
        <p>
          Tocando em uma ficha, você vê todos os dados e, ao final, a{" "}
          <strong>Evolução do caso</strong> — o histórico de acompanhamentos.
          Para registrar uma evolução, escreva o que aconteceu, informe seu nome
          e cargo e toque em “Registrar evolução”. Cada evolução guarda data,
          hora e responsável automaticamente.
        </p>
        <div className="flex items-center gap-2 rounded-xl border border-ink-100 bg-paper/60 p-3.5 text-[0.82rem]">
          <History className="h-5 w-5 shrink-0 text-brand-600" />
          <span>
            <strong>Boa prática:</strong> registre a evolução no mesmo dia do
            contato, enquanto os detalhes estão frescos — contatos realizados,
            providências e próximos passos.
          </span>
        </div>
      </Secao>

      <Secao numero="5" id="veiculo" titulo="Controle de veículo" icone={Truck}>
        <Passo
          n="1"
          titulo="Registrar a saída"
          texto="Toque em “Registrar saída de veículo”, escolha o veículo da frota (os que estão em rota aparecem bloqueados), confira data e hora, informe o motorista, o KM do hodômetro e o destino da ronda. Vários veículos podem estar em rota ao mesmo tempo."
        />
        <Passo
          n="2"
          titulo="Durante a ronda"
          texto="O sistema mostra o banner “Veículo em rota agora”. Enquanto houver saída em aberto, não é possível registrar outra saída."
        />
        <Passo
          n="3"
          titulo="Registrar a chegada"
          texto="No mesmo banner, informe hora, KM atual e local de chegada, e toque em “Concluir percurso”. O sistema calcula os quilômetros rodados."
        />
        <Passo
          n="4"
          titulo="Frota e correções"
          texto="Na aba “Frota” você consulta cada veículo (placa, KM atual, saídas, último uso). Conforme a sua permissão, é possível cadastrar veículos, editar seus dados, desativá-los (o histórico é mantido) e corrigir lançamentos pelo ícone de lápis no histórico — toda correção fica registrada na auditoria."
        />
        <Atencao>
          O KM de saída nunca pode ser menor que o último registro do veículo,
          e o KM de chegada nunca menor que o da saída. Se o sistema recusar,
          confira o hodômetro antes de tentar de novo.
        </Atencao>
      </Secao>

      <Secao numero="6" id="impressao" titulo="Impressão da ficha" icone={Printer}>
        <p>
          Dentro de qualquer ficha, o botão <strong>“Versão para impressão”</strong>{" "}
          abre o documento formal com cabeçalho do Instituto PróFamília e da
          Prefeitura de Barretos. Use <strong>“Imprimir / salvar PDF”</strong>{" "}
          para imprimir ou gerar o arquivo PDF.
        </p>
        <Dica>
          A impressão inclui todos os campos da ficha, as evoluções e a
          assinatura coletada na tela — pronta para arquivar ou anexar a
          processos.
        </Dica>
      </Secao>

      <Secao numero="7" id="gerencia" titulo="Gerência e relatórios" icone={LayoutDashboard}>
        <p>
          A área de <strong>Gerência</strong> é o painel da coordenação. No topo,
          escolha o <strong>período</strong> (30 dias, 90 dias, 1 ano, tudo ou
          datas personalizadas). Tudo na tela — números, gráficos e documentos —
          passa a refletir esse período.
        </p>
        <Passo
          n="1"
          titulo="Indicadores e gráficos"
          texto="Acompanhe atendimentos, pessoas identificadas, situações, demandas, encaminhamentos, perfil (sexo, idade, escolaridade, moradia), documentação, benefícios e atuação por profissional e equipe."
        />
        <Passo
          n="2"
          titulo="Relatórios em PDF"
          texto="Na seção “Relatórios profissionais em PDF”, escolha o conteúdo: Completo (tudo), Indicadores e análise (só estatísticas, sem nomes), Prontuários e evoluções (fichas na íntegra) ou Controle de veículo. Depois toque em “Exportar PDF” para baixar ou “Abrir para imprimir”."
        />
        <Passo
          n="3"
          titulo="Planilha CSV"
          texto="O botão “Exportar CSV” baixa todos os registros do período para abrir no Excel — ideal para análises próprias e prestações de contas."
        />
        <Atencao>
          Relatórios com nomes (Completo e Prontuários) contêm dados pessoais e
          sensíveis: só compartilhe com pessoas autorizadas. Para divulgações
          gerais, prefira o relatório de Indicadores.
        </Atencao>
      </Secao>

      <Secao numero="8" id="problemas" titulo="Solução de problemas" icone={CircleHelp}>
        <div className="space-y-2.5">
          {[
            ["Fiquei sem internet no meio da ficha", "Não se preocupe: o rascunho fica salvo no aparelho. Quando a conexão voltar, abra “Nova ficha” e continue de onde parou."],
            ["Apareceu “Preencha antes de avançar”", "Volte à etapa indicada e complete os campos marcados com *. Os mais esquecidos são local da abordagem e profissional responsável."],
            ["O KM foi recusado no veículo", "Confira o número digitado no hodômetro. O sistema bloqueia KM menor que o registro anterior para proteger o histórico."],
            ["Não consigo registrar outra saída", "Existe um percurso em aberto. Registre a chegada do percurso atual primeiro — o banner “Em rota” mostra qual é."],
            ["O PDF do relatório não abre", "Em períodos muito longos, os relatórios nominais podem ficar indisponíveis por lentidão. Reduza o período ou use o relatório de Indicadores e o CSV."],
            ["O relatório mostra erro de conexão com o banco", "Aguarde cerca de 30 segundos e toque de novo em Exportar: a primeira geração do dia pode demorar enquanto o banco de dados é ativado. Se o erro continuar, confira a internet e avise a coordenação."],
            ["A tela mostra erro ao carregar", "Verifique a internet e toque em “Tentar novamente”. Se persistir, anote o código do erro exibido na tela e avise a coordenação."],
          ].map(([titulo, texto]) => (
            <div key={titulo} className="rounded-xl border border-ink-100 bg-paper/60 p-3.5">
              <p className="font-bold text-ink-900">{titulo}</p>
              <p className="mt-0.5 text-[0.82rem] text-ink-600">{texto}</p>
            </div>
          ))}
        </div>
      </Secao>

      <Secao numero="9" id="cuidados" titulo="Cuidados com os dados" icone={ShieldCheck}>
        <p>
          O sistema guarda informações pessoais e sensíveis de pessoas em
          situação de vulnerabilidade. Alguns cuidados são obrigatórios:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-[0.82rem]">
          <li>Não compartilhe fichas, PDFs nominais ou impressões com quem não é da equipe autorizada.</li>
          <li>Não fotografe a tela com dados pessoais para enviar por aplicativos de mensagem.</li>
          <li>Guarde impressões em local fechado e descarte sobras em fragmentadora ou picando o papel.</li>
          <li>Em computadores compartilhados, feche a aba do sistema ao terminar o uso.</li>
          <li>Registre apenas informações verdadeiras e observadas — sem julgamentos ou suposições.</li>
        </ul>
      </Secao>

      <Secao numero="10" id="glossario" titulo="Glossário de siglas" icone={BookOpen}>
        <dl className="grid gap-2 sm:grid-cols-2">
          {[
            ["RBSV", "Na rua de Barretos, SEM vínculo familiar"],
            ["RBCV", "Na rua de Barretos, COM vínculo familiar"],
            ["RNB", "Não barretense, na cidade há mais de 6 meses"],
            ["BPC", "Benefício de Prestação Continuada (idosos e pessoas com deficiência)"],
            ["NIS", "Número de Identificação Social (Cadastro Único)"],
            ["CRAS", "Centro de Referência de Assistência Social (proteção básica)"],
            ["CREAS", "Centro de Referência Especializado (proteção especial)"],
            ["CAPS / CAPS AD", "Centro de Atenção Psicossocial (AD: álcool e drogas)"],
            ["UBS / UPA", "Unidade Básica de Saúde / Unidade de Pronto Atendimento"],
            ["SUS / INSS", "Sistema Único de Saúde / Instituto Nacional do Seguro Social"],
          ].map(([sigla, significado]) => (
            <div key={sigla} className="rounded-xl border border-ink-100 bg-paper/60 p-3">
              <dt className="font-display text-[0.85rem] font-bold text-brand-700">{sigla}</dt>
              <dd className="mt-0.5 text-[0.78rem] text-ink-600">{significado}</dd>
            </div>
          ))}
        </dl>
      </Secao>

      <Secao numero="11" id="acesso" titulo="Acesso, senha e permissões" icone={KeyRound}>
        <p>
          Cada funcionário tem <strong>usuário e senha próprios</strong>, criados pelo administrador.
          No <strong>primeiro acesso</strong>, use a senha temporária recebida — o sistema pedirá
          imediatamente que você crie uma senha pessoal (mínimo 8 caracteres, com letras e números).
        </p>
        <Passo n="1" titulo="Manter conectado (somente aparelho pessoal)" texto="Na tela de login, marque “Manter conectado neste aparelho” para continuar acessando por até 30 dias. Isso mantém a sessão, nunca a senha. Não marque em computador compartilhado; sem marcar, a sessão termina ao fechar o navegador (ou em até 12 horas)." />
        <Passo n="2" titulo="Alterar a senha a qualquer momento" texto="Toque no seu nome (no topo, no celular; embaixo do menu, no computador) → “Alterar minha senha”. Os outros aparelhos conectados serão desconectados por segurança." />
        <Passo n="2" titulo="Sair do sistema" texto="Toque no seu nome → “Sair”. Faça isso sempre em computadores compartilhados. A sessão também expira sozinha após 12 horas." />
        <Passo n="3" titulo="O que eu posso fazer?" texto="O menu mostra apenas as áreas liberadas para o seu perfil. Botões como Editar e Excluir só aparecem para quem tem essa permissão. Se precisar de um acesso, peça ao administrador." />
        <Passo n="5" titulo="Minha conta e acessos" texto="Toque no seu nome → “Minha conta e acessos” para ver exatamente o que o seu perfil permite, a validade do seu acesso e os aparelhos conectados — com a opção de encerrar as sessões dos outros aparelhos." />
        <Passo n="6" titulo="Fichas que você vê" texto="Dependendo do perfil, você vê as fichas de toda a equipe ou somente as que você cadastrou. Nesse segundo caso, a tela de Fichas avisa isso no topo." />
        <Atencao>
          Após <strong>5 senhas erradas seguidas</strong>, o acesso fica bloqueado por 15 minutos. Esqueceu a senha? O
          administrador pode redefini-la. Nunca compartilhe sua senha: tudo o que é registrado fica em seu nome.
        </Atencao>
      </Secao>

      <Secao numero="12" id="administracao" titulo="Administração de usuários (somente administrador)" icone={ShieldCheck}>
        <p>
          No menu <strong>Usuários e acessos</strong>, o administrador cadastra funcionários e define exatamente o que
          cada um pode <strong>visualizar, cadastrar, editar e excluir</strong>.
        </p>
        <Passo n="1" titulo="Primeiro acesso do sistema" texto="Na primeira vez, entre com usuário “admin” e senha “admin” e crie imediatamente a senha definitiva do administrador." />
        <Passo n="2" titulo="Novo usuário" texto="Informe nome, usuário de acesso e cargo; escolha um perfil pronto (Equipe de campo, Coordenação, Motorista ou Somente leitura) e ajuste as permissões por módulo. Gere a senha temporária e entregue pessoalmente — ela aparece uma única vez." />
        <Passo n="3" titulo="Manutenção" texto="Na ficha do usuário é possível alterar permissões (valem na hora), redefinir a senha, desbloquear após tentativas erradas e desativar o acesso. Usuários não são excluídos: a desativação preserva a autoria dos registros." />
        <Passo n="4" titulo="Auditoria" texto="A aba Auditoria mostra quem entrou, cadastrou, editou, excluiu ou exportou dados, com data, hora e origem. Use os filtros por usuário, tipo de ação e período." />
        <Passo n="5" titulo="Escopo das fichas" texto="A permissão “Fichas: Toda a equipe” libera as fichas de todos os profissionais. Sem ela, o usuário vê, edita e evolui apenas as fichas que ele cadastrou. Relatórios nominais (PDF Completo/Prontuários e CSV) exigem essa permissão." />
        <Passo n="6" titulo="Acesso temporário" texto="Para reforços sazonais (ex.: Festa do Peão) ou estagiários, use o perfil “Apoio temporário” e defina “Acesso válido até”. Após a data, o acesso é bloqueado automaticamente. Administradores nunca expiram." />
        <Passo n="7" titulo="Sessões e matriz de acessos" texto="Na ficha do usuário, veja os aparelhos conectados e encerre as sessões (ex.: celular perdido). A aba “Matriz de acessos” mostra todos os usuários ativos × permissões para revisões periódicas." />
        <Dica>
          Conceda o mínimo necessário para cada função. Permissões de <strong>excluir</strong> e de{" "}
          <strong>exportar relatórios</strong> devem ficar restritas à coordenação.
        </Dica>
      </Secao>

      {/* ——— Atalhos ——— */}
      <div className="no-print flex flex-col gap-3 sm:flex-row">
        <Link
          href="/nova"
          className="inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-ink-900 px-6 text-[0.88rem] font-bold text-white shadow-lift transition-all hover:bg-ink-800 active:scale-[0.98]"
        >
          Ir para Nova Ficha
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/guia"
          className="inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-2xl border border-ink-200 bg-white px-6 text-[0.88rem] font-bold text-ink-700 shadow-card transition-all hover:border-ink-300 active:scale-[0.98]"
        >
          <BookOpen className="h-4 w-4 text-sun-600" />
          Ver Diretrizes de Campo
        </Link>
      </div>
    </div>
  );
}

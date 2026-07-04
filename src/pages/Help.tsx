/**
 * ============================================================
 * PAGE: Help (Ajuda) - Corrigido para MainLayout
 * ============================================================
 *
 * Agora não há TopNavbar nem Sidebar dentro da página.
 * Todo o layout global é controlado pelo MainLayout.
 * A página contém apenas o conteúdo de ajuda.
 * ============================================================
 */

import React, { useState } from 'react';
import {
  ArrowRight,
  Bot,
  CheckCircle,
  HelpCircle,
  MessageCircle,
  Mail,
  ChevronDown,
  ChevronUp,
  Search,
  FileText,
  Book,
  Video,
  Lightbulb,
  LifeBuoy,
  Send
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { ActivityRow, PageHeader, PremiumPanel } from '@/components/premium/PremiumShell';

interface FaqItem {
  question: string;
  answer: string;
}

const Help: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs: FaqItem[] = [
    {
      question: 'Como faço para acessar os relatórios de uma empresa?',
      answer:
        'Navegue até a página "Empresas" no menu lateral, selecione a empresa desejada e siga a hierarquia: Superintendência > Gerência > Projeto > Indicador. Os relatórios estão vinculados aos indicadores.'
    },
    {
      question: 'Como funciona o sistema de aprovação de relatórios?',
      answer:
        'Os relatórios passam por um fluxo de aprovação onde supervisores das áreas podem aprovar, rejeitar ou solicitar revisões. Você pode acompanhar o status na aba "Validações".'
    },
    {
      question: 'Posso favoritar relatórios para acesso rápido?',
      answer:
        'Sim! Clique no ícone de coração em qualquer relatório para adicioná-lo aos seus favoritos. Acesse todos os favoritos pela opção "Favoritos" no menu.'
    },
    {
      question: 'O que é a ÍRIS e como ela pode me ajudar?',
      answer:
        'ÍRIS é nossa assistente virtual de busca semântica. Ela pode ajudá-lo a encontrar relatórios, indicadores e informações usando linguagem natural.'
    },
    {
      question: 'Como altero entre o tema claro e escuro?',
      answer:
        'Clique no ícone de sol/lua no canto superior direito da tela para alternar entre os temas claro e escuro.'
    },
    {
      question: 'Onde posso ver os relatórios mais acessados?',
      answer:
        'Acesse "Meu Workspace" no menu lateral. Lá você encontra o Top 5 relatórios mais vistos e pode abrir o painel de Ranking completo.'
    }
  ];

  const filteredFaqs = faqs.filter(
    faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const guides = [
    { icon: Book, title: 'Guia de Início Rápido', description: 'Aprenda o básico em 5 minutos' },
    { icon: FileText, title: 'Manual do Usuário', description: 'Documentação completa' },
    { icon: Video, title: 'Tutoriais em Vídeo', description: 'Aprenda visualmente' },
    { icon: Lightbulb, title: 'Dicas e Truques', description: 'Seja mais produtivo' }
  ];

  return (
    <>
      <div className="neo-page">
        <div className="neo-page-inner">
          <PageHeader
            icon={HelpCircle}
            title="Central de Ajuda"
            description="Estamos aqui para ajudar você a tirar o máximo do NeoView."
          />

          <section className="neo-page-header mb-6 overflow-hidden">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Como podemos ajudar você hoje?</h2>
                <div className="relative mt-5 max-w-3xl">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                  <Input
                    placeholder="Buscar guia, dúvida, recurso ou relatório..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="neo-control h-14 rounded-2xl pl-12 text-base"
                  />
                </div>
              </div>
              <div className="hidden rounded-full border border-primary/20 bg-primary/10 p-8 text-center text-primary lg:block">
                <LifeBuoy className="mx-auto h-20 w-20" />
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-6">
              <PremiumPanel title="Acesso rápido">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {guides.map((guide, index) => {
                    const Icon = guide.icon;
                    return (
                      <button key={guide.title} className="rounded-[22px] border border-border/70 bg-background/55 p-5 text-left transition-colors hover:border-primary/30 dark:bg-white/[0.035]">
                        <Icon className={`mb-5 h-7 w-7 ${index === 0 ? 'text-emerald-500' : index === 1 ? 'text-sky-500' : index === 2 ? 'text-violet-500' : 'text-amber-500'}`} />
                        <h3 className="font-semibold text-foreground">{guide.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{guide.description}</p>
                        <ArrowRight className="mt-5 h-5 w-5 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </PremiumPanel>

              <PremiumPanel title="Perguntas frequentes" actionLabel="Ver todas as perguntas">
                <div className="space-y-2">
                  {filteredFaqs.map((faq, index) => (
                    <div key={faq.question} className="overflow-hidden rounded-xl border border-border/70 bg-background/55 dark:bg-white/[0.03]">
                      <button
                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                        className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-muted/50"
                      >
                        <span className="font-medium text-foreground">{faq.question}</span>
                        {openFaq === index ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                      </button>
                      {openFaq === index && <div className="px-4 pb-4 text-sm leading-6 text-muted-foreground">{faq.answer}</div>}
                    </div>
                  ))}
                </div>
              </PremiumPanel>
            </div>

            <aside className="space-y-6">
              <PremiumPanel title="IRIS · Assistente NeoView" description="Assistente inteligente para dúvidas, relatórios e indicadores.">
                <div className="flex gap-3 rounded-2xl border border-border/70 bg-background/55 p-4 dark:bg-white/[0.035]">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Bot className="h-6 w-6" />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Olá! Posso ajudar a encontrar relatórios, entender indicadores e tirar dúvidas sobre o sistema.
                  </p>
                </div>
                <button className="mt-4 flex w-full items-center justify-between rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
                  Pergunte algo para a IRIS
                  <Send className="h-4 w-4" />
                </button>
              </PremiumPanel>

              <PremiumPanel title="Fale com o suporte" description="Nossa equipe está pronta para ajudar você.">
                <div className="space-y-3">
                  <ActivityRow icon={Mail} title="suporte@neoenergia.com" subtitle="Resposta em até 2h úteis" tone="blue" />
                  <ActivityRow icon={MessageCircle} title="Abrir chamado" subtitle="Acompanhe suas solicitações" tone="green" />
                </div>
                <p className="mt-4 text-xs text-muted-foreground">Horário de atendimento: Seg - Sex, 08h às 18h</p>
              </PremiumPanel>
            </aside>
          </div>

          <div className="neo-surface mt-6 flex flex-col gap-3 rounded-[24px] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <p className="font-medium text-foreground">Status do sistema</p>
              <span className="text-sm text-emerald-600 dark:text-emerald-300">Todos os sistemas operando normalmente</span>
            </div>
            <span className="text-sm text-muted-foreground">Última atualização: há 5 minutos</span>
          </div>
        </div>
      </div>

      {/* Assistente flutuante (Chat) */}
      <FloatingAssistant
          variant ="chat"
      />
    </>
  );
};

export default Help;

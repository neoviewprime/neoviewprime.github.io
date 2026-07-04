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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  HelpCircle,
  MessageCircle,
  Mail,
  ChevronDown,
  ChevronUp,
  Search,
  FileText,
  Book,
  Video,
  Lightbulb
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { FloatingAssistant } from '@/components/FloatingAssistant';

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
      <div className="container mx-auto px-6 py-8">
        
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-primary" />
            Central de Ajuda
          </h1>
          <p className="text-muted-foreground mt-1">Encontre respostas e aprenda a usar o NeoView</p>
        </div>

        {/* SEARCH */}
        <div className="relative mb-8 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="O que você precisa de ajuda?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 text-lg"
          />
        </div>

        {/* GUIDES */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {guides.map((guide) => {
            const Icon = guide.icon;
            return (
              <Card key={guide.title} className="cursor-pointer hover:shadow-card-hover transition-all group">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{guide.title}</h3>
                    <p className="text-sm text-muted-foreground">{guide.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-secondary" />
              Perguntas Frequentes
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              {filteredFaqs.map((faq, index) => (
                <div key={index} className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium text-foreground">{faq.question}</span>
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>

                  {openFaq === index && (
                    <div className="px-4 pb-4 text-muted-foreground animate-fade-in">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CONTACT */}
        <Card className="mt-6">
          <CardContent className="py-6">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-5 h-5" />
                <span>suporte@neoenergia.com</span>
              </div>

              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                <span className="text-foreground">
                  Ou pergunte para a <strong>ÍRIS</strong> no chat
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Assistente flutuante (Chat) */}
      <FloatingAssistant
          variant ="chat"
      />
    </>
  );
};

export default Help;
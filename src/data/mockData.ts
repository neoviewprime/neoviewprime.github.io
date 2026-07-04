export interface ReportMetrics {
  visualizacoes: number;
  comentarios: number;
  curtidas: number;
  compartilhamentos: number;
}

export interface PdfReport {
  id: string;
  name: string;
  date: string;
  size: string;
  description: string;
  metrics: ReportMetrics;
  url?: string;
}

export interface Indicator {
  id: string;
  name: string;
  value: string;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  description: string;
  reports: PdfReport[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  indicators: Indicator[];
}

export interface Management {
  id: string;
  name: string;
  projects: Project[];
}

export interface Superintendence {
  id: string;
  name: string;
  managements: Management[];
}

export interface Company {
  id: string;
  name: string;
  fullName: string;
  superintendences: Superintendence[];
}

export const companies: Company[] = [
  {
    id: 'coelba',
    name: 'Neoenergia Coelba',
    fullName: 'Neoenergia Coelba',
    superintendences: [
      {
        id: 'sup-relacionamento-clientes',
        name: 'Superintendência de Relacionamento com Clientes',
        managements: [
          {
            id: 'ger-receita',
            name: 'Gerência da Gestão da Receita',
            projects: [
              {
                id: 'uni-gestao-operacional-comercial',
                name: 'Unidade Gestão Operacional Comercial',
                description: 'Gestão operacional das atividades comerciais (processos, SLA, indicadores e melhorias).',
                indicators: [
                  {
                    id: 'ind-sla-comercial',
                    name: 'SLA Comercial',
                    value: '94.2',
                    unit: '%',
                    trend: 'up',
                    description: 'Indicador de nível de serviço das operações comerciais, medindo o cumprimento de prazos e qualidade do atendimento.',
                    reports: [
                      { id: 'rep-sla-1', name: 'Relatório SLA Comercial Q4 2024.pdf', date: '2024-12-20', size: '1.8 MB', description: 'Análise completa do SLA comercial do quarto trimestre de 2024, incluindo métricas de atendimento e tempo de resposta.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-sla-2', name: 'Dashboard Operacional Dezembro.pdf', date: '2024-12-28', size: '2.1 MB', description: 'Dashboard mensal com indicadores operacionais e comerciais consolidados.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                    ],
                  },
                ],
              },
              {
                id: 'uni-recuperacao-energia',
                name: 'Unidade Recuperação de Energia',
                description: 'Ações de recuperação de energia e combate a irregularidades em geração distribuída e consumo.',
                indicators: [
                  {
                    id: 'ind-recup-energia',
                    name: 'Taxa de Recuperação de Energia',
                    value: '87.5',
                    unit: '%',
                    trend: 'up',
                    description: 'Percentual de energia recuperada através de ações de combate a fraudes e irregularidades.',
                    reports: [
                      { id: 'rep-recup-1', name: 'Relatório Recuperação Energia 2024.pdf', date: '2024-12-15', size: '3.2 MB', description: 'Relatório anual de recuperação de energia com análise detalhada das ações realizadas e resultados obtidos.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                    ],
                  },
                ],
              },
              {
                id: 'uni-recuperacao-credito',
                name: 'Unidade de Recuperação de Crédito',
                description: 'Estratégias e operações de cobrança e recuperação de crédito (inadimplência).',
                indicators: [
                  {
                    id: 'ind-inadimplencia',
                    name: 'Taxa de Inadimplência',
                    value: '3.8',
                    unit: '%',
                    trend: 'down',
                    description: 'Percentual de clientes em situação de inadimplência em relação ao total de clientes ativos.',
                    reports: [
                      { id: 'rep-inad-1', name: 'Relatório Inadimplência Q4 2024.pdf', date: '2024-12-18', size: '2.5 MB', description: 'Análise trimestral da inadimplência com segmentação por região e perfil de cliente.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-inad-2', name: 'Estratégias Recuperação Crédito.pdf', date: '2024-12-10', size: '1.9 MB', description: 'Documento com estratégias de recuperação de crédito e melhores práticas.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 'ger-grandes-clientes',
            name: 'Gerência de Grandes Clientes',
            projects: [
              {
                id: 'proj-atendimento-corporativo',
                name: 'Atendimento Corporativo',
                description: 'Gestão do relacionamento com grandes clientes corporativos.',
                indicators: [
                  {
                    id: 'ind-satisfacao-corp',
                    name: 'Satisfação Clientes Corporativos',
                    value: '92.1',
                    unit: '%',
                    trend: 'up',
                    description: 'Índice de satisfação medido através de pesquisas com clientes corporativos.',
                    reports: [
                      { id: 'rep-corp-1', name: 'Pesquisa Satisfação Corporativos 2024.pdf', date: '2024-12-22', size: '4.1 MB', description: 'Resultado da pesquisa anual de satisfação com clientes corporativos incluindo análise de NPS.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 'ger-relacionamento-poder-publico',
            name: 'Gerência de Relacionamento com o Poder Público',
            projects: [],
          },
        ],
      },
      {
        id: 'sup-expancao-ba',
        name: 'Superintendência Expansão e Preservação',
        managements: [
          {
            id: 'ger-atendimento',
            name: 'Gerência de Atendimento',
            projects: [
              {
                id: 'proj-call-center',
                name: 'Melhoria Call Center',
                description: 'Otimização do atendimento telefônico e canais digitais.',
                indicators: [
                  {
                    id: 'ind-tma',
                    name: 'TMA - Tempo Médio de Atendimento',
                    value: '180',
                    unit: 'segundos',
                    trend: 'down',
                    description: 'Tempo médio de duração das chamadas no call center, indicando eficiência do atendimento.',
                    reports: [
                      { id: 'rep-6', name: 'Dashboard Call Center.pdf', date: '2024-12-18', size: '1.5 MB', description: 'Dashboard mensal do call center com métricas de atendimento e produtividade.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-6a', name: 'TMA por Tipo de Chamada.pdf', date: '2024-12-15', size: '1.8 MB', description: 'Análise do TMA segmentado por tipo de chamada e motivo de contato.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-6b', name: 'Relatório Produtividade Agentes.pdf', date: '2024-12-12', size: '2.4 MB', description: 'Relatório de produtividade individual e por equipe dos agentes de atendimento.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-6c', name: 'Análise Picos de Demanda.pdf', date: '2024-12-10', size: '1.3 MB', description: 'Estudo dos picos de demanda de atendimento e estratégias de dimensionamento.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'sup-tecnica-coelba',
        name: 'Superintendência Técnica Coelba',
        managements: [
          {
            id: 'ger-manutencao',
            name: 'Gerência de Manutenção',
            projects: [
              {
                id: 'proj-eficiencia-rede',
                name: 'Eficiência de Rede',
                description: 'Otimização da rede de distribuição para melhorar a qualidade do fornecimento de energia.',
                indicators: [
                  {
                    id: 'ind-dec',
                    name: 'DEC - Duração Equivalente por Consumidor',
                    value: '12.5',
                    unit: 'horas',
                    trend: 'down',
                    description: 'Indicador que mede o tempo médio de interrupção de energia elétrica por consumidor. Quanto menor, melhor a qualidade do fornecimento.',
                    reports: [
                      { id: 'rep-1', name: 'Relatório DEC Q4 2024.pdf', date: '2024-12-15', size: '2.4 MB', description: 'Relatório trimestral do indicador DEC com análise detalhada por região e causas das interrupções.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-2', name: 'Análise Comparativa DEC.pdf', date: '2024-11-30', size: '1.8 MB', description: 'Comparativo do DEC entre distribuidoras do grupo Neoenergia e benchmark do setor.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-1a', name: 'DEC Mensal Dezembro 2024.pdf', date: '2024-12-28', size: '1.2 MB', description: 'Acompanhamento mensal do DEC com evolução diária e projeções.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-1b', name: 'DEC Histórico Anual 2024.pdf', date: '2024-12-20', size: '3.5 MB', description: 'Histórico anual do DEC com análise de tendências e sazonalidade.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-1c', name: 'Plano de Ação DEC 2025.pdf', date: '2024-12-22', size: '2.1 MB', description: 'Plano de ação para redução do DEC em 2025 com metas e investimentos previstos.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                    ],
                  },
                  {
                    id: 'ind-fec',
                    name: 'FEC - Frequência Equivalente por Consumidor',
                    value: '8.2',
                    unit: 'interrupções',
                    trend: 'stable',
                    description: 'Indicador que mede a quantidade média de interrupções por consumidor. Complementar ao DEC na avaliação da qualidade.',
                    reports: [
                      { id: 'rep-3', name: 'Relatório FEC Q4 2024.pdf', date: '2024-12-15', size: '1.9 MB', description: 'Relatório trimestral do FEC com análise de causas e planos de ação.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-3a', name: 'FEC por Região Bahia.pdf', date: '2024-12-10', size: '2.2 MB', description: 'Análise regionalizada do FEC no estado da Bahia.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-3b', name: 'Análise FEC vs Meta ANEEL.pdf', date: '2024-12-05', size: '1.6 MB', description: 'Comparativo do FEC realizado versus metas regulatórias da ANEEL.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                    ],
                  },
                ],
              },
              {
                id: 'proj-reducao-perdas',
                name: 'Redução de Perdas Técnicas',
                description: 'Programa de combate às perdas técnicas na rede de distribuição.',
                indicators: [
                  {
                    id: 'ind-perdas',
                    name: 'Índice de Perdas Técnicas',
                    value: '6.8',
                    unit: '%',
                    trend: 'down',
                    description: 'Percentual de energia perdida na transmissão e distribuição devido a fatores técnicos como resistência elétrica.',
                    reports: [
                      { id: 'rep-4', name: 'Relatório Perdas Técnicas 2024.pdf', date: '2024-12-01', size: '3.2 MB', description: 'Relatório anual de perdas técnicas com análise por alimentador e subestação.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-4a', name: 'Mapeamento Perdas por Alimentador.pdf', date: '2024-11-25', size: '4.8 MB', description: 'Mapeamento detalhado de perdas técnicas por alimentador com identificação de pontos críticos.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-4b', name: 'Investimentos Redução Perdas.pdf', date: '2024-11-20', size: '2.3 MB', description: 'Análise de investimentos realizados e planejados para redução de perdas técnicas.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-4c', name: 'Benchmark Perdas Técnicas Brasil.pdf', date: '2024-11-15', size: '1.9 MB', description: 'Comparativo de perdas técnicas entre distribuidoras brasileiras.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 'ger-qualidade',
            name: 'Gerência de Qualidade',
            projects: [
              {
                id: 'proj-satisfacao',
                name: 'Satisfação do Cliente',
                description: 'Monitoramento contínuo da satisfação dos clientes.',
                indicators: [
                  {
                    id: 'ind-isqp',
                    name: 'ISQP - Índice de Satisfação',
                    value: '78.5',
                    unit: '%',
                    trend: 'up',
                    description: 'Índice de Satisfação com a Qualidade Percebida, medindo a percepção do cliente sobre o serviço prestado.',
                    reports: [
                      { id: 'rep-5', name: 'Pesquisa Satisfação 2024.pdf', date: '2024-12-10', size: '4.1 MB', description: 'Resultado completo da pesquisa de satisfação anual com análise de todos os aspectos avaliados.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-5a', name: 'ISQP Detalhado por Município.pdf', date: '2024-12-08', size: '5.2 MB', description: 'Análise detalhada do ISQP por município da área de concessão.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-5b', name: 'Plano Melhoria Satisfação.pdf', date: '2024-12-01', size: '2.8 MB', description: 'Plano de ação para melhoria dos indicadores de satisfação.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-5c', name: 'Comparativo ISQP 2023-2024.pdf', date: '2024-11-28', size: '1.7 MB', description: 'Evolução do ISQP entre 2023 e 2024 com análise de fatores de melhoria.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'sup-corporativas-coelba',
        name: 'superintendências corporativas',
        managements: [],
      },
    ],
  },
  {
    id: 'cosern',
    name: 'Neoenergia Cosern',
    fullName: 'Neoenergia Cosern',
    superintendences: [
      {
        id: 'sup-operacoes-rn',
        name: 'Superintendência de Operações',
        managements: [
          {
            id: 'ger-distribuicao-rn',
            name: 'Gerência de Distribuição',
            projects: [
              {
                id: 'proj-expansao-rn',
                name: 'Expansão da Rede',
                description: 'Ampliação da cobertura de distribuição no Rio Grande do Norte.',
                indicators: [
                  {
                    id: 'ind-cobertura',
                    name: 'Índice de Cobertura',
                    value: '98.2',
                    unit: '%',
                    trend: 'up',
                    description: 'Percentual de cobertura da rede de distribuição em relação à área de concessão.',
                    reports: [
                      { id: 'rep-7', name: 'Relatório Expansão 2024.pdf', date: '2024-12-05', size: '2.8 MB', description: 'Relatório de expansão da rede com obras realizadas e planejadas.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-7a', name: 'Mapa Cobertura RN 2024.pdf', date: '2024-12-01', size: '6.2 MB', description: 'Mapa georreferenciado da cobertura da rede no estado.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-7b', name: 'Plano Expansão 2025-2027.pdf', date: '2024-11-28', size: '3.9 MB', description: 'Plano trienal de expansão com investimentos previstos.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-7c', name: 'Investimentos Infraestrutura.pdf', date: '2024-11-20', size: '2.5 MB', description: 'Análise de investimentos em infraestrutura de distribuição.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'brasilia',
    name: 'Neoenergia Brasília',
    fullName: 'Neoenergia Brasília',
    superintendences: [
      {
        id: 'sup-operacoes-df',
        name: 'Superintendência de Operações',
        managements: [
          {
            id: 'ger-tecnica-df',
            name: 'Gerência Técnica',
            projects: [
              {
                id: 'proj-smart-grid',
                name: 'Smart Grid',
                description: 'Implementação de redes inteligentes para modernização da distribuição.',
                indicators: [
                  {
                    id: 'ind-automacao',
                    name: 'Nível de Automação',
                    value: '45',
                    unit: '%',
                    trend: 'up',
                    description: 'Percentual de automação da rede de distribuição com tecnologias de smart grid.',
                    reports: [
                      { id: 'rep-8', name: 'Projeto Smart Grid.pdf', date: '2024-11-28', size: '5.2 MB', description: 'Documento técnico do projeto de smart grid com arquitetura e tecnologias.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-8a', name: 'Arquitetura Smart Grid DF.pdf', date: '2024-11-25', size: '4.1 MB', description: 'Arquitetura técnica detalhada do sistema de smart grid.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-8b', name: 'ROI Automação de Rede.pdf', date: '2024-11-20', size: '2.3 MB', description: 'Análise de retorno sobre investimento da automação de rede.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-8c', name: 'Cronograma Implantação 2025.pdf', date: '2024-11-15', size: '1.8 MB', description: 'Cronograma detalhado de implantação para 2025.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-8d', name: 'Estudo Viabilidade Técnica.pdf', date: '2024-11-10', size: '3.6 MB', description: 'Estudo de viabilidade técnica e econômica do projeto.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'elektro',
    name: 'Neoenergia Elektro',
    fullName: 'Neoenergia Elektro',
    superintendences: [
      {
        id: 'sup-operacoes-sp',
        name: 'Superintendência de Operações',
        managements: [
          {
            id: 'ger-manutencao-sp',
            name: 'Gerência de Manutenção',
            projects: [
              {
                id: 'proj-preventiva',
                name: 'Manutenção Preventiva',
                description: 'Programa de manutenção preventiva para garantir confiabilidade.',
                indicators: [
                  {
                    id: 'ind-disponibilidade',
                    name: 'Disponibilidade da Rede',
                    value: '99.7',
                    unit: '%',
                    trend: 'stable',
                    description: 'Percentual de tempo em que a rede está disponível para fornecimento de energia.',
                    reports: [
                      { id: 'rep-9', name: 'Manutenção Preventiva 2024.pdf', date: '2024-12-12', size: '3.4 MB', description: 'Relatório anual do programa de manutenção preventiva.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-9a', name: 'Calendário Manutenções 2025.pdf', date: '2024-12-10', size: '1.9 MB', description: 'Calendário de manutenções preventivas planejadas para 2025.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-9b', name: 'Indicadores MTBF MTTR.pdf', date: '2024-12-05', size: '2.1 MB', description: 'Análise dos indicadores de tempo médio entre falhas e tempo de reparo.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-9c', name: 'Análise Falhas Recorrentes.pdf', date: '2024-12-01', size: '2.8 MB', description: 'Estudo de falhas recorrentes e plano de ação corretiva.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'pernambuco',
    name: 'Neoenergia Pernambuco',
    fullName: 'Neoenergia Pernambuco',
    superintendences: [
      {
        id: 'sup-operacoes-pe',
        name: 'Superintendência de Operações',
        managements: [
          {
            id: 'ger-projetos-pe',
            name: 'Gerência de Projetos',
            projects: [
              {
                id: 'proj-energia-solar',
                name: 'Energia Solar Distribuída',
                description: 'Integração de geração solar distribuída na rede.',
                indicators: [
                  {
                    id: 'ind-gd',
                    name: 'Conexões GD',
                    value: '15420',
                    unit: 'unidades',
                    trend: 'up',
                    description: 'Número total de conexões de geração distribuída (principalmente solar) na rede.',
                    reports: [
                      { id: 'rep-10', name: 'Relatório GD 2024.pdf', date: '2024-12-08', size: '2.1 MB', description: 'Relatório anual de geração distribuída com análise de crescimento.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-10a', name: 'Mapa Solar Pernambuco.pdf', date: '2024-12-05', size: '7.3 MB', description: 'Mapa de concentração de geração solar no estado.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-10b', name: 'Análise Impacto Rede GD.pdf', date: '2024-12-01', size: '3.2 MB', description: 'Análise do impacto da geração distribuída na rede de distribuição.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-10c', name: 'Projeção Conexões 2025.pdf', date: '2024-11-28', size: '1.8 MB', description: 'Projeção de crescimento de conexões de GD para 2025.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                      { id: 'rep-10d', name: 'Regulamentação ANEEL GD.pdf', date: '2024-11-20', size: '2.4 MB', description: 'Análise da regulamentação da ANEEL sobre geração distribuída.', metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

// Helper para obter todos os relatórios
export function getAllReports(): Array<{ report: PdfReport; path: string[]; companyId: string }> {
  const allReports: Array<{ report: PdfReport; path: string[]; companyId: string }> = [];
  
  companies.forEach((company) => {
    company.superintendences.forEach((sup) => {
      sup.managements.forEach((mgmt) => {
        mgmt.projects.forEach((proj) => {
          proj.indicators.forEach((ind) => {
            ind.reports.forEach((report) => {
              allReports.push({
                report,
                path: [company.name, sup.name, mgmt.name, proj.name, ind.name],
                companyId: company.id,
              });
            });
          });
        });
      });
    });
  });
  
  return allReports;
}

// Helper function to get all searchable items
export interface SearchResult {
  type: 'indicator' | 'report';
  path: string[];
  indicator?: Indicator;
  report?: PdfReport;
  companyId: string;
  superintendenceId: string;
  managementId: string;
  projectId: string;
}

export function searchIndicators(query: string): SearchResult[] {
  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  companies.forEach((company) => {
    company.superintendences.forEach((sup) => {
      sup.managements.forEach((mgmt) => {
        mgmt.projects.forEach((proj) => {
          proj.indicators.forEach((ind) => {
            const path = [company.name, sup.name, mgmt.name, proj.name];
            
            // Search in indicator name and description
            if (ind.name.toLowerCase().includes(lowerQuery) || ind.description.toLowerCase().includes(lowerQuery)) {
              results.push({
                type: 'indicator',
                path: [...path, ind.name],
                indicator: ind,
                companyId: company.id,
                superintendenceId: sup.id,
                managementId: mgmt.id,
                projectId: proj.id,
              });
            }

            // Search in reports
            ind.reports.forEach((report) => {
              if (report.name.toLowerCase().includes(lowerQuery) || report.description.toLowerCase().includes(lowerQuery)) {
                results.push({
                  type: 'report',
                  path: [...path, ind.name, report.name],
                  report,
                  indicator: ind,
                  companyId: company.id,
                  superintendenceId: sup.id,
                  managementId: mgmt.id,
                  projectId: proj.id,
                });
              }
            });
          });
        });
      });
    });
  });

  return results;
}

// Helper para ranking de relatórios por nível hierárquico
export function getReportsRanking(
  level: 'company' | 'superintendence' | 'management' | 'project',
  id?: string
): Array<{ report: PdfReport; path: string[]; totalViews: number }> {
  const allReports = getAllReports();
  
  // Filtra por nível se necessário
  let filtered = allReports;
  if (level === 'company' && id) {
    filtered = allReports.filter(r => r.companyId === id);
  }
  
  // Ordena por visualizacoes
  return filtered
    .map(r => ({
      report: r.report,
      path: r.path,
      totalViews: r.report.metrics.visualizacoes,
    }))
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, 5);
}

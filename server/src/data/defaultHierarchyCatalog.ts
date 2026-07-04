export type HierarchyProjectNode = {
  id: string;
  name: string;
};

export type HierarchyManagementNode = {
  id: string;
  name: string;
  projects: HierarchyProjectNode[];
};

export type HierarchySuperintendenceNode = {
  id: string;
  name: string;
  managements: HierarchyManagementNode[];
};

export type HierarchyCompanyNode = {
  id: string;
  name: string;
  superintendences: HierarchySuperintendenceNode[];
};

export const defaultHierarchyCatalog: HierarchyCompanyNode[] = [
  {
    id: "coelba",
    name: "Neoenergia Coelba",
    superintendences: [
      {
        id: "sup-relacionamento-clientes",
        name: "Superintendencia de Relacionamento com Clientes",
        managements: [
          {
            id: "ger-receita",
            name: "Gerencia da Gestao da Receita",
            projects: [
              { id: "uni-gestao-operacional-comercial", name: "Unidade Gestao Operacional Comercial" },
              { id: "uni-recuperacao-energia", name: "Unidade Recuperacao de Energia" },
              { id: "uni-recuperacao-credito", name: "Unidade de Recuperacao de Credito" }
            ]
          },
          {
            id: "ger-grandes-clientes",
            name: "Gerencia de Grandes Clientes",
            projects: [{ id: "proj-atendimento-corporativo", name: "Atendimento Corporativo" }]
          },
          {
            id: "ger-relacionamento-poder-publico",
            name: "Gerencia de Relacionamento com o Poder Publico",
            projects: []
          }
        ]
      },
      {
        id: "sup-expancao-ba",
        name: "Superintendencia Expansao e Preservacao",
        managements: [
          {
            id: "ger-atendimento",
            name: "Gerencia de Atendimento",
            projects: [{ id: "proj-call-center", name: "Melhoria Call Center" }]
          }
        ]
      },
      {
        id: "sup-tecnica-coelba",
        name: "Superintendencia Tecnica Coelba",
        managements: [
          {
            id: "ger-manutencao",
            name: "Gerencia de Manutencao",
            projects: [
              { id: "proj-eficiencia-rede", name: "Eficiencia de Rede" },
              { id: "proj-reducao-perdas", name: "Reducao de Perdas Tecnicas" }
            ]
          },
          {
            id: "ger-qualidade",
            name: "Gerencia de Qualidade",
            projects: [{ id: "proj-satisfacao", name: "Satisfacao do Cliente" }]
          }
        ]
      },
      {
        id: "sup-corporativas-coelba",
        name: "superintendencias corporativas",
        managements: []
      }
    ]
  },
  {
    id: "cosern",
    name: "Neoenergia Cosern",
    superintendences: [
      {
        id: "sup-operacoes-rn",
        name: "Superintendencia de Operacoes",
        managements: [
          {
            id: "ger-distribuicao-rn",
            name: "Gerencia de Distribuicao",
            projects: [{ id: "proj-expansao-rn", name: "Expansao da Rede" }]
          }
        ]
      }
    ]
  },
  {
    id: "brasilia",
    name: "Neoenergia Brasilia",
    superintendences: [
      {
        id: "sup-operacoes-df",
        name: "Superintendencia de Operacoes",
        managements: [
          {
            id: "ger-tecnica-df",
            name: "Gerencia Tecnica",
            projects: [{ id: "proj-smart-grid", name: "Smart Grid" }]
          }
        ]
      }
    ]
  },
  {
    id: "elektro",
    name: "Neoenergia Elektro",
    superintendences: [
      {
        id: "sup-operacoes-sp",
        name: "Superintendencia de Operacoes",
        managements: [
          {
            id: "ger-manutencao-sp",
            name: "Gerencia de Manutencao",
            projects: [{ id: "proj-preventiva", name: "Manutencao Preventiva" }]
          }
        ]
      }
    ]
  },
  {
    id: "pernambuco",
    name: "Neoenergia Pernambuco",
    superintendences: [
      {
        id: "sup-operacoes-pe",
        name: "Superintendencia de Operacoes",
        managements: [
          {
            id: "ger-projetos-pe",
            name: "Gerencia de Projetos",
            projects: [{ id: "proj-energia-solar", name: "Energia Solar Distribuida" }]
          }
        ]
      }
    ]
  }
];

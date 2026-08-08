# Documentação Completa Para Pitch - NeoView

## 1. Resumo Executivo

O NeoView é um protótipo funcional de uma plataforma de inteligência para relatórios, indicadores e decisões corporativas dentro do contexto da Neoenergia Coelba.

A proposta não é criar apenas mais um repositório de arquivos. O NeoView posiciona-se como uma camada de decisão sobre relatórios e indicadores, conectando:

- busca inteligente;
- relatórios rastreáveis;
- indicadores comparáveis por período;
- visão por empresa e área;
- governança de validações;
- assistente inteligente IRIS;
- experiência mobile e web para acesso rápido.

Em linguagem de pitch:

> O NeoView transforma relatórios e indicadores dispersos em decisões rápidas, rastreáveis e apoiadas por IA contextual.

## 2. Problema Que O NeoView Resolve

Em organizações grandes, relatórios e indicadores normalmente existem, mas ficam espalhados em diferentes sistemas, pastas, áreas, pessoas e formatos.

Isso gera dificuldades como:

- demora para encontrar o relatório certo;
- dificuldade para saber qual indicador responde a uma pergunta de negócio;
- pouca rastreabilidade entre relatório, indicador e decisão;
- retrabalho em aprovações e validações;
- dependência de pessoas que sabem "onde está a informação";
- comparação difícil entre anos, áreas ou empresas;
- perda de contexto quando relatórios são compartilhados fora do fluxo;
- IA genérica sem conhecimento do ambiente da empresa.

O NeoView ataca especialmente o intervalo entre:

> "Existe informação disponível" e "alguém conseguiu tomar uma decisão com base nela".

## 3. Tese Do Projeto

A tese central do NeoView é:

> Empresas não sofrem apenas por falta de dados. Sofrem porque os dados, relatórios e indicadores nem sempre estão organizados como uma jornada de decisão.

O NeoView propõe uma experiência em que o usuário pode:

1. entrar na plataforma;
2. buscar uma dúvida de negócio;
3. encontrar o indicador relacionado;
4. comparar períodos;
5. abrir o relatório fonte;
6. entender responsáveis, validade e histórico;
7. pedir apoio à IRIS;
8. tomar ou encaminhar uma decisão.

## 4. Público-Alvo

O público inicial do NeoView pode incluir:

- estagiários e analistas que precisam localizar relatórios e indicadores;
- gestores que precisam validar informações com rapidez;
- áreas operacionais e comerciais que produzem relatórios recorrentes;
- aprovadores responsáveis por revisar documentos;
- diretoria ou liderança que precisa de visão executiva;
- times de governança, qualidade, planejamento e performance.

No pitch, o público mais importante é o avaliador perceber que a solução não é restrita a um único perfil. Ela pode começar pequena, mas escalar para diferentes áreas.

## 5. Proposta De Valor

### Valor Principal

Reduzir o tempo e o esforço para transformar relatórios e indicadores em decisão.

### Valores Complementares

- Centralizar relatórios importantes.
- Dar contexto aos indicadores.
- Ajudar o usuário a saber se um indicador faz sentido para sua pergunta.
- Comparar indicadores entre anos.
- Comparar empresas ou áreas quando aplicável.
- Dar rastreabilidade: relatório, indicador, responsável, validade e histórico.
- Apoiar aprovações e validações.
- Usar IA como copiloto contextual, não como chatbot genérico.

## 6. Diferencial Do NeoView

O diferencial não está em armazenar PDFs ou criar dashboards isolados. O diferencial é integrar as camadas:

- relatório;
- indicador;
- pergunta de negócio;
- contexto da tela;
- governança;
- IA;
- ação.

Comparação simples para banca:

| Ferramenta | Papel |
|---|---|
| Pasta/SharePoint | Armazena documentos |
| Power BI | Visualiza dados e painéis |
| Chatbot genérico | Responde perguntas sem contexto corporativo profundo |
| NeoView | Conecta relatório, indicador, fonte, contexto e decisão com apoio da IRIS |

Frase curta:

> O NeoView não substitui ferramentas existentes. Ele organiza a camada de inteligência e decisão sobre elas.

## 7. Estrutura Do Site

O site está estruturado como um protótipo navegável com rotas principais.

### Rotas Públicas

- `/`
  - Entrada inicial.
- `/landing`
  - Página de apresentação institucional.
- `/login`
  - Simulação de acesso.

### Rotas Com Layout Principal

- `/home`
  - Central de Decisão.
- `/workspace`
  - Visão de trabalho com prioridades, relatórios em foco e aprovações.
- `/dashboard`
  - Navegação hierárquica por empresa, superintendência, gerência, projeto e indicadores.
- `/companies`
  - Visão de empresas/distribuidoras.
- `/reports`
  - Meus Relatórios.
- `/reports/:reportId`
  - Detalhe do relatório.
- `/indicators`
  - Inteligência de Indicadores.
- `/approvals`
  - Validações e aprovações.
- `/favorites`
  - Favoritos.
- `/settings`
  - Configurações.
- `/help`
  - Central de Ajuda.
- `/users/new`
  - Cadastro de usuário.
- `/superadmin`
  - Administração restrita.

## 8. Módulos Principais

### 8.1 Home - Central De Decisão

Objetivo:

Ser a tela inicial para orientar o usuário a partir de uma pergunta de negócio.

Principais elementos:

- busca global;
- atalhos para indicadores, relatórios e validações;
- acesso à IRIS;
- fontes recentes;
- continuidade por empresa;
- navegação para fluxos principais.

Mensagem para pitch:

> A Home não é uma vitrine. Ela funciona como ponto de partida para decisão: o usuário entra com uma dúvida, e o NeoView ajuda a chegar no indicador, relatório ou fluxo correto.

### 8.2 Workspace

Objetivo:

Dar ao usuário uma visão operacional do que precisa de atenção.

Elementos:

- relatórios aprovados;
- pendências críticas;
- tempo médio de aprovação;
- prioridades da fila;
- relatório em foco;
- atividade recente com personas fictícias;
- tendência de aprovações;
- caminho para validações.

Exemplo de narrativa:

> O Workspace aproxima o NeoView do dia a dia. Ele mostra o que precisa ser priorizado, quem interagiu com relatórios e quais aprovações merecem atenção.

### 8.3 Dashboard / Hierarquia

Objetivo:

Permitir navegação pela estrutura da empresa.

Estrutura simulada:

- empresa;
- superintendência;
- gerência;
- projeto/unidade;
- indicador;
- relatório.

Valor:

- reduz perda de contexto;
- permite localizar informação por área;
- conecta relatório à hierarquia organizacional.

### 8.4 Companies

Objetivo:

Apresentar empresas/distribuidoras e permitir comparação ou entrada por organização.

Valor para pitch:

> O NeoView nasce em um contexto da Coelba, mas foi pensado para escalar para outras distribuidoras do grupo.

### 8.5 Reports - Meus Relatórios

Objetivo:

Centralizar relatórios com busca, filtros, status e ações.

Elementos:

- listagem de relatórios;
- filtros;
- relatórios em destaque;
- atividades recentes;
- clique para detalhe do relatório;
- integração com IRIS.

Valor:

- evita que relatórios fiquem apenas "guardados";
- traz contexto de uso, status e relevância;
- aproxima o relatório de uma ação.

### 8.6 Report Details - Detalhe Do Relatório

Objetivo:

Mostrar a página individual de um relatório, com informações úteis para decisão.

Elementos:

- resumo executivo;
- responsável fictício;
- validade;
- acesso;
- uso/visualizações;
- indicadores relacionados;
- linha do tempo;
- ações do relatório;
- relatórios relacionados;
- opção de perguntar à IRIS;
- opção de enviar para validação;
- opção de favoritar.

Valor para pitch:

> O relatório deixa de ser apenas um arquivo. Ele passa a ter dono, validade, histórico, indicadores relacionados e ações.

### 8.7 Indicators - Inteligência De Indicadores

Objetivo:

Permitir que o usuário entenda, compare e valide indicadores.

Funcionalidades:

- escolha de indicador;
- comparação de anos;
- visualização de evolução anual;
- comparação com meta;
- avaliação se o indicador faz sentido;
- indicadores relacionados;
- relatórios usados na comparação;
- sugestão de pergunta para IRIS.

Indicadores simulados:

- DEC;
- FEC;
- ISQP;
- SLA Comercial;
- Inadimplência;
- TMA.

Valor:

> A tela de indicadores ajuda o usuário a não apenas ver um número, mas entender se aquele indicador responde à pergunta correta.

### 8.8 Approvals - Validações

Objetivo:

Organizar aprovações, rejeições e delegações de relatórios.

Elementos:

- pendências;
- histórico de decisões;
- regras de aprovação;
- delegações;
- substitutos;
- métricas de aprovação;
- acesso à IRIS.

Valor:

> A governança evita que relatórios circulem sem validação, sem dono ou sem clareza de status.

### 8.9 Favorites

Objetivo:

Dar acesso rápido a relatórios e indicadores importantes.

Elementos:

- relatórios favoritos;
- indicadores favoritos;
- coleções;
- acesso recente;
- insights;
- recomendações.

Valor:

> O usuário não precisa repetir buscas recorrentes. Ele acompanha rapidamente o que é mais relevante para sua rotina.

### 8.10 Settings

Objetivo:

Simular preferências, perfil, segurança e configurações da conta.

Elementos:

- perfil;
- preferências;
- segurança;
- notificações;
- workspace padrão;
- 2FA demonstrativo.

Valor:

Mostra maturidade de produto e preocupação com personalização e segurança.

### 8.11 Help

Objetivo:

Centralizar dúvidas frequentes e suporte.

Elementos:

- busca em FAQ;
- perguntas frequentes;
- card da IRIS;
- suporte por e-mail;
- abertura de chamado demonstrativo;
- status do sistema.

Valor:

Ajuda o avaliador a perceber que o produto não depende só de treinamento externo. Ele oferece suporte dentro da experiência.

### 8.12 Superadmin

Objetivo:

Simular controle administrativo.

Elementos:

- usuários;
- relatórios;
- auditoria;
- operações;
- ações críticas;
- logs;
- backup demonstrativo;
- encerramento de sessões.

Valor:

> Mesmo em protótipo, o NeoView considera governança, auditoria e controle de acesso.

## 9. IRIS - Assistente Inteligente

IRIS é a assistente inteligente do NeoView.

Ela foi pensada para deixar de ser um chatbot genérico e funcionar como uma camada de apoio contextual.

### O Que A IRIS Faz

- entende perguntas em linguagem natural;
- reconhece indicadores;
- reconhece anos/períodos;
- reconhece empresas;
- entende a página atual;
- sugere caminhos;
- compara indicadores;
- compara anos;
- compara empresas;
- encontra relatórios;
- explica se um indicador faz sentido para uma pergunta;
- responde em português brasileiro por padrão;
- constrói respostas de forma procedural/streaming;
- usa fontes e contexto quando disponíveis.

### Exemplos De Perguntas Para Demo

- "Como está o DEC em 2024?"
- "Compare DEC e FEC entre 2023 e 2024."
- "O SLA faz sentido para medir atendimento?"
- "Compare empresas em FEC 2024."
- "Quais relatórios sustentam ISQP?"
- "Qual indicador devo olhar para qualidade percebida?"
- "Quais aprovações são críticas?"
- "Onde vejo relatórios favoritos?"

### Como A IRIS Muda Por Página

Na Home:

- atua como guia executivo;
- sugere visão geral;
- ajuda a escolher caminho.

Em Indicadores:

- atua como analista de KPI;
- compara anos;
- avalia aderência do indicador;
- sugere cruzamentos.

Em Relatórios:

- atua como curadora de fontes;
- encontra documentos;
- explica quais relatórios sustentam uma análise.

Em Aprovações:

- atua com foco em governança;
- separa pendências e riscos;
- sugere decisão ou evidência necessária.

Em Ajuda:

- atua como orientadora de uso;
- indica caminhos dentro do sistema.

## 10. Arquitetura Da IRIS

A IRIS foi modularizada para demonstrar maturidade técnica.

Estrutura criada no frontend:

- `src/lib/iris/perception.ts`
  - interpreta pergunta, ação, indicadores, empresas, anos e página.
- `src/lib/iris/orchestrator.ts`
  - coordena ferramentas com limite de chamadas.
- `src/lib/iris/memory.ts`
  - memória local curta, isolada por cliente.
- `src/lib/iris/validation.ts`
  - valida resposta vazia, excesso de confiança e idioma inadequado.
- `src/lib/iris/prompts.ts`
  - centraliza identidade e mensagens de boas-vindas.
- `src/lib/iris/types.ts`
  - contratos e tipos da arquitetura.

Também há integração com backend RAG:

- `server/src/rag/irisSystemPrompt.ts`
  - prompt de sistema centralizado.
- `server/src/rag/ragPipeline.ts`
  - pipeline RAG com OpenAI/Ollama/cache/embeddings.
- `server/src/routes/chatRoutes.ts`
  - rotas de chat.
- `server/src/streaming/streamController.ts`
  - streaming de respostas.
- `server/src/services/chatService.ts`
  - sessão, memória e contexto.

### Componentes Da Arquitetura

#### Percepção

A IRIS interpreta:

- ação solicitada;
- objeto da pergunta;
- indicadores;
- empresas;
- anos;
- contexto da tela;
- intenção de comparação;
- intenção de navegação.

#### Ferramentas Controladas

A IRIS usa ferramentas internas para:

- saudação;
- capacidades;
- memória/aprendizado;
- análise de indicadores;
- orientação de navegação;
- busca semântica no catálogo.

#### Memória

A memória local guarda apenas sinais úteis e limitados:

- indicadores recentes;
- empresas recentes;
- anos recentes;
- página usada;
- ação da pergunta.

Ela não deve armazenar senhas, tokens ou dados sensíveis.

#### Validação

Antes da resposta final, a IRIS valida:

- resposta vazia;
- confiança fora de faixa;
- sinais de resposta em inglês quando não deveria;
- frases com excesso de certeza.

#### Backend RAG

O backend já possui estrutura para:

- sessões de chat;
- mensagens;
- feedback;
- embeddings;
- busca vetorial/local;
- cache semântico;
- OpenAI;
- Ollama;
- streaming.

Para pitch, a mensagem correta é:

> O protótipo já demonstra a experiência e a arquitetura está preparada para evoluir para um RAG conectado a dados reais.

## 11. Dados Do Protótipo

O protótipo usa dados representativos para simular:

- empresas;
- relatórios;
- indicadores;
- responsáveis;
- interações;
- aprovações;
- métricas;
- comparações históricas.

Importante para a fala:

> Os dados usados na demonstração são representativos para validar a experiência. A próxima etapa é conectar fontes reais em um piloto controlado.

## 12. Personas Fictícias

Foram usadas personas fictícias para dar vida ao protótipo sem expor pessoas reais.

Exemplos:

- Mariana Alves;
- Rafael Costa;
- Beatriz Rocha;
- Felipe Andrade;
- Lucas Martins;
- Camila Torres.

Papel no pitch:

> As personas ajudam a banca a visualizar uso real: alguém visualiza, comenta, compartilha, valida e aprova relatórios.

## 13. Fluxo De Demonstração Recomendado

Tempo ideal: 4 a 6 minutos.

### Passo 1 - Começar Pela Dor

Fala:

> Hoje relatórios e indicadores existem, mas o caminho até a decisão ainda pode ser demorado. O NeoView encurta esse caminho.

Abrir:

- Home / Central de Decisão.

Mostrar:

- busca;
- atalhos;
- fontes recentes;
- botão da IRIS.

### Passo 2 - Perguntar Um Indicador

Pergunta à IRIS:

> Como está o DEC em 2024?

Objetivo:

Mostrar que a IRIS entende indicador e período.

### Passo 3 - Comparar Indicadores

Pergunta:

> Compare DEC e FEC entre 2023 e 2024.

Objetivo:

Mostrar comparação temporal e leitura de negócio.

### Passo 4 - Comparar Empresas

Pergunta:

> Compare empresas em SLA 2024.

Objetivo:

Mostrar potencial de escala para o grupo.

### Passo 5 - Abrir Relatório Fonte

Abrir:

- Meus Relatórios;
- Relatório SLA Comercial Q4;
- Detalhe do relatório.

Mostrar:

- responsável;
- validade;
- indicadores relacionados;
- linha do tempo;
- ações.

### Passo 6 - Mostrar Governança

Abrir:

- Validações.

Mostrar:

- aprovar;
- rejeitar;
- delegar;
- histórico;
- regras.

### Passo 7 - Fechar Com Escala

Fala:

> Começamos com uma área e poucos indicadores críticos. Se o piloto provar redução de tempo e aumento de rastreabilidade, a solução escala para outras áreas e distribuidoras.

## 14. Pitch Curto

Versão de 30 segundos:

> O NeoView é uma plataforma de inteligência para relatórios e indicadores da Neoenergia Coelba. Em vez de o usuário procurar arquivos, interpretar indicadores manualmente e depender de quem sabe onde está a informação, ele pergunta à IRIS, compara períodos, abre o relatório fonte e acompanha governança. A proposta é transformar relatório em decisão rastreável.

Versão de 1 minuto:

> Em empresas grandes, relatórios e indicadores existem, mas muitas vezes estão dispersos. O problema não é só falta de dado; é o tempo entre encontrar a informação e tomar uma decisão. O NeoView resolve isso criando uma central de decisão com relatórios, indicadores, validações e a IRIS, uma assistente contextual que entende perguntas, anos, empresas e indicadores. O protótipo já permite buscar relatórios, comparar indicadores entre anos, abrir fontes e acompanhar governança. A próxima etapa é um piloto controlado com dados reais para medir redução de tempo, retrabalho e melhoria na rastreabilidade.

## 15. Frases Fortes Para Apresentação

- "O NeoView transforma relatório em decisão."
- "Não é mais uma pasta de documentos. É uma camada de inteligência sobre relatórios e indicadores."
- "A IRIS não responde no vazio; ela considera indicador, período, empresa, fonte e página atual."
- "A proposta começa pequena, com piloto, mas nasce escalável."
- "O maior ganho é reduzir o tempo entre pergunta, evidência e decisão."
- "O protótipo prova a experiência; o piloto provará o impacto."

## 16. Perguntas Que Podem Derrubar E Respostas

### Isso Já Usa Dados Reais?

Resposta:

> Nesta etapa, usamos dados representativos para validar a experiência e o fluxo. A arquitetura foi pensada para conectar dados reais em um piloto controlado, com escopo, usuários e permissões definidos.

### Qual O Diferencial Para SharePoint Ou Power BI?

Resposta:

> SharePoint armazena documentos. Power BI mostra painéis. O NeoView conecta relatório, indicador, pergunta de negócio, responsável, histórico e decisão com apoio da IRIS.

### A IA Pode Inventar?

Resposta:

> Esse risco existe em qualquer solução com IA. Por isso a IRIS foi desenhada para trabalhar com fontes, contexto da tela, indicadores cadastrados e validação. Quando não houver informação suficiente, ela deve dizer isso em vez de inventar.

### Qual O Impacto Medido?

Resposta:

> Ainda não temos medição em produção. O piloto deve medir tempo para encontrar relatório, tempo para comparar indicador, retrabalho em aprovação, uso da plataforma e satisfação dos usuários.

### Isso Não Vira Mais Um Sistema?

Resposta:

> Vira mais um sistema se for apenas repositório. A proposta do NeoView é ser uma camada de decisão. O sucesso será medido por uso real, tempo economizado e decisões rastreáveis.

### Quem Mantém?

Resposta:

> A manutenção deve aproveitar fluxos já existentes: relatórios produzidos pelas áreas, responsáveis definidos e indicadores acompanhados. O NeoView adiciona estrutura e governança, não uma obrigação paralela sem valor.

### Por Que Avançar Agora?

Resposta:

> Porque a dor já existe, os relatórios já existem e os indicadores já existem. O que falta é conectar tudo em uma jornada de decisão. O protótipo mostra que essa jornada é viável.

## 17. Riscos Do Projeto

### Risco 1 - Adoção

O maior risco é o sistema não entrar no fluxo real das áreas.

Mitigação:

- piloto com área específica;
- usuários definidos;
- indicadores críticos;
- métrica de uso;
- feedback rápido.

### Risco 2 - Dados Reais

O protótipo usa dados representativos.

Mitigação:

- começar com base limitada;
- conectar relatórios reais;
- validar permissões;
- registrar fontes.

### Risco 3 - IA Genérica

Se a IA não usar contexto, perde valor.

Mitigação:

- IRIS contextual;
- fontes;
- página atual;
- indicadores cadastrados;
- validação.

### Risco 4 - Escopo Grande Demais

Tentar resolver tudo de uma vez pode enfraquecer o projeto.

Mitigação:

- começar com poucos indicadores;
- demonstrar ganho;
- escalar por fases.

## 18. Métricas Para Piloto

Métricas recomendadas:

- tempo médio para encontrar um relatório;
- tempo para comparar um indicador entre anos;
- quantidade de cliques até abrir a fonte;
- quantidade de relatórios com responsável e validade;
- taxa de respostas úteis da IRIS;
- retrabalho em aprovações;
- tempo médio de aprovação;
- satisfação dos usuários;
- frequência de uso;
- número de decisões com fonte rastreável.

Hipótese de valor:

> Se o NeoView reduzir o tempo para encontrar evidência e comparar indicadores, ele aumenta a velocidade e a qualidade da decisão.

## 19. Roadmap Sugerido

### Fase 1 - Protótipo

Status atual.

Objetivo:

- demonstrar experiência;
- validar narrativa;
- mostrar fluxos;
- impressionar banca.

### Fase 2 - Piloto Controlado

Escopo:

- uma área;
- poucos indicadores;
- relatórios reais;
- usuários definidos;
- permissões básicas;
- métricas de sucesso.

### Fase 3 - Integração Com Fontes Reais

Possibilidades:

- bases internas;
- repositórios de relatórios;
- Power BI;
- SharePoint;
- banco de indicadores;
- sistemas de aprovação.

### Fase 4 - RAG/IA De Produção

Evolução:

- embeddings reais;
- busca semântica;
- controle de acesso por usuário;
- logs;
- avaliação de respostas;
- monitoramento de alucinação;
- feedback contínuo.

### Fase 5 - Escala

Possibilidades:

- outras áreas da Coelba;
- outras distribuidoras;
- indicadores regulatórios;
- auditoria;
- governança corporativa.

## 20. Limitações Atuais

É importante falar com maturidade.

Limitações:

- dados representativos;
- parte da IA local ainda funciona por regras e dados estruturados;
- backend RAG existe, mas precisa de ambiente e dados reais para produção;
- permissões reais precisam ser validadas em piloto;
- métricas de impacto ainda precisam ser medidas;
- alguns fluxos são demonstrativos.

Como responder:

> Não estamos apresentando produto final. Estamos apresentando um protótipo funcional com uma hipótese clara de valor e uma arquitetura preparada para piloto.

## 21. Por Que O Projeto É Forte Para Shark Tank De Estagiários

Pontos fortes:

- dor corporativa real;
- protótipo navegável;
- visual maduro;
- IA demonstrável;
- narrativa de impacto;
- governança;
- possibilidade de escala;
- entendimento de riscos;
- caminho claro para piloto.

Mensagem:

> Para uma etapa de estagiários, o NeoView se destaca porque não está só no campo da ideia. Ele materializa a proposta em uma experiência funcional.

## 22. Como Posicionar O Projeto

Evitar:

- vender como produto pronto;
- prometer IA perfeita;
- prometer integração total sem piloto;
- mostrar todas as telas sem foco.

Preferir:

- vender como protótipo funcional;
- defender piloto controlado;
- mostrar poucos fluxos fortes;
- assumir limites com maturidade;
- falar de métrica e escala.

Posicionamento ideal:

> O NeoView é uma hipótese de alto valor já materializada em protótipo funcional. A próxima etapa é provar impacto com dados reais em um piloto controlado.

## 23. Demonstração Ideal Em Uma Frase

> Eu pergunto à IRIS, ela entende o indicador e o período, me leva à análise, abre o relatório fonte e mantém a decisão rastreável.

## 24. Checklist Antes Da Apresentação

- Testar abertura do site.
- Testar IRIS na Home.
- Testar pergunta sobre DEC 2024.
- Testar comparação DEC x FEC.
- Testar comparação entre empresas.
- Abrir relatório fonte.
- Mostrar detalhe do relatório.
- Mostrar validações.
- Não tentar mostrar todas as telas.
- Ter resposta pronta para dados reais, IA e impacto.
- Ensaiar tempo de 5 minutos.

## 25. Roteiro De Fala Sugerido

1. "O problema que atacamos é simples: relatórios existem, indicadores existem, mas a decisão ainda demora."
2. "O NeoView centraliza essa jornada: pergunta, indicador, relatório, governança e decisão."
3. "Aqui na Home, o usuário começa pela pergunta de negócio."
4. "Com a IRIS, ele pode perguntar como está um indicador, comparar anos ou empresas."
5. "Ao encontrar uma resposta, ele consegue abrir o relatório fonte."
6. "No detalhe, o relatório tem responsável, validade, histórico e indicadores relacionados."
7. "Na área de validações, a governança aparece: aprovar, rejeitar, delegar e acompanhar."
8. "Este é um protótipo funcional com dados representativos."
9. "A próxima etapa é um piloto controlado com dados reais, poucos indicadores críticos e métricas de impacto."
10. "O objetivo é reduzir o tempo entre informação e decisão."

## 26. Resumo Final Para Enviar Ao ChatGPT

O NeoView é um protótipo funcional para a Neoenergia Coelba, criado para transformar relatórios e indicadores em decisões rastreáveis. O sistema possui Home como Central de Decisão, Workspace com prioridades, Dashboard hierárquico, módulo de Relatórios, detalhes de relatório, Inteligência de Indicadores, Validações, Favoritos, Ajuda, Configurações e Superadmin.

A assistente IRIS é o diferencial. Ela entende contexto da página, indicadores, anos, empresas e perguntas de negócio. Pode responder como está um indicador, comparar anos, cruzar indicadores, comparar empresas, localizar relatórios e orientar o usuário dentro do NeoView. A arquitetura da IRIS foi modularizada em percepção, orquestração, memória local, validação, prompts centralizados e integração com backend RAG.

O protótipo usa dados representativos e personas fictícias para demonstrar o fluxo. A proposta para a banca não é vender produto final, mas defender um piloto controlado com dados reais, usuários definidos, poucos indicadores críticos e métricas de sucesso como tempo para encontrar relatório, tempo para comparar indicadores, retrabalho em aprovação e satisfação dos usuários.

Frase central do pitch:

> O NeoView não é mais um repositório de relatórios; é uma camada de inteligência para transformar relatório em decisão.

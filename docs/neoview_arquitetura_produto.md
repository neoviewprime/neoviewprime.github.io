# NeoView - arquitetura de produto e defesa técnica

Objetivo: orientar a evolução técnica da NeoView e dar segurança para responder perguntas de arquitetura no pitch sem transformar a apresentação em aula técnica.

## 1. Tese arquitetural

NeoView não deve ser arquitetado como "um site de relatórios".

A arquitetura correta é:

> Uma camada corporativa de governança, busca inteligente e decisão sobre relatórios, indicadores e documentos internos.

Isso muda o desenho do produto:

- Relatório não é só arquivo; é ativo governado.
- Indicador não é só número; é uma pergunta de negócio com contexto, meta e fonte.
- IA não é chat genérico; é uma camada consultiva conectada à base autorizada.
- Dashboard não é tela bonita; é porta de entrada para decisão e rastreabilidade.

## 2. Arquitetura atual observada

O projeto já possui uma base técnica relevante.

### Frontend

- React + Vite + TypeScript.
- Rotas principais: Home, Workspace, Relatórios, Indicadores, Aprovações, Favoritos, Ajuda, Configurações, Superadmin.
- IRIS no frontend com fallback local de demonstração.
- UI responsiva com barra inferior mobile.
- Dados de demonstração em `src/data/mockData.ts`.

### Backend

- Express.
- Rotas: autenticação, usuários, notificações, superadmin, relatórios, busca e chat.
- Catálogo de relatórios com estrutura hierárquica.
- Serviços de aprovação, engajamento, visibilidade, integridade e sincronização.
- RAG com pipeline próprio:
  - interpretação da pergunta;
  - busca por catálogo;
  - busca vetorial;
  - reranking;
  - construção de contexto;
  - resposta com fontes.
- Memória de chat e feedback.
- Vector store com possibilidade de SQLite/Chroma.
- Integrações preparadas para SAP HANA e SQLite.

### Dados

- SQLite no ambiente atual.
- Prisma presente, mas parte do schema está marcada com `@@ignore`, indicando que ainda há dívida de modelagem/identificação de chaves.
- Catálogo em JSON e sincronização para banco.
- Chunks de relatório e embeddings.
- Métricas de engajamento e eventos.

## 3. Arquitetura-alvo recomendada

Organizar a NeoView em 7 camadas.

```text
Usuário
  ↓
Experiência Web / Mobile
  ↓
Camada de Aplicação
  ↓
Governança e Permissões
  ↓
Catálogo + Indicadores + Relatórios
  ↓
Busca / RAG / IRIS
  ↓
Fontes corporativas e auditoria
```

## 4. Domínios do produto

### 4.1 Identidade e acesso

Responsável por:

- login;
- perfil do usuário;
- empresa, superintendência, gerência e unidade;
- papel de acesso;
- permissões por hierarquia;
- trilha de auditoria.

Risco:

- A IRIS exibir relatório que o usuário não pode ver.

Mitigação:

- Toda busca, fonte e resposta da IRIS deve passar por `reportVisibilityService` ou regra equivalente.
- A permissão precisa ser aplicada antes de montar contexto para IA, não apenas na interface.

### 4.2 Catálogo governado de relatórios

Responsável por:

- título;
- descrição;
- dono;
- área;
- validade;
- status;
- tags;
- indicadores relacionados;
- hierarquia;
- arquivo/link fonte;
- versão;
- métricas de uso.

Regra importante:

> Nenhum relatório crítico deve existir sem dono, área, status e validade.

Risco:

- Virar depósito de links desatualizados.

Mitigação:

- Fluxo de aprovação e revisão periódica.
- Sinalização de relatório vencido.
- Métrica de relatórios sem dono ou sem revisão.

### 4.3 Indicadores inteligentes

Responsável por:

- nome do indicador;
- sigla;
- descrição;
- unidade;
- direção da leitura;
- meta;
- série histórica;
- relatórios fonte;
- indicadores relacionados;
- pergunta de negócio que o indicador responde.

Exemplo:

```text
DEC
Pergunta: quanto tempo, em média, o cliente ficou sem energia?
Direção: quanto menor, melhor.
Cruzar com: FEC, ISQP e causas de interrupção.
```

Risco:

- Usuário pedir um indicador que não responde à pergunta real.

Mitigação:

- A IRIS deve explicar quando o indicador faz sentido e quando precisa ser cruzado com outro.

### 4.4 Busca corporativa

Responsável por:

- busca textual;
- busca por hierarquia;
- busca por indicador;
- busca por intenção;
- filtros por período, área e status;
- retorno com fontes.

Risco:

- Resultado irrelevante ou excesso de resultados.

Mitigação:

- Ranking híbrido: texto + hierarquia + indicador + engajamento + feedback.
- Explicação curta do motivo do resultado.

### 4.5 IRIS

Responsável por:

- entender pergunta natural;
- identificar intenção;
- buscar fontes autorizadas;
- comparar indicadores;
- responder com síntese;
- citar fontes;
- sugerir próximo passo;
- aprender com feedback.

Arquitetura ideal da IRIS:

```text
Pergunta do usuário
  ↓
Classificador de intenção
  ↓
Resolução de entidades
  - indicador
  - ano/período
  - empresa/área
  - relatório
  ↓
Filtro de permissão
  ↓
Busca híbrida
  - catálogo
  - FTS
  - embeddings
  - memória
  ↓
Reranking
  ↓
Construção de contexto
  ↓
Resposta com fontes
  ↓
Feedback e aprendizado
```

Regra para pitch:

> A IRIS não é "uma IA que sabe tudo"; é uma assistente que consulta uma base governada e responde com rastreabilidade.

### 4.6 Aprovação e ciclo de vida

Responsável por:

- submissão de relatório;
- rascunho;
- aprovação;
- rejeição;
- delegação;
- publicação;
- arquivamento;
- histórico de decisão.

Risco:

- Relatório ser publicado sem validação ou ficar parado.

Mitigação:

- SLA de aprovação.
- Notificações.
- Delegação.
- Métrica de tempo de ciclo.

### 4.7 Observabilidade e mensuração

Responsável por:

- visualizações;
- favoritos;
- comentários;
- compartilhamentos;
- busca sem resultado;
- taxa de sucesso da busca;
- feedback útil/não útil da IRIS;
- tempo até abrir relatório;
- ciclo de aprovação.

Risco:

- Defender ganho sem medição.

Mitigação:

- Criar painel mínimo de validação com 5 métricas:
  - tempo médio de busca;
  - taxa de sucesso da busca;
  - usuários ativos;
  - relatórios acessados;
  - feedback positivo da IRIS.

## 5. Decisões técnicas recomendadas

### 5.1 Separar claramente ambiente demo e ambiente produto

Hoje a experiência usa fallback local no frontend para garantir demo.

Isso é bom para pitch, mas a arquitetura produto precisa separar:

- dados de demonstração;
- dados reais;
- dados projetados/modelados;
- métricas auditadas.

Recomendação:

- Criar flag explícita de ambiente.
- Impedir que dados de demonstração contaminem métricas reais.
- No pitch, tratar como demonstração/modelagem quando perguntarem.

### 5.2 Aplicar permissão antes da IA

Regra:

> A IA só pode receber contexto que o usuário tem permissão para acessar.

Não basta esconder resultado no frontend.

Fluxo correto:

```text
Usuário pergunta
  ↓
Sistema identifica usuário e hierarquia
  ↓
Busca fontes candidatas
  ↓
Filtra fontes por permissão
  ↓
Monta contexto para IRIS
  ↓
Gera resposta
```

### 5.3 Tratar indicadores como entidade própria

Hoje indicadores aparecem misturados ao catálogo/mock.

Para escalar, criar entidade própria:

- `indicator`
- `indicator_series`
- `indicator_target`
- `indicator_report_source`
- `indicator_relationship`

Isso permite comparar anos, metas e relatórios sem depender de texto solto.

### 5.4 Criar contratos de dados para relatório

Um relatório deve ter campos mínimos:

```text
id
title
description
owner_user_id
company_id
area_id
status
valid_from
valid_until
source_url
version
indicators
visibility_rules
created_at
updated_at
```

### 5.5 Responder sempre com fonte

Toda resposta analítica da IRIS deve ter pelo menos:

- indicador identificado;
- período usado;
- interpretação;
- fonte;
- ressalva, quando necessário.

Se não houver fonte suficiente:

> Não encontrei fonte confiável para responder com segurança.

Essa frase aumenta confiança.

## 6. Arquitetura para defender no pitch

Não mostrar todos os detalhes. Use esta fala:

> A arquitetura do NeoView tem três pilares: governança da informação, busca inteligente e rastreabilidade. Primeiro, cada relatório entra com dono, área, status e permissão. Depois, a busca e a IRIS consultam apenas fontes autorizadas. Por fim, toda resposta retorna para o relatório fonte, permitindo auditoria e confiança.

Se perguntarem sobre IA:

> A IRIS usa uma abordagem de recuperação de contexto: antes de responder, ela busca relatórios e indicadores relevantes, filtra pelo acesso do usuário e constrói a resposta com base nessas fontes.

Se perguntarem sobre escala:

> O modelo é hierárquico: empresa, superintendência, gerência, unidade, projeto, relatório e indicador. Isso permite começar em uma área e replicar para outras sem redesenhar a solução.

## 7. Roadmap técnico recomendado

### Fase 1 - Pitch/piloto controlado

Objetivo: demonstrar valor com segurança.

- Manter demo navegável.
- Medir uso com 20+ usuários atuais.
- Selecionar 30 a 50 relatórios críticos.
- Definir donos e validade.
- Medir tempo de busca antes/depois.
- Garantir que cliques principais funcionem.

### Fase 2 - Produto mínimo governado

Objetivo: tirar a solução da categoria "demo bonita".

- Modelo real de indicadores.
- Permissões aplicadas no backend.
- Upload/publicação com aprovação.
- Logs de auditoria.
- Painel de métricas real.
- Base de feedback da IRIS.

### Fase 3 - Escala corporativa

Objetivo: replicar por áreas e empresas.

- Integração com fontes corporativas.
- Conector SAP/HANA quando fizer sentido.
- Catálogo federado por empresa.
- Retenção e versionamento de relatórios.
- Monitoramento de qualidade da base.
- SLOs de busca e disponibilidade.

### Fase 4 - Inteligência avançada

Objetivo: sair de busca para decisão assistida.

- Comparação automática entre anos.
- Detecção de indicadores fora da meta.
- Sugestão de causa provável.
- Alertas para relatórios vencidos.
- Recomendação de relatório por perfil.
- Análise de lacunas: perguntas sem resposta e indicadores sem fonte.

## 8. Riscos arquiteturais

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| IA acessar fonte indevida | Alto | Filtro de permissão antes do contexto da IA. |
| Base desatualizada | Alto | Dono, validade, status e revisão periódica. |
| Catálogo virar depósito | Alto | Aprovação, curadoria e métricas de uso. |
| Resposta sem fonte | Médio/alto | Exigir fonte em respostas analíticas. |
| Indicador mal interpretado | Médio | Modelar direção, meta e pergunta de negócio. |
| Escopo amplo | Médio | Piloto de 30 dias com área e relatórios críticos. |
| Dependência de integração | Médio | Começar com catálogo governado e integrar depois. |
| Métrica não auditável | Médio | Medir antes/depois e separar modelagem de dado real. |

## 9. O que vale construir primeiro

Prioridade prática:

1. Modelo real de indicador e série histórica.
2. Página de detalhe de relatório conectada ao catálogo real.
3. Permissões aplicadas no backend para busca e IRIS.
4. Registro de busca e clique útil.
5. Painel simples de validação do piloto.
6. Curadoria: dono, validade e status de cada relatório.

Não priorizar agora:

- Muitas telas novas.
- Gráficos complexos sem dado real.
- IA generativa ampla.
- Integrações pesadas antes de validar uso.
- Personalização visual excessiva.

## 10. Checklist técnico para banca

Se perguntarem tecnicamente, responder com segurança sobre:

- Como a permissão limita a busca.
- Como a IRIS encontra fontes.
- Como relatório entra na base.
- Como um relatório é aprovado.
- Como saber se um relatório está desatualizado.
- Como medir H/H recuperado.
- Como escalar de Coelba para outras empresas.
- Como evitar que dados de demonstração sejam confundidos com dados reais.

## 11. Frase técnica final

> A arquitetura do NeoView foi pensada para que a IA não seja uma camada solta. Ela opera sobre uma base governada, com permissão, fonte e auditoria. É isso que transforma um portal de relatórios em uma plataforma confiável de decisão.


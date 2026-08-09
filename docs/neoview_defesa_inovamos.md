# NeoView - defesa para o Inovamos

Este documento reorganiza a proposta `NeoView - Central de Relatórios#6166` para deixá-la mais competitiva no edital. A leitura usa o CSV, o edital, o PDF `NEOVIEW - ANALYTICS.pdf`, o PPTX `NeoView_Pitch_Coelba_v4.pptx`, o roteiro final `docs/neoview_roteiro_pitch_final.md`, o plano anti-risco `docs/neoview_pitch_anti_risco.md`, a arquitetura de produto `docs/neoview_arquitetura_produto.md`, o modelo relacional em dbdiagram e a informação operacional atual de que a NeoView já possui relatórios reais e mais de 20 usuários utilizando a solução. A conclusão honesta: a ideia é forte e entra no páreo top 2/top 3, desde que a adoção real seja demonstrada com evidências simples.

## 1. Tese competitiva

Nome recomendado:

**NeoView - Sistema Inteligente de Governança e Busca de Relatórios Corporativos**

Tese:

> A NeoView reduz tempo perdido, retrabalho e risco de decisão com relatório desatualizado ao centralizar relatórios corporativos em uma estrutura governada, com busca inteligente, permissões, aprovação, auditoria e aprendizado por feedback dos usuários.

Formulação curta para pitch:

> NeoView transforma informação dispersa em produtividade corporativa, reduzindo o tempo de busca, aumentando a confiança nos dados e acelerando decisões com governança.

Essa formulação é mais forte que "central de relatórios", porque ataca diretamente os critérios do edital: problema relevante, impacto operacional, H/H economizado, impacto estratégico, inovação, viabilidade, indicadores e escalabilidade.

## 2. Evidências complementares encontradas

O PDF e o PPTX acrescentam evidências que não estavam fortes no CSV:

| Evidência | Valor encontrado | Leitura honesta |
| --- | ---: | --- |
| Tempo médio sem central | 30 min por busca | Premissa modelada, útil para business case. |
| Tempo médio com NeoView | 8 min por busca | Premissa modelada; existe uso real, mas falta cronometragem auditável. |
| Economia por demanda | 22 min | Base objetiva para cálculo de H/H. |
| Redução percentual | 73,3% | Número forte para pitch, desde que tratado como estimativa. |
| Produtividade recuperada | 65.880 h/ano | Associada ao cenário intermediário de adoção. |
| Conversão financeira | Existe no PDF | Usar apenas como retaguarda técnica, caso a banca pergunte. Não levar para a fala principal. |

Evidência operacional atual informada:

| Evidência | Situação | Como usar no pitch |
| --- | --- | --- |
| Usuários reais | Mais de 20 usuários utilizando | Prova que não é apenas conceito ou protótipo isolado. |
| Relatórios reais | Relatórios reais cadastrados e consumidos | Prova aderência ao trabalho cotidiano. |
| Maturidade | Uso inicial em ambiente real | Eleva a defesa de "protótipo testado" para "solução em uso inicial". |
| Lacuna honesta | Falta anexar prova objetiva | Levar prints, logs, analytics, lista de relatórios e evidências de acesso. |

Evidência técnica complementar:

| Evidência | Referência | Como usar |
| --- | --- | --- |
| Modelo relacional | https://dbdiagram.io/d/Modelo-relacional-neoview-69bf2e50fb2db18e3bd42502 | Usar se perguntarem sobre arquitetura de dados, rastreabilidade, relacionamentos, escala ou governança. |
| Roteiro final de fala | `docs/neoview_roteiro_pitch_final.md` | Usar para treino de ritmo, ênfase, sorriso e fechamento. |
| Plano anti-risco do pitch | `docs/neoview_pitch_anti_risco.md` | Usar para preparar respostas difíceis, controlar a demo e evitar promessas excessivas. |
| Arquitetura de produto | `docs/neoview_arquitetura_produto.md` | Usar como backup técnico para perguntas sobre IA, governança, permissões, escala e roadmap. |

## 3. Problema

Hoje, relatórios, dashboards, links e documentos de apoio podem ficar espalhados em pastas, e-mails, planilhas, drives, sistemas internos e mensagens. Isso gera quatro perdas principais:

- Tempo para encontrar a informação correta.
- Risco de usar relatório duplicado, antigo ou sem dono claro.
- Retrabalho para solicitar links, versões, permissões e atualização.
- Baixa rastreabilidade sobre quem acessa, aprova, atualiza ou descontinua relatórios.

O problema não é "faltam relatórios". O problema é que a informação existe, mas nem sempre está governada, encontrável, atualizada e pronta para decisão.

## 4. Solução

A NeoView propõe uma camada corporativa de governança e inteligência sobre relatórios:

- Catálogo hierárquico por empresa, área, superintendência, gerência e tema.
- Busca inteligente por título, descrição, tags, área e intenção do usuário.
- Chatbot com RAG local para responder com base no conteúdo e direcionar o usuário ao relatório correto.
- Fluxo de aprovação para publicação, atualização e exclusão de relatórios.
- Controle de permissões e visibilidade por perfil.
- Métricas de engajamento, acesso, busca sem resultado, favoritos e avaliações.
- Auditoria para rastrear alterações, donos, status e validade dos relatórios.
- Aprendizado contínuo com avaliações do usuário, termos buscados e lacunas encontradas.

## 5. Diferencial de inovação

A NeoView não deve ser defendida como repositório. O diferencial está na combinação:

| Camada | O que entrega |
| --- | --- |
| Governança | Dono do relatório, status, aprovação, exclusão segura, trilha de auditoria. |
| Inteligência | Busca semântica, chatbot/RAG, compreensão de intenção e sugestões. |
| Decisão | Centraliza o caminho até a informação confiável e reduz dispersão. |
| Aprendizado | Usa feedback, perguntas sem resposta e avaliações para melhorar a base. |
| Escala | Pode ser replicada por área, empresa, processo e tipo de relatório. |

## 6. Pontuação estimada no edital

| Critério | Peso | Nota estimada | Justificativa honesta |
| --- | ---: | ---: | --- |
| Relevância do problema | 10 | 9 | Dor real e transversal: relatórios dispersos, dificuldade de localização e governança. |
| Impacto financeiro | 15 | 13 | A defesa principal é H/H recuperado e produtividade. A conversão monetária existe no PDF, mas fica como apoio técnico. |
| Impacto estratégico | 10 | 9 | Apoia decisão, padronização e gestão da informação. |
| Impacto operacional | 10 | 10 | Já há uso real informado com relatórios reais e 20+ usuários, além de redução operacional modelada. |
| Impacto em pessoas/clientes/sociedade | 10 | 8 | Impacto forte em colaboradores e áreas decisoras; indireto para cliente final. |
| Grau de inovação | 15 | 13 | RAG local, busca semântica, governança e aprendizado elevam a proposta. |
| Viabilidade técnica e operacional | 10 | 9 | A solução já funciona com usuários e relatórios reais; falta anexar evidência e consolidar medição. |
| Viabilidade econômica | 5 | 4 | Pode usar infraestrutura web simples, mas precisa estimar manutenção e suporte. |
| Escalabilidade e replicabilidade | 5 | 5 | Alta escala por área e empresa. |
| Indicadores e mensuração | 5 | 5 | O business case traz fórmula, tempo por busca, cenários e premissas; agora falta medir com os usuários reais. |
| Qualidade do pitch | 5 | 5 | O PPTX já apresenta narrativa executiva clara, com antes/depois e números fortes. |
| Total | 100 | 90 | Top 2/top 3 pelo material completo; passa de 92 com evidência objetiva de uso e medição antes/depois. |

## 7. Como defender os números sem exagerar

O ponto mais sensível é não vender valor em dinheiro na fala principal. A frase correta:

> Com base em modelagem de cenário, a NeoView pode reduzir o tempo médio de localização e validação de informações de 30 para 8 minutos por busca, recuperando 22 minutos por demanda. Em cenário intermediário de adoção, isso representa até 65.880 horas produtivas recuperadas ao ano.

Frase que deve ser evitada:

> A NeoView já economizou dinheiro.

Motivo: o PDF deixa claro que a análise foi construída como modelagem de cenário, sem medição operacional direta por perfil. Isso não enfraquece a proposta; pelo contrário, mostra maturidade e honestidade.

## 8. O que medir antes da apresentação

Métricas mínimas para transformar o uso atual em candidatura difícil de contestar:

| Métrica | Como medir | Por que importa |
| --- | --- | --- |
| Tempo médio para localizar relatório | Cronometrar busca antes/depois com parte dos 20+ usuários atuais. | Mostra ganho operacional direto. |
| Taxa de sucesso da busca | Buscas com clique útil dividido por buscas totais. | Prova qualidade da busca e do chatbot. |
| Buscas sem resultado | Termos buscados sem relatório encontrado. | Mostra aprendizado e lacunas da base. |
| Relatórios duplicados ou desatualizados | Quantidade identificada na base real atual. | Converte governança em risco evitado. |
| Solicitações por e-mail evitadas | Comparar pedidos antes/depois da validação com usuários atuais. | Mostra redução de ruído operacional. |
| Ciclo de aprovação | Tempo de solicitação até publicação. | Prova eficiência do fluxo. |
| Usuários ativos | Usuários distintos por semana. | Prova adoção. |
| Feedback positivo | Avaliações úteis dividido por avaliações totais. | Prova valor percebido pelo usuário. |

## 9. Fórmula de H/H economizado

Use uma conta simples, defensável e alinhada ao PDF:

```text
H/H economizado por ano =
usuarios ativos x buscas por dia x 22 dias uteis x 12 meses x 0,367
```

Premissas usadas no business case:

```text
Sem central: 30 min por busca
Com NeoView: 8 min por busca
Economia: 22 min por busca = 0,367 h
Reducao percentual: 73,3%
```

Conversão financeira:

```text
Valor anual estimado =
H/H economizado por ano x custo médio da hora do colaborador
```

Essa conversão fica como material de apoio, não como fala de slide. Para a banca, o ideal é dizer: "o uso real com 20+ usuários permite transformar a estimativa de H/H em indicador auditável".

## 10. Validação auditável recomendada

Escopo enxuto usando a adoção que já existe:

- 1 empresa ou superintendência.
- 20+ usuários já existentes.
- Relatórios reais já cadastrados.
- 30 dias de uso.
- 5 indicadores principais: tempo de busca, sucesso da busca, H/H estimado, relatórios duplicados/desatualizados e feedback útil.

Critério de sucesso:

- Reduzir em pelo menos 50% o tempo médio para encontrar relatório.
- Obter taxa de sucesso de busca acima de 75%.
- Identificar relatórios sem dono, duplicados ou desatualizados.
- Medir economia de H/H com base em comportamento real.

## 11. Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Relatórios sem dono claro | Exigir responsável, área, validade e status. |
| Conteúdo sensível | Usar perfis de acesso, autenticação e registro de auditoria. |
| Dados antigos na base | Campo de validade, revisão periódica e fluxo de atualização. |
| Baixa adesão | Começar por área com dor real e usuários-chave. |
| Busca ou chatbot errando | Registrar perguntas sem resposta, feedback ruim e termos não encontrados. |
| Escopo grande demais | Validação de 30 dias com usuários atuais e poucos indicadores. |
| Percepção de "mais um portal" | Defender governança + inteligência + rastreabilidade + decisão. |

## 12. Pitch de 3 minutos

Versão definitiva para apresentação: `docs/neoview_roteiro_pitch_final.md`.

Resumo abaixo para consulta rápida:

**Abertura**

Na Neoenergia, muitos relatórios e dashboards importantes existem, mas nem sempre são fáceis de encontrar, validar ou governar. O colaborador perde produtividade procurando a versão correta, pedindo links, confirmando se o relatório ainda está válido ou tentando entender qual painel responde à sua dúvida.

**Problema**

Essa dispersão gera retrabalho, perda de produtividade e risco de decisão baseada em informação desatualizada. O desafio não é criar mais relatórios. É garantir que a informação certa esteja disponível, confiável, atualizada e acessível para quem precisa decidir.

**Solução**

A NeoView é um sistema inteligente de governança e busca de relatórios corporativos. Ela centraliza relatórios por hierarquia, controla aprovação e permissões, registra auditoria e usa busca inteligente com chatbot/RAG local para entender a intenção do usuário e levá-lo ao relatório correto. A solução já possui uso real informado, com mais de 20 usuários e relatórios reais.

**Inovação**

O diferencial está em unir governança, inteligência e aprendizado contínuo. Cada busca, avaliação e pergunta sem resposta ajuda a melhorar a base. Assim, a NeoView não é apenas um catálogo: ela vira uma camada viva de organização, qualidade e acesso à informação corporativa.

**Impacto**

O business case estima redução de 30 para 8 minutos por busca, economia de 22 minutos por demanda e ganho de eficiência de 73,3%. Em um cenário intermediário, isso representa 65.880 horas produtivas recuperadas por ano. Como já há usuários e relatórios reais, o próximo passo é transformar o uso atual em evidência auditável.

**Fechamento**

A NeoView melhora a forma como a empresa encontra, governa e usa seus relatórios. Ela reduz retrabalho, aumenta confiança na informação e cria uma base escalável para decisão orientada a dados.

## 13. Perguntas difíceis da banca

| Pergunta | Resposta recomendada |
| --- | --- |
| Isso não é só um portal de links? | Não. O portal é apenas a interface. O valor está em governança, aprovação, permissões, auditoria, busca inteligente, chatbot/RAG e métricas de uso. |
| Isso já está em uso ou é só protótipo? | Já existe uso real informado, com mais de 20 usuários e relatórios reais. O próximo passo é anexar evidências desse uso: prints, logs, analytics e lista de relatórios. |
| Como vocês provam economia? | Hoje temos business case estimado em H/H com premissas claras e uma base real de uso. A prova final vem da medição antes/depois com usuários atuais: buscas úteis, solicitações evitadas e H/H economizado. |
| Por que não falar em dinheiro no slide? | Porque a etapa precisa entender o valor operacional. H/H economizado é mais direto, defensável e menos contestável; a conversão financeira fica como apoio se a banca pedir. |
| O chatbot pode responder errado? | Sim, por isso ele deve responder com base na base local, citar o relatório de origem, registrar avaliação do usuário e encaminhar dúvidas sem resposta para melhoria da base. |
| Como evitar relatório desatualizado? | Cada relatório precisa de dono, validade, status e fluxo de revisão. Relatórios vencidos podem ser sinalizados ou ocultados. |
| A solução escala para outras áreas? | Sim. A estrutura por hierarquia, tags, permissões e donos permite replicar por área, empresa e tipo de relatório. |
| Qual é o maior risco? | A qualidade e manutenção da base. A mitigação é fazer medição controlada, curadoria de relatórios críticos e indicadores simples. |
| Qual o custo? | A proposta pode começar com infraestrutura web enxuta e evoluir conforme uso. O custo deve ser comparado ao H/H economizado, à redução de retrabalho e ao risco reduzido. |
| Por que isso é inovação? | Porque aplica inteligência e aprendizado à governança de relatórios, transformando acervo disperso em mecanismo de decisão rastreável. |
| O que já existe? | Há solução com estrutura de relatórios, autenticação, aprovação, busca, chatbot, base local, relatórios reais e mais de 20 usuários informados. |
| O que falta para virar produto interno? | Formalizar evidências de uso, validar permissões, medir indicadores, organizar curadoria da base e confirmar as premissas de H/H. |

## 14. Checklist antes de submeter

- Trocar o foco de "central de relatórios" para "governança e busca inteligente de relatórios corporativos".
- Incluir 3 a 5 prints que mostrem fluxo real: busca, relatório, aprovação, painel e chatbot.
- Levar print ou export comprovando 20+ usuários e relatórios reais.
- Levar uma medição real simples com os usuários atuais.
- Usar o business case na fala: 30 min para 8 min, 22 min por demanda, 73,3% e 65.880 H/H/ano.
- Deixar a conversão em dinheiro apenas como apoio técnico, caso seja perguntado.
- Mostrar que a solução respeita permissões, auditoria e segurança.
- Mostrar aprendizado do chatbot por feedback e buscas sem resposta.
- Evitar prometer IA genérica; prometer IA controlada pela base local.
- Fechar com impacto: tempo, retrabalho, risco, governança e decisão.

# Pareamento das ideias com o Edital Inovamos

Base analisada:

- `docs/edital_inovamos.txt`
- `docs/ideias.csv`
- `docs/NEOVIEW - ANALYTICS.pdf`
- `docs/NeoView_Pitch_Coelba_v4.pptx`
- `docs/neoview_roteiro_pitch_final.md`
- Modelo relacional em dbdiagram: https://dbdiagram.io/d/Modelo-relacional-neoview-69bf2e50fb2db18e3bd42502

Este documento faz uma avaliação honesta de aderência das ideias ao edital. As notas abaixo não são resultado oficial nem substituem a banca. Elas medem a força documental da proposta no CSV contra a matriz do edital: se uma ideia pode ter impacto, mas o texto não demonstra evidência, indicador, teste ou viabilidade, a nota foi reduzida.

Atualização importante: a avaliação inicial considerava apenas o CSV e o edital. Com a leitura do PDF `NEOVIEW - ANALYTICS.pdf` e do PPTX `NeoView_Pitch_Coelba_v4.pptx`, a NeoView passa a ter business case estimado, narrativa executiva e métricas de ganho operacional. Isso melhora sua posição no páreo. Na fala e nos slides, a estratégia recomendada é vender H/H recuperado e produtividade, não valor em dinheiro. A conversão financeira fica como material de apoio, caso a banca pergunte.

Atualização operacional informada pelo proponente: a NeoView já possui relatórios reais e mais de 20 usuários utilizando a solução. Isso muda a maturidade da proposta: ela deixa de ser apenas protótipo/business case e passa a ser solução em uso inicial. A ressalva honesta é que essa evidência deve ser anexada ou demonstrada por prints, logs, lista de relatórios cadastrados, usuários ativos ou histórico de acessos.

Atualização de pitch: foi criado o roteiro final `docs/neoview_roteiro_pitch_final.md`, com fala por slide, marcação de ênfases, pausas e orientação de postura. Esse material melhora a qualidade de apresentação, especialmente no critério de pitch, porque organiza problema, impacto, solução, resultados, benefícios e fechamento em narrativa de 8 slides.

## 1. Regra de honestidade

O sistema adota cinco regras para evitar nota inflada:

1. Tecnologia por si só não vence. IA, dashboard, app ou automação só pontuam alto quando resolvem um problema real e mensurável.
2. Ideia sem resultado ou sem teste recebe trava de maturidade. Pode ter potencial, mas não deve competir igual com solução já testada ou em uso.
3. Impacto financeiro precisa ser demonstrado ou estimável. Frases como "gera economia" ajudam menos que H/H, redução percentual, multa evitada, retrabalho eliminado ou escala.
4. Viabilidade vale muito. Soluções dependentes de licença indisponível, ferramenta não homologada ou alteração em sistema crítico perdem pontos.
5. Escala e governança pesam no desempate. Uma solução replicável, auditável e aderente à realidade da Neoenergia tende a superar uma solução local sem plano de expansão.

## 2. Critérios usados

A matriz segue o edital:

| Critério | Peso |
| --- | ---: |
| Relevância do problema | 10 |
| Impacto financeiro | 15 |
| Impacto estratégico | 10 |
| Impacto operacional | 10 |
| Impacto em pessoas, clientes ou sociedade | 10 |
| Grau de inovação | 15 |
| Viabilidade técnica e operacional | 10 |
| Viabilidade econômica | 5 |
| Escalabilidade e replicabilidade | 5 |
| Indicadores e mensuração | 5 |
| Qualidade do pitch | 5 |
| Total | 100 |

## 3. Travas de maturidade

Antes da nota final, cada ideia passa por uma trava de maturidade:

| Nível | Evidência no CSV | Teto sugerido |
| --- | --- | ---: |
| Solução em uso ou piloto com evidência | Usuários reais, resultados, escala, indicadores | 100 |
| Protótipo testado | Testes, fluxos, dados, validação parcial | 88 |
| Protótipo navegável ou conceito técnico | Telas, app, dashboard, fluxo, mas pouco resultado | 78 |
| Ideia promissora sem validação | Texto conceitual, pouca evidência | 65 |
| Incompleta ou sem aderência mínima | Sem problema, resultado ou detalhes | 30 |

Isso evita que uma proposta muito bem escrita, mas não validada, passe à frente de uma solução menos chamativa e mais provada.

## 4. Ranking geral

Foram avaliadas as 43 ideias do CSV. Diferenças de até 2 pontos devem ser lidas como empate técnico, porque a decisão real da banca pode mudar conforme pitch, evidências anexas e domínio do apresentador.

| Rank | Ideia | Nota | Leitura honesta |
| ---: | --- | ---: | --- |
| 1 | Portal de Correções#6490 | 92 | Muito forte: solução em uso nas distribuidoras, rastreabilidade, governança, redução de H/H e risco de multas. Precisa apenas quantificar melhor o ganho financeiro. |
| 2 | NeoView - Central de Relatórios#6166 | 90 | Sobe com uso real informado: mais de 20 usuários, relatórios reais, business case estimado, ganho de 30 para 8 min por busca, redução de 73,3% e 65.880 H/H/ano em cenário intermediário. Na apresentação, o melhor é vender H/H recuperado, não dinheiro. Falta anexar evidência objetiva de uso e medir antes/depois para passar de 92. |
| 3 | Portal de Centralização de Automações (Origo)#5807 | 90 | Forte por escala, governança, automações modulares, logs e visão executiva. Excelente aderência a eficiência, dados e risco. Empate técnico com NeoView. |
| 4 | NEO CHECK APLICATIVO#6671 | 88 | Forte por campo, escala nas cinco distribuidoras, conformidade, app + BI e uso real por consultores. Segue muito competitivo; a diferença para NeoView depende da evidência anexada de uso e impacto. |
| 5 | Aplicativo para solicitações de serviços - PCP#6374 | 87 | Um dos melhores em evidência: antes/depois claro, encarteiramento subindo de cerca de 4% para 42%. |
| 6 | Automação do Cadastro para Migração do Mercado Livre#6733 | 85 | Boa combinação de eficiência, mercado, rastreabilidade e redução de erro manual. |
| 7 | Otimizador Inteligente de Rota e Alocação de Equipes de Campo#5527 | 85 | Forte operacionalmente, já desenvolvido e em implementação, com ganhos percebidos em deslocamento e execução. |
| 8 | Do Dado à Decisão: BSC Integrado#5897 | 84 | Forte para liderança, estratégia, padronização e indicadores. Precisa converter melhor em valor financeiro. |
| 9 | H2Maps - Hidrogênio Verde#5611 | 83 | Muito inovador e estratégico/ESG. Risco: pode soar distante da operação atual se o pitch não provar viabilidade e uso corporativo imediato. |
| 10 | Sistema Integrado de Rastreamento de Equipamentos#6730 | 80 | Forte em rastreabilidade de ativos e risco operacional. Precisa quantificar impacto e provar uso real. |
| 11 | Operação Base Forte#6782 | 80 | MVP validado, fluxo cadastral de ativos e rastreabilidade. Bom encaixe operacional, mas precisa números de escala/ganho. |
| 12 | Inteligência para Tratamento de Dados e Planejamento do Sistema Elétrico#7176 | 80 | Boa base técnica e testes internos. Risco de escopo amplo demais; precisa recortar caso de uso com ganho mensurável. |
| 13 | Automatização no Processo de Equipamentos Indisponíveis#6560 | 79 | Boa automação de base, extração diária, matriz de risco e integração ao processo. Fica mais forte se demonstrar redução de indisponibilidade e valor recuperado. |
| 14 | Monitoramento/Acompanhamento de Recursos do COI Backup#6646 | 79 | Boa observabilidade, alertas e prevenção em contingência. Forte em segurança operacional. |
| 15 | Automação de Notas de Medição Gráfica#6136 | 79 | Excelente indicador de redução acima de 80%. Menor inovação por ser planilha, mas alto valor prático. |
| 16 | Ferramenta de Análise de Consumo de Religadores#7074 | 78 | Boa validação com amostra de 40 religadores e pipeline de dados. Precisa traduzir em economia/risco evitado. |
| 17 | Interface de Análise de Religadores#6684 | 77 | Boa consolidação de bases e apoio à priorização. Similar a outras ideias técnicas, com menor diferencial de escala. |
| 18 | Controle Integrado de Materiais Técnico & Segurança#6508 | 77 | Bom controle financeiro-operacional via BI, semanal e por UTD. Precisa estimar economia e adoção. |
| 19 | Hub Control Corp#6724 | 77 | Boa centralização corporativa com formulários, BI e governança. Competitivo, mas menos diferenciado que Origo/NeoView. |
| 20 | Mapa Gerencial - Carteira de Grandes Clientes#6747 | 77 | Boa visão gerencial da carteira, status e obras de grandes clientes. Precisa reforçar impacto financeiro, previsibilidade e indicadores de decisão. |
| 21 | Modelagem Estratégica de Mercado#6532 | 76 | Modelo preditivo para migração de clientes é estratégico. Precisa validação robusta e conversão em receita/oportunidade. |
| 22 | Cadastro Inteligente + Cashback Verde#6569 | 75 | Bom para cliente, PIX, fatura digital, cadastro e sustentabilidade. Depende de validação econômica do incentivo. |
| 23 | Sistema FAQ Regulatório#7232 | 74 | Útil, viável e com ganho em retrabalho regulatório. Menor nota por base inicial ainda manual e impacto pouco mensurado. |
| 24 | Portal Centralizado de Informe de Seguros#6457 | 73 | Fluxo ponta a ponta validado e boa governança. Escopo mais restrito reduz competitividade. |
| 25 | GSE EFFICIENCY#7227 | 73 | Problema real, arrecadação e TMAE. Precisa demonstrar números e protótipo mais robusto. |
| 26 | SmartEnergy+#7118 | 72 | Bom impacto cliente/consumo e uso de comunicação inteligente. Testes parecem mais sintéticos; precisa prova com cliente real. |
| 27 | Ferramenta de Orçamentação#6153 | 72 | Resultados positivos e padronização. Menor nota por risco de adoção/ambiente e menor escala demonstrada. |
| 28 | Biblioteca Digital#7103 | 71 | Útil e já usada, com 700+ documentos mapeados. Menor inovação e impacto financeiro indireto. |
| 29 | IA Especializada para Suporte Regulatório#7228 | 70 | Potencial alto, mas a limitação de licenças impediu construção do núcleo da IA. Boa ideia, prova fraca. |
| 30 | Padronização e Eficiência na Manutenção Preventiva#5903 | 69 | Dor real e integração SAP, mas resultado descrito é genérico e há dependência de licenças. |
| 31 | Agente Inteligente Corporativo#7331 | 68 | O título promete IA, mas o resultado admite que não houve agente autônomo. Ainda assim validou automação de fluxo. |
| 32 | InovaHub#7150 | 68 | Boa proposta de cultura e repertório de inovação, mas impacto financeiro/operacional é indireto. |
| 33 | Plataforma Integrada de Gestão de Presenças#7154 | 67 | Viável e útil para pessoas, mas resultados são mais estéticos/funcionais do que de negócio. |
| 34 | Automação de processos no GMM com JavaScript#6452 | 66 | Funcional e simples, com ganho de tempo. Precisa medir economia e reduzir risco de manutenção. |
| 35 | Operatta#7330 | 65 | Boa para gestão de competências e tarefas, mas o resultado está mais no futuro do que comprovado. |
| 36 | Controle de Hora Extra#6688 | 64 | Problema real e controle útil, mas solução em planilha e impacto pouco demonstrado. |
| 37 | KAFFA Route#6009 | 63 | Dor relevante, mas a solução original se mostrou inviável no prazo; alternativa precisa mais evidência. |
| 38 | Plataforma Digital de Contratação de Energia Grupo A#7266 | 62 | Boa aplicação para grandes clientes, mas texto é genérico e pouco mensurado. |
| 39 | Benchmark 4.0 - Agentes de IA#6655 | 60 | Argumento financeiro interessante, porém sem testes por falta de ferramenta. Alto potencial, baixa prova. |
| 40 | Ambiente Gerenciador do Programador do D18#7248 | 55 | Dor operacional real, mas sem resultados e ferramenta escolhida mudou para Access. |
| 41 | Gestão de Equipes de Obras em Crise#7421 | 54 | Problema importante, porém sem resultados e ainda em interface/protótipo básico. |
| 42 | Plataforma Projeta+#7339 | 51 | Tem intenção socioambiental, mas o texto não define bem problema, solução, indicadores e viabilidade. |
| 43 | Novo teste desafio#6268 | 5 | Incompleta. Não há conteúdo suficiente para avaliação. |

## 5. Páreo final entre candidatas fortes

| Páreo | Vencedor pelo texto atual | Por quê |
| --- | --- | --- |
| Portal de Correções vs Origo | Portal de Correções | O Portal tem uso nas distribuidoras e argumento financeiro/regulatório mais concreto. |
| Origo vs NeoView | Empate técnico, leve vantagem NeoView se anexar evidências de uso | Origo mostra operação consolidada; NeoView agora tem business case financeiro, pitch forte, relatórios reais e 20+ usuários informados. |
| NeoView vs BSC Integrado | NeoView | NeoView tem produto mais amplo, inteligência/RAG, governança e ROI modelado. BSC tem foco executivo direto, mas menor diferencial tecnológico. |
| NeoView vs PCP | Empate técnico, leve vantagem NeoView em escala | PCP tem antes/depois real muito forte; NeoView tem impacto financeiro estimado maior, uso real informado e tese mais transversal. A banca pode decidir pela qualidade da evidência. |
| NeoView vs H2Maps | Depende da banca | H2Maps vence em inovação/ESG futuro; NeoView vence em aderência imediata e viabilidade corporativa. |
| NeoView vs Neo Check | Empate técnico | Neo Check tem escala de campo e uso real; NeoView tem business case financeiro mais estruturado e valor transversal para gestão. |
| NeoView vs IA Regulatória | NeoView | NeoView tem solução funcional, uso real informado e governança; IA regulatória ainda depende de licenças/ambiente. |
| NeoView vs Biblioteca Digital | NeoView | Biblioteca tem uso real, mas NeoView tem maior amplitude, inteligência, governança e escala. |

## 6. Diagnóstico honesto da NeoView

Assumindo que a sua ideia é `NeoView - Central de Relatórios#6166`, ela é uma candidata forte e, com PDF/PPTX mais uso real informado, entra em condição real de top 2/top 3. A diferença central é que a NeoView agora tem três camadas de defesa: produto funcionando, adoção inicial com relatórios reais e narrativa financeira estimada.

Pontos fortes:

- Resolve uma dor real: relatórios, dashboards e documentos dispersos.
- Tem solução técnica com frontend/backend, autenticação, hierarquia, aprovação, busca e chatbot.
- Já possui uso real informado, com mais de 20 usuários e relatórios reais cadastrados.
- Tem business case estimado: redução de 30 min para 8 min por busca, economia de 22 min por demanda e ganho de eficiência de 73,3%.
- Apresenta cenário de produtividade para a Coelba: 65.880 H/H recuperadas por ano em cenário intermediário modelado.
- Tem boa aderência aos eixos de dados, tecnologia, governança, eficiência operacional e estratégia.
- É escalável: pode servir diferentes áreas, empresas, superintendências, gerências e unidades.
- Tem diferencial de inteligência: busca semântica/RAG, engajamento, feedback e aprendizado.
- Tem roteiro final de apresentação com fala por slide e material técnico complementar com modelo relacional em dbdiagram.

Pontos fracos:

- As métricas de H/H atuais são estimativas executivas, não economia já capturada e auditada.
- Ainda falta anexar evidência objetiva do uso real: print de usuários ativos, lista de relatórios reais, histórico de acessos, logs ou painel de analytics.
- Ainda falta uma medição antes/depois com usuários: tempo médio real para encontrar relatório, redução de e-mails, H/H economizado, relatórios duplicados eliminados, ciclo de aprovação reduzido.
- Ainda pode ser percebido como "portal de relatórios", categoria já comum, se o pitch não destacar governança + inteligência + decisão.
- A apresentação deve focar em H/H recuperado, tempo economizado e produtividade, deixando dinheiro apenas como cálculo de apoio.

Veredito:

NeoView está no páreo alto. Se entrar como "central de relatórios", ainda pode parecer comum. Se entrar como "plataforma de produtividade corporativa em uso real, com mais de 20 usuários, relatórios reais e potencial de reduzir 73,3% do tempo de busca", disputa top 2/top 3 com força. A ressalva honesta: para vencer sem contestação, precisa transformar o uso atual em evidência auditável e converter a estimativa de H/H em medição antes/depois.

## 7. Como a NeoView pode subir de 90 para 92+

Adicionar estas evidências ao pitch:

| Falta atual | Evidência que sobe nota |
| --- | --- |
| Uso real ainda não anexado | Print ou export com 20+ usuários ativos, relatórios reais, acessos por período e áreas envolvidas. |
| H/H estimado | Validar o modelo do PDF com dados reais: número de usuários, perfil, buscas por dia, tempo antes/depois. |
| Adoção real ainda pouco documentada | Registrar depoimentos curtos, feedbacks, usuários recorrentes e exemplos reais de relatórios encontrados. |
| Métricas ainda genéricas | Medir taxa de sucesso da busca, tempo até abrir relatório, aprovações concluídas, relatórios sem dono, relatórios duplicados. |
| Diferencial pode parecer comum | Reforçar RAG local, governança, permissões, auditoria, aprendizado por avaliação e exclusão segura. |
| Arquitetura pouco demonstrada no pitch | Abrir o modelo relacional apenas se a banca perguntar sobre dados, rastreabilidade ou escala. |
| Risco de escopo amplo | Propor validação controlada: uma superintendência, uma empresa, 30 dias, relatórios reais e 5 indicadores. |

## 8. Recomendação final

Se o objetivo for escolher a ideia com maior chance de vitória considerando CSV, PDF e PPTX, as favoritas são:

1. Portal de Correções
2. NeoView
3. Origo
4. Neo Check
5. PCP
6. Automação Mercado Livre

Se o objetivo for defender a sua ideia, a recomendação é manter NeoView, mas reposicionar a proposta. O caminho mais competitivo é:

> NeoView: plataforma de produtividade corporativa que reduz o tempo de busca da informação, governa relatórios e transforma dados dispersos em decisão rápida, confiável e rastreável.

Essa frase é mais forte que "central de relatórios", porque conversa diretamente com a matriz do edital: problema relevante, impacto operacional, H/H economizado, governança, dados, mensuração, viabilidade e escala.

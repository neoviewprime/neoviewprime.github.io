# NeoView - plano anti-risco para pitch

Objetivo: reduzir os pontos que podem enfraquecer a apresentação da NeoView e transformar cada risco em uma fala, evidência ou decisão prática de demo.

Este documento complementa:

- `docs/neoview_roteiro_pitch_final.md`
- `docs/neoview_defesa_inovamos.md`
- `docs/inovamos_pareamento_ideias.md`
- `docs/neoview_arquitetura_produto.md`

## 1. Mensagem central

Frase que deve guiar tudo:

> NeoView reduz o tempo entre procurar informação e tomar decisão, com governança, busca inteligente e rastreabilidade até o relatório fonte.

Evitar abrir o pitch dizendo:

> NeoView é uma central de relatórios.

Por quê: "central de relatórios" parece comum. A banca precisa ouvir produtividade, decisão, governança e inteligência.

Melhor formulação:

> O NeoView é uma plataforma de produtividade corporativa que organiza relatórios, entende perguntas do usuário e leva a pessoa até a informação confiável para decidir.

## 2. Riscos e como neutralizar

| Risco | Como pode aparecer | Como neutralizar no pitch |
| --- | --- | --- |
| Parecer bonito, mas confuso | Muitas telas, muitos cards, muita informação | Mostrar só uma jornada curta: pergunta -> comparação -> relatório fonte -> decisão. |
| Prometer IA demais | A banca pergunta se a IRIS "garante" resposta correta | Dizer que a IRIS apoia decisão, cita fontes e aprende com feedback; ela não substitui validação humana. |
| Dados simulados gerarem desconfiança | Perguntam se os números são reais ou modelados | Separar: uso real existe; os ganhos de H/H são modelagem defensável a validar com medição antes/depois. |
| Parecer só dashboard | A banca compara com BI, Power BI ou SharePoint | Defender governança + busca + IA + aprovação + rastreabilidade, não apenas visualização. |
| Clique quebrado na demo | Clicar em algo sem ação | Usar apenas rotas testadas: Workspace, Indicadores, Relatórios, Detalhe do relatório e IRIS. |
| Demo longa | Tentar mostrar todas as páginas | Roteiro de 3 minutos com no máximo 5 cliques. |
| Perguntas de segurança | "A IA pode acessar relatório restrito?" | Responder com perfis de acesso, autenticação, trilha de auditoria e fontes controladas. |
| Número financeiro contestado | Perguntam de onde veio economia | Falar em H/H recuperado, não em dinheiro economizado; dinheiro fica como conversão de apoio. |
| Escopo amplo demais | "Isso vai virar um monstro para manter?" | Propor validação de 30 dias, uma área, relatórios críticos e poucos indicadores. |

## 3. Jornada recomendada para a demo

Tempo alvo: 2 a 3 minutos.

Não demonstrar tudo. A demo deve parecer uma história, não um tour.

### Jornada principal

1. Abrir `Workspace`.
2. Mostrar a dor: prioridades, relatórios em foco e atividade recente.
3. Abrir `Indicadores`.
4. Selecionar `DEC` e comparar `2023 -> 2024`.
5. Clicar em `Perguntar esta comparação` ou abrir a IRIS e perguntar:

```text
Compare DEC 2023 e 2024 e diga se esse indicador faz sentido
```

6. Mostrar que a IRIS responde com:

- interpretação;
- meta;
- tendência;
- recomendação de cruzamento;
- fontes.

7. Abrir uma fonte em `Detalhe do relatório`.
8. Fechar dizendo:

> A informação não termina no chatbot. Ela volta para o relatório fonte, com rastreabilidade.

### Regra de ouro da demo

Se uma tela não reforça a tese, não mostrar.

Telas secundárias só entram se perguntarem:

- `Superadmin`: se perguntarem governança/acesso.
- `Aprovações`: se perguntarem fluxo de publicação.
- `Ajuda`: se perguntarem usabilidade/suporte.
- `Favoritos`: se perguntarem rotina do usuário.

## 4. Fala ajustada para IA

Evitar:

> A IRIS responde qualquer coisa sobre os indicadores.

Melhor:

> A IRIS entende a pergunta do usuário, cruza com a base governada, compara indicadores por período e mostra as fontes usadas. Isso reduz tempo de busca e melhora a confiança, mas mantém a decisão rastreável.

Se perguntarem "e se a IA errar?":

> Esse é um ponto importante. A IRIS foi pensada para responder com base em fontes internas, indicar os relatórios utilizados e receber avaliação do usuário. Quando a resposta não é suficiente, isso vira sinal de melhoria da base. A IA não substitui a governança; ela acelera o acesso à informação governada.

## 5. Como falar dos dados

Na interface, o usuário não precisa ver "dados fake". No pitch, se perguntarem, seja transparente:

> Para demonstrar a jornada completa, usamos séries e projeções de apoio. O ponto central é mostrar como a plataforma compara anos, interpreta tendência e leva ao relatório fonte. O próximo passo é alimentar essa camada com os dados operacionais medidos da área piloto.

Não dizer:

> Esses dados são reais.

Também não dizer:

> É tudo fake.

Melhor linguagem:

> Dados de demonstração e modelagem de cenário.

## 6. Como falar dos resultados

Frase segura:

> O business case estima redução de 30 para 8 minutos por busca, recuperando 22 minutos por demanda. Como já existe uso inicial, o próximo passo é medir esse ganho com os usuários atuais em uma validação de 30 dias.

Evitar:

> Já economizamos 65 mil horas.

Melhor:

> O cenário intermediário indica potencial de até 65.880 horas produtivas recuperadas por ano.

## 7. Perguntas difíceis e respostas curtas

### "Isso não é só um portal?"

Não. Portal é a camada visual. O diferencial é governança de relatórios, fluxo de aprovação, permissões, auditoria, busca inteligente e IRIS apontando para fontes rastreáveis.

### "Qual problema real isso resolve?"

Resolve o tempo perdido para localizar, validar e confiar na informação certa. O problema não é falta de dados; é dispersão, versão, dono, permissão e contexto.

### "Por que alguém usaria isso em vez de pedir no WhatsApp ou e-mail?"

Porque o pedido informal resolve uma dúvida pontual, mas mantém dependência de pessoas. O NeoView cria autonomia, memória corporativa e rastreabilidade.

### "Como provar o ganho?"

Com medição antes/depois: tempo para encontrar relatório, taxa de sucesso da busca, quantidade de solicitações evitadas, feedback útil e ciclo de aprovação.

### "Como evitar relatório desatualizado?"

Com dono, validade, status, revisão periódica e fluxo de aprovação para publicação ou atualização.

### "Como controla acesso?"

Com autenticação, perfis, permissões por hierarquia e auditoria de acesso. A IRIS só deve usar fontes compatíveis com o perfil do usuário.

### "Como isso é arquitetado?"

A arquitetura tem três pilares: catálogo governado, busca/IRIS com filtro de permissão e rastreabilidade até a fonte. O detalhe técnico fica documentado em `docs/neoview_arquitetura_produto.md`.

### "A solução escala?"

Sim. A estrutura por empresa, área, superintendência, gerência, unidade e indicador permite replicar a solução sem reinventar o fluxo.

### "Qual é o maior risco?"

Qualidade e manutenção da base. A mitigação é começar com uma área piloto, relatórios críticos, curadoria definida e indicadores simples de sucesso.

## 8. O que cortar da apresentação

Cortar ou deixar como backup:

- Explicação longa da arquitetura.
- Muitas telas administrativas.
- Demonstração de todas as funcionalidades.
- Valor financeiro como protagonista.
- Termos técnicos como RAG, embedding, vector store, streaming, se a banca não perguntar.

Manter:

- Dor cotidiana.
- Tempo perdido.
- H/H recuperado.
- Busca inteligente.
- Comparação de indicador.
- Fonte rastreável.
- Governança.
- Uso real inicial.

## 9. Evidências que devem aparecer

Levar 3 a 5 evidências, não 20.

Prioridade:

1. Print da tela de indicadores comparando DEC.
2. Print da IRIS respondendo com fonte.
3. Print do detalhe do relatório.
4. Print ou lista de relatórios reais cadastrados.
5. Evidência simples de 20+ usuários ou acessos.

Pasta de prints gerada:

`screenshots/neoview-screenshots`

## 10. Roteiro de demo com fala

### Abertura da demo

> Vou mostrar em uma jornada curta como o NeoView reduz o caminho entre dúvida e decisão.

### Workspace

> Aqui o gestor começa com prioridades e relatórios em foco. A ideia não é navegar por pastas; é partir do que precisa de atenção.

### Indicadores

> Agora, imagine que ele queira entender DEC. Em vez de procurar vários relatórios, ele compara o indicador por ano e já vê meta, tendência e interpretação.

### IRIS

> A IRIS transforma essa dúvida em uma resposta contextual: compara anos, explica se o indicador faz sentido e sugere cruzamentos.

### Relatório fonte

> E o mais importante: a resposta não fica solta. Ela aponta para o relatório fonte, mantendo rastreabilidade.

### Fechamento

> Esse é o ganho do NeoView: menos tempo procurando, mais confiança na informação e decisões mais rápidas.

## 11. Checklist antes do pitch

- Treinar demo com internet desligada ou instável.
- Deixar a rota `#/workspace` aberta antes de começar.
- Testar a pergunta da IRIS antes da apresentação.
- Não clicar em telas fora da jornada principal.
- Ter prints como backup caso a internet falhe.
- Ter resposta pronta para "dados reais ou simulados?".
- Ter resposta pronta para "isso não é só portal?".
- Levar evidência de uso real, mesmo simples.
- Ensaiar a fala em até 5 minutos.

## 12. Frase final recomendada

> O NeoView não é sobre ter mais uma tela. É sobre diminuir o tempo entre uma pergunta de negócio e uma decisão confiável.

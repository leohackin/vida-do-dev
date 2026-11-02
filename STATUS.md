# Matriz visual por personagem da v0.14 — 01/11/2026

A validação de um único ator foi substituída por matrizes de cinco personagens
em sofá, reunião, estações e fliperama, além de storyboards quadro a quadro para
sentar e levantar. Essa revisão encontrou e corrigiu a troca de identidade da
Ana, a diferença de estilo das poses sentadas, sombras de piso sobre móveis e
posições de aproximação que sobrepunham guitarra, vidro ou mesas.

O atlas sentado agora preserva cabelo e cor de camisa de Guest, Dev, Ana, Ops e
PM. A redução usa pixels nítidos como os sheets de caminhada. O segundo ponto
das estações foi aproximado de seu assento, e os dois acessos da reunião ficaram
separados em piso livre antes da troca invisível de profundidade.

As evidências novas são `visual-matrix-{lounge,meeting,desk,arcade}.png`,
`transition-lounge-{sit,stand}.png` e `approaches-{meeting,desk}.png`.

---

# Centro da almofada esquerda na v0.13 — 01/11/2026

Uma comparação controlada de quatro âncoras revelou que o Visitante estava
sobre a emenda entre sofá e pufe. O slot foi deslocado 25 px para a esquerda,
ao centro da almofada real, mantendo a composição aprovada do Dev à direita.

---

# Âncora individual do Visitante da v0.12 — 01/11/2026

O Visitante possui margem transparente diferente do Dev no atlas sentado. Seu
slot recebeu compensação vertical própria para apoiar quadril na almofada e
levar joelhos e pés até a borda frontal, sem alterar o Dev já aprovado.

---

# Corpo completo no sofá da v0.11 — 01/11/2026

A máscara frontal do sofá ocultava joelhos e pernas do atlas sentado, deixando
apenas cabeça e tronco. Os dois slots do lounge agora ficam sobre as almofadas,
e a pose sentada completa é desenhada à frente do assento. Uma captura dedicada
com dois personagens (`lounge-pair.png`) impede que a revisão dos demais móveis
esconda novamente esse defeito.

---

# Profundidade e poses sentadas da v0.10 — 01/11/2026

A interpolação que atravessava sofá, mesas e paredes foi removida. Ao sentar ou
levantar, o personagem desvanece no ponto seguro, troca de camada quando está
invisível e reaparece no assento; portanto nenhuma posição intermediária dentro
do móvel é renderizada. Os polígonos de colisão também restauram os pixels do
móvel sobre os pés quando o personagem passa atrás dele.

`assets/seated-atlas.png` substitui a deformação procedural que criava pernas
recortadas ou barras horizontais. Os cinco personagens têm poses sentadas
dedicadas, usadas nas estações, reunião, sofá e fliperama. Os assentos foram
reposicionados sobre cadeiras e bancos visíveis.

A regressão de navegador verifica que a transição mantém somente o ponto de
acesso ou o assento e tem opacidade zero na troca de profundidade. A revisão
visual independente percorre todos os destinos e tenta reprovar rotas, máscaras
e encaixes antes da publicação.

---

# Dev limpo e interações da v0.9 — 01/11/2026

O Dev agora usa exclusivamente o atlas direcional limpo em todas as poses. Isso
remove o fragmento cinza do sheet anterior que aparecia atrás da cabeça quando
ele parava na copa. A escala foi ajustada à perspectiva dos demais personagens,
e café e digitação recebem gestos leves sobre o mesmo corpo consistente.

As transições de sentar continuam separando o ponto lógico seguro da posição
visual no móvel. A suíte percorre todos os destinos com a pegada completa do
ator, valida separação física e produz capturas dedicadas das interações e dos
quatro assentos para inspeção visual.

Evidências locais: 25 testes de lógica aprovados, quatro testes de arte
aprovados e 35 percursos reais no Chromium 154 sem erro de página. A captura
`dev-interaction.png` confirma a remoção do artefato; `seats.png` cobre estação,
reunião, sofá e fliperama.

---

# Assentos e oclusões da v0.8 — 01/11/2026

Estações, reunião, sofá e fliperama agora separam o ponto lógico de aproximação da posição visual no móvel. O corpo usado por A*, reservas e colisões permanece no piso seguro; a animação de sentar interpola até a cadeira/sofá e a de levantar retorna ao ponto lógico antes da caminhada. Cada slot sentado possui um assento visual exclusivo.

Máscaras adicionais redesenham pixels do clean plate à frente do ator: frente do sofá, mesa de reunião, duas mesas de estação e mesa do fliperama. Isso posiciona pernas e parte inferior do tronco atrás do móvel, sem introduzir polígonos visuais na geometria de navegação.

Evidências locais:
- **25 testes de lógica/integração aprovados**, incluindo cobertura de todos os assentos visuais exclusivos.
- Chromium 154: 35 percursos, controles reais e prévia isolada aprovados, sem exceções.
- `seats.png` inspecionado: quatro atores ocupam estação, reunião, sofá e fliperama com oclusão do móvel; é inspeção técnica, não aprovação artística humana.
- Orçamento verificável: PNGs usados em runtime abaixo de 20 MiB; emissão Canvas p95 deve permanecer abaixo de 20 ms em cada motor do CI. A medição não equivale a FPS sustentado ou desempenho de GPU.

Limites: as máscaras são polígonos manuais e a anatomia sentada ainda deriva proceduralmente dos sheets existentes. O corpo lógico separado do assento é uma simplificação consciente. Dispositivos físicos e aprovação artística continuam fora da automação.

---

# Integração artística da v0.7 — 01/11/2026

## Resultado implementado

- `assets/office-clean.png` substitui o fundo com pessoas, gatos e balões pintados. Cadeiras, sofá, mesas e piso foram reconstruídos; os cinco atores do motor são agora as únicas pessoas da cena.
- O letreiro **SONHE / PLANEJE / CÓDIGO / ENTREGUE / REPITA** foi corrigido. A marca VIDA DO DEV é desenhada por um recorte exato de `assets/reference-original.png`, evitando a versão alterada gerada no clean plate.
- `assets/dev-directional.png` fornece caminhada do Dev em sudeste, sudoeste, nordeste e noroeste. O motor escolhe a direção por `dx/dy` e usa quatro quadros por direção. Café, digitação, sentar e levantar continuam no sheet de interação anterior.
- A referência aprovada permanece byte a byte intacta e também funciona como fonte explícita da marca.

## Evidências locais

- `python tools/test_art_assets.py`: três verificações aprovadas — hash da referência, dimensões/recortes dos PNGs e exportação HTML independente.
- `node --test --test-isolation=none tools/test_navigation.cjs tools/test_engine.cjs`: **24 testes aprovados**, incluindo as quatro direções do Dev e as três simulações de tráfego.
- Chromium 154: 35 percursos, chegada por `requestAnimationFrame`, pausa/retomada, fundo limpo, fontes de imagem e prévia independente aprovados; nenhuma exceção da página.
- Inspeção de `actors.png`, `floor-map.png` e `dev-directions.png`: pessoas/gatos estáticos ausentes, cinco atores móveis visíveis, marca preservada e quatro vistas do Dev distinguíveis. A inspeção visual é evidência técnica, não aprovação artística humana.
- O CI executará lógica/arte e navegador em Chromium, Firefox e WebKit antes de qualquer merge desta iteração.

## Limites que permanecem

O mapa de colisões ainda é manual. O clean plate é uma reconstrução, não uma separação completa de cada móvel em camadas. As máscaras de oclusão existentes continuam aproximadas. Os demais personagens reutilizam variantes do Visitante e não possuem quatro direções próprias. As poses de interação do Dev ainda são procedurais. Safari real, dispositivos físicos, hardware alvo e aprovação artística humana permanecem fora da evidência automatizada.

As fases 2 e 3 avançam materialmente, mas permanecem parciais nesses pontos. A fase 4 possui cobertura nos três motores via CI, ainda sem equivalência a dispositivos físicos ou aprovação artística.

---

# Correção da prévia isolada — 31/10/2026

O HTML modular da revisão buscava JSON e PNGs por caminhos relativos. Ao disponibilizar apenas o HTML, a página podia abrir enquanto os metadados retornavam HTTP 404 e as imagens ficavam quebradas. O teste anterior servia o repositório completo e não cobria essa forma de abertura.

Adicionado `tools/build_art_review.py`, que exporta `artifacts/art-review-standalone.html` com os metadados e os bytes originais das imagens incorporados. Nenhum asset é regenerado ou modificado. Os critérios também ficam no arquivo, e o link para o código aponta ao GitHub. A página modular continua disponível para servir a raiz completa do repositório.

Validação local: Chromium 154, 35 percursos e controles do jogo aprovados; a nova regressão disponibiliza **somente o HTML exportado**, bloqueando todos os outros recursos. Quatro prévias, todas as imagens, seleção de quadro e comparação por corte passaram, sem erros da página e sem requisições a arquivos externos. O teste foi incluído na suíte de navegador dos três motores; o CI deste commit ainda precisa confirmar Firefox e WebKit. A correção da abertura não constitui aprovação dos assets artísticos, que permanecem em rascunho.

---

# Propostas de arte e camadas — 31/10/2026

Foi produzida uma proposta RGBA do Dev em quatro direções, seguida de uma tentativa de reparo do ciclo. Ela está em `assets/proposals/`, com recortes medidos e uma página de inspeção em `tools/art_review.html`. A referência e todos os assets usados na cena permanecem intactos; a proposta não é carregada pelo motor.

**Resultado da revisão: reprovada para produção.** As vistas de costas são novas, mas os passos 1/3 ainda não alternam claramente a perna dianteira em todas as linhas. A grade e as âncoras também não são uniformes. A página alinha os recortes apenas para inspeção e não corrige a anatomia. As proporções mais arredondadas precisam de revisão contra a ilustração. Não há aprovação artística humana e não foram produzidos clean plate aprovado, móveis em camadas ou poses de interação finais.

Validação da ferramenta de revisão: HTTP + Chromium, quatro prévias carregadas, pausa e seleção de quadro verificadas, captura `artifacts/art-review.png` inspecionada, nenhuma exceção da página. Isso valida a ferramenta e permite avaliar os defeitos; não aprova o atlas nem representa teste do atlas na cena. A proposta permanece em PR de rascunho para reparo e revisão, sem integrar arte reprovada na main.

Também foi gerada uma proposta de clean plate de 1536 × 1024, em arquivo separado: pessoas, gatos e balões removidos, cadeiras e piso reconstruídos. A revisão identificou perda do logo inferior, alteração de letras em SONHE e simplificação de objetos de reunião. Portanto ela também foi reprovada para substituição direta. A página de inspeção inclui comparação por corte com a referência. Não foram produzidas máscaras finais nem validado o motor sobre esse fundo. A referência e a cena publicada permanecem intactas.

Uma tentativa adicional de reparo do clean plate não resolveu o letreiro e recriou o logo com forma/iluminação diferentes. Foi inspecionada e rejeitada, preservando a proposta anterior como evidência. As tentativas de geração/reparo não produziram assets que passem nos critérios de ciclo anatômico e fidelidade da marca. Não há justificativa para integrar esses arquivos ao motor; o reparo artístico e as camadas finais continuam abertos.

As fases 2 e 3 continuam parciais. A próxima entrega artística precisa de um ciclo com pernas alternadas, poses de passagem e âncoras coerentes, além das transições de interação. Os requisitos concretos estão em `assets/proposals/README.md`. A revisão humana da direção artística permanece pendente, distinta dos testes de lógica e navegador.


A correção de continuidade foi integrada pelo PR #4 em `c36a99a`, após os oito checks de push/PR aprovados: 23 testes de lógica e suíte em Chromium, Firefox e WebKit. A main contém os PRs #2, #3 e #4. Este rascunho preserva integralmente essas correções; a única entrega artística nova permanece fora do motor.

---

# Correção de continuidade das rotinas — 31/10/2026

A validação em três motores foi integrada pelo PR #3 (`1a1ef3f`) após oito checks aprovados no commit `d87b7e6`: lógica e Chromium/Firefox/WebKit, nos eventos de push e PR. Foram 35 percursos por motor, chegada por requestAnimationFrame e pausa/retomada. As falhas locais de lançamento de Firefox/WebKit não foram tratadas como aprovação; os resultados aprovados vieram do CI.

## Problemas reproduzidos e correções

A simulação seed 42 da v0.6 mantinha todos os atores sem deslocamento por mais de 160 segundos. Separação física e reservas exclusivas passavam mesmo com as rotinas travadas. O dono da passagem podia adquiri-la muito longe do corredor, liberando seu slot original e parando sobre a rota de outro ator.

O acesso à copa/banheiro agora é admitido **antes** de liberar o slot atual. Uma permissão abrange a visita, a interação e o retorno pelo corredor. Solicitações manuais aguardam na fila mantendo rota/reserva; solicitações automáticas recusadas continuam no destino atual. **Limitação deliberada: somente uma visita por vez ao conjunto copa/banheiro**, embora existam dois pontos de café. Os slots individuais dos demais ambientes continuam concorrentes. Não é uma solução geral de tráfego nem uma prova de ausência de impasses para pedidos manuais cíclicos.

As rotas iniciais consideram os outros corpos visíveis, além do replanejamento já existente. Personagens cujo destino inicial está indisponível podem entrar por um slot livre da entrada, evitando que Ops nunca apareça por congestionamento da copa.

A mudança da simulação também revelou uma quina onde a amostragem de segmentos a cada 3 px deixava passar uma margem ligeiramente menor que 12 px. Agora o espaço varrido pelos pés usa distância contínua entre segmentos e arestas. Há regressão com extremos livres e trajetória que passa rente demais à quina.

## Evidências desta correção

- Sintaxe JavaScript aprovada; diff sem erros de whitespace.
- **23 testes de lógica/integração aprovados** (Node 24, sem isolamento para enumerar os testes). Três simulações determinísticas de quatro minutos, seeds 42/7/2026: cinco atores ativos, pés livres, reservas únicas, pelo menos duas chegadas por ator e deslocamento de cada ator no último minuto. Isso amplia a evidência de continuidade, sem provar todas as configurações.
- Regressão da permissão durante interação e liberação após a saída; tráfego oposto agora aguarda admissão antes de trocar a reserva.
- Chromium 154: 35 percursos, chegada em relógio real e pausa/retomada aprovados, sem exceções. Emissão Canvas: mediana 0,1 ms, p95 0,2 ms nesta máquina, sem equivalência a FPS/GPU.
- Nenhum PNG alterado; a referência permanece intacta. Os três motores precisam passar novamente no CI deste PR antes de integrar.

As fases 1 e 4 avançam com essas correções. Desenhos direcionais finais, assentos físicos, clean plate, camadas, oclusões e aprovação artística continuam pendentes; nenhuma fase é declarada integralmente concluída.

---

# Iteração de validação de navegador — 31/10/2026

A v0.6 foi integrada pelo PR #2 em `8f8f782f9ae1344738dd2d4aa7a64030d6fdd8fc`, após revisão local com correção de FIFO e todos os quatro checks de push/PR aprovados. Não houve push direto na main.

A próxima iteração amplia a fase 4: suíte parametrizada para Chromium, Firefox e WebKit; evidências isoladas por motor; teste de chegada pelo relógio real de requestAnimationFrame e pausa/retomada pelos botões. Capturas de poses limpam os balões herdados do último percurso, permitindo inspecionar melhor os sprites. O job de navegador tem limite de 15 minutos e o lançamento tem limite de 45 segundos.

Validação local: Chromium 154 aprovou 35 percursos, a chegada em tempo real e a pausa/retomada, sem exceções. Emissão Canvas: mediana 0,1 ms, p95 0,2 ms nesta máquina, sem equivalência a FPS/GPU. Captura de personagens inspecionada; poses e oclusões ainda exigem evolução artística. Firefox local não completou o lançamento: o diagnóstico registra erro de sandbox em uid_map e falha de framebuffer SWGL. WebKit local não iniciou por bibliotecas GTK4/Graphene/Harfbuzz/Manette/Hyphen/GLES ausentes. Esses dois motores precisam ser validados no CI com dependências instaladas; não são resultados aprovados locais. WebKit automatizado não é Safari real; dispositivos físicos e aprovação artística continuam pendentes.

O CI inicial desta iteração revelou que a criação de `artifacts/<engine>/` falhava em checkout limpo, pois a pasta pai ainda não existia. Corrigido com criação dos diretórios pais; o resultado local anterior reutilizava uma pasta de evidências existente e não detectou esse caso. A nova execução de CI precisa passar antes do merge.

A revisão adicional de progresso da simulação seed 42 revelou cinco atores sem deslocamento por mais de 160 segundos ao fim dos quatro minutos. O teste anterior de separação física não detectava esse impasse; isso invalida qualquer interpretação de que a simulação comprovava continuidade das rotinas. A correção e uma asserção de progresso estão em investigação separada. A fase 1 permanece parcial.

Nenhum PNG foi alterado. As quatro fases permanecem parciais conforme o detalhamento abaixo.

---

# Estado da v0.6 — 31/10/2026

Base de trabalho: `main` em `cda46178d6fdc454e3f43b637007b888c58e01a5` (v0.5 integrada).

## Quatro fases: evolução e limites

1. **Colisões/pathfinding/slots — avançou, parcial.** O grafo que atravessava móveis foi substituído por A* em uma grade de 6 px sobre polígonos de piso e obstáculos. A margem circular dos pés é de 12 px; diagonais e atalhos precisam passar pela mesma validação de segmento. Posições individuais substituem a reserva de um ambiente inteiro. Solicitações manuais sem capacidade entram em fila FIFO, mantendo rota e reserva atuais até a transferência. Um pedido bem-sucedido para outro destino cancela a fila anterior. O corredor estreito da copa possui exclusão de passagem; atores aguardam antes de cruzá-lo. Outros encontros usam parada e tentativa de desvio. Não há prova de ausência de impasses para todas as configurações possíveis.
2. **Sprites/animações do Dev — avançou, parcial.** O ciclo de caminhada usa tempo de movimento, sem avançar enquanto aguarda passagem. Há transições temporizadas de sentar/levantar, com pausa do deslocamento ao levantar. A pose sentada deixa de comprimir um frame já comprimido. São deformações procedurais dos sheets existentes: ainda faltam novos desenhos anatômicos em 4/8 direções, mãos e transições feitas por artista. O Dev mantém a orientação frontal do sheet existente.
3. **Outros personagens — avançou, parcial.** PM independente, selecionável, usa o `pm-sheet.png` já existente, entra pelo acesso comum e participa das rotas/reservas. PM prioriza reuniões, Ops usa sua rotina e colegas próximos no mesmo ambiente trocam falas de seus papéis. São cinco atores móveis; pessoas e gatos pintados na referência continuam imóveis. Ana, Ops e PM são variantes existentes do Visitante, não novos desenhos anatômicos. Não foi feito clean plate completo nem reconstrução por camadas.
4. **Polimento/testes — avançou, parcial.** Testes de geometria, motor, filas, transições, concorrência e navegador real; capturas desktop, mobile e iluminação, mapa de colisões e personagens. O cancelamento de gesto de ponteiro limpa o arrasto. A UI identifica a v0.6. Ainda faltam revisão artística humana, Firefox/Safari, dispositivos físicos, validação completa de oclusão e orçamento de desempenho em hardware-alvo.

## Decisões de composição e arte

Todos os PNGs são idênticos byte a byte aos da `main`, incluindo `assets/reference-original.png`. SHA-256 da referência: `105580ac7364b063725ad359c8b3913468e2e2aeeba04ce65ffa09c1f01ad834`.

O mapa é uma aproximação manual do espaço dos pés. Bases de plantas e móveis são sólidas; folhagens e partes elevadas podem sobrepor o corpo. A inspeção do mapa em navegador corrigiu um acesso sobre a vegetação e um trajeto que cruzava o vidro. Como a imagem não oferece portas/cadeiras vazias em camadas, reuniões, estações, descompressão e fliperama usam **pontos de aproximação no corredor**. As poses de interação são simbólicas: o ator não ocupa um assento físico reconstruído. O banheiro ainda esconde o ator no acesso, sem animar a porta. As máscaras de oclusão herdadas não substituem uma separação completa dos móveis.

## Evidências e reprodução

- `node --check office.js` e `node --check navigation.js`.
- `node --test tools/test_navigation.cjs tools/test_engine.cjs`: 18 testes. Incluem os cinco atores nos sete destinos (35 trajetos), recusa sem perda de reserva, fila FIFO, tráfego oposto com chegada e simulação determinística de quatro minutos com cinco atores, sem interseção dos pés ou reserva duplicada.
- `python tools/test_browser.py`: Chromium real servido por HTTP, 35 percursos com chegada e renderização Canvas, carregamento dos seis PNGs, PM selecionável, zoom/destinos, mobile sem overflow e ausência de exceções da página. A simulação dos trajetos avança o relógio do motor por chamadas a `tick`; não mede duração humana dos trajetos.
- `artifacts/`: capturas `desktop.png`, `actors.png`, `floor-map.png`, `sunset.png`, `night.png`, `mobile.png` e relatório `browser-results.json`. São gerados no teste, ignorados pelo Git e enviados como artefato pelo job de CI quando ele executar. As imagens foram inspecionadas nesta tarefa; não constituem aprovação artística.
- O relatório de tempo mede emissão de chamadas Canvas em 120 renders nesta máquina. Não representa FPS sustentado, tempo de GPU nem desempenho de celular. Buscas frias e replanejamento continuam síncronos e podem causar pausas; cache de segmentos e heap A* reduzem trabalho repetido.

Os antigos `test_page.py` e `test_sit.py` são scripts de diagnóstico/captura, sem asserções suficientes para aprovação. A suíte de navegador com asserções é `test_browser.py`.

## Retomada e revisão em 31/10/2026

A rede efetivamente aplicada está irrestrita e a API do GitHub voltou a responder com a autenticação existente. A `main` remota permanece em `cda4617`; a branch recuperada estava em `da8801a`. Não havia PR da v0.6 na retomada. O bloqueio de CONNECT registrado anteriormente deixou de ocorrer. A consulta administrativa de proteção da branch retorna 403 de permissão da integração; isso não equivale a ausência de proteção.

Revisão do diff: reprodução dos percursos e leitura das regras de reserva, filas, passagem, geometria e renderização. Foi reproduzida e corrigida a perda de prioridade FIFO ao repetir um pedido manual para o mesmo destino cheio. O teste de regressão verifica repetição, atendimento do primeiro solicitante e troca da fila para outro destino.

Validação desta retomada, após a correção:
- Sintaxe dos dois JavaScripts e `git diff --check` aprovados.
- `node --test --test-isolation=none tools/test_engine.cjs tools/test_navigation.cjs` (Node 24): **19 testes aprovados**. O modo sem isolamento permite enumerar cada asserção nesta execução local; o workflow continua com Node 22 e o comando padrão.
- Chromium 154: **35 percursos aprovados**, nenhuma exceção da página; mediana de emissão Canvas 0,2 ms, p95 0,5 ms. A suíte será repetida no commit final e em CI.
- Inspeção visual local da referência e da captura de personagens: composição preservada; poses simbólicas e sobreposições ainda evidentes, sem aprovação artística. Não há evidência de novos desenhos direcionais.
- Nenhum PNG alterado frente à `main`; hash da referência confirmado novamente.

As quatro fases continuam parciais. As evidências de motor, navegador, inspeção visual e aprovação artística são distintas. A aprovação artística humana permanece pendente, assim como os itens de arte e camadas descritos acima.


---

## Histórico da v0.5

# Estado da v0.5 — 31/10/2026

## Alterações verificadas

A v0.4 foi recuperada de `vida-do-dev-office-v04 (2).zip`, em Downloads. Todos os PNGs foram preservados byte a byte, incluindo a referência aprovada. Não foram redesenhados personagens nem móveis.

- Rotas agora minimizam distância no grafo existente, em vez de contar trechos.
- Destinos desconectados retornam falha, sem enviar o personagem diretamente através do cenário.
- Cada destino possui um slot exclusivo durante aproximação e interação. Uma solicitação recusada preserva a rota e a reserva anteriores.
- A reserva anterior é liberada após uma nova reserva bem-sucedida; solicitações no próprio local chegam imediatamente.
- Testes automatizados da lógica e de sua integração ao motor, sem dependências externas.
- Workflow de GitHub Actions preparado para executar os testes após o envio ao GitHub; ainda não executado na nuvem.

## Validação executada

`node --check office.js` passou.

`node --test tools/test_navigation.cjs tools/test_engine.cjs`: 9 testes, 9 aprovações. A integração usa um DOM simulado e executa o motor real; não valida renderização Canvas nem fidelidade visual.

Os testes Python herdados requerem Playwright, que não está instalado nesta sessão. A abertura de arquivo local pelo navegador integrado foi bloqueada pela política de URLs, portanto não houve validação visual da v0.5. Previews da v0.4 foram removidos deste pacote para não apresentá-los como evidência nova.

## Quatro fases

1. **Colisões/pathfinding/slots — parcial.** Rotas ponderadas e reservas implementadas. O grafo original ainda precisa ser revisado contra a imagem. Não há colisão física entre personagens, margem do corpo nos obstáculos nem mapa de obstáculos reconstruído. Um único slot por ambiente é uma simplificação conservadora; ainda faltam assentos individuais e filas.
2. **Sprite sheets/animações do Dev — pendente de evolução.** Preservados os sprites da v0.4. As poses continuam simplificadas, sem novos ângulos anatômicos ou transições de levantar/sentar.
3. **Outros personagens — pendente de evolução.** Visitante, Dev, Ana e Ops existentes usam as reservas. Outros personagens continuam pintados no fundo. Não houve reconstrução por camadas.
4. **Polimento/testes — parcial.** Cobertura automatizada de navegação e reservas adicionada. Faltam validação visual, testes de navegador e desempenho.

## Publicação e nuvem

Registro da preparação local: o repositório remoto estava vazio. A integração GitHub recusou a escrita com HTTP 403 (`Resource not accessible by integration`). Não houve upload, commit remoto ou PR.

A consulta de ambientes Codex Cloud retornou uma lista vazia. Nenhuma tarefa em nuvem foi iniciada. O workflow incluído executa testes, não o desenvolvimento autônomo das fases seguintes.

Para continuar: habilitar escrita da integração no repositório; importar este pacote na raiz; publicar um ambiente Codex Cloud ligado ao repositório e iniciar a tarefa lá. Confirmar execução remota antes de fechar o Mac.

## Atualização da importação

A conexão GitHub foi restabelecida e o ambiente Codex Cloud passou a aparecer como executável. Esta importação publica a v0.5 por PR. A execução remota das fases seguintes ainda precisa ser iniciada; disponibilidade do ambiente não comprova execução de uma tarefa.

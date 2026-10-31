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

## GitHub e ambiente

O commit de implementação `6038874` foi enviado para `feat/office-v06`. A tentativa de criar PR com `gh pr create` falhou com `Post "https://api.github.com/graphql": Forbidden`; não foi criado PR nem realizado merge. O Git HTTPS consegue ler e enviar branches. A API em `api.github.com` responde 403 no CONNECT do proxy: abrir PR, consultar revisão/checks e efetuar merge pela API estão bloqueados nesta sessão. A inclusão de `api.github.com` foi salva no rascunho de rede, preservando os presets; salvar o rascunho não aplica a mudança nem publica o ambiente. É necessário revisar/salvar nas configurações e publicar o ambiente, depois repetir a operação da API e conferir a autenticação existente. Nenhum novo token foi solicitado. Não foi feito merge direto na `main` para contornar a revisão.

O workflow passou a incluir os testes de navegador e upload das capturas. A execução remota e seus resultados precisam ser consultados no GitHub após restabelecer o acesso. Nenhuma das quatro fases é declarada integralmente concluída.

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

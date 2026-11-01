# Vida do Dev — office.exe v0.12

Para a prévia de arte em arquivo único: `python tools/build_art_review.py` e abra
`artifacts/art-review-standalone.html`. Ela inclui imagens e metadados e pode ser
aberta fora da pasta do repositório, sem servidor. A arte continua em revisão.

Esta versão evolui a v0.5 com mapa de obstáculos, posições individuais, filas, transições do Dev e PM independente. As quatro fases continuam parciais. Consulte `STATUS.md` para testes, fases e limitações.

A cena usa um fundo reconstruído sem pessoas, gatos ou balões pintados. O Dev
usa o atlas limpo em caminhada, espera, café e digitação, além de um atlas
dedicado com anatomia sentada para os cinco personagens;
o sheet de interação com o artefato cinza deixou de ser renderizado. A marca
VIDA DO DEV é recortada diretamente da referência preservada.

Estações, reunião, sofá e fliperama têm posições visuais próprias. O corpo lógico
permanece no ponto seguro de aproximação para colisões; sentar/levantar interpola
até o móvel e as máscaras redesenham a frente da mesa ou do sofá sobre o sprite.

Teste de lógica: `node --test tools/test_navigation.cjs tools/test_engine.cjs` (Node.js 18 ou superior).

Protótipo **jogável** de escritório isométrico animado, construído sobre a **ilustração de referência fornecida**. Não substitui a imagem por retângulos, móveis genéricos ou outra composição. É uma *living illustration* (diorama com personagens animados), não ainda um mapa completamente reconstruído em tiles.

## Como rodar

Extraia o ZIP e abra `index.html` no Chrome, Firefox ou Safari. Sem servidor, dependências, cadastro, conexão ou frameworks externos. Os PNGs ficam em `assets/`.

## Controles

- Acompanhar: selecione **Visitante**, **Dev**, **Ana**, **Ops** ou **PM**.
- Clicar em **Copa**, **Estações**, **Reunião**, **Descompressão**, **Fliperama**, **Banheiro** ou **Entrada** envia o personagem escolhido ao local.
- Clicar em uma **parte do cenário** também envia o personagem para esse ambiente.
- Clicar diretamente em um **personagem animado** o seleciona.
- **Destinos** exibe indicadores clicáveis no cenário.
- **Gerar caos** inicia uma situação aleatória, com diálogo e movimento.
- **Pausar**, **Zoom**, **Arrastar**, **Tela cheia**, **Velocidade** e **Iluminação** funcionam.
- Eventos automáticos: Dia do Programador, Halloween, Natal, simulação de sexta-feira e situações típicas de escritório.
- Atalhos `Espaço` (pausa), `E` (evento) e `M` (destinos).

## Arquitetura de arte

- `assets/office-illustration.png`: **mesma composição original**; região do personagem de pé restaurada para permitir que ele saia andando.
- `assets/guest-walksheet.png`: personagem PNG extraído da imagem, com seis quadros por direção.
- `assets/dev-sheet.png`: Dev independente com óculos e camisa DE BOA, animações de caminhar, café, digitar e sentar.
- `assets/seated-atlas.png`: poses sentadas consistentes dos cinco personagens, com joelhos, pernas e âncora comuns.
- `assets/ana-sheet.png`, `assets/ops-sheet.png`: variantes de roupa preservando a textura do ator extraído.
- `office.js`: engine de Canvas2D, mapa de piso, rotas, ordenação, oclusão de objetos, comportamento, diálogos, eventos, interface, pan e zoom.
- `tools/build_assets.py`: pipeline local para separar a ilustração e sprites; requer Pillow e OpenCV.

## Limitação importante

A arte original é **uma ilustração única** com várias pessoas e móveis já pintados na imagem. O visitante central foi separado e pode caminhar; outros personagens do fundo permanecem incorporados à ilustração. Os personagens móveis adicionais são sprites independentes, porém têm animações simplificadas (não há todos os ângulos desenhados por artista). Um jogo que mova **todos** os funcionários da imagem, mantendo perfeita correspondência gráfica a cada frame, requer **reconstrução completa por camadas** e sheets feitos por artista (frente, trás, diagonais, sentado etc.) ou uma cena 3D renderizada com sprites. Essa entrega valida o motor interativo preservando fidelidade ao layout original e descreve com transparência o que falta.

## Evoluções recomendadas

1. Pintar o *clean plate* do escritório sem nenhuma pessoa ou balão, mantendo a composição exata.
2. Redesenhar sprites dos personagens em 4/8 direções, com quadros anatômicos de sentar/levantar/café.
3. Separar os móveis de primeiro plano e o fundo com máscaras artísticas; adicionar portas e gestos animados.
4. Publicar o motor em um website e usar um editor JSON de eventos para a @vidadodev.

## Validação da v0.6

```sh
node --check office.js
node --check navigation.js
node --test tools/test_navigation.cjs tools/test_engine.cjs
python -m pip install -r requirements-dev.txt
python -m playwright install --with-deps chromium
python tools/test_browser.py
```

Quando já existe Chromium no sistema, o teste o utiliza sem download. Também aceita `BROWSER_EXECUTABLE=/caminho/do/chromium`. Os testes de lógica não exigem dependências externas. Capturas e relatório ficam em `artifacts/<engine>/` e são ignorados pelo Git; o workflow os retém como artefato.

Para servir o jogo localmente: `python -m http.server 8000`, na raiz do checkout. Abertura direta de `index.html` continua suportada. Não execute `tools/build_assets.py` durante uma instalação normal: ele regenera a arte. O escritório ainda contém pessoas pintadas no fundo; as interações novas usam pontos de aproximação, sem cadeiras reconstruídas. Consulte `STATUS.md` para as limitações e evidências por fase.

A suíte também aceita `BROWSER_ENGINE=firefox` ou `BROWSER_ENGINE=webkit`.
Instale o motor escolhido com `python -m playwright install --with-deps firefox`
(ou `webkit`). O CI executa os três motores em jobs separados, com artefatos
individuais. Além dos 35 percursos acelerados por motor, a suíte verifica uma
chegada usando o relógio real de `requestAnimationFrame` e pausa/retomada pelos
controles da página. WebKit do Playwright não equivale a Safari em dispositivo
Apple, e o viewport móvel não equivale a um aparelho físico.

O corredor da copa/banheiro admite uma visita de cada vez, incluindo a volta.
Pedidos manuais aguardam mantendo a rota e o slot atuais. Os demais ambientes
mantêm seus slots individuais concorrentes. Essa restrição evita o impasse
reproduzido nas rotinas; ainda não há garantia para todas as combinações de pedidos.

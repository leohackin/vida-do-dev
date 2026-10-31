# Vida do Dev — office.exe v0.5

Esta versão recupera a v0.4 e corrige rotas e reservas de interação. Consulte `STATUS.md` para testes, fases e limitações.

Teste de lógica: `node --test tools/test_navigation.cjs tools/test_engine.cjs` (Node.js 18 ou superior).

Protótipo **jogável** de escritório isométrico animado, construído sobre a **ilustração de referência fornecida**. Não substitui a imagem por retângulos, móveis genéricos ou outra composição. É uma *living illustration* (diorama com personagens animados), não ainda um mapa completamente reconstruído em tiles.

## Como rodar

Extraia o ZIP e abra `index.html` no Chrome, Firefox ou Safari. Sem servidor, dependências, cadastro, conexão ou frameworks externos. Os PNGs ficam em `assets/`.

## Controles

- Acompanhar: selecione **Visitante**, **Dev**, **Ana** ou **Ops**.
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
- `assets/ana-sheet.png`, `assets/ops-sheet.png`: variantes de roupa preservando a textura do ator extraído.
- `office.js`: engine de Canvas2D, grafo de navegação, rotas, ordenação, oclusão de objetos, comportamento, diálogos, eventos, interface, pan e zoom.
- `tools/build_assets.py`: pipeline local para separar a ilustração e sprites; requer Pillow e OpenCV.

## Limitação importante

A arte original é **uma ilustração única** com várias pessoas e móveis já pintados na imagem. O visitante central foi separado e pode caminhar; outros personagens do fundo permanecem incorporados à ilustração. Os personagens móveis adicionais são sprites independentes, porém têm animações simplificadas (não há todos os ângulos desenhados por artista). Um jogo que mova **todos** os funcionários da imagem, mantendo perfeita correspondência gráfica a cada frame, requer **reconstrução completa por camadas** e sheets feitos por artista (frente, trás, diagonais, sentado etc.) ou uma cena 3D renderizada com sprites. Essa entrega valida o motor interativo preservando fidelidade ao layout original e descreve com transparência o que falta.

## Evoluções recomendadas

1. Pintar o *clean plate* do escritório sem nenhuma pessoa ou balão, mantendo a composição exata.
2. Redesenhar sprites dos personagens em 4/8 direções, com quadros anatômicos de sentar/levantar/café.
3. Separar os móveis de primeiro plano e o fundo com máscaras artísticas; adicionar portas e gestos animados.
4. Publicar o motor em um website e usar um editor JSON de eventos para a @vidadodev.

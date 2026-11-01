# Proposta direcional do Dev — revisão, sem uso no jogo

`dev-directional-review.png` foi gerado a partir da referência original e da
identidade do Dev existente, seguido de uma tentativa de corrigir o ciclo.
As imagens de entrada não foram modificadas. O arquivo é RGBA de 1254 × 1254.
`dev-directional-review.json` registra dezesseis recortes medidos pela transparência;
é metadado de inspeção, não um manifesto de animação aprovado.

Abra `tools/art_review.html` por HTTP, servindo a raiz do repositório. A página
mostra as quatro direções com reprodução, pausa, seleção de quadro e comparação
com a referência intacta. Nenhum arquivo desta pasta é carregado por `office.js`.

## Resultado da revisão técnica

- Identidade reconhecível: careca, barba, óculos e camiseta DE BOA.
- Quatro orientações distinguíveis, incluindo costas, ausentes no sheet atual.
- **Reprovado para produção:** passos 1/3 ainda não alternam claramente a perna
  dianteira em todas as direções, mesmo após uma tentativa de reparo.
- **Grade não uniforme:** a imagem não é divisível em quatro células inteiras,
  e as linhas têm espaçamento desigual. Os recortes de inspeção não corrigem isso.
- Variações de largura, altura e posição dos pés ainda precisam de revisão.
- As proporções mais arredondadas precisam ser comparadas artisticamente com
  a ilustração; não há aprovação artística humana.
- Não inclui sentar, levantar, digitar, café, mãos ou interação com cadeiras.

## Requisitos para substituir os sprites atuais

Redesenhar/revisar o ciclo com alternância anatômica legível, poses de passagem,
escala e âncoras consistentes; preservar o estilo e a identidade da referência;
produzir as transições e poses de interação. Inspecionar a animação em movimento
e na cena, além de validar dimensões, recortes e transparência. Desenhar o clean
plate e as camadas de móveis continua sendo uma entrega separada, necessária
para assentos físicos e remoção das pessoas/gatos pintados no fundo.

Esta proposta torna a avaliação concreta; não conclui as fases 2 ou 3.

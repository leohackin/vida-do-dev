# Propostas de arte — revisão, sem uso no jogo

`dev-directional-review.png` foi gerado a partir da referência original e da
identidade do Dev existente, seguido de uma tentativa de corrigir o ciclo.
As imagens de entrada não foram modificadas. O arquivo é RGBA de 1254 × 1254.
`dev-directional-review.json` registra dezesseis recortes medidos pela transparência;
é metadado de inspeção, não um manifesto de animação aprovado.

Para abrir ou compartilhar apenas um arquivo, execute:

```sh
python tools/build_art_review.py
```

Abra `artifacts/art-review-standalone.html`. Essa exportação inclui metadados e
os bytes originais dos PNGs, sem depender de caminhos relativos, servidor ou
conexão. O CI também inclui esse HTML no artefato de evidências. O script apenas
empacota a página; não regenera nem modifica imagens.

A página modular `tools/art_review.html` exige HTTP servindo a raiz completa do
repositório. Copiar apenas essa página para outro endereço deixa metadados e
imagens indisponíveis (404). A página
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

## Proposta de fundo sem personagens

`clean-plate-review.png` é uma proposta gerada de fundo vazio, RGBA de
1536 × 1024, preservada como arquivo separado. Pessoas, gatos e balões foram
removidos; cadeiras, sofá e piso foram reconstruídos. A ferramenta de revisão
inclui comparação por corte vertical com a referência.

**Reprovada para substituição direta:** o logo VIDA DO DEV inferior desapareceu,
o letreiro SONHE sofreu alteração de letras e objetos de reunião foram
simplificados. Há reconstruções que ainda precisam de comparação detalhada.
São defeitos observados, não diferenças aprovadas. Não foram produzidas máscaras
de móveis nem validado oclusão, colisões ou assentos sobre esse fundo. Nenhum
arquivo da referência ou da cena atual foi modificado.

Para uso na cena, preservar a marca e os letreiros da referência, revisar objetos
reconstruídos e produzir as camadas/máscaras de primeiro plano. Comparação visual
do fundo vazio não equivale a aprovação artística nem a validação dos atores
sentados. A fase 3 continua parcial.

Uma tentativa adicional de restaurar logo e letreiro foi inspecionada e
rejeitada: trouxe um logo com forma/iluminação diferentes e manteve SONNE.
O arquivo experimental anterior foi preservado para comparação; a tentativa
não foi aplicada ao jogo nem substituiu a referência. Os defeitos da marca e
os ciclos anatômicos exigem reparo artístico antes de qualquer integração.

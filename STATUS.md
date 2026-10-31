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

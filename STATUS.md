# Reconstrução Phaser — corte vertical

A implementação Canvas anterior foi removida desta branch. Ela mantinha posições diferentes para colisão, sprite, assento e máscara visual, o que permitia corrigir uma captura e quebrar outra.

A nova base usa Phaser 3, TypeScript e Vite. Entrada, lounge e fliperama formam o primeiro percurso completo. Cada personagem mantém um único ponto de chão; cada interação declara aproximação e pose final; o sofá tem uma camada frontal transparente própria.

A planta foi simplificada para circulação: os dois pufes e a bancada que bloqueava a porta inferior saíram. Os cinco personagens já percorrem o corredor, executam uma transição real de seis quadros para sentar e levantar, seguem ao fliperama e ocupam o banco correto. Posição e animação também congelam juntas quando a cena é pausada.

A publicação existente permanece ativa durante a reconstrução. Esta branch só substitui o site depois da revisão contínua dos percursos em Chromium, Firefox e WebKit.

# Vida do Dev — office.exe

Reconstrução do escritório interativo em **Phaser 3, TypeScript e Vite**.

O motor usa um único ponto de chão por personagem, rotas autoradas em corredores visíveis e interações com estados explícitos de aproximação, entrada, pose sentada e saída. A arte de primeiro plano do sofá é uma camada própria, separada da colisão e da navegação.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Verificação

```bash
npm test
npm run build
npm run test:e2e -- --project=chromium
```

Os testes de navegador percorrem entrada, lounge e fliperama com os cinco personagens e salvam evidências por personagem. Use `?lanes` durante o desenvolvimento para visualizar a malha de corredores.

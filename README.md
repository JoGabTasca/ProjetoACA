# SmartNet Analyzer

Interface em React para montar grafos e acompanhar, futuramente, a execução de DFS, BFS, Dijkstra e Kruskal.

## Executar localmente

Requisitos: Node.js 18 ou superior.

```bash
npm install
npm run dev
```

Abra no navegador o endereço local informado pelo Vite.

## Estado atual

- Montagem visual com React Flow: adicionar/remover nós e arestas, mover nós e definir se as conexões são direcionadas e/ou ponderadas.
- Matriz de adjacência própria em `src/graphModel.js`, exibida junto ao grafo. Ausência de aresta é `null`; conexão sem peso é representada por `1`.
- Telas para selecionar algoritmo e visualizar grafo, passos e resultado. A execução está intencionalmente desabilitada até a implementação dos algoritmos.
- Pontos de extensão para DFS, BFS, Dijkstra e Kruskal em `src/graphAlgorithms.js`.

React Flow é usado apenas para desenhar e editar o grafo. A estrutura de dados e os algoritmos são responsabilidade do projeto.

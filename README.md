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

- Montagem visual com React Flow: adicionar/remover nós e arestas, mover nós e escolher individualmente se cada aresta é direcionada ou não direcionada. A direção escolhida vale para a próxima aresta criada; um mesmo grafo pode misturar os dois tipos.
- Edite o nome com duplo clique no nó. O rótulo de peso sobre uma aresta é clicável; valores podem ser alterados ali, e apagar o campo deixa a aresta sem peso. Um `+` sobre a aresta indica que ela ainda não tem peso.
- Matriz de adjacência própria em `src/graphModel.js`, exibida junto ao grafo. Ausência de aresta é `null`; conexão sem peso é representada por `1`.
- Telas para selecionar algoritmo e visualizar grafo, passos e resultado. A execução está intencionalmente desabilitada até a implementação dos algoritmos.
- Pontos de extensão para DFS, BFS, Dijkstra e Kruskal em `src/graphAlgorithms.js`.

React Flow é usado apenas para desenhar e editar o grafo. A estrutura de dados e os algoritmos são responsabilidade do projeto.

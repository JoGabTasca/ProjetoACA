# SmartNet Analyzer

Interface em React para montagem visual de grafos e preparação das análises DFS, BFS, Dijkstra e Kruskal.

## Executar localmente

Requisitos: Node.js 18 ou superior.

```bash
npm install
npm run dev
```

Abra no navegador o endereço local informado pelo Vite.

## Estado atual

- Montagem visual com React Flow: adicionar/remover e mover nós, criar arestas direcionadas ou não direcionadas, e editar seus pesos.
- O grafo é estruturado do zero como lista de adjacência em `src/graphModel.js` e exibido junto à visualização.
- A lista de adjacência guarda somente os vizinhos existentes. Isso reduz o uso de memória em grafos esparsos e permite que DFS e BFS percorram as conexões em `O(V + E)`.
- Arestas sem peso recebem custo padrão `1`. A direção é definida individualmente para cada aresta.
- Telas para selecionar algoritmos e visualizar o grafo, os passos e o resultado. DFS, BFS, Dijkstra e Kruskal ainda aguardam implementação em `src/graphAlgorithms.js`.

React Flow é usado apenas para desenhar e editar o grafo. A estrutura de dados e os algoritmos são responsabilidade do projeto.

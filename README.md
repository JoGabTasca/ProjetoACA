# SmartNet Analyzer

## Identificação do trabalho

- **Integrantes (nome e matrícula):** João Gabriel Tasca Barroso de Assis - 202307623911.
- **Curso:** Ciencia de Dados & IA.
- **Disciplina:** Analise e Complexidade de Algoritmos (Engenharia de Computação/Software).
- **Professor:** Cassius Figueiredo.

Aplicação React para montar grafos e visualizar DFS, BFS, Dijkstra e Kruskal. Todos os algoritmos executam em JavaScript no navegador.

## Executar

Instale o Node.js (18 ou superior) e rode:

```powershell
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite. Para gerar a versão estática, use `npm run build`; os arquivos ficam em `dist/`. O comando `npm run preview` permite conferir essa versão localmente. A aplicação não precisa de Python ou servidor de API para executar os algoritmos.

## Do Python para JavaScript

`python/algorithms.py` contém a implementação de referência dos algoritmos, com comentários e resultado final. BFS inclui os níveis e a ordem de retirada da fila. `src/graphAlgorithms.js` contém a adaptação para o navegador, ampliada com o registro de cada passo para alimentar as visualizações.

As duas versões usam os mesmos parâmetros principais e calculam resultados finais equivalentes:

| Python | JavaScript | Parâmetros |
| --- | --- | --- |
| `dfs(graph, start_vertex)` | `dfs(graph, startVertex)` | Grafo e ID da origem |
| `bfs(graph, start_vertex)` | `bfs(graph, startVertex)` | Grafo e ID da origem |
| `dijkstra(graph, start_vertex)` | `dijkstra(graph, startVertex)` | Grafo e ID da origem |
| `kruskal(vertices, edges)` | `kruskal(vertices, edges)` | Lista de IDs e lista de arestas |

Em Python, cada função devolve diretamente o resultado: DFS retorna os tempos de pré-visita e pós-visita; BFS retorna os níveis e a ordem de retirada da fila; Dijkstra retorna as distâncias; Kruskal retorna as arestas escolhidas, o peso total e a quantidade de componentes. BFS percorre a fila com um índice, mantendo O(V + E). Não há histórico, cópias de estados ou classificação de arestas para a interface.

Em JavaScript, cada função devolve `result` e `steps`. O cálculo segue a mesma ideia, com registros adicionais de visitas, fila, arestas e distâncias intermediárias. Visitados, fila, relógio e grupos são criados dentro das funções.

O grafo é uma lista de adjacência. Neste exemplo em Python, a aresta vai de A para B:

```python
graph = {
    "A": [{"id": "B", "weight": 2}],
    "B": [{"id": "A", "weight": 3}],
    "C": [{"id": "B", "weight": 2}, {"id": "A", "weight": 5}]
}
```

No Python, bastam `id` (vizinho) e `weight` (peso). A direção é representada pela própria lista: para uma aresta não direcionada, incluímos o vizinho nos dois extremos. DFS e BFS só usam o `id`.

No JavaScript, os vizinhos também têm `edgeId` e `directed`, usados para identificar e desenhar as arestas durante a execução. Arestas sem peso no editor usam peso 1.

Kruskal recebe as arestas uma única vez:

```python
vertices = ["A", "B"]
edges = [{"source": "A", "target": "B", "weight": 2}]
```

DFS e BFS percorrem os nós alcançáveis pela origem, respeitando as direções. Dijkstra rejeita pesos negativos e usa `None`/`null` para nós inalcançáveis. Kruskal trata as arestas como conexões não direcionadas e produz uma floresta se o grafo for desconectado.

Apenas no JavaScript, os registros de fila e distâncias são cópias: avançar a execução não altera os passos anteriores. `src/algorithmRunner.js` adapta os dados do editor e acrescenta os nomes e mensagens da interface, sem requisições HTTP.

As complexidades mostradas na aplicação consideram o cálculo em JavaScript sem o histórico visual. BFS usa um índice para avançar na fila em ambas as versões, preservando O(V + E). Copiar filas e distâncias no JavaScript acrescenta tempo e memória para registrar os passos visuais. Kruskal usa grupos em listas por simplicidade: sua busca de grupos custa O(V) por aresta, além da ordenação O(E log E).

## Conferir as implementações

Com Python 3.10 ou superior instalado, rode o exemplo didático. Ele imprime apenas o resultado final de cada algoritmo:

```powershell
python python/algorithms.py
```

Python é necessário apenas para estudar e executar essa versão de referência. Para conferir a aplicação JavaScript, use `npm run build` e `npm run preview`.

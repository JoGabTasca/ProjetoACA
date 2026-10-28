import { dfs, bfs, dijkstra, kruskal } from './graphAlgorithms.js';

// O algoritmo trabalha com IDs. Aqui adaptamos a saída para os nomes da tela.
// Assim, a lógica de busca fica separada dos textos da interface.
export function executeAlgorithm({ algorithmId, adjacencyList, edges, startVertex }) {
  const graph = Object.fromEntries(adjacencyList.map((vertex) => [vertex.id, vertex.neighbors]));
  const labels = Object.fromEntries(adjacencyList.map((vertex) => [vertex.id, vertex.label]));
  const vertices = adjacencyList.map((vertex) => vertex.id);
  const algorithms = { dfs, bfs, dijkstra, kruskal };
  if (!Object.hasOwn(algorithms, algorithmId)) throw new Error('Algoritmo desconhecido.');
  if (algorithmId !== 'kruskal' && !Object.hasOwn(graph, startVertex)) {
    throw new Error('Selecione um nó inicial válido.');
  }

  // Arestas sem peso seguem a mesma regra da lista de adjacência: peso 1.
  const graphEdges = edges.map((edge) => {
    const raw = edge.data?.weight;
    const weight = raw === '' || raw == null || !Number.isFinite(Number(raw)) ? 1 : Number(raw);
    return { id: edge.id, source: edge.source, target: edge.target, weight };
  });
  const execution = algorithmId === 'kruskal'
    ? kruskal(vertices, graphEdges)
    : algorithms[algorithmId](graph, startVertex);

  const steps = execution.steps.map((step) => {
    if (step.nodeId !== undefined) {
      const label = labels[step.nodeId];
      if (algorithmId === 'dfs') {
        const entering = step.type === 'previsit-node';
        return { ...step, label, detailLabel: entering ? 'PRÉ-VISITA' : 'PÓS-VISITA', detailValue: step.time,
          message: `${entering ? 'Pré-visita' : 'Pós-visita'} de ${label}: ${step.time}.` };
      }
      const isBfs = algorithmId === 'bfs';
      return { ...step, label, detailLabel: isBfs ? 'NÍVEL' : 'DISTÂNCIA', detailValue: isBfs ? step.level : step.totalCost,
        message: isBfs ? `Visitando ${label} no nível ${step.level}.` : `Selecionando ${label} com distância ${step.totalCost}.` };
    }
    const source = labels[step.fromNodeId], target = labels[step.toNodeId];
    let detail;
    if (algorithmId === 'dfs') detail = step.edgeKind === 'tree' ? 'descobrindo novo nó' : step.edgeKind === 'back' ? 'retorno a um ancestral' : 'nó já finalizado';
    if (algorithmId === 'bfs') detail = step.enqueued ? 'nó adicionado à fila' : 'nó já foi descoberto';
    if (algorithmId === 'dijkstra') detail = `custo ${step.candidate}. ${step.improved ? 'Atualizando a distância' : 'Mantendo a distância atual'}`;
    if (algorithmId === 'kruskal') detail = step.selected ? `selecionada, peso ${step.weight}` : `descartada, peso ${step.weight}, pois formaria um ciclo`;
    return { ...step, message: `Aresta ${source} → ${target}: ${detail}.` };
  });

  let result;
  if (algorithmId === 'dfs') result = Object.entries(execution.result).map(([id, times]) => ({ node: labels[id], ...times }));
  if (algorithmId === 'bfs') result = Object.entries(execution.result).map(([id, level]) => ({ node: labels[id], level }));
  if (algorithmId === 'dijkstra') result = { distances: Object.entries(execution.result).map(([id, cost]) => ({ node: labels[id], cost })) };
  if (algorithmId === 'kruskal') result = { ...execution.result,
    edges: execution.result.edges.map((edge) => ({ from: labels[edge.source], to: labels[edge.target], weight: edge.weight })) };
  return { algorithm: algorithmId, result, steps };
}

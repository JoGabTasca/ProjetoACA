/**
 * Converte o grafo visual em uma lista de adjacência própria do projeto.
 * Cada entrada representa um vértice e seus vizinhos, identificados pelos
 * índices correspondentes no array `nodes`. Arestas sem peso usam peso 1.
 */
export function buildAdjacencyList(nodes, edges, defaultDirected = false) {
  const indexById = new Map(nodes.map((node, index) => [node.id, index]));
  const adjacencyList = nodes.map((node) => ({
    id: node.id,
    label: node.data?.label ?? node.id,
    neighbors: [],
  }));

  for (const edge of edges) {
    const from = indexById.get(edge.source);
    const to = indexById.get(edge.target);
    if (from === undefined || to === undefined) continue;

    const rawWeight = edge.data?.weight;
    const weight = rawWeight === '' || rawWeight === null || rawWeight === undefined
      ? 1
      : Number.isFinite(Number(rawWeight)) ? Number(rawWeight) : 1;
    const directed = edge.data?.directed ?? defaultDirected;

    adjacencyList[from].neighbors.push({
      to,
      id: nodes[to].id,
      label: nodes[to].data?.label ?? nodes[to].id,
      weight,
      directed,
      edgeId: edge.id,
    });

    if (!directed) {
      adjacencyList[to].neighbors.push({
        to: from,
        id: nodes[from].id,
        label: nodes[from].data?.label ?? nodes[from].id,
        weight,
        directed: false,
        edgeId: edge.id,
      });
    }
  }

  return adjacencyList;
}

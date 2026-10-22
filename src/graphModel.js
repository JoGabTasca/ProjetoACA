/**
 * Conversão do modelo visual para matriz de adjacência.
 * Esta estrutura é do projeto (não é fornecida pelo React Flow).
 * null significa ausência de aresta; arestas sem peso recebem peso 1.
 */
export function buildAdjacencyMatrix(nodes, edges, defaultDirected = false) {
  const matrix = Array.from({ length: nodes.length }, () => Array(nodes.length).fill(null));
  const indexById = new Map(nodes.map((node, index) => [node.id, index]));

  for (const edge of edges) {
    const from = indexById.get(edge.source);
    const to = indexById.get(edge.target);
    if (from === undefined || to === undefined) continue;
    const rawWeight = edge.data?.weight;
    const weight = rawWeight === '' || rawWeight === null || rawWeight === undefined
      ? 1
      : Number.isFinite(Number(rawWeight)) ? Number(rawWeight) : 1;
    const directed = edge.data?.directed ?? defaultDirected;
    matrix[from][to] = weight;
    if (!directed) matrix[to][from] = weight;
  }
  return matrix;
}

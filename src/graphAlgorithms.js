// Cada chave do grafo é um nó. Seus vizinhos guardam id, peso e dados da aresta.
// Os passos são anotações da execução, usadas para desenhar a explicação na tela.
export function dfs(graph, startVertex) {
  const visits = {};
  const steps = [];
  let time = 0;

  function visit(node, parentEdge = null) {
    // Ao entrar no nó, marcamos o horário. Ele ainda não foi finalizado.
    time += 1;
    visits[node] = { pre: time, post: null };
    steps.push({ type: 'previsit-node', nodeId: node, time });

    for (const edge of graph[node]) {
      const neighbor = edge.id;
      // Em um grafo não direcionado, a mesma aresta aparece nos dois sentidos.
      // Não contamos a volta ao pai como se fosse outra conexão.
      if (edge.edgeId != null && edge.edgeId === parentEdge && !edge.directed) continue;

      let kind = 'tree';
      if (Object.hasOwn(visits, neighbor)) {
        kind = visits[neighbor].post === null ? 'back' : 'visited';
      }
      steps.push({ type: 'inspect-edge', fromNodeId: node, toNodeId: neighbor, edgeId: edge.edgeId, edgeKind: kind });

      // Só aprofundamos a busca quando encontramos um nó novo.
      if (kind === 'tree') visit(neighbor, edge.edgeId);
    }

    // Todos os vizinhos foram examinados: fechamos o nó e voltamos ao anterior.
    time += 1;
    visits[node].post = time;
    steps.push({ type: 'postvisit-node', nodeId: node, time });
  }

  visit(startVertex);
  return { result: visits, steps };
}

export function bfs(graph, startVertex) {
  const levels = { [startVertex]: 0 };
  const queue = [startVertex];
  const steps = [];
  let head = 0;

  while (head < queue.length) {
    // A posição head indica quem será atendido. Avançá-la evita deslocar a lista.
    const queueBefore = queue.slice(head);
    const current = queue[head];
    head += 1;
    steps.push({ type: 'visit-node', nodeId: current, level: levels[current], queue: queueBefore });

    for (const edge of graph[current]) {
      const neighbor = edge.id;
      const isNew = !Object.hasOwn(levels, neighbor);
      if (isNew) {
        // Marcamos na entrada da fila para não enfileirar o mesmo nó duas vezes.
        levels[neighbor] = levels[current] + 1;
        queue.push(neighbor);
      }
      steps.push({ type: 'inspect-edge', fromNodeId: current, toNodeId: neighbor,
        edgeId: edge.edgeId, enqueued: isNew, edgeKind: isNew ? 'tree' : 'visited', queue: queue.slice(head) });
    }
  }

  return { result: levels, steps };
}

export function dijkstra(graph, startVertex) {
  const vertices = Object.keys(graph);
  const distances = Object.fromEntries(vertices.map((node) => [node, null]));
  const finished = {};
  const steps = [];
  distances[startVertex] = 0;

  // Com pesos negativos, escolher a menor distância atual não garante a resposta.
  for (const node of vertices) {
    for (const edge of graph[node]) {
      if (edge.weight < 0) throw new Error('Dijkstra não aceita pesos negativos.');
    }
  }

  while (true) {
    // Procuramos o nó alcançável de menor custo que ainda não foi finalizado.
    let current = null;
    for (const node of vertices) {
      if (Object.hasOwn(finished, node) || distances[node] === null) continue;
      if (current === null || distances[node] < distances[current]) current = node;
    }
    // Se não há candidato, os nós restantes não podem ser alcançados pela origem.
    if (current === null) break;
    finished[current] = true;
    steps.push({ type: 'visit-node', nodeId: current, totalCost: distances[current], distances: { ...distances } });

    for (const edge of graph[current]) {
      const neighbor = edge.id;
      const candidate = distances[current] + edge.weight;
      const improved = distances[neighbor] === null || candidate < distances[neighbor];
      // Só trocamos uma distância quando o novo caminho realmente é mais barato.
      if (improved) distances[neighbor] = candidate;
      // A cópia preserva esta rodada mesmo quando a próxima alterar as distâncias.
      steps.push({ type: 'inspect-edge', fromNodeId: current, toNodeId: neighbor,
        edgeId: edge.edgeId, weight: edge.weight, improved, candidate, distances: { ...distances } });
    }
  }

  return { result: distances, steps };
}

export function kruskal(vertices, edges) {
  // No começo, cada nó forma seu próprio grupo.
  const groups = vertices.map((node) => [node]);
  const chosen = [];
  const steps = [];
  // Ordenamos uma cópia para preservar a ordem das arestas no editor.
  const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);

  for (const edge of sortedEdges) {
    const sourceGroup = groups.find((group) => group.includes(edge.source));
    const targetGroup = groups.find((group) => group.includes(edge.target));
    if (!sourceGroup || !targetGroup) throw new Error('Uma aresta aponta para um nó inexistente.');
    // Dois nós do mesmo grupo já estão conectados. Uni-los criaria um ciclo.
    const selected = sourceGroup !== targetGroup;
    steps.push({ type: 'inspect-edge', fromNodeId: edge.source, toNodeId: edge.target,
      edgeId: edge.id, weight: edge.weight, selected });
    if (selected) {
      chosen.push(edge);
      sourceGroup.push(...targetGroup);
      groups.splice(groups.indexOf(targetGroup), 1);
    }
  }

  // Se sobraram vários grupos, o grafo era desconectado e obtivemos uma floresta.
  const totalWeight = chosen.reduce((total, edge) => total + edge.weight, 0);
  return { result: { edges: chosen, totalWeight, components: groups.length }, steps };
}

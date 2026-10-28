"""Algoritmos básicos em Python: recebem o grafo e devolvem o resultado final.

Cada vizinho tem um id e um weight (peso). A direção é definida pela lista:
se A aponta para B, B aparece nos vizinhos de A. Para uma conexão sem direção,
incluímos também A nos vizinhos de B.
O registro dos passos para a interface fica apenas na versão JavaScript.
"""


def dfs(graph, start_vertex):
    visits = {}
    time = 0

    def visit(node):
        nonlocal time
        # Ao entrar no nó, marcamos o previsit. Ele ainda não foi finalizado.
        time += 1
        visits[node] = {"pre": time, "post": None}

        for edge in graph[node]:
            neighbor = edge["id"]
            # Só aprofundamos a busca quando encontramos um nó novo.
            if neighbor not in visits:
                visit(neighbor)

        # Terminamos os vizinhos: fechamos o nó e voltamos ao anterior.
        time += 1
        visits[node]["post"] = time

    visit(start_vertex)
    return visits


def bfs(graph, start_vertex):
    niveis = {start_vertex: 0}
    fila = [start_vertex]
    ordem_fila = [start_vertex]

    while fila:
        # Tiramos sempre primeiro da fila para visitar seus vizinhos.
        atual = fila.pop(0)

        for aresta in graph[atual]:
            vizinho = aresta["id"]
            if vizinho not in niveis:
                # Marcamos ao enfileirar, para não colocar o mesmo nó duas vezes.
                niveis[vizinho] = niveis[atual] + 1
                fila.append(vizinho)
                ordem_fila.append(vizinho)

    return niveis and ordem_fila


def dijkstra(graph, start_vertex):
    dist = dict.fromkeys(graph, None)
    visitado = []
    dist[start_vertex] = 0

    for node in graph:
        for edge in graph[node]:
            if edge["weight"] < 0:
                raise ValueError("Dijkstra não aceita pesos negativos.")

    while True:
        # Procuramos o nó alcançável de menor custo que ainda não foi finalizado.
        atual = None
        for no in graph:
            if no in visitado or visitado[no] is None:
                continue
            if atual is None or dist[node] < dist[atual]:
                atual = no

        # Sem candidato, os nós restantes não são alcançáveis a partir da origem.
        if atual is None:
            break
        visitado.append(atual)

        for aresta in graph[atual]:
            vizinho = aresta["id"]
            candidato = dist[atual] + aresta["weight"]
            # Só trocamos uma distância se o novo caminho for mais barato.
            if dist[vizinho] is None or candidato < dist[vizinho]:
                dist[vizinho] = candidato

    return dist


def kruskal(vertices, edges):
    # No começo, cada nó forma seu próprio grupo.
    groups = [[node] for node in vertices]
    chosen = []

    # Começamos pelas arestas mais baratas, sem alterar a lista original.
    for edge in sorted(edges, key=lambda item: item["weight"]):
        source_group = None
        target_group = None
        for group in groups:
            if edge["source"] in group:
                source_group = group
            if edge["target"] in group:
                target_group = group
        if source_group is None or target_group is None:
            raise ValueError("Uma aresta aponta para um nó inexistente.")

        # Se os nós já estão no mesmo grupo, a aresta criaria um ciclo.
        if source_group is not target_group:
            chosen.append(edge)
            source_group.extend(target_group)
            groups.remove(target_group)

    # Vários grupos no final significam que encontramos uma floresta.
    total_weight = sum(edge["weight"] for edge in chosen)
    return {"edges": chosen, "totalWeight": total_weight, "components": len(groups)}


if __name__ == "__main__":
    # Este exemplo roda com: python python/algorithms.py
    graph = {
        "A": [{"id": "B", "weight": 2}],
        "B": [{"id": "A", "weight": 2}],
    }
    print("DFS:", dfs(graph, "A"))
    print("BFS:", bfs(graph, "A"))
    print("Dijkstra:", dijkstra(graph, "A"))
    edges = [{"source": "A", "target": "B", "weight": 2}]
    print("Kruskal:", kruskal(list(graph), edges))

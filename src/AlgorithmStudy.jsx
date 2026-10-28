import React, { useState } from 'react';

export function traversalState(steps) {
  const tree = new Set(steps.filter((s) => s.edgeKind === 'tree').map((s) => s.edgeId));
  const examined = new Map();
  for (const s of steps) if (s.type === 'inspect-edge' && s.edgeId) examined.set(s.edgeId, tree.has(s.edgeId) ? 'tree' : s.edgeKind);
  return examined;
}

export function BfsList({ nodes, steps, activeStep }) {
  const discovered = new Map();
  const removed = new Set();
  let processing = null;
  for (const step of steps.slice(0, activeStep + 1)) {
    if (step.type === 'visit-node') {
      discovered.set(step.nodeId, step.level);
      removed.add(step.nodeId);
      processing = step.nodeId;
    } else if (step.enqueued) {
      discovered.set(step.toNodeId, discovered.get(step.fromNodeId) + 1);
    }
  }
  const complete = activeStep === steps.length - 1;
  const label = (id) => nodes.find((node) => node.id === id)?.data.label ?? id;
  const waiting = [...discovered.keys()].filter((id) => !removed.has(id));
  return <div className="bfs-list-study">
    <p className="bfs-list-intro">Os nós entram pela direita. O primeiro da fila sai para ter seus vizinhos examinados.</p>
    <div className="bfs-list-scroll"><div className="bfs-list-row" role="list" aria-label="Lista BFS em ordem de descoberta">
      <span className="bfs-list-bracket" aria-hidden="true">[</span>
      {[...discovered].map(([id, level]) => {
        const out = removed.has(id);
        const active = !complete && processing === id;
        return <div key={id} role="listitem" className={`bfs-list-entry ${out ? 'is-removed' : 'is-waiting'} ${active ? 'is-processing' : ''}`} aria-label={`${label(id)}, nível ${level}, ${out ? 'saiu da fila' : 'na fila'}${active ? ', em processamento' : ''}`}>
          <span className="bfs-list-level" title={`Nível ${level}`}>{level}</span>
          <span className="bfs-list-node">{label(id)}</span>
          <span className="bfs-list-status">{active ? 'processando' : out ? 'saiu' : 'na fila'}</span>
        </div>;
      })}
      <span className="bfs-list-bracket" aria-hidden="true">]</span>
    </div></div>
    <div className="bfs-list-summary" aria-live="polite"><b>{complete ? 'Percurso concluído' : `Em processamento: ${label(processing)}`}</b><span>{waiting.length ? `Ainda na fila: ${waiting.map(label).join(', ')}` : 'Fila vazia'}</span></div>
    <p className="study-caption">O número acima de cada nó indica seu nível. Nós riscados já saíram da fila; permanecem visíveis para mostrar a ordem do percurso.</p>
  </div>;
}

function TraversalTree({ algorithm, nodes, edges, steps, activeStep }) {
  const [fitDrawing, setFitDrawing] = useState(true);
  const [horizontal, setHorizontal] = useState(true);
  const shown = steps.slice(0, activeStep + 1);
  const positions = new Map();
  const children = new Map(nodes.map((n) => [n.id, []]));
  for (const s of steps) if (s.edgeKind === 'tree') children.get(s.fromNodeId)?.push(s.toNodeId);
  let column = 0;
  function place(id, depth) {
    const xs = (children.get(id) || []).map((child) => place(child, depth + 1));
    const breadth = xs.length ? (xs[0] + xs[xs.length - 1]) / 2 : 160 + column++ * 80;
    positions.set(id, horizontal ? { x: 45 + depth * 64, y: breadth } : { x: breadth, y: 45 + depth * 64 });
    return breadth;
  }
  const root = steps.find((s) => s.nodeId)?.nodeId;
  if (root) place(root, 0);
  const visible = new Map();
  for (const s of shown) {
    if (s.nodeId) {
      const info = visible.get(s.nodeId) || {};
      if (s.type === 'previsit-node') info.pre = s.time;
      if (s.type === 'postvisit-node') info.post = s.time;
      if (s.level !== undefined) info.level = s.level;
      visible.set(s.nodeId, info);
    }
  }
  const examined = traversalState(shown), current = steps[activeStep];
  const label = (id) => nodes.find((n) => n.id === id)?.data.label;
  const width = Math.max(220, ...[...positions.values()].map((p) => p.x + 70));
  const height = Math.max(180, ...[...positions.values()].map((p) => p.y + 65));
  return <>
    <div className="study-view-tools" role="group" aria-label="Disposição e escala do desenho"><button aria-pressed={horizontal} onClick={() => setHorizontal((value) => !value)}>{horizontal ? 'Horizontal' : 'Vertical'}</button><button aria-pressed={fitDrawing} onClick={() => setFitDrawing(true)}>Ajustar ao painel</button><button aria-pressed={!fitDrawing} onClick={() => setFitDrawing(false)}>Tamanho real</button></div>
    <div className={`study-tree-scroll ${fitDrawing ? 'fit-drawing' : ''}`}><svg className="study-tree" viewBox={`0 0 ${width} ${height}`} width={width} height={height} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Árvore ${algorithm.toUpperCase()} com arestas para nós já visitados`}>
      <defs>{['tree', 'visited', 'active'].map((kind) => <marker key={kind} id={`study-${kind}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={kind === 'active' ? '#d99a29' : kind === 'tree' ? '#5368e9' : '#bd7950'}/></marker>)}</defs>
      {edges.filter((e) => examined.has(e.id)).map((e, index) => {
        const a = positions.get(e.source), b = positions.get(e.target);
        if (!a || !b || !visible.has(e.source) || !visible.has(e.target)) return null;
        const active = current?.edgeId === e.id, dashed = examined.get(e.id) !== 'tree';
        const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy) || 1;
        const lane = 45 + (index % 5) * 20;
        const d = dashed
          ? horizontal
            ? `M ${a.x} ${a.y - 18} C ${a.x} ${Math.min(a.y, b.y) - lane}, ${b.x} ${Math.min(a.y, b.y) - lane}, ${b.x} ${b.y - 20}`
            : `M ${a.x - 18} ${a.y} C ${Math.min(a.x, b.x) - lane} ${a.y}, ${Math.min(a.x, b.x) - lane} ${b.y}, ${b.x - 20} ${b.y}`
          : `M ${a.x + dx / length * 18} ${a.y + dy / length * 18} L ${b.x - dx / length * 20} ${b.y - dy / length * 20}`;
        return <path key={e.id} d={d} fill="none" stroke={active ? '#d99a29' : dashed ? '#bd7950' : '#5368e9'} strokeWidth={active ? 3 : 1.8} strokeDasharray={dashed ? '7 6' : undefined} markerEnd={e.data?.directed ? `url(#study-${active ? 'active' : dashed ? 'visited' : 'tree'})` : undefined}><title>{`${label(e.source)} ${e.data?.directed ? '→' : '—'} ${label(e.target)}: ${dashed ? 'nó já visitado' : 'aresta da árvore'}`}</title></path>;
      })}
      {nodes.filter((n) => visible.has(n.id)).map((n) => {
        const p = positions.get(n.id), info = visible.get(n.id);
        if (!p) return null;
        return <g key={n.id} transform={`translate(${p.x},${p.y})`}><circle r="18" fill={current?.nodeId === n.id ? '#fff3d9' : '#fff'} stroke={current?.nodeId === n.id ? '#d99a29' : '#5368e9'} strokeWidth="2"/><text textAnchor="middle" dy="5" className="study-node-label">{n.data.label}</text><text x={horizontal ? 0 : 26} y={horizontal ? 36 : -16} textAnchor={horizontal ? 'middle' : 'start'} className="study-node-time">{algorithm === 'dfs' ? `${info.pre ?? '–'}, ${info.post ?? '–'}` : `nível ${info.level}`}</text></g>;
      })}
    </svg></div>
    <div className="study-legend"><span><i/>Aresta da árvore</span><span><i className="dashed"/>Nó já visitado / retorno</span><span>Setas indicam o sentido das arestas direcionadas.</span></div>
    <p className="study-caption">Tempos de cada nó: pré-visita, pós-visita. O relógio avança na entrada e na saída. Tracejados indicam conexões a nós já visitados.</p>
  </>;
}

function DistanceTable({ nodes, steps, activeStep }) {
  const initial = Object.fromEntries(nodes.map((n) => [n.id, null]));
  const first = steps.find((s) => s.type === 'visit-node');
  if (first) initial[first.nodeId] = 0;
  const rows = [{ distances: initial, label: 'Inicial' }];
  for (const s of steps.slice(0, activeStep + 1)) {
    if (s.type === 'visit-node') rows.push({ distances: s.distances, nodeId: s.nodeId, label: nodes.find((n) => n.id === s.nodeId)?.data.label });
    else if (s.distances && rows.length > 1) rows[rows.length - 1].distances = s.distances;
  }
  return <><div className="study-table-scroll"><table className="study-table"><caption>Distâncias por rodada de Dijkstra</caption><thead><tr><th scope="col">Selecionado</th>{nodes.map((n) => <th scope="col" key={n.id}>{n.data.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}><th scope="row">{row.label}</th>{nodes.map((n) => {
    const settled = rows.slice(1, index).some((r) => r.nodeId === n.id);
    const value = row.distances?.[n.id];
    const changed = index > 0 && value !== rows[index - 1].distances?.[n.id];
    return <td key={n.id} className={settled ? 'distance-settled' : changed ? 'distance-changed' : ''}>{settled ? '—' : <span className={row.nodeId === n.id ? 'distance-selected' : ''}>{value ?? '∞'}</span>}</td>;
  })}</tr>)}</tbody></table></div><p className="study-caption">O círculo marca a menor distância selecionada. Valores destacados foram atualizados nesta rodada; “—” indica um nó já finalizado. A última linha acompanha o passo atual.</p></>;
}

export default function AlgorithmStudy({ algorithm, nodes, edges, steps, activeStep }) {
  if (!steps.length || !['dfs', 'bfs', 'dijkstra'].includes(algorithm)) return null;
  return <section className="result-card algorithm-study"><div className="result-head"><div><span className="section-kicker">VISÃO DE ESTUDO · PASSO {activeStep + 1}</span><h2>{algorithm === 'dfs' ? 'Árvore DFS · tempos de visita' : algorithm === 'bfs' ? 'BFS · lista e níveis' : 'Dijkstra · tabela de distâncias'}</h2></div></div>{algorithm === 'bfs' ? <BfsList nodes={nodes} steps={steps} activeStep={activeStep}/> : algorithm === 'dijkstra' ? <DistanceTable nodes={nodes} steps={steps} activeStep={activeStep}/> : <TraversalTree algorithm={algorithm} nodes={nodes} edges={edges} steps={steps} activeStep={activeStep}/>}</section>;
}

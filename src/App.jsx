import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, { Background, BaseEdge, Controls, EdgeLabelRenderer, Handle, MarkerType, Position, addEdge, getBezierPath, useEdgesState, useNodesState, useReactFlow } from 'reactflow';
import { Activity, ArrowLeft, ArrowRight, Check, Circle, CircleHelp, Clock3, Code2, GitBranch, GitFork, Layers3, Maximize2, Minimize2, Network, PanelLeftClose, PanelLeftOpen, Play, Plus, RotateCcw, Route, Waypoints, X } from 'lucide-react';
import { buildAdjacencyMatrix } from './graphModel.js';

const algorithms = [
  { id: 'dfs', name: 'Busca em profundidade', short: 'DFS', subtitle: 'Explore cada caminho até o fim antes de voltar.', icon: GitBranch, complexity: 'O(V + E)', kind: 'Percurso' },
  { id: 'bfs', name: 'Busca em largura', short: 'BFS', subtitle: 'Visite os vizinhos por camadas a partir da origem.', icon: Layers3, complexity: 'O(V + E)', kind: 'Percurso' },
  { id: 'dijkstra', name: 'Caminho mínimo', short: 'Dijkstra', subtitle: 'Encontre as rotas de menor custo no grafo.', icon: Route, complexity: 'O(V²)', kind: 'Roteamento' },
  { id: 'kruskal', name: 'Árvore geradora mínima', short: 'Kruskal', subtitle: 'Conecte todos os nós com o menor custo total.', icon: Waypoints, complexity: 'O(E log E)', kind: 'Otimização' },
];

// Um handle central mantém a API de conexões do React Flow satisfeita.
// RadialEdge reposiciona o desenho para que a aresta toque a borda circular.
function CircleNode({ id, data }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  useEffect(() => setDraft(data.label), [data.label]);
  return <div className="graph-node-circle" title="Duplo clique para editar o nome" onDoubleClick={(event)=>{if(event.target.tagName==='INPUT')return;setDraft(data.label);setEditing(true)}}>
    <Handle id="center-target" type="target" position={Position.Top} className="invisible-handle" />
    {editing
      ? <input className="node-name-input" autoFocus value={draft} aria-label="Nome do nó" onChange={(event)=>setDraft(event.target.value)} onBlur={()=>{data.onRename?.(id,draft);setEditing(false)}} onKeyDown={(event)=>{if(event.key==='Enter')event.currentTarget.blur();if(event.key==='Escape'){setDraft(data.label);setEditing(false)}}} onDoubleClick={(event)=>event.stopPropagation()} />
      : <span>{data.label}</span>}
    <Handle id="center-source" type="source" position={Position.Bottom} className="invisible-handle" />
  </div>;
}

function RadialEdge({ id, sourceX, sourceY, targetX, targetY, markerEnd, style, label, labelStyle, data }) {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const distance = Math.hypot(dx, dy) || 1;
  const radius = 39;
  const ux = dx / distance;
  const uy = dy / distance;
  const [path, labelX, labelY] = getBezierPath({
    sourceX: sourceX + ux * radius,
    sourceY: sourceY + uy * radius,
    targetX: targetX - ux * radius,
    targetY: targetY - uy * radius,
    sourcePosition: ux > .5 ? Position.Right : ux < -.5 ? Position.Left : uy > 0 ? Position.Bottom : Position.Top,
    targetPosition: ux > .5 ? Position.Left : ux < -.5 ? Position.Right : uy > 0 ? Position.Top : Position.Bottom,
  });
  return <>
    <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
    <EdgeLabelRenderer><div className={`edge-weight-label nodrag nopan ${data?.editing?'editing':''}`} title={data?.editing?'Digite o peso ou apague para remover':'Clique para editar o peso'} onClick={(event)=>{event.stopPropagation();if(!data?.editing)data?.onEdit?.(id)}} style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, ...labelStyle }}>{data?.editing?<input autoFocus type="number" value={data.weight??''} aria-label="Peso da aresta" onChange={(event)=>data.onWeightChange?.(id,event.target.value)} onBlur={()=>data.onEditEnd?.()} onKeyDown={(event)=>{if(event.key==='Enter'||event.key==='Escape')event.currentTarget.blur()}}/>:label}</div></EdgeLabelRenderer>
  </>;
}

const nodeTypes = { graphNode: CircleNode };
const edgeTypes = { radial: RadialEdge };

const starterNodes = [
  { id: 'n1', position: { x: 115, y: 116 }, data: { label: 'Centro' }, type: 'graphNode' },
  { id: 'n2', position: { x: 335, y: 54 }, data: { label: 'Jardins' }, type: 'graphNode' },
  { id: 'n3', position: { x: 545, y: 129 }, data: { label: 'Estação' }, type: 'graphNode' },
  { id: 'n4', position: { x: 320, y: 247 }, data: { label: 'Vila Nova' }, type: 'graphNode' },
];
const starterEdges = [
  { id: 'e1', source: 'n1', target: 'n2', sourceHandle: 'center-source', targetHandle: 'center-target', data: { weight: 4, directed: false }, label: '4', type: 'radial' },
  { id: 'e2', source: 'n2', target: 'n3', sourceHandle: 'center-source', targetHandle: 'center-target', data: { weight: 2, directed: false }, label: '2', type: 'radial' },
  { id: 'e3', source: 'n1', target: 'n4', sourceHandle: 'center-source', targetHandle: 'center-target', data: { weight: 3, directed: false }, label: '3', type: 'radial' },
  { id: 'e4', source: 'n4', target: 'n3', sourceHandle: 'center-source', targetHandle: 'center-target', data: { weight: 5, directed: false }, label: '5', type: 'radial' },
];

function App() {
  const [screen, setScreen] = useState('build');
  const [nodes, setNodes, onNodesChange] = useNodesState(starterNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(starterEdges);
  const [tool, setTool] = useState('select');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth < 800);
  const [directed, setDirected] = useState(false);
  const [editingEdgeId, setEditingEdgeId] = useState(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('dijkstra');
  const [origin, setOrigin] = useState('n1');
  const [pendingSource, setPendingSource] = useState(null);
  const [notice, setNotice] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  const matrix = useMemo(() => buildAdjacencyMatrix(nodes, edges), [nodes, edges]);
  const renameNode = useCallback((id, label) => {
    const name = label.trim();
    if (!name) return;
    setNodes((current) => current.map((node) => node.id === id ? { ...node, data: { ...node.data, label: name } } : node));
  }, [setNodes]);
  const setEdgeWeight = useCallback((id, value) => {
    setEdges((current) => current.map((edge) => edge.id === id ? { ...edge, data: { ...edge.data, weight: value === '' ? null : Number(value) } } : edge));
  }, [setEdges]);
  const chosen = algorithms.find((item) => item.id === selectedAlgorithm);
  const originName = nodes.find((node) => node.id === origin)?.data.label ?? 'Centro';

  const onConnect = useCallback((connection) => {
    const weight = null;
    const edge = { ...connection, sourceHandle: 'center-source', targetHandle: 'center-target', id: `e${Date.now()}`, type: 'radial', data: { weight, directed }, label: '+',
      markerEnd: directed ? { type: MarkerType.ArrowClosed, color: '#75819a' } : undefined };
    setEdges((current) => addEdge(edge, current));
  }, [directed, setEdges]);

  const addNode = (position) => {
    const label = `N${nodes.length + 1}`;
    const id = `n${Date.now()}`;
    const nodePosition = position ?? { x: 120 + (nodes.length % 3) * 190, y: 80 + Math.floor(nodes.length / 3) * 135 };
    setNodes((current) => [...current, { id, position: nodePosition, data: { label }, type: 'graphNode' }]);
    setOrigin((current) => current || id);
    setTool('select'); setNotice(`${label} adicionado`);
    setTimeout(() => setNotice(''), 2400);
  };

  const onPaneClick = (event) => {
    if (tool !== 'node') return;
    addNode(screenToFlowPosition({ x: event.clientX, y: event.clientY }));
  };

  const onNodeClick = (_, node) => {
    if (tool === 'edge') {
      if (!pendingSource) { setPendingSource(node.id); setNotice(`Agora selecione o destino de ${node.data.label}`); return; }
      if (pendingSource === node.id) { setNotice('Escolha um nó diferente para criar a aresta.'); setPendingSource(null); return; }
      const sourceName = nodes.find((item) => item.id === pendingSource)?.data.label;
      const edgeId = `e${Date.now()}`;
      const weight = null;
      setEdges((current) => [...current, { id: edgeId, source: pendingSource, target: node.id, sourceHandle: 'center-source', targetHandle: 'center-target', type: 'radial', data: { weight, directed }, label: '+',
        markerEnd: directed ? { type: MarkerType.ArrowClosed, color: '#75819a' } : undefined }]);
      setNotice(`${directed ? 'Conexão direcionada' : 'Conexão'}: ${sourceName} → ${node.data.label}`);
      setPendingSource(null); setTool('select'); setTimeout(() => setNotice(''), 2400);
    }
  };

  const resetGraph = () => { setNodes([]); setEdges([]); setOrigin(''); setPendingSource(null); };
  const selectEdgeDirection = (nextDirected) => {
    setDirected(nextDirected);
    setTool('edge');
    setPendingSource(null);
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setNotice('Tela cheia não está disponível neste navegador.');
      setTimeout(() => setNotice(''), 2400);
    }
  };

  const beginAlgorithm = () => { setActiveStep(0); setScreen('run'); };
  const stepLabel = selectedAlgorithm === 'dfs' ? 'Explorando vizinhos do nó atual' : selectedAlgorithm === 'bfs' ? 'Verificando os nós vizinhos' : selectedAlgorithm === 'kruskal' ? 'Analisando aresta de menor peso' : 'Atualizando custos dos caminhos';

  return <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${screen === 'build' ? 'build-screen' : ''}`}>
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Network size={20} strokeWidth={2.2} /></div><div className="brand-name">smartnet<span>.</span></div><button className="sidebar-collapse" onClick={()=>setSidebarCollapsed((value)=>!value)} title={sidebarCollapsed?'Expandir menu':'Recolher menu'} aria-label={sidebarCollapsed?'Expandir menu':'Recolher menu'}>{sidebarCollapsed?<PanelLeftOpen size={16}/>:<PanelLeftClose size={16}/>}</button></div>
      <nav className="steps-nav" aria-label="Etapas do projeto">
        <button className={`nav-step ${screen === 'build' ? 'active' : ''}`} onClick={() => setScreen('build')} title="Montar grafo" aria-current={screen === 'build' ? 'step' : undefined}><span className="step-icon"><Circle size={17}/></span><span><b>Montar grafo</b></span><span className="nav-index">01</span></button>
        <button className={`nav-step ${screen === 'algorithm' ? 'active' : ''}`} onClick={() => setScreen('algorithm')} title="Algoritmo" aria-current={screen === 'algorithm' ? 'step' : undefined}><span className="step-icon"><Activity size={17}/></span><span><b>Algoritmo</b></span><span className="nav-index">02</span></button>
        <button className={`nav-step ${screen === 'run' ? 'active' : ''}`} onClick={() => setScreen('run')} title="Execução" aria-current={screen === 'run' ? 'step' : undefined}><span className="step-icon"><Play size={16}/></span><span><b>Execução</b></span><span className="nav-index">03</span></button>
      </nav>
    </aside>

    <main className="main-area">
      {screen === 'build' && <section className="page-content graph-page">
        <div className="editor-layout">
          <section className="canvas-card">
            <div className={`canvas-wrap ${tool==='node'?'adding-node':''} ${tool==='edge'?'adding-edge':''}`}><ReactFlow nodes={nodes.map((node)=>({...node,data:{...node.data,onRename:renameNode}}))} edges={edges.map((edge) => ({ ...edge, type: 'radial', label: edge.data?.weight == null ? '+' : String(edge.data.weight), data:{...edge.data,editing:editingEdgeId===edge.id,onEdit:setEditingEdgeId,onWeightChange:setEdgeWeight,onEditEnd:()=>setEditingEdgeId(null)}, markerEnd: edge.data?.directed ? { type: MarkerType.ArrowClosed, color: '#75819a' } : undefined,
              style: { stroke: '#8e9aae', strokeWidth: 1.7 }, labelStyle: { fill: '#526078', fontWeight: 700, fontSize: 12 } }))} nodeTypes={nodeTypes} edgeTypes={edgeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={onNodeClick} onPaneClick={onPaneClick} fitView fitViewOptions={{ padding: .28 }} nodesConnectable={false} elementsSelectable={tool === 'select'} connectionLineStyle={{ stroke: '#5267e8', strokeWidth: 2 }}>
              <Background color="#e6e9ef" gap={20} size={1}/>
            </ReactFlow>
              <div className="canvas-toolbar"><div className="tool-mode-grid"><button className={`tool-option tool-icon-only ${tool === 'node' ? 'selected' : ''}`} title="Adicionar nó" aria-label="Adicionar nó" onClick={() => {setTool(tool==='node'?'select':'node');setPendingSource(null)}}><Circle size={22} strokeWidth={1.8}/></button><button className={`tool-option tool-icon-only ${tool === 'edge' && !directed ? 'selected' : ''}`} aria-pressed={tool==='edge'&&!directed} title="Próxima aresta não direcionada" aria-label="Próxima aresta não direcionada" onClick={()=>selectEdgeDirection(false)}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><path d="M7 12h10"/></svg></button><button className={`tool-option tool-icon-only ${tool === 'edge' && directed ? 'selected' : ''}`} aria-pressed={tool==='edge'&&directed} title="Próxima aresta direcionada" aria-label="Próxima aresta direcionada" onClick={()=>selectEdgeDirection(true)}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="4" cy="12" r="2"/><path d="M6.5 12H19m-5-5 5 5-5 5"/></svg></button><button className="square-button" onClick={resetGraph} title="Limpar grafo" aria-label="Limpar grafo"><RotateCcw size={15}/></button></div></div>
              <div className="canvas-actions"><button className="square-button" onClick={toggleFullscreen} title={isFullscreen?'Sair da tela cheia':'Tela cheia'} aria-label={isFullscreen?'Sair da tela cheia':'Tela cheia'}>{isFullscreen?<Minimize2 size={16}/>:<Maximize2 size={16}/>}</button></div>
              <div className="canvas-badge"><span/> {nodes.length} nós <i/> {edges.length} arestas</div>
              {notice && <div className="toast"><Check size={14}/>{notice}<button onClick={() => setNotice('')}><X size={13}/></button></div>}
              <details className="matrix-floating" open><summary>Matriz de adjacência <span>{nodes.length} × {nodes.length}</span></summary>{nodes.length===0?<div className="matrix-empty">Adicione nós para visualizar a matriz.</div>:<div className="matrix-scroll"><table className="adjacency-table"><thead><tr><th></th>{nodes.map((node)=><th key={node.id} title={node.data.label}>{node.data.label}</th>)}</tr></thead><tbody>{nodes.map((node,row)=><tr key={node.id}><th title={node.data.label}>{node.data.label}</th>{matrix[row].map((value,column)=><td className={value!==null?'has-edge':''} key={`${row}-${column}`}>{value===null?'·':value}</td>)}</tr>)}</tbody></table></div>}</details>
            </div>
          </section>

          <aside className="control-card"><button className="primary-button" onClick={()=>setScreen('algorithm')} disabled={nodes.length < 1}>Escolher algoritmo <ArrowRight size={16}/></button></aside>
        </div>
      </section>}

      {screen === 'algorithm' && <section className="page-content algorithm-page"><button className="back-link" onClick={()=>setScreen('build')}><ArrowLeft size={15}/> Voltar ao grafo</button><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> ETAPA 02 · ANÁLISE</div><h1>Escolha um algoritmo<span className="title-period">.</span></h1><p className="lead">Selecione o método que deseja aplicar ao seu grafo.</p></div><div className="graph-summary"><Network size={16}/><span>{nodes.length} nós</span><i/>{edges.length} arestas</div></div>
        <div className="algorithm-layout"><div className="algorithm-list">{algorithms.map((algorithm)=>{const Icon=algorithm.icon;return <button key={algorithm.id} className={`algorithm-card ${selectedAlgorithm===algorithm.id?'selected':''}`} onClick={()=>setSelectedAlgorithm(algorithm.id)}><div className="algorithm-icon"><Icon size={20}/></div><div className="algorithm-copy"><div className="algorithm-meta"><span>{algorithm.kind}</span><span className="complexity">{algorithm.complexity}</span></div><h3>{algorithm.name}</h3><p>{algorithm.subtitle}</p></div><span className={`radio ${selectedAlgorithm===algorithm.id?'checked':''}`}>{selectedAlgorithm===algorithm.id&&<Check size={12}/>}</span></button>})}</div>
          <aside className="run-config"><span className="section-kicker">PARÂMETROS</span><h2>Preparar execução</h2><div className="chosen-algorithm"><div className="chosen-icon"><chosen.icon size={19}/></div><div><small>ALGORITMO SELECIONADO</small><b>{chosen.name}</b></div><span className="complexity">{chosen.complexity}</span></div>
            {(selectedAlgorithm==='dfs'||selectedAlgorithm==='bfs'||selectedAlgorithm==='dijkstra')&&<label className="select-label">Nó de origem<select value={origin} onChange={(event)=>setOrigin(event.target.value)}>{nodes.map((node)=> <option key={node.id} value={node.id}>{node.data.label}</option>)}</select></label>}
            {selectedAlgorithm==='kruskal'&&<div className="notice-box"><CircleHelp size={16}/><span>Kruskal opera em grafos não direcionados. A direção atual será ignorada nesta análise.</span></div>}
            <button className="primary-button" onClick={beginAlgorithm}>Ver tela de execução <ArrowRight size={16}/></button><div className="not-ready"><Clock3 size={14}/> Execução dos algoritmos será implementada depois.</div></aside></div>
        <div className="algorithm-note"><div className="note-icon"><Code2 size={16}/></div><span>Os algoritmos serão implementados em <b>JavaScript puro</b>, usando a matriz de adjacência do projeto. Essa etapa prepara a interface e os pontos de integração.</span></div>
      </section>}

      {screen === 'run' && <section className="page-content execution-page"><button className="back-link" onClick={()=>setScreen('algorithm')}><ArrowLeft size={15}/> Voltar aos algoritmos</button><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> ETAPA 03 · VISUALIZAÇÃO</div><h1>Acompanhe a execução<span className="title-period">.</span></h1><p className="lead">Veja como o algoritmo percorre e analisa a sua rede.</p></div><span className="coming-badge"><Clock3 size={14}/> EM DESENVOLVIMENTO</span></div>
        <div className="execution-layout"><section className="canvas-card execution-graph"><div className="canvas-top"><div><span className="section-kicker">GRAFO EM ANÁLISE</span><h2>{chosen.name}</h2></div><span className="running-pill"><span/> Aguardando implementação</span></div><div className="canvas-wrap execution-canvas"><ReactFlow nodes={nodes.map((node)=>({...node,data:{...node.data,onRename:renameNode}}))} edges={edges.map((edge)=>({...edge,type:'radial',label:edge.data?.weight==null?undefined:String(edge.data.weight),data:{...edge.data,editing:editingEdgeId===edge.id,onEdit:setEditingEdgeId,onWeightChange:setEdgeWeight,onEditEnd:()=>setEditingEdgeId(null)},style:{stroke:'#a2aabd',strokeWidth:1.7},labelStyle:{fill:'#526078',fontWeight:700,fontSize:12},markerEnd:edge.data?.directed?{type:MarkerType.ArrowClosed,color:'#8e9aae'}:undefined}))} nodeTypes={nodeTypes} edgeTypes={edgeTypes} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} fitView><Background color="#e6e9ef" gap={20} size={1}/><Controls showInteractive={false}/></ReactFlow><div className="execution-overlay"><div className="overlay-icon"><Code2 size={21}/></div><b>Seu algoritmo entra aqui</b><p>Quando a lógica estiver implementada, o nó ativo será destacado neste espaço.</p></div></div></section>
          <aside className="step-panel"><div className="step-panel-head"><div><span className="section-kicker">PASSO A PASSO</span><h2>Execução</h2></div><span className="step-count">{String(activeStep).padStart(2,'0')} <i>/</i> 00</span></div><div className="step-empty"><div className="step-empty-icon"><Activity size={22}/></div><b>Nenhuma etapa ainda</b><p>Os passos do algoritmo aparecerão aqui conforme ele percorre o grafo.</p></div><div className="step-preview"><div className="preview-label"><span className="pulse-dot"/> PRÓXIMA AÇÃO</div><b>{stepLabel}</b><p>O nó em análise será destacado no grafo.</p></div><div className="step-controls"><button disabled><ArrowLeft size={15}/> Anterior</button><button disabled>Próximo <ArrowRight size={15}/></button></div></aside></div>
        <section className="result-card"><div className="result-head"><div><span className="section-kicker">SAÍDA DO ALGORITMO</span><h2>Resultado</h2></div><span className="result-format"><Code2 size={14}/> TEXTO</span></div><div className="result-placeholder"><div className="result-placeholder-icon"><Code2 size={18}/></div><div><b>O resultado será exibido aqui</b><p>Distâncias, ordem de visita ou arestas selecionadas aparecerão neste quadro.</p></div></div></section>
        <div className="algorithm-note"><div className="note-icon"><CircleHelp size={16}/></div><span>Área pronta para conectar ao retorno <code>{'{ steps, result }'}</code> das funções em <code>src/graphAlgorithms.js</code>.</span></div>
      </section>}
    </main>
  </div>;
}

export default App;

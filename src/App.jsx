import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, { Background, BaseEdge, Controls, EdgeLabelRenderer, Handle, MiniMap, MarkerType, Position, addEdge, getBezierPath, useEdgesState, useNodesState, useReactFlow } from 'reactflow';
import { Activity, ArrowLeft, ArrowRight, ArrowUpRight, Check, Circle, CircleHelp, Clock3, Code2, GitBranch, GitFork, Layers3, Minus, Network, PanelLeftClose, PanelLeftOpen, Play, Plus, RotateCcw, Route, Share2, Trash2, Waypoints, X } from 'lucide-react';
import { buildAdjacencyMatrix } from './graphModel.js';

const algorithms = [
  { id: 'dfs', name: 'Busca em profundidade', short: 'DFS', subtitle: 'Explore cada caminho até o fim antes de voltar.', icon: GitBranch, complexity: 'O(V + E)', kind: 'Percurso' },
  { id: 'bfs', name: 'Busca em largura', short: 'BFS', subtitle: 'Visite os vizinhos por camadas a partir da origem.', icon: Layers3, complexity: 'O(V + E)', kind: 'Percurso' },
  { id: 'dijkstra', name: 'Caminho mínimo', short: 'Dijkstra', subtitle: 'Encontre as rotas de menor custo no grafo.', icon: Route, complexity: 'O(V²)', kind: 'Roteamento' },
  { id: 'kruskal', name: 'Árvore geradora mínima', short: 'Kruskal', subtitle: 'Conecte todos os nós com o menor custo total.', icon: Waypoints, complexity: 'O(E log E)', kind: 'Otimização' },
];

// Um handle central mantém a API de conexões do React Flow satisfeita.
// RadialEdge reposiciona o desenho para que a aresta toque a borda circular.
function CircleNode({ data }) {
  return <div className="graph-node-circle">
    <Handle id="center-target" type="target" position={Position.Top} className="invisible-handle" />
    <span>{data.label}</span>
    <Handle id="center-source" type="source" position={Position.Bottom} className="invisible-handle" />
  </div>;
}

function RadialEdge({ id, sourceX, sourceY, targetX, targetY, markerEnd, style, label, labelStyle }) {
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
    {label !== undefined && label !== '' && <EdgeLabelRenderer><div className="edge-weight-label nodrag nopan" style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, ...labelStyle }}>{label}</div></EdgeLabelRenderer>}
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
  { id: 'e1', source: 'n1', target: 'n2', sourceHandle: 'center-source', targetHandle: 'center-target', data: { weight: 4 }, label: '4', type: 'radial' },
  { id: 'e2', source: 'n2', target: 'n3', sourceHandle: 'center-source', targetHandle: 'center-target', data: { weight: 2 }, label: '2', type: 'radial' },
  { id: 'e3', source: 'n1', target: 'n4', sourceHandle: 'center-source', targetHandle: 'center-target', data: { weight: 3 }, label: '3', type: 'radial' },
  { id: 'e4', source: 'n4', target: 'n3', sourceHandle: 'center-source', targetHandle: 'center-target', data: { weight: 5 }, label: '5', type: 'radial' },
];

function App() {
  const [screen, setScreen] = useState('build');
  const [nodes, setNodes, onNodesChange] = useNodesState(starterNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(starterEdges);
  const [tool, setTool] = useState('select');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth < 800);
  const [directed, setDirected] = useState(false);
  const [weighted, setWeighted] = useState(true);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('dijkstra');
  const [origin, setOrigin] = useState('n1');
  const [pendingSource, setPendingSource] = useState(null);
  const [notice, setNotice] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const { screenToFlowPosition } = useReactFlow();

  const matrix = useMemo(() => buildAdjacencyMatrix(nodes, edges, directed), [nodes, edges, directed]);
  const chosen = algorithms.find((item) => item.id === selectedAlgorithm);
  const originName = nodes.find((node) => node.id === origin)?.data.label ?? 'Centro';

  const onConnect = useCallback((connection) => {
    const weight = weighted ? 1 : '';
    const edge = { ...connection, sourceHandle: 'center-source', targetHandle: 'center-target', id: `e${Date.now()}`, type: 'radial', data: { weight }, label: weighted ? '1' : undefined,
      markerEnd: directed ? { type: MarkerType.ArrowClosed, color: '#75819a' } : undefined };
    setEdges((current) => addEdge(edge, current));
  }, [directed, setEdges, weighted]);

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
      const weight = weighted ? 1 : '';
      setEdges((current) => [...current, { id: edgeId, source: pendingSource, target: node.id, sourceHandle: 'center-source', targetHandle: 'center-target', type: 'radial', data: { weight }, label: weighted ? '1' : undefined,
        markerEnd: directed ? { type: MarkerType.ArrowClosed, color: '#75819a' } : undefined }]);
      setNotice(`${directed ? 'Conexão direcionada' : 'Conexão'}: ${sourceName} → ${node.data.label}`);
      setPendingSource(null); setTool('select'); setTimeout(() => setNotice(''), 2400);
    }
  };

  const resetGraph = () => { setNodes([]); setEdges([]); setOrigin(''); setPendingSource(null); };

  const beginAlgorithm = () => { setActiveStep(0); setScreen('run'); };
  const stepLabel = selectedAlgorithm === 'dfs' ? 'Explorando vizinhos do nó atual' : selectedAlgorithm === 'bfs' ? 'Verificando os nós vizinhos' : selectedAlgorithm === 'kruskal' ? 'Analisando aresta de menor peso' : 'Atualizando custos dos caminhos';

  return <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Network size={20} strokeWidth={2.2} /></div><div className="brand-name">smartnet<span>.</span></div><button className="sidebar-collapse" onClick={()=>setSidebarCollapsed((value)=>!value)} title={sidebarCollapsed?'Expandir menu':'Recolher menu'} aria-label={sidebarCollapsed?'Expandir menu':'Recolher menu'}>{sidebarCollapsed?<PanelLeftOpen size={16}/>:<PanelLeftClose size={16}/>}</button></div>
      <nav className="steps-nav">
        <button className={`nav-step ${screen === 'build' ? 'active' : ''}`} onClick={() => setScreen('build')} title="Montar grafo"><span className="step-icon"><Circle size={17}/></span><span><b>Montar grafo</b></span></button>
        <button className={`nav-step ${screen === 'algorithm' ? 'active' : ''}`} onClick={() => setScreen('algorithm')} title="Algoritmo"><span className="step-icon"><Activity size={17}/></span><span><b>Algoritmo</b></span></button>
        <button className={`nav-step ${screen === 'run' ? 'active' : ''}`} onClick={() => setScreen('run')} title="Execução"><span className="step-icon"><Play size={16}/></span><span><b>Execução</b></span></button>
      </nav>
    </aside>

    <main className="main-area">
      {screen === 'build' && <section className="page-content">
        <div className="editor-layout">
          <section className="canvas-card">
            <div className="canvas-top"><div className="canvas-tools"><button className="square-button" onClick={resetGraph} title="Limpar grafo" aria-label="Limpar grafo"><RotateCcw size={15}/></button></div></div>
            <div className={`canvas-wrap ${tool==='node'?'adding-node':''} ${tool==='edge'?'adding-edge':''}`}><ReactFlow nodes={nodes} edges={edges.map((edge) => ({ ...edge, type: 'radial', label: weighted ? edge.data?.weight : undefined, markerEnd: directed ? { type: MarkerType.ArrowClosed, color: '#75819a' } : undefined,
              style: { stroke: '#8e9aae', strokeWidth: 1.7 }, labelStyle: { fill: '#526078', fontWeight: 700, fontSize: 12 } }))} nodeTypes={nodeTypes} edgeTypes={edgeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={onNodeClick} onPaneClick={onPaneClick} fitView fitViewOptions={{ padding: .28 }} nodesConnectable={false} elementsSelectable={tool === 'select'} connectionLineStyle={{ stroke: '#5267e8', strokeWidth: 2 }}>
              <Background color="#e6e9ef" gap={20} size={1}/><MiniMap nodeColor="#5267e8" maskColor="rgba(248,249,251,.7)"/><Controls showInteractive={false}/>
            </ReactFlow>
              <div className="canvas-badge"><span/> {nodes.length} nós <i/> {edges.length} arestas</div>
              {notice && <div className="toast"><Check size={14}/>{notice}<button onClick={() => setNotice('')}><X size={13}/></button></div>}
            </div>
            <div className="canvas-footer"><div className="legend-item"><span className="legend-node"/> Nó</div><div className="legend-item"><span className="legend-edge"/> Aresta</div><div className="legend-item"><span className="legend-weight">4</span> Peso</div></div>
          </section>

          <aside className="control-card"><div className="control-heading"><h2>Grafo</h2><span className="control-count">{String(nodes.length).padStart(2,'0')}</span></div>
            <div className="control-section"><div className="tool-grid"><button className={`tool-option tool-icon-only ${tool === 'node' ? 'selected' : ''}`} title="Adicionar nó no quadro" aria-label="Adicionar nó no quadro" onClick={() => {setTool(tool==='node'?'select':'node');setPendingSource(null)}}><Circle size={22} strokeWidth={1.8}/></button><button className={`tool-option tool-icon-only ${tool === 'edge' ? 'selected' : ''}`} title="Conectar dois nós" aria-label="Conectar dois nós" onClick={() => {setTool(tool==='edge'?'select':'edge');setPendingSource(null)}}><Minus size={25} strokeWidth={1.8}/></button></div>
              {tool === 'edge' && <div className="edge-instruction"><span>{pendingSource ? 'Clique no nó de destino' : 'Clique nos dois nós para conectar'}</span></div>}
            </div>
            <div className="control-section"><label className="field-label">TIPO DE CONEXÃO</label><div className="segmented"><button className={!directed?'chosen':''} onClick={()=>setDirected(false)}><Share2 size={15}/> Não direcionada</button><button className={directed?'chosen':''} onClick={()=>setDirected(true)}><ArrowUpRight size={15}/> Direcionada</button></div></div>
            <div className="control-section compact-section"><div><label className="field-label">PESOS NAS ARESTAS</label><p className="field-hint">Defina um custo para cada conexão</p></div><button className={`toggle ${weighted?'on':''}`} role="switch" aria-checked={weighted} onClick={()=>setWeighted((value)=>!value)}><span/></button></div>
            <div className="control-section node-list-section"><div className="list-title"><label className="field-label">NÓS</label></div><div className="node-list">{nodes.length === 0 && <div className="empty-nodes">Nenhum nó</div>}{nodes.map((node,index)=><div className="node-row" key={node.id}><span className="node-number">{String(index+1).padStart(2,'0')}</span><span className="node-color"/><span className="node-name">{node.data.label}</span><button className="delete-node" title={`Remover ${node.data.label}`} onClick={()=>{setNodes((current)=>current.filter((item)=>item.id!==node.id));setEdges((current)=>current.filter((edge)=>edge.source!==node.id&&edge.target!==node.id));if(origin===node.id)setOrigin('')}}><Trash2 size={14}/></button></div>)}</div>
              <div className="list-title edge-list-title"><label className="field-label">CONEXÕES {weighted && '· PESO'}</label></div><div className="node-list edge-list">{edges.length===0&&<div className="empty-nodes">Nenhuma conexão. Selecione “Conectar” e escolha dois nós.</div>}{edges.map((edge,index)=>{const from=nodes.find((node)=>node.id===edge.source)?.data.label??'?';const to=nodes.find((node)=>node.id===edge.target)?.data.label??'?';return <div className="edge-row" key={edge.id}><span className="edge-number">{String(index+1).padStart(2,'0')}</span><span className="edge-label">{from} <ArrowRight size={11}/> {to}</span>{weighted&&<input className="weight-input" type="number" aria-label={`Peso de ${from} para ${to}`} value={edge.data?.weight??1} onChange={(event)=>{const value=event.target.value;setEdges((current)=>current.map((item)=>item.id===edge.id?{...item,data:{...item.data,weight:value},label:value}:item))}}/>}<button className="delete-node" title="Remover conexão" onClick={()=>setEdges((current)=>current.filter((item)=>item.id!==edge.id))}><X size={13}/></button></div>})}</div></div>
            <button className="primary-button" onClick={()=>setScreen('algorithm')} disabled={nodes.length < 1}>Escolher algoritmo <ArrowRight size={16}/></button>
          </aside>
        </div>
        <section className="matrix-card"><div className="matrix-card-head"><div><span className="section-kicker">ESTRUTURA EM MEMÓRIA</span><h2>Matriz de adjacência</h2></div><span className="matrix-dimensions">{nodes.length} × {nodes.length}</span></div>{nodes.length===0?<div className="matrix-empty">Adicione nós para visualizar a matriz.</div>:<div className="matrix-scroll"><table className="adjacency-table"><thead><tr><th></th>{nodes.map((node)=><th key={node.id} title={node.data.label}>{node.data.label}</th>)}</tr></thead><tbody>{nodes.map((node,row)=><tr key={node.id}><th title={node.data.label}>{node.data.label}</th>{matrix[row].map((value,column)=><td className={value!==null?'has-edge':''} key={`${row}-${column}`}>{value===null?'·':value}</td>)}</tr>)}</tbody></table></div>}<div className="matrix-caption"><span className="matrix-key">·</span> Sem conexão <span className="matrix-key filled">1</span> Aresta sem peso representada por 1</div></section>
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
        <div className="execution-layout"><section className="canvas-card execution-graph"><div className="canvas-top"><div><span className="section-kicker">GRAFO EM ANÁLISE</span><h2>{chosen.name}</h2></div><span className="running-pill"><span/> Aguardando implementação</span></div><div className="canvas-wrap execution-canvas"><ReactFlow nodes={nodes} edges={edges.map((edge)=>({...edge,type:'radial',label:weighted?edge.data?.weight:undefined,style:{stroke:'#a2aabd',strokeWidth:1.7},labelStyle:{fill:'#526078',fontWeight:700,fontSize:12},markerEnd:directed?{type:MarkerType.ArrowClosed,color:'#8e9aae'}:undefined}))} nodeTypes={nodeTypes} edgeTypes={edgeTypes} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} fitView><Background color="#e6e9ef" gap={20} size={1}/><MiniMap nodeColor="#5267e8" maskColor="rgba(248,249,251,.7)"/><Controls showInteractive={false}/></ReactFlow><div className="execution-overlay"><div className="overlay-icon"><Code2 size={21}/></div><b>Seu algoritmo entra aqui</b><p>Quando a lógica estiver implementada, o nó ativo será destacado neste espaço.</p></div></div></section>
          <aside className="step-panel"><div className="step-panel-head"><div><span className="section-kicker">PASSO A PASSO</span><h2>Execução</h2></div><span className="step-count">{String(activeStep).padStart(2,'0')} <i>/</i> 00</span></div><div className="step-empty"><div className="step-empty-icon"><Activity size={22}/></div><b>Nenhuma etapa ainda</b><p>Os passos do algoritmo aparecerão aqui conforme ele percorre o grafo.</p></div><div className="step-preview"><div className="preview-label"><span className="pulse-dot"/> PRÓXIMA AÇÃO</div><b>{stepLabel}</b><p>O nó em análise será destacado no grafo.</p></div><div className="step-controls"><button disabled><ArrowLeft size={15}/> Anterior</button><button disabled>Próximo <ArrowRight size={15}/></button></div></aside></div>
        <section className="result-card"><div className="result-head"><div><span className="section-kicker">SAÍDA DO ALGORITMO</span><h2>Resultado</h2></div><span className="result-format"><Code2 size={14}/> TEXTO</span></div><div className="result-placeholder"><div className="result-placeholder-icon"><Code2 size={18}/></div><div><b>O resultado será exibido aqui</b><p>Distâncias, ordem de visita ou arestas selecionadas aparecerão neste quadro.</p></div></div></section>
        <div className="algorithm-note"><div className="note-icon"><CircleHelp size={16}/></div><span>Área pronta para conectar ao retorno <code>{'{ steps, result }'}</code> das funções em <code>src/graphAlgorithms.js</code>.</span></div>
      </section>}
    </main>
  </div>;
}

export default App;

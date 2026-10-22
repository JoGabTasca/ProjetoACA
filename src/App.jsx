import { useCallback, useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap, MarkerType, addEdge, useEdgesState, useNodesState } from 'reactflow';
import { Activity, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, CircleHelp, Clock3, Code2, GitBranch, GitFork, Layers3, MousePointer2, Network, Play, Plus, RotateCcw, Route, Share2, Trash2, Waypoints, X } from 'lucide-react';
import { buildAdjacencyMatrix } from './graphModel.js';

const algorithms = [
  { id: 'dfs', name: 'Busca em profundidade', short: 'DFS', subtitle: 'Explore cada caminho até o fim antes de voltar.', icon: GitBranch, complexity: 'O(V + E)', kind: 'Percurso' },
  { id: 'bfs', name: 'Busca em largura', short: 'BFS', subtitle: 'Visite os vizinhos por camadas a partir da origem.', icon: Layers3, complexity: 'O(V + E)', kind: 'Percurso' },
  { id: 'dijkstra', name: 'Caminho mínimo', short: 'Dijkstra', subtitle: 'Encontre as rotas de menor custo no grafo.', icon: Route, complexity: 'O(V²)', kind: 'Roteamento' },
  { id: 'kruskal', name: 'Árvore geradora mínima', short: 'Kruskal', subtitle: 'Conecte todos os nós com o menor custo total.', icon: Waypoints, complexity: 'O(E log E)', kind: 'Otimização' },
];

const starterNodes = [
  { id: 'n1', position: { x: 115, y: 116 }, data: { label: 'Centro' }, type: 'default' },
  { id: 'n2', position: { x: 335, y: 54 }, data: { label: 'Jardins' }, type: 'default' },
  { id: 'n3', position: { x: 545, y: 129 }, data: { label: 'Estação' }, type: 'default' },
  { id: 'n4', position: { x: 320, y: 247 }, data: { label: 'Vila Nova' }, type: 'default' },
];
const starterEdges = [
  { id: 'e1', source: 'n1', target: 'n2', data: { weight: 4 }, label: '4', type: 'smoothstep' },
  { id: 'e2', source: 'n2', target: 'n3', data: { weight: 2 }, label: '2', type: 'smoothstep' },
  { id: 'e3', source: 'n1', target: 'n4', data: { weight: 3 }, label: '3', type: 'smoothstep' },
  { id: 'e4', source: 'n4', target: 'n3', data: { weight: 5 }, label: '5', type: 'smoothstep' },
];

function App() {
  const [screen, setScreen] = useState('build');
  const [nodes, setNodes, onNodesChange] = useNodesState(starterNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(starterEdges);
  const [tool, setTool] = useState('select');
  const [directed, setDirected] = useState(false);
  const [weighted, setWeighted] = useState(true);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('dijkstra');
  const [origin, setOrigin] = useState('n1');
  const [nodeName, setNodeName] = useState('');
  const [pendingSource, setPendingSource] = useState(null);
  const [notice, setNotice] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  const matrix = useMemo(() => buildAdjacencyMatrix(nodes, edges, directed), [nodes, edges, directed]);
  const chosen = algorithms.find((item) => item.id === selectedAlgorithm);
  const originName = nodes.find((node) => node.id === origin)?.data.label ?? 'Centro';

  const onConnect = useCallback((connection) => {
    const weight = weighted ? 1 : '';
    const edge = { ...connection, id: `e${Date.now()}`, type: 'smoothstep', data: { weight }, label: weighted ? '1' : undefined,
      markerEnd: directed ? { type: MarkerType.ArrowClosed, color: '#75819a' } : undefined };
    setEdges((current) => addEdge(edge, current));
  }, [directed, setEdges, weighted]);

  const addNode = () => {
    const label = nodeName.trim() || `Ponto ${nodes.length + 1}`;
    const id = `n${Date.now()}`;
    const position = { x: 120 + (nodes.length % 3) * 190, y: 80 + Math.floor(nodes.length / 3) * 135 };
    setNodes((current) => [...current, { id, position, data: { label } }]);
    setOrigin((current) => current || id);
    setNodeName(''); setTool('select'); setNotice(`Nó “${label}” adicionado`);
    setTimeout(() => setNotice(''), 2400);
  };

  const onNodeClick = (_, node) => {
    if (tool === 'edge') {
      if (!pendingSource) { setPendingSource(node.id); setNotice(`Agora selecione o destino de ${node.data.label}`); return; }
      if (pendingSource === node.id) { setNotice('Escolha um nó diferente para criar a aresta.'); setPendingSource(null); return; }
      const sourceName = nodes.find((item) => item.id === pendingSource)?.data.label;
      const edgeId = `e${Date.now()}`;
      const weight = weighted ? 1 : '';
      setEdges((current) => [...current, { id: edgeId, source: pendingSource, target: node.id, type: 'smoothstep', data: { weight }, label: weighted ? '1' : undefined,
        markerEnd: directed ? { type: MarkerType.ArrowClosed, color: '#75819a' } : undefined }]);
      setNotice(`${directed ? 'Conexão direcionada' : 'Conexão'}: ${sourceName} → ${node.data.label}`);
      setPendingSource(null); setTool('select'); setTimeout(() => setNotice(''), 2400);
    } else if (tool === 'node') {
      setNotice('Para posicionar um nó, use “Adicionar nó” na barra lateral.');
      setTool('select');
    }
  };

  const resetGraph = () => { setNodes([]); setEdges([]); setOrigin(''); setPendingSource(null); };

  const beginAlgorithm = () => { setActiveStep(0); setScreen('run'); };
  const stepLabel = selectedAlgorithm === 'dfs' ? 'Explorando vizinhos do nó atual' : selectedAlgorithm === 'bfs' ? 'Verificando os nós vizinhos' : selectedAlgorithm === 'kruskal' ? 'Analisando aresta de menor peso' : 'Atualizando custos dos caminhos';

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Network size={20} strokeWidth={2.2} /></div><div><div className="brand-name">smartnet<span>.</span></div><div className="brand-caption">GRAPH ANALYZER</div></div></div>
      <div className="workspace-tag"><span className="live-dot" /> PROJETO AC · 2026.2</div>
      <div className="side-label">WORKSPACE</div>
      <nav className="steps-nav">
        <button className={`nav-step ${screen === 'build' ? 'active' : ''}`} onClick={() => setScreen('build')}><span className="step-icon"><MousePointer2 size={17}/></span><span><b>Montar grafo</b><small>Desenhe sua rede</small></span><span className="nav-index">01</span></button>
        <button className={`nav-step ${screen === 'algorithm' ? 'active' : ''}`} onClick={() => setScreen('algorithm')}><span className="step-icon"><Activity size={17}/></span><span><b>Algoritmo</b><small>Escolha uma análise</small></span><span className="nav-index">02</span></button>
        <button className={`nav-step ${screen === 'run' ? 'active' : ''}`} onClick={() => setScreen('run')}><span className="step-icon"><Play size={16}/></span><span><b>Execução</b><small>Acompanhe os passos</small></span><span className="nav-index">03</span></button>
      </nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={17}/></div><div><b>Primeira vez aqui?</b><p>Monte um grafo adicionando nós e conectando-os.</p></div><ChevronDown size={15}/></div><div className="user-profile"><div className="avatar">AC</div><div><b>Análise de Complexidade</b><small>Projeto acadêmico</small></div><span className="more-dots">···</span></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="breadcrumbs"><span>Projetos</span><span className="crumb-slash">/</span><b>SmartNet Analyzer</b><span className="status-pill"><span/> Rascunho</span></div><div className="top-actions"><button className="icon-button" aria-label="Ajuda"><CircleHelp size={17}/></button><button className="share-button"><Share2 size={15}/> Compartilhar</button><div className="top-avatar">JG</div></div></header>

      {screen === 'build' && <section className="page-content">
        <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> SMARTNET ANALYZER</div><h1>Vamos montar sua rede<span className="title-period">.</span></h1><p className="lead">Adicione pontos de interesse e conecte-os para criar o seu grafo.</p></div><div className="heading-meta"><span className="save-dot"/> Salvo neste dispositivo</div></div>
        <div className="editor-layout">
          <section className="canvas-card">
            <div className="canvas-top"><div><span className="section-kicker">ÁREA DE TRABALHO</span><h2>Editor de grafo</h2></div><div className="canvas-tools"><span className="tool-hint"><MousePointer2 size={14}/> Arraste os nós para organizar</span><button className="square-button" onClick={resetGraph} title="Limpar grafo"><RotateCcw size={15}/></button></div></div>
            <div className="canvas-wrap"><ReactFlow nodes={nodes} edges={edges.map((edge) => ({ ...edge, label: weighted ? edge.data?.weight : undefined, markerEnd: directed ? { type: MarkerType.ArrowClosed, color: '#75819a' } : undefined,
              style: { stroke: '#8e9aae', strokeWidth: 1.7 }, labelStyle: { fill: '#526078', fontWeight: 700, fontSize: 12 }, labelBgStyle: { fill: '#fff', fillOpacity: 0.96 }, labelBgPadding: [5, 4], labelBgBorderRadius: 5 }))} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={onNodeClick} fitView fitViewOptions={{ padding: .28 }} nodesConnectable={tool === 'edge'} elementsSelectable={tool === 'select'} connectionLineStyle={{ stroke: '#5267e8', strokeWidth: 2 }}>
              <Background color="#e6e9ef" gap={20} size={1}/><MiniMap nodeColor="#5267e8" maskColor="rgba(248,249,251,.7)"/><Controls showInteractive={false}/>
            </ReactFlow>
              <div className="canvas-badge"><span/> {nodes.length} nós <i/> {edges.length} arestas</div>
              {notice && <div className="toast"><Check size={14}/>{notice}<button onClick={() => setNotice('')}><X size={13}/></button></div>}
            </div>
            <div className="canvas-footer"><div className="legend-item"><span className="legend-node"/> Nó</div><div className="legend-item"><span className="legend-edge"/> Aresta</div><div className="legend-item"><span className="legend-weight">4</span> Peso</div><span className="canvas-foot-note"><MousePointer2 size={13}/> Selecione uma ferramenta para começar</span></div>
          </section>

          <aside className="control-card"><div className="control-heading"><div><span className="section-kicker">CONFIGURAÇÃO</span><h2>Construa seu grafo</h2></div><span className="control-count">{String(nodes.length).padStart(2,'0')}</span></div>
            <div className="control-section"><label className="field-label">FERRAMENTA</label><div className="tool-grid"><button className={`tool-option ${tool === 'select' ? 'selected' : ''}`} onClick={() => {setTool('select');setPendingSource(null)}}><MousePointer2 size={17}/><span>Selecionar</span><kbd>V</kbd></button><button className={`tool-option ${tool === 'node' ? 'selected' : ''}`} onClick={() => setTool('node')}><Plus size={18}/><span>Novo nó</span><kbd>N</kbd></button><button className={`tool-option ${tool === 'edge' ? 'selected' : ''}`} onClick={() => {setTool('edge');setPendingSource(null)}}><GitFork size={17}/><span>Conectar</span><kbd>E</kbd></button></div>
              {tool === 'node' && <div className="add-node-form"><input value={nodeName} onChange={(event)=>setNodeName(event.target.value)} onKeyDown={(event)=>event.key==='Enter'&&addNode()} placeholder="Nome do ponto"/><button onClick={addNode}><Plus size={15}/> Adicionar</button></div>}
              {tool === 'edge' && <div className="edge-instruction"><GitFork size={15}/><span>{pendingSource ? 'Selecione o nó de destino no quadro' : 'Selecione os dois nós no quadro'}</span></div>}
            </div>
            <div className="control-section"><label className="field-label">TIPO DE CONEXÃO</label><div className="segmented"><button className={!directed?'chosen':''} onClick={()=>setDirected(false)}><Share2 size={15}/> Não direcionada</button><button className={directed?'chosen':''} onClick={()=>setDirected(true)}><ArrowUpRight size={15}/> Direcionada</button></div></div>
            <div className="control-section compact-section"><div><label className="field-label">PESOS NAS ARESTAS</label><p className="field-hint">Defina um custo para cada conexão</p></div><button className={`toggle ${weighted?'on':''}`} role="switch" aria-checked={weighted} onClick={()=>setWeighted((value)=>!value)}><span/></button></div>
            <div className="control-section node-list-section"><div className="list-title"><label className="field-label">PONTOS DA REDE</label><button className="text-action" onClick={()=>{setTool('node');document.querySelector('.add-node-form input')?.focus()}}><Plus size={14}/> Adicionar</button></div><div className="node-list">{nodes.length === 0 && <div className="empty-nodes">Nenhum nó ainda. Adicione um ponto para começar.</div>}{nodes.map((node,index)=><div className="node-row" key={node.id}><span className="node-number">{String(index+1).padStart(2,'0')}</span><span className="node-color"/><span className="node-name">{node.data.label}</span><button className="delete-node" title={`Remover ${node.data.label}`} onClick={()=>{setNodes((current)=>current.filter((item)=>item.id!==node.id));setEdges((current)=>current.filter((edge)=>edge.source!==node.id&&edge.target!==node.id));if(origin===node.id)setOrigin('')}}><Trash2 size={14}/></button></div>)}</div>
              <div className="list-title edge-list-title"><label className="field-label">CONEXÕES {weighted && '· PESO'}</label></div><div className="node-list edge-list">{edges.length===0&&<div className="empty-nodes">Nenhuma conexão. Selecione “Conectar” e escolha dois nós.</div>}{edges.map((edge,index)=>{const from=nodes.find((node)=>node.id===edge.source)?.data.label??'?';const to=nodes.find((node)=>node.id===edge.target)?.data.label??'?';return <div className="edge-row" key={edge.id}><span className="edge-number">{String(index+1).padStart(2,'0')}</span><span className="edge-label">{from} <ArrowRight size={11}/> {to}</span>{weighted&&<input className="weight-input" type="number" aria-label={`Peso de ${from} para ${to}`} value={edge.data?.weight??1} onChange={(event)=>{const value=event.target.value;setEdges((current)=>current.map((item)=>item.id===edge.id?{...item,data:{...item.data,weight:value},label:value}:item))}}/>}<button className="delete-node" title="Remover conexão" onClick={()=>setEdges((current)=>current.filter((item)=>item.id!==edge.id))}><X size={13}/></button></div>})}</div></div>
            <button className="primary-button" onClick={()=>setScreen('algorithm')} disabled={nodes.length < 1}>Escolher algoritmo <ArrowRight size={16}/></button>
            <div className="matrix-mini"><div><Code2 size={14}/> <b>Matriz de adjacência</b></div><span>{nodes.length} × {nodes.length} · implementação do projeto</span></div>
          </aside>
        </div>
        <section className="matrix-card"><div className="matrix-card-head"><div><span className="section-kicker">ESTRUTURA EM MEMÓRIA</span><h2>Matriz de adjacência</h2></div><span className="matrix-dimensions">{nodes.length} × {nodes.length}</span></div>{nodes.length===0?<div className="matrix-empty">Adicione nós para visualizar a matriz.</div>:<div className="matrix-scroll"><table className="adjacency-table"><thead><tr><th></th>{nodes.map((node)=><th key={node.id} title={node.data.label}>{node.data.label}</th>)}</tr></thead><tbody>{nodes.map((node,row)=><tr key={node.id}><th title={node.data.label}>{node.data.label}</th>{matrix[row].map((value,column)=><td className={value!==null?'has-edge':''} key={`${row}-${column}`}>{value===null?'·':value}</td>)}</tr>)}</tbody></table></div>}<div className="matrix-caption"><span className="matrix-key">·</span> Sem conexão <span className="matrix-key filled">1</span> Aresta sem peso representada por 1</div></section>
        <div className="bottom-tip"><div className="tip-icon"><CircleHelp size={16}/></div><span><b>Dica:</b> Clique em “Conectar” e selecione dois nós para adicionar uma aresta. {weighted && 'Edite os pesos na lista de conexões da barra lateral.'}</span><button aria-label="Fechar dica"><X size={14}/></button></div>
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
        <div className="execution-layout"><section className="canvas-card execution-graph"><div className="canvas-top"><div><span className="section-kicker">GRAFO EM ANÁLISE</span><h2>{chosen.name}</h2></div><span className="running-pill"><span/> Aguardando implementação</span></div><div className="canvas-wrap execution-canvas"><ReactFlow nodes={nodes} edges={edges.map((edge)=>({...edge,label:weighted?edge.data?.weight:undefined,style:{stroke:'#a2aabd',strokeWidth:1.7},labelStyle:{fill:'#526078',fontWeight:700,fontSize:12},labelBgStyle:{fill:'#fff',fillOpacity:.96},labelBgPadding:[5,4],labelBgBorderRadius:5,markerEnd:directed?{type:MarkerType.ArrowClosed,color:'#8e9aae'}:undefined}))} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} fitView><Background color="#e6e9ef" gap={20} size={1}/><MiniMap nodeColor="#5267e8" maskColor="rgba(248,249,251,.7)"/><Controls showInteractive={false}/></ReactFlow><div className="execution-overlay"><div className="overlay-icon"><Code2 size={21}/></div><b>Seu algoritmo entra aqui</b><p>Quando a lógica estiver implementada, o nó ativo será destacado neste espaço.</p></div></div></section>
          <aside className="step-panel"><div className="step-panel-head"><div><span className="section-kicker">PASSO A PASSO</span><h2>Execução</h2></div><span className="step-count">{String(activeStep).padStart(2,'0')} <i>/</i> 00</span></div><div className="step-empty"><div className="step-empty-icon"><Activity size={22}/></div><b>Nenhuma etapa ainda</b><p>Os passos do algoritmo aparecerão aqui conforme ele percorre o grafo.</p></div><div className="step-preview"><div className="preview-label"><span className="pulse-dot"/> PRÓXIMA AÇÃO</div><b>{stepLabel}</b><p>O nó em análise será destacado no grafo.</p></div><div className="step-controls"><button disabled><ArrowLeft size={15}/> Anterior</button><button disabled>Próximo <ArrowRight size={15}/></button></div></aside></div>
        <section className="result-card"><div className="result-head"><div><span className="section-kicker">SAÍDA DO ALGORITMO</span><h2>Resultado</h2></div><span className="result-format"><Code2 size={14}/> TEXTO</span></div><div className="result-placeholder"><div className="result-placeholder-icon"><Code2 size={18}/></div><div><b>O resultado será exibido aqui</b><p>Distâncias, ordem de visita ou arestas selecionadas aparecerão neste quadro.</p></div></div></section>
        <div className="algorithm-note"><div className="note-icon"><CircleHelp size={16}/></div><span>Área pronta para conectar ao retorno <code>{'{ steps, result }'}</code> das funções em <code>src/graphAlgorithms.js</code>.</span></div>
      </section>}
      <footer className="app-footer"><span>SMARTNET ANALYZER <i>·</i> PROJETO AC 2026.2</span><span>Feito para entender redes, um nó por vez <GitBranch size={13}/></span></footer>
    </main>
  </div>;
}

export default App;

import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { NetworkData } from '../types';
import { useMediaQuery } from '../utils';
import MobileHeader from '../components/MobileHeader';

const GROUP_COLORS: Record<string, string> = {
  crime_type: '#2eD573',
  district: '#1e90ff',
  syndicate: '#ff4757',
};

export default function NetworkGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    api.network().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current || data.nodes.length === 0) return;

    const svg = svgRef.current;
    const w = svg.clientWidth || window.innerWidth;
    const h = svg.clientHeight || window.innerHeight;

    // Distribute nodes randomly initially
    const nodeMap = new Map(data.nodes.map(n => [n.id, { ...n, x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0 }]));
    const links = data.edges.filter(e => nodeMap.has(e.source) && nodeMap.has(e.target));

    // Adjusted physics parameters for better spacing
    const CENTER = { x: w / 2, y: h / 2 };
    const REPULSION = isMobile ? 900 : 1500;
    const ATTRACTION = 0.003;

    const getColor = (group: string) => GROUP_COLORS[group] || '#8395a7';
    const getRadius = (size: number) => Math.max(8, Math.min(24, Math.sqrt(size) * 2.5));

    const clear = () => { while (svg.firstChild) svg.removeChild(svg.firstChild); };
    clear();

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'glow');
    const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    feGaussianBlur.setAttribute('stdDeviation', '3');
    feGaussianBlur.setAttribute('result', 'coloredBlur');
    filter.appendChild(feGaussianBlur);
    const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    feMergeNode1.setAttribute('in', 'coloredBlur');
    const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    feMergeNode2.setAttribute('in', 'SourceGraphic');
    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);
    filter.appendChild(feMerge);
    defs.appendChild(filter);
    svg.appendChild(defs);

    const linkGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(linkGroup);
    svg.appendChild(nodeGroup);
    svg.appendChild(labelGroup);

    const linkElements: SVGLineElement[] = [];
    const nodeElements: SVGGElement[] = [];
    const labelElements: SVGTextElement[] = [];

    links.forEach(link => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('stroke', 'rgba(128,86,0,0.15)');
      line.setAttribute('stroke-width', String(Math.max(1, Math.min(4, link.weight * 0.5))));
      linkGroup.appendChild(line);
      linkElements.push(line);
    });

    // Drag state
    let draggedNode: any = null;

    nodeMap.forEach(node => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.style.cursor = 'grab';

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const r = getRadius(node.size);
      circle.setAttribute('r', String(r));
      circle.setAttribute('fill', getColor(node.group));
      circle.setAttribute('opacity', '0.9');
      circle.setAttribute('filter', 'url(#glow)');
      circle.setAttribute('stroke', '#ffffff');
      circle.setAttribute('stroke-width', '2');

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${node.id} (${node.group}) - ${node.size} connections`;

      g.appendChild(circle);
      g.appendChild(title);
      nodeGroup.appendChild(g);
      nodeElements.push(g);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.textContent = node.id.length > 15 ? node.id.substring(0, 14) + '…' : node.id;
      text.setAttribute('fill', '#191c1d');
      text.setAttribute('font-family', 'var(--font-family-body)');
      text.setAttribute('font-size', '10');
      text.setAttribute('font-weight', '600');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dy', String(r + 14));
      text.style.pointerEvents = 'none';
      text.style.textShadow = '0 1px 3px rgba(255,255,255,0.8)';
      labelGroup.appendChild(text);
      labelElements.push(text);

      (node as any)._el = g;
      (node as any)._lineEls = linkElements.filter((_, i) => {
        const l = links[i];
        return l.source === node.id || l.target === node.id;
      });
      (node as any)._textEl = text;
      (node as any)._circle = circle;

      // Mouse/Touch events for dragging
      const startDrag = (e: any) => {
        draggedNode = node;
        g.style.cursor = 'grabbing';
      };
      g.addEventListener('mousedown', startDrag);
      g.addEventListener('touchstart', startDrag, { passive: true });
    });

    const onMove = (e: any) => {
      if (!draggedNode) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = svg.getBoundingClientRect();
      draggedNode.x = clientX - rect.left;
      draggedNode.y = clientY - rect.top;
      draggedNode.vx = 0;
      draggedNode.vy = 0;
    };

    const endDrag = () => {
      if (draggedNode) {
        draggedNode._el.style.cursor = 'grab';
        draggedNode = null;
      }
    };

    svg.addEventListener('mousemove', onMove);
    svg.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);

    // Simulation loop
    let running = true;
    let nodesArr: any[] = [];
    const tick = () => {
      if (!running) return;

      nodesArr = Array.from(nodeMap.values());

      for (let i = 0; i < nodesArr.length; i++) {
        for (let j = i + 1; j < nodesArr.length; j++) {
          const a = nodesArr[i];
          const b = nodesArr[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = REPULSION / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          if (draggedNode !== a) { a.vx -= fx; a.vy -= fy; }
          if (draggedNode !== b) { b.vx += fx; b.vy += fy; }
        }
      }

      links.forEach(link => {
        const a = nodeMap.get(link.source)!;
        const b = nodeMap.get(link.target)!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = dist * ATTRACTION;
        if (draggedNode !== a) { a.vx += (dx / dist) * force; a.vy += (dy / dist) * force; }
        if (draggedNode !== b) { b.vx -= (dx / dist) * force; b.vy -= (dy / dist) * force; }
      });

      nodesArr.forEach(n => {
        if (draggedNode !== n) {
          n.vx += (CENTER.x - n.x) * 0.0005;
          n.vy += (CENTER.y - n.y) * 0.0005;
          n.vx *= 0.85;
          n.vy *= 0.85;
          n.x += n.vx;
          n.y += n.vy;
          n.x = Math.max(20, Math.min(w - 20, n.x));
          n.y = Math.max(20, Math.min(h - 20, n.y));
        }
      });

      linkElements.forEach((line, i) => {
        const l = links[i];
        const a = nodeMap.get(l.source)!;
        const b = nodeMap.get(l.target)!;
        line.setAttribute('x1', String(a.x));
        line.setAttribute('y1', String(a.y));
        line.setAttribute('x2', String(b.x));
        line.setAttribute('y2', String(b.y));
      });

      nodeElements.forEach((g, i) => {
        const node = nodesArr[i];
        g.setAttribute('transform', `translate(${node.x},${node.y})`);
      });

      labelElements.forEach((text, i) => {
        const node = nodesArr[i];
        text.setAttribute('x', String(node.x));
        text.setAttribute('y', String(node.y));
      });

      requestAnimationFrame(tick);
    };

    tick();

    // Hover interactions
    nodeElements.forEach((g, i) => {
      g.addEventListener('mouseenter', () => {
        if (draggedNode) return;
        const node = nodesArr[i];
        const r = getRadius(node.size);
        (node as any)._circle?.setAttribute('r', String(r * 1.3));
        
        nodeMap.forEach((nVal, _) => {
          const nAny = nVal as any;
          const connected = links.some(l => (l.source === node.id && l.target === nVal.id) || (l.source === nVal.id && l.target === node.id));
          if (nAny._circle) {
            (nAny._circle as SVGCircleElement).setAttribute('opacity', connected || nVal.id === node.id ? '1' : '0.15');
          }
          if (nAny._textEl) {
            (nAny._textEl as SVGTextElement).setAttribute('opacity', connected || nVal.id === node.id ? '1' : '0.15');
          }
        });
        linkElements.forEach((line, li) => {
          const l = links[li];
          line.setAttribute('stroke', l.source === node.id || l.target === node.id ? 'rgba(202, 138, 4, 0.8)' : 'rgba(0,0,0,0.02)');
        });
      });

      g.addEventListener('mouseleave', () => {
        if (draggedNode) return;
        const node = nodesArr[i];
        const r = getRadius(node.size);
        (node as any)._circle?.setAttribute('r', String(r));
        
        nodeMap.forEach(nVal => {
          const nAny = nVal as any;
          if (nAny._circle) (nAny._circle as SVGCircleElement).setAttribute('opacity', '0.9');
          if (nAny._textEl) (nAny._textEl as SVGTextElement).setAttribute('opacity', '1');
        });
        linkElements.forEach(line => line.setAttribute('stroke', 'rgba(128,86,0,0.15)'));
      });
    });

    return () => {
      running = false;
      svg.removeEventListener('mousemove', onMove);
      svg.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('touchend', endDrag);
    };
  }, [data, isMobile]);

  if (loading) return <div style={styles.loadingOverlay}>Initializing neural link...</div>;
  if (!data || data.nodes.length === 0) return (
    <div style={styles.emptyOverlay}>
      <div style={styles.emptyCard}>
        <h3 style={styles.panelTitle}>No Network Data</h3>
        <p style={styles.insightText}>Graph edges unavailable. Ensure intelligence feed is running.</p>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: 'transparent' }}>
      
      {/* Physics SVG Canvas */}
      <svg ref={svgRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }} />

      {/* Top Header Layer */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          {isMobile ? <MobileHeader /> : (
            <div style={{ padding: '40px 40px 0' }}>
              <h1 style={styles.title}>Criminological Network</h1>
            </div>
          )}
        </div>
      </div>
        
      {/* Bottom Floating Educational Panel */}
      <div style={{ position: 'absolute', bottom: isMobile ? 80 : 40, left: 0, right: 0, zIndex: 10, pointerEvents: 'none', display: 'flex', justifyContent: isMobile ? 'center' : 'flex-start' }}>
        <div style={{ ...styles.floatingPanel, margin: isMobile ? '0 12px' : '0 40px', width: isMobile ? 'calc(100% - 24px)' : 'auto', maxWidth: 450, padding: isMobile ? '16px' : '20px' }}>
          <div style={styles.feedLabel}>HOW IT WORKS</div>
          <h2 style={styles.panelTitle}>Network Analysis</h2>
          <p style={styles.insightText}>
            Maps hidden relationships between <strong>Crime Types</strong>, <strong>Districts</strong>, and <strong>Syndicates</strong>. 
            Drag nodes or tap to highlight direct criminal connections.
          </p>
          
          <div style={styles.legend}>
            <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: '#2eD573' }} /> Crime Type</span>
            <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: '#1e90ff' }} /> District</span>
            <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: '#ff4757' }} /> Syndicate</span>
          </div>
          <div style={styles.statsRow}>
            <span>{data.nodes.length} Nodes</span>
            <span>•</span>
            <span>{data.edges.length} Links</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: { fontFamily: 'var(--font-family-display)', fontSize: 24, fontWeight: 700, color: '#191c1d', margin: 0, textShadow: '0 2px 10px rgba(255,255,255,0.8)' },
  floatingPanel: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    padding: '20px',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    pointerEvents: 'auto',
    border: '1px solid rgba(255,255,255,0.5)',
  },
  feedLabel: { fontFamily: 'var(--font-family-mono)', fontSize: 10, letterSpacing: 1.5, color: '#837562', fontWeight: 600, marginBottom: 4 },
  panelTitle: { fontFamily: 'var(--font-family-display)', fontSize: 18, fontWeight: 700, color: '#191c1d', margin: '0 0 8px 0' },
  insightText: { fontFamily: 'var(--font-family-body)', fontSize: 13, color: '#514535', margin: '0 0 12px 0', lineHeight: 1.5 },
  insightTextMicro: { fontFamily: 'var(--font-family-body)', fontSize: 12, color: '#805600', marginBottom: 16, fontStyle: 'italic', background: 'rgba(128,86,0,0.05)', padding: '8px 12px', borderRadius: 8 },
  legend: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const, background: 'rgba(0,0,0,0.03)', padding: '8px 12px', borderRadius: 8, marginBottom: 12 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-family-mono)', fontSize: 11, color: '#191c1d', fontWeight: 600 },
  legendDot: { width: 8, height: 8, borderRadius: '50%' },
  statsRow: { display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-family-mono)', fontSize: 10, color: '#837562', fontWeight: 600, justifyContent: 'center' },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#191c1d', fontSize: 14, fontFamily: 'var(--font-family-mono)', fontWeight: 600, letterSpacing: 1,
    background: 'rgba(255, 255, 255, 0.9)', zIndex: 1000, backdropFilter: 'blur(8px)'
  },
  emptyOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, pointerEvents: 'none'
  },
  emptyCard: {
    background: 'white', padding: 24, borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    textAlign: 'center', maxWidth: 300, pointerEvents: 'auto'
  }
};

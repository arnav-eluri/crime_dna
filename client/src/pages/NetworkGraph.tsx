import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { NetworkData } from '../types';

const GROUP_COLORS: Record<string, string> = {
  crime_type: '#2eD573',
  district: '#1e90ff',
  syndicate: '#ff4757',
};

export default function NetworkGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.network().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current || data.nodes.length === 0) return;

    const svg = svgRef.current;
    const w = svg.clientWidth || 800;
    const h = svg.clientHeight || 500;

    const nodeMap = new Map(data.nodes.map(n => [n.id, { ...n, x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0 }]));

    const links = data.edges.filter(e => nodeMap.has(e.source) && nodeMap.has(e.target));

    // Simple force simulation
    const CENTER = { x: w / 2, y: h / 2 };
    const REPULSION = 800;
    const ATTRACTION = 0.005;

    // Pre-compute colors and sizes
    const getColor = (group: string) => GROUP_COLORS[group] || '#8395a7';
    const getRadius = (size: number) => Math.max(6, Math.min(20, Math.sqrt(size) * 2));

    // Draw on SVG
    const clear = () => { while (svg.firstChild) svg.removeChild(svg.firstChild); };
    clear();

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'glow');
    const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    feGaussianBlur.setAttribute('stdDeviation', '2');
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
      line.setAttribute('stroke', 'rgba(255,255,255,0.1)');
      line.setAttribute('stroke-width', String(Math.max(1, Math.min(6, link.weight))));
      linkGroup.appendChild(line);
      linkElements.push(line);
    });

    nodeMap.forEach(node => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.style.cursor = 'pointer';

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const r = getRadius(node.size);
      circle.setAttribute('r', String(r));
      circle.setAttribute('fill', getColor(node.group));
      circle.setAttribute('opacity', '0.9');
      circle.setAttribute('filter', 'url(#glow)');

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${node.id} (${node.group}) - ${node.size} connections`;

      g.appendChild(circle);
      g.appendChild(title);
      nodeGroup.appendChild(g);
      nodeElements.push(g);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.textContent = node.id.length > 15 ? node.id.substring(0, 14) + '…' : node.id;
      text.setAttribute('fill', '#c8d6e5');
      text.setAttribute('font-size', '10');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dy', String(r + 14));
      labelGroup.appendChild(text);
      labelElements.push(text);

      // Store DOM refs on the node object
      (node as any)._el = g;
      (node as any)._lineEls = linkElements.filter((_, i) => {
        const l = links[i];
        return l.source === node.id || l.target === node.id;
      });
      (node as any)._textEl = text;
      (node as any)._circle = circle;
    });

    // Simulation loop
    let running = true;
    let nodesArr: any[] = [];
    const tick = () => {
      if (!running) return;

      nodesArr = Array.from(nodeMap.values());

      // Repulsion between all nodes
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
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }

      // Attraction along edges
      links.forEach(link => {
        const a = nodeMap.get(link.source)!;
        const b = nodeMap.get(link.target)!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = dist * ATTRACTION;
        a.vx += (dx / dist) * force;
        a.vy += (dy / dist) * force;
        b.vx -= (dx / dist) * force;
        b.vy -= (dy / dist) * force;
      });

      // Center gravity
      nodesArr.forEach(n => {
        n.vx += (CENTER.x - n.x) * 0.001;
        n.vy += (CENTER.y - n.y) * 0.001;
      });

      // Apply velocity with damping
      nodesArr.forEach(n => {
        n.vx *= 0.9;
        n.vy *= 0.9;
        n.x += n.vx;
        n.y += n.vy;
        n.x = Math.max(10, Math.min(w - 10, n.x));
        n.y = Math.max(10, Math.min(h - 10, n.y));
      });

      // Update DOM
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

    // Hover interaction
    nodeElements.forEach((g, i) => {
      g.addEventListener('mouseenter', () => {
        const node = nodesArr[i];
        const r = getRadius(node.size);
        (node as any)._circle?.setAttribute('r', String(r * 1.3));
        nodeMap.forEach((nVal, _) => {
          const nAny = nVal as any;
          const connected = links.some(l => (l.source === node.id && l.target === nVal.id) || (l.source === nVal.id && l.target === node.id));
          if (nAny._circle) {
            (nAny._circle as SVGCircleElement).setAttribute('opacity', connected || nVal.id === node.id ? '1' : '0.1');
          }
          if (nAny._textEl) {
            (nAny._textEl as SVGTextElement).setAttribute('opacity', connected || nVal.id === node.id ? '1' : '0.1');
          }
        });
        linkElements.forEach((line, li) => {
          const l = links[li];
          line.setAttribute('stroke', l.source === node.id || l.target === node.id ? 'rgba(46,213,115,0.6)' : 'rgba(255,255,255,0.03)');
        });
      });

      g.addEventListener('mouseleave', () => {
        const node = nodesArr[i];
        const r = getRadius(node.size);
        (node as any)._circle?.setAttribute('r', String(r));
        nodeMap.forEach(nVal => {
          const nAny = nVal as any;
          if (nAny._circle) (nAny._circle as SVGCircleElement).setAttribute('opacity', '0.9');
          if (nAny._textEl) (nAny._textEl as SVGTextElement).setAttribute('opacity', '1');
        });
        linkElements.forEach(line => line.setAttribute('stroke', 'rgba(255,255,255,0.1)'));
      });
    });

    return () => { running = false; };
  }, [data]);

  if (loading) return <div style={styles.loading}>Loading network graph...</div>;
  if (!data || data.nodes.length === 0) return <div style={styles.error}>No network data available.</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Criminological Network Graph</h1>
        <div style={styles.legend}>
          <span style={styles.legendItem}><span style={{ ...styles.dot, background: '#2eD573' }} /> Crime Types</span>
          <span style={styles.legendItem}><span style={{ ...styles.dot, background: '#1e90ff' }} /> Districts</span>
          <span style={styles.legendItem}><span style={{ ...styles.dot, background: '#ff4757' }} /> Syndicates</span>
        </div>
      </div>
      <div style={styles.statsRow}>
        <span style={styles.stat}>{data.nodes.length} nodes</span>
        <span style={styles.stat}>{data.edges.length} connections</span>
        <span style={styles.statHint}>Hover nodes to see connections</span>
      </div>
      <svg ref={svgRef} style={styles.svg} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px 32px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' as const, gap: 12 },
  title: { fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 },
  legend: { display: 'flex', gap: 16 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8395a7' },
  dot: { width: 10, height: 10, borderRadius: '50%' },
  statsRow: { display: 'flex', gap: 16, marginBottom: 12, alignItems: 'center' },
  stat: { fontSize: 13, color: '#8395a7' },
  statHint: { fontSize: 11, color: '#576574', fontStyle: 'italic' },
  svg: { width: '100%', height: 500, background: 'rgba(255,255,255,0.02)', borderRadius: 12 },
  loading: { padding: 40, color: '#8395a7', fontSize: 16, textAlign: 'center' as const },
  error: { padding: 40, color: '#ff4757', fontSize: 16 },
};

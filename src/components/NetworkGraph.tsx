import { useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { Entity } from '../db';

interface NetworkGraphProps {
  entities: Entity[];
}

export function NetworkGraph({ entities }: NetworkGraphProps) {
  const graphData = useMemo(() => {
    const nodes = entities.map(e => ({
      id: e.id,
      name: e.name,
      type: e.type,
      val: e.state.wealth_or_power || e.state.wealth || e.state.power || 5,
    }));

    const links: any[] = [];
    entities.forEach(e => {
      if (e.relationships && e.relationships.length > 0) {
        e.relationships.forEach(rel => {
          // Verify target exists to prevent crash
          if (entities.find(target => target.id === rel.targetId)) {
             links.push({
               source: e.id,
               target: rel.targetId,
               nature: rel.nature,
               strength: rel.strength
             });
          }
        });
      }
    });

    return { nodes, links };
  }, [entities]);

  if (entities.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-500 italic border-2 border-dashed border-slate-800 rounded-xl">Network inactive. Seed world first.</div>;
  }

  return (
    <div className="w-full h-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative shadow-2xl">
       <div className="absolute top-4 left-4 z-10 bg-slate-900/80 p-3 rounded-lg border border-slate-700 backdrop-blur-sm pointer-events-none">
         <h3 className="text-slate-200 font-bold text-sm mb-1">Societal Matrix</h3>
         <p className="text-slate-400 text-xs">Nodes: {graphData.nodes.length} | Edges: {graphData.links.length}</p>
       </div>
       <ForceGraph2D
          graphData={graphData}
          nodeLabel="name"
          nodeColor={(node: any) => {
            if (node.type === 'Person') return '#818cf8'; // indigo-400
            if (node.type === 'Organization' || node.type === 'Corp') return '#34d399'; // teal-400
            if (node.type === 'AI') return '#f87171'; // emerald-400
            return '#94a3b8'; // slate-400
          }}
          linkColor={() => '#334155'} // slate-700
          linkWidth={(link: any) => Math.max(1, (link.strength || 50) / 20)}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          backgroundColor="#020617" // slate-950
          nodeRelSize={6}
          d3VelocityDecay={0.3}
          cooldownTicks={100}
        />
    </div>
  );
}
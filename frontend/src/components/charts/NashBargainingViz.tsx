"use client";

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { GlowContainer } from "@/components/layout/GlowContainer";

interface NashBargainingVizProps {
  safetyUtility: number;
  returnUtility: number;
  disagreementPoint: { x: number; y: number };
}

export function NashBargainingViz({ safetyUtility, returnUtility, disagreementPoint }: NashBargainingVizProps) {
  const data = [
    { x: safetyUtility, y: returnUtility, name: "Equilibrium" },
  ];

  return (
    <GlowContainer glowColor="purple" intensity="medium" className="flex flex-col items-center p-6 h-full">
      <h3 className="font-orbitron text-lg text-white mb-4 tracking-wider">Nash Equilibrium</h3>
      
      <div className="w-full h-[250px] relative mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis type="number" dataKey="x" name="Safety Utility" domain={[0, 1]} stroke="#666" fontSize={10} label={{ value: 'Safety (X)', position: 'insideBottom', offset: -10, fill: '#666', fontSize: 10 }} />
            <YAxis type="number" dataKey="y" name="Return Utility" domain={[0, 1]} stroke="#666" fontSize={10} label={{ value: 'Return (Y)', angle: -90, position: 'insideLeft', fill: '#666', fontSize: 10 }} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ backgroundColor: "#111", border: "1px solid #333" }} />
            
            {/* Equilibrium Point */}
            <Scatter name="Negotiated Solution" data={data} fill="#aa00ff" shape="circle" />
            
            {/* Disagreement Point (Reference) */}
            <Scatter name="Status Quo" data={[disagreementPoint]} fill="#ff00ff" shape="cross" />
          </ScatterChart>
        </ResponsiveContainer>

        {/* Legend - Positioned absolutely at bottom to ensure no overlap */}
        <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-neon-purple" /> Solution
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-pink-500" /> Disagreement
          </div>
        </div>
      </div>
      
      <p className="text-zinc-500 text-[10px] uppercase tracking-wider text-center mt-4 px-4 border-t border-white/5 pt-2 w-full">
        Optimizing Safety (X) vs Return (Y)
      </p>
    </GlowContainer>
  );
}

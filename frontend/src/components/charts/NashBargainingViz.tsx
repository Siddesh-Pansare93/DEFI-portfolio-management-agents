"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";

interface NashBargainingVizProps {
  safetyUtility: number;
  returnUtility: number;
  disagreementPoint: { x: number; y: number };
}

export function NashBargainingViz({
  safetyUtility,
  returnUtility,
  disagreementPoint,
}: NashBargainingVizProps) {
  // Pareto frontier: a curve from high safety/low return to low safety/high return
  const paretoData = Array.from({ length: 20 }, (_, i) => {
    const t = i / 19;
    return {
      x: 1 - t * 0.8,
      y: 0.2 + t * 0.8,
    };
  });

  const equilibriumData = [{ x: safetyUtility, y: returnUtility }];
  const disagreementData = [{ x: disagreementPoint.x, y: disagreementPoint.y }];

  return (
    <div className="bg-[#222735] border border-[#334155] rounded-2xl p-5">
      <h3 className="text-xs font-medium uppercase tracking-wider text-[#64748B] mb-4">
        Nash Equilibrium
      </h3>

      <div className="w-full h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, 1]}
              stroke="#475569"
              fontSize={10}
              tick={{ fill: "#64748B" }}
              label={{
                value: "Safety Utility",
                position: "insideBottom",
                offset: -18,
                fill: "#64748B",
                fontSize: 11,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[0, 1]}
              stroke="#475569"
              fontSize={10}
              tick={{ fill: "#64748B" }}
              label={{
                value: "Return Utility",
                angle: -90,
                position: "insideLeft",
                offset: 4,
                fill: "#64748B",
                fontSize: 11,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1E2433",
                border: "1px solid #334155",
                borderRadius: "8px",
                fontSize: 12,
              }}
              itemStyle={{ color: "#fff" }}
              cursor={{ stroke: "#475569", strokeDasharray: "3 3" }}
            />

            {/* Pareto frontier - dashed line */}
            <Line
              data={paretoData}
              type="monotone"
              dataKey="y"
              stroke="#475569"
              strokeDasharray="6 3"
              dot={false}
              name="Pareto Frontier"
              legendType="none"
            />

            {/* Disagreement point */}
            <Scatter
              name="Disagreement"
              data={disagreementData}
              fill="#64748B"
              shape="circle"
              r={5}
            />

            {/* Nash equilibrium point */}
            <Scatter
              name="Nash Equilibrium"
              data={equilibriumData}
              fill="#F59E0B"
              shape="circle"
              r={8}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-5 mt-3">
        <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
          Equilibrium
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#64748B]" />
          Disagreement
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
          <span className="w-4 border-t border-dashed border-[#475569]" />
          Pareto Frontier
        </div>
      </div>
    </div>
  );
}

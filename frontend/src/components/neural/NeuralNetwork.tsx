import React from 'react';
import { motion } from 'framer-motion';
import { Network, Activity, FileWarning, Fingerprint, ShieldAlert } from 'lucide-react';
import { NeuralNode, AgentStatus } from './NeuralNode';
import { SynapseConnection } from './SynapseConnection';

// Example structured types
interface AgentState {
  id: string;
  name: string;
  status: AgentStatus;
  message?: string;
  icon: any;
  colorHex: string;
  glowColor: string;
  x: number;
  y: number;
}

const DEFAULT_AGENTS: AgentState[] = [
  { id: 'collector', name: 'Data Collector', status: 'idle', icon: Activity, colorHex: '#06B6D4', glowColor: 'rgba(6, 182, 212, 0.25)', x: 50, y: 150 },
  { id: 'analyzer', name: 'Market Analyzer', status: 'idle', icon: Network, colorHex: '#6366F1', glowColor: 'rgba(99, 102, 241, 0.25)', x: 300, y: 50 },
  { id: 'strategy', name: 'Strategy Proposer', status: 'idle', icon: FileWarning, colorHex: '#F59E0B', glowColor: 'rgba(245, 158, 11, 0.25)', x: 550, y: 100 },
  { id: 'risk', name: 'Risk Validator', status: 'idle', icon: ShieldAlert, colorHex: '#EF4444', glowColor: 'rgba(239, 68, 68, 0.25)', x: 300, y: 250 },
  { id: 'nash', name: 'Nash Negotiator', status: 'idle', icon: Fingerprint, colorHex: '#8B5CF6', glowColor: 'rgba(139, 92, 246, 0.30)', x: 550, y: 250 }
];

export function NeuralNetwork({ agents = DEFAULT_AGENTS }: { agents?: AgentState[] }) {
  // Map connections based on pipeline flow
  const connections = [
    { id: 'col-ana', from: 'collector', to: 'analyzer' },
    { id: 'col-risk', from: 'collector', to: 'risk' },
    { id: 'ana-strat', from: 'analyzer', to: 'strategy' },
    { id: 'strat-risk', from: 'strategy', to: 'risk' }, // Debate ping-pong
    { id: 'risk-nash', from: 'risk', to: 'nash' },
    { id: 'strat-nash', from: 'strategy', to: 'nash' }
  ];

  return (
    <div className="relative w-full max-w-[800px] h-[400px] mx-auto hidden md:block">
      {/* Container for absolute positioned SVG synapses */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full" style={{ overflow: 'visible' }}>
          {/* Glow filters for traveling particles */}
          <defs>
            <filter id="glow-06B6D4" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-6366F1" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-F59E0B" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-EF4444" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-8B5CF6" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {connections.map(conn => {
            const fromNode = agents.find(a => a.id === conn.from);
            const toNode = agents.find(a => a.id === conn.to);
            if (!fromNode || !toNode) return null;
            
            // Offset coordinates to connect the centers of nodes (nodes are 140px wide, 100px tall roughly)
            const startX = fromNode.x + 70;
            const startY = fromNode.y + 30; // approx center of the orb
            const endX = toNode.x + 70;
            const endY = toNode.y + 30;

            const isFlowing = fromNode.status === 'active' || fromNode.status === 'complete';
            const isComplete = toNode.status === 'complete';

            return (
              <SynapseConnection
                key={conn.id}
                id={conn.id}
                startX={startX}
                startY={startY}
                endX={endX}
                endY={endY}
                status={isComplete ? 'complete' : isFlowing ? 'flowing' : 'idle'}
                colorHex={fromNode.colorHex}
              />
            );
          })}
        </svg>
      </div>

      {/* Nodes */}
      {agents.map((agent, i) => (
        <motion.div
          key={agent.id}
          className="absolute"
          style={{ left: agent.x, top: agent.y }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
        >
          <NeuralNode
            id={agent.id}
            name={agent.name}
            icon={agent.icon}
            status={agent.status}
            message={agent.message}
            colorHex={agent.colorHex}
            glowColor={agent.glowColor}
          />
        </motion.div>
      ))}
    </div>
  );
}
import React from 'react';

export function AmbientBackground({ showGrid = false }: { showGrid?: boolean }) {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Dark background base */}
      <div className="absolute inset-0 bg-[#050505] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#050505] to-[#020208]" />

      {/* Grid Pattern (Landing Page Only) */}
      {showGrid && (
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
            maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)'
          }}
        />
      )}

      {/* Animated Blobs */}
      <div
        className="absolute -top-[10%] -left-[10%] w-[600px] h-[600px] rounded-full bg-indigo-500/6 blur-[120px] animate-ambient-float"
      />
      <div
        className="absolute -bottom-[10%] -right-[10%] w-[500px] h-[500px] rounded-full bg-emerald-500/4 blur-[120px] animate-ambient-float"
        style={{ animationDelay: "-10s" }}
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-amber-500/3 blur-[120px] animate-ambient-float"
        style={{ animationDelay: "-20s" }}
      />
    </div>
  );
}
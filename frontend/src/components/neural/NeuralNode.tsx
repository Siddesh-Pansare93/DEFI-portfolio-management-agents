import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AgentStatus = 'idle' | 'active' | 'complete' | 'error';

interface NeuralNodeProps {
  id: string;
  name: string;
  icon: LucideIcon;
  status: AgentStatus;
  message?: string;
  colorHex: string;
  glowColor: string;
  className?: string;
}

export function NeuralNode({
  name,
  icon: Icon,
  status,
  message,
  colorHex,
  glowColor,
  className
}: NeuralNodeProps) {
  // Orb appearance logic
  const isIdle = status === 'idle';
  const isActive = status === 'active';
  const isComplete = status === 'complete';
  const isError = status === 'error';

  const CurrentIcon = isComplete ? CheckCircle2 : (isError ? AlertCircle : Icon);

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 w-[140px]", className)}>
      {/* Orb Container */}
      <div className="relative flex items-center justify-center w-12 h-12">
        {/* Glow Halo */}
        <motion.div 
          className="absolute inset-0 rounded-full"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: isActive ? 1 : (isComplete ? 0.6 : 0),
            scale: isActive ? 1.5 : 1,
            boxShadow: isActive ? `0 0 30px 10px ${glowColor}` : (isComplete ? `0 0 15px 2px ${glowColor}` : 'none'),
          }}
          transition={isActive ? { duration: 2, repeat: Infinity, repeatType: 'reverse' } : { duration: 0.5 }}
          style={{ backgroundColor: isActive ? glowColor : 'transparent' }}
        />
        
        {/* Core Orb */}
        <div 
          className={cn(
            "relative z-10 flex items-center justify-center w-full h-full rounded-full transition-all duration-500",
            isIdle && "opacity-30 border border-white/10 bg-black",
            !isIdle && "opacity-100"
          )}
          style={{
            background: isIdle ? undefined : `radial-gradient(circle at center, ${colorHex} 0%, transparent 80%)`,
            backgroundColor: isIdle ? undefined : '#0A0A0F',
            boxShadow: isError ? `0 0 20px rgba(239, 68, 68, 0.5)` : undefined
          }}
        >
          <motion.div
            key={status}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <CurrentIcon className={cn("w-5 h-5", isIdle ? "text-[#4A4F5A]" : (isComplete ? "text-emerald-500" : (isError ? "text-red-500" : "text-white")))} />
          </motion.div>
        </div>

        {/* Orbiting Particles (Active State) */}
        {isActive && (
          <div className="absolute inset-[-10px] animate-spin" style={{ animationDuration: '4s' }}>
            <div className="absolute top-0 left-1/2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorHex }} />
            <div className="absolute bottom-0 right-1/4 w-1 h-1 rounded-full" style={{ backgroundColor: colorHex }} />
            <div className="absolute top-1/3 -left-1 w-1 h-1 rounded-full" style={{ backgroundColor: colorHex }} />
          </div>
        )}
      </div>

      {/* Card Info */}
      <div 
        className={cn(
          "glass-card px-3 py-2 flex flex-col items-center w-full transition-colors duration-300",
          isActive && "border-opacity-30",
          isComplete && "border-emerald-500/20",
          isError && "border-red-500/20"
        )}
        style={{ borderColor: isActive ? colorHex : undefined }}
      >
        <span className="font-sans font-medium text-sm text-center tracking-tight text-[#EDEDEF]">
          {name}
        </span>
        <span 
          className={cn(
            "font-sans text-xs text-center mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis w-full transition-colors",
            isIdle && "text-[#4A4F5A]",
            isActive && "text-[#8A8F98]",
            isComplete && "text-emerald-500",
            isError && "text-red-500"
          )}
        >
          {message || (isIdle ? "Standby" : (isComplete ? "Complete" : ""))}
        </span>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Command } from 'lucide-react';

interface EntropyCubeProps {
  unlocking: boolean;
  isDarkMode: boolean;
}

const SystemBootSequence: React.FC<EntropyCubeProps> = ({ unlocking, isDarkMode }) => {
  const [stage, setStage] = useState<'IDLE' | 'LOADING' | 'FLASH' | 'OPEN'>('IDLE');
  const [text, setText] = useState('');

  useEffect(() => {
    if (!unlocking) {
       setStage('IDLE');
       return;
    } 

    // Stage 1: Loading / Authenticating
    setStage('LOADING');
    setText('AUTHENTICATING');
    
    // Text Sequence
    const t1 = setTimeout(() => setText('VERIFYING_HASH'), 600);
    const t2 = setTimeout(() => setText('SYSTEM_READY'), 1100);

    // Stage 2: Flash (The "Ignition")
    const t3 = setTimeout(() => {
        setStage('FLASH');
    }, 1600);

    // Stage 3: Open (The "Horizon" Reveal)
    const t4 = setTimeout(() => {
        setStage('OPEN');
    }, 1700); // Short flash duration

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [unlocking]);

  if (!unlocking && stage === 'IDLE') return null;

  // Theme Colors
  const bg = isDarkMode ? 'bg-black' : 'bg-zinc-100';
  const fg = isDarkMode ? 'text-white' : 'text-black';
  const line = isDarkMode ? 'bg-white' : 'bg-black';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center font-mono overflow-hidden pointer-events-none">
      
      {/* TOP SHUTTER */}
      <div 
        className={`absolute top-0 left-0 right-0 h-[50vh] ${bg} z-20 transition-transform duration-1000 ease-[cubic-bezier(0.87,0,0.13,1)] origin-top will-change-transform`}
        style={{ 
          transform: stage === 'OPEN' ? 'translateY(-100%)' : 'translateY(0)' 
        }} 
      >
         {/* Subtle Border Line */}
         <div className={`absolute bottom-0 left-0 right-0 h-[1px] ${line} opacity-20`}></div>
      </div>

      {/* BOTTOM SHUTTER */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-[50vh] ${bg} z-20 transition-transform duration-1000 ease-[cubic-bezier(0.87,0,0.13,1)] origin-bottom will-change-transform`}
        style={{ 
          transform: stage === 'OPEN' ? 'translateY(100%)' : 'translateY(0)' 
        }}
      >
         {/* Subtle Border Line */}
         <div className={`absolute top-0 left-0 right-0 h-[1px] ${line} opacity-20`}></div>
      </div>

      {/* CENTER HUD (Content) - Absolute Positioning Strategy */}
      <div 
        className={`absolute inset-0 z-30 transition-all duration-300 ${stage === 'OPEN' ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}
      >
         {/* 1. The "Horizon" Line - LOCKED TO DEAD CENTER (50vh) */}
         <div className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 flex justify-center items-center">
             <div 
               className={`${line} transition-all duration-300 ease-out`}
               style={{ 
                 width: stage === 'LOADING' ? '200px' : stage === 'FLASH' ? '100vw' : '0px',
                 height: '100%',
                 opacity: stage === 'FLASH' ? 1 : 0.5,
                 boxShadow: isDarkMode ? '0 0 20px rgba(255,255,255,0.8)' : 'none'
               }}
             ></div>
         </div>

         {/* 2. Text Info - LOCKED BELOW CENTER */}
         {/* pt-20 ensures it starts 80px BELOW the horizon line */}
         <div className="absolute top-1/2 left-0 right-0 pt-20 flex flex-col items-center gap-6">
            <div className={`flex items-center gap-3 text-xs font-bold tracking-[0.4em] ${fg} animate-pulse`}>
               <Command size={14} />
               {text}
            </div>
            
            {/* Decoding Effect Lines */}
            <div className={`flex gap-3 h-1 ${stage === 'LOADING' ? 'opacity-100' : 'opacity-0'}`}>
                <div className={`w-1 h-full ${line} animate-[ping_1s_infinite]`}></div>
                <div className={`w-1 h-full ${line} animate-[ping_1.2s_infinite]`}></div>
                <div className={`w-1 h-full ${line} animate-[ping_0.8s_infinite]`}></div>
            </div>
         </div>
      </div>

      {/* FLASH OVERLAY (The retinal burn effect) */}
      <div 
        className={`absolute inset-0 z-40 bg-white mix-blend-overlay pointer-events-none transition-opacity duration-500 ease-out`}
        style={{ opacity: stage === 'FLASH' ? 1 : 0 }}
      ></div>

    </div>
  );
};

export default SystemBootSequence;

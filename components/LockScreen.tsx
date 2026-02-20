import React, { useState, useEffect, useMemo } from 'react';
import { getOrganization } from '../services/databaseService';
import { ChevronRight } from 'lucide-react';

interface LockScreenProps {
  currentUser: string;
  currentOrgId: string;
  onUnlock: () => void;
}

const LockScreen: React.FC<LockScreenProps> = ({ currentUser, currentOrgId, onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  // Focus input on mount
  useEffect(() => {
    const input = document.getElementById('lock-input');
    if (input) input.focus();
  }, []);

  const handleUnlockAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    
    const org = getOrganization(currentOrgId);
    const user = org?.users.find(u => u.id === currentUser);
    
    if (user && user.password === password) {
      setUnlocking(true);
      setTimeout(onUnlock, 800); // Wait for exit animation
    } else {
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 2000); // Reset error shake
    }
  };

  // Pre-calculate random vectors for each block to ensure deterministic chaos during the lifecycle
  const blocks = useMemo(() => {
    const b = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          b.push({ 
            x, y, z,
            // Random scatter vector (Chaos Destination)
            randX: (Math.random() - 0.5) * 400, // Spread width
            randY: (Math.random() - 0.5) * 400,
            randZ: (Math.random() - 0.5) * 400,
            // Random rotation vector
            rotX: Math.random() * 360,
            rotY: Math.random() * 360,
            rotZ: Math.random() * 360,
            // Slight delay for organic feel
            delay: Math.random() * 2
          });
        }
      }
    }
    return b;
  }, []);

  const renderEntropyCube = () => {
    return (
      <div className="scene select-none pointer-events-none">
        <style>{`
          .scene { width: 400px; height: 400px; perspective: 1200px; display: flex; align-items: center; justify-content: center; }
          .cube-container { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; animation: globalRotate 30s infinite linear; }
          
          .block {
            position: absolute; width: 40px; height: 40px;
            background: rgba(0,0,0,0.8); 
            border: 1px solid rgba(255,255,255,0.9);
            left: 50%; top: 50%; margin-left: -20px; margin-top: -20px;
            backface-visibility: visible; 
            /* The core animation: Order -> Chaos -> Order */
            animation: entropyCycle 12s ease-in-out infinite;
          }

          /* Global Container Rotation - Always spinning slowly */
          @keyframes globalRotate {
            0% { transform: rotateX(15deg) rotateY(15deg); }
            100% { transform: rotateX(15deg) rotateY(375deg); }
          }

          /* The Chaos Engine */
          @keyframes entropyCycle {
            0%, 15% {
              /* ORDER: Perfect Grid */
              transform: translate3d(var(--bx), var(--by), var(--bz)) rotateX(0) rotateY(0) rotateZ(0);
              border-color: rgba(255,255,255,0.9);
              background: rgba(0,0,0,0.9);
              box-shadow: 0 0 0 rgba(255,255,255,0);
            }
            45%, 65% {
              /* CHAOS: Scattered to random coordinates */
              transform: translate3d(var(--rx), var(--ry), var(--rz)) rotate3d(1, 1, 1, var(--rr));
              border-color: rgba(255,255,255,0.3); /* Dimmer when scattered */
              background: rgba(255,255,255,0.02); /* More transparent */
              box-shadow: 0 0 10px rgba(255,255,255,0.1);
            }
            100% {
              /* RETURN TO ORDER */
              transform: translate3d(var(--bx), var(--by), var(--bz)) rotateX(0) rotateY(0) rotateZ(0);
              border-color: rgba(255,255,255,0.9);
              background: rgba(0,0,0,0.9);
              box-shadow: 0 0 0 rgba(255,255,255,0);
            }
          }
        `}</style>
        
        <div className={`cube-container ${unlocking ? 'duration-500 scale-[5] opacity-0 blur-md transition-all ease-in' : ''}`}>
          {blocks.map((b, i) => {
            const gap = 45; // Distance between blocks in Order state
            
            // CSS Variables passed to the keyframes
            const style = {
              '--bx': `${b.x * gap}px`, // Base X (Order)
              '--by': `${b.y * gap}px`, // Base Y
              '--bz': `${b.z * gap}px`, // Base Z
              
              '--rx': `${b.randX}px`,   // Random X (Chaos)
              '--ry': `${b.randY}px`,   // Random Y
              '--rz': `${b.randZ}px`,   // Random Z
              
              '--rr': `${b.rotX}deg`,   // Random Rotation
              
              animationDelay: `-${b.delay}s` // Offset start times slightly for non-robotic feel
            } as React.CSSProperties;

            // The core block (0,0,0) is solid white
            const isCore = b.x === 0 && b.y === 0 && b.z === 0;
            
            return (
              <div 
                key={i} 
                className="block"
                style={{
                  ...style,
                  background: isCore ? '#fff' : undefined,
                  boxShadow: isCore ? '0 0 20px rgba(255,255,255,0.5)' : undefined
                }}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-500">
      
      {/* 3D Visual Center - Now completely unobscured */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        {renderEntropyCube()}
      </div>

      {/* Input Section - Anchored to Bottom */}
      <div className={`absolute bottom-24 w-full max-w-md px-8 transition-all duration-500 z-10 ${unlocking ? 'translate-y-10 opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className="text-center mb-6 space-y-2 mix-blend-difference">
           <h2 className="text-white font-mono tracking-[0.5em] text-xs opacity-50">SECURE_TERMINAL</h2>
           <div className="text-white font-bold text-3xl tracking-widest uppercase">{currentUser}</div>
        </div>

        <form onSubmit={handleUnlockAttempt} className="relative group">
          <input 
            id="lock-input"
            type="password" 
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            className={`w-full bg-black/50 backdrop-blur-md border-b border-white/30 text-center text-white text-xl py-4 focus:outline-none focus:border-white transition-all font-mono tracking-[0.5em] placeholder-white/10 ${error ? 'border-rose-500 text-rose-500 animate-pulse' : ''}`}
            placeholder="PASSCODE"
            autoComplete="off"
          />
          <button 
            type="submit"
            className="absolute right-0 top-0 bottom-0 text-white/50 hover:text-white transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </form>
        
        {error && (
          <div className="text-center mt-6 text-rose-500 text-xs font-mono tracking-[0.2em] font-bold animate-bounce uppercase">
            Access Denied
          </div>
        )}
      </div>

      {/* Subtle Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.07] z-[-1]" 
           style={{ 
             backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, 
             backgroundSize: '60px 60px' 
           }}>
      </div>
    </div>
  );
};

export default LockScreen;
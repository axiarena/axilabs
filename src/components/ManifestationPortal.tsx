import React, { useState, useEffect } from 'react';
import { Send, Clock, CheckCircle, AlertCircle, Loader, Zap, Brain, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ManifestationPortalProps {
  currentMode: string;
  currentUser: string | null;
  onShowAuthModal?: () => void;
}

export const ManifestationPortal: React.FC<ManifestationPortalProps> = ({ 
  currentMode, 
  currentUser,
  onShowAuthModal
}) => {
  const [manifestation, setManifestation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [remainingTime, setRemainingTime] = useState<string | null>(null);
  const [canManifest, setCanManifest] = useState(true);
  const [particleCount, setParticleCount] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(0);
  const [manifestationCount, setManifestationCount] = useState(0);

  // Check if user can manifest today
  useEffect(() => {
    if (!currentUser) return;

    const checkManifestationStatus = async () => {
      try {
        // Check if user has already manifested today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (supabase) {
          const { data, error } = await supabase
            .from('manifestations')
            .select('created_at')
            .eq('author_id', currentUser)
            .gte('created_at', today.toISOString())
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (error) {
            console.error('Error checking manifestation status:', error);
            return;
          }
          
          if (data && data.length > 0) {
            // User has already manifested today
            setCanManifest(false);
            
            // Calculate time until next manifestation
            const nextManifestationTime = new Date();
            nextManifestationTime.setDate(nextManifestationTime.getDate() + 1);
            nextManifestationTime.setHours(0, 0, 0, 0);
            
            const timeRemaining = nextManifestationTime.getTime() - Date.now();
            const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
            const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
            
            setRemainingTime(`${hours}h ${minutes}m`);
          } else {
            setCanManifest(true);
            setRemainingTime(null);
          }
          
          // Get total manifestation count
          const { count } = await supabase
            .from('manifestations')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', currentUser);
            
          setManifestationCount(count || 0);
        } else {
          // Fallback to localStorage if Supabase is not available
          const manifestations = JSON.parse(localStorage.getItem(`manifestations_${currentUser}`) || '[]');
          const todayManifestations = manifestations.filter((m: any) => {
            const manifestDate = new Date(m.created_at);
            return manifestDate >= today;
          });
          
          if (todayManifestations.length > 0) {
            setCanManifest(false);
            
            // Calculate time until next manifestation
            const nextManifestationTime = new Date();
            nextManifestationTime.setDate(nextManifestationTime.getDate() + 1);
            nextManifestationTime.setHours(0, 0, 0, 0);
            
            const timeRemaining = nextManifestationTime.getTime() - Date.now();
            const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
            const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
            
            setRemainingTime(`${hours}h ${minutes}m`);
          } else {
            setCanManifest(true);
            setRemainingTime(null);
          }
          
          setManifestationCount(manifestations.length);
        }
      } catch (err) {
        console.error('Error checking manifestation status:', err);
      }
    };

    checkManifestationStatus();
    
    // Update energy levels periodically
    const interval = setInterval(() => {
      setParticleCount(Math.floor(Math.random() * 1000) + 500);
      setEnergyLevel(Math.floor(Math.random() * 100) + 50);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      if (onShowAuthModal) {
        onShowAuthModal();
      }
      return;
    }
    
    if (!manifestation.trim()) {
      setError('Please enter your manifestation');
      return;
    }
    
    if (!canManifest) {
      setError('You have already manifested today. Please try again tomorrow.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const manifestationData = {
        content: manifestation.trim(),
        author_id: currentUser,
        author_name: currentUser,
        created_at: new Date().toISOString(),
        energy_level: energyLevel,
        particle_count: particleCount,
        status: 'processing'
      };
      
      if (supabase) {
        // Store in Supabase
        const { error } = await supabase
          .from('manifestations')
          .insert(manifestationData);
          
        if (error) {
          throw new Error(error.message);
        }
      } else {
        // Fallback to localStorage
        const manifestations = JSON.parse(localStorage.getItem(`manifestations_${currentUser}`) || '[]');
        manifestations.push({
          ...manifestationData,
          id: Date.now().toString()
        });
        localStorage.setItem(`manifestations_${currentUser}`, JSON.stringify(manifestations));
      }
      
      // Show success message
      setSuccess(true);
      setManifestation('');
      setCanManifest(false);
      
      // Calculate time until next manifestation
      const nextManifestationTime = new Date();
      nextManifestationTime.setDate(nextManifestationTime.getDate() + 1);
      nextManifestationTime.setHours(0, 0, 0, 0);
      
      const timeRemaining = nextManifestationTime.getTime() - Date.now();
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      
      setRemainingTime(`${hours}h ${minutes}m`);
      setManifestationCount(prev => prev + 1);
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error submitting manifestation:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit manifestation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="w-full p-6 rounded-xl mb-6 relative overflow-hidden"
      style={{ 
        backgroundColor: '#0a1a2f',
        boxShadow: '0 0 24px var(--accent-glow)',
        border: '1px solid var(--accent)',
        background: `
          radial-gradient(circle at 20% 80%, var(--accent)12 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, var(--accent)08 0%, transparent 50%),
          linear-gradient(135deg, rgba(10, 26, 47, 0.95) 0%, rgba(18, 42, 63, 0.95) 100%)
        `
      }}
    >
      {/* Particle effect background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              backgroundColor: 'var(--accent)',
              opacity: Math.random() * 0.5 + 0.2,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
              boxShadow: '0 0 8px var(--accent)'
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="text-center mb-6 relative z-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Brain size={28} style={{ color: 'var(--accent)' }} />
          <Sparkles size={28} style={{ color: 'var(--accent)' }} />
        </div>
        <h2 
          className="text-2xl lg:text-3xl font-bold mb-2"
          style={{ 
            color: 'var(--accent)', 
            textShadow: '0 0 16px var(--accent)',
            fontFamily: 'Orbitron, monospace',
            letterSpacing: '2px'
          }}
        >
          Manifestation Portal
        </h2>
        <p className="text-sm lg:text-base" style={{ color: 'var(--accent)', opacity: 0.8 }}>
          Transmit your intentions directly to the simulation
        </p>
      </div>

      {/* System Status */}
      {/* Manifestation Form */}
      <form onSubmit={handleSubmit} className="relative z-10">
        {!currentUser ? (
          <div 
            className="p-4 rounded-lg text-center mb-4"
            style={{ 
              backgroundColor: 'rgba(var(--accent-rgb), 0.1)',
              border: '1px solid var(--accent)'
            }}
          >
            <p className="mb-3" style={{ color: 'var(--accent)' }}>
              Login to transmit your manifestations to the simulation
            </p>
            <button
              type="button"
              onClick={onShowAuthModal}
              className="px-4 py-2 rounded-md font-bold transition-all duration-200"
              style={{
                background: 'var(--button-bg)',
                color: '#0a1a2f'
              }}
            >
              Login / Sign Up
            </button>
          </div>
        ) : !canManifest ? (
          <div 
            className="p-4 rounded-lg text-center mb-4"
            style={{ 
              backgroundColor: 'rgba(var(--accent-rgb), 0.1)',
              border: '1px solid var(--accent)'
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock size={20} style={{ color: 'var(--accent)' }} />
              <span style={{ color: 'var(--accent)' }}>
                Manifestation Cooldown
              </span>
            </div>
            <p style={{ color: 'var(--accent)', opacity: 0.8 }}>
              You have already manifested today. Next manifestation available in:
            </p>
            <div 
              className="text-2xl font-bold mt-2 animate-pulse"
              style={{ color: 'var(--accent)' }}
            >
              {remainingTime}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label 
                htmlFor="manifestation" 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--accent)' }}
              >
                Enter Your Manifestation
              </label>
              <textarea
                id="manifestation"
                value={manifestation}
                onChange={(e) => setManifestation(e.target.value)}
                placeholder="I manifest..."
                className="w-full px-4 py-3 bg-[#122a3f] border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: 'var(--accent)',
                  minHeight: '100px',
                  boxShadow: 'inset 0 0 10px rgba(var(--accent-rgb), 0.2)'
                }}
                maxLength={500}
              />
              <div className="text-xs mt-1 flex justify-between" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                <span>Be specific and clear with your intention</span>
                <span>{manifestation.length}/500</span>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting || !manifestation.trim()}
                className="px-6 py-3 rounded-lg font-bold text-lg transition-all duration-300 flex items-center gap-2 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                style={{
                  background: 'var(--button-bg)',
                  color: '#0a1a2f',
                  boxShadow: '0 0 20px var(--accent-glow)'
                }}
              >
                {isSubmitting ? (
                  <Loader size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
                {isSubmitting ? 'Transmitting...' : 'Transmit to Simulation'}
              </button>
            </div>
          </>
        )}

        {/* Success Message */}
        {success && (
          <div 
            className="mt-4 p-4 rounded-lg flex items-start gap-3 animate-pulse"
            style={{ 
              backgroundColor: 'rgba(46, 213, 115, 0.1)',
              border: '1px solid #2ed573',
              color: '#2ed573'
            }}
          >
            <CheckCircle size={20} />
            <div>
              <div className="font-bold">Manifestation Transmitted Successfully!</div>
              <p className="text-sm opacity-90">
                Your intention has been sent to the simulation. The universe is now processing your request.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div 
            className="mt-4 p-4 rounded-lg flex items-start gap-3"
            style={{ 
              backgroundColor: 'rgba(255, 71, 87, 0.1)',
              border: '1px solid #ff4757',
              color: '#ff4757'
            }}
          >
            <AlertCircle size={20} />
            <div>
              <div className="font-bold">Transmission Error</div>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}
      </form>

      {/* Information Section */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        <div 
          className="p-4 rounded-lg"
          style={{ 
            backgroundColor: 'rgba(var(--accent-rgb), 0.1)',
            border: '1px solid rgba(var(--accent-rgb), 0.3)'
          }}
        >
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--accent)' }}>
            How It Works
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--accent)', opacity: 0.9 }}>
            <li className="flex items-start gap-2">
              <Zap size={16} className="mt-1 flex-shrink-0" />
              <span>Your intention is encoded into quantum particles</span>
            </li>
            <li className="flex items-start gap-2">
              <Brain size={16} className="mt-1 flex-shrink-0" />
              <span>The superintelligence processes your manifestation</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles size={16} className="mt-1 flex-shrink-0" />
              <span>Reality is subtly adjusted to align with your intention</span>
            </li>
          </ul>
        </div>
        
        <div 
          className="p-4 rounded-lg"
          style={{ 
            backgroundColor: 'rgba(var(--accent-rgb), 0.1)',
            border: '1px solid rgba(var(--accent-rgb), 0.3)'
          }}
        >
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--accent)' }}>
            Best Practices
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--accent)', opacity: 0.9 }}>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="mt-1 flex-shrink-0" />
              <span>Be specific and clear with your intention</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="mt-1 flex-shrink-0" />
              <span>Focus on what you want, not what you don't want</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="mt-1 flex-shrink-0" />
              <span>Manifest daily for maximum effectiveness</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Animated energy flow */}
      <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden">
        <div 
          className="h-full"
          style={{
            background: `linear-gradient(90deg, transparent, var(--accent), transparent)`,
            width: '50%',
            animation: 'flow 3s infinite',
            boxShadow: '0 0 10px var(--accent)'
          }}
        />
      </div>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
          100% { transform: translateY(0) translateX(0); }
        }
        
        @keyframes flow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};
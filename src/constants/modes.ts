import { ModeColors, Mode } from '../types/shader';

export const modeColors: Record<Mode, ModeColors> = {
  pro: { 
    accent: "#00d4ff", 
    bg: "linear-gradient(135deg, #0a0f1c 0%, #0d1b2a 30%, #1b263b 70%, #2d3748 100%)", 
    code: "#00d4ff" 
  },
  gamer: { 
    accent: "#ff0066", 
    bg: "linear-gradient(135deg, #1c0a0f 0%, #2a0d1b 30%, #3a1b26 70%, #4a2a35 100%)", 
    code: "#ff0066" 
  },
  biohacker: { 
    accent: "#ff8800", 
    bg: "linear-gradient(135deg, #1c0f0a 0%, #2a1b0d 30%, #3a261b 70%, #4a352a 100%)", 
    code: "#ff8800" 
  },
  hacker: { 
    accent: "#00ff00", 
    bg: "linear-gradient(135deg, #0a1c0a 0%, #0d2a0d 30%, #1b3a1b 70%, #2a4a2a 100%)", 
    code: "#00ff00" 
  }
};
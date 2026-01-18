
import { Language, Persona } from './types';

export const LANGUAGES: Language[] = [
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇲🇽', description: 'Reconnect with your abuela\'s stories.' },
  { code: 'zh', name: 'Mandarin', nativeName: '普通话', flag: '🇨🇳', description: 'Practice the tones of home.' },
  { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog', flag: '🇵🇭', description: 'Speak the language of the islands.' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', description: 'Connect with your heritage roots.' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', description: 'Master the melody of Vietnamese.' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', description: 'Bring back the comfort of family talks.' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', description: 'Rediscover the language of elegance.' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', description: 'The rhythmic sounds of Brazil.' },
];

export const PERSONAS: Persona[] = [
  { 
    id: 'elder', 
    name: 'The Elder', 
    role: 'Grandparent figure', 
    description: 'Patient, warm, and filled with wisdom. They will never judge your "broken" language.' 
  },
  { 
    id: 'cousin', 
    name: 'The Cousin', 
    role: 'Peer/Friend', 
    description: 'Casual, uses slang, and makes you feel like you\'re just hanging out at a family BBQ.' 
  },
  { 
    id: 'neighbor', 
    name: 'The Kind Neighbor', 
    role: 'Local acquaintance', 
    description: 'Friendly and helpful, perfect for practicing everyday errands and small talk.' 
  }
];

export const APP_PALETTE = {
  background: '#fcfaf7',
  earth: '#5c4033',
  leaf: '#2d5a27',
  sand: '#d2b48c',
  clay: '#c27e5d'
};

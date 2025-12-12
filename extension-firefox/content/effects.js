/**
 * Impulse Buy Judge - Sound & Voice Effects (Firefox)
 * Handles voice narration and sound effects
 */

// Firefox/Chrome API compatibility (shared across all content scripts)
var browserAPI = typeof browserAPI !== 'undefined' ? browserAPI : (typeof browser !== 'undefined' ? browser : chrome);

// ============================================
// DEFAULT SETTINGS
// ============================================
const DEFAULT_SETTINGS = {
  triggerOn: 'checkout',
  voiceEnabled: false,
  soundEnabled: true,
  confettiEnabled: true,
  voiceVolume: 0.8,
  voiceRate: 0.9,
  voicePitch: 1.0,
  whitelistedSites: [],
  blacklistedSites: []
};

let userSettings = { ...DEFAULT_SETTINGS };
let siteEnabled = true;

// ============================================
// SITE WHITELIST/BLACKLIST CHECK
// ============================================
async function checkSiteEnabled() {
  try {
    const hostname = window.location.hostname;
    const response = await browserAPI.runtime.sendMessage({ 
      type: 'CHECK_SITE', 
      hostname 
    });
    siteEnabled = response.enabled;
    if (!siteEnabled) {
      // Site is disabled (blacklisted or not whitelisted)
    }
    return siteEnabled;
  } catch (e) {
    return true;
  }
}

// Load settings from storage
async function loadSettings() {
  try {
    const result = await browserAPI.storage.sync.get('settings');
    if (result.settings) {
      userSettings = { ...DEFAULT_SETTINGS, ...result.settings };
    }
  } catch (e) {
    // Using default settings
  }
}

// ============================================
// VOICE NARRATION (Web Speech API)
// ============================================

let cachedVoice = null;
let voicesLoaded = false;

function getBestVoice() {
  if (cachedVoice && voicesLoaded) return cachedVoice;
  
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  
  voicesLoaded = true;
  
  const englishVoices = voices.filter(v => 
    v.lang.startsWith('en-US') || v.lang.startsWith('en-GB') || v.lang === 'en'
  );
  
  if (!englishVoices.length) {
    cachedVoice = voices[0];
    return cachedVoice;
  }
  
  // Priority 1: Male Microsoft natural/neural voices (Daniel, Guy, David, Mark)
  const msMaleNatural = englishVoices.find(v => 
    v.name.includes('Microsoft') && 
    (v.name.includes('Natural') || v.name.includes('Online')) &&
    (v.name.includes('Guy') || v.name.includes('David') || v.name.includes('Mark') || v.name.includes('Ryan'))
  );
  if (msMaleNatural) {
    cachedVoice = msMaleNatural;
    return cachedVoice;
  }
  
  // Priority 2: Google US male voice
  const googleMale = englishVoices.find(v => 
    v.name.includes('Google') && v.name.includes('US') && !v.name.includes('Female')
  );
  if (googleMale) {
    cachedVoice = googleMale;
    return cachedVoice;
  }
  
  // Priority 3: Named male voices (Daniel is the classic male voice)
  const maleNames = ['Daniel', 'David', 'Guy', 'Mark', 'James', 'Richard', 'Alex', 'Tom', 'Fred'];
  const namedMaleVoice = englishVoices.find(v => 
    maleNames.some(name => v.name.includes(name))
  );
  if (namedMaleVoice) {
    cachedVoice = namedMaleVoice;
    return cachedVoice;
  }
  
  // Priority 4: Any Microsoft voice
  const msVoice = englishVoices.find(v => v.name.includes('Microsoft'));
  if (msVoice) {
    cachedVoice = msVoice;
    return cachedVoice;
  }
  
  // Priority 5: US English (fallback)
  const usVoice = englishVoices.find(v => 
    v.lang === 'en-US' && !v.name.includes('India') && !v.name.includes('Irish')
  );
  if (usVoice) {
    cachedVoice = usVoice;
    return cachedVoice;
  }
  
  cachedVoice = englishVoices[0];
  return cachedVoice;
}

function initVoices() {
  if ('speechSynthesis' in window) {
    getBestVoice();
    window.speechSynthesis.onvoiceschanged = () => {
      voicesLoaded = false;
      cachedVoice = null;
      getBestVoice();
    };
  }
}

function speakText(text, options = {}) {
  if (!userSettings.voiceEnabled) return;
  if (!('speechSynthesis' in window)) return;

  const {
    rate = 1.0,
    pitch = 1.0,
    volume = 1.0,
    dramatic = false,
    delay = 0
  } = options;

  window.speechSynthesis.cancel();

  let cleanText = text
    .replace(/\$([\d,]+\.?\d*)/g, '$1 dollars')
    .replace(/["""]/g, '')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\.\.\./g, ', ')
    .replace(/—/g, ', ')
    .replace(/–/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/\s,/g, ',')
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  
  if (dramatic) {
    utterance.rate = 0.92;
    utterance.pitch = 0.95;
    utterance.volume = 1.0;
  } else {
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
  }
  
  const voice = getBestVoice();
  if (voice) {
    utterance.voice = voice;
  }

  const speak = () => {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  if (delay > 0) {
    setTimeout(speak, delay);
  } else {
    setTimeout(speak, 50);
  }
}

// Witty intro lines for The Judge
const VOICE_INTROS = [
  "Order in the court! Impulse purchase detected!",
  "The court is now in session. Impulse purchase detected!",
  "All rise! The Impulse Judge presiding. Purchase detected!",
  "Objection! Your Honor, the defendant is buying again!",
  "Case number who's counting. Impulse purchase detected!",
  "The gavel has spoken. Impulse purchase detected!",
  "Breaking news from your wallet. Impulse purchase detected!",
  "Alert! Your credit card is screaming. Impulse purchase detected!",
  "Hold it right there, shopper! Impulse purchase detected!",
  "Court is in session. The defendant stands accused of wanting things."
];

// Witty victory lines when user resists
const VOICE_VICTORIES = [
  "Case dismissed! Your wallet thanks you for your service.",
  "Not guilty! Today, you chose wisdom over dopamine.",
  "Victory! Your future self just sent you a thank you card.",
  "The defense rests, and so does your credit card.",
  "Excellent restraint! The prosecution is stunned.",
  "Order restored! Your bank account breathes a sigh of relief.",
  "Case closed! Another impulse defeated in the court of reason.",
  "Sustained! Your objection to spending was upheld.",
  "The jury of your finances finds you, not broke today.",
  "Acquitted! Go forth and prosper, you financially responsible human."
];

// Witty shame-accepted lines when user proceeds anyway
const VOICE_SHAME_ACCEPTED = [
  "Guilty as charged. May your purchase bring you, temporary happiness.",
  "The defendant pleads retail therapy. Court adjourned.",
  "Sentence accepted. Your package will arrive before your regret does.",
  "Case closed. The evidence will arrive in 3 to 5 business days.",
  "Shame acknowledged. Your wallet will remember this day.",
  "Motion to spend, granted. The court offers its condolences to your savings.",
  "So be it. Let the record show, you were warned.",
  "The gavel falls. Your credit card weeps softly.",
  "Verdict accepted. The court hopes you actually need this.",
  "Proceeding with purchase. May the retail gods have mercy on your budget."
];

function speakShameIntro() {
  const intro = VOICE_INTROS[Math.floor(Math.random() * VOICE_INTROS.length)];
  speakText(intro, { dramatic: true });
}

function speakShameSentence(sentence) {
  speakText(sentence, { dramatic: true, delay: 1800 });
}

function speakVictory() {
  const victory = VOICE_VICTORIES[Math.floor(Math.random() * VOICE_VICTORIES.length)];
  speakText(victory, { rate: 1.05, pitch: 1.05 });
}

function speakShameAccepted() {
  const shame = VOICE_SHAME_ACCEPTED[Math.floor(Math.random() * VOICE_SHAME_ACCEPTED.length)];
  speakText(shame, { dramatic: true });
}

// Initialize voices early
initVoices();

// ============================================
// SOUND EFFECTS
// ============================================
const SOUNDS = {
  gavel: { freq: 180, duration: 0.15, type: 'square' },
  victory: { type: 'victory', notes: [523, 659, 784, 1047], duration: 0.12 },
  shame: { type: 'shame', notes: [400, 350, 300], duration: 0.2 }
};

function playSound(soundName) {
  if (!userSettings.soundEnabled) return;
  
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const sound = SOUNDS[soundName];
    
    if (!sound) return;

    if (sound.type === 'victory') {
      sound.notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * sound.duration);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (i + 1) * sound.duration);
        osc.start(ctx.currentTime + i * sound.duration);
        osc.stop(ctx.currentTime + (i + 1) * sound.duration);
      });
    } else if (sound.type === 'shame') {
      sound.notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * sound.duration);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (i + 1) * sound.duration);
        osc.start(ctx.currentTime + i * sound.duration);
        osc.stop(ctx.currentTime + (i + 1) * sound.duration);
      });
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = sound.freq;
      osc.type = sound.type || 'sine';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration);
      osc.start();
      osc.stop(ctx.currentTime + sound.duration);
    }
    
    setTimeout(() => ctx.close(), 2000);
  } catch (e) {
    // Sound failed silently
  }
}

// ============================================
// CONFETTI ANIMATION
// ============================================
function createConfetti(targetElement) {
  if (!userSettings.confettiEnabled) return;
  
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe'];
  const confettiCount = 150;
  
  const container = document.createElement('div');
  container.className = 'impulse-judge-confetti-container';
  container.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    pointer-events: none !important;
    z-index: 2147483648 !important;
    overflow: hidden !important;
  `;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 10 + 5;
    const left = Math.random() * 100;
    const delay = Math.random() * 0.5;
    const duration = Math.random() * 2 + 2;
    const rotation = Math.random() * 360;
    const shape = Math.random() > 0.5 ? '50%' : '0';
    
    confetti.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      left: ${left}%;
      top: -20px;
      border-radius: ${shape};
      transform: rotate(${rotation}deg);
      animation: impulseConfettiFall ${duration}s ease-out ${delay}s forwards;
      opacity: 0;
    `;
    
    container.appendChild(confetti);
  }
  
  if (!document.getElementById('impulse-confetti-style')) {
    const style = document.createElement('style');
    style.id = 'impulse-confetti-style';
    style.textContent = `
      @keyframes impulseConfettiFall {
        0% {
          opacity: 1;
          top: -20px;
          transform: rotate(0deg) translateX(0);
        }
        100% {
          opacity: 0;
          top: 100%;
          transform: rotate(720deg) translateX(${Math.random() > 0.5 ? '' : '-'}100px);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Append to target element (victory modal) so confetti is visible
  if (targetElement) {
    targetElement.appendChild(container);
  } else {
    document.body.appendChild(container);
  }
  setTimeout(() => container.remove(), 4000);
}

/**
 * Impulse Buy Judge - Content Script v1.0
 * Universal detection for all major North American retailers
 * Features: Confetti, Sound Effects, Keyboard Shortcuts, Achievements
 */

(function () {
  'use strict';

  // ============================================
  // EXCLUDED SITES (always disabled)
  // ============================================
  const EXCLUDED_SITES = [
    'theimpulsejudge.com',
    'www.theimpulsejudge.com',
    'buymeacoffee.com',
    'www.buymeacoffee.com'
  ];
  
  // Check if we're on an excluded site - exit immediately if so
  const currentHostname = window.location.hostname.toLowerCase();
  if (EXCLUDED_SITES.some(site => currentHostname === site || currentHostname.endsWith('.' + site))) {
    return; // Exit the entire IIFE, no extension code runs
  }

  // ============================================
  // DEFAULT SETTINGS
  // ============================================
  const DEFAULT_SETTINGS = {
    triggerOn: 'checkout', // 'addToCart', 'checkout', or 'both' - checkout only by default
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
  let siteEnabled = true; // Can be disabled via whitelist

  // ============================================
  // SITE WHITELIST/BLACKLIST CHECK
  // ============================================
  async function checkSiteEnabled() {
    try {
      const hostname = window.location.hostname;
      const response = await chrome.runtime.sendMessage({ 
        type: 'CHECK_SITE', 
        hostname 
      });
      siteEnabled = response.enabled;
      return siteEnabled;
    } catch (e) {
      return true; // Default to enabled
    }
  }

  // Load settings from storage
  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get('settings');
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
  
  // Cache for the best available voice
  let cachedVoice = null;
  let voicesLoaded = false;

  /**
   * Get the best available English MALE voice for The Judge character
   * Prioritizes male voices for consistency with the Judge persona
   */
  function getBestVoice() {
    if (cachedVoice && voicesLoaded) return cachedVoice;
    
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    
    voicesLoaded = true;
    
    // Filter to English voices only
    const englishVoices = voices.filter(v => 
      v.lang.startsWith('en-US') || v.lang.startsWith('en-GB') || v.lang === 'en'
    );
    
    if (!englishVoices.length) {
      cachedVoice = voices[0];
      return cachedVoice;
    }
    
    // Male voice names to look for (common across platforms)
    const maleVoiceNames = [
      'David', 'Mark', 'James', 'Guy', 'Daniel', 'Tom', 'Alex',
      'Microsoft David', 'Microsoft Mark', 'Google US English Male',
      'Aaron', 'Arthur', 'Fred', 'Ralph', 'Albert'
    ];
    
    // Female names to avoid
    const femaleVoiceNames = [
      'Samantha', 'Victoria', 'Karen', 'Zira', 'Susan', 'Linda', 
      'Catherine', 'Fiona', 'Moira', 'Tessa', 'Allison', 'Ava',
      'Female', 'Woman'
    ];
    
    // Helper to check if voice is likely male
    const isMaleVoice = (voice) => {
      const name = voice.name.toLowerCase();
      // Check if contains any female name
      if (femaleVoiceNames.some(f => name.includes(f.toLowerCase()))) return false;
      // Check if contains any male name
      if (maleVoiceNames.some(m => name.includes(m.toLowerCase()))) return true;
      // Check for Male keyword
      if (name.includes('male') && !name.includes('female')) return true;
      return null; // Unknown
    };
    
    // Priority 1: Microsoft David (best male voice on Windows)
    const msDavid = englishVoices.find(v => 
      v.name.includes('Microsoft') && v.name.includes('David')
    );
    if (msDavid) {
      cachedVoice = msDavid;
      return cachedVoice;
    }
    
    // Priority 2: Microsoft Mark
    const msMark = englishVoices.find(v => 
      v.name.includes('Microsoft') && v.name.includes('Mark')
    );
    if (msMark) {
      cachedVoice = msMark;
      return cachedVoice;
    }
    
    // Priority 3: Google US English (default is usually male)
    const googleMale = englishVoices.find(v => 
      v.name.includes('Google') && v.name.includes('US') && !v.name.toLowerCase().includes('female')
    );
    if (googleMale) {
      cachedVoice = googleMale;
      return cachedVoice;
    }
    
    // Priority 4: Daniel (macOS quality male voice)
    const daniel = englishVoices.find(v => v.name.includes('Daniel'));
    if (daniel) {
      cachedVoice = daniel;
      return cachedVoice;
    }
    
    // Priority 5: Any confirmed male voice
    const anyMale = englishVoices.find(v => isMaleVoice(v) === true);
    if (anyMale) {
      cachedVoice = anyMale;
      return cachedVoice;
    }
    
    // Priority 6: Any voice that's not confirmed female
    const notFemale = englishVoices.find(v => isMaleVoice(v) !== false);
    if (notFemale) {
      cachedVoice = notFemale;
      return cachedVoice;
    }
    
    // Fallback: first English voice
    cachedVoice = englishVoices[0];
    return cachedVoice;
  }

  // Pre-load voices (they load async in some browsers)
  function initVoices() {
    if ('speechSynthesis' in window) {
      // Get voices immediately if available
      getBestVoice();
      
      // Also listen for voices to load (Chrome loads them async)
      window.speechSynthesis.onvoiceschanged = () => {
        voicesLoaded = false;
        cachedVoice = null;
        getBestVoice();
      };
    }
  }

  /**
   * Speak text with natural pacing
   */
  function speakText(text, options = {}) {
    if (!userSettings.voiceEnabled) return;
    if (!('speechSynthesis' in window)) return;

    const {
      rate = 1.0,       // Normal rate
      pitch = 1.0,      // Normal pitch
      volume = 1.0,     // Full volume
      dramatic = false, // For shame sentences
      delay = 0         // Delay before speaking
    } = options;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Clean up the text for better speech
    let cleanText = text
      .replace(/\$([\d,]+\.?\d*)/g, '$1 dollars')  // "$50" -> "50 dollars"
      .replace(/["""]/g, '')         // Remove all quote types
      .replace(/\*([^*]+)\*/g, '$1') // Remove asterisks around text
      .replace(/\.\.\./g, ', ')      // Ellipsis to pause
      .replace(/—/g, ', ')           // Em dash to pause
      .replace(/–/g, ', ')           // En dash to pause  
      .replace(/\s+/g, ' ')          // Normalize whitespace
      .replace(/\s,/g, ',')          // Fix spacing before commas
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Apply settings - dramatic mode for shame
    if (dramatic) {
      utterance.rate = 0.92;    // Slightly slower, but not too slow
      utterance.pitch = 0.95;   // Slightly deeper
      utterance.volume = 1.0;
    } else {
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
    }
    
    // Get the best voice
    const voice = getBestVoice();
    if (voice) {
      utterance.voice = voice;
    }

    // Speak with optional delay
    const speak = () => {
      // Chrome bug workaround: speechSynthesis can get stuck
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    };

    if (delay > 0) {
      setTimeout(speak, delay);
    } else {
      // Small delay to ensure voice is ready
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
    // Read the shame sentence after a brief pause
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
    // Short "gavel hit" sound (synthesized)
    gavel: createBeepSound(180, 0.15, 'square'),
    // Victory fanfare (ascending)
    victory: createVictorySound(),
    // Shame sound (descending)
    shame: createShameSound()
  };

  function createBeepSound(freq, duration, type = 'sine') {
    return { freq, duration, type };
  }

  function createVictorySound() {
    return { type: 'victory', notes: [523, 659, 784, 1047], duration: 0.12 };
  }

  function createShameSound() {
    return { type: 'shame', notes: [400, 350, 300], duration: 0.2 };
  }

  function playSound(soundName) {
    if (!userSettings.soundEnabled) return;
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const sound = SOUNDS[soundName];
      
      if (!sound) return;

      if (sound.type === 'victory') {
        // Play ascending victory notes
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
        // Play descending shame notes
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
        // Simple beep
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
      
      // Auto-close context after sounds finish
      setTimeout(() => ctx.close(), 2000);
    } catch (e) {
      // Sound playback failed silently
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
    
    // Add keyframes if not exists
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
    
    // Remove after animation
    setTimeout(() => container.remove(), 4000);
  }

  // ============================================
  // RETAILER-SPECIFIC CONFIGURATIONS
  // ============================================
  const RETAILER_CONFIGS = {
    // Amazon - Enhanced detection
    amazon: {
      patterns: [/amazon\.(com|ca|co\.uk|de|fr|es|it|co\.jp)/i],
      selectors: {
        addToCart: '#add-to-cart-button, #add-to-cart-button-ubb, [name="submit.add-to-cart"], input[name="submit.add-to-cart"], #add-to-cart-button input, .a-button-input[name*="add-to-cart"], #submit\\.add-to-cart, form[action*="/cart/add"] input[type="submit"], span[id="submit.add-to-cart"], .a-button-inner',
        checkout: '#sc-buy-box-ptc-button, [name="proceedToRetailCheckout"], .checkout-button, #submitOrderButtonId, .place-your-order-button, [data-action="checkout"], #proceed-to-checkout-action input, .a-button-input[aria-labelledby*="checkout"], #sc-buy-box input, .proceed-to-checkout-button',
        buyNow: '#buy-now-button, #one-click-button, .turbo-checkout-button, #turbo-checkout-pyo-button, input[name="submit.buy-now"], #buy-now-button-announce'
      },
      productExtractor: () => ({
        title: document.querySelector('#productTitle, #title')?.textContent?.trim() || 
               document.querySelector('meta[property="og:title"]')?.content || 'Amazon Product',
        price: document.querySelector('.a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice, .a-price-whole')?.textContent?.replace(/[^0-9.]/g, '') || 
               document.querySelector('meta[property="product:price:amount"]')?.content || '0.00',
        image: document.querySelector('#landingImage, #imgBlkFront, #main-image')?.src || 
               document.querySelector('meta[property="og:image"]')?.content || '',
        currency: 'USD'
      })
    },

    // Walmart
    walmart: {
      patterns: [/walmart\.(com|ca)/i],
      selectors: {
        addToCart: '[data-automation-id="atc-button"], button[data-tl-id="ProductPrimaryCTA-cta_add_to_cart_button"], .add-to-cart-btn, [data-testid="add-to-cart-button"]',
        checkout: '[data-automation-id="checkout-button"], .checkout-btn, button[data-testid="checkout-button"]',
        buyNow: '[data-automation-id="buy-now-button"]'
      },
      productExtractor: () => ({
        title: document.querySelector('h1[itemprop="name"], h1.prod-ProductTitle')?.textContent?.trim() ||
               document.querySelector('meta[property="og:title"]')?.content || 'Walmart Product',
        price: document.querySelector('[itemprop="price"], .price-characteristic, [data-automation-id="product-price"]')?.textContent?.replace(/[^0-9.]/g, '') ||
               document.querySelector('meta[property="product:price:amount"]')?.content || '0.00',
        image: document.querySelector('meta[property="og:image"]')?.content || '',
        currency: 'USD'
      })
    },

    // Target
    target: {
      patterns: [/target\.com/i],
      selectors: {
        addToCart: '[data-test="shippingButton"], [data-test="orderPickupButton"], button[data-test="addToCartButton"], .AddToCartButton',
        checkout: '[data-test="checkout-button"], .checkout-button',
        buyNow: '[data-test="buyItNowButton"]'
      },
      productExtractor: () => ({
        title: document.querySelector('h1[data-test="product-title"], [data-test="product-title"]')?.textContent?.trim() ||
               document.querySelector('meta[property="og:title"]')?.content || 'Target Product',
        price: document.querySelector('[data-test="product-price"]')?.textContent?.replace(/[^0-9.]/g, '') ||
               document.querySelector('meta[property="product:price:amount"]')?.content || '0.00',
        image: document.querySelector('meta[property="og:image"]')?.content || '',
        currency: 'USD'
      })
    },

    // Best Buy
    bestbuy: {
      patterns: [/bestbuy\.(com|ca)/i],
      selectors: {
        addToCart: '.add-to-cart-button, [data-button-state="ADD_TO_CART"], .fulfillment-add-to-cart-button button',
        checkout: '.checkout-buttons__checkout button, [data-track="Checkout"]',
        buyNow: ''
      },
      productExtractor: () => ({
        title: document.querySelector('.sku-title h1, .heading-5.v-fw-regular')?.textContent?.trim() ||
               document.querySelector('meta[property="og:title"]')?.content || 'Best Buy Product',
        price: document.querySelector('.priceView-customer-price span, [data-testid="customer-price"] span')?.textContent?.replace(/[^0-9.]/g, '') ||
               document.querySelector('meta[property="product:price:amount"]')?.content || '0.00',
        image: document.querySelector('meta[property="og:image"]')?.content || '',
        currency: 'USD'
      })
    },

    // Shopify (generic)
    shopify: {
      patterns: [/myshopify\.com/i],
      detectFn: () => !!(window.Shopify || document.querySelector('meta[name="shopify-checkout-api-token"]') || document.querySelector('[data-shopify]')),
      selectors: {
        addToCart: 'form[action="/cart/add"] button[type="submit"], button[name="add"], .product-form__submit, .btn-add-to-cart, [data-add-to-cart]',
        checkout: 'button[name="checkout"], input[name="checkout"], .cart__checkout-button, [name="checkout"]',
        buyNow: '.shopify-payment-button button, .shopify-payment-button__button, [data-shopify-pay]'
      },
      productExtractor: () => ({
        title: document.querySelector('meta[property="og:title"]')?.content || 'Product',
        price: document.querySelector('meta[property="og:price:amount"]')?.content || '0.00',
        image: document.querySelector('meta[property="og:image"]')?.content || '',
        currency: document.querySelector('meta[property="og:price:currency"]')?.content || 'USD'
      })
    },

    // Etsy
    etsy: {
      patterns: [/etsy\.com/i],
      selectors: {
        addToCart: '[data-add-to-cart-button], .add-to-cart-btn, button[data-selector="add-to-cart-button"]',
        checkout: '[data-selector="checkout-button"], .proceed-to-checkout',
        buyNow: '[data-buy-now]'
      },
      productExtractor: () => ({
        title: document.querySelector('h1[data-listing-title], h1.wt-text-body-01')?.textContent?.trim() ||
               document.querySelector('meta[property="og:title"]')?.content || 'Etsy Product',
        price: document.querySelector('[data-buy-box-region="price"] .currency-value, .wt-text-title-03')?.textContent?.replace(/[^0-9.]/g, '') ||
               document.querySelector('meta[property="product:price:amount"]')?.content || '0.00',
        image: document.querySelector('meta[property="og:image"]')?.content || '',
        currency: 'USD'
      })
    },

    // eBay
    ebay: {
      patterns: [/ebay\.(com|ca)/i],
      selectors: {
        addToCart: '[data-testid="x-atc-action"] button, #atcBtn_btn_1, .x-atc-action button, a[data-testid="ux-call-to-action"]',
        checkout: '#binBtn_btn, [data-testid="x-bin-action"] button, .ux-bin-action button',
        buyNow: '#binBtn_btn, [data-testid="x-bin-action"] button, #binBtn_btn_1'
      },
      productExtractor: () => ({
        title: document.querySelector('h1.x-item-title__mainTitle span, h1[itemprop="name"]')?.textContent?.trim() ||
               document.querySelector('meta[property="og:title"]')?.content || 'eBay Product',
        price: document.querySelector('.x-price-primary span, [itemprop="price"]')?.textContent?.replace(/[^0-9.]/g, '') ||
               document.querySelector('meta[property="product:price:amount"]')?.content || '0.00',
        image: document.querySelector('meta[property="og:image"]')?.content || '',
        currency: 'USD'
      })
    },

    // Nike
    nike: {
      patterns: [/nike\.com/i],
      selectors: {
        addToCart: '[data-testid="add-to-cart-btn"], button[aria-label="Add to Bag"], .add-to-cart-btn',
        checkout: '[data-testid="checkout-button"]',
        buyNow: ''
      },
      productExtractor: () => ({
        title: document.querySelector('h1[data-testid="product_title"], h1#pdp_product_title')?.textContent?.trim() ||
               document.querySelector('meta[property="og:title"]')?.content || 'Nike Product',
        price: document.querySelector('[data-testid="currentPrice-container"], .product-price')?.textContent?.replace(/[^0-9.]/g, '') ||
               document.querySelector('meta[property="product:price:amount"]')?.content || '0.00',
        image: document.querySelector('meta[property="og:image"]')?.content || '',
        currency: 'USD'
      })
    },

    // Sephora
    sephora: {
      patterns: [/sephora\.com/i],
      selectors: {
        addToCart: '[data-at="add_to_basket"], button[data-comp="AddToBasket"], .css-1h1d5d0',
        checkout: '[data-at="checkout_button"]',
        buyNow: ''
      },
      productExtractor: () => ({
        title: document.querySelector('[data-at="product_name"], .css-1pv3fz')?.textContent?.trim() ||
               document.querySelector('meta[property="og:title"]')?.content || 'Sephora Product',
        price: document.querySelector('[data-at="price"], .css-1h1d5d0')?.textContent?.replace(/[^0-9.]/g, '') ||
               document.querySelector('meta[property="product:price:amount"]')?.content || '0.00',
        image: document.querySelector('meta[property="og:image"]')?.content || '',
        currency: 'USD'
      })
    },

    // Home Depot
    homedepot: {
      patterns: [/homedepot\.(com|ca)/i],
      selectors: {
        addToCart: '.add-to-cart button, [data-testid="add-to-cart"], .bttn--add-to-cart',
        checkout: '[data-testid="checkout-button"], .cart-checkout-button',
        buyNow: ''
      },
      productExtractor: () => ({
        title: document.querySelector('h1.product-title, .product-details__title')?.textContent?.trim() ||
               document.querySelector('meta[property="og:title"]')?.content || 'Home Depot Product',
        price: document.querySelector('.price-format__main-price, [data-testid="price-value"]')?.textContent?.replace(/[^0-9.]/g, '') ||
               document.querySelector('meta[property="product:price:amount"]')?.content || '0.00',
        image: document.querySelector('meta[property="og:image"]')?.content || '',
        currency: 'USD'
      })
    },

    // Costco
    costco: {
      patterns: [/costco\.(com|ca)/i],
      selectors: {
        addToCart: '#add-to-cart-btn, .add-to-cart, [data-action="add-to-cart"]',
        checkout: '#shopCartCheckoutSubmitButton, .checkout-btn',
        buyNow: ''
      },
      productExtractor: () => ({
        title: document.querySelector('h1[itemprop="name"], .product-title')?.textContent?.trim() ||
               document.querySelector('meta[property="og:title"]')?.content || 'Costco Product',
        price: document.querySelector('.your-price .value, #pull-right-price')?.textContent?.replace(/[^0-9.]/g, '') ||
               document.querySelector('meta[property="product:price:amount"]')?.content || '0.00',
        image: document.querySelector('meta[property="og:image"]')?.content || '',
        currency: 'USD'
      })
    },

    // Nordstrom
    nordstrom: {
      patterns: [/nordstrom\.com/i],
      selectors: {
        addToCart: '[data-element="add-to-bag-button"], button[name="addToBag"]',
        checkout: '[data-element="checkout-button"]',
        buyNow: ''
      },
      productExtractor: () => ({
        title: document.querySelector('h1[data-element="product-title"]')?.textContent?.trim() ||
               document.querySelector('meta[property="og:title"]')?.content || 'Nordstrom Product',
        price: document.querySelector('[data-element="sale-price"], [data-element="regular-price"]')?.textContent?.replace(/[^0-9.]/g, '') ||
               document.querySelector('meta[property="product:price:amount"]')?.content || '0.00',
        image: document.querySelector('meta[property="og:image"]')?.content || '',
        currency: 'USD'
      })
    },

    // Macy's
    macys: {
      patterns: [/macys\.com/i],
      selectors: {
        addToCart: '[data-auto="add-to-bag"], .add-to-bag-button',
        checkout: '[data-auto="checkout-button"]',
        buyNow: ''
      },
      productExtractor: () => ({
        title: document.querySelector('[data-auto="product-name"], .product-title')?.textContent?.trim() ||
               document.querySelector('meta[property="og:title"]')?.content || "Macy's Product",
        price: document.querySelector('[data-auto="product-price"], .price .lowest-sale-price')?.textContent?.replace(/[^0-9.]/g, '') ||
               document.querySelector('meta[property="product:price:amount"]')?.content || '0.00',
        image: document.querySelector('meta[property="og:image"]')?.content || '',
        currency: 'USD'
      })
    }
  };

  // ============================================
  // UNIVERSAL FALLBACK SELECTORS
  // ============================================
  const UNIVERSAL_SELECTORS = {
    addToCart: [
      // Common class names
      '.add-to-cart', '.addtocart', '.add-to-bag', '.addtobag', '.add-to-basket',
      '.btn-add-to-cart', '.btn-addtocart', '.add-cart-btn', '.atc-button',
      '.product-add-to-cart', '.pdp-add-to-cart', '.add-to-cart-button',
      // IKEA
      '.pip-buy-module__button', '[data-testid="add-to-bag"]', '.js-buy-module-button',
      // Wayfair - multiple variations
      '[data-enzyme-id="PdpAddToCart"]', '[data-hb-id="AddToCartButton"]', '.ProductAddToCart',
      '.AddToCartButton', '.add-to-cart-wrapper button', '[class*="AddToCart"]',
      'button[data-codeception-id="add-to-cart"]',
      // Adidas, Nike, and sportswear sites
      '[data-auto-id="add-to-bag"]', '[data-auto-id="add-to-cart"]',
      '.gl-cta', '.add-to-bag-btn', '.buying-tools-cta',
      // Button text patterns (aria-labels)
      'button[aria-label*="add to cart" i]', 'button[aria-label*="add to bag" i]',
      'button[aria-label*="add to basket" i]', 'button[aria-label*="add to shopping" i]',
      '[aria-label*="add to cart" i]', '[aria-label*="add to bag" i]',
      // Data attributes
      '[data-action="add-to-cart"]', '[data-button="add-to-cart"]', '[data-testid*="add-to-cart" i]',
      '[data-automation*="add" i][data-automation*="cart" i]',
      '[data-test*="add" i][data-test*="cart" i]',
      // Form submits for cart
      'form[action*="cart"] button[type="submit"]', 'form[action*="bag"] button[type="submit"]',
      // Generic button with cart-related IDs
      '#add-to-cart', '#addToCart', '#add-to-bag', '#addToBag',
      // Icon buttons with cart class
      '.cart-icon', '.shopping-cart-icon', '[class*="addToCart"]', '[class*="add-to-cart"]'
    ].join(', '),
    
    checkout: [
      // Common class names
      '.checkout-btn', '.checkout-button', '.proceed-to-checkout', '.go-to-checkout',
      '.btn-checkout', '.cart-checkout', '.secure-checkout', '.continue-checkout',
      // IKEA / Wayfair
      '[data-testid="checkout-button"]', '[data-testid*="checkout" i]',
      '[data-enzyme-id*="checkout" i]', '[data-hb-id*="checkout" i]',
      '[class*="Checkout"]', '[class*="checkout"]',
      'button[data-codeception-id*="checkout"]',
      // Button text patterns
      'button[aria-label*="checkout" i]', 'button[aria-label*="check out" i]',
      'a[aria-label*="checkout" i]', '[aria-label*="continue to checkout" i]',
      // Data attributes
      '[data-action="checkout"]', '[data-automation*="checkout" i]',
      '[data-auto-id*="checkout" i]',
      // Input submits
      'input[value*="checkout" i][type="submit"]', 'input[value*="check out" i][type="submit"]',
      // IDs
      '#checkout', '#checkoutButton', '#proceed-to-checkout', '#continue-to-checkout'
    ].join(', '),
    
    buyNow: [
      '.buy-now', '.buynow', '.buy-it-now', '.instant-buy',
      'button[aria-label*="buy now" i]', 'button[aria-label*="buy it now" i]',
      '[data-action="buy-now"]', '[data-testid*="buy-now" i]',
      '#buy-now', '#buyNow'
    ].join(', ')
  };

  // ============================================
  // STATE
  // ============================================
  let isModalActive = false;
  let pendingElement = null;
  let productData = null;
  let currentRetailer = null;
  let shameSentence = '';
  let isLoadingSentence = false;

  // ============================================
  // RETAILER DETECTION
  // ============================================
  function detectRetailer() {
    const hostname = window.location.hostname;
    
    for (const [name, config] of Object.entries(RETAILER_CONFIGS)) {
      // Check URL patterns
      if (config.patterns?.some(pattern => pattern.test(hostname))) {
        return { name, config };
      }
      // Check custom detection function
      if (config.detectFn?.()) {
        return { name, config };
      }
    }
    
    return null;
  }

  // ============================================
  // PRODUCT DATA EXTRACTION
  // ============================================
  function extractProductData() {
    // Try retailer-specific extractor first
    if (currentRetailer?.config?.productExtractor) {
      try {
        const data = currentRetailer.config.productExtractor();
        if (data.title && data.title !== 'Product') {
          return data;
        }
      } catch (e) {
        // Retailer extractor failed, use fallback
      }
    }
    
    // Universal extraction
    const price = extractPriceFromPage();
    const title = extractTitleFromPage();
    
    return {
      title: title,
      price: price,
      image: document.querySelector('meta[property="og:image"]')?.content ||
             document.querySelector('meta[name="twitter:image"]')?.content || '',
      currency: document.querySelector('meta[property="product:price:currency"]')?.content ||
                document.querySelector('meta[property="og:price:currency"]')?.content || 'USD',
      priceUnknown: !price || price === '0' || price === '0.00'
    };
  }

  /**
   * Extract checkout/cart data - tries to find cart total
   * Used when user clicks checkout button (not single product)
   */
  function extractCheckoutData() {
    let cartTotal = null;
    
    // Try to find cart total on the page
    const cartTotalSelectors = [
      // Common cart total selectors
      '.cart-total', '.cart__total', '#cart-total', '[data-cart-total]',
      '.order-total', '.grand-total', '.subtotal-price',
      '.cart-subtotal', '.cart-summary-total',
      // Amazon specific
      '#sc-subtotal-amount-activecart', '.sc-subtotal-activecart',
      '#sc-subtotal-amount-buybox', '.a-color-price.hlb-price',
      // Shopify
      '.cart__subtotal', '.cart-subtotal-price',
      // Generic patterns
      '[class*="cart"][class*="total"]', '[class*="order"][class*="total"]',
      '[class*="subtotal"]', '[class*="grand-total"]'
    ];
    
    for (const selector of cartTotalSelectors) {
      try {
        const el = document.querySelector(selector);
        if (el) {
          const price = extractPriceFromElement(el);
          if (price && parseFloat(price) > 0) {
            cartTotal = price;
            break;
          }
        }
      } catch (e) {}
    }
    
    // If no cart total found, try looking for any prominent price near checkout
    if (!cartTotal) {
      const checkoutArea = document.querySelector('.checkout, .cart, #cart, [data-cart], .order-summary, .cart-summary');
      if (checkoutArea) {
        cartTotal = extractPriceFromElement(checkoutArea);
      }
    }
    
    return {
      title: 'Your Shopping Cart',
      price: cartTotal,
      image: '', // No single product image for checkout
      currency: document.querySelector('meta[property="product:price:currency"]')?.content || 'USD',
      isCheckout: true,
      priceUnknown: !cartTotal
    };
  }

  function extractTitleFromPage() {
    // Try various sources for product title
    return document.querySelector('meta[property="og:title"]')?.content ||
           document.querySelector('meta[name="twitter:title"]')?.content ||
           document.querySelector('h1')?.textContent?.trim()?.substring(0, 100) ||
           document.title?.split('|')[0]?.split('-')[0]?.trim() || 
           'this item';
  }

  function extractPriceFromPage() {
    // Method 1: Meta tags (most reliable when present)
    const metaPrice = document.querySelector('meta[property="product:price:amount"]')?.content ||
                      document.querySelector('meta[property="og:price:amount"]')?.content;
    if (metaPrice && parseFloat(metaPrice) > 0) {
      return metaPrice;
    }
    
    // Method 2: Schema.org / JSON-LD
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent);
        const price = findPriceInJsonLd(data);
        if (price) return price;
      } catch (e) {}
    }
    
    // Method 3: Common price selectors (expanded list)
    const priceSelectors = [
      // Schema.org
      '[itemprop="price"]',
      '[itemprop="price"] .amount',
      // Common class names
      '.price', '.product-price', '.sale-price', '.current-price', '.now-price',
      '.price-current', '.price-now', '.final-price', '.actual-price',
      '.product__price', '.pdp-price', '.buy-price',
      // Data attributes
      '[data-price]', '[data-product-price]', '[data-current-price]',
      // Specific sites patterns
      '.priceView-customer-price span',  // Best Buy
      '.a-price .a-offscreen',  // Amazon
      '[data-test="product-price"]',
      '[data-automation="product-price"]',
      '.ProductPrice', '.productPrice',
      // Sale/regular price containers
      '.price-box .price', '.price-wrapper .price',
      '.pricing .price', '.product-info .price'
    ];
    
    for (const selector of priceSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        const price = extractPriceFromElement(el);
        if (price) return price;
      }
    }
    
    // Method 4: Regex scan for price patterns near "price" text
    const priceContainers = document.querySelectorAll('[class*="price" i], [class*="Price" i], [id*="price" i]');
    for (const el of priceContainers) {
      const price = extractPriceFromElement(el);
      if (price) return price;
    }
    
    // Method 5: Last resort - find any currency pattern on page near product info
    const mainContent = document.querySelector('main, [role="main"], .product, .pdp, #product');
    if (mainContent) {
      const price = extractPriceFromElement(mainContent);
      if (price) return price;
    }
    
    return null;
  }
  
  function extractPriceFromElement(el) {
    const text = el.textContent || el.getAttribute('data-price') || el.getAttribute('content') || '';
    // Match price patterns: $123.45, £99.99, €50, 1,234.56, etc.
    const match = text.match(/[$£€¥₹]?\s*[\d,]+\.?\d{0,2}/);
    if (match) {
      const priceStr = match[0].replace(/[$£€¥₹\s,]/g, '');
      const price = parseFloat(priceStr);
      if (price > 0 && price < 100000) { // Sanity check
        return price.toFixed(2);
      }
    }
    return null;
  }
  
  function findPriceInJsonLd(data) {
    if (!data) return null;
    
    // Handle arrays
    if (Array.isArray(data)) {
      for (const item of data) {
        const price = findPriceInJsonLd(item);
        if (price) return price;
      }
      return null;
    }
    
    // Check for price directly
    if (data.price) {
      const p = parseFloat(data.price);
      if (p > 0) return p.toFixed(2);
    }
    
    // Check offers
    if (data.offers) {
      const offers = Array.isArray(data.offers) ? data.offers : [data.offers];
      for (const offer of offers) {
        if (offer.price) {
          const p = parseFloat(offer.price);
          if (p > 0) return p.toFixed(2);
        }
      }
    }
    
    return null;
  }

  // ============================================
  // BUTTON DETECTION - STRICT APPROACH
  // ============================================
  
  /**
   * KEY INSIGHT: We should NOT walk up DOM looking for text matches.
   * Instead, find the closest BUTTON/INPUT element and check ONLY its direct text.
   * This prevents matching product cards that contain cart buttons.
   */

  // Exact phrases for cart/checkout (lowercase)
  // Checkout phrases - these are the final step before payment
  const CHECKOUT_PHRASES = [
    'checkout', 'check out',
    'proceed to checkout', 'continue to checkout', 'go to checkout',
    'place order', 'place your order', 'submit order',
    'complete order', 'complete purchase',
    'pay now', 'pay with', 'confirm order', 'confirm purchase',
    'buy now', 'buy it now', 'buy with',
    'complete payment', 'proceed to payment', 'continue to payment'
  ];

  // Add to cart phrases - these add items but don't complete purchase
  const ADD_TO_CART_PHRASES = [
    'add to cart', 'add to bag', 'add to basket',
    'add to shopping cart', 'add item', 'add to trolley'
  ];

  // Combined for general detection
  const ALL_CART_PHRASES = [...CHECKOUT_PHRASES, ...ADD_TO_CART_PHRASES];

  /**
   * Check if an element is THE cart/checkout button itself
   * NOT a container that happens to contain one
   */
  function isCartButton(element) {
    if (!element) return false;
    
    const tagName = element.tagName?.toLowerCase();
    const id = (element.id || '').toLowerCase();
    // Handle SVG elements where className is SVGAnimatedString, not a string
    const className = (typeof element.className === 'string' ? element.className : element.className?.baseVal || '').toLowerCase();
    
    // Amazon-specific IDs - instant match (most reliable)
    if (id === 'add-to-cart-button' || 
        id === 'buy-now-button' ||
        id === 'submit.add-to-cart' ||
        id.includes('add-to-cart') ||
        id.includes('addtocart')) {
      return true;
    }
    
    // Amazon-specific classes
    if (className.includes('a-button-input') ||
        className.includes('add-to-cart') ||
        className.includes('addtocart')) {
      return true;
    }
    
    // Check parent/ancestor for Amazon button structure
    // Amazon wraps input in span#add-to-cart-button-ubb
    const amazonAncestor = element.closest('[id*="add-to-cart"], [id*="buy-now"]');
    if (amazonAncestor) {
      return true;
    }
    
    const isButtonElement = tagName === 'button' || 
                            tagName === 'input' ||
                            tagName === 'span' ||  // Amazon uses spans
                            element.getAttribute('role') === 'button' ||
                            element.getAttribute('type') === 'submit';
    
    // For non-button elements, only proceed if it has button-like classes
    const hasButtonClass = className.includes('btn') || 
                           className.includes('button') ||
                           className.includes('checkout') ||
                           className.includes('a-button');  // Amazon class
    
    if (!isButtonElement && !hasButtonClass) {
      return false;
    }

    try {
      // Get the button's own text (prefer specific attributes)
      const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase().trim();
      const value = (element.value || '').toLowerCase().trim();
      const title = (element.getAttribute('title') || '').toLowerCase().trim();
      
      // For textContent, get direct text only (not nested elements with lots of text)
      let directText = '';
      for (const node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          directText += node.textContent;
        }
      }
      directText = directText.toLowerCase().replace(/\s+/g, ' ').trim();
      
      // If no direct text, use full textContent but only if short
      let fullText = (element.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
      
      // Pick the best text source
      let buttonText = ariaLabel || value || title || directText;
      if (!buttonText && fullText.length <= 25) {
        buttonText = fullText;
      }
      
      // No usable text
      if (!buttonText || buttonText.length < 6 || buttonText.length > 30) {
        return false;
      }

      // Check for exact/close match with cart phrases
      for (const phrase of ALL_CART_PHRASES) {
        if (buttonText === phrase || 
            buttonText.startsWith(phrase + ' ') ||
            buttonText.startsWith(phrase + '-') ||
            buttonText.endsWith(' ' + phrase) ||
            buttonText.endsWith('-' + phrase)) {
          return true;
        }
      }
      
      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Find the actual button element from a click target
   * Only walks up to find the containing BUTTON element, not arbitrary containers
   */
  function findButtonElement(target) {
    let element = target;
    let depth = 0;
    
    // First check: Is the target itself an Amazon button?
    const targetId = (target.id || '').toLowerCase();
    // Handle SVG elements where className is SVGAnimatedString, not a string
    const targetClass = (typeof target.className === 'string' ? target.className : target.className?.baseVal || '').toLowerCase();
    if (targetId.includes('add-to-cart') || 
        targetId.includes('buy-now') ||
        targetClass.includes('a-button-input')) {
      return target;
    }
    
    // Check if we clicked inside an Amazon button structure
    // Look for the input element which is the actual button
    const amazonInput = target.closest('.a-button')?.querySelector('input.a-button-input, input[id*="add-to-cart"], input[id*="buy-now"]');
    if (amazonInput) {
      return amazonInput;
    }
    
    // Also check for direct ancestor match
    const amazonButton = target.closest('[id*="add-to-cart"], [id*="buy-now"], [id*="addtocart"]');
    if (amazonButton) {
      return amazonButton;
    }
    
    // Walk up max 5 levels to find the actual button
    while (element && element !== document.body && depth < 5) {
      const tagName = element.tagName?.toLowerCase();
      const id = (element.id || '').toLowerCase();
      // Handle SVG elements where className is SVGAnimatedString, not a string
      const className = (typeof element.className === 'string' ? element.className : element.className?.baseVal || '').toLowerCase();
      
      // Amazon-specific: their buttons have specific IDs or classes
      if (id.includes('add-to-cart') || 
          id.includes('addtocart') ||
          id.includes('buy-now') ||
          className.includes('a-button-input')) {
        return element;
      }
      
      // Stop at actual button elements
      if (tagName === 'button' || 
          tagName === 'input' ||
          element.getAttribute('role') === 'button') {
        return element;
      }
      
      // Stop at links (don't go above them)
      if (tagName === 'a') {
        return element;
      }
      
      element = element.parentElement;
      depth++;
    }
    
    return null;
  }

  function getButtonType(element) {
    const text = (
      (element.textContent || '') + ' ' + 
      (element.getAttribute('aria-label') || '') + ' ' +
      (element.getAttribute('title') || '') + ' ' +
      (element.value || '')
    ).toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Check against checkout phrases first (they take priority)
    for (const phrase of CHECKOUT_PHRASES) {
      if (text.includes(phrase)) {
        return 'checkout';
      }
    }
    
    // Check against add-to-cart phrases
    for (const phrase of ADD_TO_CART_PHRASES) {
      if (text.includes(phrase)) {
        return 'addToCart';
      }
    }
    
    // Default to addToCart for unknown buttons
    return 'addToCart';
  }

  // ============================================
  // ROAST GENERATOR
  // ============================================
  async function generateRoast(productInfo) {
    // Easter Egg: Check for meme numbers first ($69, $420, etc.)
    const memeResponse = getMemeNumberResponse(productInfo.price);
    if (memeResponse) {
      // 50% chance to use meme response instead of regular roast
      if (Math.random() < 0.5) {
        return memeResponse;
      }
    }
    
    // Easter Egg: Check for gaming products
    if (isGamingProduct(productInfo.title)) {
      // 40% chance to use gaming-specific roast
      if (Math.random() < 0.4) {
        return getGamingRoast();
      }
    }
    
    return new Promise((resolve) => {
      try {
        if (!chrome.runtime?.id) {
          resolve(getRandomFallbackSentence(productInfo));
          return;
        }
        chrome.runtime.sendMessage({
          type: 'GET_ROAST',
          data: productInfo
        }, (response) => {
          if (chrome.runtime.lastError) {
            resolve(getRandomFallbackSentence(productInfo));
            return;
          }
          if (response?.sentence) {
            resolve(response.sentence);
          } else {
            resolve(getRandomFallbackSentence(productInfo));
          }
        });
      } catch (e) {
        resolve(getRandomFallbackSentence(productInfo));
      }
    });
  }

  function getRandomFallbackSentence(productInfo) {
    const price = parseFloat(productInfo.price) || 0;
    const hasPrice = price > 0;
    
    // Sentences that work with or without price
    const fallbacksWithPrice = [
      `I am about to spend $${price.toFixed(2)} on something I probably don't need.`,
      `My bank account disapproves of this $${price.toFixed(2)} decision.`,
      `I could save $${price.toFixed(2)} right now by simply closing this tab.`
    ];
    
    const fallbacksWithoutPrice = [
      `I solemnly swear this purchase is necessary and not just retail therapy.`,
      `Future me will definitely not regret spending this money.`,
      `I have thought about this for more than 30 seconds and still want it.`,
      `I am making a conscious choice to buy this, not an impulsive one.`,
      `My wallet asked me to reconsider, and I said no.`
    ];
    
    const fallbacks = hasPrice 
      ? [...fallbacksWithPrice, ...fallbacksWithoutPrice]
      : fallbacksWithoutPrice;
      
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  // ============================================
  // STATS TRACKING
  // ============================================
  async function trackEvent(eventType, data = {}) {
    try {
      await chrome.runtime.sendMessage({
        type: eventType,
        data: {
          ...data,
          retailer: currentRetailer?.name || 'unknown',
          url: window.location.href,
          timestamp: Date.now()
        }
      });
    } catch (e) {
      // Failed to track event
    }
  }

  // ============================================
  // CHECK IF SHOULD TRIGGER
  // ============================================
  function shouldTriggerFor(buttonType) {
    // Default to 'checkout' - less intrusive by default
    const triggerSetting = userSettings.triggerOn || 'checkout';
    
    // Both = trigger on everything
    if (triggerSetting === 'both') return true;
    
    // Add to cart only = only trigger on add to cart buttons
    if (triggerSetting === 'addToCart' && buttonType === 'addToCart') return true;
    
    // Checkout only (default) = trigger on checkout/buy now buttons
    if (triggerSetting === 'checkout' && buttonType === 'checkout') return true;
    
    return false;
  }

  // ============================================
  // MODAL
  // ============================================
  let currentButtonType = 'addToCart'; // Track what type of button was clicked
  
  async function createShameModal(buttonType) {
    if (isModalActive) return;
    
    // Trigger check is now done in handleClick before preventing the event
    // This function is only called when we definitely want to show the modal
    
    removeShameModal();
    isModalActive = true;
    isLoadingSentence = true;
    currentButtonType = buttonType; // Store for later use

    // For add-to-cart, extract product data from the page
    // For checkout, we show a different UI since we don't have single product info
    if (buttonType === 'addToCart') {
      productData = extractProductData();
    } else {
      // Checkout - try to get cart total if possible, otherwise generic
      productData = extractCheckoutData();
    }
    
    // Sound: Gavel hit on modal open
    playSound('gavel');
    
    // Voice: Announce detection
    speakShameIntro();
    
    // Track detection
    trackEvent('IMPULSE_DETECTED', { 
      product: productData.title, 
      price: productData.price,
      buttonType 
    });

    const modal = document.createElement('div');
    modal.id = 'impulse-judge-modal';
    modal.className = 'impulse-judge-overlay';

    // Show loading state first
    modal.innerHTML = createModalHTML(productData, '', true, buttonType);
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Fetch roast sentence
    try {
      shameSentence = await generateRoast(productData);
    } catch (e) {
      shameSentence = getRandomFallbackSentence(productData);
    }
    
    isLoadingSentence = false;
    
    // Update modal with sentence
    const modalContent = modal.querySelector('.impulse-judge-modal');
    if (modalContent) {
      modalContent.innerHTML = createModalInnerHTML(productData, shameSentence, false, buttonType);
      setupModalEventListeners();
      
      // Voice: Read the shame sentence aloud
      speakShameSentence(shameSentence);
    }
  }

  function createModalHTML(productData, sentence, isLoading, buttonType) {
    return `
      <div class="impulse-judge-modal">
        ${createModalInnerHTML(productData, sentence, isLoading, buttonType)}
      </div>
    `;
  }

  function createModalInnerHTML(productData, sentence, isLoading, buttonType) {
    const formattedPrice = formatPrice(productData.price, productData.currency);
    const isCheckout = buttonType === 'checkout';
    const numPrice = parseFloat(productData.price) || 0;
    
    // Calculate opportunity costs for psychological impact
    const opportunityCostHTML = numPrice > 0 ? generateOpportunityCostHTML(numPrice) : '';
    
    return `
      <div class="impulse-judge-header">
        <span class="impulse-judge-gavel">⚖️</span>
        <h1 class="impulse-judge-title">THE IMPULSE JUDGE</h1>
        <span class="impulse-judge-gavel">⚖️</span>
      </div>
      
      <!-- Googly Eyes that watch the user -->
      <div class="impulse-judge-eyes">
        <div class="judge-eye"><div class="judge-pupil"></div></div>
        <div class="judge-eye"><div class="judge-pupil"></div></div>
      </div>
      
      ${isCheckout ? `
        <!-- Checkout mode: Show cart summary instead of single product -->
        <div class="impulse-judge-product impulse-judge-checkout-summary">
          <div class="impulse-judge-cart-icon">🛒</div>
          <div class="impulse-judge-product-info">
            <p class="impulse-judge-product-title">🚨 About to checkout your cart!</p>
            ${productData.price && parseFloat(productData.price) > 0 
              ? `<p class="impulse-judge-product-price">Cart Total: ${formattedPrice}</p>`
              : `<p class="impulse-judge-product-price">Your entire shopping cart</p>`
            }
            ${opportunityCostHTML}
            <p class="impulse-judge-retailer">🏪 ${currentRetailer?.name || 'Online Store'}</p>
          </div>
        </div>
      ` : `
        <!-- Add to cart mode: Show specific product -->
        <div class="impulse-judge-product">
          ${productData.image ? `<img src="${productData.image}" alt="Product" class="impulse-judge-product-image" onerror="this.style.display='none'" />` : ''}
          <div class="impulse-judge-product-info">
            <p class="impulse-judge-product-title">${escapeHTML(productData.title)}</p>
            <p class="impulse-judge-product-price">${formattedPrice}</p>
            ${opportunityCostHTML}
            <p class="impulse-judge-retailer">🏪 ${currentRetailer?.name || 'Online Store'}</p>
          </div>
        </div>
      `}

      <div class="impulse-judge-verdict">
        <p class="impulse-judge-verdict-text">🚨 IMPULSE PURCHASE DETECTED 🚨</p>
        <p class="impulse-judge-instruction">To proceed with your questionable life choice, you must type the following sentence EXACTLY:</p>
      </div>

      ${isLoading ? `
        <div class="impulse-judge-shame-container">
          <div class="impulse-judge-loading">
            <span class="loading-spinner"></span>
            <span>Generating personalized roast...</span>
          </div>
        </div>
      ` : `
        <div class="impulse-judge-shame-container">
          <p class="impulse-judge-shame-sentence">"${escapeHTML(sentence)}"</p>
        </div>

        <div class="impulse-judge-input-container">
          <textarea 
            id="impulse-judge-input" 
            class="impulse-judge-input impulse-judge-input-glow" 
            placeholder="Type the shame sentence here... (no copy-paste allowed! 😈)"
            rows="3"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            onpaste="return false;"
            ondrop="return false;"
            oncontextmenu="return false;"
          ></textarea>
          <div class="impulse-judge-match-indicator" id="impulse-judge-indicator">
            <span class="indicator-text">⌨️ Awaiting your confession...</span>
          </div>
        </div>

        <div class="impulse-judge-buttons">
          <button id="impulse-judge-proceed" class="impulse-judge-btn impulse-judge-btn-proceed" disabled>
            😔 Accept My Shame
          </button>
          <button id="impulse-judge-cancel" class="impulse-judge-btn impulse-judge-btn-cancel impulse-judge-btn-cancel-pulse">
            💰 Keep My ${numPrice > 0 ? formattedPrice : 'Money'}
          </button>
        </div>
        
        <div class="impulse-judge-voice-row">
          <button id="impulse-judge-voice-toggle" class="impulse-judge-voice-btn${userSettings.voiceEnabled ? ' voice-on' : ''}" title="Toggle Judge's voice narration">
            ${userSettings.voiceEnabled ? '🔊' : '🔇'} Judge's Voice: ${userSettings.voiceEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      `}

      <div class="impulse-judge-footer-box">
        <p class="impulse-judge-footer">💰 Every impulse resisted is a victory for your wallet! 💪</p>
        <p class="impulse-judge-footer-sub">Your future self will thank you.</p>
      </div>
    `;
  }

  /**
   * Generate opportunity cost HTML to make price feel more real
   */
  function generateOpportunityCostHTML(price) {
    const costs = [];
    
    // Work hours at different wages
    const hourlyWage = 15; // Default hourly wage
    const workHours = Math.round(price / hourlyWage);
    if (workHours >= 1) {
      costs.push(`⏱️ ${workHours} hour${workHours > 1 ? 's' : ''} of work`);
    }
    
    // Coffee equivalent
    const coffeePrice = 5;
    const coffees = Math.round(price / coffeePrice);
    if (coffees >= 2) {
      costs.push(`☕ ${coffees} coffees`);
    }
    
    // Meal equivalent
    const mealPrice = 12;
    const meals = Math.round(price / mealPrice);
    if (meals >= 2 && price >= 20) {
      costs.push(`🍔 ${meals} meals`);
    }
    
    // Netflix months
    const netflixPrice = 15;
    const netflixMonths = Math.round(price / netflixPrice);
    if (netflixMonths >= 2) {
      costs.push(`📺 ${netflixMonths} months of streaming`);
    }
    
    // Pick the most impactful 2 comparisons
    const selectedCosts = costs.slice(0, 2);
    
    if (selectedCosts.length === 0) return '';
    
    return `<p class="impulse-judge-opportunity-cost">That's ${selectedCosts.join(' or ')}</p>`;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Format price with proper currency symbol
   * Returns empty string if price is unknown/zero
   */
  function formatPrice(price, currency, showUnknown = true) {
    const numPrice = parseFloat(price) || 0;
    
    // Handle unknown/zero price
    if (numPrice <= 0) {
      return showUnknown ? 'Price not detected' : '';
    }
    
    const currencySymbols = {
      'USD': '$',
      'CAD': 'C$',
      'GBP': '£',
      'EUR': '€',
      'AUD': 'A$',
      'JPY': '¥',
      'CNY': '¥',
      'INR': '₹',
      'MXN': 'MX$',
      'BRL': 'R$'
    };
    
    const symbol = currencySymbols[currency?.toUpperCase()] || '$';
    
    // Format with proper decimal places (no decimals for JPY)
    if (currency === 'JPY') {
      return `${symbol}${Math.round(numPrice).toLocaleString()}`;
    }
    return `${symbol}${numPrice.toFixed(2)}`;
  }

  function setupModalEventListeners() {
    const input = document.getElementById('impulse-judge-input');
    const proceedBtn = document.getElementById('impulse-judge-proceed');
    const cancelBtn = document.getElementById('impulse-judge-cancel');
    const indicator = document.getElementById('impulse-judge-indicator');

    if (!input || !proceedBtn || !cancelBtn) return;

    // Dynamic typing feedback state
    let lastInputTime = Date.now();
    let typingPauseTimer = null;
    let lastInputLength = 0;
    let errorCount = 0;
    let fastTypingCount = 0;

    // Prevent paste, drop, and context menu (no cheating!)
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      indicator.innerHTML = '<span class="indicator-error">🚫 No copy-paste allowed! Type it out, you cheater! 😈</span>';
      indicator.className = 'impulse-judge-match-indicator error';
    });

    input.addEventListener('drop', (e) => {
      e.preventDefault();
      indicator.innerHTML = '<span class="indicator-error">🚫 Nice try! No drag-and-drop either! 🙅</span>';
      indicator.className = 'impulse-judge-match-indicator error';
    });

    input.addEventListener('input', (e) => {
      const userInput = e.target.value.toLowerCase();
      const targetSentence = shameSentence.toLowerCase();
      const now = Date.now();
      const timeSinceLastInput = now - lastInputTime;
      
      // Track typing speed
      if (timeSinceLastInput < 50 && userInput.length > lastInputLength) {
        fastTypingCount++;
      }
      
      lastInputTime = now;
      lastInputLength = userInput.length;
      
      // Clear pause timer
      if (typingPauseTimer) {
        clearTimeout(typingPauseTimer);
      }
      
      if (userInput === targetSentence) {
        // SUCCESS - Match complete
        proceedBtn.disabled = false;
        indicator.innerHTML = '<span class="indicator-success">✅ Shame accepted. You may proceed... (Press Enter)</span>';
        indicator.className = 'impulse-judge-match-indicator success';
        errorCount = 0;
      } else if (targetSentence.startsWith(userInput)) {
        // PROGRESS - On the right track
        proceedBtn.disabled = true;
        
        // Dynamic progress messages based on behavior
        let progressMsg = '📝 Keep typing...';
        const progress = Math.round((userInput.length / targetSentence.length) * 100);
        
        if (fastTypingCount > 5) {
          progressMsg = '🏃 Desperate to spend, aren\'t we?';
          fastTypingCount = 0;
        } else if (progress > 75) {
          progressMsg = '😬 Almost there... feeling the shame yet?';
        } else if (progress > 50) {
          progressMsg = '📝 Halfway through your confession...';
        } else if (progress > 25) {
          progressMsg = '⌨️ The Judge watches you type...';
        }
        
        indicator.innerHTML = `<span class="indicator-progress">${progressMsg}</span>`;
        indicator.className = 'impulse-judge-match-indicator progress';
        
        // Set pause detection timer
        typingPauseTimer = setTimeout(() => {
          if (!proceedBtn.disabled) return; // Don't show if already matched
          const pauseMessages = [
            "🤔 Why did you stop? Rethinking your life choices?",
            "⏸️ Having second thoughts? Good.",
            "🧐 The Judge notices your hesitation...",
            "💭 Your wallet is silently thanking you for pausing.",
            "⚖️ The longer you wait, the wiser you become."
          ];
          const randomPause = pauseMessages[Math.floor(Math.random() * pauseMessages.length)];
          indicator.innerHTML = `<span class="indicator-progress">${randomPause}</span>`;
        }, 3000);
        
      } else {
        // ERROR - Doesn't match
        proceedBtn.disabled = true;
        errorCount++;
        
        // Dynamic error messages based on error count
        let errorMsg = '❌ That doesn\'t match! Try again.';
        
        if (errorCount >= 5) {
          errorMsg = '🤦 5 mistakes? Maybe this is a sign...';
        } else if (errorCount >= 3) {
          errorMsg = '❌ Still wrong. The Judge questions your commitment.';
        } else if (errorCount === 2) {
          errorMsg = '❌ Typo again? Read carefully.';
        }
        
        indicator.innerHTML = `<span class="indicator-error">${errorMsg}</span>`;
        indicator.className = 'impulse-judge-match-indicator error';
      }
    });

    // Keyboard shortcuts
    input.addEventListener('keydown', (e) => {
      // Enter key submits when text matches (and not Shift+Enter)
      if (e.key === 'Enter' && !e.shiftKey) {
        if (!proceedBtn.disabled) {
          e.preventDefault();
          proceedBtn.click();
        }
      }
    });

    proceedBtn.addEventListener('click', () => {
      // Sound: Shame accepted
      playSound('shame');
      
      trackEvent('IMPULSE_ACCEPTED', { 
        product: productData.title, 
        price: productData.price 
      });
      
      speakShameAccepted();
      removeShameModal();
      triggerOriginalAction();
    });

    cancelBtn.addEventListener('click', async () => {
      // Sound: Victory fanfare
      playSound('victory');
      
      // Track resistance and get stats for celebration
      let response = {};
      try {
        response = await new Promise((resolve, reject) => {
          if (!chrome.runtime?.id) {
            reject(new Error('Extension context invalidated'));
            return;
          }
          chrome.runtime.sendMessage({
            type: 'IMPULSE_RESISTED',
            data: { 
              product: productData.title, 
              price: productData.price 
            }
          }, resolve);
        });
      } catch (e) {
        // Extension was reloaded - just continue without tracking
      }
      
      removeShameModal();
      showVictoryMessage(response);
    });

    // Voice toggle button
    setupVoiceToggle();
    
    // Setup googly eyes that follow the cursor
    setupGooglyEyes();

    document.addEventListener('keydown', handleEscapeKey);
    setTimeout(() => input.focus(), 100);
  }
  
  /**
   * Make the googly eyes follow the mouse cursor
   */
  function setupGooglyEyes() {
    const eyes = document.querySelectorAll('.judge-eye');
    if (!eyes.length) return;
    
    // Use document-level mousemove for reliable tracking like the website
    // Store the handler so we can remove it when modal closes
    const eyeHandler = (e) => {
      eyes.forEach(eye => {
        const rect = eye.getBoundingClientRect();
        const eyeX = rect.left + rect.width / 2;
        const eyeY = rect.top + rect.height / 2;
        
        const angle = Math.atan2(e.clientY - eyeY, e.clientX - eyeX);
        const distance = 4; // How far the pupil can move
        
        const pupil = eye.querySelector('.judge-pupil');
        if (pupil) {
          const pupX = Math.cos(angle) * distance;
          const pupY = Math.sin(angle) * distance;
          pupil.style.transform = `translate(calc(-50% + ${pupX}px), calc(-50% + ${pupY}px))`;
        }
      });
    };
    
    document.addEventListener('mousemove', eyeHandler);
    
    // Store handler reference on the modal for cleanup
    const modal = document.getElementById('impulse-judge-modal');
    if (modal) {
      modal._eyeHandler = eyeHandler;
    }
  }

  /**
   * Setup voice toggle button
   */
  function setupVoiceToggle() {
    const voiceBtn = document.getElementById('impulse-judge-voice-toggle');
    if (!voiceBtn) return;

    voiceBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      userSettings.voiceEnabled = !userSettings.voiceEnabled;
      voiceBtn.innerHTML = userSettings.voiceEnabled ? "🔊 Judge's Voice: ON" : "🔇 Judge's Voice: OFF";
      
      // Toggle the visual class
      if (userSettings.voiceEnabled) {
        voiceBtn.classList.add('voice-on');
      } else {
        voiceBtn.classList.remove('voice-on');
      }
      
      // Save setting
      chrome.storage.sync.set({ settings: userSettings }).catch(() => {});
      
      // If turning on, speak a confirmation
      if (userSettings.voiceEnabled) {
        speakText("The Judge is listening");
      } else {
        // Stop any current speech
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      }
    });
  }

  /**
   * Setup share button functionality
   */
  function setupShareButtons() {
    const EXTENSION_URL = 'https://www.theimpulsejudge.com';
    const SHARE_TEXT = "🛒 This Chrome extension roasts me every time I try to impulse buy! My wallet thanks it. Try Impulse Buy Judge:";
    
    document.querySelectorAll('.impulse-judge-share-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const platform = btn.dataset.share;
        let shareUrl = '';
        
        switch(platform) {
          case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(EXTENSION_URL)}`;
            break;
          case 'facebook':
            // Facebook sharer doesn't support pre-filled text, only the URL
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(EXTENSION_URL)}`;
            break;
          case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT + ' ' + EXTENSION_URL)}`;
            break;
          case 'copy':
            navigator.clipboard.writeText(SHARE_TEXT + ' ' + EXTENSION_URL).then(() => {
              btn.innerHTML = '<span>✓</span>';
              btn.classList.add('copied');
              setTimeout(() => {
                btn.innerHTML = '<span>🔗</span>';
                btn.classList.remove('copied');
              }, 2000);
            });
            return;
        }
        
        if (shareUrl) {
          window.open(shareUrl, '_blank', 'width=600,height=400');
        }
        
        // Track share event
        trackEvent('EXTENSION_SHARED', { platform });
      });
    });
  }

  function handleEscapeKey(e) {
    if (e.key === 'Escape' && isModalActive) {
      trackEvent('IMPULSE_RESISTED', { 
        product: productData?.title, 
        price: productData?.price,
        method: 'escape'
      });
      removeShameModal();
    }
  }

  function removeShameModal() {
    const modal = document.getElementById('impulse-judge-modal');
    if (modal) {
      // Clean up googly eyes handler
      if (modal._eyeHandler) {
        document.removeEventListener('mousemove', modal._eyeHandler);
      }
      modal.remove();
    }
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleEscapeKey);
    isModalActive = false;
    isLoadingSentence = false;
  }

  function triggerOriginalAction() {
    // Give user 5 seconds to complete their purchase without modal showing again
    userApprovedUntil = Date.now() + 5000;
    
    if (pendingElement) {
      // Get element position for realistic event coordinates
      const rect = pendingElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Common event options for realistic simulation
      const eventOptions = {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: centerX,
        clientY: centerY,
        screenX: centerX,
        screenY: centerY,
        button: 0,
        buttons: 1
      };
      
      // Create and dispatch the FULL event sequence that browsers normally fire
      // This is critical for sites using React, Vue, or custom event handlers
      
      // 1. Pointer events (modern browsers)
      try {
        const pointerDown = new PointerEvent('pointerdown', {
          ...eventOptions,
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true
        });
        pendingElement.dispatchEvent(pointerDown);
      } catch (e) {
        // PointerEvent not supported in all contexts
      }
      
      // 2. Mouse events (traditional)
      const mouseDown = new MouseEvent('mousedown', eventOptions);
      pendingElement.dispatchEvent(mouseDown);
      
      // 3. Pointer up
      try {
        const pointerUp = new PointerEvent('pointerup', {
          ...eventOptions,
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true,
          buttons: 0
        });
        pendingElement.dispatchEvent(pointerUp);
      } catch (e) {}
      
      // 4. Mouse up
      const mouseUp = new MouseEvent('mouseup', { ...eventOptions, buttons: 0 });
      pendingElement.dispatchEvent(mouseUp);
      
      // 5. Click event (what .click() does, but with proper coordinates)
      const click = new MouseEvent('click', { ...eventOptions, buttons: 0 });
      pendingElement.dispatchEvent(click);
      
      // 6. Also call the native click() as a fallback
      // Some frameworks specifically check for trusted events or have onClick handlers
      pendingElement.click();
      
      // 7. If it's a link, try direct navigation as ultimate fallback
      if (pendingElement.tagName === 'A' && pendingElement.href) {
        setTimeout(() => {
          // Check if we're still on the same page (click didn't work)
          if (pendingElement && document.contains(pendingElement)) {
            window.location.href = pendingElement.href;
          }
        }, 500);
      }
      
      // 8. If it's a submit button in a form, try form submission
      if (pendingElement.type === 'submit' || pendingElement.tagName === 'BUTTON') {
        const form = pendingElement.closest('form');
        if (form) {
          setTimeout(() => {
            if (document.contains(form)) {
              // Dispatch submit event first (for frameworks)
              const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
              if (form.dispatchEvent(submitEvent)) {
                form.submit();
              }
            }
          }, 500);
        }
      }
      
      pendingElement = null;
    }
  }

  function showVictoryMessage(response = {}) {
    // Voice celebration
    speakVictory();
    
    const stats = response?.stats || {};
    const newAchievements = response?.newAchievements || [];
    const currentStreak = stats.streak || stats.currentStreak || 1;
    const totalSaved = stats.moneySaved || stats.totalSaved || 0;
    
    // Calculate saved amount
    const savedAmount = productData?.price ? parseFloat(productData.price) : 0;
    const formattedSaved = savedAmount > 0 ? `$${savedAmount.toFixed(2)}` : '';
    
    // Determine celebration level based on streak
    let celebration = {
      emoji: '🎉',
      title: 'You resisted!',
      subtitle: 'Your future self thanks you! 💰'
    };
    
    // Streak milestones
    if (currentStreak >= 100) {
      celebration = { emoji: '👑', title: 'LEGENDARY WILLPOWER!', subtitle: `${currentStreak} impulses resisted! You are unstoppable! 👑` };
    } else if (currentStreak >= 50) {
      celebration = { emoji: '🏆', title: 'INCREDIBLE STREAK!', subtitle: `${currentStreak} in a row! Iron willpower! 🏆` };
    } else if (currentStreak >= 25) {
      celebration = { emoji: '🔥', title: 'AMAZING STREAK!', subtitle: `${currentStreak} resisted! You're on fire! 🔥` };
    } else if (currentStreak >= 10) {
      celebration = { emoji: '⭐', title: 'GREAT STREAK!', subtitle: `${currentStreak} in a row! Keep going! ⭐` };
    } else if (currentStreak >= 5) {
      celebration = { emoji: '💪', title: 'NICE STREAK!', subtitle: `${currentStreak} resisted! Building momentum! 💪` };
    } else if (currentStreak >= 3) {
      celebration = { emoji: '🎯', title: 'STREAK STARTED!', subtitle: `${currentStreak} in a row! 🎯` };
    }

    // Create victory modal instead of just a toast
    const victoryModal = document.createElement('div');
    victoryModal.id = 'impulse-judge-victory-modal';
    victoryModal.className = 'impulse-judge-overlay impulse-judge-victory-overlay';
    
    // Build achievement badges if any new ones
    let achievementHTML = '';
    if (newAchievements.length > 0) {
      achievementHTML = `
        <div class="victory-achievements">
          <div class="victory-achievement-title">🏅 Achievement${newAchievements.length > 1 ? 's' : ''} Unlocked!</div>
          ${newAchievements.map(a => `
            <div class="victory-achievement">
              <span class="achievement-icon">${a.icon}</span>
              <span class="achievement-name">${a.name}</span>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    victoryModal.innerHTML = `
      <div class="impulse-judge-victory-modal">
        <div class="victory-emoji-large">${celebration.emoji}</div>
        <h2 class="victory-title">${celebration.title}</h2>
        <p class="victory-subtitle">${celebration.subtitle}</p>
        
        ${savedAmount > 0 ? `
          <div class="victory-savings">
            <div class="victory-savings-main">
              <span class="victory-savings-label">You just saved</span>
              <span class="victory-savings-amount">${formattedSaved}</span>
            </div>
            ${totalSaved > 0 ? `<p class="victory-savings-total">Total saved with The Judge: $${totalSaved.toFixed(2)}</p>` : ''}
          </div>
        ` : ''}
        
        ${achievementHTML}
        
        <div class="victory-share-section">
          <p class="victory-share-text">🎉 Proud? Share your victory!</p>
          <div class="victory-share-buttons">
            <button class="impulse-judge-share-btn victory-share-btn" data-share="twitter" title="Share on X/Twitter">
              <span>𝕏</span>
            </button>
            <button class="impulse-judge-share-btn victory-share-btn" data-share="facebook" title="Share on Facebook">
              <span>f</span>
            </button>
            <button class="impulse-judge-share-btn victory-share-btn" data-share="whatsapp" title="Share on WhatsApp">
              <span>💬</span>
            </button>
            <button class="impulse-judge-share-btn victory-share-btn" data-share="copy" title="Copy link">
              <span>🔗</span>
            </button>
          </div>
        </div>
        
        <div class="victory-coffee-section">
          <p class="victory-coffee-text">☕ I just saved you ${formattedSaved || 'money'}. Buy me a $3 coffee?</p>
          <a href="https://buymeacoffee.com/theimpulsejudge" target="_blank" class="victory-coffee-btn">
            ☕ Buy Me a Coffee
          </a>
        </div>
        
        <button class="victory-close-btn" onclick="this.closest('.impulse-judge-overlay').remove()">
          ✓ Close & Continue Saving
        </button>
      </div>
    `;
    
    document.body.appendChild(victoryModal);
    
    // Create confetti celebration AFTER modal is in DOM
    createConfetti(victoryModal);
    
    // Setup share buttons for victory modal
    setupShareButtons(victoryModal);
    
    // Don't auto-close - let user close manually via button

    pendingElement = null;
  }

  // ============================================
  // EVENT HANDLERS
  // ============================================
  
  // Track approval state
  let userApprovedUntil = 0; // Timestamp until which user is approved to click
  
  function handleClick(e) {
    // If modal is active, block all clicks except on modal itself
    if (isModalActive) {
      const modal = document.getElementById('impulse-judge-modal');
      if (modal && !modal.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }
    
    const now = Date.now();
    
    // If user recently approved via modal, let clicks through for 5 seconds
    if (now < userApprovedUntil) {
      return;
    }
    
    const target = e.target;
    
    // Find the actual button element (not a container)
    const buttonElement = findButtonElement(target);
    
    if (!buttonElement) {
      return; // Didn't click on a button
    }
    
    // Check if this button is a cart/checkout button
    if (!isCartButton(buttonElement)) {
      return; // Not a cart button
    }
    
    const buttonType = getButtonType(buttonElement);
    
    // Check if we should trigger for this button type
    if (!shouldTriggerFor(buttonType)) {
      return;
    }
    
    // PREVENT the click from going through
    e.preventDefault();
    e.stopPropagation();
    
    // Store the button and show modal
    pendingElement = buttonElement;
    createShameModal(buttonType);
  }
  
  // Pointerdown/mousedown fires BEFORE click - critical for catching fast clicks
  // This is the key to catching buttons before navigation starts
  function handlePointerDown(e) {
    if (isModalActive) {
      const modal = document.getElementById('impulse-judge-modal');
      if (modal && !modal.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
      return;
    }
    
    if (Date.now() < userApprovedUntil) return;
    
    const target = e.target;
    const buttonElement = findButtonElement(target);
    
    if (!buttonElement) return;
    if (!isCartButton(buttonElement)) return;
    
    const buttonType = getButtonType(buttonElement);
    if (!shouldTriggerFor(buttonType)) return;
    
    // PREVENT immediately - this is key for fast clickers
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    // Store the button and show modal
    pendingElement = buttonElement;
    createShameModal(buttonType);
  }

  function handleSubmit(e) {
    // If approved recently, let it through
    if (Date.now() < userApprovedUntil) return;
    
    if (isModalActive) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const form = e.target;
    const action = form.getAttribute('action') || '';
    
    // Check if it's a cart/checkout form
    if (action.includes('cart') || action.includes('checkout') || action.includes('bag') || action.includes('order')) {
      // Determine if this is checkout or add-to-cart based on action
      const buttonType = (action.includes('checkout') || action.includes('order')) ? 'checkout' : 'addToCart';
      
      // Respect trigger settings
      if (!shouldTriggerFor(buttonType)) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      const submitButton = form.querySelector('button[type="submit"], input[type="submit"]') || form;
      pendingElement = submitButton;
      createShameModal(buttonType);
    }
  }

  // ============================================
  // EASTER EGGS 🥚
  // ============================================
  
  // Easter Egg 1: Gaming Tax Detection
  // Special roasts for gaming products
  const GAMING_KEYWORDS = [
    'rgb', 'gaming chair', 'mechanical keyboard', 'gaming mouse', 'gaming headset',
    'gaming monitor', 'mousepad', 'razer', 'corsair', 'logitech g', 'steelseries',
    'hyperx', 'ducky', 'keychron', 'cherry mx', 'gateron', 'streaming', 'streamer'
  ];
  
  const GAMING_ROASTS = [
    "This won't make you better at the game. You'll just lose in 4K with better lighting.",
    "RGB doesn't add FPS to your life decisions.",
    "Your K/D ratio doesn't need this. Your bank account definitely doesn't.",
    "Pro gamers have sponsors. You have credit card debt.",
    "This setup won't fix your aim. Or your impulse control, apparently.",
    "You're not going pro. But you ARE going broke.",
    "No one went pro because of RGB. Put the card down."
  ];
  
  function isGamingProduct(title) {
    if (!title) return false;
    const lowerTitle = title.toLowerCase();
    return GAMING_KEYWORDS.some(keyword => lowerTitle.includes(keyword));
  }
  
  function getGamingRoast() {
    return GAMING_ROASTS[Math.floor(Math.random() * GAMING_ROASTS.length)];
  }
  
  // Easter Egg 2: Meme Number Detection ($69, $420)
  // Special messages for "nice" cart totals
  const MEME_NUMBERS = [
    { min: 69.00, max: 69.99, response: "Nice. You're technically bankrupt, but... Nice. 😏" },
    { min: 420.00, max: 420.99, response: "Nice. Blaze it... into financial ruin. 🌿" },
    { min: 69.69, max: 69.69, response: "Nice Nice. Double the meme, double the debt. 😏😏" },
    { min: 420.69, max: 420.69, response: "The legendary number. Your bank account is crying, but respect. 🌿😏" },
    { min: 666.00, max: 666.99, response: "The devil's checkout. Even Satan thinks you should reconsider. 😈" },
    { min: 1337.00, max: 1337.99, response: "L33T spending detected. Your wallet is not impressed. 🎮" }
  ];
  
  function getMemeNumberResponse(price) {
    if (!price) return null;
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return null;
    
    for (const meme of MEME_NUMBERS) {
      if (numPrice >= meme.min && numPrice <= meme.max) {
        return meme.response;
      }
    }
    return null;
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  async function init() {
    // Check if site is whitelisted/blacklisted first
    const siteEnabled = await checkSiteEnabled();
    if (!siteEnabled) {
      return;
    }
    
    // Load user settings first
    await loadSettings();
    
    // Try to detect specific retailer for optimized selectors
    currentRetailer = detectRetailer();
    
    // ALWAYS set up listeners - text-based detection will catch cart buttons on ANY site
    // This is the universal approach that works everywhere
    if (!currentRetailer) {
      currentRetailer = { name: 'Online Store', config: {} };
    }

    // Use multiple event types for maximum compatibility
    // Capture phase (true) ensures we run before site's handlers
    document.addEventListener('click', handleClick, true);
    document.addEventListener('submit', handleSubmit, true);
    
    // Listen on BOTH mousedown and pointerdown for earliest interception
    // This is critical for catching fast clickers before navigation starts
    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('pointerdown', handlePointerDown, true);

    // Observe DOM changes for dynamic content
    const observer = new MutationObserver(() => {
      // Buttons added dynamically will be caught by click handler
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

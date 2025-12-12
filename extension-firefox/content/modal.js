/**
 * Impulse Buy Judge - Modal UI (Firefox)
 * Handles the shame modal creation and interaction
 */

// Firefox/Chrome API compatibility (defined once in effects.js)
// eslint-disable-next-line no-undef
var browserAPI = typeof browserAPI !== 'undefined' ? browserAPI : (typeof browser !== 'undefined' ? browser : chrome);

/**
 * Safely set innerHTML using DOMParser to sanitize content.
 * This avoids Mozilla's "unsafe innerHTML" warnings.
 */
function safeSetHTML(element, htmlString) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${htmlString}</div>`, 'text/html');
  const content = doc.body.firstChild;
  while (content.firstChild) {
    element.appendChild(content.firstChild);
  }
}

// State
let isModalActive = false;
let pendingElement = null;
let productData = null;
let shameSentence = '';
let isLoadingSentence = false;
let currentButtonType = 'addToCart';
let userApprovedUntil = 0;

// ============================================
// EASTER EGGS 🥚
// ============================================

// Easter Egg 1: Promo Code Troll
// Easter Egg 1: Gaming Tax Detection
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

// Easter Egg 3: Meme Number Detection
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
// ROAST GENERATOR
// ============================================

async function generateRoast(productInfo) {
  // Easter Egg: Check for meme numbers first ($69, $420, etc.)
  const memeResponse = getMemeNumberResponse(productInfo.price);
  if (memeResponse) {
    if (Math.random() < 0.5) {
      return memeResponse;
    }
  }
  
  // Easter Egg: Check for gaming products
  if (isGamingProduct(productInfo.title)) {
    if (Math.random() < 0.4) {
      return getGamingRoast();
    }
  }
  
  return new Promise((resolve) => {
    browserAPI.runtime.sendMessage({
      type: 'GET_ROAST',
      data: productInfo
    }, (response) => {
      if (response?.sentence) {
        resolve(response.sentence);
      } else {
        resolve(getRandomFallbackSentence(productInfo));
      }
    });
  });
}

function getRandomFallbackSentence(productInfo) {
  const price = parseFloat(productInfo.price) || 0;
  const hasPrice = price > 0;
  
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

async function trackEvent(eventType, data = {}) {
  try {
    await browserAPI.runtime.sendMessage({
      type: eventType,
      data: {
        ...data,
        retailer: currentRetailer?.name || 'unknown',
        url: window.location.href,
        timestamp: Date.now()
      }
    });
  } catch (e) {
    // Tracking failed silently
  }
}

function shouldTriggerFor(buttonType) {
  const triggerSetting = userSettings.triggerOn || 'checkout';
  
  if (triggerSetting === 'both') return true;
  if (triggerSetting === 'addToCart' && buttonType === 'addToCart') return true;
  if (triggerSetting === 'checkout' && buttonType === 'checkout') return true;
  
  return false;
}

async function createShameModal(buttonType) {
  if (isModalActive) return;
  
  removeShameModal();
  isModalActive = true;
  isLoadingSentence = true;
  currentButtonType = buttonType;

  if (buttonType === 'addToCart') {
    productData = extractProductData();
  } else {
    productData = extractCheckoutData();
  }
  
  playSound('gavel');
  speakShameIntro();
  
  trackEvent('IMPULSE_DETECTED', { 
    product: productData.title, 
    price: productData.price,
    buttonType 
  });

  const modal = document.createElement('div');
  modal.id = 'impulse-judge-modal';
  modal.className = 'impulse-judge-overlay';

  safeSetHTML(modal, createModalHTML(productData, '', true, buttonType));
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  try {
    shameSentence = await generateRoast(productData);
  } catch (e) {
    shameSentence = getRandomFallbackSentence(productData);
  }
  
  isLoadingSentence = false;
  
  const modalContent = modal.querySelector('.impulse-judge-modal');
  if (modalContent) {
    safeSetHTML(modalContent, createModalInnerHTML(productData, shameSentence, false, buttonType));
    setupModalEventListeners();
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
  const price = parseFloat(productData.price) || 0;
  
  // Calculate opportunity cost for psychological impact
  const opportunityCostHTML = price > 0 ? generateOpportunityCostHTML(price) : '';
  
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
        ></textarea>
        <div class="impulse-judge-match-indicator" id="impulse-judge-indicator">
          <span class="indicator-text">Waiting for confession...</span>
        </div>
      </div>

      <div class="impulse-judge-buttons">
        <button id="impulse-judge-proceed" class="impulse-judge-btn impulse-judge-btn-proceed" disabled>
          😔 Accept Defeat
        </button>
        <button id="impulse-judge-cancel" class="impulse-judge-btn impulse-judge-btn-cancel">
          💪 Keep My ${price > 0 ? '$' + price.toFixed(2) : 'Money'}
        </button>
      </div>
    `}

    <div class="impulse-judge-controls">
      <button id="impulse-judge-voice-toggle" class="impulse-judge-voice-btn ${userSettings.voiceEnabled ? 'voice-on' : 'voice-off'}" title="Toggle voice">
        ${userSettings.voiceEnabled ? '🔊 Judge\'s Voice ON' : '🔇 Judge\'s Voice OFF'}
      </button>
    </div>
    
    <div class="impulse-judge-shortcut-tip">
      <kbd>Esc</kbd> to walk away • <kbd>Enter</kbd> to proceed (when typed)
    </div>

    <div class="impulse-judge-footer-box">
      <p class="impulse-judge-footer">💰 Remember: Every impulse resisted is a victory for your wallet! 💪</p>
      <p class="impulse-judge-footer-sub">Your future self will thank you.</p>
    </div>
  `;
}

function setupModalEventListeners() {
  const input = document.getElementById('impulse-judge-input');
  const proceedBtn = document.getElementById('impulse-judge-proceed');
  const cancelBtn = document.getElementById('impulse-judge-cancel');
  const indicator = document.getElementById('impulse-judge-indicator');

  if (!input || !proceedBtn || !cancelBtn) return;

  // Dynamic feedback state
  let lastTypeTime = Date.now();
  let typingStartTime = 0;
  let errorCount = 0;
  let idleWarningShown = false;
  let idleCheckInterval = null;
  
  const idleMessages = [
    "Why did you stop?",
    "Rethinking your choices?",
    "Your wallet is holding its breath...",
    "The Judge notices your hesitation 👀",
    "Second thoughts? Good."
  ];
  
  const errorMessages = [
    "Spelling is hard when you're desperate to spend",
    "Slow down. Read it again.",
    "The Judge expected more from you",
    "Your fingers are betraying your conscience",
    "Freudian slip? 🤔"
  ];
  
  const speedMessages = [
    "Typing awfully fast... desperate to buy?",
    "Slow down, speedster. Feel the shame.",
    "Racing to waste money?",
    "The faster you type, the guiltier you are"
  ];

  // Helper to avoid unsafe innerHTML usage flagged by Firefox validator
  const updateIndicator = (message, classes = []) => {
    indicator.textContent = message;
    indicator.className = ['impulse-judge-match-indicator', ...classes].join(' ').trim();
  };

  // Check for idle behavior
  idleCheckInterval = setInterval(() => {
    if (isModalActive && input.value.length > 0 && input.value.length < shameSentence.length) {
      const idleTime = Date.now() - lastTypeTime;
      if (idleTime > 3000 && !idleWarningShown) {
        idleWarningShown = true;
        const msg = idleMessages[Math.floor(Math.random() * idleMessages.length)];
        updateIndicator(`⏸️ ${msg}`, ['indicator-text']);
      }
    }
  }, 3000);
  
  // Store interval ID to clean up later
  input.dataset.idleInterval = idleCheckInterval;

  // Prevent paste
  input.addEventListener('paste', (e) => {
    e.preventDefault();
    updateIndicator('🚫 No copy-paste allowed! Type it out, you cheater! 😈', ['error', 'indicator-error']);
  });

  // Prevent drop
  input.addEventListener('drop', (e) => {
    e.preventDefault();
    updateIndicator('🚫 Nice try! No drag-and-drop either! 🙅', ['error', 'indicator-error']);
  });

  // Prevent context menu
  input.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  input.addEventListener('input', (e) => {
    const now = Date.now();
    const userInput = e.target.value.toLowerCase();
    const targetSentence = shameSentence.toLowerCase();
    
    // Track typing start
    if (typingStartTime === 0 && userInput.length > 0) {
      typingStartTime = now;
    }
    
    // Calculate typing speed
    const timeSinceStart = (now - typingStartTime) / 1000;
    const charsPerSecond = userInput.length / Math.max(timeSinceStart, 0.1);
    
    // Reset idle warning
    idleWarningShown = false;
    lastTypeTime = now;
    
    if (userInput === targetSentence) {
      proceedBtn.disabled = false;
      updateIndicator('✅ Shame accepted. You may proceed... (Press Enter or click button)', ['success', 'indicator-success']);
      if (idleCheckInterval) clearInterval(idleCheckInterval);
    } else if (targetSentence.startsWith(userInput)) {
      proceedBtn.disabled = true;
      
      // Dynamic feedback based on typing behavior
      let message = '📝 Keep typing...';
      
      if (charsPerSecond > 8 && userInput.length > 10) {
        message = '⚡ ' + speedMessages[Math.floor(Math.random() * speedMessages.length)];
      } else if (userInput.length > targetSentence.length * 0.7) {
        message = '📝 Almost there... feeling the shame yet?';
      } else if (userInput.length > targetSentence.length * 0.3) {
        message = '📝 Halfway through your confession...';
      }
      
      updateIndicator(message, ['progress', 'indicator-progress']);
    } else {
      proceedBtn.disabled = true;
      errorCount++;
      
      let errorMsg = "❌ That doesn't match! Try again.";
      if (errorCount >= 3) {
        errorMsg = '❌ ' + errorMessages[Math.min(errorCount - 3, errorMessages.length - 1) % errorMessages.length];
      }
      
      updateIndicator(errorMsg, ['error', 'indicator-error']);
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (!proceedBtn.disabled) {
        e.preventDefault();
        proceedBtn.click();
      }
    }
  });

  proceedBtn.addEventListener('click', () => {
    if (idleCheckInterval) clearInterval(idleCheckInterval);
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
    if (idleCheckInterval) clearInterval(idleCheckInterval);
    playSound('victory');
    
    const response = await new Promise(resolve => {
      browserAPI.runtime.sendMessage({
        type: 'IMPULSE_RESISTED',
        data: { 
          product: productData.title, 
          price: productData.price 
        }
      }, resolve);
    });
    
    removeShameModal();
    showVictoryMessage(response);
  });

  setupVoiceToggle();
  setupGooglyEyes();
  document.addEventListener('keydown', handleEscapeKey);
  setTimeout(() => input.focus(), 100);
}

function setupVoiceToggle() {
  const voiceBtn = document.getElementById('impulse-judge-voice-toggle');
  if (!voiceBtn) return;

  voiceBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    userSettings.voiceEnabled = !userSettings.voiceEnabled;
    
    // Update button text and classes
    if (userSettings.voiceEnabled) {
      voiceBtn.textContent = "🔊 Judge's Voice ON";
      voiceBtn.classList.remove('voice-off');
      voiceBtn.classList.add('voice-on');
    } else {
      voiceBtn.textContent = "🔇 Judge's Voice OFF";
      voiceBtn.classList.remove('voice-on');
      voiceBtn.classList.add('voice-off');
    }
    
    browserAPI.storage.sync.set({ settings: userSettings }).catch(() => {});
    
    if (userSettings.voiceEnabled) {
      speakText("Voice enabled");
    } else {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  });
}

function setupGooglyEyes() {
  const eyes = document.querySelectorAll('.judge-eye');
  if (!eyes.length) return;
  
  // Use document-level mousemove for reliable tracking
  const eyeHandler = (e) => {
    eyes.forEach(eye => {
      const rect = eye.getBoundingClientRect();
      const eyeX = rect.left + rect.width / 2;
      const eyeY = rect.top + rect.height / 2;
      
      const angle = Math.atan2(e.clientY - eyeY, e.clientX - eyeX);
      const distance = 4;
      
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

function setupShareButtons(container = document) {
  const EXTENSION_URL = 'https://www.theimpulsejudge.com';
  const SHARE_TEXT = "🛒 This browser extension roasts me every time I try to impulse buy! My wallet thanks it. Try Impulse Buy Judge:";
  
  container.querySelectorAll('.impulse-judge-share-btn').forEach(btn => {
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
  speakVictory();
  
  const stats = response?.stats || {};
  const newAchievements = response?.newAchievements || [];
  const currentStreak = stats.streak || stats.currentStreak || 1;
  const totalSaved = stats.moneySaved || stats.totalSaved || 0;
  
  // Calculate saved amount
  const savedAmount = productData?.price ? parseFloat(productData.price) : 0;
  const formattedSaved = savedAmount > 0 ? `$${savedAmount.toFixed(2)}` : '';
  
  let celebration = {
    emoji: '🎉',
    title: 'You resisted!',
    subtitle: 'Your future self thanks you! 💰'
  };
  
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
            <span class="achievement-icon">${escapeHTML(a.icon)}</span>
            <span class="achievement-name">${escapeHTML(a.name)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  const victoryHTML = `
    <div class="impulse-judge-victory-modal">
      <div class="victory-emoji-large">${escapeHTML(celebration.emoji)}</div>
      <h2 class="victory-title">${escapeHTML(celebration.title)}</h2>
      <p class="victory-subtitle">${escapeHTML(celebration.subtitle)}</p>
      
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
  
  safeSetHTML(victoryModal, victoryHTML);
  document.body.appendChild(victoryModal);
  
  // Create confetti celebration AFTER modal is in DOM
  createConfetti(victoryModal);
  
  // Setup share buttons for victory modal
  setupShareButtons(victoryModal);
  
  pendingElement = null;
}

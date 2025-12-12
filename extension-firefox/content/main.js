/**
 * Impulse Buy Judge - Main Content Script v1.0 (Firefox)
 * Universal detection for all major North American retailers
 * Features: Confetti, Sound Effects, Keyboard Shortcuts, Achievements
 * 
 * This file orchestrates all the modular components:
 * - retailers.js: Retailer configs and selectors
 * - effects.js: Sound, voice, and confetti effects
 * - detection.js: Button detection logic
 * - extraction.js: Product data extraction
 * - modal.js: Modal UI and interactions
 */

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
const isExcludedSite = EXCLUDED_SITES.some(site => currentHostname === site || currentHostname.endsWith('.' + site));

if (!isExcludedSite) {

// Firefox/Chrome API compatibility (defined once in effects.js)
// eslint-disable-next-line no-undef
var browserAPI = typeof browserAPI !== 'undefined' ? browserAPI : (typeof browser !== 'undefined' ? browser : chrome);

// ============================================
// EVENT HANDLERS
// ============================================

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
    
    // If user recently approved via modal, let clicks through for 3 seconds
    if (now < userApprovedUntil) {
      return;
    }
    
    const target = e.target;
    
    // Find the actual button element (not a container)
    const buttonElement = findButtonElement(target);
    
    if (!buttonElement) {
      return;
    }
    
    // Check if this button is a cart/checkout button
    if (!isCartButton(buttonElement)) {
      return;
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
    if (Date.now() < userApprovedUntil) return;
    
    if (isModalActive) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const form = e.target;
    const action = form.getAttribute('action') || '';
    
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
// INITIALIZATION
// ============================================
async function init() {
    // Check if site is whitelisted/blacklisted first
    const enabled = await checkSiteEnabled();
    if (!enabled) {
      return;
    }
    
    // Load user settings first
    await loadSettings();
    
    // Try to detect specific retailer for optimized selectors
    currentRetailer = detectRetailer();
    setCurrentRetailer(currentRetailer);
    
    // ALWAYS set up listeners - text-based detection will catch cart buttons on ANY site
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

} // End of !isExcludedSite check

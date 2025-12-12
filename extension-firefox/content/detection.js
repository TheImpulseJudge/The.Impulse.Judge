/**
 * Impulse Buy Judge - Button Detection (Firefox)
 * Handles cart/checkout button detection and classification
 */

// Checkout phrases - final step before payment
const CHECKOUT_PHRASES = [
  'checkout', 'check out',
  'proceed to checkout', 'continue to checkout', 'go to checkout',
  'place order', 'place your order', 'submit order',
  'complete order', 'complete purchase',
  'pay now', 'pay with', 'confirm order', 'confirm purchase',
  'buy now', 'buy it now', 'buy with',
  'complete payment', 'proceed to payment', 'continue to payment'
];

// Add to cart phrases
const ADD_TO_CART_PHRASES = [
  'add to cart', 'add to bag', 'add to basket',
  'add to shopping cart', 'add item', 'add to trolley'
];

// Combined for general detection
const ALL_CART_PHRASES = [...CHECKOUT_PHRASES, ...ADD_TO_CART_PHRASES];

/**
 * Check if an element is THE cart/checkout button itself
 */
function isCartButton(element) {
  if (!element) return false;
  
  const tagName = element.tagName?.toLowerCase();
  const id = (element.id || '').toLowerCase();
  // Handle SVG elements where className is SVGAnimatedString, not a string
  const className = (typeof element.className === 'string' ? element.className : element.className?.baseVal || '').toLowerCase();
  
  // Amazon-specific IDs
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
  const amazonAncestor = element.closest('[id*="add-to-cart"], [id*="buy-now"]');
  if (amazonAncestor) {
    return true;
  }
  
  const isButtonElement = tagName === 'button' || 
                          tagName === 'input' ||
                          tagName === 'span' ||
                          element.getAttribute('role') === 'button' ||
                          element.getAttribute('type') === 'submit';
  
  const hasButtonClass = className.includes('btn') || 
                         className.includes('button') ||
                         className.includes('checkout') ||
                         className.includes('a-button');
  
  if (!isButtonElement && !hasButtonClass) {
    return false;
  }

  try {
    const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase().trim();
    const value = (element.value || '').toLowerCase().trim();
    const title = (element.getAttribute('title') || '').toLowerCase().trim();
    
    let directText = '';
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        directText += node.textContent;
      }
    }
    directText = directText.toLowerCase().replace(/\s+/g, ' ').trim();
    
    let fullText = (element.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
    
    let buttonText = ariaLabel || value || title || directText;
    if (!buttonText && fullText.length <= 25) {
      buttonText = fullText;
    }
    
    if (!buttonText || buttonText.length < 6 || buttonText.length > 30) {
      return false;
    }

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
 */
function findButtonElement(target) {
  let element = target;
  let depth = 0;
  
  const targetId = (target.id || '').toLowerCase();
  // Handle SVG elements where className is SVGAnimatedString, not a string
  const targetClass = (typeof target.className === 'string' ? target.className : target.className?.baseVal || '').toLowerCase();
  if (targetId.includes('add-to-cart') || 
      targetId.includes('buy-now') ||
      targetClass.includes('a-button-input')) {
    return target;
  }
  
  const amazonInput = target.closest('.a-button')?.querySelector('input.a-button-input, input[id*="add-to-cart"], input[id*="buy-now"]');
  if (amazonInput) {
    return amazonInput;
  }
  
  const amazonButton = target.closest('[id*="add-to-cart"], [id*="buy-now"], [id*="addtocart"]');
  if (amazonButton) {
    return amazonButton;
  }
  
  while (element && element !== document.body && depth < 5) {
    const tagName = element.tagName?.toLowerCase();
    const id = (element.id || '').toLowerCase();
    // Handle SVG elements where className is SVGAnimatedString, not a string
    const className = (typeof element.className === 'string' ? element.className : element.className?.baseVal || '').toLowerCase();
    
    if (id.includes('add-to-cart') || 
        id.includes('addtocart') ||
        id.includes('buy-now') ||
        className.includes('a-button-input')) {
      return element;
    }
    
    if (tagName === 'button' || 
        tagName === 'input' ||
        element.getAttribute('role') === 'button') {
      return element;
    }
    
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
  
  for (const phrase of CHECKOUT_PHRASES) {
    if (text.includes(phrase)) {
      return 'checkout';
    }
  }
  
  for (const phrase of ADD_TO_CART_PHRASES) {
    if (text.includes(phrase)) {
      return 'addToCart';
    }
  }
  
  return 'addToCart';
}

/**
 * Impulse Buy Judge - Product Extraction (Firefox)
 * Handles product data extraction from pages
 */

// currentRetailer is defined in retailers.js and set by main.js
// No need to redeclare it here - we reference the global variable

function extractProductData() {
  if (currentRetailer?.config?.productExtractor) {
    try {
      const data = currentRetailer.config.productExtractor();
      if (data.title && data.title !== 'Product') {
        return data;
      }
    } catch (e) {
      // Retailer extractor failed, using fallback
    }
  }
  
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

function extractCheckoutData() {
  let cartTotal = null;
  
  const cartTotalSelectors = [
    '.cart-total', '.cart__total', '#cart-total', '[data-cart-total]',
    '.order-total', '.grand-total', '.subtotal-price',
    '.cart-subtotal', '.cart-summary-total',
    '#sc-subtotal-amount-activecart', '.sc-subtotal-activecart',
    '#sc-subtotal-amount-buybox', '.a-color-price.hlb-price',
    '.cart__subtotal', '.cart-subtotal-price',
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
  
  if (!cartTotal) {
    const checkoutArea = document.querySelector('.checkout, .cart, #cart, [data-cart], .order-summary, .cart-summary');
    if (checkoutArea) {
      cartTotal = extractPriceFromElement(checkoutArea);
    }
  }
  
  return {
    title: 'Your Shopping Cart',
    price: cartTotal,
    image: '',
    currency: document.querySelector('meta[property="product:price:currency"]')?.content || 'USD',
    isCheckout: true,
    priceUnknown: !cartTotal
  };
}

function extractTitleFromPage() {
  return document.querySelector('meta[property="og:title"]')?.content ||
         document.querySelector('meta[name="twitter:title"]')?.content ||
         document.querySelector('h1')?.textContent?.trim()?.substring(0, 100) ||
         document.title?.split('|')[0]?.split('-')[0]?.trim() || 
         'this item';
}

function extractPriceFromPage() {
  const metaPrice = document.querySelector('meta[property="product:price:amount"]')?.content ||
                    document.querySelector('meta[property="og:price:amount"]')?.content;
  if (metaPrice && parseFloat(metaPrice) > 0) {
    return metaPrice;
  }
  
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent);
      const price = findPriceInJsonLd(data);
      if (price) return price;
    } catch (e) {}
  }
  
  const priceSelectors = [
    '[itemprop="price"]', '[itemprop="price"] .amount',
    '.price', '.product-price', '.sale-price', '.current-price', '.now-price',
    '.price-current', '.price-now', '.final-price', '.actual-price',
    '.product__price', '.pdp-price', '.buy-price',
    '[data-price]', '[data-product-price]', '[data-current-price]',
    '.priceView-customer-price span', '.a-price .a-offscreen',
    '[data-test="product-price"]', '[data-automation="product-price"]',
    '.ProductPrice', '.productPrice',
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
  
  const priceContainers = document.querySelectorAll('[class*="price" i], [class*="Price" i], [id*="price" i]');
  for (const el of priceContainers) {
    const price = extractPriceFromElement(el);
    if (price) return price;
  }
  
  const mainContent = document.querySelector('main, [role="main"], .product, .pdp, #product');
  if (mainContent) {
    const price = extractPriceFromElement(mainContent);
    if (price) return price;
  }
  
  return null;
}

function extractPriceFromElement(el) {
  const text = el.textContent || el.getAttribute('data-price') || el.getAttribute('content') || '';
  const match = text.match(/[$£€¥₹]?\s*[\d,]+\.?\d{0,2}/);
  if (match) {
    const priceStr = match[0].replace(/[$£€¥₹\s,]/g, '');
    const price = parseFloat(priceStr);
    if (price > 0 && price < 100000) {
      return price.toFixed(2);
    }
  }
  return null;
}

function findPriceInJsonLd(data) {
  if (!data) return null;
  
  if (Array.isArray(data)) {
    for (const item of data) {
      const price = findPriceInJsonLd(item);
      if (price) return price;
    }
    return null;
  }
  
  if (data.price) {
    const p = parseFloat(data.price);
    if (p > 0) return p.toFixed(2);
  }
  
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

function formatPrice(price, currency, showUnknown = true) {
  const numPrice = parseFloat(price) || 0;
  
  if (numPrice <= 0) {
    return showUnknown ? 'Price not detected' : '';
  }
  
  const currencySymbols = {
    'USD': '$', 'CAD': 'C$', 'GBP': '£', 'EUR': '€',
    'AUD': 'A$', 'JPY': '¥', 'CNY': '¥', 'INR': '₹',
    'MXN': 'MX$', 'BRL': 'R$'
  };
  
  const symbol = currencySymbols[currency?.toUpperCase()] || '$';
  
  if (currency === 'JPY') {
    return `${symbol}${Math.round(numPrice).toLocaleString()}`;
  }
  return `${symbol}${numPrice.toFixed(2)}`;
}

function generateOpportunityCostHTML(priceValue) {
  if (!priceValue || isNaN(priceValue) || priceValue <= 0) {
    return '';
  }
  
  const costs = [];
  
  // Assume ~$25/hour average wage for perspective
  const hoursOfWork = Math.round(priceValue / 25);
  if (hoursOfWork >= 1) {
    costs.push(`⏱️ ${hoursOfWork} hour${hoursOfWork !== 1 ? 's' : ''} of work`);
  }
  
  // Coffee at ~$5
  const coffees = Math.round(priceValue / 5);
  if (coffees >= 1) {
    costs.push(`☕ ${coffees} coffee${coffees !== 1 ? 's' : ''}`);
  }
  
  // Netflix months at ~$15
  const netflixMonths = Math.round(priceValue / 15);
  if (netflixMonths >= 2) {
    costs.push(`📺 ${netflixMonths} months of Netflix`);
  }
  
  // Gym months at ~$40
  const gymMonths = Math.round(priceValue / 40);
  if (gymMonths >= 2) {
    costs.push(`💪 ${gymMonths} months of gym`);
  }
  
  if (costs.length === 0) return '';
  
  // Pick 2 random comparisons for variety
  const shuffled = costs.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 2);
  
  return `<div class="impulse-judge-opportunity-cost">That's ${selected.join(' or ')}</div>`;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

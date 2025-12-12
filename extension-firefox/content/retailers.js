/**
 * Impulse Buy Judge - Retailer Configurations (Firefox)
 * Retailer-specific selectors and product extractors
 */

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

// Universal fallback selectors
const UNIVERSAL_SELECTORS = {
  addToCart: [
    '.add-to-cart', '.addtocart', '.add-to-bag', '.addtobag', '.add-to-basket',
    '.btn-add-to-cart', '.btn-addtocart', '.add-cart-btn', '.atc-button',
    '.product-add-to-cart', '.pdp-add-to-cart', '.add-to-cart-button',
    '.pip-buy-module__button', '[data-testid="add-to-bag"]', '.js-buy-module-button',
    '[data-enzyme-id="PdpAddToCart"]', '[data-hb-id="AddToCartButton"]', '.ProductAddToCart',
    '.AddToCartButton', '.add-to-cart-wrapper button', '[class*="AddToCart"]',
    'button[data-codeception-id="add-to-cart"]',
    '[data-auto-id="add-to-bag"]', '[data-auto-id="add-to-cart"]',
    '.gl-cta', '.add-to-bag-btn', '.buying-tools-cta',
    'button[aria-label*="add to cart" i]', 'button[aria-label*="add to bag" i]',
    'button[aria-label*="add to basket" i]', 'button[aria-label*="add to shopping" i]',
    '[aria-label*="add to cart" i]', '[aria-label*="add to bag" i]',
    '[data-action="add-to-cart"]', '[data-button="add-to-cart"]', '[data-testid*="add-to-cart" i]',
    '[data-automation*="add" i][data-automation*="cart" i]',
    '[data-test*="add" i][data-test*="cart" i]',
    'form[action*="cart"] button[type="submit"]', 'form[action*="bag"] button[type="submit"]',
    '#add-to-cart', '#addToCart', '#add-to-bag', '#addToBag',
    '.cart-icon', '.shopping-cart-icon', '[class*="addToCart"]', '[class*="add-to-cart"]'
  ].join(', '),
  
  checkout: [
    '.checkout-btn', '.checkout-button', '.proceed-to-checkout', '.go-to-checkout',
    '.btn-checkout', '.cart-checkout', '.secure-checkout', '.continue-checkout',
    '[data-testid="checkout-button"]', '[data-testid*="checkout" i]',
    '[data-enzyme-id*="checkout" i]', '[data-hb-id*="checkout" i]',
    '[class*="Checkout"]', '[class*="checkout"]',
    'button[data-codeception-id*="checkout"]',
    'button[aria-label*="checkout" i]', 'button[aria-label*="check out" i]',
    'a[aria-label*="checkout" i]', '[aria-label*="continue to checkout" i]',
    '[data-action="checkout"]', '[data-automation*="checkout" i]',
    '[data-auto-id*="checkout" i]',
    'input[value*="checkout" i][type="submit"]', 'input[value*="check out" i][type="submit"]',
    '#checkout', '#checkoutButton', '#proceed-to-checkout', '#continue-to-checkout'
  ].join(', '),
  
  buyNow: [
    '.buy-now', '.buynow', '.buy-it-now', '.instant-buy',
    'button[aria-label*="buy now" i]', 'button[aria-label*="buy it now" i]',
    '[data-action="buy-now"]', '[data-testid*="buy-now" i]',
    '#buy-now', '#buyNow'
  ].join(', ')
};

// Current retailer state
let currentRetailer = null;

/**
 * Detect which retailer this is
 */
function detectRetailer() {
  const hostname = window.location.hostname.toLowerCase();
  
  for (const [name, config] of Object.entries(RETAILER_CONFIGS)) {
    if (config.patterns) {
      for (const pattern of config.patterns) {
        if (pattern.test(hostname)) {
          return { name, config };
        }
      }
    }
    
    if (config.detectFn && config.detectFn()) {
      return { name, config };
    }
  }
  
  return null;
}

/**
 * Set the current retailer
 */
function setCurrentRetailer(retailer) {
  currentRetailer = retailer;
}

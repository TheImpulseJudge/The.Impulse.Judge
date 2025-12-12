/**
 * Impulse Buy Judge - Background Script v1.0 (Firefox)
 * Handles AI roast generation, stats tracking, achievements, and notifications
 * Firefox-compatible version using browser.* API with chrome.* fallback
 */

// Firefox/Chrome API compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// ============================================
// ACHIEVEMENTS SYSTEM
// ============================================
const ACHIEVEMENTS = {
  // First steps
  firstResist: {
    id: 'firstResist',
    name: 'First Victory',
    description: 'Resist your first impulse purchase',
    icon: '🏅',
    condition: (stats) => stats.totalResisted >= 1
  },
  
  // Streak achievements
  streakStarter: {
    id: 'streakStarter',
    name: 'Streak Starter',
    description: 'Build a streak of 3 resists',
    icon: '🔥',
    condition: (stats) => stats.bestStreak >= 3
  },
  weekWarrior: {
    id: 'weekWarrior',
    name: 'Week Warrior',
    description: 'Build a streak of 7 resists',
    icon: '⚔️',
    condition: (stats) => stats.bestStreak >= 7
  },
  streakMaster: {
    id: 'streakMaster',
    name: 'Streak Master',
    description: 'Build a streak of 25 resists',
    icon: '👑',
    condition: (stats) => stats.bestStreak >= 25
  },
  streakLegend: {
    id: 'streakLegend',
    name: 'Streak Legend',
    description: 'Build a streak of 50 resists',
    icon: '🏆',
    condition: (stats) => stats.bestStreak >= 50
  },
  
  // Money saving achievements
  moneySaver100: {
    id: 'moneySaver100',
    name: 'Penny Pincher',
    description: 'Save $100 in total',
    icon: '💵',
    condition: (stats) => stats.moneySaved >= 100
  },
  moneySaver500: {
    id: 'moneySaver500',
    name: 'Money Saver',
    description: 'Save $500 in total',
    icon: '💰',
    condition: (stats) => stats.moneySaved >= 500
  },
  moneySaver1000: {
    id: 'moneySaver1000',
    name: 'Savings Champion',
    description: 'Save $1,000 in total',
    icon: '🤑',
    condition: (stats) => stats.moneySaved >= 1000
  },
  moneySaver5000: {
    id: 'moneySaver5000',
    name: 'Financial Guru',
    description: 'Save $5,000 in total',
    icon: '💎',
    condition: (stats) => stats.moneySaved >= 5000
  },
  
  // Total resist count achievements
  tenResists: {
    id: 'tenResists',
    name: 'Double Digits',
    description: 'Resist 10 impulse purchases',
    icon: '🎯',
    condition: (stats) => stats.totalResisted >= 10
  },
  fiftyResists: {
    id: 'fiftyResists',
    name: 'Half Century',
    description: 'Resist 50 impulse purchases',
    icon: '⭐',
    condition: (stats) => stats.totalResisted >= 50
  },
  hundredResists: {
    id: 'hundredResists',
    name: 'Centurion',
    description: 'Resist 100 impulse purchases',
    icon: '🌟',
    condition: (stats) => stats.totalResisted >= 100
  },
  
  // Special conditions
  nightOwl: {
    id: 'nightOwl',
    name: 'Night Owl',
    description: 'Resist a late-night impulse (11PM-5AM)',
    icon: '🦉',
    condition: (stats) => stats.nightResists >= 1
  },
  nightHunter: {
    id: 'nightHunter',
    name: 'Night Hunter',
    description: 'Resist 10 late-night impulses',
    icon: '🌙',
    condition: (stats) => stats.nightResists >= 10
  },
  ironWill: {
    id: 'ironWill',
    name: 'Iron Will',
    description: '90%+ resistance rate (20+ encounters)',
    icon: '🛡️',
    condition: (stats) => {
      const total = stats.totalResisted + stats.totalAccepted;
      return total >= 20 && (stats.totalResisted / total) >= 0.9;
    }
  },
  
  // Big saver achievements (single purchase resisted)
  bigSaver: {
    id: 'bigSaver',
    name: 'Big Saver',
    description: 'Resist a $100+ purchase',
    icon: '🎁',
    condition: (stats) => stats.biggestResist >= 100
  },
  megaSaver: {
    id: 'megaSaver',
    name: 'Mega Saver',
    description: 'Resist a $500+ purchase',
    icon: '🎀',
    condition: (stats) => stats.biggestResist >= 500
  },
  
  // Daily/Weekly achievements
  dailyChamp: {
    id: 'dailyChamp',
    name: 'Daily Champ',
    description: 'Resist 5 impulses in one day',
    icon: '📅',
    condition: (stats) => stats.bestDailyResists >= 5
  },
  weeklyHero: {
    id: 'weeklyHero',
    name: 'Weekly Hero',
    description: 'Save $200+ in a single week',
    icon: '📆',
    condition: (stats) => stats.bestWeeklySaved >= 200
  },
  
  // Recovery achievements
  comeback: {
    id: 'comeback',
    name: 'Comeback Kid',
    description: 'Build a 5+ streak after a purchase',
    icon: '💪',
    condition: (stats) => stats.comebackStreak >= 5
  }
};

// ============================================
// STATS MANAGEMENT
// ============================================
const DEFAULT_STATS = {
  totalDetected: 0,
  totalResisted: 0,
  totalAccepted: 0,
  moneySaved: 0,
  moneySpent: 0,
  streak: 0,
  bestStreak: 0,
  lastAction: null,
  history: [],
  achievements: [],
  nightResists: 0,
  weeklyStats: {
    weekStart: null,
    resisted: 0,
    saved: 0
  },
  dailyStats: {
    date: null,
    resisted: 0,
    saved: 0
  },
  monthlyBudget: 0,
  monthlySpent: 0,
  budgetMonth: null,
  // New stats for achievements
  biggestResist: 0,
  bestDailyResists: 0,
  bestWeeklySaved: 0,
  comebackStreak: 0
};

async function getStats() {
  try {
    const result = await browserAPI.storage.local.get('impulseJudgeStats');
    return { ...DEFAULT_STATS, ...result.impulseJudgeStats };
  } catch (e) {
    console.error('[Impulse Judge BG] Failed to get stats:', e);
    return { ...DEFAULT_STATS };
  }
}

async function saveStats(stats) {
  try {
    await browserAPI.storage.local.set({ impulseJudgeStats: stats });
  } catch (e) {
    console.error('[Impulse Judge BG] Failed to save stats:', e);
  }
}

function checkAchievements(stats) {
  const newAchievements = [];
  
  for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
    if (!stats.achievements.includes(key) && achievement.condition(stats)) {
      stats.achievements.push(key);
      newAchievements.push(achievement);
    }
  }
  
  return newAchievements;
}

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.setDate(diff)).toDateString();
}

function getTodayString() {
  return new Date().toDateString();
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}`;
}

async function updateStats(eventType, data) {
  const stats = await getStats();
  const price = parseFloat(data.price) || 0;
  const now = new Date();
  const hour = now.getHours();
  const isLateNight = hour >= 23 || hour < 5;
  
  // Reset weekly stats if new week
  const weekStart = getWeekStart();
  if (stats.weeklyStats.weekStart !== weekStart) {
    stats.weeklyStats = { weekStart, resisted: 0, saved: 0 };
  }
  
  // Reset daily stats if new day
  const today = getTodayString();
  if (stats.dailyStats.date !== today) {
    stats.dailyStats = { date: today, resisted: 0, saved: 0 };
  }
  
  // Reset monthly budget tracking if new month
  const currentMonth = getCurrentMonth();
  if (stats.budgetMonth !== currentMonth) {
    stats.budgetMonth = currentMonth;
    stats.monthlySpent = 0;
  }
  
  const historyEntry = {
    type: eventType,
    product: data.product?.substring(0, 100),
    price: price,
    retailer: data.retailer,
    timestamp: Date.now(),
    isLateNight
  };

  let newAchievements = [];
  let streakMilestone = null;

  switch (eventType) {
    case 'IMPULSE_DETECTED':
      stats.totalDetected++;
      break;
      
    case 'IMPULSE_RESISTED':
      stats.totalResisted++;
      stats.moneySaved += price;
      stats.streak++;
      stats.weeklyStats.resisted++;
      stats.weeklyStats.saved += price;
      stats.dailyStats.resisted++;
      stats.dailyStats.saved += price;
      
      if (isLateNight) {
        stats.nightResists = (stats.nightResists || 0) + 1;
      }
      
      // Track biggest single resist
      if (price > (stats.biggestResist || 0)) {
        stats.biggestResist = price;
      }
      
      // Track best daily resists
      if (stats.dailyStats.resisted > (stats.bestDailyResists || 0)) {
        stats.bestDailyResists = stats.dailyStats.resisted;
      }
      
      // Track best weekly saved
      if (stats.weeklyStats.saved > (stats.bestWeeklySaved || 0)) {
        stats.bestWeeklySaved = stats.weeklyStats.saved;
      }
      
      // Track comeback streak (resists after a purchase)
      if (stats.lastAction === 'accepted' && stats.streak >= 5) {
        if (stats.streak > (stats.comebackStreak || 0)) {
          stats.comebackStreak = stats.streak;
        }
      }
      
      // Check for streak milestones
      if ([5, 10, 25, 50, 100].includes(stats.streak)) {
        streakMilestone = stats.streak;
      }
      
      if (stats.streak > stats.bestStreak) {
        stats.bestStreak = stats.streak;
      }
      stats.lastAction = 'resisted';
      historyEntry.saved = true;
      
      // Check achievements
      newAchievements = checkAchievements(stats);
      break;
      
    case 'IMPULSE_ACCEPTED':
      stats.totalAccepted++;
      stats.moneySpent += price;
      stats.monthlySpent += price;
      stats.streak = 0;
      stats.lastAction = 'accepted';
      historyEntry.saved = false;
      break;
  }

  // Keep last 100 history entries (only for actual resist/accept actions)
  if (eventType === 'IMPULSE_RESISTED' || eventType === 'IMPULSE_ACCEPTED') {
    stats.history.unshift(historyEntry);
    if (stats.history.length > 100) {
      stats.history = stats.history.slice(0, 100);
    }
  }

  await saveStats(stats);
  return { stats, newAchievements, streakMilestone };
}

// ============================================
// AI ROAST GENERATION - 150+ TEMPLATES
// ============================================

// Roast templates by category
const ROAST_TEMPLATES = {
  // Price-based roasts
  cheap: [
    "I'm about to spend ${price} on {product} because my self-control is apparently worth less.",
    "This ${price} purchase is definitely not me trying to fill an emotional void.",
    "{product} for ${price}? My piggy bank just filed for emotional distress.",
    "I solemnly swear ${price} won't be missed from my coffee fund. It will be.",
    "I am spending ${price} on {product} instead of putting it in savings like a responsible adult.",
    "This ${price} could go to my emergency fund. But {product} IS an emergency.",
    "I confirm that ${price} for {product} is a need, not a want. This is definitely a lie.",
    "My budget spreadsheet doesn't need to know about this ${price} transaction.",
    "${price} seems small but my cart full of small purchases tells a bigger story.",
    "I'm nickel-and-diming myself into debt, ${price} at a time.",
    "This ${price} purchase is 'just a little thing' - said me, 47 times this month.",
    "I'm about to spend ${price} on something I'll forget I own by next week.",
    "My ${price} purchases add up to someone's rent. That someone might be me.",
    "I acknowledge ${price} is death by a thousand cuts to my bank account."
  ],
  medium: [
    "I am about to yeet ${price} into the retail void for {product}.",
    "My bank account and I have agreed to disagree on this ${price} {product}.",
    "I acknowledge that ${price} could buy approximately {coffees} coffees, but {product} speaks to my soul.",
    "Future me is already drafting a strongly worded letter about this ${price} decision.",
    "I understand ${price} is {meals} meals I could cook at home, but here we are.",
    "My savings goal just moved back a week thanks to this ${price} purchase.",
    "I am converting ${price} of my hard-earned money into {product} shaped happiness.",
    "This ${price} purchase is what economists call 'a terrible decision in progress'.",
    "I hereby declare that ${price} for {product} is totally reasonable. My therapist disagrees.",
    "My credit score winced when I clicked on this ${price} {product}.",
    "I'm spending ${price} on {product} because apparently money is a social construct.",
    "${price} is a small price to pay for my inability to close this browser tab.",
    "My ${price} impulse buys could form a support group at this point.",
    "This ${price} is going straight from my account to my future regrets folder.",
    "I acknowledge ${price} is what my grandparents made in a week and I'm spending it on {product}.",
    "My wallet just sent an SOS signal over this ${price} purchase.",
    "${price} today, ramen for dinner tomorrow. Fair trade? Sure."
  ],
  expensive: [
    "I am financially consenting to spend ${price} on {product} with full knowledge of my poor life choices.",
    "My savings account just saw this ${price} price tag and unfriended me.",
    "I understand ${price} is basically {meals} meals but {product} is calling my name.",
    "My financial advisor doesn't know about this ${price} purchase and never will.",
    "I solemnly swear to hide this ${price} bank statement from my partner.",
    "My retirement fund: 'Am I a joke to you?' Me: *spends ${price}*",
    "${price} is a lot but I've decided that future me's problems are not current me's problems.",
    "I acknowledge that ${price} for {product} is basically a small vacation I won't be taking.",
    "This ${price} purchase will bring me approximately 3 hours of joy before buyer's remorse kicks in.",
    "I am about to ghost my budget for ${price} worth of {product}.",
    "I'm trading ${price} for {product} because I've given up on my 5-year plan.",
    "This ${price} could fix my car. Instead, I'm buying {product}. Priorities!",
    "I acknowledge ${price} represents hours of my life traded for {product}.",
    "My ${price} purchase just subscribed me to the 'financial anxiety' newsletter.",
    "I am spending ${price} with the confidence of someone who doesn't check their balance.",
    "${price} is leaving my account. We had a good run. Sort of.",
    "This ${price} purchase is my villain origin story for my financial situation."
  ],
  veryExpensive: [
    "I am about to make a ${price} decision that I'll explain to my therapist later.",
    "I acknowledge that ${price} is someone's rent, but {product} completes me.",
    "My credit card just whispered 'are you sure?' but I'm ignoring it for this ${price} {product}.",
    "I solemnly swear this ${price} purchase is a need, not a want. This is a lie.",
    "I am spending ${price} on {product} and my financial advisor would be speechless.",
    "This ${price} could be a flight somewhere. Instead, I'm buying {product}. No regrets. Many regrets.",
    "I confirm ${price} is leaving my account and taking my financial stability with it.",
    "I am making this ${price} purchase knowing full well I'll be eating ramen for a month.",
    "${price} for {product}? My wallet just applied for witness protection.",
    "I acknowledge that ${price} is more than my parents spent on groceries for a month in their day.",
    "This ${price} purchase is what happens when I have internet access and feelings.",
    "I'm about to spend ${price} like it's not my entire emergency fund. Oh wait, it is.",
    "My ${price} is about to learn what it feels like to be abandoned.",
    "I acknowledge ${price} is life-changing money and I'm changing it into {product}.",
    "${price} could solve problems. But I'm choosing {product} instead of solutions.",
    "My future children's inheritance just got ${price} smaller.",
    "I'm spending ${price} because I saw it, wanted it, and have zero impulse control.",
    "This ${price} purchase is sponsored by my complete denial of financial reality.",
    "I acknowledge ${price} is the cost of my emotional decision-making skills."
  ],

  // Category-based roasts
  fashion: [
    "I need this {product} because my closet full of similar items clearly isn't enough.",
    "This {product} will definitely be the thing that finally makes me look put together.",
    "I'm buying {product} because retail therapy is cheaper than actual therapy. Maybe.",
    "My wardrobe needs this {product} like it needed the last 10 things I impulse bought.",
    "I acknowledge this {product} will sit in my closet with tags on for 6 months.",
    "This {product} is definitely my style and not just what an influencer was wearing.",
    "I'm buying {product} for the version of myself that actually goes places.",
    "My closet said 'no room' but my heart said 'yes {product}'.",
    "I solemnly swear to actually wear this {product} and not just try it on at home.",
    "This {product} is an investment in my personal brand. My brand is apparently 'impulse buyer'."
  ],
  electronics: [
    "I definitely need this {product} and not just because it's shiny and new.",
    "My current tech works fine but {product} has FEATURES I'll use once.",
    "I'm buying {product} for productivity. The productivity of making my wallet lighter.",
    "This {product} will solve all my problems until the next model comes out.",
    "I acknowledge {product} will be outdated in 18 months but I want it NOW.",
    "My tech graveyard of barely-used gadgets welcomes another member.",
    "This {product} is essential for my workflow of scrolling social media faster.",
    "I'm buying {product} because the tech YouTubers said I need it.",
    "My perfectly working device is now 'old' because {product} exists.",
    "I confirm I will spend hours setting up {product} and then forget about it."
  ],
  beauty: [
    "I'm buying {product} because my bathroom cabinet isn't cluttered enough.",
    "This {product} will definitely be the holy grail, unlike the last 47 products.",
    "My skin/hair needs {product} and not just because an influencer told me so.",
    "I acknowledge I have 3 similar products at home but {product} is different. Probably.",
    "This {product} will fix all my problems that the last 20 products didn't.",
    "I'm buying {product} because my skincare routine needs to be longer.",
    "My bathroom counter has given up trying to fit more products.",
    "I solemnly swear {product} will not join the graveyard of half-used products.",
    "This {product} is an 'investment in self-care' and not just shopping addiction.",
    "I need {product} because my current routine of 12 steps clearly isn't enough."
  ],
  home: [
    "I need this {product} to complete my home aesthetic that I'll change next month.",
    "My living space requires {product} even though I'm running out of space.",
    "This {product} sparks joy. My credit card statement will not.",
    "I'm buying {product} because I saw it on Pinterest and lost all self-control.",
    "My home is already full but {product} will definitely find a place.",
    "This {product} matches my Pinterest board that I'll never actually recreate.",
    "I acknowledge {product} will sit in a corner after the initial excitement fades.",
    "I'm buying {product} for the imaginary dinner party I'll never host.",
    "This {product} is essential for my 'cozy home vibes' Instagram that I don't have.",
    "My living space doesn't need {product} but my dopamine receptors disagree."
  ],
  food: [
    "I'm ordering {product} because cooking at home is for people with willpower.",
    "My fridge has food but {product} is right there and I am weak.",
    "I acknowledge I could meal prep but {product} understands me better.",
    "This {product} is an investment in my happiness. A delicious, temporary investment.",
    "I have groceries at home but {product} doesn't require effort.",
    "My kitchen is fully stocked. My motivation to cook is not.",
    "This {product} is definitely part of my balanced diet. *looks at salad gathering dust*",
    "I'm ordering {product} because adulting is hard and I deserve this.",
    "My meal prep Pinterest board watches in disappointment as I order {product}.",
    "I'm ordering {product} because my cooking skills are 'edible at best'."
  ],
  gaming: [
    "I need {product} even though my backlog of unplayed games judges me daily.",
    "I'm buying {product} because my Steam library of 200 unplayed games isn't enough.",
    "This {product} will definitely get played and not collect digital dust. Probably.",
    "My gaming setup needs {product}. My gaming time says otherwise.",
    "I acknowledge {product} will join the pile of 'I'll play this someday' purchases.",
    "My backlog screams. I do not listen. I buy {product}.",
    "This {product} is essential even though I haven't finished games from 3 sales ago.",
    "I'm buying {product} for the free time I definitely have. *Cries in adult responsibilities*",
    "My game library could last a decade. My impulse control cannot.",
    "I solemnly swear to actually play {product} before the next Steam sale."
  ],
  
  // Extra creative roasts
  lateNight: [
    "It's 2 AM and I'm buying {product}. This tracks.",
    "My late-night shopping demon has entered the chat. Hello {product}.",
    "Sleep is for people who don't impulse buy {product} at midnight.",
    "I acknowledge buying {product} at this hour is a cry for help.",
    "My circadian rhythm said 'sleep' but my browser said '{product}'."
  ],
  
  philosophical: [
    "Does owning {product} bring meaning to existence? Probably not. But here we are.",
    "In 100 years, will {product} matter? No. Am I buying it? Yes.",
    "I ponder the void. The void sells {product}. I buy {product}.",
    "What is money but a social construct? What is {product} but my current obsession?",
    "I think, therefore I shop. Specifically for {product}."
  ],
  
  // Generic fallbacks
  generic: [
    "I am making this purchase with full awareness that I'm being judged by an extension.",
    "I acknowledge this is probably an impulse buy and I'm okay with my choices. Sort of.",
    "My wallet and I have a complicated relationship, and {product} isn't helping.",
    "I solemnly swear I thought about this for at least 3 seconds before clicking.",
    "I confirm this purchase brings me joy, even if my bank account disagrees.",
    "I am exercising my right to make questionable financial decisions.",
    "I acknowledge that 'treat yourself' has become my entire personality.",
    "My future self is already side-eyeing this decision from tomorrow.",
    "I hereby admit I don't NEED {product} but wanting it counts, right?",
    "This purchase is not in my budget. But what is a budget but a suggestion?",
    "I acknowledge {product} will provide approximately 2 days of dopamine.",
    "My shopping cart is my emotional support system and I won't apologize.",
    "I am aware this is retail therapy and I'm choosing to proceed anyway.",
    "I solemnly swear {product} is not just filling a void in my life.",
    "My bank account: 'Please no.' Me: *adds to cart anyway*",
    "I acknowledge I'll forget I bought this by next week.",
    "This {product} is definitely necessary and not just shiny and appealing.",
    "I confirm that 'one more purchase' has lost all meaning.",
    "My impulse control took the day off and I'm taking advantage of it.",
    "I am converting my paycheck into {product} and calling it self-care.",
    "This purchase is sponsored by my inability to close browser tabs.",
    "I acknowledge that my shopping habits are concerning but not TODAY.",
    "I'm buying {product} because capitalism and dopamine made me do it.",
    "My brain: 'You don't need this.' Also my brain: 'But imagine if you HAD it.'",
    "I solemnly swear to not Google 'how to return this' in two weeks."
  ]
};

// Retailer-specific roasts
const RETAILER_ROASTS = {
  amazon: [
    "Another box for your porch. Another regret for your soul.",
    "Your Prime addiction is showing. The package will arrive before your regret.",
    "One-click buy? More like one-click regret delivery.",
    "Your Amazon order history is a museum of questionable decisions.",
    "Same-day delivery means same-day buyer's remorse. Efficient!",
    "Your delivery driver knows your impulses better than your therapist."
  ],
  walmart: [
    "You came for the low prices, you're staying for the bad decisions.",
    "You came for groceries. You're leaving with regrets.",
    "That 'sale' price isn't saving you money if you didn't need it in the first place."
  ],
  target: [
    "You went to Target for one thing. This was inevitable.",
    "You walked in for toothpaste. You are leaving with debt. The cycle continues.",
    "Their logo is a target. You are the prey.",
    "Nobody escapes Target with just what they came for. Nobody."
  ],
  sephora: [
    "Your makeup collection is a hoarder's paradise and you're making it worse.",
    "Another product for your 12-step skincare routine that you'll do twice.",
    "Your loyalty reward status is just a high score for poor financial decisions.",
    "This product will revolutionize your routine until the next launch."
  ],
  nike: [
    "Put the sneakers down. You have two feet. That is enough.",
    "Your shoe collection is not a personality trait. Yet here we are.",
    "You have legs, not a centipede. Why so many shoes?"
  ],
  bestbuy: [
    "An extended warranty won't protect you from buyer's remorse.",
    "This tech will be 'essential' until next month's model drops."
  ],
  etsy: [
    "Supporting small businesses AND your shopping addiction. How noble.",
    "Handmade and unique, just like your last 50 Etsy orders."
  ],
  costco: [
    "Buying in bulk doesn't save money if you didn't need it.",
    "Your Costco membership is working overtime today.",
    "Do you really need a 48-pack of that? You do not."
  ],
  ikea: [
    "You'll spend 4 hours building this and 4 minutes using it.",
    "Your furniture is held together by hope and allen wrenches."
  ]
};

// Time-based roasts
const TIME_ROASTS = {
  monday: [
    "Monday retail therapy? The week just started and so did your bad decisions.",
    "It's Monday. You're not buying happiness, you're buying a coping mechanism.",
    "Starting the week with {product}? Your budget is already crying.",
    "Monday: The day you cure work stress with shopping stress."
  ],
  payday: [
    "Payday hit and so did your impulse buying. The cycle continues.",
    "Your paycheck just arrived and it's already making an exit for {product}.",
    "Fresh money, fresh bad decisions. Classic payday vibes.",
    "That direct deposit didn't even get to rest before you found {product}."
  ],
  weekend: [
    "Weekend shopping spree? Your Monday self will have regrets.",
    "Saturday vibes: Coffee, relaxation, and {product} you don't need.",
    "The weekend is for rest. And apparently, buying {product}.",
    "Nothing says 'I deserve a break' like spending money on {product}."
  ]
};

// Checkout-specific roasts (no {product} placeholder)
const CHECKOUT_ROASTS = {
  universal: [
    "I am clicking buy to fill the void in my soul.",
    "I acknowledge that this checkout button is a trap.",
    "I am finalizing this transaction against my better judgment.",
    "I confirm that I have zero self-control and it shows.",
    "I am choosing dopamine over financial stability.",
    "I acknowledge that I do not need this, but I am weak.",
    "I am about to explain this bank notification to my partner.",
    "I confirm that my budget was merely a suggestion.",
    "I am trading my hard-earned money for momentary happiness.",
    "I solemnly swear to hide these packages when they arrive.",
    "I am pressing 'Place Order' because I fear my own thoughts.",
    "I acknowledge that I am the problem.",
    "I am completing this purchase to distract myself from reality.",
    "I confirm that this cart contains zero necessities.",
    "I am effectively setting this money on fire.",
    "I acknowledge that future-me will hate current-me for this.",
    "I am buying this because I lack emotional regulation skills.",
    "I confirm that I am a victim of capitalism.",
    "I am pressing the button because stopping now feels like quitting.",
    "I acknowledge that my wallet is weeping."
  ],
  
  cheap: [
    "I am nickel-and-diming myself into poverty.",
    "I acknowledge that ${price} adds up to a fortune eventually.",
    "I am spending ${price} because it feels like 'free money'.",
    "I confirm that this ${price} purchase is unnecessary.",
    "I am pretending ${price} doesn't count as real spending."
  ],
  
  medium: [
    "I am paying ${price} for things I definitely do not need.",
    "I acknowledge that ${price} could have been a nice dinner.",
    "I am spending ${price} and pretending it is an investment.",
    "I confirm that my bank account will notice this ${price} loss.",
    "I am trading ${price} for a cardboard box of regret."
  ],
  
  expensive: [
    "I am financially consenting to this ${price} disaster.",
    "I acknowledge that ${price} is a significant portion of my rent.",
    "I am spending ${price} with the confidence of a millionaire.",
    "I confirm that I will be eating ramen to pay for this.",
    "I am deleting ${price} from my net worth in one second."
  ],
  
  veryExpensive: [
    "I am actively choosing poverty by spending ${price}.",
    "I acknowledge that ${price} is a life-altering amount of money.",
    "I am spending ${price} and my ancestors are ashamed.",
    "I confirm that I have lost touch with reality at ${price}.",
    "I am blowing ${price} on material goods I will die without."
  ],
  
  lateNight: [
    "It is past midnight and I am burning money.",
    "I acknowledge that sleep is free but I chose this.",
    "I am finalizing this purchase because I am lonely.",
    "I confirm that my sleep paralysis demon told me to buy this.",
    "I am shopping at 3AM because I have lost control."
  ],
  
  payday: [
    "My paycheck just arrived and I am sending it away.",
    "I acknowledge that I am rich for exactly one hour.",
    "I am stimulating the economy with my rent money.",
    "I confirm that money burns a hole in my pocket.",
    "I am spending my earnings before they settle."
  ],
  
  multiItem: [
    "I am buying a collection of things I do not need.",
    "I acknowledge that my cart is a museum of bad choices.",
    "I am finalizing a bulk order of regret.",
    "I confirm that I clicked 'add to cart' too many times.",
    "I am emptying this cart and my bank account."
  ]
};

function detectProductCategory(productTitle) {
  const title = productTitle.toLowerCase();
  
  if (/shoe|sneaker|boot|heel|sandal|dress|shirt|pants|jacket|coat|sweater|jeans|skirt|blouse|hoodie|wear/i.test(title)) {
    return 'fashion';
  }
  if (/phone|laptop|tablet|headphone|earbuds|watch|camera|speaker|console|monitor|keyboard|mouse|airpod|ipad|iphone|macbook|samsung|gaming/i.test(title)) {
    return 'electronics';
  }
  if (/makeup|lipstick|mascara|foundation|serum|cream|moisturizer|cleanser|skincare|haircare|shampoo|perfume|cologne|beauty|cosmetic/i.test(title)) {
    return 'beauty';
  }
  if (/furniture|decor|pillow|blanket|rug|lamp|chair|table|bed|couch|sofa|curtain|storage|organizer|kitchen|bathroom/i.test(title)) {
    return 'home';
  }
  if (/food|snack|drink|coffee|tea|candy|chocolate|pizza|burger|restaurant|delivery|meal|recipe/i.test(title)) {
    return 'food';
  }
  if (/game|playstation|xbox|nintendo|steam|gaming|controller|console|pc game|video game/i.test(title)) {
    return 'gaming';
  }
  
  return 'generic';
}

function isLateNight() {
  const hour = new Date().getHours();
  return hour >= 23 || hour < 5;
}

function isMondayBlues() {
  return new Date().getDay() === 1;
}

function isPayday() {
  const day = new Date().getDate();
  return day === 1 || day === 15 || day >= 28;
}

function isWeekend() {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

function generateRoast(productData) {
  const price = parseFloat(productData.price) || 0;
  const rawProduct = productData.product || productData.title || 'this item';
  const retailer = (productData.retailer || '').toLowerCase();
  const isCheckout = productData.isCheckout || rawProduct.toLowerCase().includes('cart');
  const itemCount = productData.itemCount || 1;
  
  // Smart product name handling
  const productName = getUsableProductName(rawProduct);
  
  // Determine price category
  let priceCategory;
  if (price < 25) priceCategory = 'cheap';
  else if (price < 75) priceCategory = 'medium';
  else if (price < 200) priceCategory = 'expensive';
  else priceCategory = 'veryExpensive';
  
  // Detect product category
  const productCategory = detectProductCategory(rawProduct);
  
  // Collect all applicable templates
  let templates = [];
  
  if (isCheckout) {
    templates = [...CHECKOUT_ROASTS.universal];
    if (price > 0 && CHECKOUT_ROASTS[priceCategory]) {
      templates = [...templates, ...CHECKOUT_ROASTS[priceCategory]];
    }
    if (isLateNight() && CHECKOUT_ROASTS.lateNight) {
      templates = [...templates, ...CHECKOUT_ROASTS.lateNight];
    }
    if (isPayday() && CHECKOUT_ROASTS.payday) {
      templates = [...templates, ...CHECKOUT_ROASTS.payday];
    }
    if (itemCount >= 5 && CHECKOUT_ROASTS.multiItem) {
      templates = [...templates, ...CHECKOUT_ROASTS.multiItem];
    }
  } else {
    templates = [...ROAST_TEMPLATES.generic];
    if (price > 0 && ROAST_TEMPLATES[priceCategory]) {
      templates = [...templates, ...ROAST_TEMPLATES[priceCategory]];
    }
    if (ROAST_TEMPLATES[productCategory] && productCategory !== 'generic') {
      templates = [...templates, ...ROAST_TEMPLATES[productCategory]];
    }
    if (isLateNight() && ROAST_TEMPLATES.lateNight) {
      templates = [...templates, ...ROAST_TEMPLATES.lateNight];
    }
    if (isMondayBlues() && TIME_ROASTS.monday) {
      templates = [...templates, ...TIME_ROASTS.monday];
    }
    if (isPayday() && TIME_ROASTS.payday) {
      templates = [...templates, ...TIME_ROASTS.payday];
    }
    if (isWeekend() && TIME_ROASTS.weekend) {
      templates = [...templates, ...TIME_ROASTS.weekend];
    }
    if (Math.random() < 0.1 && ROAST_TEMPLATES.philosophical) {
      templates = [...templates, ...ROAST_TEMPLATES.philosophical];
    }
    if (RETAILER_ROASTS[retailer] && Math.random() < 0.3) {
      templates = [...templates, ...RETAILER_ROASTS[retailer]];
    }
  }
  
  // Pick random template
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  // Calculate fun comparisons
  const coffees = Math.floor(price / 5);
  const meals = Math.floor(price / 15);
  
  // For checkout, use "my cart" instead of product name
  const displayName = isCheckout ? 'my cart' : productName;
  
  // Fill in template
  let roast = template
    .replace(/\{product\}/gi, displayName)
    .replace(/\$\{price\}/g, `$${price.toFixed(2)}`)
    .replace(/\{coffees\}/g, coffees.toString())
    .replace(/\{meals\}/g, meals.toString());
  
  return roast;
}

function getUsableProductName(product) {
  if (!product || product === 'Unknown Product') {
    return 'this item';
  }
  
  const cleaned = product
    .replace(/\s+/g, ' ')
    .replace(/\|.*$/, '')
    .replace(/-\s*$/, '')
    .trim();
  
  if (cleaned.length <= 30) {
    return cleaned;
  }
  
  if (cleaned.length <= 60) {
    const truncPoint = cleaned.lastIndexOf(' ', 35);
    if (truncPoint > 15) {
      return cleaned.substring(0, truncPoint).trim();
    }
  }
  
  const words = cleaned.split(' ');
  if (words.length >= 2) {
    const shortVersion = words.slice(0, 3).join(' ');
    if (shortVersion.length <= 25 && !shortVersion.match(/^\d/)) {
      return shortVersion;
    }
  }
  
  return 'this item';
}

// ============================================
// SETTINGS MANAGEMENT
// ============================================
const DEFAULT_SETTINGS = {
  triggerOn: 'checkout',
  voiceEnabled: false,
  soundEnabled: true,
  confettiEnabled: true,
  notificationsEnabled: true,
  monthlyBudget: 0,
  whitelistedSites: [],
  blacklistedSites: []
};

async function getSettings() {
  try {
    const result = await browserAPI.storage.sync.get('settings');
    return { ...DEFAULT_SETTINGS, ...result.settings };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

async function saveSettings(settings) {
  try {
    await browserAPI.storage.sync.set({ settings });
  } catch (e) {
    console.error('[Impulse Judge BG] Failed to save settings:', e);
  }
}

// ============================================
// NOTIFICATIONS
// ============================================
async function sendWeeklySummary() {
  const stats = await getStats();
  const settings = await getSettings();
  
  if (!settings.notificationsEnabled) return;
  
  const { weeklyStats } = stats;
  if (weeklyStats.resisted === 0 && weeklyStats.saved === 0) return;
  
  try {
    browserAPI.notifications.create('weekly-summary', {
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: '⚖️ Weekly Impulse Report',
      message: `You resisted ${weeklyStats.resisted} impulses and saved $${weeklyStats.saved.toFixed(2)} this week! 💪`
    });
  } catch (e) {
    // Notification failed silently
  }
}

async function sendDailySummary() {
  const stats = await getStats();
  const settings = await getSettings();
  
  if (!settings.notificationsEnabled) return;
  
  const { dailyStats } = stats;
  if (dailyStats.resisted === 0) return;
  
  try {
    browserAPI.notifications.create('daily-summary', {
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: '⚖️ Daily Impulse Report',
      message: `Today you resisted ${dailyStats.resisted} impulse${dailyStats.resisted > 1 ? 's' : ''} and saved $${dailyStats.saved.toFixed(2)}! 🎉`
    });
  } catch (e) {
    // Notification failed silently
  }
}

function setupAlarms() {
  // Daily summary at 9 PM
  browserAPI.alarms.create('dailySummary', {
    when: getNextAlarmTime(21, 0),
    periodInMinutes: 24 * 60
  });
  
  // Weekly summary on Sunday at 8 PM
  browserAPI.alarms.create('weeklySummary', {
    when: getNextSundayAlarmTime(20, 0),
    periodInMinutes: 7 * 24 * 60
  });
}

function getNextAlarmTime(hour, minute) {
  const now = new Date();
  const alarm = new Date();
  alarm.setHours(hour, minute, 0, 0);
  if (alarm <= now) {
    alarm.setDate(alarm.getDate() + 1);
  }
  return alarm.getTime();
}

function getNextSundayAlarmTime(hour, minute) {
  const now = new Date();
  const alarm = new Date();
  const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
  alarm.setDate(now.getDate() + daysUntilSunday);
  alarm.setHours(hour, minute, 0, 0);
  if (alarm <= now) {
    alarm.setDate(alarm.getDate() + 7);
  }
  return alarm.getTime();
}

browserAPI.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailySummary') {
    sendDailySummary();
  } else if (alarm.name === 'weeklySummary') {
    sendWeeklySummary();
  }
});

// ============================================
// EXPORT STATS
// ============================================
async function exportStats(stats) {
  const settings = await getSettings();
  return {
    exportDate: new Date().toISOString(),
    summary: {
      totalDetected: stats.totalDetected,
      totalResisted: stats.totalResisted,
      totalAccepted: stats.totalAccepted,
      moneySaved: stats.moneySaved,
      moneySpent: stats.moneySpent,
      resistanceRate: stats.totalResisted + stats.totalAccepted > 0 
        ? ((stats.totalResisted / (stats.totalResisted + stats.totalAccepted)) * 100).toFixed(1) + '%'
        : '0%',
      currentStreak: stats.streak,
      bestStreak: stats.bestStreak
    },
    achievements: stats.achievements.map(id => ACHIEVEMENTS[id] ? {
      name: ACHIEVEMENTS[id].name,
      description: ACHIEVEMENTS[id].description,
      icon: ACHIEVEMENTS[id].icon
    } : null).filter(Boolean),
    history: stats.history,
    stats: stats,
    settings: settings
  };
}

// ============================================
// MESSAGE HANDLERS
// ============================================
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Firefox requires returning a Promise for async responses
  const handleAsync = async () => {
    switch (message.type) {
      case 'IMPULSE_DETECTED':
        await updateStats('IMPULSE_DETECTED', message.data);
        return { success: true };

      case 'IMPULSE_RESISTED':
        const resistResult = await updateStats('IMPULSE_RESISTED', message.data);
        return { 
          success: true, 
          stats: resistResult.stats,
          newAchievements: resistResult.newAchievements,
          streakMilestone: resistResult.streakMilestone
        };

      case 'IMPULSE_ACCEPTED':
        const acceptResult = await updateStats('IMPULSE_ACCEPTED', message.data);
        return { success: true, stats: acceptResult.stats };

      case 'GET_ROAST':
        try {
          const sentence = generateRoast(message.data);
          return { sentence };
        } catch (e) {
          console.error('[Impulse Judge BG] Roast generation failed:', e);
          return { sentence: "I am making an impulse purchase that I may or may not regret." };
        }

      case 'GET_STATS':
        const stats = await getStats();
        return { stats, achievements: ACHIEVEMENTS };

      case 'GET_SETTINGS':
        const settings = await getSettings();
        return { settings };

      case 'SAVE_SETTINGS':
        await saveSettings(message.settings);
        return { success: true };

      case 'EXPORT_STATS':
        const exportData = await getStats();
        const exportSettings = await getSettings();
        return { 
          data: {
            exportDate: new Date().toISOString(),
            stats: exportData,
            settings: exportSettings
          }
        };

      case 'IMPORT_STATS':
        try {
          const importData = message.data;
          
          if (importData.stats) {
            const currentStats = await getStats();
            const mergedStats = { 
              ...DEFAULT_STATS, 
              ...importData.stats,
              history: Array.isArray(importData.stats.history) ? importData.stats.history : currentStats.history,
              achievements: Array.isArray(importData.stats.achievements) ? importData.stats.achievements : currentStats.achievements
            };
            await browserAPI.storage.local.set({ impulseJudgeStats: mergedStats });
          }
          
          if (importData.settings) {
            const currentSettings = await getSettings();
            const mergedSettings = { 
              ...currentSettings, 
              ...importData.settings,
              whitelistedSites: Array.isArray(importData.settings.whitelistedSites) ? importData.settings.whitelistedSites : [],
              blacklistedSites: Array.isArray(importData.settings.blacklistedSites) ? importData.settings.blacklistedSites : []
            };
            await saveSettings(mergedSettings);
          }
          
          return { success: true };
        } catch (e) {
          console.error('[Impulse Judge BG] Import failed:', e);
          return { success: false, error: e.message };
        }

      case 'CHECK_SITE':
        const siteSettings = await getSettings();
        const hostname = message.hostname;
        const whitelistedSites = siteSettings.whitelistedSites || [];
        const blacklistedSites = siteSettings.blacklistedSites || [];
        
        const isWhitelisted = whitelistedSites.some(site => hostname.includes(site));
        const isBlacklisted = blacklistedSites.some(site => hostname.includes(site));
        
        let enabled = true;
        if (isBlacklisted) {
          enabled = false;
        } else if (whitelistedSites.length > 0 && !isWhitelisted) {
          enabled = false;
        }
        
        return { isWhitelisted, isBlacklisted, enabled };

      case 'CHECK_BUDGET':
        const budgetStats = await getStats();
        const budgetSettings = await getSettings();
        const budget = budgetSettings.monthlyBudget || 0;
        const spent = budgetStats.monthlySpent || 0;
        const remaining = budget - spent;
        const overBudget = budget > 0 && spent >= budget;
        return { budget, spent, remaining, overBudget };

      case 'RESET_STATS':
        const freshStats = { 
          ...DEFAULT_STATS, 
          achievements: [], 
          weeklyStats: { weekStart: getWeekStart(), resisted: 0, saved: 0 },
          dailyStats: { date: getTodayString(), resisted: 0, saved: 0 }
        };
        await saveStats(freshStats);
        return { success: true };

      default:
        return { error: 'Unknown message type' };
    }
  };

  // Firefox needs a Promise returned for async message handling
  handleAsync().then(sendResponse);
  return true; // Keep the message channel open for async response
});

// ============================================
// INITIALIZATION
// ============================================
setupAlarms();

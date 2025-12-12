/**
 * Impulse Buy Judge - Popup Script v1.0
 * Displays stats, achievements, settings, and site management
 */

const EXTENSION_URL = 'https://www.theimpulsejudge.com';
const SHARE_TEXT = "🛒 This Chrome extension roasts me every time I try to impulse buy! My wallet thanks it. Try Impulse Buy Judge:";

// Over-budget warning messages from The Impulse Judge
const OVER_BUDGET_MESSAGES = [
  "Your budget called. It's filing for emotional distress.",
  "Congratulations, you've achieved financial chaos.",
  "Your wallet just put in its two weeks notice.",
  "Budget exceeded. Your future self is writing an angry letter.",
  "You're in the red. The Judge is not impressed.",
  "This isn't a budget anymore, it's a suggestion you ignored.",
  "Your spending plan has left the chat.",
  "Achievement unlocked: Budget Obliterator.",
  "Your credit card just sighed audibly.",
  "The math isn't mathing. Neither is your budget."
];

// Default settings
const DEFAULT_SETTINGS = {
  voiceEnabled: false,
  soundEnabled: true,
  confettiEnabled: true,
  notificationsEnabled: true,
  triggerOn: 'checkout', // checkout only by default - less intrusive
  monthlyBudget: 0,
  whitelistedSites: [],
  blacklistedSites: []
};

// Achievement definitions (for display) - MUST match background.js keys exactly
const ACHIEVEMENTS = {
  // First steps
  firstResist: { icon: '🏅', name: 'First Victory', desc: 'Resist your first impulse' },
  
  // Streak achievements
  streakStarter: { icon: '🔥', name: 'Streak Starter', desc: '3 resist streak' },
  weekWarrior: { icon: '⚔️', name: 'Week Warrior', desc: '7 resist streak' },
  streakMaster: { icon: '👑', name: 'Streak Master', desc: '25 resist streak' },
  streakLegend: { icon: '🏆', name: 'Streak Legend', desc: '50 resist streak' },
  
  // Money saving
  moneySaver100: { icon: '💵', name: 'Penny Pincher', desc: 'Save $100 total' },
  moneySaver500: { icon: '💰', name: 'Money Saver', desc: 'Save $500 total' },
  moneySaver1000: { icon: '🤑', name: 'Savings Champ', desc: 'Save $1,000 total' },
  moneySaver5000: { icon: '💎', name: 'Financial Guru', desc: 'Save $5,000 total' },
  
  // Resist counts
  tenResists: { icon: '🎯', name: 'Double Digits', desc: 'Resist 10 impulses' },
  fiftyResists: { icon: '⭐', name: 'Half Century', desc: 'Resist 50 impulses' },
  hundredResists: { icon: '🌟', name: 'Centurion', desc: 'Resist 100 impulses' },
  
  // Special conditions
  nightOwl: { icon: '🦉', name: 'Night Owl', desc: 'Late-night resist (11PM-5AM)' },
  nightHunter: { icon: '🌙', name: 'Night Hunter', desc: '10 late-night resists' },
  ironWill: { icon: '🛡️', name: 'Iron Will', desc: '90%+ rate (20+ encounters)' },
  
  // Big saves
  bigSaver: { icon: '🎁', name: 'Big Saver', desc: 'Resist a $100+ purchase' },
  megaSaver: { icon: '🎀', name: 'Mega Saver', desc: 'Resist a $500+ purchase' },
  
  // Daily/Weekly
  dailyChamp: { icon: '📅', name: 'Daily Champ', desc: '5 resists in one day' },
  weeklyHero: { icon: '📆', name: 'Weekly Hero', desc: 'Save $200+ in a week' },
  
  // Recovery
  comeback: { icon: '💪', name: 'Comeback Kid', desc: '5+ streak after a purchase' }
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  await loadSettings();
  setupResetButton();
  setupShareButtons();
  setupSettingsListeners();
  setupBudgetSection();
  setupSiteManagement();
  setupExportButton();
  setupImportButton();
});

// ============================================
// SETTINGS
// ============================================
async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    const settings = { ...DEFAULT_SETTINGS, ...response?.settings };
    
    // Update UI
    const voiceToggle = document.getElementById('voice-toggle');
    const soundToggle = document.getElementById('sound-toggle');
    const confettiToggle = document.getElementById('confetti-toggle');
    const notificationsToggle = document.getElementById('notifications-toggle');
    const triggerSelect = document.getElementById('trigger-select');
    const budgetInput = document.getElementById('monthly-budget');
    
    if (voiceToggle) voiceToggle.checked = settings.voiceEnabled;
    if (soundToggle) soundToggle.checked = settings.soundEnabled;
    if (confettiToggle) confettiToggle.checked = settings.confettiEnabled;
    if (notificationsToggle) notificationsToggle.checked = settings.notificationsEnabled;
    if (triggerSelect) triggerSelect.value = settings.triggerOn;
    if (budgetInput && settings.monthlyBudget > 0) {
      budgetInput.value = settings.monthlyBudget;
    }
    
    // Update site lists
    updateSiteList('whitelist', settings.whitelistedSites || []);
    updateSiteList('blacklist', settings.blacklistedSites || []);
    
    return settings;
  } catch (e) {
    console.error('Failed to load settings:', e);
    return DEFAULT_SETTINGS;
  }
}

async function saveSettings(settings) {
  try {
    await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings });
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

function setupSettingsListeners() {
  const voiceToggle = document.getElementById('voice-toggle');
  const soundToggle = document.getElementById('sound-toggle');
  const confettiToggle = document.getElementById('confetti-toggle');
  const notificationsToggle = document.getElementById('notifications-toggle');
  const triggerSelect = document.getElementById('trigger-select');
  
  const updateSetting = async (key, value) => {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    const settings = { ...DEFAULT_SETTINGS, ...response?.settings };
    settings[key] = value;
    await saveSettings(settings);
  };
  
  if (voiceToggle) {
    voiceToggle.addEventListener('change', () => updateSetting('voiceEnabled', voiceToggle.checked));
  }
  
  if (soundToggle) {
    soundToggle.addEventListener('change', () => updateSetting('soundEnabled', soundToggle.checked));
  }
  
  if (confettiToggle) {
    confettiToggle.addEventListener('change', () => updateSetting('confettiEnabled', confettiToggle.checked));
  }
  
  if (notificationsToggle) {
    notificationsToggle.addEventListener('change', () => updateSetting('notificationsEnabled', notificationsToggle.checked));
  }
  
  if (triggerSelect) {
    triggerSelect.addEventListener('change', () => updateSetting('triggerOn', triggerSelect.value));
  }
}

// ============================================
// STATS
// ============================================
async function loadStats() {
  try {
    const [statsResponse, settingsResponse] = await Promise.all([
      chrome.runtime.sendMessage({ type: 'GET_STATS' }),
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' })
    ]);
    
    const stats = statsResponse?.stats || {};
    const settings = settingsResponse?.settings || {};
    
    updateUI(stats);
    updateAchievements(stats.achievements || []);
    await updateBudgetDisplay(stats, settings);
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
}

function updateUI(stats) {
  // Money saved
  const totalSaved = stats.totalSaved || stats.moneySaved || 0;
  document.getElementById('money-saved').textContent = `$${totalSaved.toFixed(2)}`;
  
  // Counts
  document.getElementById('resisted-count').textContent = stats.totalResisted || 0;
  document.getElementById('accepted-count').textContent = stats.totalAccepted || 0;
  
  // Streak
  const currentStreak = stats.currentStreak || stats.streak || 0;
  const bestStreak = stats.bestStreak || 0;
  document.getElementById('current-streak').textContent = currentStreak;
  document.getElementById('best-streak').textContent = bestStreak;
  
  // Streak emoji based on count
  const streakEmoji = document.getElementById('streak-emoji');
  if (currentStreak === 0) streakEmoji.textContent = '❄️';
  else if (currentStreak < 3) streakEmoji.textContent = '🔥';
  else if (currentStreak < 5) streakEmoji.textContent = '🔥🔥';
  else if (currentStreak < 10) streakEmoji.textContent = '🔥🔥🔥';
  else if (currentStreak < 25) streakEmoji.textContent = '💎';
  else if (currentStreak < 50) streakEmoji.textContent = '⭐';
  else streakEmoji.textContent = '👑';
  
  // Resistance rate
  const total = (stats.totalResisted || 0) + (stats.totalAccepted || 0);
  let rate = 0;
  if (total > 0) {
    rate = Math.round((stats.totalResisted / total) * 100);
  }
  
  document.getElementById('resistance-rate').textContent = `${rate}%`;
  document.getElementById('rate-fill').style.width = `${rate}%`;
  
  // Rate message
  const rateMessage = document.getElementById('rate-message');
  if (total === 0) {
    rateMessage.textContent = 'Start shopping to track your impulse resistance!';
  } else if (rate >= 80) {
    rateMessage.textContent = '🌟 Amazing self-control! Your wallet loves you!';
  } else if (rate >= 60) {
    rateMessage.textContent = '💪 Good job! Keep resisting those impulses!';
  } else if (rate >= 40) {
    rateMessage.textContent = '⚠️ Room for improvement. Stay strong!';
  } else if (rate >= 20) {
    rateMessage.textContent = '😬 Your wallet is getting nervous...';
  } else {
    rateMessage.textContent = '🚨 Danger zone! Maybe hide your credit card?';
  }
  
  // Recent activity
  updateActivityList(stats.history || []);
}

// ============================================
// ACHIEVEMENTS
// ============================================
let showAllAchievements = false;

function updateAchievements(unlockedAchievements) {
  const grid = document.getElementById('achievements-grid');
  const progress = document.getElementById('achievements-progress');
  
  if (!grid) return;
  
  // Ensure we have an array
  const unlockedArray = Array.isArray(unlockedAchievements) ? unlockedAchievements : [];
  const unlockedSet = new Set(unlockedArray);
  const totalAchievements = Object.keys(ACHIEVEMENTS).length;
  const unlockedCount = unlockedArray.filter(key => ACHIEVEMENTS[key]).length;
  
  // Sort achievements: unlocked first, then locked
  const sortedEntries = Object.entries(ACHIEVEMENTS).sort(([keyA], [keyB]) => {
    const aUnlocked = unlockedSet.has(keyA);
    const bUnlocked = unlockedSet.has(keyB);
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    return 0;
  });
  
  // Show 9 by default, all if expanded
  const displayCount = showAllAchievements ? sortedEntries.length : 9;
  const displayEntries = sortedEntries.slice(0, displayCount);
  const hiddenCount = sortedEntries.length - displayCount;
  
  grid.innerHTML = displayEntries.map(([key, achievement]) => {
    const isUnlocked = unlockedSet.has(key);
    return `
      <div class="achievement-badge ${isUnlocked ? 'unlocked' : 'locked'}" data-key="${key}">
        <span class="achievement-icon">${achievement.icon}</span>
        <span class="achievement-name">${achievement.name}</span>
        <span class="achievement-desc">${achievement.desc}</span>
      </div>
    `;
  }).join('');
  
  if (progress) {
    let progressHTML = `${unlockedCount} of ${totalAchievements} unlocked`;
    
    if (hiddenCount > 0) {
      progressHTML += ` <button class="btn-view-more" id="view-more-achievements">View ${hiddenCount} more</button>`;
    } else if (showAllAchievements && sortedEntries.length > 9) {
      progressHTML += ` <button class="btn-view-more" id="view-less-achievements">Show less</button>`;
    }
    
    progress.innerHTML = progressHTML;
    
    // Add event listener for view more/less button
    const viewMoreBtn = document.getElementById('view-more-achievements');
    const viewLessBtn = document.getElementById('view-less-achievements');
    
    if (viewMoreBtn) {
      viewMoreBtn.addEventListener('click', () => {
        showAllAchievements = true;
        updateAchievements(unlockedAchievements);
      });
    }
    
    if (viewLessBtn) {
      viewLessBtn.addEventListener('click', () => {
        showAllAchievements = false;
        updateAchievements(unlockedAchievements);
      });
    }
  }
}

// ============================================
// BUDGET
// ============================================
function setupBudgetSection() {
  const budgetInput = document.getElementById('monthly-budget');
  const saveBtn = document.getElementById('save-budget');
  
  if (saveBtn && budgetInput) {
    saveBtn.addEventListener('click', async () => {
      const budget = parseFloat(budgetInput.value) || 0;
      const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      const settings = { ...DEFAULT_SETTINGS, ...response?.settings };
      settings.monthlyBudget = budget;
      await saveSettings(settings);
      
      // Update display
      await loadStats();
      
      // Show confirmation
      saveBtn.textContent = '✓ Saved';
      saveBtn.classList.add('saved');
      setTimeout(() => {
        saveBtn.textContent = 'Save';
        saveBtn.classList.remove('saved');
      }, 2000);
    });
  }
}

async function updateBudgetDisplay(stats, settings = null) {
  const budgetSpent = document.getElementById('budget-spent');
  const budgetTotal = document.getElementById('budget-total');
  const budgetFill = document.getElementById('budget-fill');
  const budgetInput = document.getElementById('monthly-budget');
  const budgetWarning = document.getElementById('budget-warning');
  
  // Get settings if not passed
  if (!settings) {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      settings = response?.settings || {};
    } catch (e) {
      settings = {};
    }
  }
  
  const monthlySpent = stats.monthlySpent || 0;
  const monthlyBudget = settings.monthlyBudget || 0;
  
  // Update input field to show saved budget
  if (budgetInput && monthlyBudget > 0) {
    budgetInput.value = monthlyBudget;
  }
  
  if (budgetSpent) budgetSpent.textContent = `$${monthlySpent.toFixed(0)}`;
  if (budgetTotal) budgetTotal.textContent = `$${monthlyBudget.toFixed(0)}`;
  
  if (budgetFill && monthlyBudget > 0) {
    const percentage = Math.min((monthlySpent / monthlyBudget) * 100, 100);
    budgetFill.style.width = `${percentage}%`;
    
    // Color based on percentage
    if (percentage >= 90) {
      budgetFill.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
    } else if (percentage >= 70) {
      budgetFill.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
    } else {
      budgetFill.style.background = 'linear-gradient(90deg, #2ecc71, #27ae60)';
    }
  }
  
  // Show over-budget warning
  if (budgetWarning) {
    if (monthlyBudget > 0 && monthlySpent > monthlyBudget) {
      const randomMessage = OVER_BUDGET_MESSAGES[Math.floor(Math.random() * OVER_BUDGET_MESSAGES.length)];
      budgetWarning.textContent = `⚠️ ${randomMessage}`;
      budgetWarning.style.display = 'block';
    } else {
      budgetWarning.style.display = 'none';
    }
  }
}

// ============================================
// SITE MANAGEMENT
// ============================================
function setupSiteManagement() {
  // Tab switching
  document.querySelectorAll('.sites-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      // Update tab active state
      document.querySelectorAll('.sites-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update panel visibility
      document.querySelectorAll('.sites-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(`${tabName}-panel`)?.classList.add('active');
    });
  });
  
  // Add site buttons
  const addWhitelist = document.getElementById('add-whitelist');
  const addBlacklist = document.getElementById('add-blacklist');
  
  if (addWhitelist) {
    addWhitelist.addEventListener('click', () => addSite('whitelist'));
  }
  
  if (addBlacklist) {
    addBlacklist.addEventListener('click', () => addSite('blacklist'));
  }
  
  // Enter key support
  document.getElementById('whitelist-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addSite('whitelist');
  });
  
  document.getElementById('blacklist-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addSite('blacklist');
  });
}

async function addSite(listType) {
  const input = document.getElementById(`${listType}-input`);
  const site = input?.value.trim().toLowerCase();
  
  if (!site) return;
  
  // Basic validation
  if (!site.includes('.')) {
    alert('Please enter a valid domain (e.g., amazon.com)');
    return;
  }
  
  const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
  const settings = { ...DEFAULT_SETTINGS, ...response?.settings };
  
  const listKey = listType === 'whitelist' ? 'whitelistedSites' : 'blacklistedSites';
  const sites = settings[listKey] || [];
  
  if (!sites.includes(site)) {
    sites.push(site);
    settings[listKey] = sites;
    await saveSettings(settings);
    updateSiteList(listType, sites);
  }
  
  input.value = '';
}

async function removeSite(listType, site) {
  const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
  const settings = { ...DEFAULT_SETTINGS, ...response?.settings };
  
  const listKey = listType === 'whitelist' ? 'whitelistedSites' : 'blacklistedSites';
  const sites = (settings[listKey] || []).filter(s => s !== site);
  settings[listKey] = sites;
  
  await saveSettings(settings);
  updateSiteList(listType, sites);
}

function updateSiteList(listType, sites) {
  const container = document.getElementById(`${listType}-list`);
  if (!container) return;
  
  if (!sites.length) {
    container.innerHTML = '<p class="sites-empty">No sites added</p>';
    return;
  }
  
  container.innerHTML = sites.map(site => `
    <div class="site-item">
      <span class="site-name">${escapeHTML(site)}</span>
      <button class="site-remove" data-site="${escapeHTML(site)}" data-list="${listType}">✕</button>
    </div>
  `).join('');
  
  // Add remove handlers
  container.querySelectorAll('.site-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      removeSite(btn.dataset.list, btn.dataset.site);
    });
  });
}

// ============================================
// EXPORT
// ============================================
function setupExportButton() {
  const exportBtn = document.getElementById('export-stats');
  
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      try {
        const response = await chrome.runtime.sendMessage({ type: 'EXPORT_STATS' });
        
        if (response?.data) {
          // Create download
          const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `impulse-judge-backup-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          exportBtn.textContent = '✓ Done!';
          setTimeout(() => {
            exportBtn.textContent = '📤 Export';
          }, 2000);
        } else {
          throw new Error('No data received from export');
        }
      } catch (e) {
        console.error('Export failed:', e);
        exportBtn.textContent = '❌ Failed';
        setTimeout(() => {
          exportBtn.textContent = '📤 Export';
        }, 2000);
      }
    });
  }
}

// ============================================
// ACTIVITY
// ============================================
function updateActivityList(history) {
  const container = document.getElementById('activity-list');
  
  if (!history.length) {
    container.innerHTML = `
      <div class="activity-empty">
        <span>📝</span>
        <p>No impulse purchases detected yet.<br>Go shopping to test your willpower!</p>
      </div>
    `;
    return;
  }
  
  // Show last 5 entries
  const recentHistory = history.slice(0, 5);
  
  container.innerHTML = recentHistory.map(entry => {
    const isResisted = entry.type === 'IMPULSE_RESISTED' || entry.saved;
    const icon = isResisted ? '💪' : '😔';
    const statusClass = isResisted ? 'resisted' : 'accepted';
    const statusText = isResisted ? 'Resisted' : 'Bought';
    const priceText = entry.price ? `$${parseFloat(entry.price).toFixed(2)}` : '';
    const timeAgo = getTimeAgo(entry.timestamp);
    const product = truncate(entry.product || 'Unknown item', 30);
    
    return `
      <div class="activity-item ${statusClass}">
        <span class="activity-icon">${icon}</span>
        <div class="activity-details">
          <span class="activity-product">${escapeHTML(product)}</span>
          <span class="activity-meta">${priceText} • ${timeAgo}</span>
        </div>
        <span class="activity-status">${statusText}</span>
      </div>
    `;
  }).join('');
}

function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function truncate(str, length) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length - 3) + '...' : str;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================
// RESET & SHARE
// ============================================
function setupResetButton() {
  const resetBtn = document.getElementById('reset-btn');
  
  resetBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
      try {
        await chrome.runtime.sendMessage({ type: 'RESET_STATS' });
        await loadStats();
        
        // Show confirmation
        resetBtn.textContent = '✅ Reset!';
        setTimeout(() => {
          resetBtn.textContent = '🔄 Reset Stats';
        }, 2000);
      } catch (e) {
        console.error('Failed to reset stats:', e);
      }
    }
  });
}

function setupShareButtons() {
  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const platform = btn.dataset.share;
      let shareUrl = '';
      
      // Facebook doesn't support pre-filled text in sharer.php - use Feed dialog instead
      switch(platform) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(EXTENSION_URL)}`;
          break;
        case 'facebook':
          // Use feed dialog format which supports quote parameter
          shareUrl = `https://www.facebook.com/dialog/share?app_id=966242223397117&display=popup&href=${encodeURIComponent(EXTENSION_URL)}&quote=${encodeURIComponent(SHARE_TEXT)}`;
          break;
        case 'whatsapp':
          shareUrl = `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT + ' ' + EXTENSION_URL)}`;
          break;
        case 'copy':
          navigator.clipboard.writeText(SHARE_TEXT + ' ' + EXTENSION_URL).then(() => {
            const copyText = btn.querySelector('.copy-text');
            if (copyText) {
              copyText.textContent = '✓ Copied!';
              btn.classList.add('copied');
              setTimeout(() => {
                copyText.textContent = '🔗 Copy';
                btn.classList.remove('copied');
              }, 2000);
            }
          });
          return;
      }
      
      if (shareUrl) {
        chrome.tabs.create({ url: shareUrl });
      }
    });
  });
}

// ============================================
// IMPORT
// ============================================
function setupImportButton() {
  const importBtn = document.getElementById('import-stats');
  const importFile = document.getElementById('import-file');
  
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => {
      importFile.click();
    });
    
    importFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // Validate the data has expected structure
        if (!data.stats && !data.settings) {
          throw new Error('Invalid file format: missing stats and settings');
        }
        
        // Import via background
        const response = await chrome.runtime.sendMessage({ 
          type: 'IMPORT_STATS', 
          data: data 
        });
        
        if (response?.success) {
          importBtn.textContent = '✓ Imported!';
          await loadStats();
          await loadSettings();
          setTimeout(() => {
            importBtn.textContent = '📥 Import';
          }, 2000);
        } else {
          throw new Error(response?.error || 'Import failed - no success response');
        }
      } catch (err) {
        console.error('Import failed:', err);
        importBtn.textContent = '❌ Failed';
        setTimeout(() => {
          importBtn.textContent = '📥 Import';
        }, 2000);
      }
      
      // Reset file input
      importFile.value = '';
    });
  }
}

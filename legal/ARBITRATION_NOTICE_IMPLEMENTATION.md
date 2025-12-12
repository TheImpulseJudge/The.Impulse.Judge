# Arbitration Notice UX Implementation Guide

## Overview
The `arbitration-notice.html` page provides a **conspicuous, user-friendly notice** of the arbitration agreement and class action waiver required by Section 14 of the Terms of Use.

## Legal Compliance Features

### ✅ Conspicuous Notice (Meets Legal Standards)
- **Standalone page** (not buried in Terms)
- **Visual prominence** (warning icon, color coding, large text)
- **Plain language** explanation of what arbitration means
- **Clear opt-out instructions** with deadline calculator
- **30-day deadline** automatically calculated from first use

### ✅ Informed Consent
- Explains what rights are waived (jury trial, class actions)
- Lists what arbitration involves (neutral arbitrator, binding decision)
- Provides geographic scope (US/Canada vs EU/UK)
- Links to full Terms for detailed review

### ✅ Easy Opt-Out Process
- Pre-filled email template with one click
- Subject line and body pre-populated
- Deadline prominently displayed with countdown
- Stores opt-out status locally

## Implementation Options

### Option 1: Extension First-Run (Recommended)
Show the notice when extension is first installed:

**In `background.js` or `popup.js`:**
```javascript
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === "install") {
    // Check if terms already accepted
    chrome.storage.local.get(['terms_accepted'], function(result) {
      if (!result.terms_accepted) {
        // Open arbitration notice in new tab
        chrome.tabs.create({
          url: chrome.runtime.getURL('arbitration-notice.html')
        });
      }
    });
  }
});
```

**Store acceptance:**
```javascript
// After user clicks "I Accept"
chrome.storage.local.set({
  'terms_accepted': true,
  'terms_date': new Date().toISOString(),
  'arbitration_optout': false // or true if they opted out
});
```

### Option 2: Popup Modal (Alternative)
Show modal in extension popup on first launch:

**In `popup.html`:**
```html
<div id="arbitration-modal" style="display: none;">
  <!-- Embed arbitration-notice.html content -->
</div>
```

**In `popup.js`:**
```javascript
document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.local.get(['terms_accepted'], function(result) {
    if (!result.terms_accepted) {
      document.getElementById('arbitration-modal').style.display = 'block';
      // Disable main popup features until accepted
    }
  });
});
```

### Option 3: Website Integration
For users who visit website before installing extension:

**In `index.html` (add after hero section):**
```html
<div id="terms-banner" class="terms-banner" style="display: none;">
  <p>📜 By using The Impulse Judge, you agree to our <a href="/arbitration-notice.html">Arbitration Agreement</a> and <a href="/terms.html">Terms of Use</a>. You have 30 days to opt out.</p>
  <button onclick="dismissBanner()">I Understand</button>
</div>
```

## Testing Checklist

- [ ] Notice displays on first install/use
- [ ] Deadline calculates correctly (today + 30 days)
- [ ] "I Accept" button stores acceptance in localStorage/chrome.storage
- [ ] "I Want to Opt Out" button opens pre-filled email
- [ ] Email template includes all required fields (name, date, confirmation)
- [ ] Opt-out status is stored separately from acceptance
- [ ] Notice doesn't show again after acceptance
- [ ] Links to Terms and Privacy Policy work
- [ ] Mobile responsive (test on small screens)
- [ ] Works in Firefox (use browser.storage instead of chrome.storage)

## Legal Best Practices

### Do:
✅ Show notice **before** user can use core features  
✅ Require explicit acceptance (button click)  
✅ Store acceptance timestamp and opt-out status  
✅ Make opt-out process as easy as acceptance  
✅ Display deadline prominently  
✅ Use plain language, not legalese  
✅ Test on multiple devices/browsers  

### Don't:
❌ Hide notice in settings or "More Info" section  
❌ Use pre-checked boxes for consent  
❌ Make opt-out process difficult or confusing  
❌ Shorten 30-day window  
❌ Show notice after user has already used features  
❌ Use deceptive UI patterns ("dark patterns")  

## Enforcement Considerations

### Why This Matters for Acquisition
- **Stronger arbitration enforceability** = fewer class action liability risks
- **Clear consent records** = defensible in court challenges
- **30-day opt-out window** = meets judicial standards for "reasonable opportunity"
- **Geographic carve-outs** = compliant with EU/UK consumer law

### Record Keeping
Store these fields for each user:
```javascript
{
  terms_accepted: true,
  terms_version: "2025-12-10",
  acceptance_date: "2025-12-10T15:30:00Z",
  arbitration_optout: false,
  user_ip: null, // Don't store, privacy concern
  user_agent: navigator.userAgent // Optional, for UX audit
}
```

## Alternative: Store-Hosted Approach
If you can't modify extension code before store approval:

1. **Add to Chrome Web Store listing:**
   - Mention arbitration agreement in description
   - Link to arbitration-notice.html in screenshots
   - Include in "Privacy practices" section

2. **Show on website:**
   - Banner on homepage
   - Interstitial before download button
   - Link in footer

3. **Email to newsletter subscribers:**
   - Send notice to all subscribers
   - Include opt-out instructions
   - Track email opens/clicks

## Compliance Notes

- **California (Iskanian rule):** Cannot waive PAGA claims - your terms correctly exclude this
- **EU/UK consumers:** Arbitration clause may be unenforceable - your terms correctly carve this out
- **Employment claims:** Not applicable (no employees), but contributors are not employees
- **Small claims exception:** Your terms correctly allow small claims court

## Support

**Questions?** Email support@theimpulsejudge.com with subject "Arbitration UX Implementation"

**Code review?** Open a GitHub issue with tag `legal-compliance`

---

**Last Updated:** December 10, 2025

# Contributing to The Impulse Judge

You want to commit code? **Order in the court.**

This repo is not a democracy. It is a **benevolent dictatorship** run by a JavaScript file with a superiority complex.

Before you submit a Pull Request, read these rules. The Judge does not have time for PRs that violate the obvious.

---

## 🚫 Rule #1: Don't Touch My Coffee

If your Pull Request attempts to:
- Change buy me a coffee link
- Inject tracking scripts or analytics
- Add advertisements

I will not only reject your PR. I will judge you in the commit message. Publicly. With screenshots.

**The Judge does not tolerate thieves.**

---

## ⚖️ What You Can Contribute

**You CAN contribute:**
- ✅ Code improvements (bug fixes, features, performance)
- ✅ New retailer support and detection patterns
- ✅ Accessibility improvements
- ✅ Translations (with your own original jokes, not direct translations of ours)

**You CANNOT contribute:**
- ❌ Copies of games/tools from other projects
- ❌ Roasts copied from other sources
- ❌ Content that infringes third-party IP
- ❌ Direct translations of our existing roasts

See the "Intellectual Property" section in README.md for full details.

---

## ✍️ Rule #2: Roast Quality Standards

If you're adding new roasts to `background.js`, they must meet these criteria. We currently have 200+ roasts, so the bar is high.

### ✅ Good Roast
- **Funny:** Make people laugh, not cry
- **Judgemental, not cruel:** Attack the purchase decision, not the person
- **Original:** No recycled one-liners from Twitter or Reddit
- **Universal:** Avoid niche references only 3 people will understand

**Example:**
```javascript
"I'm about to spend ${price} on {product} because my self-control is apparently worth less."
```

This roast is funny, targets the decision (not the user personally), and is universally relatable.

### ❌ Bad Roast (Will Be Rejected)
- Mean-spirited personal attacks
- Political/religious commentary
- Discrimination based on race, gender, identity, etc.
- Profanity or explicit sexual content
- Encouragement of self-harm or violence
- "Haha random" nonsense that isn't actually funny

If your roast wouldn't make you laugh if you saw it on YOUR checkout screen, rewrite it.

### 🏪 Store Policy Compliance (NON-NEGOTIABLE)

**All contributions must comply with Chrome Web Store and Firefox Add-ons content policies.** Submissions containing the following will be **immediately rejected** and may result in a ban from contributing:

- **Hate speech** targeting race, ethnicity, religion, disability, gender, age, veteran status, sexual orientation, or gender identity
- **Harassment or bullying** of individuals or groups
- **Violent content** or threats
- **Sexually explicit material**
- **Illegal activity** promotion
- **Misinformation** about health, finance, or civic processes

**Why this matters:** Violating store policies can get our extension **permanently delisted** and our developer account **banned**. We review all submissions before merging. When in doubt, make it funnier without being meaner.

**Examples of store-safe vs. banned roasts:**
- ✅ "This $89 gadget will gather dust next to the bread maker you used once."
- ✅ "My shopping cart is a graveyard of good intentions and bad ideas."
- ❌ "Only [demographic group] would buy this garbage." ← **BANNED**
- ❌ "This product is for [slur/insult]." ← **BANNED**

---

## 🎮 Rule #2.5: Game & Tool Contribution Guidelines

The website's "Free Therapy" section includes 13 mini-games (Dopamine Dash, Credit Defence, Judge The Hype, Mystery Box, Infinite Delivery Receipt, Reality Passport, The Void, Pet The Rock, Runaway Buy Button, I Am Rich, Credit Card Shredder, Digital Bubble Wrap, The Clicker), Roast Roulette, and 4 calculators. These are **proprietary creative works**, not MIT-licensed code.

### What We Copyright (Original Creative Expression)
- **Specific game/tool names** (e.g., "Dopamine Dash", "Credit Defence", "Judge The Hype", "Mystery Box of Disappointment", "Roast Roulette", "The Void")
- **Original visual designs and artwork** we created
- **Specific written text, humor, and dialogue** within games
- **The particular presentation and styling** that makes our tools unique
- **Branding elements** connecting to The Impulse Judge

### What We DON'T Copyright (Uncopyrightable by Law)
Consistent with *Baker v. Selden*, *Feist v. Rural*, and *Lotus v. Borland*:
- **Game mechanics and rules** (endless runners, clickers, bubble wrap poppers)
- **Mathematical formulas** used in calculators (compound interest, time-cost calculations)
- **Generic concepts** (impulse control tools, spending games, sobriety certificates)
- **Functional UI elements** (buttons, modals, input fields)
- **Standard coding patterns** (collision detection, animation loops)

**Translation:** You can make your own endless runner, tower defense game, or swipe-judgment game about avoiding purchases. You CANNOT call it "Dopamine Dash," "Credit Defense," or "Judge The Hype," copy our specific characters and dialogue, reuse our witty share text, or make it look like it's part of The Impulse Judge.

### Contributing New Games/Tools

**Want to propose a new mini-game?** Great! Here's what makes a good proposal:

1. **On-Brand:** Must connect to impulse buying, financial wellness, or dopamine/addiction themes
2. **Original:** Must be your own creative work, not copied from elsewhere
3. **Simple:** Must run in-browser with no external dependencies (no npm, no APIs)
4. **Accessible:** Must work on mobile and desktop, with keyboard support
5. **Humorous:** Must fit The Impulse Judge's satirical tone

**Submission Process:**
1. Open an Issue first to discuss the concept (don't build it blind)
2. If approved, submit a PR with the full implementation
3. Sign the CLA (your game becomes proprietary project IP upon merge)
4. Include a note in your PR acknowledging the creative work transfer

**By contributing a game, you're donating that creative work to the project.** The game becomes part of our proprietary asset collection. You cannot later demand removal, royalties, or ownership. Your payment is eternal glory in the commit history.

---

## 🤖 Rule #3: I Bullied A Robot To Write Some of This

Yes, parts of this codebase were generated using AI. I bullied our LLM intern called "Liability" until he wrote valid JavaScript.

### What This Means For You:

**Do not refactor "ugly" code just to make it prettier:**
- If it works, it stays. This is not a beauty pageant.
- Do not complain about `var`. It runs. Let it live.
- Do not tell me "this could be an arrow function." I do not care. I am saving money, not keystrokes.

**DO fix actual bugs.**
- Memory leaks? Fix it.
- Broken logic? Fix it.
- Security vulnerabilities? Fix it immediately.

**DO add new features.**
- Want to support a new retailer? Add it.
- Want to improve the detection algorithm? Do it.
- Want to add a dark mode or a new skin? Sure, Judge might allow it.

---

## 🔒 Rule #4: Security & Vulnerability Disclosure

We take security seriously. If you discover a security vulnerability, please report it responsibly:

### Responsible Disclosure Policy
**Please DO:**
- ✅ Email details to support@theimpulsejudge.com with subject "SECURITY"
- ✅ Provide detailed steps to reproduce the vulnerability
- ✅ Allow us 90 days to patch before public disclosure
- ✅ Act in good faith and avoid malicious actions

**Please DON'T:**
- ❌ Publicly disclose the vulnerability before we've patched it
- ❌ Access user data, modify systems, or conduct denial-of-service attacks
- ❌ Demand payment or threaten disclosure

### Safe Harbor
We will NOT pursue legal action against researchers who:
- Comply with this disclosure policy
- Act in good faith to identify and report security issues
- Avoid privacy violations, data destruction, or service disruption

### Recognition
We'll credit researchers in our changelog/release notes (with your permission) once the issue is patched.

**Bug Bounty:** We don't currently offer paid bounties (we're a free extension run on coffee money), but we'll send you a heartfelt thank you and eternal gratitude. ☕

---



## 🛡️ Rule #5: Sign the CLA (Because IP Matters)

We require a **Contributor License Agreement (CLA)** to ensure you own the code you're contributing and grant us necessary rights for maintenance and potential commercialization.

### How it works:
1. **Open a Pull Request** → The `CLA Assistant` check will appear at the bottom.
2. **If it fails:** Click the "Details" link next to the failure.
3. **Sign it:** Log in with GitHub and agree.
4. **Re-check:** If the bot is stuck, comment `@cla-assistant check` in the PR to poke it.

**No signature, no merge.** It protects both of us.

*(See the [Legal & Contributor Rights](#️-legal--contributor-rights) section below for full details on IP assignment and liability protections.)*

---

## 📝 How To Submit A Pull Request

1. **Fork the repo** to your own GitHub account.
2. **Create a branch** with a descriptive name:
   ```bash
   git checkout -b feature/add-dark-mode
   git checkout -b fix/modal-escape-key
   git checkout -b roast/add-fashion-jokes
   ```
3. **Make your changes.** Test them locally.
4. **Commit with a clear message:**
   ```bash
   git commit -m "Add support for Nordstrom checkout detection"
   ```
5. **Push to your fork:**
   ```bash
   git push origin feature/add-dark-mode
   ```
6. **Open a Pull Request** on the main repo.

---

## 🐛 Bug Reports

Found a bug? Here's what I need:

1. **Browser & Version** (Chrome 120, Firefox 115, etc.)
2. **Operating System** (Windows 11, macOS 14, etc.)
3. **Steps to reproduce** (be specific)
4. **Expected behavior** (what SHOULD happen)
5. **Actual behavior** (what DOES happen)
6. **Screenshots or console errors** (if applicable)

**Don't just say "it doesn't work."** My crystal ball is in the shop and the psychic quit after our recent session. I need logs, not vibes.

---

## 🎨 Feature Requests

Want a new feature? Great. Here's what makes a good feature request:

- **Specific.** "Add dark mode" is good. "Make it better" is not.
- **Useful.** Will this help 100+ users, or just you?
- **Feasible.** My dev team is just me and a hallucinating robot that I bully. We could barely vertically align a div. Please do not ask for rocket science.
- **On-brand.** Does it fit The Impulse Judge's mission of reducing impulse purchases?

Feature requests that say "you should add AI to predict my purchases" will be ignored. 

---

## 🌍 Internationalization (i18n)

Financial irresponsibility is a global pandemic. I want to judge it everywhere.

**Yes, please help me translate.** Bad spending habits are the universal language, but roasts hit harder in your mother tongue. If you want to help me bully French people about their bakery purchases or roast German engineering enthusiasts, open a PR. I want to become the Rosetta Stone of financial shame.

---

## 🤝 Code of Conduct

This project judges *purchases*, not *people*.

- Be respectful in discussions.
- No harassment, hate speech, or discrimination.
- Disagreements about code are fine. Personal attacks are not.

If you violate this, your PR will be rejected and you'll be blocked from the repo.

---

## 🛡️ Legal & Contributor Rights

### Legal Note on Roasts
By submitting a roast to this repository, you agree that you are donating it to the project. You assign all copyright and ownership of that joke to The Impulse Judge Project. You cannot ask for royalties later because your roast went viral on TikTok. Your payment is the glory of the commit history.

### Contributor Indemnification
By submitting any contribution (code, roasts, documentation, etc.) to this repository, you agree to indemnify and hold harmless The Impulse Judge Project from any claims, damages, or liabilities arising from your submissions, including but not limited to copyright infringement, trademark violations, defamation, or third-party rights violations. If you submit something that gets us sued, you're responsible. Don't submit stuff you don't have the legal right to submit.

### Contributor Liability Protection

As an open-source contributor, you are protected:

**Volunteer Protection Laws:**
- **Canada:** Volunteer work on non-profit projects may have liability protections under provincial laws
- **U.S.:** Many states have volunteer protection statutes

**Project-Level Protections:**
1. **MIT License:** The "AS IS" warranty disclaimer covers all contributors
2. **Indemnification Clause:** Users agree not to sue contributors (see terms.html)
3. **No Agency Relationship:** Contributors are not employees, agents, or representatives of The Impulse Judge Project

**What This Means:**
- ✅ You're not personally liable for bugs in code you contribute
- ✅ Users can't sue you individually for extension issues
- ✅ Your contributions are protected by the same disclaimers as the main project

**What You're Still Responsible For:**
- ❌ Intentional misconduct or malicious code
- ❌ Copyright infringement (submitting code you don't own)
- ❌ Violating the CLA or Code of Conduct

**Translation:** If you submit a good-faith bug fix that accidentally breaks something, you're protected. If you intentionally submit malware, you're on your own.

**Disclaimer:** This section provides general information about potential legal protections, not legal advice. Actual liability protection depends on your jurisdiction and specific circumstances. Volunteer protection laws vary by location and may have specific requirements. Consult a lawyer if you have specific concerns about contributor liability.

### CLA Details
The Contributor License Agreement (CLA) protects both of us by:
- Confirming you own the code you're contributing
- Granting us the right to relicense if needed (e.g., for commercial partnerships)
- Ensuring contributors can't later claim ownership disputes

This allows us to maintain a clean IP trail for potential acquisition, commercialization, or partnerships while using the MIT License for the open-source code.

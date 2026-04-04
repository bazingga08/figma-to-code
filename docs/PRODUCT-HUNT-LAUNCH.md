# Product Hunt Launch Playbook — Figma to Code v2

---

## TL;DR Checklist

```
PRE-LAUNCH (2 weeks before)
[ ] Product Hunt maker profile complete (real photo, bio, GitHub/Twitter linked)
[ ] Logo ready (240x240 square PNG)
[ ] Gallery images ready (1270x760, up to 8 images)
[ ] Demo video recorded (under 2 min)
[ ] Tagline finalized (under 60 chars)
[ ] Short description written (under 260 chars)
[ ] First comment drafted (150-300 words)
[ ] Teaser posts scheduled (Twitter, Reddit, Dev.to)
[ ] Support network notified (DMs, not mass blasts)
[ ] GitHub repo polished (README, badges, star count)
[ ] Landing page / website live (optional but recommended)

LAUNCH DAY
[ ] Submit at 12:01 AM Pacific Time
[ ] Post first comment immediately
[ ] Share on Twitter, LinkedIn, Slack/Discord communities
[ ] Send personal DMs to network (link + context, NOT "please upvote")
[ ] Respond to every comment within minutes
[ ] Monitor all day — engagement matters

POST-LAUNCH (48 hours)
[ ] Continue responding to every comment
[ ] Write "behind the build" post (blog/Twitter thread)
[ ] Add Product Hunt badge to repo
[ ] Track metrics (referral traffic, GitHub stars, signups)
```

---

## Step 1: Prepare Your Assets (Start Now)

### Logo
- **Size:** 240x240 px, square
- **Format:** PNG with transparent background
- **Style:** Clean, recognizable at small sizes. Consider: Figma diamond icon morphing into code brackets `{ }`, or a design-to-code arrow.

### Gallery Images (Most Important Asset)

You get up to **8 images at 1270x760**. These sell the product. Here's what to put in each slot:

| Slot | Content | Why |
|---|---|---|
| 1 | **Hero shot** — Figma design on left, generated code on right, "95% match" badge | First impression, shows the value instantly |
| 2 | **The problem** — Figma MCP truncation diagram (from README). "Other tools see 40%. We see 100%." | Creates the "aha" moment |
| 3 | **Verification loop** — Side-by-side: Figma screenshot vs built screenshot with green checkmarks | Proves it actually verifies, not just builds-and-prays |
| 4 | **Before/After** — Real design: MCP output (broken) vs this plugin output (matching) | The killer comparison |
| 5 | **How it works** — End-to-end flow diagram (from README mermaid chart, rendered as image) | Shows the engineering rigor |
| 6 | **50-item checklist** — The fidelity checklist categories (spacing, typography, color, etc.) | Shows thoroughness |
| 7 | **3 frameworks** — Same Figma design -> React, Flutter, React Native code side by side | Shows flexibility |
| 8 | **Open source** — GitHub stars badge, MIT license, "free forever" | Trust signal |

**How to create them:**
- Use Figma itself to design these gallery images (meta!)
- Or use a tool like Shots.so, Screely, or Cleanshot for polished screenshots
- Keep text large and readable — people scroll fast

### Demo Video

- **Length:** 60-90 seconds (under 2 min hard limit)
- **Format:** MP4 or YouTube/Loom link
- **Script:**

```
0:00  "Every Figma-to-code tool breaks on real designs. Here's why."
0:10  Show a real complex Figma screen (your CoinSwitch app or similar)
0:15  "MCP tools see 40% of this design. Watch what happens."
0:20  Show MCP output — broken, missing styles, wrong layout
0:25  "Now watch Figma to Code v2."
0:30  Paste the Figma link into Claude Code
0:35  Show extraction running (fast-forward)
0:45  Show verification loop — screenshot comparison
0:55  Show final output side by side with Figma
1:05  "95% visual fidelity. Every property. Every component verified."
1:10  "Open source. React, React Native, Flutter. Try it now."
```

### Tagline (Under 60 Characters)

Pick one:

| Option | Characters |
|---|---|
| `Figma to production code at 95% fidelity` | 43 |
| `Turn Figma designs into real code, verified` | 46 |
| `Figma to code that actually matches the design` | 49 |
| `The Figma-to-code tool that doesn't truncate` | 48 |
| `100% of your Figma data → 95% accurate code` | 47 |

**Recommended:** `Figma to production code at 95% fidelity` — short, specific, differentiated.

### Short Description (Under 260 Characters)

```
Open-source Claude Code plugin that reads 100% of your Figma design via REST API
(not MCP's truncated 40%), builds code piece-by-piece with per-component screenshot
verification, and outputs production-ready React, React Native, or Flutter at 95% fidelity.
```

(254 characters)

---

## Step 2: Build Audience (1-2 Weeks Before)

### Twitter/X Strategy

Post a thread series leading up to launch:

**Week -2: The Problem Thread**
```
I've been using every Figma-to-code tool on the market.

They all break on real designs. Here's what I found:

The #1 reason? Data truncation.

MCP tools cap at ~25K tokens. A real screen is 100K-350K tokens.

You're building from 40% of the design. No wonder it never matches.

Thread: how I built a tool that actually reads 100% of the design...
```

**Week -1: The Solution Thread**
```
I built an open-source Figma-to-code plugin that:

- Reads 100% of the design (REST API, no truncation)
- Verifies every component (screenshot comparison loop)
- Outputs React, React Native, or Flutter
- Gets 95% visual fidelity

Launching on Product Hunt next [Tuesday/Wednesday].

Here's what makes it different...
```

**Launch Day Thread:**
```
It's live on Product Hunt!

Figma to Code v2 — the open-source plugin that turns Figma designs into
production code at 95% fidelity.

No data loss. No build-and-pray. Per-component verification.

Link: [PH link]

Here's a quick demo of what it does...
```

### Reddit Posts (Genuine, Not Spammy)

Post in these subreddits with real value, not just links:

| Subreddit | Angle |
|---|---|
| r/reactjs | "I built an open-source tool that converts Figma to React at 95% accuracy — here's how it handles the data truncation problem" |
| r/FlutterDev | "Open-source Figma-to-Flutter that captures every Figma property (gradients, squircle corners, mixed text styles)" |
| r/reactnative | "Figma to React Native with per-component screenshot verification" |
| r/webdev | "Why every Figma-to-code tool breaks on real designs (and how I fixed it)" |
| r/opensource | "I open-sourced my Figma-to-code plugin — REST API extractor that reads 100% of designs" |
| r/programming | Technical deep-dive on the token truncation problem and the REST API solution |

### Dev.to / Hashnode Article

Write one deep technical article: **"Why Figma MCP Truncates Your Designs (And How to Get 100% Data)"**

Content:
1. The token wall problem (with numbers)
2. What properties get silently dropped
3. How REST API extraction solves it
4. The verification loop approach
5. Link to GitHub + upcoming PH launch

### Product Hunt Community

- **2+ weeks before:** Start upvoting and commenting on other launches genuinely
- Ghost accounts get suppressed by PH's algorithm
- Comment on 5-10 launches in the dev tools / design tools categories

---

## Step 3: Launch Day (The Day Of)

### Timing

- **Submit at 12:01 AM Pacific Time** (Product Hunt resets daily at midnight PT)
- This gives you the full 24-hour ranking window
- **Best days:** Tuesday, Wednesday, or Thursday
- Avoid Monday (most crowded) and weekends (low traffic)

### Submission Steps

1. Go to `producthunt.com/posts/new`
2. Fill in:
   - **Name:** Figma to Code v2
   - **Tagline:** Figma to production code at 95% fidelity
   - **URL:** GitHub repo link
   - **Topics:** Pick up to 3: "Developer Tools", "Open Source", "Design Tools"
3. Upload gallery images and video
4. Submit

### First Comment (Post Immediately After Submission)

This is the most important piece of copy. Draft it carefully:

```
Hey Product Hunt!

I'm [name], and I built this because I was frustrated.

Every Figma-to-code tool I tried would produce output that looked "close but not quite right."
After digging into WHY, I found the root cause: data truncation.

The official Figma MCP server caps responses at ~25K tokens. A real production screen
is 100K-350K tokens. That means these tools are building from 40-60% of the design.
Of course the output doesn't match.

So I built a different approach:

1. A Node.js extractor that reads 100% of the Figma design via REST API (no truncation)
2. Smart chunking into ~10K-token pieces that fit in Claude's context window
3. Per-component verification: build → screenshot → compare to Figma → fix → re-verify
4. A 50-item fidelity checklist checked on every component
5. Production hardening: responsive, accessibility, states, edge cases

The result: 95% visual fidelity on real production designs. React, React Native, and Flutter.

It's fully open source (MIT) and works as a Claude Code plugin.

I'd love your feedback — especially if you've tried other Figma-to-code tools and
hit the same frustrations. What designs would you test this on?
```

### Support Mobilization

Send **personal DMs** (not group blasts) to:
- Friends who are developers/designers
- Twitter mutuals in the dev tools space
- Slack/Discord communities you're active in

**What to say:**
```
Hey [name], I just launched my Figma-to-code plugin on Product Hunt today.
It solves the data truncation problem that breaks every other tool on real designs.
Would love it if you could check it out and leave a comment if you find it interesting:
[link]
```

**NEVER say "please upvote."** PH's algorithm detects and suppresses coordinated voting.

### Throughout the Day

- Respond to **every single comment** within minutes
- Be technical and genuine — PH's dev audience respects depth
- If someone asks a hard question, answer honestly (even if the answer is "not yet, but here's why")
- Share progress updates on Twitter throughout the day

---

## Step 4: Post-Launch (48 Hours After)

### Keep Engaging
- Continue responding to every PH comment for 48 hours
- Engagement rate heavily influences the algorithm

### Write a "Behind the Build" Post
- Twitter thread or blog post: "What I learned building a Figma-to-code plugin"
- This generates a second wave of traffic
- Include specific technical details and numbers

### Add the Badge
Add to your README and website:

```html
<a href="https://www.producthunt.com/posts/figma-to-code-v2?utm_source=badge">
  <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=YOUR_POST_ID" alt="Product Hunt" />
</a>
```

### Track Metrics

| Metric | Where to Track | What's Good |
|---|---|---|
| PH ranking | Product Hunt | Top 5 = homepage badge + newsletter (200K+ subscribers) |
| Upvotes | Product Hunt | 200+ = strong launch, 500+ = excellent |
| Comments | Product Hunt | 50+ = high engagement |
| GitHub stars | GitHub | Track new stars from PH referral traffic |
| README views | GitHub insights | Spike indicates PH traffic |
| Forks | GitHub | People trying it out |

### Leverage the Launch

- If you hit **Top 5 of the day**: you get the Product Hunt badge and inclusion in their newsletter (200K+ subscribers)
- Add "Featured on Product Hunt" to all profiles
- Use the PH traffic spike to build your Twitter following
- Consider a Show HN post on Hacker News 1-2 days after PH launch (different audience, same story)

---

## Step 5: Hacker News (1-2 Days After PH)

Different audience, different angle. HN values technical depth.

**Title:** `Show HN: Open-source Figma-to-code that reads 100% of designs (no MCP truncation)`

**Post body:**
```
I built an open-source Claude Code plugin that converts Figma designs to
production code (React/React Native/Flutter) at 95% visual fidelity.

The core problem: Figma's MCP server truncates at ~25K tokens.
Real screens are 100K-350K tokens. You lose 40-60% of the design data.

My approach:
- REST API extraction: full design tree in 1 call, no truncation
- Smart chunking: ~10K-token buildable pieces
- Per-component verification: build → screenshot → diff → fix → re-verify
- 50-item fidelity checklist per component
- Production hardening: responsive, a11y, state management

Tech: Node.js extractor + Claude Code skill prompt (795 lines of build instructions)

GitHub: [link]

Happy to answer questions about the architecture or the Figma API deep-dive.
```

---

## Key Success Factors (What Actually Matters)

### 1. The Before/After Gallery Image
This is your #1 conversion asset. Show a real complex Figma design and the actual generated code running side-by-side. Make the accuracy visible.

### 2. The First Comment
This is your pitch. Make it personal, technical, and honest. Explain WHY you built it, not just WHAT it does.

### 3. Engagement Speed
Respond to every comment in under 5 minutes for the first 12 hours. PH's algorithm weights engagement heavily.

### 4. The Technical Story
Dev tools succeed on PH when the maker can go deep technically. "We bypass MCP's 25K token limit by using REST API extraction" is more compelling than "we make Figma-to-code easy."

### 5. Open Source
Free + open source + MIT license removes all friction. People try it, star the repo, and share it.

---

## Timeline

| When | Action |
|---|---|
| **Now** | Polish GitHub repo (README, badges, examples) |
| **Now** | Start engaging on Product Hunt (comment on other launches) |
| **Week -2** | Post "the problem" Twitter thread |
| **Week -2** | Write Dev.to article |
| **Week -1** | Create gallery images and demo video |
| **Week -1** | Post "the solution" Twitter thread |
| **Week -1** | Draft first comment and tagline |
| **Week -1** | Send heads-up DMs to network |
| **Day -1** | Final review of all assets |
| **Launch Day** | Submit 12:01 AM PT (Tue/Wed/Thu) |
| **Launch Day** | Post first comment immediately |
| **Launch Day** | Share on Twitter, Reddit, Slack, Discord |
| **Launch Day** | Respond to every comment all day |
| **Day +1** | Continue engaging on PH |
| **Day +1** | Write "behind the build" post |
| **Day +2** | Submit to Hacker News (Show HN) |
| **Day +3** | Add PH badge, track metrics, plan next steps |

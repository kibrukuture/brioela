# 25. Viral Growth and Sharing

## Goal

Build the mechanics that make Brioela grow without paid acquisition — through the natural behavior of users, the scan moment in grocery stores, and content that writes itself from real product interactions.

## Why This App Can Grow Without Ads

The primary competitor (Yuka) reached 73 million users and $20M revenue spending zero on marketing. Their founder's explanation: "the main reason for our growth is word of mouth. When someone uses the app and likes it, they talk about it to 10–20 people."

Yuka's product has no community, no AI, no cooking features, and no ambient layer. Brioela has all of those plus stronger viral moments. The growth mechanics are built into the product, not bolted on.

## The Core Viral Loop

1. User is in a grocery store. Scans a product. Sees something surprising — an ingredient they didn't know was in it, a community note from someone nearby saying it made them sick, a country of origin they weren't expecting.
2. User shows the person standing next to them in the aisle.
3. That person asks "what app is that?"
4. This happens in real life, every day, at scale across every grocery store globally.

No ad can replicate this. The scan moment IS the distribution.

## Shareable Moments Built Into the Product

These are features that generate shareable content as a side effect of normal use. The user doesn't share "about" the app — they share what the app discovered:

### Scan Discovery Share
After a scan reveals something surprising (critical additive, unexpected country of origin, community note from nearby), a share action appears inline. One tap generates a clean image card: product name, the finding, and "scanned with Brioela". Works on any social platform.

The share card does not look like an ad. It looks like information. That is the difference.

### Recipe Capture Share
When grandma's recipe is reconstructed and saved, the user can share the recipe card. It shows the recipe name, a photo from the session, and "recipe preserved with Brioela". This is an emotionally charged share — the grandma scenario is the feature people talk about.

### Cook Together Moment
When two friends in different cities finish cooking the same dish via a cooking room, the app offers to generate a "we cooked together" card. Both users receive it. Both can share it.

### Weekly Summary Share
The weekly food summary includes an optional one-tap share: "I ate well 5 out of 7 days this week. Brioela tracked it for me." Simple, credible, shareable.

## Share Sheet Integration as Acquisition

Every person who opens TikTok, YouTube, or Instagram and sees a food video they like is a potential Brioela user. The iOS and Android share sheet extension means:

- User is watching a recipe video on TikTok.
- Taps Share → Brioela.
- Recipe is imported.
- If the user does not have Brioela installed, they hit the PWA or a smart app banner to install.
- This creates a "I have a reason to download this" moment that is more powerful than any ad.

The share sheet extension must be built and listed in the App Store from day one. It is a distribution mechanism, not just a utility.

## Content Strategy (Organic, Not Ads)

Brioela does not need a content team. The product creates content moments that users generate:

### TikTok Angle
The content that works: "what I found when I scanned my groceries" — the creator scans 10 products in their kitchen, shows what the app found, reacts. This is a format that writes itself. Any user can make this video. The product is the hook.

Pain-point content also works: "why I stopped buying [brand]" — the scan result is the proof. Brioela is cited as the tool.

### Reddit Seeding (Early Stage)
r/nutrition, r/EatCheapAndHealthy, r/mealprep, r/ZeroWaste, r/Frugal, r/HealthyFood — these communities have active members who want to know what is actually in their food. A genuine product launch thread, not spam, in these communities drives early organic downloads. This is the Yuka playbook and it worked.

### LinkedIn / Professional Content
For the B2B tier and practitioner angle — nutritionists and dietitians are active on LinkedIn. Content about "tools I use with my clients" and product transparency reaches them there.

### Product Hunt Launch
One-time launch. Valuable for credibility, early reviews, and the developer community. Not a sustained channel.

## Viral Features Ranked by Shareability

| Feature | Viral potential | Why |
|---|---|---|
| Scan discovery of something surprising | Very high | In-aisle social moment, zero friction to share |
| Generational recipe capture | Very high | Emotionally charged, shareable story |
| Cook Together (remote) | High | Both people share simultaneously |
| Weekly food summary | Medium | Low-emotion but easy to share |
| Community notes discovery | Medium | "People near me said this" is inherently local and shareable |
| Healthy food map | Medium | "There's a farmers market nearby" — location-specific, useful to share |
| Recipe from TikTok video | Medium | Attribution can mention Brioela |

## Network Effect Lock-In

The hyperlocal community notes and healthy food map are network-effect features. They get more valuable as more people in the same city use the product. Once a city has 5,000 active users contributing sightings and notes, the map data is rich enough that a new user in that city gets immediately more value than the same user in a city with no Brioela users.

This creates geographic clusters of value that deepen over time and are hard to replicate from scratch by a competitor.

## What Not to Do

- No push notification re-engagement campaigns. Brioela does not spam users back.
- No referral programs with financial incentives. They attract low-quality users and cheapen the product.
- No promotional push notifications. Not ever.
- No paid influencer campaigns at launch — organic influencers who genuinely use the app are worth more and cost less.

## Success Metrics

- Organic install rate (installs from search, share, and word-of-mouth vs. direct).
- Share card generation rate per scan.
- Share sheet import conversion rate (people who share a video → download app).
- City-level network density (active users per city, as proxy for community note quality).
- App Store search ranking for "food scanner", "barcode scanner", "healthy food".

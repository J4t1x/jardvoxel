# JardFruit Cocktail — Professional Edition

Slot machine game built with **Phaser 3 + TypeScript + Vite + Zustand**.

Ported from the single-file `jardfruit-cocktail.html` into a modular, testable architecture.

## Quick Start

```bash
npm install
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Production build to dist/
npm run test     # Run unit tests
npm run preview  # Preview production build
```

## Architecture

```
src/
├── config/           # Game configuration (symbols, paylines, balance, upgrades, achievements, challenges)
├── systems/          # Game logic (RNG, ReelEngine, PaylineChecker, Economy, BonusRound, MysteryBox, etc)
├── scenes/           # Phaser scenes (Boot, Menu, Slot, Bonus, Gamble, Mystery)
├── audio/            # AudioEngine (Web Audio API chiptune synth)
├── store/            # Zustand store + SaveManager (localStorage)
└── main.ts           # Entry point
tests/                # Unit tests (Vitest)
```

## Game Features

- **5x3 Slot Machine** with 5 paylines (6 with upgrade)
- **9 Symbols**: cherry, peach, lemon, apple, pear, watermelon, wild, scatter, bonus
- **Bonus Round**: Match the lit symbol for prizes
- **Gamble**: Double or nothing card game (max 5 rounds)
- **Mystery Box**: Random rewards with rarity tiers (common → mythic)
- **Free Spins**: Triggered by 3+ scatters or 3+ wilds
- **Progressive Jackpot**: 5 wilds on a line wins the jackpot
- **Fruit Fever**: Win streak 5+ activates x2 multiplier mode
- **Golden Hour**: Mystery box reward with x3 multiplier
- **Prestige System**: Reset at level 5 for permanent multiplier
- **15 Upgrades**: Lucky Straw, Multiplier Boost, Insurance, Turbo, etc
- **16 Achievements**: With coin rewards
- **Daily Challenges**: 3 random challenges per day
- **Daily Login Rewards**: 7-day streak with increasing rewards
- **Auto-Spin**: Automatic spinning
- **Turbo Mode**: 2x faster spins
- **Nudge**: Adjust reels after near miss
- **Tap Combo**: Tap during spin for bonus multiplier
- **Near Miss Detection**: Consolation prize for 4-of-a-kind
- **Anticipation**: Last reel slows down when 3+ matching
- **PWA**: Offline support via service worker
- **Audio**: Chiptune synth with 11 tracks, dynamic layering
- **Haptics**: Vibration feedback on mobile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Engine | Phaser 3.87 |
| Language | TypeScript 5.7 (strict) |
| Bundler | Vite 6 |
| State | Zustand 5 |
| Tests | Vitest 2 |
| PWA | vite-plugin-pwa |

## Configuration

All game balance is in `src/config/balance.ts`:
- Starting balance, jackpot, bet options
- Free spins, fever, golden hour parameters
- Upgrade costs, achievement rewards
- Level thresholds, prestige multiplier
- Mystery box probabilities

## Testing

```bash
npm run test        # Run all tests once
npm run test:watch  # Watch mode
```

Tests cover:
- **RNG**: Symbol generation, weighted distribution, lucky straw
- **PaylineChecker**: Line evaluation, wild substitution, scatters, jackpots, near miss, anticipation, multipliers
- **Economy**: Bet deduction, win application, jackpot, upgrades, prestige, RTP

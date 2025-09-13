# AXI ASI LAB - Code-to-Art Portal

A creative coding platform for building, sharing, and minting generative art as NFTs.

## Features

- **Multi-Language Support**: GLSL shaders, p5.js, JavaScript Canvas 2D, Python, C++, OpenFrameworks, Processing
- **Cloud Storage**: Supabase integration for cross-device AXIOM synchronization
- **NFT Minting**: Mint your creations on multiple marketplaces
- **Community Features**: Public gallery, likes, views, comments, leaderboards
- **Organization**: Folders and collections for managing your AXIOMs
- **Multiple Themes**: Pro, Cyber, Gamer, Biohacker, B/W, Hacker modes

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Supabase Setup (Optional - for cloud storage)

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```
4. Fill in your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
5. Run the database migration in your Supabase SQL editor:
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and run in your Supabase project's SQL editor

### 3. Run Development Server
```bash
npm run dev
```

## Storage Options

### Local Storage (Default)
- AXIOMs stored in browser localStorage
- Works offline
- Device-specific

### Cloud Storage (Supabase)
- Cross-device synchronization
- Real-time updates
- Backup and sharing
- Requires Supabase setup

## Community Links

- **Telegram**: [t.me/axiarena](https://t.me/axiarena)
- **Twitter (AXI Arena)**: [x.com/axiarena](https://x.com/axiarena)
- **Twitter (AXI Lab)**: [x.com/axilab_](https://x.com/axilab_)
- **$AXI Token**: [DexScreener Chart](https://dexscreener.com/solana/atq5unl1z3zgpbbvasqbqtc1ei8rz3rdxbmgeipwhrre)

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Graphics**: WebGL (GLSL), Canvas 2D, p5.js

## Platform Fees

- **Engine Fee**: 6.9% on all NFT transactions
- **Purpose**: Supports $AXI token buybacks and ecosystem growth
- **Transparency**: All fees clearly displayed during minting process

## License

MIT License - see LICENSE file for details
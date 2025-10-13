# Bridge Canada

[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/8609daf8-78e6-4e8e-b94c-de3c4fef4169.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/8609daf8-78e6-4e8e-b94c-de3c4fef4169)
[![Vercel Deploy](https://deploy-badge.vercel.app/vercel/bridgecanada)](https://bridgecanada.vercel.app)

**Connecting Continents** - A professional business coordination service helping international delegations connect with Canadian entities.

## About

Bridge Canada specializes in arranging comprehensive business trips to Canada, providing end-to-end coordination services including:

- 🛂 VISA assistance and travel bookings
- 🤝 Business meeting arrangements
- 🚗 Transportation and logistics
- 🏨 Luxury accommodations
- 🍽️ Dining experiences
- 🎁 Tourism and shopping coordination

We have successfully hosted government delegations from Bangladesh (Ministry of Industries, Education, Housing & Public Works) across multiple Canadian cities.

## Tech Stack

Built with modern web technologies:

- **Framework**: [Next.js 15](https://nextjs.org) with App Router
- **Runtime**: Bun >=1.3.0
- **UI Components**: React 19 with Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom animations
- **Animation**: Framer Motion / Motion
- **Icons**: Tabler Icons, Lucide React
- **Code Quality**: Biome (linting & formatting)
- **Deployment**: Static export optimized for Vercel/GitHub Pages

## Getting Started

Install dependencies and run the development server:

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Available Scripts

```bash
bun dev       # Start development server with Turbopack
bun build     # Build for production
bun start     # Start production server
bun lint      # Run Biome linter
bun format    # Format code with Biome
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with fonts
│   ├── page.tsx            # Main landing page
│   └── globals.css         # Global styles
└── components/ui/
    ├── BlockInTextCard.tsx # Contact section with typewriter
    ├── ColourfulText.tsx   # Animated gradient text
    ├── FocusCards.tsx      # Interactive card gallery
    ├── MiniCard.tsx        # Service feature cards
    ├── TextParallaxContent.tsx # Parallax scroll section
    └── WobbleCard.tsx      # Interactive wobble cards
```

## Configuration

- **Static Export**: Configured for static site generation (`output: 'export'`)
- **Image Optimization**: Disabled for compatibility with static hosting
- **Typed Routes**: Enabled for type-safe navigation
- **Trailing Slash**: Enabled for better static hosting support

## Contact

**Office Address**: 1390 Prince of Wales, Unit 508

For inquiries about our services, contact us at: info@bridgecanada.ca

## License

MIT © 2021-2025 Bridge Canada N World

## Repository

[https://github.com/ragaeeb/bridgecanada](https://github.com/ragaeeb/bridgecanada)
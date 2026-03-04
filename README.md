# E-Wardrobe — Your Digital Closet

A modern, premium digital wardrobe application to organize your clothing collection. Upload photos, categorize items, add detailed notes, and search through your entire wardrobe with ease.

## Features

- **Image Management**: Upload and store clothing photos with drag-and-drop support.
- **Category Filtering**: Organize items by type — tops, bottoms, outerwear, shoes, bags, accessories, and more.
- **Detailed Notes**: Record brand, purchase date, size, color, and free-form notes for each item.
- **Global Search**: Instantly search across brand, notes, category, color, and size fields.
- **Premium Dark UI**: Glassmorphism, micro-animations, and a carefully crafted visual design system.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: Vanilla CSS with a custom design system
- **Database**: SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- **Storage**: Local filesystem (`public/uploads/`)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production

```bash
npm run build
npm start
```

## Project Structure

```
e-wardrobe/
├── app/
│   ├── api/
│   │   ├── categories/route.js   # GET clothing categories
│   │   ├── items/route.js        # GET (list/search/filter) + POST (create)
│   │   ├── items/[id]/route.js   # GET / PUT / DELETE single item
│   │   └── upload/route.js       # POST image upload
│   ├── globals.css               # Design system & global styles
│   ├── layout.js                 # Root layout with metadata
│   ├── page.js                   # Main page component
│   └── page.module.css           # Page-level styles
├── lib/
│   ├── categories.js             # Category definitions
│   └── db.js                     # SQLite database singleton
├── public/uploads/               # Uploaded images (gitignored)
└── data/                         # SQLite database (gitignored)
```

## License

MIT

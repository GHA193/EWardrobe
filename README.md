# E-Wardrobe — Your Digital Closet

A modern, premium digital wardrobe application to organize your clothing collection. Upload photos, categorize items, add detailed notes, and search through your entire wardrobe with ease.

## Features

- **Image Management**: Upload and store clothing photos with drag-and-drop support.
- **Category Filtering & Management**: Organize items by type. Create, edit, and delete custom categories dynamically to fit your wardrobe.
- **Detailed Notes**: Record brand, purchase date, size, color, and free-form notes for each item.
- **Global Search**: Instantly search across brand, notes, category, color, and size fields.
- **Native Access Control**: Cookie-based Session authentication with a robust local SQLite setup. Includes a forced setup wizard, global middleware route interception, and strict complexity password enforcement.
- **Modern Light UI**: Glassmorphism, micro-animations, custom scrollbars, and a carefully crafted bright visual design system.
- **Internationalization (i18n)**: Built-in bilingual support with a toggle for English and Chinese (Default), saved to local storage.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: Vanilla CSS with a custom design system
- **Database**: SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- **Storage**: Local filesystem (`public/uploads/`)
- **i18n**: Custom dictionary Implementation

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
│   │   ├── auth/                 # Native authentication endpoints (setup, login, logout, change-password)
│   │   ├── categories/route.js   # GET / POST custom clothing categories
│   │   ├── categories/[id]/route.js # PUT / DELETE custom clothing categories
│   │   ├── items/route.js        # GET (list/search/filter) + POST (create)
│   │   ├── items/[id]/route.js   # GET / PUT / DELETE single item
│   │   └── upload/route.js       # POST image upload
│   ├── login/                    # Independent authentication & setup page
│   ├── globals.css               # Design system & global styles
│   ├── layout.js                 # Root layout with metadata
│   ├── page.js                   # Main page component
│   └── page.module.css           # Page-level styles
├── lib/
│   ├── auth.js                   # Security utilities (scrypt hashing, session logic)
│   ├── db.js                     # SQLite database singleton & initialization
│   └── i18n.js                   # English and Chinese translation dictionaries
├── middleware.js                 # Next.js global route interception for access control
├── public/uploads/               # Uploaded images (gitignored)
└── data/                         # SQLite database (gitignored)
```

## Future Plans

- Migrate from SQLite to a robust relational database (e.g., MySQL or PostgreSQL)
- Remote Object Storage for images
- Outfit building and matching
- Wear analytics and season-based recommendations
- AI-driven auto-tagging

## License

MIT

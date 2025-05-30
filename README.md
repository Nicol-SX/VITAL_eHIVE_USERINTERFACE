# VITAL DGS Dashboard

A Next.js dashboard application for VITAL DGS status monitoring.

## Features

- Status monitoring dashboard with filtering and search
- Batch and process views
- Status update popup
- Modern UI with Tailwind CSS
- Fully responsive design

## Prerequisites

- Node.js 18.x or later
- npm or yarn package manager

## Getting Started

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Run the development server:
```bash
npm run dev
# or
yarn dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/` - Next.js application files
  - `components/` - React components
    - `StatusMonitoring.tsx` - Main dashboard component
    - `StatusPopup.tsx` - Status update popup component
  - `page.tsx` - Main page component
- `public/` - Static assets
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `tsconfig.json` - TypeScript configuration

## Technologies Used

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Heroicons 
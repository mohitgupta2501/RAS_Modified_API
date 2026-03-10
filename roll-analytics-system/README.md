# Roll Analytics System

Angular 17+ application with standalone components, dark theme, and responsive layout.

## Prerequisites

- **Node.js** v20.19+ or v22.12+ (Angular 17 requires Node 20+)
- npm 9+

## Setup

```bash
cd roll-analytics-system
npm install
```

## Development

```bash
npm start
```

Navigate to `http://localhost:4200/`. Default route redirects to `/dashboard`.

## Build

```bash
npm run build
```

## Project Structure

- `src/app/core/layout/` - Navbar, Sidebar, Layout components
- `src/app/features/` - Lazy-loaded feature modules (Dashboard, Roll Details, etc.)
- `src/app/shared/services/` - Shared services (Theme)
- `src/assets/images/` - Logo placeholders

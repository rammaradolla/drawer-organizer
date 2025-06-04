# Drawer Organizer

A web application for designing custom drawer organizers with a drag-and-drop interface.

## Features

- Design drawer organizers with custom dimensions
- Drag-and-drop interface for compartment placement
- Real-time price calculation
- Export designs as PDF
- Submit orders via email

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm

### Client Setup

```bash
cd client
npm install
npm run dev
```

### Server Setup

```bash
cd server
npm install
# Create a .env file with required environment variables
npm start
```

### Environment Variables

Create a `.env` file in the server directory with the following variables:

```
PORT=3000
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
CORS_ORIGIN=http://localhost:5173
```

## Development

- Client runs on: http://localhost:5173
- Server runs on: http://localhost:3000

## Tech Stack

- Frontend: React, Vite, Konva.js, TailwindCSS
- Backend: Node.js, Express, Nodemailer, Puppeteer 
# Edgeworks Timesheet

A modern timesheet management application built with React, TypeScript

## Features

- 🔐 **User Authentication** - Secure login, registration, and password reset
- ⏱️ **Timesheet Management** - Track time entries for different projects and clients
- 📊 **Reporting** - Generate and export reports with data visualization
- 👥 **Project Management** - Organize work by clients and projects
- 📈 **Data Visualization** - Interactive charts powered by Recharts
- 📤 **Export Functionality** - Export timesheets to Excel format

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **UI Components**: Custom components with Lucide React icons
- **Charts**: Recharts
- **State Management**: React Context API

## Prerequisites

- Node.js (v18 or higher)
- Bun (or npm/yarn)

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/salvatoreiannola72/timetracker.git
   cd timetracker
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Configure environment variables**
   

4. **Run the development server**
   ```bash
   bun run dev
   # or
   npm run dev
   ```

5. **Open the app**
   
   Navigate to `http://localhost:5173` in your browser

## Deploy to Heroku

This application is configured to run on Heroku with dynamic port binding.

1. **Install Heroku CLI**
   
   Download and install from [https://devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create a new Heroku app**
   ```bash
   heroku create your-app-name
   ```


5. **Deploy to Heroku**
   ```bash
   git push heroku main
   ```

6. **Open your app**
   ```bash
   heroku open
   ```

The application uses:
- **Express server** (`server.js`) to serve the built React app
- **Dynamic PORT** from Heroku's environment variable
- **Procfile** to specify the start command

## Build for Production


```bash
bun run build
# or
npm run build
```

The production-ready files will be in the `dist` folder.

## Project Structure

```
├── components/         # Reusable UI components
├── context/           # React Context for state management
├── pages/             # Application pages/routes
├── public/            # Static assets
└── types.ts           # TypeScript type definitions
```

## License

Private project - All rights reserved

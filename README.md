# Nuxt 4 SaaS Starter

[![Nuxt](https://img.shields.io/badge/Nuxt-4.2-00DC82?style=flat&logo=nuxt.js)](https://nuxt.com)
[![Nuxt UI](https://img.shields.io/badge/Nuxt_UI-4.3-00DC82?style=flat&logo=nuxt.js)](https://ui.nuxt.com)
[![NuxtHub](https://img.shields.io/badge/NuxtHub-Enabled-F38020?style=flat&logo=cloudflare)](https://hub.nuxt.com)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=flat&logo=drizzle)](https://orm.drizzle.team)

A structured, production-ready SaaS boilerplate built with **Nuxt 4**, **NuxtHub**, and **Nuxt UI v4**. Designed for speed, scalability, and ease of deployment to Cloudflare.

## ✨ Features

- **Full-Stack Power**: Built on [Nuxt 4](https://nuxt.com) with a server-first approach.
- **Database**: [SQLite (D1)](https://developers.cloudflare.com/d1/) managed via [Drizzle ORM](https://orm.drizzle.team) for type-safe database interactions.
- **Authentication**: Secure, session-based authentication using [Nuxt Auth Utils](https://github.com/atinux/nuxt-auth-utils).
- **UI Framework**: Beautiful, accessible components with [Nuxt UI v4](https://ui.nuxt.com) (Tailwind CSS under the hood).
- **Serverless Ready**: Pre-configured with [NuxtHub](https://hub.nuxt.com) for Cloudflare Workers (Blob Storage, KV, Database, Cache).
- **Email**: Transactional email support configured for **ZeptoMail**.
- **Testing**: Unit and integration testing setup with **Vitest**.
- **Type Safety**: End-to-end TypeScript support.

## 🛠 Tech Stack

- **Framework**: [Nuxt 4](https://nuxt.com)
- **Language**: TypeScript
- **Database**: SQLite (Cloudflare D1) via Drizzle ORM
- **Styling**: Tailwind CSS (via Nuxt UI)
- **Deployment**: Cloudflare Pages / Workers
- **Package Manager**: Bun (recommended) or npm/pnpm

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Bun](https://bun.sh/) (recommended) or npm/pnpm

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <your-repo-url>
    cd nuxt-app
    ```

2.  **Install dependencies:**

    ```bash
    bun install
    # or
    npm install
    ```

3.  **Setup Environment Variables:**

    Copy the example `.env` file and update it with your credentials.

    ```bash
    cp .env.example .env
    ```

    Update the `.env` file with your specific configuration (e.g., `ZEPTOMAIL_API_KEY`, `NUXT_SESSION_PASSWORD`).

### Development

Start the development server:

```bash
bun dev
# or
npm run dev
```

Visit `http://localhost:3000` to see your app running.

## 🗄 Database

This project uses **Drizzle ORM** with **SQLite**.

### Standard Commands

-   **Generate Migrations**: Create SQL migrations based on your schema changes.

    ```bash
    bun db:generate
    ```

-   **Migrate Database**: Apply migrations to your local or remote database (managed via NuxtHub in dev).

    *Note: In development with NuxtHub, migrations are often handled automatically or via the NuxtHub admin interface.*

## 📦 Deployment

This project is optimized for deployment on **Cloudflare Pages** via **NuxtHub**.

1.  **Build the project:**

    ```bash
    bun run build
    ```

2.  **Deploy:**

    You can deploy using Wrangler:

    ```bash
    bun run deploy
    ```

    *Ensure you are logged in to Cloudflare (`npx wrangler login`) and have linked your project.*

## 🧪 Testing

Run the test suite using Vitest:

```bash
# Run all tests
bun test

# Run in watch mode
bun run test:watch

# Run with coverage
bun run test:coverage
```

## 📂 Project Structure

-   `app/`: Frontend Vue components, pages, and layouts.
-   `server/`: Backend API routes, database schema, and server utilities.
    -   `server/database/schema.ts`: Drizzle ORM schema definitions.
    -   `server/api/`: API endpoints.
-   `public/`: Static assets.
-   `nuxt.config.ts`: Nuxt configuration.

## 📄 License

MIT License.

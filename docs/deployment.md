# Deployment Guide

This project is configured for automated deployment to **Cloudflare Pages** using GitHub Actions.

## Prerequisites

1.  A **Cloudflare Account**.
2.  A **GitHub Repository** hosting this code.
3.  **Bun** installed locally (for local development/testing).

---

## 1. Cloudflare Setup (One-time)

If you are setting this up for the first time (or someone else is cloning this repo), you need to create your own Cloudflare resources.

### Step 1.1: Create Resources
Run these commands locally to create the infrastructure:

```bash
# 1. Create Database
npx wrangler d1 create nuxt-saas-db
# -> Copy the "database_id" output and paste it into wrangler.jsonc

# 2. Create KV Namespaces
npx wrangler kv:namespace create KV
npx wrangler kv:namespace create CACHE
# -> Copy the "id" outputs and paste them into wrangler.jsonc

# 3. Create R2 Bucket
npx wrangler r2 bucket create nuxt-saas-blob
# -> Ensure "bucket_name" in wrangler.jsonc matches (e.g., nuxt-saas-blob)
```

### Step 1.2: Deploy Project & Set Secrets
Once `wrangler.jsonc` has your IDs:

1.  **Create Project**:
    ```bash
    npx wrangler pages deploy dist --project-name=nuxt-saas-starter
    ```
2.  **Set Production Secrets**:
    Your application secrets (API keys, passwords) are stored **securely in Cloudflare**, not in GitHub.
    Run these commands locally to set them for the production environment:

    ```bash
    # App URL (Required for correct email links)
    npx wrangler pages secret put NUXT_PUBLIC_APP_URL --project-name nuxt-saas-starter

    # ZeptoMail API Key
    npx wrangler pages secret put NUXT_ZEPTOMAIL_API_KEY --project-name nuxt-saas-starter

    # Session Password (min 32 chars)
    npx wrangler pages secret put NUXT_SESSION_PASSWORD --project-name nuxt-saas-starter
    
    # Email Settings
    npx wrangler pages secret put NUXT_PUBLIC_MAIL_FROM_ADDRESS --project-name nuxt-saas-starter
    npx wrangler pages secret put NUXT_PUBLIC_MAIL_FROM_NAME --project-name nuxt-saas-starter
    ```

---

## 2. GitHub Configuration

To allow GitHub to deploy to your Cloudflare account, you need to add credentials.

### Step 2.1: Get Cloudflare Credentials

1.  **Account ID**:
    Run `npx wrangler whoami` locally. Copy the `Account ID`.
2.  **API Token**:
    Go to [Cloudflare Dashboard > My Profile > API Tokens](https://dash.cloudflare.com/profile/api-tokens).
    -   Click **Create Token**.
    -   Use the **Edit Cloudflare Workers** template.
    -   Select your account and finish. Copy the token.

### Step 2.2: Add Secrets to GitHub

1.  Go to your GitHub Repository.
2.  Navigate to **Settings** > **Secrets and variables** > **Actions**.
3.  Click **New repository secret** and add:
    -   **Name**: `CLOUDFLARE_ACCOUNT_ID`
        -   **Value**: (Paste your Account ID)
    -   **Name**: `CLOUDFLARE_API_TOKEN`
        -   **Value**: (Paste your API Token)

---

## 3. Deployment

**Automatic Deployment**:
Simply push to the `main` branch. The GitHub Action defined in `.github/workflows/deploy.yml` will:
1.  Install dependencies (using Bun).
2.  Build the application (`server` and `client`).
3.  Deploy the output to Cloudflare Pages.

**Manual Deployment (Optional)**:
You can can always deploy locally if needed:
```bash
NITRO_PRESET=cloudflare_pages bun run build
npx wrangler pages deploy dist --project-name=nuxt-saas-starter --commit-dirty=true
```

---

## Troubleshooting

-   **"Email links point to localhost"**:
    Ensure you have set the `NUXT_PUBLIC_APP_URL` secret in Cloudflare to your production URL (e.g., `https://your-project.pages.dev`).
    
-   **Build Failures**:
    Check the "Actions" tab in GitHub to see the build logs. Common issues include missing dependencies or type errors.

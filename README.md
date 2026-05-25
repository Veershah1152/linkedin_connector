# 🛠️ LinkForge AI — Ultimate LinkedIn Automation & Career Suite

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=flat&logo=linkedin)](https://linkedin.com)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey?style=flat&logo=express)](https://expressjs.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat&logo=supabase)](https://supabase.com)
[![AI Engine](https://img.shields.io/badge/xAI%20%2F%20Gemini-Llama--3%20%26%20Flash-orange)](https://x.ai)

An AI-powered, multi-tenant SaaS application designed to streamline **LinkedIn content creation**, **post scheduling**, **analytics tracking**, and **career optimization** (Resume ATS parsing, version control, and LinkedIn certifications publishing).

---

## 🌟 Core Philosophy & Purpose: What LinkForge AI Stands For

Today, professional growth and career visibility are deeply intertwined. A stellar resume is less effective if you have no industry presence, and a high-profile industry presence won't translate to career growth if your professional credentials (resumes, certifications) fail to pass automated ATS checks or matching filters.

**LinkForge AI** stands for bridging this gap by uniting **Content Authority** and **Career Readiness** into a single, unified, and secure workspace. It is built upon three core pillars:

1. **Integrated Career Synergy**: Rather than using disjointed tools (like Buffer for scheduling, ChatGPT for drafting, Jobscan for resume checks, and manually updating LinkedIn certs), LinkForge AI integrates the entire flow. It matches your actual career achievements to your content-creation drafts and verifies that both align with target industry profiles.
2. **AI-Driven Empowerment**: Leveraging advanced LLMs (Grok/xAI and Gemini), LinkForge AI helps you optimize your career materials, detect structural resume deficiencies, extract metadata from uploaded PDF credentials, and schedule engaging posts at peak traffic times.
3. **Data Security & Privacy**: Built on Supabase with strict Row-Level Security (RLS), LinkForge AI ensures that your draft content, resume revisions, ATS analysis history, and credential files remain private, encrypted, and isolated to your specific account.

By removing the friction of manual posting, resume formatting, and credential publishing, LinkForge AI enables creators, job seekers, and industry leaders to focus on what truly matters: **sharing authentic knowledge, building networks, and scaling their careers.**

---

## 🚀 Key Modules & Features

### 1. ✍️ Content & Scheduling Suite
* **AI Post Generator**: Leverage advanced LLMs (Grok/xAI, Gemini) to craft high-converting LinkedIn posts, write-ups, or hooks based on custom prompts.
* **Smart Queue & Scheduler**: Plan, queue, and schedule posts for optimal times. Driven by **Bull Queue** and **Redis** for robust background job execution.
* **Analytics Dashboard**: Get detailed metrics on post engagement, impressions, and performance over time using dynamic **Recharts** visualizations.

### 2. 💼 Career & Resume Optimization Suite
* **LinkedIn Profile Sync**: Instantly import your profile details to bootstrap a professional resume template.
* **ATS Scoring & Audit**: Run an automated ATS compatibility check using AI. Identifies weak areas, detects missing/recommended keywords, and provides clear suggestions for target roles.
* **Resume Version Control**: Automatically saves snapshots on every edit. Tracks improvements, ATS scores, and target roles dynamically over time.
* **Smart Resume Optimizer**: Tailor bullet points, achievements, and professional summaries using **Groq AI (Llama 3.3)** to align with specific target roles.
* **Certification Vault & Sync**: Upload certifications (images/PDFs) with automatic metadata extraction. Generates pre-filled share URLs to seamlessly publish credentials to your LinkedIn profile.

---

## 🛠️ Tech Stack & Architecture

### **Frontend**
* **Framework**: Next.js 16 (App Router)
* **Styling**: Tailwind CSS v4 + Vanilla CSS Variables (Forced Light Theme)
* **Visuals**: Lucide Icons & Recharts

### **Backend**
* **Runtime**: Node.js & Express.js
* **Queues / Cron**: Bull (Redis-backed) & Node-Cron
* **Validation**: Zod (Runtime type safety)
* **API Security**: Helmet, Express Rate Limit, JWT-based Route Guarding

### **Database & Services**
* **Database**: Supabase PostgreSQL
* **Security**: Row-Level Security (RLS) policies per user
* **AI Engines**:
  * **Groq SDK** (`llama-3.3-70b-versatile` / `llama3-8b-8192`)
  * **Gemini SDK** (Multimodal / OCR / Document Parsing)
* **Storage**: Supabase Storage Buckets for resumes and certification media

---

## 📂 Project Structure

```
linkedin_connector/
├── backend/                  # Node.js + Express API Server
│   ├── src/
│   │   ├── config/           # Supabase & Env configurations
│   │   ├── middleware/       # JWT Auth & Zod Schema Validation
│   │   ├── routes/           # Router groups (auth, posts, career, etc.)
│   │   ├── services/         # Core business logic (ATS, Resume, Queues)
│   │   └── server.js         # Express App entrypoint
│   └── package.json
├── frontend/                 # Next.js 16 Web Application
│   ├── app/                  # App Router Pages (dashboard, career, posts, etc.)
│   ├── components/           # Reusable UI component library
│   ├── lib/                  # Shared API/Fetch helpers
│   └── package.json
├── supabase/
│   └── migrations/           # Database schema files
├── .env.example              # Global environment template
└── README.md
```

---

## 🚦 Getting Started

### 📋 Prerequisites
Make sure you have the following installed locally:
* **Node.js** (v18 or higher)
* **Redis Server** (required for post scheduling queues; runs on `6379` by default)
* **Supabase CLI** (optional, or a Supabase cloud project)

---

### ⚙️ Step 1: Environment Variables Setup
Copy the template `.env.example` to `.env` in the root folder:
```bash
cp .env.example .env
```
Fill out the required API keys:
* **Supabase**: `SUPABASE_URL` and keys for database connection.
* **LinkedIn Developer App**: Client ID, Client Secret, and redirect URI for OAuth authentication.
* **AI Providers**: `GROK_API_KEY` (xAI) and `GEMINI_API_KEY` (Google AI).
* **Redis**: Your Redis URL (e.g., `redis://localhost:6379`).

---

### 🗄️ Step 2: Database Migration
Go to your Supabase SQL Editor and execute the SQL file:
```bash
supabase/migrations/001_initial_schema.sql
```
This sets up tables for `users`, `posts`, `resumes`, `resume_versions`, `ats_analyses`, and `certifications_uploads`, along with Row-Level Security (RLS) policies.

---

### 📦 Step 3: Installation & Dev Server

Open two terminals to run the backend and frontend simultaneously:

#### Terminal 1: Backend
```bash
cd backend
npm install
npm run dev
```
*API will run at http://localhost:5000*
*Health Check: http://localhost:5000/api/health*

#### Terminal 2: Frontend
```bash
cd frontend
npm install
npm run dev
```
*Web App will run at http://localhost:3000*

---

## 🔌 API Documentation Summary

### 🔐 Authentication
* `GET /api/auth/linkedin` - Generates and redirects to LinkedIn OAuth flow.
* `GET /api/auth/linkedin/callback` - OAuth callback handler; exchanges code for tokens, signs user JWT.
* `GET /api/auth/me` - Fetches authenticated user info.

### 📝 Posts & Scheduling
* `POST /api/posts` - Create/Schedule a post.
* `GET /api/posts` - Fetch current user's posts.
* `DELETE /api/posts/:id` - Remove scheduled post.
* `POST /api/ai/generate` - AI post generation.

### 💼 Career & Resumes
* `GET /api/career/import` - Sync data from LinkedIn profile.
* `POST /api/career/resumes` - Create resume.
* `PATCH /api/career/resumes/:id` - Edit resume (creates version history).
* `POST /api/career/resumes/:id/optimize` - AI resume optimization based on target job description.
* `POST /api/career/resumes/:id/ats` - Perform ATS analysis & scoring.
* `POST /api/career/certifications` - Upload credential (image/PDF) & get pre-filled LinkedIn publishing link.

---

## 🔒 Security & Row Level Isolation
All transactions explicitly pass the authenticated user's ID verifying data ownership via Supabase RLS. No user can view or update another user's posts, resumes, analyses, or certifications.

---

## ☁️ Cloudflare Serverless Deployment (Production Edge Setup)

For production, the application is designed to be fully compatible with the serverless **Cloudflare V8 Edge Runtime** (offering minimal latency, global scale, and 0ms cold starts).

### 🚀 Production URLs
* **Frontend (Cloudflare Pages)**: [https://linkedin-connector-frontend.pages.dev](https://linkedin-connector-frontend.pages.dev)
* **Backend (Cloudflare Workers)**: `https://linkedin-connector-backend.your-subdomain.workers.dev`

### ⚙️ Serverless Architecture Optimizations
To compile and run within V8 Edge Workers, several key modifications were introduced:
1. **Gemini 1.5 Flash Document Processing**: Removed native Node.js binaries/filesystem dependencies (`pdf-parse` and C++ compiled `tesseract.js` OCR) and replaced them with direct, lightweight multimodal **Gemini 1.5 Flash** API calls. This handles text extraction and image/scanned document OCR instantly.
2. **Transparent Environment Proxy**: Wrapped database clients and global configuration in Javascript `Proxy` instances. On initial load, clients are initialized lazily; on incoming requests, the environment parameters are transparently fetched from the runtime request context (`c.env`).
3. **Cross-Domain Token Authentication**: Modern browsers block third-party cookies across differing domains (`pages.dev` to `workers.dev`). To bypass this, the backend callback redirect passes tokens via query parameters (`accessToken` & `refreshToken`) which the frontend securely extracts, cleanses from the address bar (via `window.history.replaceState`), stores in `localStorage`, and sends via the `Authorization: Bearer <token>` header on subsequent requests.
4. **Hono Router**: The Worker is powered by a high-performance **Hono** router ([worker.js](file:///c:/veer/project/linkedin_connector/backend/src/worker.js)) handling request routing and multipart/form-data buffering transparently.

---

### 📦 How to Deploy

#### 1. Deploy the Backend Worker
1. Go to the `backend` directory.
2. Edit [wrangler.toml](file:///c:/veer/project/linkedin_connector/backend/wrangler.toml) to configure bindings:
   ```toml
   [vars]
   SUPABASE_URL = "https://your-supabase-project.supabase.co"
   CLIENT_URL = "https://linkedin-connector-frontend.pages.dev"
   GROQ_API_URL = "https://api.groq.com"
   LINKEDIN_CLIENT_ID = "your-linkedin-client-id"
   LINKEDIN_REDIRECT_URI = "https://linkedin-connector-backend.your-subdomain.workers.dev/api/auth/linkedin/callback"
   ```
3. Set your production secrets securely:
   ```bash
   echo "your-supabase-service-role-key" | npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   echo "your-groq-api-key" | npx wrangler secret put GROQ_API_KEY
   echo "your-gemini-api-key" | npx wrangler secret put GEMINI_API_KEY
   echo "your-jwt-secret" | npx wrangler secret put JWT_SECRET
   echo "your-linkedin-client-secret" | npx wrangler secret put LINKEDIN_CLIENT_SECRET
   ```
4. Deploy to Cloudflare Workers:
   ```bash
   npx wrangler deploy
   ```

#### 2. Deploy the Frontend Pages
1. Go to the `frontend` directory.
2. Ensure [next.config.mjs](file:///c:/veer/project/linkedin_connector/frontend/next.config.mjs) is configured for static export:
   ```javascript
   const nextConfig = {
     output: 'export',
     images: { unoptimized: true }
   };
   ```
3. Configure `frontend/.env.local` to point to the deployed Worker endpoint:
   ```text
   NEXT_PUBLIC_API_URL=https://linkedin-connector-backend.your-subdomain.workers.dev
   ```
4. Run Next.js static build to generate the output folder:
   ```bash
   npm run build
   ```
5. Deploy static assets to Cloudflare Pages:
   ```bash
   npx wrangler pages deploy
   ```
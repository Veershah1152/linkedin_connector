# LinkedIn Resume & Career Automation: Technical Architecture

This document describes the technical architecture, database designs, module relationships, and API flows for the LinkedIn Resume & Career Automation system.

---

## 1. System Architecture

The Career Automation features are integrated directly into the multi-tenant SaaS application backend. The platform provides data isolation between tenants via Postgres Row-Level Security (RLS) policies.

```mermaid
graph TD
    Client[Next.js Client Application] <-->|HTTPS / JSON / JWT| API[Express API Server]
    API <-->|Admin Client / RLS Bypass| DB[(Supabase PostgreSQL Database)]
    API <-->|Official HTTP OAuth / SDK| LinkedIn[LinkedIn OAuth & API Endpoints]
    API <-->|Groq SDK| Groq[Groq AI llama-3.3-70b-versatile]
    API <-->|Multer / SDK| S3[Supabase Storage Buckets]
```

### Security & Data Isolation
- **Authentication**: JWT token-based verification via a secure cookies or Bearer tokens.
- **Isolation**: Every table is mapped with row-level security (RLS) constraints matching `auth.uid() = user_id`.
- **Throttling**: Stricter rate limiting applied on Groq-powered AI optimization and analysis endpoints via `express-rate-limit`.

---

## 2. Module Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── env.js                # Environment credentials & endpoints
│   │   └── supabase.js           # Admin and public Supabase clients
│   ├── middleware/
│   │   ├── auth.js               # User session & tenant verification
│   │   └── validate.js           # Input validation utilizing Zod
│   ├── routes/
│   │   └── career.routes.js      # REST API endpoints mapping
│   ├── services/
│   │   ├── linkedin-import.service.js   # Profile import handlers
│   │   ├── resume.service.js     # Version management, optimization & CRUD
│   │   ├── ats.service.js        # Groq-based ATS parsing & grading
│   │   └── certification.service.js # Media uploads and certification pipelines
│   └── server.js                 # Global routing and middleware initialization
```

---

## 3. Database Schema

All tables enforce structural referential integrity linked directly to the parent `users` table.

```mermaid
erDiagram
    users ||--o{ resumes : creates
    resumes ||--o{ resume_versions : saves
    resumes ||--o{ ats_analyses : analyses
    users ||--o{ certifications_uploads : uploads

    users {
        uuid id PK
        varchar linkedin_id
        varchar email
        varchar full_name
        text profile_image_url
        text linkedin_access_token
        timestamptz linkedin_token_expires_at
    }

    resumes {
        uuid id PK
        uuid user_id FK
        varchar title
        varchar target_role
        varchar template_id
        jsonb contact_info
        text summary
        text[] skills
        jsonb projects
        jsonb work_experience
        jsonb education
        jsonb certifications
        text[] achievements
        jsonb social_links
        varchar status
        boolean is_optimized
        integer ats_score
        integer version
        jsonb raw_linkedin_data
        timestamptz created_at
        timestamptz updated_at
    }

    resume_versions {
        uuid id PK
        uuid resume_id FK
        integer version
        jsonb content
        integer ats_score
        varchar target_role
        timestamptz created_at
    }

    ats_analyses {
        uuid id PK
        uuid resume_id FK
        varchar target_role
        integer score
        jsonb keyword_analysis
        text[] weak_sections
        text relevance_analysis
        jsonb formatting_analysis
        text[] suggestions
        timestamptz created_at
    }

    certifications_uploads {
        uuid id PK
        uuid user_id FK
        varchar title
        varchar issuing_organization
        date issue_date
        varchar credential_id
        text credential_url
        text file_url
        varchar status
        jsonb publish_payload
        timestamptz created_at
        timestamptz updated_at
    }
```

---

## 4. API Flow Diagrams

### LinkedIn Profile Import Workflow

When the user initiates a LinkedIn sync:

```mermaid
sequenceDiagram
    autonumber
    Client->>API: GET /api/career/import
    API->>DB: Fetch linkedin_access_token
    DB-->>API: Return token & expiry
    alt Token expired or missing
        API-->>Client: 401 Unauthorized (Force reconnection)
    end
    API->>LinkedIn: GET /v2/userinfo
    alt Profile scopes missing/restricted
        LinkedIn-->>API: 403 Forbidden / Limited Profile
        API->>API: Initialize intelligent mock fallback template
    else Profile returned
        LinkedIn-->>API: Core Profile JSON
        API->>API: Map profile & append mock skeleton
    end
    API-->>Client: 200 OK (Cleaned Profile JSON)
```

### Resume Target Role Optimization

When optimizing bullet points, skills, and summaries for a specific job:

```mermaid
sequenceDiagram
    autonumber
    Client->>API: POST /api/career/resumes/:id/optimize { targetRole }
    API->>DB: Get current resume fields
    DB-->>API: Current resume JSON
    API->>Groq: Generate optimized schema (llama-3.3-70b-versatile)
    Groq-->>API: Structured JSON (Optimized summary, skills, bullets)
    API->>API: Increment version (+1)
    API->>DB: Update resume record & insert resume_versions snapshot
    DB-->>API: Confirmed Save
    API-->>Client: 200 OK (Optimized Resume & AI Recommendations)
```

### Certification Upload & LinkedIn Publishing

Due to API constraints on write-scopes for general developer profiles, the system employs a robust fallback:

```mermaid
sequenceDiagram
    autonumber
    Client->>API: POST /api/career/certifications (Multipart upload)
    API->>DB: Save file to Supabase Storage & Insert record
    DB-->>API: Certification Record
    API->>API: Compile fields & generate pre-filled workflow link
    API-->>Client: 201 Created (Record & redirect share workflow URL)
    Client->>LinkedIn: Redirect user to pre-filled edit window
    Note over Client,LinkedIn: User clicks "Save" directly on LinkedIn UI
```

---

## 5. API Reference

### 1. Import Profile
- **Endpoint**: `GET /api/career/import`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "fullName": "Jane Doe",
    "email": "jane.doe@example.com",
    "profilePicture": "https://media.licdn.com/dms/image/...",
    "headline": "Software Engineer at TechCorp",
    "about": "Experience building web systems...",
    "experience": [
      {
        "id": "exp_1",
        "companyName": "TechCorp",
        "jobTitle": "Software Engineer",
        "startDate": "2023-01-01",
        "endDate": null,
        "current": true,
        "location": "Remote",
        "description": "Implemented web APIs..."
      }
    ],
    "skills": ["JavaScript", "React", "Node.js"],
    "certifications": [],
    "achievements": []
  }
}
```

### 2. Update Resume (Automatic Versioning)
- **Endpoint**: `PATCH /api/career/resumes/:id`
- **Request Body**: Partial resume fields.
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "res_uuid_123",
    "version": 4,
    "title": "Jane's Core Resume",
    "summary": "Optimized developer summary...",
    "updated_at": "2026-05-20T12:00:00Z"
  }
}
```

### 3. AI Target Role Optimization
- **Endpoint**: `POST /api/career/resumes/:id/optimize`
- **Request Body**:
```json
{
  "targetRole": "AI Engineer"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "resume": {
      "id": "res_uuid_123",
      "version": 5,
      "is_optimized": true,
      "summary": "AI Engineer with experience fine-tuning models...",
      "skills": ["PyTorch", "Python", "JavaScript", "NLP"]
    },
    "suggestedImprovements": [
      "Highlight specific projects involving LLMs or Groq integrations."
    ],
    "missingSkills": ["PyTorch", "LLMOps"]
  }
}
```

### 4. ATS Scoring & Audit Report
- **Endpoint**: `POST /api/career/resumes/:id/ats`
- **Request Body**:
```json
{
  "targetRole": "AI Engineer"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "analysis": {
      "id": "ats_analysis_uuid",
      "score": 82,
      "keyword_analysis": {
        "matched": ["Python", "Transformers"],
        "missing": ["CUDA", "TensorFlow"]
      },
      "weak_sections": ["projects"],
      "relevance_analysis": "Highly relevant for general ML but lacks deep hardware engineering projects.",
      "formatting_analysis": {
        "readability": "Good",
        "bulletPoints": "Action-oriented bullet points verified."
      },
      "suggestions": [
        "Include quantitative performance metrics for GPU throughput optimizations."
      ]
    }
  }
}
```

### 5. Upload Certification
- **Endpoint**: `POST /api/career/certifications`
- **Request (Multipart Form)**:
  - `file`: certification image or PDF
  - `title`: "AWS Solutions Architect"
  - `issuingOrganization`: "Amazon Web Services"
  - `issueDate`: "2026-01-15"
- **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "certification": {
      "id": "cert_uuid_456",
      "title": "AWS Solutions Architect",
      "file_url": "https://supabase-bucket-url/certifications/...",
      "status": "pending"
    },
    "sharingUrl": "https://www.linkedin.com/profile/add?startTask=CERTIFICATION&name=AWS+Solutions+Architect&organizationName=Amazon+Web+Services&issueMonth=1&issueYear=2026"
  }
}
```

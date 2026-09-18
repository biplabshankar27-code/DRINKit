# DRINKit — Intelligent Liquor Delivery & AI Sommelier Platform
### OpenCode Project Specification

---

## 1. Project Overview

**Project Name:** DRINKit  
**Type:** Full-stack Web Application (Quick Commerce + AI Assistant)  
**Goal:** Build a web-based liquor delivery platform with an integrated AI sommelier that can answer questions about liquor, give recommendations, suggest pairings, and help users discover drinks.

**Core Value Proposition:**
- Fast liquor delivery with real-time inventory
- AI-powered liquor assistant (chat-based)
- Personalized recommendations based on preferences, mood, and occasion

---

## 2. Tech Stack (Strictly Follow)

### Frontend (Web Only)
- **Framework:** Next.js (App Router) + React
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui (recommended)
- **State Management:** Zustand or React Context + Zustand
- **Maps:** Mapbox GL JS (`react-map-gl` or `@mapbox/mapbox-gl`)
- **HTTP Client:** Axios or native fetch
- **Forms:** React Hook Form + Zod
- **Routing:** Next.js App Router

### Backend
- **Runtime:** Node.js
- **Framework:** NestJS (preferred) or Express.js
- **Language:** TypeScript
- **Authentication:** Simple email/password or social login (no mobile OTP for now)
- **Real-time:** Socket.io
- **Validation:** Zod or class-validator

### Database & Storage
- **Primary DB:** PostgreSQL (orders, users, transactions)
- **Secondary DB:** MongoDB (product catalog, flexible liquor data)
- **Cache:** Redis
- **Vector DB:** pgvector (PostgreSQL extension) or Pinecone (for AI embeddings)

### AI Layer
- **LLM:** Grok (xAI) — Primary model via official API
- **Framework:** LangChain or LlamaIndex (OpenAI-compatible client)
- **Embeddings:** Use OpenAI-compatible embeddings or alternative (e.g. Voyage, Cohere, or local) if needed. Grok API is OpenAI-compatible.
- **RAG:** Retrieval-Augmented Generation over liquor knowledge base
- **API Base URL:** `https://api.x.ai/v1`
- **Recommended Models:** `grok-4`, `grok-4.6`, `grok-3-mini` (or latest available)

### Other Services
- **Payments:** Razorpay (India) or Stripe
- **Image Storage:** Cloudinary or AWS S3
- **Search:** Elasticsearch or Typesense (optional for MVP)

---

## 3. Core Features to Implement

### A. User Web App Features
1. Browse liquor catalog (Beer, Wine, Whisky, Rum, Gin, Vodka, RTDs)
2. Search + Filters (price, category, flavor profile, origin, ABV)
3. Product detail page (images, description, tasting notes, pairings)
4. Cart & Checkout
5. Order placement
6. Live order tracking
7. Order history
8. Wishlist / Favorites
9. Personalized homepage recommendations
10. Fully responsive web design (desktop + mobile browser)

### B. AI Liquor Assistant
1. Chat interface (persistent conversation)
2. Answer questions about:
   - Differences between spirits
   - Tasting notes
   - Food pairings
   - Cocktail recipes
   - Beginner recommendations
   - How to drink a particular spirit
3. Context-aware recommendations
4. Ability to recommend products currently available for delivery
5. Explain why a drink is being recommended

### C. Recommendation System
- Hybrid approach:
  - Content-based filtering (flavor profile, category, price)
  - Collaborative signals (later)
  - Contextual (mood, occasion, time)
- AI Assistant should use the recommendation engine

### D. Admin / Store Features (Basic)
- Product management (CRUD)
- Inventory update
- Order management
- Simple dashboard

---

## 4. Recommended Folder Structure

```
drinkit/
├── frontend/                     # Next.js web app
│   ├── app/                      # App Router pages
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   ├── store/                    # Zustand stores
│   └── public/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── catalog/
│   │   │   ├── orders/
│   │   │   ├── inventory/
│   │   │   ├── recommendations/
│   │   │   ├── ai-assistant/
│   │   │   ├── payments/
│   │   │   └── notifications/
│   │   ├── common/
│   │   ├── config/
│   │   └── main.ts
│   ├── prisma/ or typeorm/
│   └── test/
├── docs/
└── README.md
```

---

## 5. Database Schema (High-Level)

### PostgreSQL Tables
- users
- addresses
- orders
- order_items
- payments
- reviews

### MongoDB Collections
- products (liquor catalog)
- categories
- tasting_notes
- pairings
- cocktail_recipes
- user_preferences
- chat_history

### Vector Store
- Product embeddings
- Liquor knowledge embeddings (for RAG)

---

## 6. AI Assistant Implementation Guidelines

1. Create a knowledge base of liquor information (spirits, wines, beers, cocktails, pairings).
2. Use RAG (Retrieval-Augmented Generation):
   - Embed product data + knowledge articles
   - Retrieve relevant chunks based on user query
   - Pass to LLM with system prompt
3. Use **Grok (xAI)** as the primary LLM via the official API (`https://api.x.ai/v1`).
   - The API is OpenAI-compatible — you can use the official OpenAI SDK by simply changing the `baseURL` and API key.
4. System Prompt should position the AI as a friendly, knowledgeable sommelier.
5. The AI must be able to:
   - Answer general questions
   - Recommend specific products from the current catalog
   - Respect availability (only recommend in-stock items)
6. Store chat history per user for context.

---

## 7. Recommendation Algorithm (MVP)

**Phase 1 (MVP):**
- Content-based filtering using product attributes (category, flavor tags, price range, ABV)
- Simple popularity ranking
- Filter by current inventory and location

**Phase 2:**
- Add user preference embeddings
- Contextual boosts (time of day, occasion tags)
- Collaborative filtering

---

## 8. API Modules to Build

| Module              | Key Endpoints |
|---------------------|-------------|
| Auth                | register, login, profile |
| Catalog             | products, categories, search, product/:id |
| Cart & Orders       | cart, create-order, order/:id, track |
| AI Assistant        | chat, chat/history |
| Recommendations     | for-you, similar/:productId |
| Inventory           | check-availability |
| Payments            | create-payment, verify |

---

## 9. Implementation Phases (Recommended Order)

### Phase 1 — Foundation
- Project setup (monorepo or separate repos)
- Database setup (PostgreSQL + MongoDB)
- Auth module
- Product catalog (seed data with sample liquors)
- Basic product listing & detail pages

### Phase 2 — Core Commerce
- Cart functionality
- Order creation flow
- Basic order tracking
- Payment integration (test mode)

### Phase 3 — AI Assistant
- Set up LLM integration
- Build knowledge base + embeddings
- Chat API + frontend chat UI
- Connect AI responses to product recommendations

### Phase 4 — Personalization
- User preference collection
- Recommendation engine
- Personalized homepage

### Phase 5 — Polish
- Live tracking improvements
- Search & filters
- Admin panel (basic)
- Error handling & loading states
- Performance optimization

---

## 10. Seed Data Requirements

Create realistic seed data for:
- At least 50–100 liquor products across categories
- Flavor tags (smoky, fruity, spicy, oaky, citrus, sweet, dry, peaty, etc.)
- Tasting notes
- Food pairings
- Sample cocktail recipes
- Categories and sub-categories

---

## 11. Environment Variables (Example)

```env
# Backend
DATABASE_URL=
MONGODB_URI=
REDIS_URL=
JWT_SECRET=

# AI (Grok / xAI)
XAI_API_KEY=
XAI_BASE_URL=https://api.x.ai/v1
# Optional: fallback embedding model if needed
EMBEDDING_MODEL=text-embedding-3-small

# Maps
MAPBOX_ACCESS_TOKEN=

# Payments
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Storage
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 12. Non-Functional Requirements

- Clean, modern UI (dark mode support preferred for liquor aesthetic)
- Proper loading and error states
- Responsive design
- Type-safe codebase (TypeScript strict)
- Modular and scalable architecture
- Clear separation of concerns
- Good folder structure and naming conventions

---

## 13. Out of Scope for Current Version

- Native mobile apps (iOS / Android)
- Mobile OTP / Phone authentication
- Age verification system
- Complex multi-store inventory sync
- Delivery partner app
- Advanced analytics dashboard
- Multi-language support

---

## 14. Instructions for OpenCode

1. Start by setting up the backend with NestJS (or Express) + PostgreSQL + MongoDB.
2. Create the product catalog module first with proper seeding.
3. Build the AI Assistant module early (it is the unique selling point).
4. Use **Grok (xAI)** as the default LLM. Configure the OpenAI SDK (or LangChain) with:
   - `baseURL: "https://api.x.ai/v1"`
   - `apiKey: process.env.XAI_API_KEY`
5. Build the frontend as a **web-only** Next.js application (no React Native).
6. Use Tailwind CSS + shadcn/ui for a clean, modern UI.
7. Keep the frontend focused on core user flows and make it fully responsive.
8. Use environment variables for all secrets.
9. Write clean, readable, well-structured code.
10. Prefer simple and working solutions over over-engineering in the MVP.
11. Add proper TypeScript types everywhere.
12. Include basic error handling and validation.
13. Generate a clear README with setup instructions (including how to get an xAI API key from console.x.ai).

---

**End of Specification**

Use this document as the single source of truth while building DRINKit.

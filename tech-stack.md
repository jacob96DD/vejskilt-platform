# Teknologi Stack - VejSkilt Platform

## Backend & Database

### **Supabase** (Primary Backend)
- **PostgreSQL Database**: Relationel database med kraftfuld querying
- **Authentication**: Built-in auth med roller (Kommune, Entreprenør, Politi)
- **Row Level Security (RLS)**: Sikrer data isolation mellem organisationer
- **Storage**: Til billeder af skilte og dokumentation
- **Real-time subscriptions**: Live updates når sager ændrer status
- **Edge Functions**: Serverless functions til kompleks logik (QR generering, notifikationer)

**Hvorfor Supabase?**
- Alt-i-én løsning (database, auth, storage, API)
- Automatisk REST og GraphQL API
- Gratis tier for development
- Nem skalering
- Built-in real-time functionality

## Web Platform (PC)

### **Next.js 15** (App Router)
- React-baseret framework med SSR/SSG
- Built-in routing og API routes
- Optimal performance med React Server Components
- TypeScript support out of the box

### **TypeScript**
- Type safety gennem hele projektet
- Bedre developer experience
- Færre runtime fejl

### **Tailwind CSS**
- Utility-first CSS framework
- Hurtig udvikling med konsistent design
- Responsive design out of the box

### **Shadcn/ui**
- High-quality, accessible React components
- Built on Radix UI primitives
- Customizable og type-safe
- Perfekt til forms, dialogs, tables osv.

### **React Query (TanStack Query)**
- Server state management
- Automatic caching og background updates
- Optimistic updates for bedre UX
- Perfekt integration med Supabase

### **Zustand** (optional, hvis nødvendigt)
- Simpel global state management
- Til UI state der ikke kommer fra server

### **Leaflet + OpenStreetMap** ⭐
- Interactive maps til at vise skilte-placeringer
- 100% gratis, ingen token nødvendig
- Bevist fungerende (se `gis-demo-simple.html`)
- Perfekt til vores use case

### **QR Code Generators**
- `qrcode` library til QR code generering på server
- SVG/PNG output til print

## Mobile App

### **React Native + Expo**
- Cross-platform (iOS + Android) med én codebase
- Expo for hurtigere development og deployment
- Delt kode med web platform (types, utilities, business logic)

### **Expo Camera**
- QR code scanning funktionalitet
- Native kamera adgang

### **Expo Location**
- GPS koordinater ved scanning af skilte
- Verificer at skilt er på korrekt placering

### **React Native Paper** eller **NativeBase**
- UI components der følger Material Design / platform guidelines
- Konsistent design med web-platformen

### **Supabase JS Client**
- Samme API som web platform
- Automatisk sync mellem platforms

## Fælles Biblioteker (Shared)

### **Supabase JS Client**
- Bruges af både web og mobile
- Type-safe database queries

### **Zod**
- Schema validation
- Delt mellem frontend og backend
- Type-safe forms og API validation

### **date-fns**
- Dato håndtering
- Lightweight alternativ til moment.js

## Development Tools

### **ESLint + Prettier**
- Code quality og formatting
- Konsistent code style

### **Husky + lint-staged**
- Pre-commit hooks
- Sikrer code quality før commit

### **Vitest** (optional for MVP)
- Unit testing framework
- Hurtigere end Jest
- Native ESM support

## Deployment

### **Vercel** (Web Platform)
- Perfect Next.js integration
- Auto-deployment fra Git
- Edge Functions support
- Gratis tier tilgængelig

### **Expo EAS** (Mobile App)
- Build og deploy mobile apps
- Over-the-air updates
- TestFlight/Google Play integration

### **Supabase Cloud**
- Hosted PostgreSQL
- Automatic backups
- Global CDN for storage

## CI/CD

### **GitHub Actions** (optional for MVP)
- Automated testing
- Deployment pipelines
- Quality checks

---

## Arkitektur Oversigt

```
┌─────────────────────────────────────────────────────────┐
│                     Supabase Cloud                      │
│  ┌──────────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │  PostgreSQL  │  │   Auth   │  │  Storage (S3)   │  │
│  │   Database   │  │  + RLS   │  │  (Images/Docs)  │  │
│  └──────────────┘  └──────────┘  └─────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │          Edge Functions (Serverless)              │ │
│  │  - QR Code Generation                             │ │
│  │  - Email Notifications                            │ │
│  │  - Complex Business Logic                         │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           │ REST API / Real-time
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
         ▼                                   ▼
┌──────────────────┐              ┌──────────────────┐
│   Web Platform   │              │   Mobile App     │
│   (Next.js 15)   │              │ (React Native)   │
│                  │              │                  │
│  - Admin Panel   │              │  - QR Scanner    │
│  - Case Mgmt     │              │  - Photo Upload  │
│  - Map View      │              │  - GPS Location  │
│  - Reports       │              │  - Offline Queue │
│                  │              │                  │
│  Deploy: Vercel  │              │  Deploy: EAS     │
└──────────────────┘              └──────────────────┘
```

## Estimeret Udviklings-rækkefølge

1. **Supabase setup + Database schema** (Uge 1)
2. **Next.js web platform - Auth & Basic UI** (Uge 1-2)
3. **Case management (ansøgning/godkendelse)** (Uge 2-3)
4. **QR code generering og display** (Uge 3)
5. **React Native app - QR scanning** (Uge 4)
6. **Map integration** (Uge 5)
7. **Reporting og analytics** (Uge 6)
8. **Testing og polish** (Uge 7-8)

## Alternativ til React Native (hvis issues)

Hvis React Native viser sig for kompleks, kan vi overveje:
- **Capacitor + Ionic**: Web teknologi wrapped som native app
- **PWA (Progressive Web App)**: Web app med native-lignende features
  - Camera API for QR scanning
  - Fungerer på både desktop og mobile
  - Nemmere development, men mindre native feel

**Anbefaling**: Start med React Native (Expo), da det giver bedre UX på mobil.

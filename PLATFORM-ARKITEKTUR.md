# VejSkilt Platform - Platform Arkitektur

## 🎯 Afklaring: Next.js vs React Native

**Du har ret - der er forvirring i dokumentationen!** Lad mig afklare præcis hvilke teknologier der skal bruges hvor.

---

## ✅ ANBEFALET ARKITEKTUR

### ⭐ BESLUTTET: React Native Everywhere (EXPO UNIVERSAL)

**Efter diskussion med kunde - ÉN app til alle platforme!** 🎉

### Option 1: React Native Everywhere ⭐ (VALGT!)

```
┌─────────────────────────────────────────────────┐
│              DESKTOP/TABLET                      │
│              (Kommune & Politi)                  │
│                                                  │
│              Next.js Web App                     │
│              (PC + Tablet browser)               │
│                                                  │
│  Features:                                       │
│  • Ansøgnings-godkendelse                       │
│  • Interaktivt kort (Leaflet)                   │
│  • Rapporter & statistik                        │
│  • Dashboard                                     │
│  • User management                               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│              MOBILE                              │
│              (Entreprenører i marken)            │
│                                                  │
│          React Native + Expo App                 │
│          (iOS + Android native app)              │
│                                                  │
│  Features:                                       │
│  • QR scanner (kamera)                          │
│  • GPS location                                  │
│  • Foto upload                                   │
│  • Marker som monteret/fjernet                  │
│  • Se egne ansøgninger                          │
└─────────────────────────────────────────────────┘
```

**Hvorfor Hybrid?**
- ✅ **Next.js** til desktop: Bedst til komplekse admin-interfaces
- ✅ **React Native** til mobil: Native features (kamera, GPS, offline)
- ✅ **Shared TypeScript types**: Genbrug datamodeller mellem platforms
- ✅ **Samme Supabase backend**: Begge forbinder til samme database

**Kodestruktur**:
```
/vejskilt-monorepo
├── /apps
│   ├── /web              # Next.js (desktop/tablet)
│   └── /mobile           # React Native (iOS/Android)
├── /packages
│   ├── /shared-types     # Fælles TypeScript types
│   ├── /supabase-client  # Fælles database queries
│   └── /ui               # Fælles components (hvis muligt)
```

---

### Option 2: React Native Everywhere (Alternativ)

```
┌─────────────────────────────────────────────────┐
│           ALLE PLATFORME                         │
│       (Desktop, Tablet, Mobile)                  │
│                                                  │
│       React Native + Expo (universal)            │
│                                                  │
│  • Expo Web (kompileres til web)                │
│  • Expo iOS (native app)                        │
│  • Expo Android (native app)                    │
│                                                  │
│  ÉN CODEBASE TIL ALLE PLATFORME                 │
└─────────────────────────────────────────────────┘
```

**Fordele**:
- ✅ **Én codebase** til alt (web, iOS, Android)
- ✅ **Konsistent UX** på alle platforme
- ✅ **Hurtigere udvikling** (skriv én gang)
- ✅ **Nemmere vedligeholdelse**

**Ulemper**:
- ❌ Web-version er ikke lige så polished som Next.js
- ❌ SEO er svagere (hvis relevant)
- ❌ Mindre optimal til komplekse admin-interfaces

---

## 🎯 MIN ANBEFALING TIL VEJSKILT

### Start med **Hybrid (Option 1)** ⭐

**Hvorfor?**

1. **Kommune/Politi brugere** (desktop/tablet):
   - Behøver IKKE native app
   - Bruger primært PC/laptop på kontoret
   - Next.js giver bedre admin-interface
   - Nemmere onboarding (bare åbn browser)

2. **Entreprenører** (mobil i marken):
   - SKAL have native features (kamera, GPS)
   - Arbejder udendørs, ofte offline
   - React Native app er perfekt
   - Download fra App Store/Google Play

**Konklusion**:
- **Web (Next.js)**: Dashboard, godkendelser, rapporter
- **Mobil (React Native)**: QR scanning, foto, GPS

---

## 📱 Platform Features Matrix

| Feature | Web (Next.js) | Mobile (RN) | Hvem bruger det? |
|---------|---------------|-------------|------------------|
| **Login/Auth** | ✅ | ✅ | Alle |
| **Dashboard** | ✅ | ✅ (simplified) | Alle |
| **Opret ansøgning** | ✅ | ✅ | Entreprenør |
| **Godkend ansøgning** | ✅ | ❌ | Kommune |
| **QR Scanner** | ❌ | ✅ | Entreprenør |
| **GPS Location** | ❌ | ✅ | Entreprenør |
| **Foto Upload** | ✅ | ✅ | Entreprenør |
| **Interaktivt Kort** | ✅ | ✅ (simplified) | Alle |
| **Rapporter** | ✅ | ❌ | Kommune |
| **Se historik** | ✅ | ✅ | Alle |
| **Offline Mode** | ❌ | ✅ (v1.1) | Entreprenør |

---

## 🛠️ Tech Stack - Final Decision

### **Web Platform (Next.js)** 💻

**Til**: Kommune, Politi, Entreprenører (på kontor)

```bash
# Dependencies
npm install next@latest react@latest react-dom@latest
npm install @supabase/ssr @supabase/supabase-js
npm install leaflet react-leaflet
npm install @tanstack/react-query
npm install tailwindcss postcss autoprefixer
npm install @radix-ui/react-* # shadcn/ui components
npm install zod react-hook-form @hookform/resolvers
```

**Features**:
- Server-side rendering (SSR)
- Route handlers (API routes)
- Authentication middleware
- Image optimization
- SEO optimization

---

### **Mobile App (React Native + Expo)** 📱

**Til**: Entreprenører (i marken)

```bash
# Create Expo app
npx create-expo-app vejskilt-mobile --template blank-typescript

# Dependencies
npx expo install expo-camera
npx expo install expo-location
npx expo install expo-image-picker
npx expo install @supabase/supabase-js
npx expo install react-native-maps
npx expo install @react-navigation/native
npx expo install expo-router
```

**Features**:
- Native camera (QR scanning + fotos)
- GPS location
- Offline storage (AsyncStorage)
- Push notifications (v1.1)
- Biometric auth (v1.1)

---

## 📂 Projekt Struktur

### Monorepo Setup (Turborepo)

```
/vejskilt-platform
│
├── apps/
│   ├── web/                    # Next.js web app
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── signup/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── ansoegninger/
│   │   │   │   ├── kort/
│   │   │   │   └── rapporter/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   ├── lib/
│   │   └── package.json
│   │
│   └── mobile/                 # React Native app
│       ├── app/
│       │   ├── (auth)/
│       │   ├── (tabs)/
│       │   │   ├── home/
│       │   │   ├── scanner/
│       │   │   └── profile/
│       │   └── _layout.tsx
│       ├── components/
│       └── package.json
│
├── packages/
│   ├── shared-types/           # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── database.ts     # Supabase table types
│   │   │   ├── forms.ts        # Form schemas (Zod)
│   │   │   └── api.ts          # API types
│   │   └── package.json
│   │
│   ├── supabase-client/        # Shared database logic
│   │   ├── src/
│   │   │   ├── client.ts       # Supabase client setup
│   │   │   ├── queries/
│   │   │   │   ├── applications.ts
│   │   │   │   ├── signs.ts
│   │   │   │   └── users.ts
│   │   │   └── hooks/          # React Query hooks
│   │   └── package.json
│   │
│   └── ui/                     # Shared UI (minimal)
│       ├── src/
│       │   ├── Button.tsx
│       │   ├── Input.tsx
│       │   └── Badge.tsx
│       └── package.json
│
├── package.json                # Root package.json
├── turbo.json                  # Turborepo config
└── tsconfig.json               # Base TypeScript config
```

---

## 🚀 Development Workflow

### Start både Web + Mobile samtidigt:

```bash
# I root directory
npm run dev

# Dette starter:
# - Next.js web app (localhost:3000)
# - Expo mobile app (expo start)
```

### Deploy:

**Web**:
```bash
# Deploy til Vercel
vercel deploy
```

**Mobile**:
```bash
# Build med EAS
eas build --platform all

# Submit til stores
eas submit --platform ios
eas submit --platform android
```

---

## 📊 Comparison: Hybrid vs React Native Everywhere

| Kriterium | Hybrid (Next.js + RN) | RN Everywhere |
|-----------|----------------------|---------------|
| **Udviklingshastighed** | Medium | Hurtig |
| **Web Performance** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ God |
| **Mobile Performance** | ⭐⭐⭐⭐⭐ Native | ⭐⭐⭐⭐⭐ Native |
| **SEO** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐ Svag |
| **Admin Interface** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ God |
| **Vedligeholdelse** | Medium (2 apps) | Nemt (1 app) |
| **Learning Curve** | Medium | Medium |
| **Best for VejSkilt?** | ✅ **YES** | ⚠️ Muligt |

---

## 🎯 FINAL BESLUTNING ✅

### Brug **React Native Everywhere (Expo Universal)**:

✅ **Web Platform (Next.js)**:
- Kommune og Politi brugere
- Admin funktioner, rapporter, dashboard
- Optimeret til desktop/tablet
- SEO og performance

✅ **Mobile App (React Native)**:
- Entreprenører i marken
- QR scanning, GPS, fotos
- Native features og offline
- App Store + Google Play

✅ **Shared Backend (Supabase)**:
- Samme database for begge
- Real-time sync
- Shared TypeScript types

---

## 📝 Næste Skridt

1. ✅ **Database setup** - Kør `COMPLETE-DATABASE-SETUP.sql` i Supabase
2. 🔄 **Setup Next.js web app** - Opret Next.js projekt
3. 🔄 **Setup React Native mobile** - Opret Expo projekt
4. 🔄 **Setup shared packages** - Types og Supabase client
5. 🚀 **Start udvikling!**

---

**Status**: 📋 Arkitektur Defineret - Klar til Implementation
**Opdateret**: 2025-11-14

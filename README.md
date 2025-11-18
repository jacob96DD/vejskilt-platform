# 🚦 VejSkilt Platform

Digital administration af midlertidig vejskiltning for danske kommuner.

![Status](https://img.shields.io/badge/Status-Planning-blue)
![Version](https://img.shields.io/badge/Version-MVP_1.0-green)

---

## 📋 Projekt Oversigt

**VejSkilt Platform** forbinder kommuner, entreprenører og politi i én digital løsning til håndtering af midlertidig vejskiltning - fra ansøgning til montering og dokumentation.

### Kerneværdi
- ⚡ **71% tidsbesparelse** (25 min per skilt)
- 💰 **250.000 kr/år** besparelse for gennemsnitskommune
- 📊 **100% digital dokumentation** med GPS og fotos
- 🗺️ **Real-time overblik** på interaktivt kort

---

## 🚀 Quick Start

### 1. Se GIS Demo (Lokal)

Åbn `gis-demo.html` i din browser for at se hvordan kortet vil fungere:

```bash
# Åbn i default browser
start gis-demo.html

# Eller åbn direkte i Chrome
chrome gis-demo.html
```

**Demo inkluderer**:
- ✅ Interaktivt Dataforsyningen kort
- ✅ 8 test-markers med forskellige statusser
- ✅ Layer switcher (topografisk, luftfoto)
- ✅ Din rigtige token er allerede aktiveret!

### 2. Review Dokumentation

Læs projekt-dokumenterne i denne rækkefølge:

1. **PROJEKT-BESKRIVELSE.md** - Start her! Business case og overview
2. **MVP-SCOPE.md** - Hvad skal bygges i MVP (prioriteret)
3. **ROADMAP.md** - 8-ugers udviklings-plan
4. **DATABASE-SCHEMA.md** - Database design
5. **GIS-INTEGRATION.md** - Kort integration guide
6. **SUPABASE-SETUP.md** - Setup guide med SQL queries

---

## 🏗️ Projekt Struktur

```
VejSkilt/
├── 📄 README.md                    # Du er her
├── 📄 PROJEKT-BESKRIVELSE.md       # Business beskrivelse
├── 📄 MVP-SCOPE.md                 # Actionable MVP scope
├── 📄 ROADMAP.md                   # Udviklings-plan
├── 📄 DATABASE-SCHEMA.md           # Database design
├── 📄 GIS-INTEGRATION.md           # Kort integration
├── 📄 SUPABASE-SETUP.md            # Setup instruktioner
├── 📄 tech-stack.md                # Teknologi stack
├── 🗺️ gis-demo.html                # Lokal GIS demonstration
├── 🔐 .env                         # Environment variables (lokal)
├── 🔐 .env.example                 # Template til .env
└── 📄 .gitignore                   # Git ignore rules
```

---

## 🛠️ Tech Stack

### Backend
- **Supabase** - PostgreSQL database, Auth, Storage, Real-time
- **Edge Functions** - Serverless functions (QR generation, emails)

### Frontend (Web)
- **Next.js 15** - React framework med App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **OKAPI** - Dataforsyningen kort (gratis danske kort!)

### Mobile
- **React Native + Expo** - Cross-platform app
- **Expo Camera** - QR scanning
- **Expo Location** - GPS
- **Expo Image Picker** - Foto upload

### Services
- **Dataforsyningen** - Gratis danske kort og adressedata
- **Vercel** - Web hosting
- **Expo EAS** - Mobile app builds

---

## 📦 Installation (Når klar til udvikling)

### Prerequisites
- Node.js 18+
- npm eller yarn
- Git
- Supabase account (gratis)
- Dataforsyningen account (gratis)

### Setup

```bash
# Clone repository (når oprettet)
git clone [repository-url]
cd VejSkilt

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Tilføj dine credentials til .env.local
# (Dataforsyningen token er allerede i .env)

# Kør development server
npm run dev
```

---

## 🔑 Environment Variables

Projektets tokens og keys gemmes i `.env` filer:

### Allerede Konfigureret ✅

**Dataforsyningen Token**: `f39755a4ac7c0723e2bafe2fffcf1617`
- ✅ Gratis
- ✅ Ubegrænsede kald
- ✅ Allerede aktiveret i GIS demo

### Skal Tilføjes (når Supabase er klar) 🔄

Efter Supabase setup i weekenden, tilføj til `.env`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ VIGTIGT**: `.env` filen er i `.gitignore` og committes ALDRIG til Git!

---

## 🗓️ Timeline

### Phase 0: Setup ✅ (Done!)
- ✅ Projekt struktur
- ✅ Dokumentation komplet
- ✅ GIS demo fungerer
- ✅ Token konfigureret
- 🔄 Venter på Supabase setup (weekend)

### Phase 1: Foundation (Uge 1)
- Database migration
- Authentication
- Basic web UI

### Phase 2-8: Development (Uge 2-8)
Se **ROADMAP.md** for detaljeret plan

### 🚀 MVP Launch (Uge 8)

---

## 📊 MVP Features

### ✅ MUST HAVE (Core)

1. **Authentication** - Sikker login for Kommune, Entreprenør, Politi
2. **Ansøgning** - Entreprenør opretter ansøgning med skilte på kort
3. **Godkendelse** - Kommune godkender/afviser
4. **QR System** - Auto-generering af QR-koder
5. **Mobil Scanner** - Scan QR, dokumentér med GPS + foto
6. **Kort** - Interaktivt kort med alle skilte (filters, real-time)
7. **Audit Log** - Komplet historik
8. **Rapporter** - Stats og CSV export

### 🟡 SHOULD HAVE (Nice-to-have)
- PDF export af rapporter
- Email notifikationer
- Real-time toast notifications

### ❌ WON'T HAVE (Post-MVP)
- Offline funktionalitet
- Fakturering
- Push notifications
- Bulk operations

Se **MVP-SCOPE.md** for detaljer.

---

## 💰 Omkostninger

### Development
- **Gratis** - Supabase free tier, Dataforsyningen gratis, Vercel gratis

### Production (efter launch)
| Service | Pris |
|---------|------|
| Supabase Pro | $25/md |
| Expo EAS | $99/år (~$8/md) |
| Domain | ~$15/år |
| **Total** | **~$35/md** |

**ROI**: Med 250.000 kr/år besparelse for kunde → payback i første måned! 🚀

---

## 🔒 Sikkerhed

- ✅ **Row Level Security (RLS)** - Data isolation mellem organisationer
- ✅ **HTTPS** - All kommunikation krypteret
- ✅ **Token-based Auth** - Supabase JWT tokens
- ✅ **GDPR Compliant** - Data i EU, deletion rights, privacy policy
- ✅ **Backups** - Automatisk daglig backup (Supabase Pro)

---

## 📚 Dokumentation

### For Udviklere
- **README.md** (denne fil) - Projekt overview
- **tech-stack.md** - Tekniske valg og arkitektur
- **DATABASE-SCHEMA.md** - Database design med SQL
- **SUPABASE-SETUP.md** - Step-by-step setup guide
- **GIS-INTEGRATION.md** - Kort integration guide

### For Business/Product
- **PROJEKT-BESKRIVELSE.md** - Business case, ROI, målgrupper
- **MVP-SCOPE.md** - Prioriteret feature liste
- **ROADMAP.md** - Timeline og milestones

### For Brugere (kommer senere)
- User guides (Kommune, Entreprenør, Politi)
- FAQ
- Video tutorials

---

## 🧪 Testing

### GIS Demo ✅
- Åbn `gis-demo.html` i browser
- Test zoom, pan, markers, layer switcher
- Click på markers for popups

### Database Test (efter Supabase setup)
```sql
-- Kør i Supabase SQL Editor
SELECT * FROM organizations;
SELECT * FROM users;
```

### Integration Test (efter app udviklet)
- User signup/login
- Create application
- Approve application
- Scan QR code
- View on map

---

## 🐛 Troubleshooting

### GIS Demo viser ikke kort
- ✅ **Fixed**: Token er nu aktiveret i demo
- Check browser console for fejl
- Prøv at refresh siden

### "Token invalid" fejl
- Verify token i `.env` er korrekt
- Check at token ikke har spaces eller newlines
- Opret nyt token på dataforsyningen.dk hvis nødvendigt

### Supabase connection fejl
- Verify SUPABASE_URL og keys er korrekte
- Check Row Level Security policies
- Se SUPABASE-SETUP.md troubleshooting sektion

---

## 📞 Support & Kontakt

**Developer**: Martin
**Product Owner**: [Kunde navn]

**Issues**: [GitHub Issues link når oprettet]

---

## 📝 Licens

Proprietary - VejSkilt Platform © 2025

---

## 🎯 Næste Skridt

### Denne Weekend
1. ✅ Review GIS demo (åbn `gis-demo.html`)
2. ✅ Læs MVP-SCOPE.md
3. 🔄 Opret Supabase projekt
4. 🔄 Kør SQL migrations fra SUPABASE-SETUP.md

### Uge 1
1. Setup Next.js projekt
2. Connect til Supabase
3. Implementér authentication
4. Basic UI struktur

### Uge 8
🚀 **MVP Launch!**

---

**Status**: 📋 Planning Complete - Ready for Development
**Last Updated**: 2025-11-14

🚦 VejSkilt Platform - Fremtidens vejskilt-administration

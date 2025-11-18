# VejSkilt Platform
## Digital Administration af Midlertidig Vejskiltning

---

![Status](https://img.shields.io/badge/Status-Planning-blue)
![Version](https://img.shields.io/badge/Version-MVP_1.0-green)
![Platform](https://img.shields.io/badge/Platform-Web_%2B_Mobile-orange)

---

## 📋 Projektsammenfatning

**VejSkilt Platform** er en digital løsning til administration, godkendelse og dokumentation af midlertidig vejskiltning i danske kommuner. Platformen erstatter manuelle papirprocesser med en moderne web- og mobilløsning, der forbinder kommuner, entreprenører og politi i én fælles platform.

### Kernen af løsningen
- **Entreprenører** ansøger digitalt om tilladelse til vejskiltning
- **Kommunen** godkender eller afviser med få klik
- **QR-koder** genereres automatisk ved godkendelse
- **Mobil app** scanner QR-koder ved montering og fjernelse
- **Digital dokumentation** med fotos og GPS-koordinater
- **Interaktivt kort** viser alle skilte i real-time
- **Automatisk log** sporer hele livscyklus for hvert skilt

---

## 🎯 Problemstilling

### Nuværende udfordringer

**For Kommuner:**
- ⏰ Tidskrævende manuel sagsbehandling
- 📄 Papirarbejde og fysisk arkivering
- 🗺️ Manglende overblik over aktive skilte
- ❌ Svært at kontrollere overskredne tilladelser
- 📊 Ingen struktureret data til rapportering

**For Entreprenører:**
- 🚗 Fysiske møder på rådhuset for godkendelser
- ⏳ Lange sagsbehandlingstider (3-5 dage)
- 📝 Manglende beskyttelse ved tvister (intet bevis for korrekt skiltning)
- 📞 Uklare processer og kommunikation

**For Politi:**
- ❓ Ingen nem måde at verificere tilladelser
- 📞 Manuel kontakt til kommunen ved kontrolbesøg
- ⏱️ Tidsspilde ved verifikation

### Økonomisk impact

**Estimat for en kommune med 1.500 skilte årligt:**

| Opgave | Nuværende | Med VejSkilt | Besparelse |
|--------|-----------|--------------|------------|
| Per skilt administration | 35 min | 10 min | 25 min (71%) |
| Årligt tidsforbrug | 875 timer | 250 timer | **625 timer** |
| Økonomisk værdi (400 kr/time) | 350.000 kr | 100.000 kr | **250.000 kr** |

**Yderligere gevinster:**
- 🚀 Hurtigere byggeprocesser (2-3 dage tidligere færdiggjort)
- ⚖️ Færre juridiske tvister (dokumentation med GPS + foto)
- 🌍 Miljøgevinst (papirløs proces, færre køreture)
- 📈 Bedre datagrundlag for trafikplanlægning

---

## 💡 Løsning

### Samlet Platform

VejSkilt Platform består af **tre integrerede systemer**:

```
┌─────────────────────────────────────────────────────┐
│                  WEB PLATFORM                        │
│          (PC/Tablet - Kommune & Politi)              │
│                                                      │
│  • Modtag og behandl ansøgninger                    │
│  • Godkend/afvis med kommentarer                    │
│  • Se alle skilte på interaktivt kort               │
│  • Generér rapporter og statistik                   │
│  • Eksportér til PDF/CSV                            │
└─────────────────────────────────────────────────────┘
                        │
                        │ Real-time sync
                        │
┌─────────────────────────────────────────────────────┐
│              MOBIL APP                               │
│       (iOS/Android - Entreprenører)                  │
│                                                      │
│  • Opret ansøgninger fra byggepladsen               │
│  • Scan QR-koder ved montering                      │
│  • Tag fotos som dokumentation                      │
│  • GPS-registrering automatisk                      │
│  • Marker skilte som fjernet                        │
└─────────────────────────────────────────────────────┘
                        │
                        │ Centralized data
                        │
┌─────────────────────────────────────────────────────┐
│              CLOUD DATABASE                          │
│         (Supabase - PostgreSQL)                      │
│                                                      │
│  • Sikker opbevaring af alle data                   │
│  • Real-time opdateringer                           │
│  • Automatisk backup                                │
│  • Komplet audit trail                              │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Arbejdsgang

### Før VejSkilt Platform

```
Entreprenør → 📝 Udfyld papirformular
           ↓
    🚗 Kør til rådhus
           ↓
Kommune → 📋 Manuel sagsbehandling
       → 📁 Arkivering i papir
       → 📞 Ring til entreprenør
           ↓
    Entreprenør → 🚗 Hent tilladelse på rådhus
                → 📋 Print selv
                → ❓ Ingen verifikation ved montering

Estimeret tid: 3-5 dage
```

### Med VejSkilt Platform

```
Entreprenør → 📱 Opret ansøgning i app (5 min)
           ↓
    ☁️ Automatisk sendt til kommune
           ↓
Kommune → 💻 Gennemse på web (5 min)
       → ✅ Godkend med ét klik
       → 🔄 QR-koder genereres automatisk
           ↓
    Entreprenør → 📧 Modtag email med QR PDF
                → 🖨️ Print QR-labels
                → 📷 Scan QR ved montering
                → ✅ Automatisk dokumentation (GPS + foto)

Estimeret tid: 2-24 timer
```

**Resultat**:
- ⚡ 71% tidsbesparelse
- 📊 100% digital dokumentation
- 🗺️ Real-time overblik
- ⚖️ Juridisk bevis ved tvister

---

## 👥 Målgrupper

### Primære Brugere

#### 1. **Kommuner** (Betalende kunde)
**Rolle**: Myndighed der godkender vejskiltning

**Features**:
- Modtag og behandl ansøgninger
- Godkend/afvis med begrundelse
- Se alle skilte på kort med filtre
- Generer rapporter (overskredne deadlines, statistik)
- Komplet audit trail
- Email-notifikationer

**Værdi**:
- 625 timer/år besparelse
- Bedre overblik og kontrol
- Digital dokumentation
- Færre fejl og konflikter

#### 2. **Entreprenører** (Betalende kunde)
**Rolle**: Udfører vejarbejde og monterer skilte

**Features**:
- Opret ansøgninger fra mobil/web
- Modtag QR-koder automatisk
- Scan QR ved montering/fjernelse
- Upload fotos som dokumentation
- Se egne sager og skilte
- Digital beskyttelse (bevis for korrekt skiltning)

**Værdi**:
- Hurtigere godkendelser (24 timer vs. 3-5 dage)
- Mindre administration
- Juridisk beskyttelse
- Professionel dokumentation

#### 3. **Politi** (Sekundær bruger - Read only)
**Rolle**: Kontrollerer at skiltning er lovlig

**Features**:
- Se godkendte skilte på kort
- Verificer tilladelser i marken
- Søg på adresse/område

**Værdi**:
- Nem verifikation uden opkald
- Real-time data
- Bedre trafiksikkerhed

---

## ✨ Hovedfeatures (MVP)

### 🔐 1. Brugeradministration
- Roller: Kommune, Entreprenør, Politi
- Sikker login (email + password)
- Organisation-tilknytning
- Data isolation (RLS)

### 📝 2. Ansøgnings-flow
- Opret ny ansøgning
- Vælg skilttyper fra katalog
- Marker placeringer på kort
- Upload tegninger/planer
- Angiv start- og slutdato
- Send til godkendelse

### ✅ 3. Godkendelses-flow
- Liste over indkomne ansøgninger
- Detaljevisning med kort
- Godkend eller afvis
- Kommentar-felt
- Email-notifikation til entreprenør

### 📲 4. QR-kode System
- Auto-generering ved godkendelse
- Unikke koder per skilt
- Download som printvenlig PDF
- Re-generering hvis tabt
- Embedded verification URL

### 📱 5. Mobil App (QR Scanning)
- QR scanner (kamera)
- Marker som "Monteret"
- Tag foto af skilt
- GPS-koordinater automatisk
- Marker som "Fjernet"
- Offline queueing (v1.1)

### 🗺️ 6. Interaktivt Kort
- Danske officielle kort (Dataforsyningen)
- Markers for alle skilte
- Farve-kodning efter status
- Filter: Status, type, dato, entreprenør
- Click på skilt → detaljer
- Real-time opdateringer

### 📊 7. Rapportering
- Aktive skilte oversigt
- Overskredne deadlines
- Entreprenør-statistik
- Månedlige rapporter
- Eksport til PDF/CSV

### 🕐 8. Audit Log
- Komplet historik per skilt
- Hvem gjorde hvad og hvornår
- GPS + foto dokumentation
- Tidsstempler
- Immutable log (kan ikke ændres)

---

## 🛠️ Teknologi

### Moderne Tech Stack

**Backend & Database**:
- **Supabase** (PostgreSQL)
  - Relationel database
  - Built-in authentication
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Automatisk backups

**Web Platform**:
- **Next.js 15** (React framework)
- **TypeScript** (type safety)
- **Tailwind CSS** (moderne design)
- **shadcn/ui** (UI components)
- **Dataforsyningen OKAPI** (danske kort)

**Mobile App**:
- **React Native + Expo** (cross-platform)
- **Expo Camera** (QR scanning)
- **Expo Location** (GPS)
- Shared codebase med web (TypeScript)

**Deployment**:
- **Vercel** (web hosting)
- **Expo EAS** (mobile app builds)
- **Supabase Cloud** (database + storage)

### Fordele ved teknologivalg

✅ **Modern og vedligeholdelig**: Latest best practices
✅ **Cross-platform**: Én codebase til iOS + Android
✅ **Type-safe**: Færre runtime fejl
✅ **Skalerbar**: Kan håndtere vækst
✅ **Omkostningseffektiv**: Gratis i development, billig i produktion
✅ **Dansk GIS data**: Officielle kort uden licens-omkostninger

---

## 💰 Business Model

### Pricing Strategy (forslag)

#### Option 1: SaaS Subscription (pr. kommune)

| Plan | Pris/måned | Inkluderet |
|------|------------|------------|
| **Small** | 2.500 kr | Op til 500 skilte/år, 1 kommune-bruger, 5 entreprenører |
| **Medium** | 4.500 kr | Op til 2.000 skilte/år, 3 kommune-brugere, 20 entreprenører |
| **Large** | 7.500 kr | Unlimited skilte, 10 kommune-brugere, 50 entreprenører |

#### Option 2: Per-Transaction
- 15-25 kr per godkendt ansøgning
- Volumen-rabat ved >1.000 ansøgninger/år

#### Option 3: One-time License + Support
- One-time: 75.000 kr (on-premise installation)
- Support: 12.000 kr/år

### Kundeakvisition

**Target Market**:
- 🇩🇰 98 kommuner i Danmark
- 🏗️ ~500+ entreprenører med vejarbejde
- 📈 Addressable market: ~10-15M kr/år (ved 20% adoption)

**Go-to-market**:
1. **Pilot**: 1 kommune (gratis/rabat) for case study
2. **Early adopters**: 5-10 kommuner (rabat)
3. **Scale**: Marketing via kommunale netværk (KL)
4. **Expansion**: Nordiske lande (Norge, Sverige)

---

## 📅 Timeline

### Development Phases

```
Phase 0: Setup (Uge 0)
├─ Supabase projekt oprettet
├─ Git repository setup
└─ Development environment

Phase 1: Foundation (Uge 1)
├─ Database implementation
├─ Authentication
└─ Basic web structure

Phase 2: Application Flow (Uge 2-3)
├─ Ansøgnings-oprettelse
├─ Godkendelses-interface
└─ QR code generation

Phase 3: Maps (Uge 4)
├─ Kort integration
├─ Markers & filtering
└─ Real-time updates

Phase 4: Mobile App (Uge 5-6)
├─ React Native setup
├─ QR scanner
└─ Photo upload + GPS

Phase 5: Reporting (Uge 7)
├─ Audit log display
├─ Reports
└─ PDF/CSV export

Phase 6: Launch (Uge 8)
├─ Testing
├─ Bug fixes
├─ Deployment
└─ Documentation

🚀 MVP LAUNCH
```

**Total udviklings-tid**: 8-10 uger (160-200 timer)

---

## 💵 Økonomi

### Development Costs

| Item | Cost |
|------|------|
| Development (200 timer @ 500 kr/time) | 100.000 kr |
| Design & UX (optional) | 15.000 kr |
| Testing & QA | Inkluderet |
| **Total Development** | **~115.000 kr** |

### Monthly Operating Costs

| Service | Development | Production |
|---------|-------------|------------|
| Supabase | Gratis | 25 USD (~180 kr) |
| Vercel | Gratis | Gratis |
| Expo EAS | Gratis | 99 USD/år (~8 kr/md) |
| Dataforsyningen | Gratis | Gratis |
| Domain + Email | - | 20 kr |
| **Total** | **0 kr** | **~210 kr** |

### ROI for Første Kunde

**Investering**: 115.000 kr (development) + 2.500 kr/md (drift)

**Indtægt** (ved Medium plan @ 4.500 kr/md):
- År 1: 54.000 kr (12 måneder)
- Break-even: Efter 2-3 kunder

**Kunde-værdi**:
- Besparelse for kommune: 250.000 kr/år
- Platform-pris: 4.500 kr/md = 54.000 kr/år
- **ROI for kunde**: 364% (196.000 kr nettobesparelse)

---

## 🎯 Success Metrics

### MVP Success (3 måneder efter launch)

| Metric | Target |
|--------|--------|
| Pilotkommune tilfredhed | >80% |
| Gennemsnitlig godkendelsestid | <24 timer |
| Skilte med foto-dokumentation | >90% |
| System uptime | >99.5% |
| Månedlige aktive brugere | >50 |

### Year 1 Goals

| Metric | Target |
|--------|--------|
| Betalende kommuner | 5-10 |
| Registrerede skilte | >2.500 |
| Dokumenteret tidsbesparelse | >500 timer |
| Årlig recurring revenue (ARR) | 300.000-500.000 kr |
| Customer satisfaction (NPS) | >50 |

---

## 🔒 Sikkerhed & Compliance

### Data Security

✅ **Encryption**: All data encrypted in transit (TLS) og at rest
✅ **Authentication**: Supabase Auth med email verification
✅ **Authorization**: Row Level Security (RLS) - data isolation
✅ **Backups**: Automatisk daily backups (7 dages retention)
✅ **GDPR Compliant**:
   - Data stored i EU (Frankfurt/Ireland)
   - Right to deletion
   - Data export functionality
   - Privacy policy + terms

### Access Control

- **Role-based permissions** (Kommune, Entreprenør, Politi)
- **Organization isolation** (kan kun se egne data)
- **Audit logging** (alle handlinger logges)
- **Session management** (auto-logout ved inaktivitet)

---

## 🚀 Konkurrencefordele

### Hvorfor VejSkilt Platform?

#### 1. **Dansk-specifik løsning**
- Bygget til danske kommuner og lovgivning
- Integration med danske kort (Dataforsyningen)
- Dansk interface og support

#### 2. **Moderne teknologi**
- Web + mobil i ét
- Real-time opdateringer
- Intuitivt design
- Offline-capable (v1.1)

#### 3. **Komplet løsning**
- Fra ansøgning til dokumentation
- Alle parter på én platform
- Intet behov for eksterne værktøjer

#### 4. **Beviselig ROI**
- 71% tidsbesparelse
- Målbar værdi
- Hurtig payback period

#### 5. **Skalerbar**
- Cloud-baseret
- Kan håndtere tusindvis af brugere
- Multi-tenant arkitektur

### Konkurrent-analyse

**Eksisterende løsninger**:
- ❌ Manuel papirproces (status quo)
- ❌ Generiske sagsbehandlingssystemer (ikke specialiseret)
- ❌ Excel-ark (ingen real-time, ingen mobil)

**VejSkilt Platform**:
- ✅ Purpose-built til vejskiltning
- ✅ Mobil + web integration
- ✅ Real-time kort og GPS
- ✅ Automatisk QR-kode dokumentation

---

## 📈 Fremtidige Udviklinger

### Version 1.1 (3-4 måneder efter MVP)
- 📴 Offline funktionalitet (mobil app)
- 🔔 Push notifications og påmindelser
- 📊 Advanced rapportering med grafer
- 📋 Template-ansøgninger
- 🔄 Bulk operations

### Version 2.0 (6-12 måneder efter MVP)
- 💳 Fakturering & betaling (Stripe)
- 🏢 Multi-kommune support (skalering)
- 🔌 API til tredjeparts integration
- 🌡️ Vejr-integration (advarsler)
- 📱 Biometric login
- 🤖 AI-assisted skilttype-genkendelse (computer vision)

### Expansion
- 🇳🇴 Norge
- 🇸🇪 Sverige
- 🇫🇮 Finland
- 🏗️ Udvidelse til andre midlertidige tilladelser (byggetilladelser, arrangementer)

---

## 👨‍💼 Team

**Product Owner**: [Kunde navn]
**Lead Developer**: Martin
**Target**: MVP klar på 8-10 uger

**Advisors needed** (optional):
- UX Designer (polish)
- Beta-testere (kommune + entreprenører)

---

## 📞 Kontakt & Next Steps

### Kom i Gang

1. **Review** denne projektbeskrivelse
2. **Feedback** på scope og prioritering
3. **Setup** Supabase (weekend)
4. **Start** udvikling (uge 1)

### Spørgsmål?

- 📧 Email: [din email]
- 📱 Telefon: [dit nummer]
- 💻 GitHub: [repository link]

---

## 📄 Appendiks

### Relaterede Dokumenter

1. **tech-stack.md** - Detaljeret teknisk stack
2. **DATABASE-SCHEMA.md** - Komplet database design
3. **ROADMAP.md** - Udviklings-plan uge for uge
4. **PROJECT-SCOPE.md** - Detaljeret feature-liste
5. **GIS-INTEGRATION.md** - Kort integration guide
6. **SUPABASE-SETUP.md** - Setup instruktioner

### Links

- Supabase: https://supabase.com
- Dataforsyningen: https://dataforsyningen.dk
- Next.js: https://nextjs.org
- Expo: https://expo.dev

---

**Version**: 1.0
**Dato**: 2025-11-14
**Status**: 📋 Planning Complete - Ready for Development

---

*VejSkilt Platform - Fremtidens vejskilt-administration* 🚦✨

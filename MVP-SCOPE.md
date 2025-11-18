# VejSkilt Platform - MVP Scope

**Version**: 1.0 - Full MVP
**Timeline**: 8-10 uger
**Focus**: Core workflow fra ansøgning til dokumentation

---

## 🎯 MVP Målsætning

**Mission**: Levér en funktionel platform hvor entreprenører kan ansøge om vejskiltning, kommunen kan godkende, og monteringen dokumenteres digitalt med QR-koder og GPS.

**Success Criteria**:
- ✅ 3 test-brugere kan gennemføre hele flowet (ansøgning → godkendelse → montering → dokumentation)
- ✅ Gennemsnitlig godkendelsestid < 24 timer
- ✅ 100% digital dokumentation (ingen papir)
- ✅ Deployment til production (web + mobil app i beta)

---

## 📊 MoSCoW Prioritering

### ✅ MUST HAVE (Kritisk for MVP)

Funktionalitet der **skal** være med for at MVP'en giver værdi:

#### 1. Authentication & User Management
**Hvad**: Sikker login og brugeradministration

**Features**:
- [ ] Email/password login (Supabase Auth)
- [ ] Brugerroller: Kommune, Entreprenør, Politi
- [ ] Organisation-tilknytning (brugere tilhører kommuner/firmaer)
- [ ] Protected routes (kun logged-in users)
- [ ] Session management

**Acceptance Criteria**:
- User kan registrere sig og logge ind
- Forskellige roller ser forskellige ting
- Session persists ved page reload

---

#### 2. Ansøgnings-oprettelse (Entreprenør)
**Hvad**: Entreprenør kan oprette digital ansøgning

**Features**:
- [ ] Formular til ny ansøgning:
  - Titel og beskrivelse
  - Adresse (med autocomplete via DAWA)
  - Start- og slutdato
  - Upload tegninger/planer (PDF, billeder)
- [ ] Tilføj skilte til ansøgningen:
  - Vælg skilttype fra dropdown
  - Marker placering på kort (click på kort → GPS koordinater)
  - Beskrivelse af placering
  - Mulighed for flere skilte per ansøgning
- [ ] Form validation (Zod)
- [ ] Preview før submit
- [ ] Send ansøgning

**Acceptance Criteria**:
- Entreprenør kan oprette ansøgning med min. 1 skilt
- GPS koordinater gemmes korrekt
- Filer uploades til Supabase Storage
- Ansøgning får unikt sagsnummer (ANS-2025-001234)

---

#### 3. Ansøgnings-godkendelse (Kommune)
**Hvad**: Kommune kan godkende eller afvise ansøgninger

**Features**:
- [ ] Liste over indkomne ansøgninger
  - Status badges (Pending, Approved, Rejected)
  - Sortering (nyeste først)
  - Filtrering (status, entreprenør)
  - Søgning (sagsnummer, adresse)
- [ ] Detaljevisning af ansøgning:
  - Alle ansøgningsdata
  - Kort med skilte-placeringer
  - Uploaded filer (viewer)
- [ ] Godkend/afvis modal:
  - Kommentar-felt (påkrævet ved afvisning)
  - Confirm knap
- [ ] Auto-generering af QR-koder ved godkendelse
- [ ] Email-notifikation til entreprenør

**Acceptance Criteria**:
- Kommune kan se alle ansøgninger
- Godkendelse/afvisning opdaterer status instant
- QR-koder genereres automatisk ved godkendelse
- Entreprenør modtager email ved status-ændring

---

#### 4. QR-kode System
**Hvad**: Auto-generering og håndtering af QR-koder

**Features**:
- [ ] Generér unikke QR-koder for hvert skilt ved godkendelse
- [ ] QR-kode indeholder:
  - Sign ID
  - Verification URL (`vejskilt.dk/verify/{qr_code}`)
- [ ] Download QR-koder som PDF:
  - A4 printvenlig layout
  - Alle skilte for en ansøgning i ét dokument
  - Inkl. skilttype, placering, ansøgningsnummer
- [ ] Re-generering af QR hvis tabt

**Acceptance Criteria**:
- QR-kode genereres per skilt ved godkendelse
- PDF kan downloades og printes
- QR-kode kan scannes med mobil app
- Verify URL viser skilt-information

---

#### 5. Mobil App - QR Scanning & Montering
**Hvad**: Entreprenør scanner QR og dokumenterer montering

**Features**:
- [ ] QR Scanner (Expo Camera):
  - Åbn kamera
  - Scan QR-kode
  - Validate QR (check om det er gyldigt VejSkilt QR)
  - Fetch skilt-data fra Supabase
- [ ] Marker som "Monteret":
  - Vis skilt-detaljer efter scan
  - "Marker som monteret" knap
  - GPS koordinater (automatisk via Expo Location)
  - Tag billede af monteret skilt (valgfrit men anbefalet)
  - Preview før upload
  - Confirm
  - Upload til Supabase (status update + GPS + foto)
- [ ] Marker som "Fjernet":
  - Liste over egne monterede skilte
  - Scan QR eller vælg fra liste
  - Tag billede af fjernet område (valgfrit)
  - GPS ved fjernelse
  - Update status til "removed"

**Acceptance Criteria**:
- QR scanner virker og validerer korrekt
- Skilt kan markeres som monteret med GPS + foto
- Data synces til database instant
- Ændring ses på web-platformen i real-time

---

#### 6. Interaktivt Kort
**Hvad**: Vis alle skilte på et interaktivt kort

**Features**:
- [ ] Integration med Dataforsyningen OKAPI
- [ ] Vis markers for alle skilte:
  - Farve-kodning efter status (pending=gul, approved=blå, mounted=grøn, removed=grå)
  - Cluster markers hvis mange tæt på hinanden
- [ ] Click på marker → popup:
  - Skilttype
  - Status
  - Adresse
  - Ansøgningsnummer
  - Link til detaljevisning
- [ ] Filter panel:
  - Status checkboxes
  - Skilttype dropdown
  - Dato-interval
  - Entreprenør (kun for kommune)
- [ ] Zoom og pan controls
- [ ] Layer switcher (topografisk, luftfoto)

**Acceptance Criteria**:
- Kort loader med alle skilte
- Markers opdateres i real-time (via Supabase subscriptions)
- Filtrering virker smooth
- Performance OK med 500+ markers

---

#### 7. Audit Log & Historik
**Hvad**: Komplet historik for hver ansøgning/skilt

**Features**:
- [ ] Timeline på ansøgnings-detalje side:
  - Oprettet (hvem, hvornår)
  - Godkendt/afvist (hvem, hvornår, kommentar)
  - Hver skilt monteret (hvem, hvornår, GPS, foto)
  - Hver skilt fjernet (hvem, hvornår, GPS, foto)
- [ ] Sorteret kronologisk
- [ ] Expandable entries (click for detaljer)
- [ ] Photos in lightbox

**Acceptance Criteria**:
- Komplet historik vises korrekt
- Alle actions er loggede
- Photos kan åbnes og ses i fuld størrelse
- Timeline opdateres automatisk ved nye actions

---

#### 8. Basis Rapportering
**Hvad**: Simple rapporter for kommune

**Features**:
- [ ] Dashboard stats:
  - Antal ansøgninger (pending, approved, active)
  - Antal skilte (monteret, fjernet)
  - Overskredne deadlines (skilte ikke fjernet til tiden)
- [ ] Rapport-side:
  - "Aktive skilte" rapport (liste + kort)
  - "Overskredne deadlines" rapport
  - Dato-filter
  - Entreprenør-filter
- [ ] Eksport til CSV:
  - Alle skilte
  - Filtreret data

**Acceptance Criteria**:
- Stats vises korrekt på dashboard
- Rapporter kan genereres og eksporteres
- CSV download virker

---

### 🟡 SHOULD HAVE (Vigtig men ikke kritisk)

Funktionalitet der giver værdi men kan laves efter MVP hvis tiden er knap:

#### 9. PDF Export af Rapporter
- [ ] Generer PDF af rapporter (pretty formatted)
- [ ] Include logo, dato, metadata
- [ ] Download funktion

**Kan udsættes til**: v1.1 (CSV er nok til MVP)

---

#### 10. Email Notifikationer
- [ ] Email ved ansøgning oprettet (til kommune)
- [ ] Email ved godkendelse/afvisning (til entreprenør)
- [ ] Email ved overskredne deadlines (automatisk påmindelse)

**Kan udsættes til**: v1.1 (de 2 første er nice-to-have, sidste er future)

---

#### 11. Real-time Notifikationer (Web)
- [ ] Toast notifications ved ændringer
- [ ] "Ny ansøgning" badge i navbar
- [ ] Real-time count updates

**Kan udsættes til**: v1.1 (real-time data opdatering er vigtigere)

---

### ❌ WON'T HAVE (Ikke i MVP)

Funktionalitet der **ikke** skal med i MVP:

#### Offline Funktionalitet (Mobil App)
- ❌ Offline queue af scans
- ❌ Offline maps
- **Hvorfor**: Komplekst, kan laves i v1.1
- **Workaround**: Kræver internetforbindelse (4G/5G tilgængeligt de fleste steder)

#### Fakturering & Betaling
- ❌ Stripe integration
- ❌ Invoice generation
- **Hvorfor**: Ikke kritisk for at teste konceptet
- **Udsæt til**: v2.0

#### Avanceret Rapportering
- ❌ Grafer og charts
- ❌ Custom dashboards
- ❌ Sammenligning over tid
- **Hvorfor**: Basis rapporter er nok til start
- **Udsæt til**: v1.1 eller v2.0

#### Push Notifications
- ❌ Push til mobil app
- **Hvorfor**: Email er nok til MVP
- **Udsæt til**: v1.1

#### Bulk Operations
- ❌ Godkend flere ansøgninger på én gang
- ❌ Bulk upload af ansøgninger
- **Hvorfor**: Ikke kritisk med få brugere
- **Udsæt til**: v1.1

#### Advanced Features
- ❌ Template-ansøgninger (genbruge tidligere)
- ❌ Kommentar-tråde på sager
- ❌ Multi-godkender workflow
- ❌ Integration til eksterne systemer
- ❌ Public API
- ❌ Billedgenkendelse af skilte
- **Udsæt til**: v2.0+

---

## 🏗️ Teknisk Scope

### Database
**Tabeller** (6 stk):
- ✅ organizations
- ✅ users
- ✅ applications
- ✅ signs
- ✅ attachments
- ✅ logs

**Features**:
- ✅ Row Level Security (RLS)
- ✅ Triggers (auto-generate numbers, QR codes)
- ✅ Functions (stats, overdue signs)
- ✅ Views (summaries)
- ✅ Indexes for performance

### Web Platform (Next.js)
**Pages** (minimum):
- `/login` - Login page
- `/dashboard` - Dashboard (different for each role)
- `/ansoegninger` - Applications list
- `/ansoegninger/[id]` - Application detail
- `/ansoegninger/ny` - New application form
- `/kort` - Map view
- `/rapporter` - Reports

**Components**:
- Authentication (login, signup, logout)
- Forms (application creation, validation)
- Tables (applications list, sortable, filterable)
- Map (OKAPI integration, markers, filters)
- File upload (drag-drop, preview)
- Timeline (audit log display)

### Mobile App (React Native + Expo)
**Screens** (minimum):
- Login
- Home/Dashboard
- Scanner (QR)
- Sign Detail (after scan)
- My Applications (list)
- Application Detail

**Features**:
- Camera (QR scanning)
- Photo upload
- GPS location
- Supabase sync

### APIs & Services
- **Supabase**: Database + Auth + Storage + Real-time
- **Dataforsyningen DAWA**: Address autocomplete + geocoding
- **Dataforsyningen OKAPI**: Maps

---

## 📏 Constraints & Limitations

### MVP Limitations

**Brugere**:
- 1 kommune
- Max 10 entreprenører
- 1-2 politi brugere (read-only)

**Performance**:
- Max 1.000 skilte på kort (cluster hvis flere)
- Max 50 ansøgninger i listen uden pagination

**Data**:
- Max 10 MB per file upload
- Max 5 filer per ansøgning
- Foto max 5 MB

**Browser Support**:
- Chrome, Firefox, Safari, Edge (seneste 2 versioner)
- Ikke IE11

**Mobile Support**:
- iOS 13+ (seneste 4 år iPhones)
- Android 8.0+ (90%+ coverage)

---

## ✅ Definition of Done

### MVP er færdig når:

**Funktionalitet**:
- [ ] Alle "MUST HAVE" features er implementeret og testet
- [ ] Minimum 3 test-brugere kan gennemføre hele flow uden fejl
- [ ] Ingen kritiske bugs (P0/P1)

**Testing**:
- [ ] User acceptance testing gennemført
- [ ] Cross-browser test (Chrome, Firefox, Safari)
- [ ] Mobile app testet på iOS + Android (real devices)
- [ ] Performance OK (kort loader < 2 sek med 500 markers)

**Documentation**:
- [ ] User guides (for hver rolle)
- [ ] Developer docs (README, setup guide)
- [ ] API documentation (hvis relevant)

**Deployment**:
- [ ] Web deployed til Vercel (production)
- [ ] Mobil app i TestFlight (iOS) + Internal Testing (Android)
- [ ] Supabase production database setup
- [ ] Backups configured
- [ ] Error monitoring (Sentry eller lignende)
- [ ] Environment variables secured

**Business**:
- [ ] Pilot-kunde har godkendt løsningen
- [ ] Pricing model defineret
- [ ] Support-plan på plads

---

## 📅 Delivery Schedule

### Phase Deliverables

**Uge 1** (Foundation):
- ✅ Database i produktion
- ✅ Authentication virker
- ✅ Basic web UI

**Uge 3** (Applications):
- ✅ Entreprenør kan oprette ansøgning
- ✅ Kommune kan godkende
- ✅ QR-koder genereres

**Uge 4** (Maps):
- ✅ Kort viser skilte
- ✅ Filtrering virker

**Uge 6** (Mobile):
- ✅ QR scanner virker
- ✅ Kan markere som monteret/fjernet
- ✅ Foto upload

**Uge 7** (Reporting):
- ✅ Audit log display
- ✅ Basis rapporter
- ✅ CSV export

**Uge 8** (Launch):
- ✅ Testing done
- ✅ Deployment done
- ✅ Documentation done
- 🚀 **MVP LAUNCH**

---

## 🎯 Success Metrics

### Launch Day (Uge 8)
- [ ] 0 kritiske bugs
- [ ] 3+ succesfulde test-sessions
- [ ] Web + mobil deployed

### 1 Måned Efter Launch
- [ ] >80% af scans har foto-dokumentation
- [ ] Gennemsnitlig godkendelsestid < 24 timer
- [ ] >50 skilte registreret
- [ ] System uptime > 99%

### 3 Måneder Efter Launch
- [ ] >90% user satisfaction
- [ ] >200 skilte registreret
- [ ] Pilot-kunde forlænger/betaler
- [ ] 0 P0 bugs, <5 P1 bugs

---

## 🚨 Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Scope creep** | High | Medium | Strict adherence til dette dokument. Say NO til nye features før MVP. |
| **QR codes ødelagt i vejr** | Medium | Medium | Weatherproof labels anbefaling. Re-generation feature. |
| **GPS unøjagtig** | Low | Low | Vis accuracy til bruger. Manuel justering mulig. |
| **Dataforsyningen downtime** | Medium | Low | Cache tiles. Fallback til OpenStreetMap. |
| **User adoption lav** | High | Medium | User training. Simple UX. Klar værdi-proposition. |
| **Mobile app rejection** | Medium | Low | Follow guidelines strengt. Test før submit. |

---

## 📞 Contact & Change Requests

**Product Owner**: [Kunde navn]
**Developer**: Martin

**Change Requests**:
- Alle scope-ændringer skal godkendes af Product Owner
- Dokumentér i dette dokument
- Vurdér impact på timeline

**Communication**:
- Weekly status updates
- Daily progress i Git commits
- Blocker eskaleres med det samme

---

## 📚 Relaterede Dokumenter

- **PROJEKT-BESKRIVELSE.md** - Overall project vision
- **ROADMAP.md** - Detailed week-by-week plan
- **DATABASE-SCHEMA.md** - Database design
- **tech-stack.md** - Technology choices
- **GIS-INTEGRATION.md** - Maps guide
- **SUPABASE-SETUP.md** - Database setup

---

**Version**: 1.0
**Last Updated**: 2025-11-14
**Status**: 📋 Locked - Ready for Development

---

**🎯 Remember: MVP = Minimum VIABLE Product. Focus on value, not features!**

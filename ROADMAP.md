# VejSkilt Platform - Development Roadmap

## Project Timeline Overview

**MVP Target**: 8-10 uger fra projektstart
**Metode**: Agile/iterativ udvikling med ugentlige milestones

```
Uge 1-2: Foundation & Web Core
Uge 3-4: Application Flow & QR
Uge 5-6: Mobile App & Scanning
Uge 7-8: Polish, Testing & Deployment
```

---

## Phase 0: Project Setup (Weekend - før uge 1)

**Mål**: Få alle accounts og værktøjer klar

### Tasks
- [x] Teknologi stack defineret
- [x] Database schema designet
- [x] Project scope dokumenteret
- [ ] Opret Supabase projekt
- [ ] Opret Dataforsyningen konto + token
- [ ] Setup Git repository
- [ ] Setup project struktur (Next.js + React Native workspace)
- [ ] Installer dependencies
- [ ] Configure ESLint + Prettier
- [ ] Setup environment variables

### Deliverables
- ✅ Komplet dokumentation (tech-stack, scope, schema, roadmap)
- 🔄 Supabase project oprettet
- 🔄 Git repo med basic structure
- 🔄 Development environment klar

**Estimeret tid**: 4-6 timer (hovedsagligt setup)

---

## Phase 1: Foundation & Authentication (Uge 1)

**Mål**: Database setup og basic authentication

### 1.1 Database Implementation

**Tasks**:
- [ ] Kør database migrations i Supabase
  - Organizations table
  - Users table (extended profile)
  - Applications table
  - Signs table
  - Attachments table
  - Logs table
- [ ] Setup Row Level Security (RLS) policies
- [ ] Test policies med forskellige brugerroller
- [ ] Create indexes
- [ ] Setup triggers (auto-generate application numbers, logging)
- [ ] Test functions (get_application_stats, get_overdue_signs)

**Acceptance Criteria**:
- ✅ Alle tabeller oprettet uden fejl
- ✅ RLS policies virker (test med 3 forskellige roller)
- ✅ Triggers genererer korrekte værdier

### 1.2 Next.js Setup

**Tasks**:
- [ ] Initialize Next.js 15 project med App Router
- [ ] Install dependencies (Supabase client, Tailwind, shadcn/ui)
- [ ] Configure Tailwind CSS
- [ ] Setup layout structure (AppShell med navbar, sidebar)
- [ ] Create basic page structure
  ```
  /login
  /dashboard
  /ansoegninger
  /kort
  /rapporter
  ```

### 1.3 Authentication

**Tasks**:
- [ ] Implement Supabase Auth
- [ ] Create login page (`/login`)
- [ ] Create signup flow (med organization assignment)
- [ ] Protected routes middleware
- [ ] User context/provider
- [ ] Logout functionality
- [ ] Session persistence

**Acceptance Criteria**:
- ✅ User kan registrere sig og logge ind
- ✅ User bliver redirected baseret på rolle
- ✅ Protected routes virker (kan ikke tilgå uden login)
- ✅ Session persists ved page reload

**Estimeret tid**: 25-30 timer

---

## Phase 2: Application Flow - Web Platform (Uge 2-3)

**Mål**: Entreprenører kan oprette ansøgninger, kommune kan godkende/afvise

### 2.1 Dashboard

**Tasks**:
- [ ] Dashboard layout med stats
- [ ] Different dashboards for hver rolle:
  - **Kommune**: Pending applications count, active signs count, overdue signs
  - **Entreprenør**: Own applications, active signs, upcoming deadlines
  - **Politi**: Active signs count, recent approvals
- [ ] Quick actions (f.eks. "Ny ansøgning", "Se kort")

### 2.2 Application Creation (Entreprenør)

**Tasks**:
- [ ] "Ny ansøgning" form:
  - Titel & beskrivelse
  - Adresse (med DAWA autocomplete)
  - Start- og slutdato (date picker)
  - Upload tegninger/dokumenter (Supabase Storage)
- [ ] Add skilte til ansøgning:
  - Vælg skilttype (dropdown med standard skilte)
  - Marker placering på kort (click på kort)
  - Beskrivelse af placering
  - Multiple skilte per ansøgning
- [ ] Form validation med Zod
- [ ] Preview før submit
- [ ] Submit ansøgning
- [ ] Notifikation ved success

**Acceptance Criteria**:
- ✅ Entreprenør kan oprette komplet ansøgning med flere skilte
- ✅ Filer uploades korrekt til Supabase Storage
- ✅ GPS koordinater gemmes ved marker på kort
- ✅ Validation fungerer (f.eks. slutdato efter startdato)

### 2.3 Application List & Detail View

**Tasks**:
- [ ] List view af ansøgninger:
  - Table med koloner (nummer, titel, status, entreprenør, datoer)
  - Filtrering (status, dato-interval, entreprenør)
  - Søgning (titel, adresse, nummer)
  - Sortering
  - Pagination
- [ ] Detail view:
  - Alle application detaljer
  - Liste over skilte med kort
  - Uploaded filer (gallery)
  - Status historik
  - Comments/review notes

### 2.4 Application Approval (Kommune)

**Tasks**:
- [ ] Approve/Reject modal:
  - Vis alle detaljer
  - Kommentar-felt (påkrævet ved reject)
  - Confirm buttons
- [ ] Status update i database
- [ ] Log action til audit trail
- [ ] Send email notifikation til entreprenør
- [ ] Auto-generér QR koder ved approval (via Edge Function)

**Acceptance Criteria**:
- ✅ Kommune kan godkende/afvise ansøgninger
- ✅ Entreprenør modtager email ved status-ændring
- ✅ QR koder genereres automatisk ved godkendelse

### 2.5 QR Code Generation

**Tasks**:
- [ ] Supabase Edge Function til QR generering
- [ ] Generate unique QR codes for hvert skilt
- [ ] QR code indeholder: sign ID, verification URL
- [ ] PDF export med alle QR codes for en ansøgning
  - A4 format, printvenlig
  - Inkl. skilttype, placering, ansøgningsnummer
- [ ] Download funktion
- [ ] Re-generate option (hvis QR går tabt)

**Acceptance Criteria**:
- ✅ QR koder genereres automatisk ved godkendelse
- ✅ PDF kan downloades og printes
- ✅ QR kode scanner korrekt (test med mobil)

**Estimeret tid**: 35-40 timer

---

## Phase 3: Map Integration (Uge 4)

**Mål**: Interaktivt kort der viser alle skilte

### 3.1 Map Setup

**Tasks**:
- [ ] Integrér OKAPI (Dataforsyningen)
- [ ] Environment variable til token
- [ ] Basic map component med Danmark som center
- [ ] Zoom og pan controls
- [ ] Layer switcher (topografisk, luftfoto)
- [ ] "Find min lokation" knap

### 3.2 Markers & Popups

**Tasks**:
- [ ] Fetch signs fra Supabase
- [ ] Display markers på kort:
  - Forskellige farver/ikoner for status (pending, approved, mounted, removed)
  - Cluster markers når zoomet ud (hvis mange markers)
- [ ] Click på marker → vis popup:
  - Skilttype
  - Status
  - Adresse
  - Ansøgningsnummer
  - Link til detail view
- [ ] Hover effect på markers

### 3.3 Filtering

**Tasks**:
- [ ] Filter panel (sidebar eller overlay):
  - Status (checkboxes)
  - Skilttype (dropdown)
  - Dato-interval (date range picker)
  - Entreprenør (kun for kommune)
- [ ] Apply filters → re-fetch og update markers
- [ ] Clear filters knap
- [ ] URL state sync (kan dele filtered kort-link)

### 3.4 Real-time Updates

**Tasks**:
- [ ] Supabase real-time subscription på `signs` table
- [ ] Auto-update markers når data ændres
- [ ] Toast notification ved ændringer ("Nyt skilt monteret")

**Acceptance Criteria**:
- ✅ Kort viser alle skilte korrekt
- ✅ Markers opdateres i real-time
- ✅ Filtrering virker smooth
- ✅ Performance OK med 1.000+ markers

**Estimeret tid**: 20-25 timer

---

## Phase 4: Mobile App - QR Scanning (Uge 5-6)

**Mål**: Entreprenører kan scanne QR og markere skilte som monteret/fjernet

### 4.1 React Native Setup

**Tasks**:
- [ ] Initialize Expo project
- [ ] Setup Expo Router for navigation
- [ ] Install dependencies:
  - Supabase client
  - Expo Camera
  - Expo Location
  - Expo Image Picker
  - React Native Paper (UI components)
- [ ] Configure app.json (permissions, splash screen, icon)
- [ ] Setup environment variables
- [ ] Basic navigation structure:
  ```
  /login
  /home (dashboard)
  /scanner
  /sign/[id] (detail)
  ```

### 4.2 Authentication (Mobile)

**Tasks**:
- [ ] Login screen (reuse Supabase Auth)
- [ ] Remember me / biometric auth (optional for v1.1)
- [ ] Logout
- [ ] Session handling

### 4.3 QR Scanner

**Tasks**:
- [ ] Camera permission request
- [ ] QR scanner screen med kamera-feed
- [ ] Detect QR code og parse data
- [ ] Validate QR (check hvis gyldigt VejSkilt QR)
- [ ] Fetch sign data fra Supabase
- [ ] Show sign details efter scan
- [ ] Error handling (ugyldig QR, netværksfejl)

**Acceptance Criteria**:
- ✅ Kamera åbner og scanner QR
- ✅ Valid QR → vis skilt-detaljer
- ✅ Invalid QR → vis fejl-besked

### 4.4 Mark as Mounted

**Tasks**:
- [ ] Efter scan → vis "Marker som monteret" knap
- [ ] Få GPS koordinater (Expo Location)
  - Vis accuracy til bruger
  - Warning hvis GPS unøjagtig (>20m)
- [ ] Tag billede (valgfrit men anbefalet):
  - Åbn kamera
  - Take photo
  - Preview før upload
- [ ] Confirmation dialog
- [ ] Upload:
  - Update sign status til 'mounted'
  - Gem GPS koordinater
  - Upload foto til Supabase Storage
  - Timestamp
- [ ] Success feedback (animation/toast)

**Acceptance Criteria**:
- ✅ Skilt markeres som monteret med korrekte data
- ✅ GPS koordinater gemmes
- ✅ Foto uploades (hvis taget)
- ✅ Ændring synlig på web i real-time

### 4.5 Mark as Removed

**Tasks**:
- [ ] Se liste over egne monterede skilte
- [ ] Scan QR eller vælg fra liste
- [ ] "Marker som fjernet" knap
- [ ] Tag billede af fjernet område (valgfrit)
- [ ] GPS koordinater
- [ ] Confirmation
- [ ] Update database

### 4.6 Sign List (Mobile)

**Tasks**:
- [ ] List of entreprenørens egne ansøgninger
- [ ] Filter: Status (alle, godkendt, monteret, fjernet)
- [ ] Pull-to-refresh
- [ ] Swipe actions (f.eks. swipe til scan)
- [ ] Detail view for hvert skilt

### 4.7 Offline Queue (Optional for v1.1)

**Tasks**:
- [ ] Queue actions når offline
- [ ] Sync når online igen
- [ ] Vis pending sync status

**Note**: Ikke kritisk for MVP, kan udsættes til v1.1.

**Estimeret tid**: 35-40 timer

---

## Phase 5: Reporting & Audit Log (Uge 7)

**Mål**: Rapportering og komplet audit trail

### 5.1 Application History/Timeline

**Tasks**:
- [ ] Timeline component på application detail:
  - Oprettet (af hvem, hvornår)
  - Godkendt/afvist (af hvem, hvornår, kommentar)
  - Hver skilt monteret (af hvem, hvornår, GPS, foto)
  - Hver skilt fjernet (af hvem, hvornår, GPS, foto)
- [ ] Sorteret kronologisk
- [ ] Icons for hver event-type
- [ ] Expandable sections (f.eks. click for at se foto)

### 5.2 Reports

**Tasks**:
- [ ] Rapport-side (`/rapporter`)
- [ ] Report types:
  1. **Aktive skilte**: Liste over alle monterede skilte (med kort)
  2. **Overskredne deadlines**: Skilte der skulle have været fjernet
  3. **Entreprenør-rapport**: Antal ansøgninger, skilte, gennemsnitstid
  4. **Månedlig statistik**: Antal nye ansøgninger, godkendelser, monteringer
- [ ] Filters (dato-interval, entreprenør, kommune)
- [ ] Export til:
  - PDF (pretty formatted)
  - CSV (raw data)

### 5.3 PDF Export (Edge Function)

**Tasks**:
- [ ] Supabase Edge Function til PDF generation
  - Use library som `jsPDF` eller `pdfmake`
- [ ] Templates for forskellige rapporter
- [ ] Include logo, dato, metadata
- [ ] Download funktion

**Acceptance Criteria**:
- ✅ Kommune kan generere rapporter
- ✅ Rapporter er nøjagtige og opdaterede
- ✅ PDF/CSV download virker

**Estimeret tid**: 20-25 timer

---

## Phase 6: Testing, Polish & Deployment (Uge 8)

**Mål**: Test, bug fixes, deployment til produktion

### 6.1 User Acceptance Testing

**Tasks**:
- [ ] Recruit test-brugere:
  - 1-2 kommune-medarbejdere
  - 2-3 entreprenører
- [ ] Forbered test-scenarios
- [ ] Observér user testing sessions
- [ ] Indsaml feedback
- [ ] Prioritér fixes

### 6.2 Bug Fixes & Polish

**Tasks**:
- [ ] Fix kritiske bugs fra testing
- [ ] Responsiveness checks (desktop, tablet, mobil web)
- [ ] Performance optimization:
  - Lazy loading
  - Image optimization
  - Query optimization
- [ ] Accessibility checks (a11y):
  - Keyboard navigation
  - Screen reader support
  - Color contrast
- [ ] Loading states og error boundaries
- [ ] Empty states (f.eks. "Ingen ansøgninger endnu")

### 6.3 Documentation

**Tasks**:
- [ ] User guides:
  - **For Entreprenører**: Sådan opretter du en ansøgning, scanner QR
  - **For Kommune**: Sådan godkender du ansøgninger, genererer rapporter
  - **For Politi**: Sådan bruger du kortet
- [ ] Video tutorials (optional men nice)
- [ ] FAQ
- [ ] Developer documentation (for fremtidige udviklinger)

### 6.4 Deployment

**Web Platform**:
- [ ] Setup Vercel project
- [ ] Connect Git repo
- [ ] Configure environment variables (production)
- [ ] Setup custom domain (hvis relevant)
- [ ] Test production deployment
- [ ] Setup error monitoring (f.eks. Sentry)

**Mobile App**:
- [ ] Build production app med EAS Build
- [ ] Test på physical devices (iOS + Android)
- [ ] Submit til:
  - Apple TestFlight (beta testing)
  - Google Play Internal Testing
- [ ] Når godkendt → Production release

**Supabase**:
- [ ] Upgrade til Pro plan ($25/måned)
- [ ] Setup production database (separate fra dev)
- [ ] Migrate schema til production
- [ ] Setup backups
- [ ] Configure authentication settings
- [ ] Setup usage alerts

**Dataforsyningen**:
- [ ] Opret production token (separat fra dev)
- [ ] Test map loading i production

### 6.5 Monitoring & Analytics

**Tasks**:
- [ ] Setup error monitoring (Sentry eller lignende)
- [ ] Analytics (f.eks. PostHog eller Mixpanel)
  - Track key metrics:
    - Antal ansøgninger per uge
    - Gennemsnitlig godkendelsestid
    - Antal scans per dag
- [ ] Uptime monitoring (f.eks. UptimeRobot)
- [ ] Setup alerts for kritiske fejl

**Acceptance Criteria**:
- ✅ Web platform deployed og tilgængelig
- ✅ Mobil app i beta testing
- ✅ Ingen kritiske bugs
- ✅ User guides published
- ✅ Monitoring setup og virker

**Estimeret tid**: 25-30 timer

---

## Post-MVP: Version 1.1+ (Efter Uge 8)

**Kun hvis tid og budget tillader**

### Features til v1.1 (3-4 uger efter MVP)
- [ ] Offline funktionalitet i mobil app
- [ ] Push notifications (påmindelser om deadlines)
- [ ] Real-time notifikationer på web (når ansøgning godkendt)
- [ ] Advanced rapportering med grafer (Chart.js eller Recharts)
- [ ] Bulk operations (godkend flere ansøgninger på én gang)
- [ ] Template-ansøgninger (genbruge tidligere ansøgninger)

### Features til v2.0 (3-6 måneder efter MVP)
- [ ] Fakturering/betaling integration (Stripe)
- [ ] Automatiske email-påmindelser (slutdato nærmer sig)
- [ ] Multi-kommune support (skalering til flere kommuner)
- [ ] Admin panel til super-admins
- [ ] API for tredjeparts integration
- [ ] Mobile app: Biometric login
- [ ] Advanced map features (heat maps, clustering med numbers)
- [ ] Integration til kommunens økonomisystem

---

## Development Approach

### Working Method

**Agile/Iterativ**:
- Weekly sprints
- Daily stand-ups (optional for solo dev)
- End-of-sprint reviews

**Prioritization**:
1. **Must-have** for MVP: Authentication, ansøgninger, QR scanning
2. **Should-have**: Rapporter, audit log
3. **Nice-to-have**: Offline, notifikationer, advanced filtering

### Git Workflow

**Branches**:
- `main`: Production
- `develop`: Development/staging
- Feature branches: `feature/qr-scanning`, `feature/map-integration`

**Commits**:
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- Reference issue/task numbers

### Code Reviews

**For solo developer**:
- Selv-review før merge
- Checklist:
  - [ ] TypeScript errors cleared
  - [ ] No console.logs
  - [ ] Tested functionality
  - [ ] Responsive design checked

---

## Risk Management

| Risk | Mitigation |
|------|-----------|
| **Dataforsyningen API downtime** | Fallback til OpenStreetMap, cache tiles |
| **Supabase rate limits hit** | Monitor usage, optimize queries, upgrade plan |
| **QR codes destroyed in weather** | Weatherproof labels, re-generation feature |
| **GPS inaccuracy** | Show accuracy to user, allow manual adjustment |
| **User adoption low** | User training, simple UX, clear value prop |
| **Scope creep** | Strict adherence to MVP scope document |
| **Mobile app rejection** | Follow store guidelines, test thoroughly |

---

## Success Metrics

### Week 4 Checkpoint:
- ✅ Authentication works
- ✅ Can create and approve applications
- ✅ QR codes generated
- ✅ Map shows markers

### Week 8 (MVP Launch):
- ✅ All MVP features implemented
- ✅ Mobile app in beta testing
- ✅ Min. 3 test-brugere completed full workflow
- ✅ Deployment to production
- ✅ Documentation complete

### 3 Months Post-Launch:
- 📊 >80% af entreprenører using platform
- 📊 Gennemsnitlig godkendelsestid <24 timer
- 📊 >500 skilte registered i systemet
- 📊 <5% fejlrate (forkert placering, manglende dokumentation)

---

## Resources Needed

### Development
- **Primary Developer**: Martin (dig)
- **Design** (optional): UI/UX designer for polish (kan klares med shadcn/ui)
- **Testing**: 3-5 test-brugere (kommune + entreprenører)

### Accounts & Services
- **Supabase**: Gratis tier til dev, Pro ($25/måned) til production
- **Vercel**: Gratis tier (sandsynligvis nok til start)
- **Expo EAS**: $99/år for build + hosting
- **Dataforsyningen**: Gratis
- **Domain**: ~$15/år (optional)
- **Error monitoring** (Sentry): Gratis tier OK til start

**Estimeret månedlig cost for production**:
- Supabase Pro: $25
- Expo EAS: ~$8/måned ($99/år)
- **Total**: ~$35/måned

---

## Timeline Summary

```
Uge 0  (Setup):        Project structure, accounts
                       ⬇️
Uge 1  (Foundation):   Database + Auth
                       ⬇️
Uge 2-3 (Web Core):    Applications flow, QR generation
                       ⬇️
Uge 4  (Maps):         Map integration, markers, filters
                       ⬇️
Uge 5-6 (Mobile):      React Native app, QR scanner
                       ⬇️
Uge 7  (Reports):      Reporting, audit log
                       ⬇️
Uge 8  (Launch):       Testing, polish, deployment
                       ⬇️
                    🚀 MVP LIVE!
```

**Total Development Time**: 160-200 timer
**Calendar Time**: 8-10 uger (20-25 timer/uge)

---

## Next Steps

1. ✅ Review denne roadmap med kunde
2. ⏸️ Få godkendelse af scope og timeline
3. ⏸️ Setup Supabase project (venter til weekend)
4. ⏸️ Opret Dataforsyningen konto
5. ⏸️ Start Phase 1: Database implementation

---

**Status**: 📋 Planning Complete - Ready for Development
**Created**: 2025-11-14
**Next Update**: Ved start af Phase 1

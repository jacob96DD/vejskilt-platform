# VejSkilt Platform - Projekt Scope & Manifest

## Executive Summary

**Formål**: Digitalisere og strømline processen for ansøgning, godkendelse, montering og dokumentation af midlertidig vejskiltning i kommunen.

**Problem**: I dag bruges manuelt papirarbejde, manglende dokumentation og ineffektiv kommunikation mellem kommune, entreprenører og politi.

**Løsning**: En web- og mobilplatform hvor entreprenører kan ansøge om skiltning, kommunen kan godkende, og monteringen verificeres via QR-koder.

---

## Målgrupper & Roller

### 1. **Kommune** (Primary Customer)
**Ansvar**:
- Godkende/afvise ansøgninger om vejskiltning
- Føre tilsyn med aktive skilte
- Generere rapporter og statistik
- Se alle sager på kort

**Værdi**:
- Reduceret administration
- Bedre overblik over alle skilte i kommunen
- Digital dokumentation med billeder og GPS
- Færre fejl og uautoriserede skilte

### 2. **Entreprenører** (Primary Customer)
**Ansvar**:
- Ansøge om tilladelse til vejskiltning
- Modtage og printe QR-koder
- Scanne QR-koder ved montering
- Uploade billeder som dokumentation
- Markere skilte som fjernet

**Værdi**:
- Hurtigere godkendelser
- Digital log af alle monteringer
- Beskyttelse mod ansvar (bevis for korrekt skiltning)
- Mindre papirarbejde

### 3. **Politi** (Secondary User - Read Only)
**Ansvar**:
- Se godkendte skilte på kort
- Verificere at skiltning er autoriseret

**Værdi**:
- Real-time overblik
- Nem verifikation af tilladelser
- Bedre trafiksikkerhed

---

## Kernefeatures - MVP (Version 1.0)

### ✅ SKAL VÆRE MED I MVP

#### 1. **Brugeradministration**
- [ ] Login/logout (email + password via Supabase Auth)
- [ ] Brugerroller: Kommune Admin, Entreprenør, Politi (read-only)
- [ ] Organisation-tilknytning (entreprenører tilhører firma)
- [ ] Profil med kontaktinfo

#### 2. **Ansøgnings-flow**
- [ ] Entreprenør opretter ny ansøgning
- [ ] Vælg skilttype(r) fra dropdown (standard vejskilte)
- [ ] Marker placering(er) på kort
- [ ] Upload evt. tegninger/planer
- [ ] Angiv start- og slutdato for skiltning
- [ ] Send ansøgning til kommune

#### 3. **Godkendelses-flow**
- [ ] Kommune ser liste over indkomne ansøgninger
- [ ] Detaljevisning af ansøgning (kort, skilte, datoer, filer)
- [ ] Godkend eller afvis med kommentar
- [ ] Email notifikation til entreprenør ved godkendelse/afvisning

#### 4. **QR-kode System**
- [ ] Auto-generering af unikke QR-koder ved godkendelse
- [ ] Download QR-koder som PDF (printvenlig A4)
- [ ] QR-kode linker til specifik skilt-registrering
- [ ] Mulighed for at re-generere QR hvis tabt

#### 5. **Montering & Scanning (Mobil App)**
- [ ] QR scanner i mobil app
- [ ] Scan QR → marker skilt som "Monteret"
- [ ] Tag billede af monteret skilt (valgfrit men anbefalet)
- [ ] GPS-koordinater registreres automatisk ved scanning
- [ ] Timestamp for montering

#### 6. **Afmontering**
- [ ] Scan QR → marker skilt som "Fjernet"
- [ ] Tag billede af fjernet område (valgfrit)
- [ ] Timestamp for afmontering

#### 7. **Kort-visning**
- [ ] Interaktivt kort med alle skilte
- [ ] Filter: Status (ansøgt, godkendt, monteret, fjernet)
- [ ] Filter: Skilttype
- [ ] Filter: Dato-interval
- [ ] Click på skilt → se detaljer og historik
- [ ] Tilgængeligt for alle brugerroller (med forskellige rettigheder)

#### 8. **Sags-oversigt**
- [ ] Liste over alle sager/ansøgninger
- [ ] Sortering og filtrering
- [ ] Status-badges (Pending, Approved, Rejected, Active, Completed)
- [ ] Søgning på adresse, entreprenør, sagsnummer

#### 9. **Log & Dokumentation**
- [ ] Komplet historik for hver skilt
  - Hvem oprettede ansøgningen (dato/tid)
  - Hvem godkendte/afviste (dato/tid + kommentar)
  - Hvem monterede (dato/tid + GPS + billede)
  - Hvem fjernede (dato/tid + GPS + billede)
- [ ] Eksporter log som PDF rapport

#### 10. **Basis Rapportering**
- [ ] Antal aktive skilte i kommunen
- [ ] Antal skilte per entreprenør
- [ ] Overskridelse af tidsfrister (skilte der ikke er fjernet til tiden)
- [ ] Eksport til CSV

---

### ❌ SKAL IKKE VÆRE MED I MVP

#### Udsættes til Version 2.0+
- ❌ Offline funktionalitet (mobil app)
- ❌ Fakturering / betaling
- ❌ Automatiske påmindelser (SMS/email ved udløbsdatoer)
- ❌ Integration til eksterne systemer (f.eks. kommunens økonomi)
- ❌ Billedgenkendelse af skilte
- ❌ Push notifikationer (mobil)
- ❌ Multi-language support
- ❌ Avanceret rapportering med grafer
- ❌ Public API for tredjeparts integration
- ❌ Bulk upload af flere ansøgninger
- ❌ Template-ansøgninger (genbruge tidligere ansøgninger)
- ❌ Kommentar-tråde på sager
- ❌ Workflow med flere godkendere
- ❌ Vejrdata integration (advarsel ved dårligt vejr)

#### Nice-to-have, men ikke kritisk
- ⏸️ Real-time notifikationer (kan vente til v1.1)
- ⏸️ Dark mode
- ⏸️ Avancerede kort-features (trafik, luftfoto)
- ⏸️ Dashboards med widgets

---

## ROI & Business Case

### Problem Statement - Current "Pains"

**Estimeret data for kommunen**:
- **~1.500 skilte** i kommunen årligt
- **Estimeret tidsforbrug per skilt i dag**:
  - Entreprenør: ~20 min papirarbejde + transport til rådhus
  - Kommune: ~15 min sagsbehandling + arkivering
  - **Total**: ~35 minutter per skilt
- **Årligt tidsforbrug**: 1.500 × 35 min = **875 timer/år**

### Med VejSkilt Platform

**Estimeret tidsbesparelse**:
- Entreprenør: ~5 min (digital ansøgning fra byggeplads)
- Kommune: ~5 min (klik godkend, auto-generering af QR)
- **Total**: ~10 minutter per skilt
- **Besparelse per skilt**: 25 minutter (71% reduktion)

**Årlig besparelse**: 1.500 × 25 min = **625 timer/år**

**Værdi**:
- Ved gennemsnitlig timeløn på 400 kr/time
- **625 timer × 400 kr = 250.000 kr/år i tidsbesparelse**

### Yderligere Gevinster

1. **Færre fejl**:
   - Reducerede bøder/ansvar pga. forkert skiltning
   - Bedre dokumentation ved uheld/sager

2. **Hurtigere byggeprocesser**:
   - Godkendelser på 24 timer i stedet for 3-5 dage
   - **Estimat**: Gennemsnitligt byggeprojekt færdigt 2-3 dage hurtigere
   - Værdi for entreprenører: Hurtigere videre til næste projekt

3. **Bedre compliance**:
   - GPS-verifikation sikrer skilte står det rigtige sted
   - Færre ulovlige/glemte skilte

4. **Miljø**:
   - Papirløs proces
   - Færre køreture til rådhus

---

## Målepunkter for Succes (KPIs)

### Efter 6 måneder:
- [ ] Gennemsnitlig godkendelsestid < 24 timer
- [ ] Min. 80% af entreprenører bruger platformen
- [ ] Min. 500 skilte registreret i systemet
- [ ] 90% af monteringer har billede-dokumentation
- [ ] < 5% fejlrate (forkert placering, manglende tilladelse)

### Efter 12 måneder:
- [ ] 100% digitalisering (ingen papir-ansøgninger)
- [ ] Dokumenteret tidsbesparelse på min. 500 timer
- [ ] Min. 3 kommuner bruger platformen
- [ ] Net Promoter Score (NPS) > 50

---

## Faser & Milestones

### **Phase 0: Foundation** (Uge 1)
- Supabase project setup
- Database schema implementation
- Authentication setup
- Basic deployment pipeline

### **Phase 1: Web Platform Core** (Uge 2-3)
- Login & user management
- Ansøgnings-flow (create, edit, submit)
- Godkendelses-flow (approve/reject)
- QR code generation
- Basic sags-liste

### **Phase 2: Map Integration** (Uge 4)
- Leaflet map integration
- Place markers for skilte
- Filter og search på kort
- Detail popups

### **Phase 3: Mobile App** (Uge 5-6)
- React Native setup (Expo)
- QR scanner implementation
- Camera integration (foto upload)
- GPS location capture
- Marker som monteret/fjernet

### **Phase 4: Logging & Reporting** (Uge 7)
- Komplet historik/audit log
- PDF export
- Basic rapporter
- CSV export

### **Phase 5: Testing & Polish** (Uge 8)
- User acceptance testing
- Bug fixes
- Performance optimization
- Documentation
- Deployment til production

---

## Tekniske Constraints

### Performance
- Kort skal loade < 2 sekunder med 1.000+ markers
- QR scanning skal reagere < 1 sekund
- Web app skal virke på tablets (iPads) ude i marken

### Sikkerhed
- Row Level Security (RLS) for alle data
- Ingen entreprenør må se andre firmaers data
- GDPR compliance (data encryption, deletion rights)

### Browser Support
- Chrome, Firefox, Safari, Edge (seneste 2 versioner)
- Mobile browsers (iOS Safari, Chrome Android)

### Mobile App
- iOS 13+ (for at supportere seneste 4-5 år iPhones)
- Android 8.0+ (90%+ dækning)

---

## Out of Scope for Entire Platform

- ❌ Permanent vejskiltning (kun midlertidig/byggeskiltning)
- ❌ Integration til nationale vej-registre
- ❌ Navigation/ruteplanlægning
- ❌ Realtids-trafik data
- ❌ Video upload (kun billeder)
- ❌ Chatfunktion mellem brugere
- ❌ Marketplace/booking system

---

## Dependencies & Risks

### Dependencies
- Supabase subscription ($ ~25/måned for production)
- Expo EAS build ($99/år for at bygge apps)
- Vercel hosting (gratis tier sandsynligvis nok til start)
- Domæne + SSL cert (~$15/år)

### Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Entreprenører ikke adopterer | High | Medium | User testing tidligt, simpel UX, træning |
| QR-koder bliver ødelagt i vejr | Medium | Medium | Mulighed for re-generering, vejrbestandige labels |
| Mobil GPS unøjagtigt | Low | Low | Vis præcision til bruger, manuel justering |
| Supabase downtime | Medium | Low | Status-side, kommunikation, cached data |

---

## Definition of Done

MVP er færdig når:
- [ ] Alle ✅ features fra "SKAL VÆRE MED I MVP" er implementeret
- [ ] Minimum 3 test-entreprenører kan gennemføre hele flow
- [ ] Kommune-admin kan godkende og se rapport
- [ ] Mobil app godkendt i App Store & Google Play (eller TestFlight/Beta)
- [ ] Documentation skrevet (user guides for hver rolle)
- [ ] Supabase backup strategi på plads
- [ ] Production environment deployed og stabil

---

## Contact & Team

**Product Owner**: [Kunde navn]
**Developer**: Martin (Dig)
**Første pilot**: [Kommune navn]

**Status**: 📋 Planning Phase
**Forventet MVP Launch**: [8-10 uger fra projektstart]
**Last Updated**: 2025-11-14

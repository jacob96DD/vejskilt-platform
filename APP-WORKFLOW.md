# VejSkilt App - Komplet Workflow Guide

## 🎯 Formål

Vis præcis hvordan appen fungerer fra start til slut - fra entreprenør opretter ansøgning til skilt er monteret og dokumenteret.

---

## 👥 Brugerroller

### 1. **Entreprenør** (Mobile App)
- Opretter ansøgninger
- Scanner QR koder
- Monterer og dokumenterer skilte

### 2. **Kommune** (Web/Tablet App)
- Godkender eller afviser ansøgninger
- Fører tilsyn
- Genererer rapporter

### 3. **Politi** (Web/Tablet - Read Only)
- Ser godkendte skilte på kort
- Verificerer tilladelser

---

## 🔄 Komplet Workflow

### Phase 1: Opret Ansøgning (Entreprenør)

#### 1.1 Entreprenør åbner app

```
[Entrepreneur opens app on mobile/tablet]
    ↓
Login (email/password)
    ↓
Dashboard vises
    ↓
Click "Ny Ansøgning" knap
```

#### 1.2 Udfyld ansøgningsformular

```typescript
// Formular felter:

1. Titel: "Vejarbejde - Vesterbrogade"
2. Beskrivelse: "Asfaltarbejde i 2 uger"
3. Adresse: [Søg adresse med autocomplete]
   └─ Bruger DAWA API fra Dataforsyningen
   └─ Vælg: "Vesterbrogade 10, 1620 København"
   └─ GPS koordinater hentes automatisk: (55.6738, 12.5647)
4. Start dato: "2025-01-20"
5. Slut dato: "2025-02-03"
6. Upload tegninger/planer (valgfrit):
   └─ [Vælg PDF eller billede fra telefon]
```

#### 1.3 Tilføj skilte på kort

```
Click "Tilføj Skilte"
    ↓
[Interaktivt kort vises]
    ↓
For hvert skilt:

1. Vælg skilttype fra dropdown:
   ├─ Hastighedsbegrænsning 40 km/t
   ├─ Vejarbejde
   ├─ Omkørsel
   ├─ Stop - Vigepligt
   └─ ... (flere typer)

2. Click på kort hvor skiltet skal stå
   └─ GPS koordinater gemmes automatisk

3. Tilføj beskrivelse (valgfrit):
   "Ved indkørsel til byggeplads"

4. Click "Tilføj Skilt"
   └─ Skilt vises som marker på kortet

5. Gentag for flere skilte...

Click "Færdig med skilte"
```

**Teknisk**:
```typescript
// Når bruger klikker på kort:
map.on('click', (e) => {
  const { lat, lng } = e.latlng

  // Tilføj skilt til ansøgning
  signs.push({
    sign_type: selectedType,
    latitude: lat,
    longitude: lng,
    placement_description: description,
  })

  // Vis marker på kort (VORES data ovenpå kortet!)
  L.marker([lat, lng], {
    icon: customIcon,
  }).addTo(map)
})
```

#### 1.4 Preview og send

```
Preview-side viser:
├─ Alle ansøgnings-detaljer
├─ Kort med alle skilte markeret
├─ Uploadede filer
└─ Estimeret godkendelsestid: 24 timer

Click "Send Ansøgning"
    ↓
[Data gemmes i Supabase]
    ↓
Status: "Pending" (afventer godkendelse)
    ↓
Success besked: "Ansøgning sendt! Sagsnr: ANS-2025-001234"
```

**Database operationer**:
```typescript
// 1. Opret ansøgning
const { data: application } = await supabase
  .from('applications')
  .insert({
    organization_id: user.organization_id,
    created_by: user.id,
    title: "Vejarbejde - Vesterbrogade",
    address: "Vesterbrogade 10, København",
    start_date: "2025-01-20",
    end_date: "2025-02-03",
    status: 'pending',
  })
  .select()
  .single()

// 2. Opret skilte
await supabase
  .from('signs')
  .insert(
    signs.map(sign => ({
      application_id: application.id,
      sign_type: sign.sign_type,
      latitude: sign.latitude,
      longitude: sign.longitude,
      status: 'not_mounted',
    }))
  )

// 3. Upload filer (hvis der er nogen)
for (const file of files) {
  await supabase.storage
    .from('attachments')
    .upload(`${application.id}/${file.name}`, file)
}
```

---

### Phase 2: Godkendelse (Kommune)

#### 2.1 Kommune modtager notifikation

```
[Email sendes til kommune]
    ↓
"Ny ansøgning modtaget: ANS-2025-001234"
    ↓
Kommune logger ind på web/tablet
    ↓
Dashboard viser: "1 ny ansøgning afventer godkendelse"
```

#### 2.2 Gennemse ansøgning

```
Click på ansøgning i listen
    ↓
Detalje-side vises med:

┌─────────────────────────────────────┐
│ Ansøgning ANS-2025-001234           │
├─────────────────────────────────────┤
│ Titel: Vejarbejde - Vesterbrogade   │
│ Entreprenør: Byggefirma A/S         │
│ Periode: 20.01.25 - 03.02.25        │
│ Adresse: Vesterbrogade 10           │
├─────────────────────────────────────┤
│ INTERAKTIVT KORT:                   │
│                                     │
│  [Kort viser baggrund fra           │
│   OpenStreetMap/Dataforsyningen]    │
│                                     │
│  📍 3 skilte markeret på kort:      │
│    • Hastighedsbegr. 40 (Gul pin)  │
│    • Vejarbejde (Gul pin)          │
│    • Omkørsel (Gul pin)            │
│                                     │
├─────────────────────────────────────┤
│ Uploadede filer:                    │
│  📄 Tegning-byggeplads.pdf          │
├─────────────────────────────────────┤
│ [Godkend] [Afvis]                   │
└─────────────────────────────────────┘
```

**Teknisk - Hent og vis data**:
```typescript
// Hent ansøgning med skilte
const { data: application } = await supabase
  .from('applications')
  .select(`
    *,
    signs (*),
    organization:organizations (*),
    creator:users!created_by (*)
  `)
  .eq('id', applicationId)
  .single()

// Vis på kort
const map = L.map('map').setView([55.6761, 12.5683], 13)

// Tilføj baggrundskort (Dataforsyningen ELLER OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

// Tilføj VORES skilte som markers OVENPÅ kortet
application.signs.forEach(sign => {
  L.marker([sign.latitude, sign.longitude], {
    icon: yellowPendingIcon,  // Gul = afventer godkendelse
  })
  .bindPopup(`
    <b>${sign.sign_type}</b><br>
    Status: Afventer godkendelse<br>
    ${sign.placement_description || ''}
  `)
  .addTo(map)
})
```

#### 2.3 Godkend eller afvis

**Godkend**:
```
Click "Godkend"
    ↓
Modal åbnes:
├─ "Er du sikker på at godkende?"
├─ Kommentar (valgfrit): "Ser fint ud"
└─ [Bekræft] [Annuller]

Click "Bekræft"
    ↓
[Database opdateres]
    ↓
Status ændres: "pending" → "approved"
    ↓
QR-koder genereres automatisk (trigger!)
    ↓
Email sendes til entreprenør
    ↓
Success: "Ansøgning godkendt! QR-koder er klar."
```

**Database operationer**:
```typescript
// Opdater ansøgning
await supabase
  .from('applications')
  .update({
    status: 'approved',
    approved_by: kommune_user.id,
    reviewed_at: new Date().toISOString(),
    review_comment: "Ser fint ud",
  })
  .eq('id', applicationId)

// QR-koder genereres automatisk via database trigger!
// (Se COMPLETE-DATABASE-SETUP.sql - generate_qr_code function)

// Hver sign får nu en unik QR kode som "VS-2025-ABC123XYZ"
```

**Afvis**:
```
Click "Afvis"
    ↓
Modal åbnes:
├─ "Hvorfor afvises ansøgningen?"
├─ Kommentar (PÅKRÆVET): "Skilte må ikke stå der"
└─ [Bekræft] [Annuller]

Click "Bekræft"
    ↓
Status: "pending" → "rejected"
    ↓
Email til entreprenør med kommentar
```

---

### Phase 3: Download QR-koder (Entreprenør)

#### 3.1 Modtag godkendelse

```
[Entreprenør modtager email]
    ↓
"Din ansøgning ANS-2025-001234 er godkendt!"
    ↓
Click link i email ELLER log ind i app
    ↓
Ansøgning vises med status: "Godkendt ✅"
```

#### 3.2 Download QR-koder

```
Click "Download QR-koder"
    ↓
[PDF genereres med alle QR-koder]
    ↓
PDF indeholder for hvert skilt:

┌─────────────────────────────┐
│ VEJSKILT - ANS-2025-001234  │
├─────────────────────────────┤
│   [QR CODE]                 │
│   VS-2025-ABC123XYZ         │
├─────────────────────────────┤
│ Type: Hastighedsbegr. 40    │
│ Placering: Vesterbrogade 10 │
│ Ved indkørsel til plads     │
├─────────────────────────────┤
│ Skal monteres: 20.01.2025   │
│ Skal fjernes: 03.02.2025    │
└─────────────────────────────┘

[Næste skilt...]
```

#### 3.3 Print QR-labels

```
Entreprenør printer PDF
    ↓
Klipper QR-koder ud
    ↓
Sætter QR-labels på skilte
ELLER
Laminerer og hænger ved siden af skilt
```

---

### Phase 4: Montering (Entreprenør - Mobil)

#### 4.1 På byggepladsen

```
Entreprenør ankommer til byggeplads
    ↓
Tager skilte med QR-labels
    ↓
Åbner VejSkilt app på mobil
    ↓
Click "Scan QR"
    ↓
[Kamera åbnes]
```

#### 4.2 Scan QR og monter

```
Scan QR-kode på skilt
    ↓
App validerer QR: "VS-2025-ABC123XYZ"
    ↓
Skilt-info vises:

┌─────────────────────────────┐
│ ✅ Skilt Fundet!            │
├─────────────────────────────┤
│ Type: Hastighedsbegr. 40    │
│ Ansøgning: ANS-2025-001234  │
│ Skal stå ved:               │
│ Vesterbrogade 10            │
├─────────────────────────────┤
│ 📍 Din position:            │
│ 55.6738, 12.5647            │
│ Nøjagtighed: ±5m ✅         │
├─────────────────────────────┤
│ [Tag Foto] [Spring over]    │
│ [Marker som Monteret]       │
└─────────────────────────────┘
```

**Tag foto**:
```
Click "Tag Foto"
    ↓
[Kamera åbnes]
    ↓
Tag billede af monteret skilt
    ↓
Preview vises
    ↓
[Behold] [Tag Ny]
```

**Marker som monteret**:
```
Click "Marker som Monteret"
    ↓
Bekræftelse:
├─ Skilttype: Hastighedsbegr. 40 ✅
├─ GPS koordinater: 55.6738, 12.5647 ✅
├─ Foto: [thumbnail] ✅
├─ Tidspunkt: 20.01.2025 14:30 ✅
└─ [Bekræft] [Annuller]

Click "Bekræft"
    ↓
[Data gemmes i Supabase]
    ↓
Success: "Skilt markeret som monteret! ✅"
```

**Database operationer**:
```typescript
// 1. Opdater skilt status
await supabase
  .from('signs')
  .update({
    status: 'mounted',
    mounted_at: new Date().toISOString(),
    mounted_by: user.id,
    mounted_latitude: gpsCoords.latitude,
    mounted_longitude: gpsCoords.longitude,
  })
  .eq('qr_code', 'VS-2025-ABC123XYZ')

// 2. Upload foto
const { data: uploadData } = await supabase.storage
  .from('attachments')
  .upload(`signs/${signId}/mounted-${timestamp}.jpg`, photoFile)

// 3. Link foto til skilt
await supabase
  .from('attachments')
  .insert({
    sign_id: signId,
    file_name: uploadData.path,
    file_path: uploadData.fullPath,
    file_type: 'image/jpeg',
    attachment_type: 'mounted_photo',
    uploaded_by: user.id,
  })

// 4. Database trigger opdaterer automatisk application status til "active"!
```

#### 4.3 Se resultat på kort

```
Entreprenør (eller Kommune) åbner kort
    ↓
[Kort vises med baggrund fra OSM/Dataforsyningen]
    ↓
VORES marker for skiltet er nu GRØN:

📍 (Grøn pin) = Monteret ✅
    Click på pin →
    Popup viser:
    ├─ Type: Hastighedsbegr. 40
    ├─ Status: Monteret ✅
    ├─ Monteret: 20.01.2025 14:30
    ├─ Af: Martin Jensen
    ├─ GPS: 55.6738, 12.5647
    └─ [Se Foto] [Se Historik]
```

---

### Phase 5: Fjernelse (Entreprenør - Mobil)

#### 5.1 Når arbejdet er færdigt

```
Arbejde færdigt - skilte skal fjernes
    ↓
Entreprenør åbner app
    ↓
Navigerer til "Mine Skilte"
    ↓
Filtrerer: "Monteret" skilte
    ↓
Liste vises:

┌─────────────────────────────┐
│ Monterede Skilte (3)        │
├─────────────────────────────┤
│ 📍 Hastighedsbegr. 40       │
│    Monteret: 20.01.2025     │
│    [Scan QR] [Fjern]        │
├─────────────────────────────┤
│ 📍 Vejarbejde               │
│    Monteret: 20.01.2025     │
│    [Scan QR] [Fjern]        │
├─────────────────────────────┤
│ 📍 Omkørsel                 │
│    Monteret: 20.01.2025     │
│    [Scan QR] [Fjern]        │
└─────────────────────────────┘
```

#### 5.2 Fjern skilt

**Option A: Scan QR igen**
```
Click "Scan QR"
    ↓
Scan samme QR som ved montering
    ↓
App ser skiltet er "mounted"
    ↓
Viser: "Marker som Fjernet?" knap
```

**Option B: Fra liste**
```
Click "Fjern" på skilt
    ↓
Same flow som nedenfor
```

**Fjernelses-flow**:
```
Click "Marker som Fjernet"
    ↓
Modal:
├─ Tag foto af område (valgfrit)
├─ GPS position hentes
└─ [Bekræft Fjernelse]

Click "Bekræft"
    ↓
Status opdateres: "mounted" → "removed"
    ↓
Success: "Skilt markeret som fjernet! ✅"
```

**Database**:
```typescript
await supabase
  .from('signs')
  .update({
    status: 'removed',
    removed_at: new Date().toISOString(),
    removed_by: user.id,
    removed_latitude: gpsCoords.latitude,
    removed_longitude: gpsCoords.longitude,
  })
  .eq('id', signId)

// Hvis ALLE skilte i ansøgningen er fjernet,
// opdaterer trigger automatisk application status til "completed"!
```

#### 5.3 Kort opdateres

```
Marker ændrer farve på kort:
📍 Grøn (monteret) → 🔘 Grå (fjernet)

Click på grå pin:
├─ Status: Fjernet ✅
├─ Fjernet: 03.02.2025 10:15
├─ Af: Martin Jensen
└─ [Se Montering] [Se Fjernelse]
```

---

## 🗺️ Hvordan Kortet Fungerer - Teknisk

### Lag-struktur på kortet:

```
┌─────────────────────────────────────┐
│ LAYER 3: Vores Skilte (Markers)    │  ← VORES DATA (Supabase)
│ 📍📍📍                               │
├─────────────────────────────────────┤
│ LAYER 2: Vores Tegninger (Optional)│  ← VORES DATA (hvis vi vil)
│ [Byggeplads omrids]                 │
├─────────────────────────────────────┤
│ LAYER 1: Baggrundskort             │  ← Dataforsyningen/OSM (READ)
│ [Veje, bygninger, osv.]            │
└─────────────────────────────────────┘
```

### Eksempel - Leaflet Code:

```typescript
// 1. Baggrundskort (READ from Dataforsyningen/OSM)
const map = L.map('map').setView([55.6761, 12.5683], 13)

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap',
  maxZoom: 19,
}).addTo(map)

// 2. Hent VORES skilte fra Supabase (READ+WRITE)
const { data: signs } = await supabase
  .from('signs')
  .select('*')
  .eq('application_id', appId)

// 3. Tegn VORES markers OVENPÅ kortet
signs.forEach(sign => {
  const iconColor = {
    'not_mounted': 'yellow',   // Afventer montering
    'mounted': 'green',        // Monteret
    'removed': 'gray',         // Fjernet
  }[sign.status]

  const marker = L.marker([sign.latitude, sign.longitude], {
    icon: L.icon({
      iconUrl: `/markers/${iconColor}-pin.png`,
      iconSize: [32, 32],
    })
  })
  .bindPopup(`
    <b>${sign.sign_type}</b><br>
    Status: ${sign.status}<br>
    ${sign.status === 'mounted' ? `Monteret: ${sign.mounted_at}` : ''}
  `)
  .addTo(map)  // ← Tilføjes OVENPÅ baggrunden!
})

// 4. Real-time opdatering når data ændres
supabase
  .channel('signs-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'signs',
  }, (payload) => {
    // Opdater marker på kort
    updateMarker(payload.new)
  })
  .subscribe()
```

---

## 🎨 Data Flow Diagram

```
┌──────────────────────────────────────────────────┐
│           Dataforsyningen / OpenStreetMap        │
│                                                  │
│  📖 READ ONLY:                                   │
│  • Hent kort-tiles (baggrund)                   │
│  • Søg adresser (DAWA)                          │
│  • Geocode (adresse → GPS)                      │
│                                                  │
│  ❌ Vi skriver ALDRIG hertil!                    │
└──────────────────────────────────────────────────┘
                    │
                    │ API Calls (READ)
                    ▼
┌──────────────────────────────────────────────────┐
│              VejSkilt React Native App           │
│                                                  │
│  • Vis kort (baggrund fra DF/OSM)               │
│  • Tegn VORES markers ovenpå                    │
│  • Click på kort → gem GPS koordinater          │
│  • Upload fotos                                  │
│  • Scan QR koder                                 │
└──────────────────────────────────────────────────┘
                    │
                    │ READ + WRITE
                    ▼
┌──────────────────────────────────────────────────┐
│            Supabase Database (VORES!)            │
│                                                  │
│  📝 WRITE:                                       │
│  • Ansøgninger                                   │
│  • Skilte (med GPS koordinater)                 │
│  • Fotos                                         │
│  • Status-opdateringer                          │
│                                                  │
│  📖 READ:                                        │
│  • Hent ansøgninger                             │
│  • Hent skilte til kort                         │
│  • Historik og logs                             │
└──────────────────────────────────────────────────┘
```

---

## ✅ Opsummering

**Vi lægger IKKE data ind i Dataforsyningen** ❌
**Vi lægger vores EGNE markers ovenpå deres kort** ✅

**Det er som at**:
- Købe et verdenskort (Dataforsyningen) 🗺️
- Sætte klistermærker på hvor dine ting er (VejSkilt markers) 📍
- Du ændrer IKKE kortet - du bare markerer på det! ✨

**Alle brugertyper** (Entreprenør, Kommune, Politi) ser:
- Samme baggrundskort fra Dataforsyningen/OSM
- VORES skilte som markers ovenpå
- Real-time opdateringer når status ændres

**Simple, effektivt, og præcis sådan det skal være!** 🎉

---

**Giver det mening nu?** 😊

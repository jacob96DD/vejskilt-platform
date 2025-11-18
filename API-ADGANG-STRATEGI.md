# VejSkilt - API Adgang Strategi

## 🔍 Dit Spørgsmål: Hvordan Får Man Adgang Til Alle Skilte?

Du spurgte: **"Skal man filtrere på kommune eller postnummer eller får man bare alle?"**

Svaret afhænger af **HVEM der spørger** og **HVAD de har lov til at se**.

---

## 🎯 Tre Forskellige Adgangs-Scenarier

### 1️⃣ **Kommune Medarbejder** (København Kommune)

**Hvad de skal se**:
- ✅ ALLE skilte i DERES kommune (København)
- ❌ IKKE skilte fra andre kommuner (f.eks. Aarhus)

**API Query**:
```javascript
// Hent organisation ID for indlogget bruger
const { data: user } = await supabase.auth.getUser()
const { data: userData } = await supabase
  .from('users')
  .select('organization_id')
  .eq('id', user.id)
  .single()

// Hent ALLE ansøgninger for deres kommune
const { data: applications } = await supabase
  .from('applications')
  .select(`
    *,
    signs(*),
    organization:organizations(*)
  `)
  .eq('organization_id', userData.organization_id)  // ← Filter på deres kommune!
  .order('created_at', { ascending: false })

// Nu hent alle skilte fra disse ansøgninger
const allSigns = applications.flatMap(app => app.signs)
```

**Resultat**: Kun skilte fra København Kommune

---

### 2️⃣ **Politi Medarbejder** (København Politi)

**Hvad de skal se**:
- ✅ ALLE skilte i HELE deres politikreds
- ✅ Kan dække flere kommuner (f.eks. København + Frederiksberg)

**API Query**:
```javascript
// Politi har adgang via kommune-organisation (København Kommune)
const { data: user } = await supabase.auth.getUser()
const { data: userData } = await supabase
  .from('users')
  .select('organization_id')
  .eq('id', user.id)
  .single()

// Hent applications for deres område
const { data: applications } = await supabase
  .from('applications')
  .select(`
    *,
    signs(*)
  `)
  .eq('organization_id', userData.organization_id)
  .order('created_at', { ascending: false })

// Eller hvis politi skal se ALLE (hele landet) - fjern filter:
const { data: allApplications } = await supabase
  .from('applications')
  .select(`
    *,
    signs(*)
  `)
  .order('created_at', { ascending: false })
  // Ingen .eq() filter = ALLE ansøgninger i hele Danmark
```

**Resultat**: Alle skilte i deres område (eller hele landet hvis politiet har landsdækkende adgang)

---

### 3️⃣ **Entreprenør** (Byggefirma A/S)

**Hvad de skal se**:
- ✅ KUN deres EGNE ansøgninger
- ❌ IKKE andre entreprenørers ansøgninger

**API Query**:
```javascript
// Hent KUN deres egne applications
const { data: user } = await supabase.auth.getUser()
const { data: userData } = await supabase
  .from('users')
  .select('organization_id')
  .eq('id', user.id)
  .single()

const { data: myApplications } = await supabase
  .from('applications')
  .select(`
    *,
    signs(*)
  `)
  .eq('created_by', user.id)  // ← KUN deres egne!
  .order('created_at', { ascending: false })

// Eller filter på organisation
const { data: orgApplications } = await supabase
  .from('applications')
  .select(`
    *,
    signs(*)
  `)
  .eq('organization_id', userData.organization_id)
  .order('created_at', { ascending: false })
```

**Resultat**: Kun deres egne skilte

---

## 🔒 Row Level Security (RLS) i Supabase

### Sådan sikrer vi at brugere KUN ser hvad de må:

```sql
-- RLS Policy for Kommune: Kan se alle i deres område
CREATE POLICY "Kommune kan se egne applications"
ON applications
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE id = auth.uid()
  )
  AND
  (SELECT type FROM organizations WHERE id = organization_id) = 'kommune'
);

-- RLS Policy for Politi: Kan se ALLE applications
CREATE POLICY "Politi kan se alle applications"
ON applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role = 'politi'
  )
);

-- RLS Policy for Entreprenør: Kan KUN se egne
CREATE POLICY "Entreprenør kan se egne applications"
ON applications
FOR SELECT
USING (
  created_by = auth.uid()
  OR
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE id = auth.uid()
  )
);
```

**Med RLS**: Brugere kan IKKE snyde systemet - databasen selv sikrer adgang!

---

## 📍 Filter på Geografi (Postnummer, Koordinater)

### Hvis politi/kommune vil se skilte i et OMRÅDE:

```javascript
// Filter på postnummer (kræver postnummer i applications tabel)
const { data: applications } = await supabase
  .from('applications')
  .select(`
    *,
    signs(*)
  `)
  .like('address', '%1620%')  // ← Vesterbro postnummer

// Filter på GPS-koordinater (bounding box)
const { data: signs } = await supabase
  .from('signs')
  .select('*')
  .gte('latitude', 55.65)    // ← Syd for
  .lte('latitude', 55.70)    // ← Nord for
  .gte('longitude', 12.50)   // ← Vest for
  .lte('longitude', 12.60)   // ← Øst for

// Filter på afstand fra punkt (PostGIS)
const { data: nearbySigns } = await supabase
  .rpc('signs_within_radius', {
    target_lat: 55.6761,
    target_lon: 12.5683,
    radius_meters: 1000      // ← 1 km radius
  })
```

---

## 🗺️ Overblikskort - Hvad Vises?

### For **Kommune Medarbejder**:
```javascript
// På kortet: Alle skilte i DERES kommune
async function loadMapForKommune() {
  const { data: applications } = await supabase
    .from('applications')
    .select('*, signs(*)')
    .eq('organization_id', currentUser.organization_id)

  // Vis alle signs på kort
  const allSigns = applications.flatMap(app => app.signs)
  allSigns.forEach(sign => {
    L.marker([sign.latitude, sign.longitude])
      .addTo(map)
  })
}
```

### For **Politi**:
```javascript
// På kortet: ALLE skilte (hele landet eller deres politikreds)
async function loadMapForPoliti() {
  const { data: applications } = await supabase
    .from('applications')
    .select('*, signs(*)')
    // Ingen filter = ALLE

  const allSigns = applications.flatMap(app => app.signs)
  allSigns.forEach(sign => {
    L.marker([sign.latitude, sign.longitude])
      .addTo(map)
  })
}
```

### For **Entreprenør**:
```javascript
// På kortet: KUN deres egne skilte
async function loadMapForEntreprenor() {
  const { data: applications } = await supabase
    .from('applications')
    .select('*, signs(*)')
    .eq('created_by', currentUser.id)

  const allSigns = applications.flatMap(app => app.signs)
  allSigns.forEach(sign => {
    L.marker([sign.latitude, sign.longitude])
      .addTo(map)
  })
}
```

---

## 📊 Sammenfatning

| Brugertype | Hvad de ser | Filter |
|------------|-------------|--------|
| **Kommune** | Alle skilte i DERES kommune | `organization_id = deres_kommune` |
| **Politi** | Alle skilte i hele landet (eller politikreds) | Ingen filter ELLER `politikreds = deres_område` |
| **Entreprenør** | KUN deres egne skilte | `created_by = deres_user_id` |

---

## 🎯 Anbefaling til VejSkilt

### **Brug RLS + API Filter**:

1. ✅ **Row Level Security** sikrer at brugere ALDRIG kan snyde
2. ✅ **API Filter** gør queries hurtigere (mindre data)
3. ✅ **Frontend Filter** (knapper) lader brugere vælge hvad de vil se

**Eksempel på Frontend Filter**:
```javascript
// Bruger klikker "Vis kun godkendte"
function filterMap(status) {
  const filteredSigns = allSigns.filter(s => s.status === status)
  renderSignsOnMap(filteredSigns)
}

// Bruger klikker "Vis kun i København"
function filterByArea(postnummer) {
  const filteredApps = applications.filter(app =>
    app.address.includes(postnummer)
  )
  renderApplications(filteredApps)
}
```

---

## ✅ Svar På Dit Spørgsmål

**"Får man bare alle skilte eller skal man filtrere?"**

**Svar**:
- 🏛️ **Kommune**: Får ALLE i deres kommune (auto-filter via RLS)
- 👮 **Politi**: Får ALLE i hele landet (ingen filter)
- 🏗️ **Entreprenør**: Får KUN deres egne (auto-filter via RLS)

**På overblikskortet**:
- Appen henter data baseret på brugerens rolle
- Frontend kan tilføje ekstra filter (status, område, datoer)
- Men databasen sikrer ALTID at brugeren kun får data de må se!

**Status**: ✅ Klar til implementation i Supabase
**Dato**: 2025-11-15

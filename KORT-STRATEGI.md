# VejSkilt - Kort Strategi

## 🗺️ To Forskellige Kort-Løsninger

Vi bruger **to forskellige kort-systemer** til forskellige formål:

---

## 1️⃣ OpenStreetMap (til Ansøgninger)

**Bruges til**: Oprettelse af nye ansøgninger og placering af skilte

**Hvorfor?**
- ✅ **Simpelt**: Ingen API key eller token nødvendig
- ✅ **Stabilt**: Fungerer altid, ingen CORS problemer
- ✅ **God nok**: Til at klikke og placere skilte er OSM perfekt
- ✅ **Gratis**: Ubegrænset brug

**Implementering**:
```javascript
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Klik på kort for at placere skilt
map.on('click', (e) => {
  addSignToMap(e.latlng);
});
```

**Brugt i**:
- `mvp-demo/index.html` → "Ny Ansøgning" view

---

## 2️⃣ Dataforsyningen (til Overblik)

**Bruges til**: Overblikskort der viser ALLE skilte fra databasen

**Hvorfor?**
- ✅ **Dansk kort**: Danmarks officielle kort-data
- ✅ **Bedre kvalitet**: Mere præcise danske veje, adresser, matrikel
- ✅ **Professionelt**: Ser mere officielt ud for Kommune/Politi
- ✅ **Gratis for offentlig brug**: Med API token

**Implementering**:
```javascript
const DATAFORSYNINGEN_TOKEN = 'f39755a4ac7c0723e2bafe2fffcf1617';

L.tileLayer(
  'https://api.dataforsyningen.dk/topo_skaermkort_daempet/{z}/{x}/{y}.png?token=' + DATAFORSYNINGEN_TOKEN,
  {
    attribution: '© Dataforsyningen',
    maxZoom: 20,
    minZoom: 7
  }
).addTo(map);
```

**Brugt i**:
- `mvp-demo/oversigt-kort.html` → Dedikeret overblikskort
- Fremtidig React Native app → "Se Alle Skilte" view

---

## 📊 Feature Matrix

| Feature | OpenStreetMap | Dataforsyningen |
|---------|---------------|-----------------|
| **Bruges til** | Opret ansøgning | Overblik af alle skilte |
| **API Key** | ❌ Ikke nødvendig | ✅ Token: f397... |
| **Dansk fokus** | ❌ Global | ✅ Dansk optimeret |
| **Klik-interaktion** | ✅ Perfekt | ✅ Perfekt |
| **Offline mode** | ⚠️ Begrænset caching | ⚠️ Begrænset caching |
| **Zoom niveau** | 1-19 | 7-20 |
| **Korttype** | Standard verdenskort | Topografisk/Skærmkort |

---

## 🎯 Hvornår Bruger Vi Hvilket Kort?

### Use Case 1: Entreprenør opretter ansøgning
```
Bruger: Entreprenør (mobil app eller web)
Kort: OpenStreetMap
Hvorfor: Simpelt, hurtigt, klik-til-placering
```

### Use Case 2: Kommune ser alle skilte i område
```
Bruger: Kommune medarbejder (desktop)
Kort: Dataforsyningen
Hvorfor: Professionelt dansk kort, bedre oversigt
```

### Use Case 3: Entreprenør scanner QR og ser skilt-lokation
```
Bruger: Entreprenør (mobil app)
Kort: OpenStreetMap ELLER Dataforsyningen
Hvorfor: Kan være hvilket som helst, afhænger af præference
```

### Use Case 4: Politi ser aktive skilte på rute
```
Bruger: Politi (tablet/mobil)
Kort: Dataforsyningen
Hvorfor: Bedre vej-detaljer, mere præcist
```

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────────┐
│         SUPABASE DATABASE                    │
│                                              │
│  signs table:                                │
│  • id                                        │
│  • lat, lon (koordinater)                   │
│  • type, status                             │
│  • qr_code                                   │
└──────────────┬──────────────────────────────┘
               │
               │ (Hent skilte-data)
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
┌──────────────┐  ┌──────────────────┐
│ OpenStreetMap│  │ Dataforsyningen  │
│              │  │                  │
│ Baggrund     │  │ Baggrund         │
│ (tiles)      │  │ (tiles)          │
└──────┬───────┘  └────────┬─────────┘
       │                   │
       │ + Overlay         │ + Overlay
       │   (vores markers) │   (vores markers)
       │                   │
       ▼                   ▼
┌──────────────┐  ┌──────────────────┐
│ Opret View   │  │ Overblik View    │
│              │  │                  │
│ Klik for at  │  │ Se alle skilte   │
│ placere      │  │ med filter       │
└──────────────┘  └──────────────────┘
```

**Vigtig pointe**:
- **Kort-baggrund**: Kommer fra OpenStreetMap ELLER Dataforsyningen (READ-ONLY)
- **Skilt-markører**: Kommer fra VORES Supabase database (READ + WRITE)
- **Resultat**: Vi overlayer vores data på deres kort

---

## 💡 Fremtidig Optimization

### Phase 1 (MVP - NU):
- ✅ OpenStreetMap til ansøgninger
- ✅ Dataforsyningen til overblik
- ✅ LocalStorage (demo)

### Phase 2 (Real App):
- ✅ Supabase database integration
- ✅ Real-time updates (nye skilte vises automatisk)
- ✅ Clustering (grupér tætte markers)

### Phase 3 (Advanced):
- 🔄 Offline maps (gem tiles lokalt)
- 🔄 Rute-planling (politi/montør)
- 🔄 Heatmap view (se koncentrationer)
- 🔄 Historik (se ændringer over tid)

---

## 🔑 API Tokens

### Dataforsyningen Token
```
Token: f39755a4ac7c0723e2bafe2fffcf1617
Type: READ-ONLY
Bruger: Hent kort-tiles (baggrund)
Gratis: Ja (for offentlig brug)
Dokumentation: https://dawadocs.dataforsyningen.dk/
```

### OpenStreetMap
```
Token: INGEN nødvendig
Type: FREE for all
Attribution: Skal vise "© OpenStreetMap contributors"
Dokumentation: https://www.openstreetmap.org/copyright
```

---

## 📱 Implementation i React Native

Når I bygger den rigtige app:

```typescript
// components/Map.tsx
import { Platform } from 'react-native';

export function Map({ mapType = 'osm', signs = [] }) {
  const tileUrl = mapType === 'dataforsyningen'
    ? `https://api.dataforsyningen.dk/topo_skaermkort_daempet/{z}/{x}/{y}.png?token=${DATAFORSYNINGEN_TOKEN}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  if (Platform.OS === 'web') {
    // Brug Leaflet på web
    return <LeafletMap tileUrl={tileUrl} signs={signs} />;
  } else {
    // Brug react-native-maps på mobil
    return <NativeMap tileUrl={tileUrl} signs={signs} />;
  }
}

// Brug:
// <Map mapType="osm" /> → Til ansøgninger
// <Map mapType="dataforsyningen" /> → Til overblik
```

---

## ✅ Konklusion

**SMART STRATEGI**:
1. Brug OpenStreetMap til **interaktive features** (klik, placer skilte)
2. Brug Dataforsyningen til **visning og overblik** (se alle skilte)
3. Gem alt data i **Supabase** (vores database)
4. Overlay vores markers på deres kort-baggrund

Dette giver:
- ✅ Bedste af begge verdener
- ✅ Dansk profesionelt kort hvor det giver mening
- ✅ Simpelt og stabilt hvor vi skal interagere
- ✅ Gratis for begge løsninger

**Status**: ✅ Implementeret i MVP Demo
**Næste**: Integration med Supabase i rigtig app

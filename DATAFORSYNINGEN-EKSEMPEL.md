# Dataforsyningen API - Hvad Modtager Man?

## 🗺️ Kort Sagt: PNG Billeder (Tiles)

Dataforsyningen API'et leverer **kort-billeder** (tiles), IKKE data!

---

## 📡 Eksempel Request

Når Leaflet henter kort for København centrum på zoom niveau 13:

```
GET https://api.dataforsyningen.dk/topo_skaermkort_daempet/13/4408/2720.png?token=f39755a4ac7c0723e2bafe2fffcf1617

Forklaring af URL:
https://api.dataforsyningen.dk/   ← API endpoint
topo_skaermkort_daempet/          ← Korttype (dæmpet topografisk kort)
13/                               ← Zoom niveau (7-20)
4408/                             ← X koordinat (tile column)
2720.png                          ← Y koordinat (tile row) + format
?token=f39755a4...                ← Din API nøgle
```

---

## 📦 Response Fra Dataforsyningen

### Content-Type:
```
Content-Type: image/png
```

### Body:
```
[BINARY PNG IMAGE DATA]
```

**Det er et BILLEDE** - ikke JSON, ikke XML, ikke data!

### Billede Størrelse:
- 256x256 pixels (standard tile størrelse)
- Typisk 20-50 KB per tile
- PNG format med alpha channel

---

## 🖼️ Hvad Billedet Viser

Et typisk tile fra Dataforsyningen viser:

```
┌─────────────────────────────┐
│  [Vejnavne]                 │
│  [Bygninger - grå polygoner]│
│  [Veje - gule/hvide linjer] │
│  [Parker - grønne områder]  │
│  [Vand - blå områder]       │
│  [Matrikelskel - stiplede]  │
└─────────────────────────────┘
```

**Det indeholder IKKE**:
- ❌ Vejskilte
- ❌ Trafiksignaler
- ❌ Hastighedsbegrænsninger
- ❌ Dynamisk data
- ❌ Nogen form for "features" du kan query

---

## 🔢 Hvordan Tiles Fungerer

### Zoom Niveau System:

```
Zoom 0:  Hele verden på én tile (256x256px)
Zoom 7:  Danmark fylder ~10 tiles
Zoom 13: København centrum = mange tiles
Zoom 20: Ekstrem zoom (enkelte bygninger)
```

### Tile Grid System (Slippy Map):

```
For et givet center-punkt (lat, lon) og zoom:

1. Leaflet beregner hvilke tiles der skal vises:
   lat: 55.6761, lon: 12.5683, zoom: 13

2. Konverterer til tile koordinater:
   x = floor((lon + 180) / 360 * 2^zoom)
   y = floor((1 - ln(tan(lat) + sec(lat)) / π) / 2 * 2^zoom)

3. Resulterer i tile koordinater:
   x: 4408
   y: 2720

4. Laver HTTP request for hver tile:
   GET .../13/4408/2720.png
   GET .../13/4409/2720.png
   GET .../13/4408/2721.png
   ... (typisk 6-12 tiles synlige)
```

---

## 📊 Eksempel: Hvad Browseren Henter

Når du åbner overblikskortet med København centrum:

```javascript
// Leaflet initialisering
const map = L.map('map').setView([55.6761, 12.5683], 13)

// Browser laver MULTIPLE requests:
```

**Network Requests** (synligt i DevTools):
```
GET https://api.dataforsyningen.dk/topo_skaermkort_daempet/13/4407/2719.png?token=...
GET https://api.dataforsyningen.dk/topo_skaermkort_daempet/13/4408/2719.png?token=...
GET https://api.dataforsyningen.dk/topo_skaermkort_daempet/13/4409/2719.png?token=...
GET https://api.dataforsyningen.dk/topo_skaermkort_daempet/13/4407/2720.png?token=...
GET https://api.dataforsyningen.dk/topo_skaermkort_daempet/13/4408/2720.png?token=...
GET https://api.dataforsyningen.dk/topo_skaermkort_daempet/13/4409/2720.png?token=...
GET https://api.dataforsyningen.dk/topo_skaermkort_daempet/13/4407/2721.png?token=...
GET https://api.dataforsyningen.dk/topo_skaermkort_daempet/13/4408/2721.png?token=...
GET https://api.dataforsyningen.dk/topo_skaermkort_daempet/13/4409/2721.png?token=...
```

Hver request returnerer et **256x256px PNG billede**.

---

## 🎨 Forskellige Korttyper Fra Dataforsyningen

### 1. Topografisk Skærmkort (Dæmpet) - DET VI BRUGER
```
https://api.dataforsyningen.dk/topo_skaermkort_daempet/{z}/{x}/{y}.png?token=...
```
**Viser**: Veje, bygninger, navne (dæmpede farver)

### 2. Topografisk Skærmkort (Normal)
```
https://api.dataforsyningen.dk/topo_skaermkort/{z}/{x}/{y}.png?token=...
```
**Viser**: Samme som dæmpet, men kraftigere farver

### 3. Ortofoto (Luftfoto)
```
https://api.dataforsyningen.dk/orto_foraar/{z}/{x}/{y}.png?token=...
```
**Viser**: Satellit/luftfotos af Danmark

### 4. Matrikelkort
```
https://api.dataforsyningen.dk/mat/{z}/{x}/{y}.png?token=...
```
**Viser**: Matrikelskel, ejendomsgrænser

---

## 🚫 Hvad Dataforsyningen IKKE Leverer

### ❌ GeoJSON Features:
```javascript
// Dette virker IKKE med Dataforsyningen tiles:
const response = await fetch('https://api.dataforsyningen.dk/...')
const geojson = await response.json() // ❌ Fejl! Det er et billede!
```

### ❌ Vector Tiles:
Dataforsyningen leverer raster tiles (PNG), ikke vector tiles (MVT/PBF)

### ❌ Queryable Data:
Du kan IKKE spørge:
- "Giv mig alle veje i dette område"
- "Hvad er adressen på dette punkt?"
- "Vis mig alle bygninger her"

**For det skal du bruge DAWA API** (Danmarks Adressers Web API):
```javascript
// Eksempel: Find adresse
const response = await fetch('https://api.dataforsyningen.dk/adresser?x=12.5683&y=55.6761')
const data = await response.json()
// Dette returnerer JSON med adresse-data
```

---

## ✅ Konklusion

### Hvad Du Modtager Fra Dataforsyningen:

| Request Type | Response Format | Indhold |
|--------------|----------------|---------|
| **Tiles** (som vi bruger) | PNG billede | Kort-billede 256x256px |
| **DAWA API** | JSON | Adresse, veje, bygnings-data |
| **GeoDanmark** | GeoJSON/GML | Vector geografisk data |

### For VejSkilt:

```javascript
// Dataforsyningen = Baggrundskort (PNG billeder)
L.tileLayer('https://api.dataforsyningen.dk/.../topo_skaermkort_daempet/{z}/{x}/{y}.png?token=...')

// VejSkilt Data = Dine skilte (JSON fra Supabase)
const { data: signs } = await supabase.from('signs').select('*')
// [{ lat: 55.6761, lng: 12.5683, type: 'Vejarbejde', ... }]

// Kombiner dem i browseren
signs.forEach(sign => {
  L.marker([sign.lat, sign.lng]).addTo(map)
})
```

---

## 🔍 Se Det Selv

Åbn **Developer Tools** (F12) i browseren når kortet loader:

1. Gå til **Network** tab
2. Filter på "png"
3. Se alle tile-requests til Dataforsyningen
4. Klik på en request → **Preview** tab → Se kort-billedet!

**Status**: ✅ Nu bruger overblikskortet Dataforsyningen GIS
**Dato**: 2025-11-15

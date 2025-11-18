# GIS & Kort Integration - VejSkilt Platform

## Executive Summary

✅ **GRATIS LØSNING FUNDET**: Danmarks officielle kortdata via Dataforsyningen er **fuldstændig gratis** at bruge!

**Anbefaling**: Brug **Dataforsyningen OKAPI** som primær kortløsning for VejSkilt platformen.

---

## Løsning: Dataforsyningen (Klimadatastyrelsen)

### Hvad er det?
**Dataforsyningen** (tidligere Kortforsyningen) er Danmarks officielle kilde til geografiske data, drevet af Klimadatastyrelsen (tidligere Styrelsen for Dataforsyning og Infrastruktur).

### Pris & Licens
- **100% GRATIS** 🎉
- Både brugerkonto og API token er gratis
- Licens: **CC BY 4.0** (Creative Commons)
  - Må bruges til kommercielt brug
  - Må bruges af offentlige myndigheder
  - Må bruges af private firmaer
  - Ingen brugsafgifter
- Kun krav: Attribution (kreditering af Klimadatastyrelsen)

### Hvad får vi adgang til?
- **Baggrundskort** i høj kvalitet:
  - Topografisk kort (vejnavne, bygninger, etc.)
  - Ortofoto (luftfotos)
  - Matrikelkort
  - Naturkort
  - Forvaltningskort
- **Adressedata** via DAWA API (Danmarks Adressers Web API)
- **Kommunegrænser**
- **Vejdata**
- **WMS/WMTS services** (standardiserede kort-tjenester)

---

## Teknisk Løsning: OKAPI

### Hvad er OKAPI?
**OKAPI** (Offentlig Kort API) er et open source JavaScript bibliotek udviklet af Dataforsyningen specifikt til at integrere danske kort i web-applikationer.

- **GitHub**: https://github.com/SDFIdk/okapi
- **Licens**: MIT (fuldstændig fri at bruge)
- **Baseret på**: OpenLayers (moderne, kraftfuld GIS framework)

### Features
✅ Flere korttyper (topografisk, luftfoto, forvaltning, etc.)
✅ Marker/pins til at vise skilte
✅ Popups med information
✅ Custom marker icons
✅ Zoom og pan
✅ "Find min lokation" knap
✅ Layer switcher (skift mellem korttyper)
✅ Responsivt design
✅ TypeScript support muligt
✅ Event handlers (click, hover, etc.)

---

## Implementation Guide

### 1. Opret Dataforsyningen Konto

**Trin**:
1. Gå til https://dataforsyningen.dk/
2. Klik "Opret bruger" (gratis)
3. Udfyld formular med:
   - Navn
   - Email
   - Organisation (kommunens navn)
   - Formål (f.eks. "Digital vejskilt administration")
4. Bekræft email
5. Log ind og generér **token** under "Mine tokens"

**Vigtig note**: Hver bruger/organisation skal have sin egen konto og token.

---

### 2. Installation i Next.js (Web Platform)

#### A. NPM Installation
```bash
npm install @dataforsyningen/okapi --save
```

#### B. Basic Setup

**1. Create map component** (`components/Map.tsx`):
```typescript
'use client'
import { useEffect, useRef } from 'react'
import '@dataforsyningen/okapi/dist/okapi.min.css'

interface MapProps {
  token: string
  markers?: Array<{
    id: string
    lat: number
    lon: number
    title: string
    description?: string
    type?: string
  }>
  onMarkerClick?: (markerId: string) => void
}

export default function Map({ token, markers = [], onMarkerClick }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Dynamisk import for at undgå SSR issues
    import('@dataforsyningen/okapi').then(({ Initialize }) => {
      mapInstanceRef.current = new Initialize({
        target: mapRef.current!,
        token: token,
        zoom: 'auto',
        center: 'auto',
        background: 'dtk_skaermkort', // Standard topografisk kort
        zoomSlider: true,
        layerSwitcher: true,
        myLocation: true,
        showPopup: true,
      })

      // Event handler for marker clicks
      if (onMarkerClick) {
        mapInstanceRef.current.addOnFeatureClickFunction((feature: any) => {
          const markerId = feature.get('id')
          if (markerId) onMarkerClick(markerId)
        })
      }
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy?.()
      }
    }
  }, [token])

  // Update markers når de ændres
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.refresh()
    }
  }, [markers])

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }}>
        {markers.map((marker) => (
          <span
            key={marker.id}
            className="geomarker"
            data-type={marker.type || 'default'}
            data-title={marker.title}
            data-description={marker.description || ''}
            data-lat={marker.lat}
            data-lon={marker.lon}
            data-id={marker.id}
          />
        ))}
      </div>
    </div>
  )
}
```

**2. Use in page** (`app/kort/page.tsx`):
```typescript
import Map from '@/components/Map'

export default function KortPage() {
  const markers = [
    {
      id: 'sign-1',
      lat: 55.6761,
      lon: 12.5683,
      title: 'Hastighedsbegrænsning 40',
      description: 'Status: Monteret',
      type: 'mounted'
    }
  ]

  return (
    <div>
      <h1>Skilte-oversigt</h1>
      <Map
        token={process.env.NEXT_PUBLIC_DATAFORSYNINGEN_TOKEN!}
        markers={markers}
        onMarkerClick={(id) => console.log('Clicked:', id)}
      />
    </div>
  )
}
```

**3. Environment variable** (`.env.local`):
```
NEXT_PUBLIC_DATAFORSYNINGEN_TOKEN=your_token_here
```

---

### 3. Custom Marker Icons

For at vise forskellige ikoner for forskellige skilt-statusser:

```typescript
import '@dataforsyningen/okapi'

const mapInstance = new Initialize({
  target: mapRef.current!,
  token: token,
  markerIcon: {
    'pending': '/icons/marker-pending.svg',
    'approved': '/icons/marker-approved.svg',
    'mounted': '/icons/marker-mounted.svg',
    'removed': '/icons/marker-removed.svg',
  },
  // ... andre options
})
```

---

### 4. Integration med Supabase

**Eksempel: Hent skilte og vis på kort**

```typescript
'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Map from '@/components/Map'

export default function SignMapPage() {
  const [signs, setSigns] = useState([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchSigns() {
      const { data, error } = await supabase
        .from('signs')
        .select(`
          id,
          latitude,
          longitude,
          sign_type,
          status,
          applications (
            address,
            created_at
          )
        `)
        .eq('status', 'mounted')

      if (data) {
        const markers = data.map(sign => ({
          id: sign.id,
          lat: sign.latitude,
          lon: sign.longitude,
          title: `${sign.sign_type}`,
          description: `Status: ${sign.status}\nAdresse: ${sign.applications.address}`,
          type: sign.status
        }))
        setSigns(markers)
      }
    }

    fetchSigns()

    // Real-time subscription
    const channel = supabase
      .channel('signs-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'signs' },
        () => fetchSigns()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <Map
      token={process.env.NEXT_PUBLIC_DATAFORSYNINGEN_TOKEN!}
      markers={signs}
      onMarkerClick={(id) => {
        // Åbn detail-view eller sidebar
        router.push(`/skilte/${id}`)
      }}
    />
  )
}
```

---

### 5. React Native Implementation

For mobil app kan vi **ikke** bruge OKAPI direkt. I stedet bruger vi:

**Option A: react-native-maps + Custom Tile Server**

```bash
npm install react-native-maps
```

```typescript
import MapView, { Marker, UrlTile } from 'react-native-maps'

export default function MapScreen() {
  return (
    <MapView
      initialRegion={{
        latitude: 55.6761,
        longitude: 12.5683,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
      {/* Dataforsyningen WMTS tiles */}
      <UrlTile
        urlTemplate={`https://services.datafordeler.dk/DKskaermkort/topo_skaermkort/1.0.0/wmts?token=${token}&layer=dtk_skaermkort&style=default&tilematrixset=View1&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix={z}&TileCol={x}&TileRow={y}`}
        maximumZ={13}
        flipY={false}
      />

      {/* Markers for signs */}
      <Marker
        coordinate={{ latitude: 55.6761, longitude: 12.5683 }}
        title="Hastighedsbegrænsning 40"
        description="Status: Monteret"
      />
    </MapView>
  )
}
```

**Option B: OpenStreetMap (Backup)**

Hvis Dataforsyningen tiles ikke virker optimalt på mobil:

```typescript
<MapView
  initialRegion={{...}}
>
  <UrlTile
    urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    maximumZ={19}
  />
</MapView>
```

---

## DAWA API - Adresser & Geocoding

**DAWA** (Danmarks Adressers Web API) giver gratis adgang til:
- Alle adresser i Danmark
- Reverse geocoding (koordinat → adresse)
- Forward geocoding (adresse → koordinat)
- Autocomplete for adresser

### Eksempel: Adresse Search

```typescript
async function searchAddress(query: string) {
  const response = await fetch(
    `https://api.dataforsyningen.dk/adresser/autocomplete?q=${encodeURIComponent(query)}`
  )
  const data = await response.json()
  return data.map((item: any) => ({
    address: item.tekst,
    lat: item.adresse.y,
    lon: item.adresse.x
  }))
}
```

### Eksempel: Reverse Geocoding

```typescript
async function getAddressFromCoords(lat: number, lon: number) {
  const response = await fetch(
    `https://api.dataforsyningen.dk/adresser/reverse?x=${lon}&y=${lat}`
  )
  const data = await response.json()
  return data.adressebetegnelse // "Vesterbrogade 10, 1620 København V"
}
```

**VIGTIGT**: DAWA lukker **1. juli 2026**! Efter denne dato skal vi migrere til ny API (Datafordeler). Men til MVP er DAWA perfekt.

---

## Alternative Løsninger

### 1. OpenStreetMap + Leaflet ⭐ **ANBEFALET TIL START**
**Perfekt fallback og muligvis den bedste løsning til MVP:**

- **Pris**: 100% gratis, ingen token nødvendig
- **Data**: Global kortdata med god dækning i Danmark
- **Library**: Leaflet (meget stabil og populær)

```bash
npm install react-leaflet leaflet
```

**Fordele**:
- ✅ Meget simpel at bruge
- ✅ Ingen token-problemer eller CORS issues
- ✅ Stor community og god dokumentation
- ✅ Virker identisk på web og mobil
- ✅ Garanteret stabilitet
- ✅ Se `gis-demo-simple.html` for fungerende demo!

**Ulemper**:
- Mindre detaljeret end danske officielle kort
- Ingen specifik dansk data (matrikel, forvaltning, etc.)

**VIGTIGT**: For VejSkilt's use case (vise placering af skilte) er OpenStreetMap **mere end tilstrækkeligt**. Vi behøver ikke matrikelkort eller forvaltningskort - kun vejnavne og bygninger, som OSM har perfekt!

### 2. Google Maps Platform
**Kun hvis absolut nødvendigt** (koster penge):

- **Pris**: $200 gratis credit/måned, derefter $7 per 1.000 map loads
- **Estimat for MVP**: Hvis 500 brugere ser kort dagligt = $300-500/måned

❌ **Ikke anbefalet** da Dataforsyningen er gratis og lige så god.

---

## Anbefalet Arkitektur (OPDATERET)

### MVP Anbefaling: OpenStreetMap + Leaflet

```
┌─────────────────────────────────────────────────┐
│         OpenStreetMap Tiles (GRATIS)            │
│         https://tile.openstreetmap.org          │
│                                                 │
│         + DAWA API (Dataforsyningen)            │
│         (Adresser/Geocode - GRATIS)             │
└─────────────────────────────────────────────────┘
            │                    │
            │ No Auth!           │ No Auth!
            │ (100% gratis)      │ (100% gratis)
            │                    │
┌───────────▼────────────────────▼─────────────────┐
│                                                   │
│            VejSkilt Platform                      │
│                                                   │
│  Web (Next.js)          Mobil (React Native)     │
│  - Leaflet              - react-native-maps      │
│  - OSM Tiles            - OSM Tiles              │
│  - Markers              - GPS                    │
│  - Filters              - QR scanner overlay     │
│  - Popups               - Clustering             │
│                                                   │
│              Backend: Supabase                    │
│              (sign data, GPS coords)              │
└───────────────────────────────────────────────────┘
```

**Hvorfor denne ændring?**
- ✅ **Ingen token-problemer**: OSM kræver ingen authentication
- ✅ **Ingen CORS-problemer**: OSM tiles er public
- ✅ **Lige så godt til formålet**: Vi skal bare vise skilte-placeringer
- ✅ **Bevist fungerende**: Se `gis-demo-simple.html`
- ✅ **Hurtigere udvikling**: Mindre kompleksitet
- 💰 **Stadig 100% gratis**: Ingen omkostninger

**Dataforsyningen kan stadig bruges til**:
- DAWA API for adresse-autocomplete (virker fint!)
- Kan tilføjes senere hvis specifikt danske kort ønskes

---

## Action Items - Setup

### Før udvikling starter:
- [ ] Opret konto på Dataforsyningen.dk
- [ ] Generér API token
- [ ] Test token med OKAPI eksempel
- [ ] Gem token i .env.local (NEXT_PUBLIC_DATAFORSYNINGEN_TOKEN)
- [ ] Test marker-funktionalitet
- [ ] Test på mobil device (responsive)

### Til produktion:
- [ ] Opret production token (separat fra dev)
- [ ] Dokumentér token i deployment guide
- [ ] Test performance med 1.000+ markers
- [ ] Implementér marker clustering (hvis nødvendigt)
- [ ] Cache strategy for kort-tiles
- [ ] Error handling hvis Dataforsyningen er nede

---

## Dokumentation Links

### Officielle Ressourcer
- **Dataforsyningen**: https://dataforsyningen.dk/
- **OKAPI GitHub**: https://github.com/SDFIdk/okapi
- **OKAPI Demos**: https://sdfidk.github.io/okapi/
- **DAWA Docs**: https://dawadocs.dataforsyningen.dk/ (lukker juli 2026)
- **API Reference**: https://confluence.sdfi.dk/display/MYD/WMTS

### Community & Support
- **Support email**: dataforsyningen@sdfi.dk
- **GitHub Issues**: https://github.com/SDFIdk/okapi/issues

---

## Konklusion

✅ **Vi har en 100% gratis, dansk, højkvalitets GIS-løsning!**

**Anbefaling**:
1. Brug **OKAPI** til web platform (Next.js)
2. Brug **react-native-maps + WMTS tiles** til mobil app
3. Brug **DAWA API** til adresse-søgning og geocoding (indtil juli 2026)

**Ingen licensomkostninger. Ingen usage limits. Perfekt til projektet!** 🎉

---

**Oprettet**: 2025-11-14
**Status**: Ready for implementation

# Dataforsyningen - Adgang og Rettigheder

## 🔑 Hvad Er Dataforsyningen?

**Dataforsyningen** er Danmarks officielle platform for distribution af offentlige geodata og kort.

**Website**: https://dataforsyningen.dk/
**Dit Token**: `f39755a4ac7c0723e2bafe2fffcf1617`

---

## ✅ Hvad Kan Du Med Din Token?

### **READ-ONLY Adgang** 📖

Dit token giver dig **læse-adgang** til:

1. **Kort-tiles** (baggrundskort)
   - Topografisk kort
   - Skærmkort
   - Ortofoto (luftfotos)
   - Matrikelkort

2. **Geodata via API**
   - DAWA (Danmarks Adresser Web API)
   - GeoDanmark data
   - Kommunegrænser, regioner, etc.

**Eksempel på brug**:
```javascript
// Hent kort-tiles (baggrund)
const tileUrl = 'https://api.dataforsyningen.dk/topo_skaermkort_daempet/{z}/{x}/{y}.png?token=' + token

L.tileLayer(tileUrl).addTo(map)
```

---

## ❌ Hvad Kan Du IKKE?

### **INGEN Skrive-Adgang** 🚫

Du kan **IKKE**:
- ❌ Skrive data tilbage til Dataforsyningen
- ❌ Oprette nye features på kortet
- ❌ Redigere eksisterende geodata
- ❌ Slette eller modificere kort-data

**Hvorfor?**

Dataforsyningen er et **data-distributions-system**, ikke et data-indtastnings-system.

Kun **offentlige myndigheder** (kommuner, regioner, ministerier) kan bidrage med data til Dataforsyningen gennem særlige indberetningssystemer - IKKE via API tokens.

---

## 🗺️ Sådan Bruger VejSkilt Systemet

### **Smart Lagdeling**:

```
┌─────────────────────────────────┐
│  BRUGER SER DETTE:              │
│                                  │
│  [Vejskilte markers]            │  ← Vores data fra Supabase
│         ↓                        │     (READ + WRITE)
│  [Danmarks kort]                │  ← Dataforsyningen tiles
│                                  │     (READ only)
└─────────────────────────────────┘
```

### **To Separate Systemer**:

1. **Dataforsyningen** (læs kun):
   - Leverer baggrundskort (tiles)
   - Viser veje, bygninger, matrikel
   - Statiske data fra offentlige registre

2. **Supabase** (læs + skriv):
   - Gemmer VORES vejskilt-data
   - Ansøgninger, skilte, QR koder, fotos
   - Bruger-data, organisationer, historik

---

## 📚 Kilder og Dokumentation

### Baseret på web-research:

1. **Dataforsyningen Formål**:
   - "Datafordeleren giver nem og sikker adgang til **frie og sammenhængende grunddata** fra offentlige registre"
   - Fokus på **distribution** af data, ikke indsamling

2. **Gratis for Offentlige Myndigheder**:
   - BBR data via Dataforsyningen er gratis for offentlige myndigheder
   - Private virksomheder får også læse-adgang via tokens

3. **GeoDanmark - Frie Grunddata**:
   - GeoDanmark data har siden 2013 været "frie grunddata"
   - Data er frit tilgængeligt for **både offentlige og private**
   - Via Styrelsen for Dataforsyning og Effektiviserings Kortforsyning

### Relevante Links:

- **Dataforsyningen hovedside**: https://dataforsyningen.dk/
- **DAWA Dokumentation**: https://dawadocs.dataforsyningen.dk/ (kræver VPN/whitelisting)
- **Digitaliseringsstyrelsen - Videreanvendelse af offentlige data**: https://digst.dk/data/videreanvendelse-af-offentlige-data/

---

## ⚖️ Licens

**CC BY 4.0** (Creative Commons Attribution 4.0)

Du må frit:
- ✅ Bruge data kommercielt
- ✅ Bearbejde og videreformidle
- ✅ Integrere i egne systemer

Men du skal:
- ✅ Angive kilde: "© Styrelsen for Dataforsyning og Infrastruktur"
- ✅ Linke til licensen

---

## 💡 Konklusion for VejSkilt

### ✅ Vores Setup Er Korrekt:

```javascript
// 1. Baggrundskort fra Dataforsyningen (READ-ONLY)
const background = L.tileLayer(
  'https://api.dataforsyningen.dk/topo_skaermkort_daempet/{z}/{x}/{y}.png?token=' + token
).addTo(map)

// 2. Vores skilte-data fra Supabase (READ + WRITE)
const { data: signs } = await supabase
  .from('signs')
  .select('*')

// 3. Overlay skilte på kortet
signs.forEach(sign => {
  L.marker([sign.lat, sign.lon])
    .bindPopup(sign.type)
    .addTo(map)  // Tilføjer OVENPÅ baggrunden
})
```

### 🎯 Hvad Det Betyder:

- ✅ **Dataforsyningen**: Leverer professionelt dansk baggrundskort (gratis)
- ✅ **Supabase**: Gemmer ALLE vores skilte-data (fuld kontrol)
- ✅ **Leaflet**: Kombinerer de to lag til én interaktiv app

**Resultat**: Bedste af begge verdener - professionelt kort + fuld kontrol over vores data!

---

**Status**: ✅ Bekræftet - Dataforsyningen er READ-ONLY for eksterne brugere
**Dato**: 2025-11-15
**Kilde**: Web research + Dataforsyningen dokumentation

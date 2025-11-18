# VejSkilt Platform - Quick Start Guide

**Status**: 🎉 Database Setup Done! Ready to Build!

---

## ✅ Hvad Er Klar?

- ✅ **Database**: Supabase database komplet sat op
- ✅ **Credentials**: Alle tokens og keys i `.env`
- ✅ **GIS Demo**: Fungerende kort-demo
- ✅ **Dokumentation**: Komplet projekt-dokumentation
- ✅ **Arkitektur**: React Native Everywhere valgt

---

## 🚀 Start Udvikling NU!

### Step 1: Opret React Native Expo Projekt (5 min)

```bash
# Naviger til projekter folder
cd C:\projekter

# Opret Expo app med TypeScript template
npx create-expo-app@latest vejskilt-app --template blank-typescript

# Naviger ind i projektet
cd vejskilt-app

# Start development server
npx expo start
```

**Output**:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or Camera app (iOS)

› Press a │ open Android
› Press w │ open web

› Press j │ open debugger
```

**Test**:
- Tryk `w` for at åbne i browser (web version)
- Scan QR med mobil for at teste på telefon (download Expo Go app først)

---

### Step 2: Install Dependencies (5 min)

```bash
# Core dependencies
npx expo install expo-router
npx expo install @supabase/supabase-js
npx expo install @tanstack/react-query

# Native features
npx expo install expo-camera
npx expo install expo-location
npx expo install expo-image-picker
npx expo install @react-native-async-storage/async-storage

# UI & Maps
npx expo install react-native-maps
npx expo install react-native-paper
npx expo install react-native-safe-area-context

# Navigation
npx expo install react-navigation
```

---

### Step 3: Setup Supabase Client (10 min)

#### 3.1 Opret `lib/supabase.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

#### 3.2 Opret `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://kofkcifhkjzfzabqfyef.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZmtjaWZoa2p6ZnphYnFmeWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNjI3NDgsImV4cCI6MjA3ODczODc0OH0.h7yfZVH_toXCoFN7IZiAS4ZB1USLhadGYUVsH0FYvzU
```

#### 3.3 Test connection:

Opret `app/index.tsx`:

```typescript
import { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { supabase } from '../lib/supabase'

export default function Index() {
  const [loading, setLoading] = useState(true)
  const [orgs, setOrgs] = useState<any[]>([])

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')

      if (error) {
        console.error('Error:', error)
      } else {
        console.log('✅ Connected! Organizations:', data)
        setOrgs(data || [])
      }
      setLoading(false)
    }

    testConnection()
  }, [])

  if (loading) {
    return <ActivityIndicator />
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
        ✅ Supabase Connected!
      </Text>
      <Text>Organizations: {orgs.length}</Text>
      {orgs.map(org => (
        <Text key={org.id}>• {org.name} ({org.type})</Text>
      ))}
    </View>
  )
}
```

**Kør**: `npx expo start` og tryk `w`

**Forventet output i browser**:
```
✅ Supabase Connected!
Organizations: 2
• København Kommune (kommune)
• Byggefirma A/S (entreprenor)
```

---

### Step 4: Setup Authentication (20 min)

#### 4.1 Opret `app/(auth)/login.tsx`:

```typescript
import { useState } from 'react'
import { View, TextInput, Button, Text, StyleSheet } from 'react-native'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'expo-router'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin() {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      router.replace('/(tabs)/dashboard')
    }

    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>VejSkilt Platform</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title={loading ? 'Logger ind...' : 'Log ind'}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
})
```

#### 4.2 Opret første bruger i Supabase:

1. Gå til: https://supabase.com/dashboard/project/kofkcifhkjzfzabqfyef/auth/users
2. Click **"Add user"** → **"Create new user"**
3. Email: `test@vejskilt.dk`
4. Password: `Test123456!`
5. Click **"Create user"**

#### 4.3 Link bruger til organisation:

Kør i Supabase SQL Editor:

```sql
-- Hent user ID (copy UUID fra output)
SELECT id, email FROM auth.users WHERE email = 'test@vejskilt.dk';

-- Link til Kommune organisation
INSERT INTO users (id, organization_id, full_name, email, role)
VALUES (
  'PASTE_USER_UUID_HER',
  (SELECT id FROM organizations WHERE name = 'København Kommune'),
  'Test Bruger',
  'test@vejskilt.dk',
  'kommune'
);
```

#### 4.4 Test login:

- Start `npx expo start` og tryk `w`
- Login med `test@vejskilt.dk` / `Test123456!`
- ✅ Du skal blive redirected til dashboard!

---

## 📂 Anbefalet Folder Struktur

```
vejskilt-app/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/
│   │   ├── dashboard.tsx
│   │   ├── ansoegninger/
│   │   ├── kort.tsx
│   │   ├── scanner.tsx
│   │   └── _layout.tsx
│   ├── _layout.tsx
│   └── index.tsx
│
├── components/
│   ├── ui/
│   ├── forms/
│   ├── Map.tsx
│   └── QRScanner.tsx
│
├── lib/
│   ├── supabase.ts
│   ├── queries/
│   │   ├── applications.ts
│   │   ├── signs.ts
│   │   └── users.ts
│   └── hooks/
│       ├── useApplications.ts
│       └── useAuth.ts
│
├── types/
│   └── database.ts
│
├── .env
├── app.json
├── package.json
└── tsconfig.json
```

---

## 🗺️ Tilføj Kort (Næste)

Efter authentication virker:

### 1. Install Leaflet for React Native Web:

```bash
npm install react-leaflet leaflet
npm install --save-dev @types/leaflet
```

### 2. Opret `components/Map.tsx`:

```typescript
import { useEffect } from 'react'
import { Platform, View, Text } from 'react-native'

export default function Map({ markers }: { markers: any[] }) {
  // På web - brug Leaflet
  if (Platform.OS === 'web') {
    return <LeafletMap markers={markers} />
  }

  // På mobil - brug react-native-maps
  return <NativeMap markers={markers} />
}

function LeafletMap({ markers }: { markers: any[] }) {
  useEffect(() => {
    // Dynamisk import af Leaflet (kun på web)
    import('leaflet').then((L) => {
      const map = L.map('map').setView([55.6761, 12.5683], 13)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map)

      markers.forEach(marker => {
        L.marker([marker.lat, marker.lon]).addTo(map)
      })
    })
  }, [markers])

  return <div id="map" style={{ height: 600 }} />
}

function NativeMap({ markers }: { markers: any[] }) {
  // TODO: Implementér react-native-maps
  return <Text>Native map kommer snart</Text>
}
```

---

## 📱 Test På Mobil

### iOS (Mac kun):
```bash
npx expo run:ios
```

### Android:
```bash
npx expo run:android
```

### Eller brug Expo Go app:
1. Download "Expo Go" fra App Store / Google Play
2. Scan QR koden fra `npx expo start`
3. App åbnes direkte på din telefon! 📱

---

## 🎯 Development Workflow

```bash
# Start development
npx expo start

# Åbn på forskellige platforme:
# - Tryk 'w' for web
# - Tryk 'a' for Android emulator
# - Tryk 'i' for iOS simulator
# - Scan QR med telefon
```

---

## 📊 Næste Features at Bygge

Efter login + database connection virker:

1. ✅ **Dashboard** - Stats og oversigt
2. ✅ **Ansøgninger liste** - Se alle ansøgninger
3. ✅ **Opret ansøgning** - Form med validering
4. ✅ **Kort integration** - Vis skilte på kort
5. ✅ **QR Scanner** - Scan QR koder (mobil)
6. ✅ **Foto upload** - Tag billeder

Se **MVP-SCOPE.md** for komplet feature-liste!

---

## 🐛 Troubleshooting

### "Module not found: @supabase/supabase-js"
```bash
npx expo install @supabase/supabase-js
```

### "Cannot find module 'leaflet'"
```bash
npm install leaflet react-leaflet
```

### Metro bundler fejl
```bash
npx expo start -c  # Clear cache
```

### iOS build fejl
```bash
cd ios && pod install && cd ..
npx expo run:ios
```

---

## 📚 Nyttige Links

- **Expo Docs**: https://docs.expo.dev
- **Expo Router**: https://docs.expo.dev/router/introduction/
- **Supabase + React Native**: https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
- **React Native Paper**: https://callstack.github.io/react-native-paper/

---

## ✅ Success Criteria

Du ved du er på rette vej når:

- ✅ `npx expo start` virker uden fejl
- ✅ Web version åbner i browser (tryk `w`)
- ✅ Kan login med test-bruger
- ✅ Kan hente organizations fra Supabase
- ✅ Kan se kort med markers

---

**Status**: 🚀 Ready to Build!
**Next**: Start med Step 1 - Opret Expo projekt
**Estimeret tid til første version**: 2-3 dage

God kodning! 💻🎉

// VejSkilt MVP Demo - Application Logic

// ==========================================
// DATA STORAGE (LocalStorage)
// ==========================================

function getApplications() {
  const data = localStorage.getItem('vejskilt_applications')
  return data ? JSON.parse(data) : []
}

function saveApplications(applications) {
  localStorage.setItem('vejskilt_applications', JSON.stringify(applications))
  updateStats()
  renderDashboard()
}

function generateId() {
  return 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

function generateAppNumber() {
  const year = new Date().getFullYear()
  const apps = getApplications()
  const count = apps.length + 1
  return `ANS-${year}-${String(count).padStart(6, '0')}`
}

// ==========================================
// STATE
// ==========================================

let currentMap = null
let currentMarkers = []
let tempSigns = []
let currentFilter = 'all'

// ==========================================
// VIEW SWITCHING
// ==========================================

function showView(viewId) {
  // Hide all views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'))
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'))

  // Show selected view
  document.getElementById(viewId).classList.add('active')
  document.getElementById('btn-' + viewId).classList.add('active')

  // Initialize based on view
  if (viewId === 'create') {
    setTimeout(initCreateMap, 100)
  } else if (viewId === 'approve') {
    renderPendingApplications()
  } else if (viewId === 'map-view') {
    setTimeout(initAllMap, 100)
  } else if (viewId === 'dashboard') {
    renderDashboard()
  }
}

// ==========================================
// CREATE APPLICATION
// ==========================================

// Sign type configuration with icons
const signTypes = [
  { name: 'Hastighedsbegrænsning 40 km/t', icon: '40', color: '#ef4444' },
  { name: 'Hastighedsbegrænsning 30 km/t', icon: '30', color: '#f97316' },
  { name: 'Vejarbejde', icon: '🚧', color: '#fbbf24' },
  { name: 'Omkørsel', icon: '↪️', color: '#3b82f6' },
  { name: 'Stop - Vigepligt', icon: '⛔', color: '#dc2626' },
  { name: 'Parkering Forbudt', icon: '🅿️', color: '#7c3aed' },
  { name: 'Fodgængerovergang', icon: '🚶', color: '#10b981' },
]

let selectedSignType = signTypes[2] // Default: Vejarbejde
let uploadedImages = []

function initCreateMap() {
  if (currentMap) {
    currentMap.remove()
  }

  currentMap = L.map('map').setView([55.6761, 12.5683], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(currentMap)

  // Initialize sign palette
  initSignPalette()

  // Initialize image upload
  initImageUpload()

  // Click to add sign (fallback if not dragging)
  currentMap.on('click', (e) => {
    if (!currentMap._isDragging) {
      addSignToMap(e.latlng, selectedSignType)
    }
  })

  // Render existing temp signs
  renderTempSigns()
}

function initSignPalette() {
  const palette = document.getElementById('sign-palette')

  signTypes.forEach(signType => {
    const signButton = document.createElement('div')
    signButton.className = 'sign-palette-item'
    signButton.draggable = true
    signButton.style.cssText = `
      background: white;
      border: 2px solid ${signType.color};
      border-radius: 8px;
      padding: 12px;
      cursor: grab;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.2s;
    `

    signButton.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        background: ${signType.color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: ${signType.icon.length <= 2 ? '16px' : '20px'};
      ">${signType.icon}</div>
      <div style="flex: 1; font-size: 13px; font-weight: 600; color: #374151;">
        ${signType.name}
      </div>
    `

    // Drag start
    signButton.addEventListener('dragstart', (e) => {
      selectedSignType = signType
      signButton.style.opacity = '0.5'
      signButton.style.cursor = 'grabbing'
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData('text/plain', signType.name)
    })

    signButton.addEventListener('dragend', (e) => {
      signButton.style.opacity = '1'
      signButton.style.cursor = 'grab'
    })

    // Hover effect
    signButton.addEventListener('mouseenter', () => {
      signButton.style.transform = 'translateX(4px)'
      signButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
    })

    signButton.addEventListener('mouseleave', () => {
      signButton.style.transform = 'translateX(0)'
      signButton.style.boxShadow = 'none'
    })

    palette.appendChild(signButton)
  })

  // Make map accept drops
  const mapElement = document.getElementById('map')

  mapElement.addEventListener('dragover', (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  })

  mapElement.addEventListener('drop', (e) => {
    e.preventDefault()

    // Get mouse position relative to map
    const rect = mapElement.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert pixel coordinates to lat/lng
    const point = currentMap.containerPointToLatLng([x, y])

    addSignToMap(point, selectedSignType)
  })
}

function initImageUpload() {
  const dropZone = document.getElementById('image-drop-zone')
  const fileInput = document.getElementById('image-upload')
  const previews = document.getElementById('image-previews')

  // Click to upload
  dropZone.addEventListener('click', () => {
    fileInput.click()
  })

  // Drag and drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault()
    dropZone.style.borderColor = '#667eea'
    dropZone.style.background = '#f0f9ff'
  })

  dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#cbd5e1'
    dropZone.style.background = 'white'
  })

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault()
    dropZone.style.borderColor = '#cbd5e1'
    dropZone.style.background = 'white'

    const files = Array.from(e.dataTransfer.files)
    handleImageFiles(files)
  })

  // File input change
  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files)
    handleImageFiles(files)
  })
}

function handleImageFiles(files) {
  const previews = document.getElementById('image-previews')

  files.forEach(file => {
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (e) => {
      uploadedImages.push({
        name: file.name,
        data: e.target.result,
        size: file.size
      })

      const preview = document.createElement('div')
      preview.style.cssText = `
        position: relative;
        margin-bottom: 8px;
        border-radius: 6px;
        overflow: hidden;
        border: 2px solid #e5e7eb;
      `

      preview.innerHTML = `
        <img src="${e.target.result}" style="width: 100%; height: 100px; object-fit: cover;">
        <button onclick="removeImage(${uploadedImages.length - 1})" style="
          position: absolute;
          top: 4px;
          right: 4px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
        ">×</button>
        <div style="
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 4px 8px;
          font-size: 11px;
        ">${file.name}</div>
      `

      previews.appendChild(preview)
    }

    reader.readAsDataURL(file)
  })
}

function removeImage(index) {
  uploadedImages.splice(index, 1)
  const previews = document.getElementById('image-previews')
  previews.innerHTML = ''

  // Re-render remaining images
  uploadedImages.forEach((img, i) => {
    const preview = document.createElement('div')
    preview.style.cssText = `
      position: relative;
      margin-bottom: 8px;
      border-radius: 6px;
      overflow: hidden;
      border: 2px solid #e5e7eb;
    `

    preview.innerHTML = `
      <img src="${img.data}" style="width: 100%; height: 100px; object-fit: cover;">
      <button onclick="removeImage(${i})" style="
        position: absolute;
        top: 4px;
        right: 4px;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        cursor: pointer;
        font-weight: 700;
        font-size: 14px;
      ">×</button>
      <div style="
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 4px 8px;
        font-size: 11px;
      ">${img.name}</div>
    `

    previews.appendChild(preview)
  })
}

function addSignToMap(latlng, signType) {
  const sign = {
    id: 'sign_' + Date.now(),
    type: signType.name,
    icon: signType.icon,
    color: signType.color,
    lat: latlng.lat,
    lng: latlng.lng,
  }

  tempSigns.push(sign)
  renderTempSigns()
}

function renderTempSigns() {
  // Clear existing markers
  currentMarkers.forEach(m => m.remove())
  currentMarkers = []

  // Add markers
  tempSigns.forEach((sign, index) => {
    // Find sign type configuration
    const signConfig = signTypes.find(t => t.name === sign.type) || selectedSignType

    const marker = L.marker([sign.lat, sign.lng], {
      draggable: true, // Make markers draggable!
      icon: L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background-color: ${signConfig.color};
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${signConfig.icon.length <= 2 ? '18px' : '24px'};
          color: white;
          font-weight: 700;
          cursor: grab;
          transition: transform 0.2s;
        ">${signConfig.icon}</div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      })
    })
    .bindPopup(`
      <div style="text-align: center;">
        <strong style="font-size: 16px;">${sign.type}</strong><br>
        <span style="font-size: 12px; color: #6b7280;">GPS: ${sign.lat.toFixed(6)}, ${sign.lng.toFixed(6)}</span><br>
        <span style="
          display: inline-block;
          margin-top: 8px;
          padding: 4px 12px;
          background: #fbbf24;
          color: white;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
        ">Afventer godkendelse</span>
      </div>
    `)
    .addTo(currentMap)

    // Update position when dragged
    marker.on('dragend', function(e) {
      const newLatLng = e.target.getLatLng()
      tempSigns[index].lat = newLatLng.lat
      tempSigns[index].lng = newLatLng.lng
      renderTempSigns()
    })

    // Visual feedback on drag
    marker.on('dragstart', function(e) {
      e.target.closePopup()
    })

    currentMarkers.push(marker)
  })

  // Update UI
  if (tempSigns.length > 0) {
    document.getElementById('signs-container').style.display = 'block'
    document.getElementById('signs-count').textContent = tempSigns.length

    const list = document.getElementById('signs-list')
    list.innerHTML = tempSigns.map((sign, index) => `
      <div class="sign-item">
        <div>
          <strong>${sign.type}</strong><br>
          <small>GPS: ${sign.lat.toFixed(6)}, ${sign.lng.toFixed(6)}</small>
        </div>
        <button class="btn btn-danger" onclick="removeSign(${index})" style="padding: 6px 12px; font-size: 12px;">
          🗑️ Fjern
        </button>
      </div>
    `).join('')
  } else {
    document.getElementById('signs-container').style.display = 'none'
  }
}

function removeSign(index) {
  tempSigns.splice(index, 1)
  renderTempSigns()
}

function resetForm() {
  document.getElementById('create-form').reset()
  tempSigns = []
  uploadedImages = []
  renderTempSigns()
  document.getElementById('image-previews').innerHTML = ''
}

// Form submit
document.getElementById('create-form').addEventListener('submit', (e) => {
  e.preventDefault()

  if (tempSigns.length === 0) {
    alert('Tilføj mindst ét skilt på kortet!')
    return
  }

  const application = {
    id: generateId(),
    number: generateAppNumber(),
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    address: document.getElementById('address').value,
    startDate: document.getElementById('start-date').value,
    endDate: document.getElementById('end-date').value,
    status: 'pending',
    createdAt: new Date().toISOString(),
    images: uploadedImages, // Include uploaded images
    signs: tempSigns.map(s => ({
      ...s,
      status: 'not_mounted',
      qrCode: 'VS-' + new Date().getFullYear() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase()
    }))
  }

  const applications = getApplications()
  applications.push(application)
  saveApplications(applications)

  const imageText = uploadedImages.length > 0 ? `\n${uploadedImages.length} billeder` : ''
  alert(`✅ Ansøgning oprettet!\n\nSagsnummer: ${application.number}\n${tempSigns.length} skilte tilføjet${imageText}`)

  resetForm()
  showView('dashboard')
})

// ==========================================
// DASHBOARD
// ==========================================

function updateStats() {
  const applications = getApplications()

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    signs: applications.reduce((sum, a) => sum + a.signs.length, 0)
  }

  document.getElementById('stat-total').textContent = stats.total
  document.getElementById('stat-pending').textContent = stats.pending
  document.getElementById('stat-approved').textContent = stats.approved
  document.getElementById('stat-signs').textContent = stats.signs
}

function renderDashboard() {
  updateStats()

  const applications = getApplications()
  const recent = applications.slice(-6).reverse()

  const container = document.getElementById('recent-applications')

  if (recent.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <h3>Ingen ansøgninger endnu</h3>
        <p>Opret din første ansøgning for at komme i gang!</p>
      </div>
    `
    return
  }

  container.innerHTML = recent.map(app => `
    <div class="app-card" onclick="viewApplication('${app.id}')">
      <h3>${app.title}</h3>
      <div class="meta">📍 ${app.address}</div>
      <div class="meta">📅 ${formatDate(app.startDate)} - ${formatDate(app.endDate)}</div>
      <div class="meta">🚦 ${app.signs.length} skilte</div>
      <span class="status-badge status-${app.status}">
        ${getStatusText(app.status)}
      </span>
    </div>
  `).join('')
}

// ==========================================
// APPROVE VIEW (Kommune)
// ==========================================

function renderPendingApplications() {
  const applications = getApplications().filter(a => a.status === 'pending')
  const container = document.getElementById('pending-applications')
  const emptyState = document.getElementById('no-pending')

  if (applications.length === 0) {
    container.innerHTML = ''
    emptyState.style.display = 'block'
    return
  }

  emptyState.style.display = 'none'
  container.innerHTML = applications.map(app => `
    <div class="app-card" onclick="showApprovalModal('${app.id}')">
      <h3>${app.title}</h3>
      <div class="meta"><strong>Sagsnr:</strong> ${app.number}</div>
      <div class="meta">📍 ${app.address}</div>
      <div class="meta">📅 ${formatDate(app.startDate)} - ${formatDate(app.endDate)}</div>
      <div class="meta">🚦 ${app.signs.length} skilte</div>
      <div class="meta">⏰ Oprettet: ${formatDateTime(app.createdAt)}</div>
      <span class="status-badge status-pending">
        Afventer godkendelse
      </span>
    </div>
  `).join('')
}

function showApprovalModal(appId) {
  const app = getApplications().find(a => a.id === appId)
  if (!app) return

  document.getElementById('modal-title').textContent = app.title
  document.getElementById('modal-body').innerHTML = `
    <div style="margin-bottom: 20px;">
      <strong>Sagsnummer:</strong> ${app.number}<br>
      <strong>Adresse:</strong> ${app.address}<br>
      <strong>Periode:</strong> ${formatDate(app.startDate)} - ${formatDate(app.endDate)}<br>
      <strong>Beskrivelse:</strong> ${app.description || 'Ingen beskrivelse'}
    </div>

    <h3 style="margin-bottom: 15px;">Skilte (${app.signs.length})</h3>
    <div id="approval-map" style="width: 100%; height: 400px; border-radius: 8px; margin-bottom: 20px;"></div>

    <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
      ${app.signs.map((sign, i) => `
        <div style="padding: 8px 0; ${i < app.signs.length - 1 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
          <strong>${i + 1}. ${sign.type}</strong><br>
          <small>GPS: ${sign.lat.toFixed(6)}, ${sign.lng.toFixed(6)}</small>
        </div>
      `).join('')}
    </div>

    <div style="display: flex; gap: 10px;">
      <button class="btn btn-success" onclick="approveApplication('${appId}')">
        ✅ Godkend Ansøgning
      </button>
      <button class="btn btn-danger" onclick="rejectApplication('${appId}')">
        ❌ Afvis
      </button>
    </div>
  `

  document.getElementById('modal').classList.add('active')

  // Initialize map in modal
  setTimeout(() => {
    const map = L.map('approval-map').setView([app.signs[0].lat, app.signs[0].lng], 15)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map)

    app.signs.forEach(sign => {
      L.marker([sign.lat, sign.lng], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            background-color: #fbbf24;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
          ">📍</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      })
      .bindPopup(`<b>${sign.type}</b>`)
      .addTo(map)
    })
  }, 100)
}

function approveApplication(appId) {
  const applications = getApplications()
  const app = applications.find(a => a.id === appId)

  if (app) {
    app.status = 'approved'
    app.approvedAt = new Date().toISOString()
    saveApplications(applications)

    closeModal()
    alert(`✅ Ansøgning godkendt!\n\nSagsnummer: ${app.number}\n${app.signs.length} QR-koder er genereret og klar til download.`)

    renderPendingApplications()
  }
}

function rejectApplication(appId) {
  const comment = prompt('Hvorfor afvises ansøgningen?\n(Kommentar påkrævet)')

  if (!comment) return

  const applications = getApplications()
  const app = applications.find(a => a.id === appId)

  if (app) {
    app.status = 'rejected'
    app.rejectedAt = new Date().toISOString()
    app.rejectComment = comment
    saveApplications(applications)

    closeModal()
    alert(`❌ Ansøgning afvist`)

    renderPendingApplications()
  }
}

// ==========================================
// MAP VIEW (All Signs)
// ==========================================

let allMap = null
let allMarkers = []
let currentKommuneFilter = 'all'

function initAllMap() {
  if (allMap) {
    allMap.remove()
  }

  allMap = L.map('map-all').setView([55.6761, 12.5683], 13)

  // OpenStreetMap (virker altid - ingen CORS problemer)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(allMap)

  console.log('🗺️ Bruger OpenStreetMap (stabil baggrund)')
  console.log('ℹ️ Dataforsyningen har CORS-restriktioner på localhost')
  console.log('✅ I produktion (deployed app) kan Dataforsyningen bruges')

  renderAllSigns()
}

function renderAllSigns() {
  if (!allMap) return

  // Clear existing markers
  allMarkers.forEach(m => m.remove())
  allMarkers = []

  const applications = getApplications()

  // Calculate statistics
  let totalSigns = 0
  let pendingSigns = 0
  let approvedSigns = 0
  let mountedSigns = 0

  applications.forEach(app => {
    // Filter by kommune first
    if (currentKommuneFilter !== 'all' && app.kommune !== currentKommuneFilter) {
      return // Skip this entire application
    }

    app.signs.forEach(sign => {
      totalSigns++

      if (sign.status === 'mounted') {
        mountedSigns++
      } else if (app.status === 'pending') {
        pendingSigns++
      } else if (app.status === 'approved') {
        approvedSigns++
      }

      // Filter by status
      if (currentFilter !== 'all') {
        if (currentFilter === 'pending' && app.status !== 'pending') return
        if (currentFilter === 'approved' && app.status !== 'approved') return
        if (currentFilter === 'mounted' && sign.status !== 'mounted') return
      }

      const colors = {
        'pending': '#fbbf24',
        'approved': '#3b82f6',
        'rejected': '#ef4444',
      }

      const signColor = sign.status === 'mounted' ? '#10b981' : colors[app.status] || '#6b7280'

      const signStatus = sign.status === 'mounted' ? 'Monteret' : getStatusText(app.status)
      const statusEmoji = sign.status === 'mounted' ? '🟢' : (app.status === 'pending' ? '🟡' : '🔵')

      const marker = L.marker([sign.lat, sign.lng], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            background-color: ${signColor};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
          ">📍</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      })
      .bindPopup(`
        <div style="min-width: 250px; font-family: -apple-system, sans-serif;">
          <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #1f2937;">
            ${sign.type}
          </div>

          <div style="background: #f9fafb; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
            <div style="font-size: 13px; margin-bottom: 5px;">
              <strong>📋 Ansøgning:</strong> ${app.number}
            </div>
            <div style="font-size: 13px; margin-bottom: 5px;">
              <strong>📍 Adresse:</strong> ${app.address}
            </div>
            <div style="font-size: 13px; margin-bottom: 5px;">
              <strong>📅 Periode:</strong> ${formatDate(app.startDate)} - ${formatDate(app.endDate)}
            </div>
            ${sign.qrCode ? `
              <div style="font-size: 13px; margin-bottom: 5px;">
                <strong>🔖 QR Kode:</strong> ${sign.qrCode}
              </div>
            ` : ''}
            <div style="font-size: 13px;">
              <strong>📌 GPS:</strong> ${sign.lat.toFixed(6)}, ${sign.lng.toFixed(6)}
            </div>
          </div>

          <div style="display: inline-block; padding: 5px 12px; background: ${signColor}; color: white; border-radius: 12px; font-size: 12px; font-weight: bold;">
            ${statusEmoji} ${signStatus}
          </div>
        </div>
      `)
      .addTo(allMap)

      allMarkers.push(marker)
    })
  })

  // Update statistics
  document.getElementById('map-total-signs').textContent = totalSigns
  document.getElementById('map-pending-signs').textContent = pendingSigns
  document.getElementById('map-approved-signs').textContent = approvedSigns
  document.getElementById('map-mounted-signs').textContent = mountedSigns

  // Fit bounds to show all markers
  if (allMarkers.length > 0) {
    const group = L.featureGroup(allMarkers)
    allMap.fitBounds(group.getBounds().pad(0.1))
  } else {
    // No markers - center on Copenhagen
    allMap.setView([55.6761, 12.5683], 13)
  }
}

function filterMap(filter) {
  currentFilter = filter

  // Update button styles
  const filterButtons = ['all', 'pending', 'approved', 'mounted']
  filterButtons.forEach(f => {
    const btn = document.getElementById('filter-' + f)
    if (btn) {
      if (f === filter) {
        btn.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.3)'
        btn.style.transform = 'scale(1.05)'
      } else {
        btn.style.boxShadow = ''
        btn.style.transform = ''
      }
    }
  })

  renderAllSigns()
}

function filterByKommune(kommune) {
  currentKommuneFilter = kommune

  // Update button styles
  const kommuneButtons = ['all', 'kbh', 'aarhus']
  kommuneButtons.forEach(k => {
    const btn = document.getElementById('filter-kommune-' + k)
    if (btn) {
      if ((k === 'all' && kommune === 'all') ||
          (k === 'kbh' && kommune === 'København') ||
          (k === 'aarhus' && kommune === 'Aarhus')) {
        btn.classList.add('active')
      } else {
        btn.classList.remove('active')
      }
    }
  })

  renderAllSigns()

  // Zoom to selected area
  if (kommune === 'København' && allMap) {
    allMap.setView([55.6761, 12.5683], 12)
  } else if (kommune === 'Aarhus' && allMap) {
    allMap.setView([56.1572, 10.2107], 12)
  }
}

// ==========================================
// MODALS
// ==========================================

function closeModal() {
  document.getElementById('modal').classList.remove('active')
}

function viewApplication(appId) {
  const app = getApplications().find(a => a.id === appId)
  if (!app) return

  showApprovalModal(appId)
}

// Click outside modal to close
document.getElementById('modal').addEventListener('click', (e) => {
  if (e.target.id === 'modal') {
    closeModal()
  }
})

// ==========================================
// HELPERS
// ==========================================

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('da-DK')
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString('da-DK')
}

function getStatusText(status) {
  const texts = {
    'pending': 'Afventer godkendelse',
    'approved': 'Godkendt',
    'rejected': 'Afvist',
    'mounted': 'Monteret',
  }
  return texts[status] || status
}

// ==========================================
// TEST DATA
// ==========================================

function addTestData() {
  const testApplications = [
    // KØBENHAVN DATA
    {
      id: 'app_test_001',
      number: 'ANS-2025-000001',
      title: 'Vejarbejde - Vesterbrogade (København)',
      description: 'Asfaltarbejde i forbindelse med fjernvarmeledning',
      address: 'Vesterbrogade 10-20, 1620 København V',
      kommune: 'København',
      startDate: '2025-11-20',
      endDate: '2025-12-15',
      status: 'approved',
      createdAt: new Date('2025-11-10').toISOString(),
      approvedAt: new Date('2025-11-12').toISOString(),
      signs: [
        {
          id: 'sign_001',
          type: 'Vejarbejde',
          lat: 55.6761,
          lng: 12.5683,
          status: 'mounted',
          qrCode: 'VS-2025-KBH123'
        },
        {
          id: 'sign_002',
          type: 'Hastighedsbegrænsning 30 km/t',
          lat: 55.6765,
          lng: 12.5690,
          status: 'not_mounted',
          qrCode: 'VS-2025-KBH124'
        }
      ]
    },
    {
      id: 'app_test_002',
      number: 'ANS-2025-000002',
      title: 'Parkering Forbudt - Nørrebrogade (København)',
      description: 'Midlertidig parkeringsrestriktion ved byggeplads',
      address: 'Nørrebrogade 45, 2200 København N',
      kommune: 'København',
      startDate: '2025-11-25',
      endDate: '2026-01-31',
      status: 'pending',
      createdAt: new Date('2025-11-14').toISOString(),
      signs: [
        {
          id: 'sign_003',
          type: 'Parkering Forbudt',
          lat: 55.6870,
          lng: 12.5590,
          status: 'not_mounted'
        }
      ]
    },

    // AARHUS DATA
    {
      id: 'app_test_003',
      number: 'ANS-2025-000003',
      title: 'Vejarbejde - Åboulevarden (Aarhus)',
      description: 'Renovering af vej og fortov',
      address: 'Åboulevarden 20, 8000 Aarhus C',
      kommune: 'Aarhus',
      startDate: '2025-12-01',
      endDate: '2026-01-31',
      status: 'approved',
      createdAt: new Date('2025-11-11').toISOString(),
      approvedAt: new Date('2025-11-13').toISOString(),
      signs: [
        {
          id: 'sign_004',
          type: 'Vejarbejde',
          lat: 56.1572,
          lng: 10.2107,
          status: 'mounted',
          qrCode: 'VS-2025-AAR001'
        },
        {
          id: 'sign_005',
          type: 'Hastighedsbegrænsning 30 km/t',
          lat: 56.1580,
          lng: 10.2115,
          status: 'mounted',
          qrCode: 'VS-2025-AAR002'
        },
        {
          id: 'sign_006',
          type: 'Omkørsel',
          lat: 56.1565,
          lng: 10.2100,
          status: 'not_mounted',
          qrCode: 'VS-2025-AAR003'
        }
      ]
    },
    {
      id: 'app_test_004',
      number: 'ANS-2025-000004',
      title: 'Hastighedsbegrænsning - Randersvej (Aarhus)',
      description: 'Midlertidig hastighedsnedsættelse ved skole',
      address: 'Randersvej 100, 8200 Aarhus N',
      kommune: 'Aarhus',
      startDate: '2025-11-18',
      endDate: '2025-12-20',
      status: 'approved',
      createdAt: new Date('2025-11-08').toISOString(),
      approvedAt: new Date('2025-11-10').toISOString(),
      signs: [
        {
          id: 'sign_007',
          type: 'Hastighedsbegrænsning 40 km/t',
          lat: 56.1750,
          lng: 10.2250,
          status: 'mounted',
          qrCode: 'VS-2025-AAR004'
        },
        {
          id: 'sign_008',
          type: 'Fodgængerovergang',
          lat: 56.1755,
          lng: 10.2255,
          status: 'mounted',
          qrCode: 'VS-2025-AAR005'
        }
      ]
    },
    {
      id: 'app_test_005',
      number: 'ANS-2025-000005',
      title: 'Parkering Forbudt - Søndergade (Aarhus)',
      description: 'Midlertidig parkeringsrestriktion i forbindelse med event',
      address: 'Søndergade 15, 8000 Aarhus C',
      kommune: 'Aarhus',
      startDate: '2025-12-10',
      endDate: '2025-12-12',
      status: 'pending',
      createdAt: new Date('2025-11-15').toISOString(),
      signs: [
        {
          id: 'sign_009',
          type: 'Parkering Forbudt',
          lat: 56.1560,
          lng: 10.2050,
          status: 'not_mounted'
        },
        {
          id: 'sign_010',
          type: 'Parkering Forbudt',
          lat: 56.1565,
          lng: 10.2055,
          status: 'not_mounted'
        },
        {
          id: 'sign_011',
          type: 'Parkering Forbudt',
          lat: 56.1570,
          lng: 10.2060,
          status: 'not_mounted'
        }
      ]
    }
  ]

  localStorage.setItem('vejskilt_applications', JSON.stringify(testApplications))
  console.log('✅ Test data tilføjet: 5 ansøgninger med 11 skilte')
  console.log('📍 København: 2 ansøgninger, 3 skilte')
  console.log('📍 Aarhus: 3 ansøgninger, 8 skilte')
  return testApplications
}

// ==========================================
// INIT
// ==========================================

// Set default dates
const today = new Date()
const twoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)

document.getElementById('start-date').valueAsDate = today
document.getElementById('end-date').valueAsDate = twoWeeks

// Load or create test data
const existingData = getApplications()
if (existingData.length === 0) {
  console.log('📦 Ingen data fundet - tilføjer test-data...')
  addTestData()
}

// Initial render
updateStats()
renderDashboard()

console.log('✅ VejSkilt MVP Demo loaded!')
console.log('📊 Applications in storage:', getApplications().length)

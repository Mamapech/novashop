<script setup>
// Map for choosing a delivery location.
// - "Use my location" asks the browser for GPS coordinates
// - The pin can be dragged, or moved by clicking on the map
// - Every time the pin moves, the coordinates are turned into a written address
//   with OpenStreetMap's free Nominatim service (reverse geocoding)
import { ref, onMounted, onBeforeUnmount } from "vue"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

const emit = defineEmits(["address"])

const mapEl = ref(null)
const status = ref("Drag the pin or click the map to choose your delivery location.")
const locating = ref(false)
const looking = ref(false)

let map
let marker
let lookupTimer
let lastRequest = 0

const BANGKOK = [13.7563, 100.5018]

// A simple pin made with CSS, so we don't need Leaflet's image files
const pinIcon = L.divIcon({
  className: "",
  html: '<div class="pin"><div class="pin-dot"></div></div>',
  iconSize: [32, 42],
  iconAnchor: [16, 42],
})

onMounted(() => {
  map = L.map(mapEl.value, { scrollWheelZoom: false }).setView(BANGKOK, 12)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)

  marker = L.marker(BANGKOK, { draggable: true, icon: pinIcon }).addTo(map)
  marker.on("dragend", () => lookupAddress(marker.getLatLng()))
  map.on("click", (e) => {
    marker.setLatLng(e.latlng)
    lookupAddress(e.latlng)
  })
})

onBeforeUnmount(() => {
  clearTimeout(lookupTimer)
  map?.remove()
})

function useMyLocation() {
  if (!("geolocation" in navigator)) {
    status.value = "Your browser doesn't support location. Please pick the spot on the map."
    return
  }
  locating.value = true
  status.value = "Finding your location..."
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      locating.value = false
      const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude)
      map.setView(latlng, 17)
      marker.setLatLng(latlng)
      lookupAddress(latlng)
    },
    (err) => {
      locating.value = false
      status.value =
        err.code === err.PERMISSION_DENIED
          ? "Location permission was blocked. Allow it in your browser, or pick the spot on the map."
          : "Couldn't get your location. Please pick the spot on the map."
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

// Turn Nominatim's address parts into one readable line
function formatAddress(data) {
  const a = data.address || {}
  const parts = [
    [a.house_number, a.road].filter(Boolean).join(" "),
    a.neighbourhood || a.quarter || a.suburb,
    a.city_district || a.district || a.county,
    a.city || a.town || a.village || a.municipality,
    a.state || a.province,
    a.postcode,
  ].filter(Boolean)
  const unique = [...new Set(parts)]
  if (unique.length >= 2) return unique.join(", ")
  // Fallback: the full name without the country at the end
  return (data.display_name || "").split(", ").slice(0, -1).join(", ")
}

function lookupAddress(latlng) {
  clearTimeout(lookupTimer)
  // Nominatim allows at most 1 request per second, so wait a moment after the last move
  const wait = Math.max(400, 1100 - (Date.now() - lastRequest))
  lookupTimer = setTimeout(async () => {
    lastRequest = Date.now()
    looking.value = true
    status.value = "Looking up the address..."
    try {
      const url = new URL("https://nominatim.openstreetmap.org/reverse")
      url.search = new URLSearchParams({
        format: "jsonv2",
        lat: latlng.lat.toFixed(6),
        lon: latlng.lng.toFixed(6),
        addressdetails: "1",
        "accept-language": "th,en",
      })
      const res = await fetch(url)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const address = formatAddress(data)
      if (!address) throw new Error()
      emit("address", { address, lat: latlng.lat, lng: latlng.lng })
      status.value = "Address filled in. Add your house number or building name if it's missing."
    } catch {
      status.value = "Couldn't find an address for this spot. Please type it in below."
    } finally {
      looking.value = false
    }
  }, wait)
}
</script>

<template>
  <div class="picker">
    <div class="row-between">
      <span class="small muted">{{ status }}</span>
      <button type="button" class="btn btn-outline btn-sm" :disabled="locating" @click="useMyLocation">
        <span v-if="locating || looking" class="spinner small-spinner"></span>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
        Use my location
      </button>
    </div>
    <div ref="mapEl" class="map"></div>
  </div>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.map {
  height: 260px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  z-index: 0;
}
.small-spinner {
  width: 14px;
  height: 14px;
}
</style>

<style>
/* Global because Leaflet creates the pin outside this component's scope */
.pin {
  width: 32px;
  height: 32px;
  border-radius: 50% 50% 50% 0;
  background: var(--brand);
  transform: rotate(-45deg);
  display: grid;
  place-items: center;
  box-shadow: 0 4px 10px rgb(15 23 42 / 0.3);
}
.pin-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
}
</style>

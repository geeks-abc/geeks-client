import { NearbyMapFacility, NearbyMapItem } from '@/components/nearby-map.types';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const TILE_URL = process.env.EXPO_PUBLIC_MAP_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const safeJson = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');

export const serializeMapItems = (items: NearbyMapItem[]) => safeJson(items);

export function createNearbyMapHtml(facility: NearbyMapFacility) {
  const facilityJson = safeJson(facility);
  const tileUrl = safeJson(TILE_URL);

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="${LEAFLET_CSS}" crossorigin="" />
  <style>
    * { box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; margin: 0; background: #eef1ef; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif; }
    .leaflet-control-attribution { font-size: 9px; }
    .leaflet-popup-content-wrapper { border-radius: 14px; box-shadow: 0 8px 24px rgba(0,0,0,.14); }
    .leaflet-popup-content { width: 210px !important; margin: 14px; }
    .popup-store { color: #8b95a1; font-size: 11px; margin-bottom: 4px; }
    .popup-title { color: #191f28; font-size: 14px; font-weight: 700; line-height: 1.4; }
    .popup-meta { color: #6b7684; font-size: 11px; margin-top: 5px; }
    .popup-button { width: 100%; height: 38px; margin-top: 12px; border: 0; border-radius: 10px; background: #ff6f0f; color: #fff; font-size: 12px; font-weight: 700; }
    .donation-icon { background: transparent; border: 0; }
    .donation-marker {
      width: 34px; height: 34px; border: 3px solid #fff; border-radius: 17px 17px 17px 5px;
      background: #ff6f0f; color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 800; box-shadow: 0 4px 12px rgba(0,0,0,.2); transform: rotate(-45deg);
    }
    .donation-marker span { transform: rotate(45deg); }
    .facility-label {
      min-width: 72px; padding: 7px 10px; border: 2px solid #fff; border-radius: 999px;
      background: #131a2e; color: #fff; font-size: 10px; font-weight: 700; text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,.18); white-space: nowrap;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="${LEAFLET_JS}" crossorigin=""></script>
  <script>
    const facility = ${facilityJson};
    const map = L.map('map', { zoomControl: false }).setView([facility.lat, facility.lng], 14);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer(${tileUrl}, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const serviceArea = L.circle([facility.lat, facility.lng], {
      radius: 3000,
      color: '#ff6f0f',
      weight: 1.5,
      opacity: 0.45,
      fillColor: '#ff6f0f',
      fillOpacity: 0.05,
      interactive: false,
    }).addTo(map);

    const facilityIcon = L.divIcon({
      className: '',
      html: '<div class="facility-label">현재 시설</div>',
      iconSize: [72, 30],
      iconAnchor: [36, 15],
    });
    L.marker([facility.lat, facility.lng], { icon: facilityIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindTooltip(facility.name, { direction: 'top', offset: [0, -12] });

    const listingLayer = L.layerGroup().addTo(map);
    let fitted = false;

    function escapeHtml(value) {
      return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    }

    function sendSelect(id) {
      const payload = { source: 'ieum-nearby-map', type: 'select', id: Number(id) };
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      } else {
        window.parent.postMessage(payload, '*');
      }
    }

    window.updateNearbyItems = function(items) {
      listingLayer.clearLayers();
      const bounds = L.latLngBounds(serviceArea.getBounds());

      items.forEach(function(item, index) {
        if (!Number.isFinite(item.lat) || !Number.isFinite(item.lng)) return;
        bounds.extend([item.lat, item.lng]);
        const icon = L.divIcon({
          className: 'donation-icon',
          html: '<div class="donation-marker"><span>' + (index + 1) + '</span></div>',
          iconSize: [34, 34],
          iconAnchor: [17, 31],
          popupAnchor: [0, -30],
        });
        const marker = L.marker([item.lat, item.lng], { icon: icon }).addTo(listingLayer);
        marker.bindPopup(
          '<div class="popup-store">' + escapeHtml(item.storeName) + '</div>' +
          '<div class="popup-title">' + escapeHtml(item.itemName) + '</div>' +
          '<div class="popup-meta">' + escapeHtml(item.quantity) + '개 · ' +
            escapeHtml(item.distanceKm) + 'km · ' + escapeHtml(item.remainingText) + '</div>' +
          '<button class="popup-button" data-listing-id="' + item.id + '">상세 보기</button>'
        );
        marker.on('popupopen', function() {
          const popup = marker.getPopup().getElement();
          const button = popup && popup.querySelector('[data-listing-id]');
          if (button) button.onclick = function() { sendSelect(item.id); };
        });
      });

      if (!fitted) {
        map.fitBounds(bounds, { padding: [42, 42], maxZoom: 15 });
        fitted = true;
      }
    };

    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'update-nearby-items') {
        window.updateNearbyItems(event.data.items || []);
      }
    });
  </script>
</body>
</html>`;
}

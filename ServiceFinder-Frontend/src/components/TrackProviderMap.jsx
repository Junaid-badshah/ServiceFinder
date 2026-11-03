import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const providerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const customerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

function MapBounds({ customerPos, providerPos }) {
  const map = useMap();
  useEffect(() => {
    if (customerPos && providerPos) {
      const bounds = L.latLngBounds([customerPos, providerPos]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (providerPos) {
      map.setView(providerPos, 15);
    } else if (customerPos) {
      map.setView(customerPos, 15);
    }
  }, [customerPos, providerPos, map]);
  return null;
}

// 👇 NAYA: customerLat, customerLng props add kiye hain
export default function TrackProviderMap({ customerLocation, customerLat, customerLng, providerLat, providerLng }) {
  const [customerPos, setCustomerPos] = useState(null);
  const [providerPos, setProviderPos] = useState(null);
  const [route, setRoute] = useState([]);

  // 👇 Direct coordinates use karein, agar na hon toh text se dhoondein
  useEffect(() => {
    if (customerLat && customerLng) {
      setCustomerPos([customerLat, customerLng]);
    } else if (customerLocation) {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(customerLocation)}&limit=1`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) setCustomerPos([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        })
        .catch(err => console.error(err));
    }
  }, [customerLocation, customerLat, customerLng]);

  useEffect(() => {
    if (providerLat && providerLng) setProviderPos([providerLat, providerLng]);
  }, [providerLat, providerLng]);

  // Route fetching logic (Green Path)
  useEffect(() => {
    if (customerPos && providerPos) {
      fetch(`https://router.project-osrm.org/route/v1/driving/${providerPos[1]},${providerPos[0]};${customerPos[1]},${customerPos[0]}?overview=full&geometries=geojson`)
        .then(res => res.json())
        .then(data => {
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            setRoute(coords);
          } else {
            setRoute([providerPos, customerPos]); // Fallback to straight line
          }
        })
        .catch(() => setRoute([providerPos, customerPos]));
    }
  }, [customerPos, providerPos]);

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 mt-3 relative z-0">
      <MapContainer center={[33.6844, 73.0479]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }} zoomControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapBounds customerPos={customerPos} providerPos={providerPos} />
        
        {/* Green Route Line */}
        {route.length > 0 && <Polyline positions={route} color="#10b981" weight={6} opacity={0.8} />}

        {customerPos && (
          <Marker position={customerPos} icon={customerIcon}>
            <Popup>Customer Location</Popup>
          </Marker>
        )}
        
        {providerPos && (
          <Marker position={providerPos} icon={providerIcon}>
            <Popup>Provider Live Location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapRecenter({ center, shouldRecenter }) {
  const map = useMap();
  useEffect(() => {
    if (center && shouldRecenter) map.setView(center, 15);
  }, [center, shouldRecenter, map]);
  return null;
}

function shortenAddress(addr, maxParts = 3) {
  if (!addr) return '';
  const parts = addr.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length <= maxParts) return addr;
  return parts.slice(0, maxParts).join(', ');
}

function buildAddressFromPhoton(props) {
  const parts = [
    props.name, props.housenumber, props.street, props.district,
    props.city, props.state, props.postcode, props.country,
  ].filter(Boolean);
  return parts.join(', ');
}

function LocationInput({ value, onChange, placeholder = 'Enter Location' }) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [mapCenter, setMapCenter] = useState([33.6844, 73.0479]);
  const [markerPos, setMarkerPos] = useState(null);
  const [searchText, setSearchText] = useState(value || '');
  const [selectedAddress, setSelectedAddress] = useState(value || '');
  const [shouldRecenter, setShouldRecenter] = useState(false);
  const [searchError, setSearchError] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    setSearchText(value || '');
    setSelectedAddress(value || '');
  }, [value]);

  const fetchSuggestions = async (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]); setSearchError(''); return;
    }
    setLoading(true); setSearchError('');
    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10&lang=en`;
      const photonRes = await fetch(photonUrl);
      const photonData = await photonRes.json();

      if (photonData.features && photonData.features.length > 0) {
        setSuggestions(photonData.features.map((f) => ({
          source: 'photon',
          display: buildAddressFromPhoton(f.properties),
          name: f.properties.name || f.properties.street || f.properties.city || f.properties.state || 'Location',
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
        })));
        setLoading(false); return;
      }

      const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1`;
      const nomRes = await fetch(nomUrl, { headers: { 'Accept-Language': 'en' } });
      const nomData = await nomRes.json();

      if (nomData && nomData.length > 0) {
        setSuggestions(nomData.map((s) => ({
          source: 'nominatim',
          display: s.display_name,
          name: s.name || s.display_name.split(',')[0],
          lat: parseFloat(s.lat),
          lng: parseFloat(s.lon),
        })));
      } else {
        setSuggestions([]); setSearchError('Koi result nahi mila.');
      }
    } catch (err) {
      setSuggestions([]); setSearchError('Search failed.');
    } finally { setLoading(false); }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchText(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 400);
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}&lang=en`);
      const data = await res.json();
      if (data.features && data.features[0]) return buildAddressFromPhoton(data.features[0].properties);
      const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const nomData = await nomRes.json();
      if (nomData && nomData.display_name) return nomData.display_name;
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch { return `${lat.toFixed(4)}, ${lng.toFixed(4)}`; }
  };

  const handleMapClick = async (lat, lng) => {
    setMarkerPos([lat, lng]);
    const addr = await reverseGeocode(lat, lng);
    setSelectedAddress(addr);
  };

  const handleSuggestionClick = (s) => {
    setMarkerPos([s.lat, s.lng]);
    setMapCenter([s.lat, s.lng]);
    setShouldRecenter(true);
    setSelectedAddress(s.display);
    setSearchText(s.display);
    setSuggestions([]);
    setTimeout(() => setShouldRecenter(false), 500);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return alert('Browser does not support location');
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setMarkerPos([latitude, longitude]);
        setMapCenter([latitude, longitude]);
        setShouldRecenter(true);
        const addr = await reverseGeocode(latitude, longitude);
        setSelectedAddress(addr);
        setSearchText(addr);
        setDetecting(false);
        setTimeout(() => setShouldRecenter(false), 500);
      },
      () => { alert('Location access denied'); setDetecting(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 👇 YAHAN CHANGE KIYA HAI: Coordinates bhi pass kar rahe hain 👇
  const handleConfirm = async () => {
    let finalAddress = selectedAddress;
    let lat = markerPos ? markerPos[0] : (mapCenter ? mapCenter[0] : null);
    let lng = markerPos ? markerPos[1] : (mapCenter ? mapCenter[1] : null);

    if (!finalAddress && mapCenter) {
      finalAddress = await reverseGeocode(mapCenter[0], mapCenter[1]);
    }

    if (finalAddress) {
      onChange(finalAddress, lat, lng); // Pass address, lat, lng
      setSearchText(finalAddress);
      setOpen(false);
    } else {
      alert('Pehle location select karo');
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setSearchText(value || '');
    setSelectedAddress(value || '');
    setSuggestions([]);
    setSearchError('');
  };

  const displayValue = value ? shortenAddress(value, 3) : '';

  return (
    <>
      <div className="flex-1 relative min-w-0">
        <button type="button" onClick={handleOpen} title={value || placeholder} className="w-full flex items-center gap-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 min-h-[56px] text-left transition overflow-hidden">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className={`flex-1 text-sm md:text-base truncate ${value ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>{displayValue || placeholder}</span>
          <span className="text-xs text-primary-600 font-semibold flex-shrink-0 hidden md:inline">📍 Map</span>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">📍 Select Your Location</h3>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-4 border-b border-gray-200 dark:border-gray-700 relative">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                  <input type="text" value={searchText} onChange={handleInputChange} placeholder="Search location..." className="flex-1 border-0 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none text-sm" autoFocus />
                  {loading && <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>}
                </div>
                <button type="button" onClick={handleCurrentLocation} disabled={detecting} className="p-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white transition flex-shrink-0" title="Use current location">
                  {detecting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /><circle cx="12" cy="12" r="8" /></svg>}
                </button>
              </div>

              {suggestions.length > 0 && (
                <div className="absolute top-full left-4 right-4 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1 max-h-72 overflow-y-auto z-[10000]">
                  {suggestions.map((s, idx) => (
                    <button key={idx} type="button" onClick={() => handleSuggestionClick(s)} className="w-full px-3 py-2.5 text-left flex items-start gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{s.name}</p><p className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.display}</p></div>
                    </button>
                  ))}
                </div>
              )}
              {!loading && searchError && (
                <div className="absolute top-full left-4 right-4 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 z-[10000]"><p className="text-xs text-gray-500 text-center">{searchError}</p></div>
              )}
            </div>

            <div className="h-[400px] w-full relative">
              <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapClickHandler onMapClick={handleMapClick} />
                <MapRecenter center={mapCenter} shouldRecenter={shouldRecenter} />
                {markerPos && <Marker position={markerPos} />}
              </MapContainer>
            </div>

            {selectedAddress && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Selected Location:</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">📍 {selectedAddress}</p>
              </div>
            )}

            <div className="p-4 flex gap-2 border-t border-gray-200 dark:border-gray-700">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 py-2.5 rounded-lg font-semibold transition">Cancel</button>
              <button type="button" onClick={handleConfirm} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-semibold transition">✅ Confirm Location</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LocationInput;

import { useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import LocationInput from "../search/LocationInput";
import CameraCapture from "./CameraCapture";

const LOCATION_TYPES = [
  { value: 'HOME', icon: '🏠', label: 'Home' },
  { value: 'SHOP', icon: '🏪', label: 'Shop' },
  { value: 'OFFICE', icon: '🏢', label: 'Office' },
  { value: 'OTHER', icon: '📍', label: 'Other' },
];

function RequestForm({ providerId, onSuccess, onCancel }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    message: "",
    location: "",
    latitude: null,
    longitude: null,
    locationType: "HOME",
    locationNote: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [images, setImages] = useState([]);

  const validateForm = () => {
    if (!form.location || !form.location.trim()) return "Please select your location on the map";
    if (!form.message || form.message.trim().length < 5) return "Please describe your problem (at least 5 characters)";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        user: { id: user.id },
        provider: { id: parseInt(providerId) },
        message: form.message.trim(),
        location: form.location,
        latitude: form.latitude,
        longitude: form.longitude,
        locationType: form.locationType,
        locationNote: form.locationNote?.trim() || null,
        status: "PENDING",
        imageData: JSON.stringify(images),
      };
      await api.post("/requests", payload);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
      "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500";

  const handleAddImage = (img) => {
    if (images.length >= 4) {
      alert("Aap maximum 4 tasveerein add kar sakte hain.");
      return;
    }
    setImages([...images, img]);
    setShowCamera(false);
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  return (
      <> 
        <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg space-y-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Request Service</h3>

          {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm font-medium">
                ⚠️ {error}
              </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kahan service chahiye? *</label>
            <div className="grid grid-cols-4 gap-2">
              {LOCATION_TYPES.map((t) => (
                  <button key={t.value} type="button" onClick={() => setForm({ ...form, locationType: t.value })}
                          className={`p-3 rounded-xl border-2 transition text-center ${form.locationType === t.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300'}`}>
                    <div className="text-2xl mb-1">{t.icon}</div>
                    <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{t.label}</div>
                  </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Location *</label>
            <div className="rounded-xl overflow-hidden">
              <LocationInput 
                value={form.location} 
                onChange={(val, lat, lng) => setForm({ ...form, location: val, latitude: lat, longitude: lng })} 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location Note (optional)</label>
            <input type="text" value={form.locationNote}
                   onChange={(e) => setForm({ ...form, locationNote: e.target.value })}
                   className={inputClass} placeholder="e.g. 3rd floor, near Imtiaz store" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">What do you need? *</label>
            <textarea placeholder="Describe your problem (min 5 characters)" rows="3" required
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className={inputClass} />
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Problem Photos (Max 4)</label>
            <div className="flex flex-wrap gap-3 mb-3">
              {images.map((img, index) => (
                <div key={index} className="relative inline-block">
                  <img src={img} alt={`Problem ${index}`} className="h-24 w-24 object-cover rounded-lg border-2 border-primary-500" />
                  <button type="button" onClick={() => handleRemoveImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600 shadow-md">✕</button>
                </div>
              ))}
              {images.length < 4 && (
                <button type="button" onClick={() => setShowCamera(true)} className="h-24 w-24 flex flex-col items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-semibold text-xs transition border-2 border-dashed border-gray-400 dark:border-gray-500">
                  <span className="text-2xl">📷</span>Add Photo
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">Aap 4 tasveerein tak add kar sakte hain. (Optional)</p>
          </div>

          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={submitting} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50 transition">{submitting ? "Submitting..." : "Submit Request"}</button>
            <button type="button" onClick={onCancel} className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 px-6 rounded-lg font-semibold text-gray-800 dark:text-gray-100 transition">Cancel</button>
          </div>
        </form>

        {showCamera && (
            <CameraCapture onCapture={handleAddImage} onCancel={() => setShowCamera(false)} requireFace={false} />
        )}
      </>
  );
}

export default RequestForm;

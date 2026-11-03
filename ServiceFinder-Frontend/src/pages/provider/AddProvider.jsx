import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProvider, getServices } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CameraCapture from '../../components/providers/CameraCapture';
import LocationInput from '../../components/search/LocationInput';
import api from '../../services/api';

const FALLBACK_SERVICES = [
  { name: 'Electrician' }, { name: 'Plumber' }, { name: 'AC Technician' },
  { name: 'Computer Repair' }, { name: 'Tutor' }, { name: 'Painter' },
];

function AddProvider() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState(FALLBACK_SERVICES);
  const [form, setForm] = useState({
    service: '',
    location: '',
    experience: '',
    rate: '',
    phone: user?.phone || '',
    description: '',
  });
  const [showCamera, setShowCamera] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 👇 NAYA: Har field ke error ko track karne ke liye state 👇
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getServices();
        if (res.data && res.data.length > 0) setServices(res.data);
      } catch (err) {
        console.error('Services load failed:', err);
      }
    };
    load();
  }, []);

  const update = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    // Jab user type kare, to us field ka error hata dein
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // 👇 NAYA: Validation Function 👇
  const validateForm = () => {
    const errs = {};
    if (!profileImage) errs.profileImage = 'Profile Picture required';
    if (!form.service) errs.service = 'Service Type required';
    if (!form.location) errs.location = 'Location required';
    if (!form.experience && form.experience !== 0) errs.experience = 'Experience required';
    if (!form.rate) errs.rate = 'Rate required';
    if (!form.phone) errs.phone = 'Phone Number required';
    if (!form.description) errs.description = 'Description required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation check
    const errs = validateForm();
    setValidationErrors(errs);

    if (Object.keys(errs).length > 0) {
      const fieldNames = {
        profileImage: 'Profile Picture', service: 'Service Type', location: 'Location',
        experience: 'Experience', rate: 'Rate', phone: 'Phone Number', description: 'Description'
      };
      const missing = Object.values(errs).map(err => err.split(' ')[0]).join(', ');
      setError(`Please fill the required information: ${missing}`);
      return; // Form submit hone se rokein
    }
    
    setLoading(true);
    try {
      await api.put('/profile/picture', { profilePicture: profileImage });
      await createProvider({ ...form, name: user.name, userId: user.id, rating: 0.0 });
      setSuccess('Provider profile created!');
      
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to add provider');
    } finally {
      setLoading(false);
    }
  };

  // 👇 NAYA: Input Class Function (Error aane par border red karne ke liye) 👇
  const getInputClass = (fieldName) => {
    const base = 'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-colors';
    if (validationErrors[fieldName]) {
      return `${base} border-red-500 dark:border-red-500 focus:ring-red-500`;
    }
    return `${base} border-gray-300 dark:border-gray-600 focus:ring-primary-500`;
  };

  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
          Add Your Service (Required to continue)
        </h1>

        {/* Error Message Box */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg mb-4 text-sm text-center font-semibold">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg mb-4 text-sm text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          
          {/* Profile Picture Section */}
          <div className={`flex flex-col items-center justify-center mb-6 p-4 rounded-xl border-2 transition-colors ${validationErrors.profileImage ? 'bg-red-50 dark:bg-red-900/10 border-red-400' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700'}`}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">
              Upload Your Profile Picture *
            </label>
            
            <div className="flex flex-col items-center gap-3">
              {profileImage ? (
                <div className="relative">
                  <img src={profileImage} alt="Profile" className="w-28 h-28 object-cover rounded-full border-4 border-primary-500 shadow-md" />
                  <button 
                    type="button" 
                    onClick={() => setProfileImage('')} 
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold hover:bg-red-600 shadow-sm"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowCamera(true);
                    setValidationErrors(prev => ({...prev, profileImage: null}));
                  }}
                  className={`w-28 h-28 rounded-full bg-white dark:bg-gray-800 border-2 border-dashed flex flex-col items-center justify-center transition shadow-sm ${validationErrors.profileImage ? 'border-red-500 text-red-500' : 'border-gray-400 dark:border-gray-500 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <span className="text-3xl mb-1">📷</span>
                  <span className="text-xs font-semibold">Add Photo</span>
                </button>
              )}
              
              <p className={`text-xs text-center max-w-[250px] ${validationErrors.profileImage ? 'text-red-500 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                {validationErrors.profileImage ? 'Please add a profile picture.' : 'Apni saaf chehre ki tasveer lagayen taake customer aapko pehchan sake.'}
              </p>
            </div>
          </div>

          {/* Service Type */}
          <div>
            <label className={labelClass}>Service Type *</label>
            <select required value={form.service} onChange={(e) => update('service', e.target.value)} className={getInputClass('service')}>
              <option value="">-- Select service --</option>
              {services.map((s, idx) => (
                <option key={s.id || idx} value={s.name}>
                  {s.icon ? `${s.icon} ` : ''}{s.name}
                </option>
              ))}
            </select>
            {validationErrors.service && <p className="text-xs text-red-500 mt-1 font-semibold">Please select a service type</p>}
          </div>

          {/* Location */}
          <div>
            <label className={labelClass}>Your Location *</label>
            <div className={`rounded-xl overflow-hidden border transition-colors ${validationErrors.location ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'}`}>
              <LocationInput value={form.location} onChange={(val) => update('location', val)} placeholder="Select location on map" />
            </div>
            {validationErrors.location && <p className="text-xs text-red-500 mt-1 font-semibold">Please select your location on the map</p>}
          </div>

          {/* Experience & Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Experience (years) *</label>
              <input type="number" value={form.experience} min="0" onChange={(e) => update('experience', e.target.value)} className={getInputClass('experience')} placeholder="e.g. 5" />
              {validationErrors.experience && <p className="text-xs text-red-500 mt-1 font-semibold">Experience is required</p>}
            </div>
            <div>
              <label className={labelClass}>Rate (PKR) *</label>
              <input type="number" value={form.rate} min="0" onChange={(e) => update('rate', e.target.value)} className={getInputClass('rate')} placeholder="e.g. 1500" />
              {validationErrors.rate && <p className="text-xs text-red-500 mt-1 font-semibold">Rate is required</p>}
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className={labelClass}>Phone Number *</label>
            <input type="text" value={form.phone} onChange={(e) => update('phone', e.target.value)} className={getInputClass('phone')} placeholder="0300-1234567" />
            {validationErrors.phone && <p className="text-xs text-red-500 mt-1 font-semibold">Phone number is required</p>}
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description *</label>
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows="3" className={getInputClass('description')} placeholder="Apne kaam ke baare mein likho..." />
            {validationErrors.description && <p className="text-xs text-red-500 mt-1 font-semibold">Description is required</p>}
          </div>

          <button type="submit" disabled={loading} className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition">
            {loading ? 'Adding...' : 'Submit Service'}
          </button>
        </form>
      </div>

      {showCamera && (
        <CameraCapture 
          onCapture={(img) => { setProfileImage(img); setValidationErrors(prev => ({...prev, profileImage: null})); setShowCamera(false); }} 
          onCancel={() => setShowCamera(false)}
          requireFace={true}
        />
      )}
    </div>
  );
}

export default AddProvider;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function FindService() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    serviceName: 'Plumber',
    message: '',
    location: 'Lahore, Pakistan',
    preferredDate: '',
    preferredTime: '',
  });

  const services = [
    { name: 'Plumber', icon: '🔧' }, { name: 'Electrician', icon: '⚡' },
    { name: 'Carpenter', icon: '🪚' }, { name: 'AC Technician', icon: '❄️' },
    { name: 'Car Mechanic', icon: '🚗' }, { name: 'Painter', icon: '🎨' },
  ];

  const next = () => { 
    if (step === 1 && !formData.message) return setError('Please describe your problem.'); 
    setError(''); 
    setStep(s => s + 1); 
  };
  const prev = () => { setError(''); setStep(s => s - 1); };

  const submit = async () => {
    setLoading(true); setError('');
    try {
      await api.post('/requests', { 
        user: { id: user.id }, 
        serviceName: formData.serviceName,
        message: formData.message,
        location: formData.location,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
      });
      setSuccess('Request sent to nearby providers!');
      setTimeout(() => navigate('/my-requests'), 2000);
    }  { setError(err.response?.data?.error || 'Failed to submit.'); } 
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 mt-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Request Service</h2>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm font-semibold">⚠️ {error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-3 rounded-xl mb-6 text-sm font-semibold">✅ {success}</div>}

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">1. What do you need?</h3>
            <div className="grid grid-cols-3 gap-3">
              {services.map((s) => (
                <button key={s.name} onClick={() => setFormData({...formData, serviceName: s.name})}
                  className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${formData.serviceName === s.name ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                  <span className="text-3xl mb-2">{s.icon}</span>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{s.name}</span>
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Describe your problem</label>
              <textarea rows="3" placeholder="e.g. Water leakage..." value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"></textarea>
            </div>
            <button onClick={next} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-md transition-all">Next: Location →</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
             <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">2. Location & Time</h3>
             <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Your Location</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium" />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Date</label>
                 <input type="date" value={formData.preferredDate} onChange={(e) => setFormData({...formData, preferredDate: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium" />
               </div>
               <div>
                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Time</label>
                 <input type="time" value={formData.preferredTime} onChange={(e) => setFormData({...formData, preferredTime: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium" />
               </div>
             </div>
             <div className="flex gap-4 pt-4">
               <button onClick={prev} className="w-1/3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 py-4 rounded-xl font-bold">Back</button>
               <button onClick={submit} disabled={loading} className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-md disabled:opacity-50">{loading ? 'Sending...' : 'Confirm & Send'}</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

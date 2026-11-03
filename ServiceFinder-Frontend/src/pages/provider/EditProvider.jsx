import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProviderById, updateProvider } from '../../services/api';
import { useAuth } from '../../context/AuthContext'; // 👈 Naya Import

function EditProvider() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // 👈 Role check ke liye

  const [form, setForm] = useState({
    name: '', service: '', location: '', experience: '',
    rate: '', phone: '', description: '',
    availableDays: '', availableTime: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getProviderById(id);
        const p = res.data;
        setForm({
          name: p.name || '',
          service: p.service || '',
          location: p.location || '',
          experience: p.experience || '',
          rate: p.rate || '',
          phone: p.phone || '',
          description: p.description || '',
          availableDays: p.availableDays || '',
          availableTime: p.availableTime || '',
        });
      } catch (err) {
        setError('Provider not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await updateProvider(id, form);

      // 👇 YAHAN FIX KITA HAI 👇
      if (user && user.role === 'ADMIN') {
        navigate('/providers');
      } else {
        navigate('/my-services');
      }

    } catch (err) {
      setError('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>;

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
            Edit Provider
          </h1>

          {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">
                {error}
              </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Name *</label>
              <input type="text" required value={form.name}
                     onChange={(e) => update('name', e.target.value)}
                     className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Service *</label>
              <input type="text" required value={form.service}
                     onChange={(e) => update('service', e.target.value)}
                     className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Location *</label>
              <input type="text" required value={form.location}
                     onChange={(e) => update('location', e.target.value)}
                     className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Experience (years)</label>
                <input type="number" value={form.experience}
                       onChange={(e) => update('experience', e.target.value)}
                       className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Rate (PKR)</label>
                <input type="number" value={form.rate}
                       onChange={(e) => update('rate', e.target.value)}
                       className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Phone</label>
              <input type="text" value={form.phone}
                     onChange={(e) => update('phone', e.target.value)}
                     className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea value={form.description}
                        onChange={(e) => update('description', e.target.value)}
                        rows="3" className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Available Days</label>
                <input type="text" value={form.availableDays}
                       onChange={(e) => update('availableDays', e.target.value)}
                       className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Available Time</label>
                <input type="text" value={form.availableTime}
                       onChange={(e) => update('availableTime', e.target.value)}
                       className={inputClass} />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => navigate(-1)}
                      className="px-6 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 text-gray-800 dark:text-gray-100 rounded-lg font-semibold transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}

export default EditProvider;
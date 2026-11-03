import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProviders, deleteProvider } from '../../services/api';
import api from '../../services/api';
import SearchBar from '../../components/search/SearchBar';

function Providers() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const location = useLocation();
  const isMyServices = location.pathname === '/my-services';

  const searchService = searchParams.get('service') || '';
  const searchLocation = searchParams.get('location') || '';

  const loadProviders = async () => {
    setLoading(true);
    try {
      let list = [];

      if (isMyServices) {
        const myRes = await api.get('/providers/my');
        list = myRes.data || [];

        // "Not Specified" ya khali services ko hide karne ke liye
        list = list.filter(p => p.service && p.service.trim() !== '' && p.service !== 'Not Specified');
      } else {
        const pRes = await getProviders(searchService, searchLocation);
        list = pRes.data || [];
      }

      if (!isMyServices) {
        if (user && user.role === 'PROVIDER') {
          list = [...list].sort((a, b) => {
            const aMine = a.userId === user.id ? 1 : 0;
            const bMine = b.userId === user.id ? 1 : 0;
            return bMine - aMine;
          });
        } else if (user && user.role === 'ADMIN') {
          list = [...list].sort((a, b) => (b.id || 0) - (a.id || 0));
        }
      }

      setProviders(list);
    } catch (err) {
      setError('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, [searchParams, isMyServices]);

  const handleSearch = ({ service, location }) => {
    const params = new URLSearchParams();
    if (service) params.set('service', service);
    if (location) params.set('location', location);
    setSearchParams(params);
  };

  const canManage = (provider) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (user.role === 'PROVIDER') return provider.userId === user.id;
    return false;
  };

  const isMine = (provider) => {
    return user && user.role === 'PROVIDER' && provider.userId === user.id;
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this provider?')) return;
    try {
      await deleteProvider(id);
      loadProviders();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit-provider/${id}`);
  };

  const colors = [
    'bg-blue-500',
    'bg-teal-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-pink-500',
    'bg-yellow-500',
  ];

  const hasFilter = searchService || searchLocation;

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

        {!isMyServices && (
            <SearchBar
                initialService={searchService}
                initialLocation={searchLocation}
                onSearch={handleSearch}
                variant="gradient"
            />
        )}

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
              {isMyServices ? 'My Services' : (hasFilter ? 'Search Results' : 'All Providers')}
            </h1>
            {!loading && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {providers.length} provider{providers.length !== 1 ? 's' : ''} found
                </p>
            )}
          </div>

          {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">
                {error}
              </div>
          )}

          {loading && (
              <p className="text-center py-20 text-gray-500">Loading providers...</p>
          )}

          {!loading && providers.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
                <p className="text-6xl mb-3">🔍</p>
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                  {isMyServices
                      ? 'Aapne abhi tak koi service add nahi ki hai'
                      : (hasFilter
                          ? 'Koi provider nahi mila is search ke liye'
                          : 'Abhi koi provider nahi hai')}
                </p>
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {providers.map((p, i) => {
              const manageable = canManage(p);
              const mine = isMine(p);
              const showNew = user?.role === 'ADMIN' && i === 0;

              return (
                  <div
                      key={p.id}
                      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 ${
                          mine ? 'ring-4 ring-yellow-400' : ''
                      } ${showNew && !mine ? 'ring-4 ring-green-400' : ''}`}
                  >
                    <div className={`${colors[i % colors.length]} p-4 text-white relative flex items-center gap-3`}>
                      {mine && (
                          <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full z-10">
                            ★ Your Card
                          </span>
                      )}
                      {showNew && !mine && (
                          <span className="absolute top-2 right-2 bg-green-400 text-green-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse z-10">
                            🆕 NEW
                          </span>
                      )}

                      <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/50 shrink-0 shadow-sm">
                        {p.profilePicture ? (
                            <img src={p.profilePicture} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xl font-bold">{p.name?.charAt(0).toUpperCase() || '?'}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-16">
                        <h2 className="text-xl font-bold truncate">{p.name}</h2>
                        <p className="text-sm opacity-90 truncate">{p.service}</p>
                      </div>
                    </div>

                    <div className="p-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <p>📍 {p.location}</p>
                      <p>📅 {p.experience} years exp.</p>
                      <p>⭐ {p.rating ? `${p.rating}/5` : 'New Provider'}</p>
                      
                      {/* 👇 NAYA: Admin ko Wallet Balance show hoga 👇 */}
                      {user?.role === 'ADMIN' && (
                        <p className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-yellow-700 dark:text-yellow-400 font-bold border border-yellow-200 dark:border-yellow-800">
                          💰 Wallet Balance: Rs. {p.walletBalance || 0}
                        </p>
                      )}

                      {p.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">
                            {p.description}
                          </p>
                      )}
                    </div>

                    <div className="p-4 pt-0 space-y-2">
                      <button
                          onClick={() => navigate(`/providers/${p.id}`)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold text-sm transition"
                      >
                        View Details
                      </button>

                      {manageable && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleEdit(p.id)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg font-semibold text-sm transition"
                            >
                              Edit
                            </button>
                            <button
                                onClick={() => handleDelete(p.id)}
                                className="bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold text-sm transition"
                            >
                              Delete
                            </button>
                          </div>
                      )}
                    </div>
                  </div>
              );
            })}
          </div>
        </div>
      </div>
  );
}

export default Providers;

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ChatWindow from '../../components/chat/ChatWindow';
import TrackProviderMap from '../../components/TrackProviderMap';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ACTIVE');
  const [walletBalance, setWalletBalance] = useState(0);

  const [isHidden, setIsHidden] = useState(false);
  const [requiredCommission, setRequiredCommission] = useState(0);
  
  // 👇 NAYA: Wallet Alert Popup ke liye state 👇
  const [walletAlertShown, setWalletAlertShown] = useState(false);

  const [showChat, setShowChat] = useState(false);
  const [chatData, setChatData] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReqId, setCancelReqId] = useState(null);
  const [cancelCategory, setCancelCategory] = useState('');
  const [cancelDesc, setCancelDesc] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const [timeLeft, setTimeLeft] = useState({});

  const [seenIds, setSeenIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`seenRequests_${user?.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const watchIdRef = useRef(null);
  const activeIdsRef = useRef([]);

  const fetchWalletBalance = async () => {
    try {
      const res = await api.get('/wallet');
      setWalletBalance(Number(res.data.balance) || 0);
    } catch (err) { }
  };

  const loadRequests = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const provRes = await api.get('/providers/my');
      const myProviders = provRes.data || [];

      // 👇 NAYA SECURITY CHECK (Direct URL se aane par) 👇
      if (myProviders.length === 0) { 
        navigate('/add-provider'); 
        return; 
      }

      const promises = myProviders.map(p => api.get(`/requests/provider/${p.id}`));
      const responses = await Promise.all(promises);

      let allReqs = [];
      responses.forEach(res => {
        allReqs = [...allReqs, ...(res.data || [])];
      });

      const sorted = allReqs.sort((a, b) => {
        const aPending = (a.status || '').toUpperCase() === 'PENDING' ? 1 : 0;
        const bPending = (b.status || '').toUpperCase() === 'PENDING' ? 1 : 0;
        if (aPending !== bPending) return bPending - aPending;
        return (b.id || 0) - (a.id || 0);
      });
      setRequests(sorted);

      const profileRes = await api.get('/profile/me');
      const p = profileRes.data.providerProfile;

      if (p) {
        let calcComm = Number(p.requiredCommission) || 0;
        if (calcComm < 100) calcComm = 100;

        setRequiredCommission(calcComm);
        setIsHidden(p.isHidden || false);
      }

    } catch (err) { setRequests([]); }
    finally { if (!isSilent) setLoading(false); }
  };

  useEffect(() => {
    fetchWalletBalance();
    loadRequests();

    const interval = setInterval(() => {
      loadRequests(true); 
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 👇 NAYA: Wallet Alert (Sirf naye login par ek dafa show hoga) 👇
  useEffect(() => {
    if (!loading && requiredCommission > 0 && walletBalance < requiredCommission && !walletAlertShown) {
      alert("Welcome to ServiceFinder! Please add money to your Provider Wallet and complete the required next steps to start receiving requests.");
      setWalletAlertShown(true);
    }
  }, [loading, walletBalance, requiredCommission, walletAlertShown]);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = {};
      requests.forEach(r => {
        if (r.status === 'PENDING' && r.expiresAt) {
          const diff = new Date(r.expiresAt).getTime() - new Date().getTime();
          if (diff > 0) {
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            newTimeLeft[r.id] = `${mins}:${secs.toString().padStart(2, '0')}`;
          } else {
            newTimeLeft[r.id] = 'Expired';
          }
        }
      });
      setTimeLeft(newTimeLeft);
    }, 1000);
    return () => clearInterval(timer);
  }, [requests]);

  useEffect(() => {
    activeIdsRef.current = requests.filter(r => ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes((r.status || '').toUpperCase())).map(r => r.id);
  }, [requests]);

  useEffect(() => {
    if (navigator.geolocation && !watchIdRef.current) {
      watchIdRef.current = navigator.geolocation.watchPosition(
          async (pos) => {
            const ids = activeIdsRef.current;
            if (ids.length === 0) return;
            try {
              for (const id of ids) {
                await api.put(`/requests/${id}/location`, { lat: pos.coords.latitude, lng: pos.coords.longitude });
              }
            } catch (err) { }
          },
          (err) => console.error("Location error:", err),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/chat/unread');
        setUnreadCounts(res.data || {});
      } catch (err) { }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (requests.length === 0) return;
    const timer = setTimeout(() => {
      const currentIds = requests.map((r) => r.id);
      const merged = Array.from(new Set([...seenIds, ...currentIds]));
      localStorage.setItem(`seenRequests_${user.id}`, JSON.stringify(merged));
      setSeenIds(merged);
    }, 3000);
    return () => clearTimeout(timer);
  }, [requests]);

  const handleAccept = async (id) => {
    try {
      await api.put(`/requests/${id}/accept`);
      await fetchWalletBalance();
      loadRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept request');
      loadRequests();
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/requests/${id}/reject`);
      loadRequests();
    } catch (err) { alert('Failed to reject request'); }
  };

  const handleCompleteService = async (id) => {
    if (!window.confirm('Have you completed the service?')) return;
    try {
      await api.put(`/requests/${id}/complete`);
      await fetchWalletBalance();
      loadRequests();
    } catch (err) { alert('Failed to complete service'); }
  };

  const handleCancelRequest = async () => {
    if (!cancelCategory) return alert('Please select a reason category');
    if (cancelCategory === 'Other' && !cancelDesc.trim()) return alert('Please describe your reason');
    setCancelling(true);
    try {
      await api.post(`/requests/${cancelReqId}/request-cancel`, { cancelledBy: 'PROVIDER', category: cancelCategory, description: cancelDesc });
      alert('✅ Cancellation request sent to Admin for review.');
      setShowCancelModal(false);
      loadRequests();
    } catch (err) { alert('Failed to send cancellation request'); }
    finally { setCancelling(false); }
  };

  const deleteRequest = async (id) => {
    if (!window.confirm('Delete this request?')) return;
    try { await api.delete(`/requests/${id}`); loadRequests(); }
    catch (err) { alert('Delete failed'); }
  };

  const activeStatuses = ['PENDING', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'CANCELLATION_PENDING'];

  const filtered = requests.filter((r) => {
    const st = (r.status || '').toUpperCase();
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return activeStatuses.includes(st);
    return st === filter;
  });

  const total = requests.length;
  const activeCount = requests.filter((r) => activeStatuses.includes((r.status || '').toUpperCase())).length;
  const pending = requests.filter((r) => (r.status || '').toUpperCase() === 'PENDING').length;
  const completed = requests.filter((r) => (r.status || '').toUpperCase() === 'COMPLETED').length;
  const rejected = requests.filter((r) => (r.status || '').toUpperCase() === 'REJECTED').length;
  const cancelled = requests.filter((r) => (r.status || '').toUpperCase() === 'CANCELLED').length;
  const expired = requests.filter((r) => (r.status || '').toUpperCase() === 'EXPIRED').length;

  const StatCard = ({ label, value, color }) => (
      <div className={`rounded-xl p-4 border-2 ${color} bg-white dark:bg-gray-800`}>
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{value}</p>
      </div>
  );

  const timeAgo = (ts) => {
    if (!ts) return '-';
    const now = new Date();
    const tsWithTZ = typeof ts === 'string' && !ts.includes('Z') && !ts.includes('+') ? ts + 'Z' : ts;
    const past = new Date(tsWithTZ);
    const diffMs = now - past;
    if (diffMs < 0) return 'just now';
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + ' min ago';
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + ' hr ago';
    const days = Math.floor(hours / 24);
    if (days < 7) return days + ' day' + (days > 1 ? 's' : '') + ' ago';
    return past.toLocaleDateString();
  };

  const LOCATION_TYPE_LABELS = { HOME: '🏠 Home', SHOP: '🏪 Shop', OFFICE: '🏢 Office', OTHER: '📍 Other' };

  const parseImages = (imageDataString) => {
    if (!imageDataString) return [];
    try {
      const parsed = JSON.parse(imageDataString);
      return Array.isArray(parsed) ? parsed : [imageDataString];
    } catch (e) { return [imageDataString]; }
  };

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-500 mb-6">Provider Dashboard</h1>

          {walletBalance < requiredCommission && (
              <div className="bg-red-600 text-white p-5 rounded-xl shadow-lg mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-8 border-red-800">
                <div>
                  <h2 className="text-2xl font-black mb-2 flex items-center gap-2">WALLET BALANCE KAM HAI!</h2>
                  <p className="text-lg font-bold mb-1">
                    Mojooda Wallet Balance: Rs. {walletBalance}
                  </p>
                  <p className="text-lg font-bold text-red-200 mb-3">
                    Zaroori Commission Pura Nahi Hai!
                  </p>
                  <p className="text-red-100 text-sm font-medium">
                    Apna wallet top-up karein taake aapka profile dobara customers ko nazar aaye.
                  </p>
                </div>
                <button onClick={() => navigate('/wallet')} className="bg-white text-red-700 hover:bg-gray-100 px-6 py-3 rounded-xl font-black text-lg shadow-md transition transform hover:scale-105 whitespace-nowrap">
                  💳 Top Up Wallet
                </button>
              </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
            <StatCard label="Total" value={total} color="border-gray-300 dark:border-gray-700" />
            <StatCard label="Active" value={activeCount} color="border-green-500" />
            <StatCard label="Pending" value={pending} color="border-yellow-500" />
            <StatCard label="Completed" value={completed} color="border-emerald-500" />
            <StatCard label="Rejected" value={rejected} color="border-red-500" />
            <StatCard label="Cancelled" value={cancelled} color="border-orange-500" />
            <StatCard label="Expired" value={expired} color="border-gray-500" />
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {['ALL', 'ACTIVE', 'PENDING', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED'].map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${filter === f ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>{f}</button>
            ))}
          </div>

          {loading && <p className="text-center text-gray-500 py-10">Loading...</p>}
          {!loading && filtered.length === 0 && <p className="text-center text-gray-500 py-10">No requests found</p>}

          <div className="space-y-4">
            {filtered.map((r) => {
              const st = (r.status || '').toUpperCase();
              const statusColor = st === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                  st === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                      st === 'ARRIVED' ? 'bg-purple-100 text-purple-700' :
                          st === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                              st === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
              const isNew = st === 'PENDING' && !seenIds.includes(r.id);
              const customerImages = parseImages(r.imageData);

              return (
                  <div key={r.id} className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border-2 ${isNew ? 'border-green-400 ring-2 ring-green-200' : 'border-transparent'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                          Request #{r.id}
                          {isNew && <span className="bg-green-400 text-green-900 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">🆕 NEW</span>}
                        </h3>
                        <p className="text-xs text-gray-500">Provider: {r.provider?.name || '-'} — {r.provider?.service || '-'}</p>
                        {r.createdAt && <p className="text-xs text-primary-600 font-medium mt-0.5" title={new Date(r.createdAt).toLocaleString()}>🕒 Request aya: {timeAgo(r.createdAt)}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {st === 'PENDING' && timeLeft[r.id] && (
                            <span className={`text-xs font-bold px-2 py-1 rounded ${timeLeft[r.id] === 'Expired' ? 'bg-red-200 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                            ⏳ {timeLeft[r.id]}
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>{st.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <p>Customer: <strong>{r.user?.name || '-'}</strong></p>
                      {st !== 'PENDING' && <p>Phone: {r.user?.phone || '-'}</p>}
                      <p className="md:col-span-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold">💰 Total Booking Price: Rs. {r.agreedPrice || r.offeredPrice || r.provider?.rate || 'Negotiable'}</p>
                      {r.locationType && <p>Type: <strong>{LOCATION_TYPE_LABELS[r.locationType] || r.locationType}</strong></p>}
                      {r.location && <p className="md:col-span-2">📍 <strong>Customer Location:</strong> <span className="text-primary-600 font-semibold">{r.location}</span></p>}
                      {r.locationNote && <p className="md:col-span-2">📝 <strong>Location Note:</strong> {r.locationNote}</p>}
                    </div>
                    {r.message && <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">{r.message}</p>}

                    {customerImages.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-2 font-semibold">📸 Customer's Photos ({customerImages.length}):</p>
                          <div className="flex flex-wrap gap-2">
                            {customerImages.map((img, index) => (<img key={index} src={img} alt={`Problem ${index}`} className="h-28 object-contain rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm" />))}
                          </div>
                        </div>
                    )}

                    {['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(st) && (
                        <div className="mb-4 mt-2">
                          <p className="text-xs text-gray-500 mb-1 font-semibold">🗺️ Live Route:</p>
                          <TrackProviderMap
                              customerLocation={r.location}
                              customerLat={r.latitude}
                              customerLng={r.longitude}
                              providerLat={r.providerLat}
                              providerLng={r.providerLng}
                          />
                        </div>
                    )}

                    <div className="flex gap-2 flex-wrap mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">

                      {st === 'PENDING' && (
                          <>
                            <button onClick={() => handleAccept(r.id)} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold">Accept</button>
                            <button onClick={() => handleReject(r.id)} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold">Reject</button>
                          </>
                      )}

                      {st === 'ACCEPTED' && (
                          <>
                            <button onClick={() => { setCancelReqId(r.id); setShowCancelModal(true); setCancelCategory(''); setCancelDesc(''); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Cancel Job</button>
                            <button onClick={() => { setChatData({ reqId: r.id, custId: r.user.id, custName: r.user.name }); setShowChat(true); }} className="relative px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">
                              💬 Chat
                              {unreadCounts[r.id] > 0 && (<span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span></span>)}
                            </button>
                          </>
                      )}

                      {st === 'ARRIVED' && (
                          <>
                            <div className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 p-4 rounded-xl border border-purple-300 mb-2 text-white shadow-md">
                              <p className="text-lg font-bold mb-1">📍 Aap Customer ki Location par Pohanch Gaye Hain!</p>
                              <p className="text-sm opacity-90">Customer ko notification chala gaya hai. Jab kaam mukammal ho jaye toh "Complete Service" dabayein.</p>
                            </div>
                            <button onClick={() => handleCompleteService(r.id)} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold">✅ Mark Service Completed</button>
                            <button onClick={() => { setChatData({ reqId: r.id, custId: r.user.id, custName: r.user.name }); setShowChat(true); }} className="relative px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">
                              💬 Chat
                              {unreadCounts[r.id] > 0 && (<span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span></span>)}
                            </button>
                          </>
                      )}

                      {st === 'IN_PROGRESS' && (
                          <>
                            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold flex-1">🛠️ Service in Progress...</span>
                            <button onClick={() => handleCompleteService(r.id)} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold">Mark Completed</button>
                            <button onClick={() => { setChatData({ reqId: r.id, custId: r.user.id, custName: r.user.name }); setShowChat(true); }} className="relative px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">
                              💬 Chat
                              {unreadCounts[r.id] > 0 && (<span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span></span>)}
                            </button>
                          </>
                      )}

                      {st === 'COMPLETED' && (
                          <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold w-full text-center">✅ Service Completed Successfully</span>
                      )}

                      {st === 'CANCELLATION_PENDING' && (
                          <div className="w-full bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-3 rounded-xl flex items-center justify-center">
                            <span className="text-orange-800 dark:text-orange-400 font-bold text-sm">⏳ Cancellation Pending Admin Approval</span>
                          </div>
                      )}

                      {(st === 'REJECTED' || st === 'EXPIRED' || st === 'CANCELLED') && (
                          <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold w-full text-center">Request {st}</span>
                      )}

                      {['PENDING', 'REJECTED', 'EXPIRED', 'CANCELLED', 'COMPLETED'].includes(st) && (
                          <button onClick={() => deleteRequest(r.id)} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-semibold ml-auto">Delete</button>
                      )}
                    </div>
                  </div>
              );
            })}
          </div>
        </div>

        {showCancelModal && (
            <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
                <h2 className="text-2xl font-bold text-red-600 mb-2">Cancel Job</h2>
                <p className="text-sm text-gray-500 mb-4">Admin will review your cancellation request.</p>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason Category *</label>
                    <select value={cancelCategory} onChange={(e) => setCancelCategory(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                      <option value="">-- Select Reason --</option>
                      <option value="Customer not responding">Customer not responding</option>
                      <option value="Out of station">Out of station</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Vehicle breakdown">Vehicle breakdown</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description {cancelCategory === 'Other' ? '*' : '(Optional)'}</label>
                    <textarea value={cancelDesc} onChange={(e) => setCancelDesc(e.target.value)} rows="3" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="Explain your reason..." />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleCancelRequest} disabled={cancelling} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition disabled:opacity-50">{cancelling ? 'Sending...' : 'Submit Cancellation'}</button>
                  <button onClick={() => setShowCancelModal(false)} className="px-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 py-3 rounded-xl font-bold">Back</button>
                </div>
              </div>
            </div>
        )}

        {showChat && chatData && (
            <ChatWindow requestId={chatData.reqId} receiverId={chatData.custId} receiverName={chatData.custName} onClose={() => setShowChat(false)} />
        )}
      </div>
  );
}

export default Dashboard;

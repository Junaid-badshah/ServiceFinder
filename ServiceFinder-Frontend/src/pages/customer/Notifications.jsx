import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ChatWindow from "../../components/chat/ChatWindow";
import TrackProviderMap from "../../components/TrackProviderMap";
import { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications'; // 👈 Import Hook

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications: requests, loading, fetchNotifications } = useNotifications(user); // 👈 Use Central Hook

  // Chat & Cancel & Review States
  const [showChat, setShowChat] = useState(false);
  const [chatReceiver, setChatReceiver] = useState(null);
  const [chatRequestId, setChatRequestId] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReqId, setCancelReqId] = useState(null);
  const [cancelCategory, setCancelCategory] = useState('');
  const [cancelDesc, setCancelDesc] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const [reviewedRequestIds, setReviewedRequestIds] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRequestId, setReviewRequestId] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Fetch reviewed IDs separately
  useEffect(() => {
    const fetchReviews = async () => {
        try {
            const reviewsRes = await api.get('/reviews/customer');
            setReviewedRequestIds(reviewsRes.data.map(rev => rev.request.id));
        } catch (err) {}
    };
    if (user) fetchReviews();
  }, [user]);

  // Mark Read on Page Leave
  useEffect(() => {
    return () => {
      api.put(`/requests/user/${user.id}/mark-read`).catch(err => console.error("Mark read error:", err));
    };
  }, [user.id]);

  // Chat Unread Counts
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

  // Handlers
  const handleSubmitReview = async () => {
    if (reviewRating < 1 || reviewRating > 5) return setReviewError('Please select 1 to 5 stars');
    setReviewSubmitting(true); setReviewError('');
    try {
      await api.post('/reviews', { requestId: reviewRequestId, rating: reviewRating, comment: reviewComment });
      setShowReviewModal(false);
      alert('⭐ Thank you! Aapka review submit ho gaya hai.');
      fetchNotifications();
    } catch (err) { setReviewError(err.response?.data?.error || 'Review submit nahi ho saka'); }
    finally { setReviewSubmitting(false); }
  };

  const handleCancelRequest = async () => {
    if (!cancelCategory) return alert('Please select a reason category');
    if (cancelCategory === 'Other' && !cancelDesc.trim()) return alert('Please describe your reason');
    setCancelling(true);
    try {
      await api.post(`/requests/${cancelReqId}/request-cancel`, { cancelledBy: 'CUSTOMER', category: cancelCategory, description: cancelDesc });
      alert('✅ Cancellation request sent to Admin for review.');
      setShowCancelModal(false);
      fetchNotifications();
    } catch (err) { alert('Failed to send cancellation request'); }
    finally { setCancelling(false); }
  };

  const statusColor = (status) => {
    switch ((status || '').toUpperCase()) {
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "ACCEPTED": return "bg-green-100 text-green-800";
      case "ARRIVED": return "bg-purple-100 text-purple-800";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800";
      case "AWAITING_REVIEW": return "bg-teal-100 text-teal-800";
      case "CANCELLATION_PENDING": return "bg-orange-100 text-orange-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      case "CANCELLED": return "bg-gray-200 text-gray-800";
      case "EXPIRED": return "bg-red-200 text-red-900";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const fullTimestamp = (ts) => {
    if (!ts) return '-';
    try {
      const d = new Date(ts);
      return d.toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (err) { return '-'; }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Notifications</h1>

      {requests.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-6xl mb-4">🔍</p>
          <p className="text-gray-500 mb-4">Koi nayi notification nahi hai</p>
          <Link to="/providers" className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-bold transition">Browse Providers →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const st = (r.status || '').toUpperCase();
            const isTerminal = ['REJECTED', 'CANCELLED', 'EXPIRED'].includes(st);
            const isReviewed = reviewedRequestIds.includes(r.id);

            return (
              <div key={r.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Request #{r.id} - {r.serviceName || 'Service'}</h3>
                    <p className="text-sm text-gray-500 mt-1">To: <strong>{r.provider?.name || "Multiple Providers"}</strong></p>
                    {r.createdAt && <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">🕒 Request bheji: {fullTimestamp(r.createdAt)}</p>}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor(r.status)}`}>{st.replace('_', ' ')}</span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">
                  <p className="md:col-span-2">📍 <strong>Location:</strong> {r.location || '-'}</p>
                  <p className="md:col-span-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold">💰 Total Booking Price: Rs. {r.agreedPrice || r.offeredPrice || r.provider?.rate || 'Negotiable'}</p>
                  
                  {/* Accepted Banner */}
                  {st === 'ACCEPTED' && (
                    <div className="md:col-span-2 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl flex items-center justify-center mt-2 border border-green-200 dark:border-green-800">
                      <span className="text-green-800 dark:text-green-400 font-bold text-sm">✅ Request Accepted!</span>
                    </div>
                  )}

                  {/* Terminal Reasons */}
                  {['CANCELLED', 'CANCELLATION_PENDING', 'REJECTED'].includes(st) && (
                    <div className="md:col-span-2 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl mt-2 border border-red-200 dark:border-red-800">
                      <div className="text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 p-3 rounded-lg">
                        <p><strong>Status:</strong> {st.replace('_', ' ')}</p>
                        {r.cancelReasonCategory && <p className="mt-1"><strong>Reason:</strong> {r.cancelReasonCategory}</p>}
                        {r.cancelReasonDescription && <p className="mt-1 text-xs"><strong>Details:</strong> {r.cancelReasonDescription}</p>}
                      </div>
                    </div>
                  )}

                  {st === 'EXPIRED' && (
                    <div className="md:col-span-2 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl mt-2 border border-red-200 dark:border-red-800">
                      <div className="text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 p-3 rounded-lg">
                        <p><strong>Status:</strong> EXPIRED (Provider did not accept in time)</p>
                      </div>
                    </div>
                  )}

                  {/* Map for Active Requests */}
                  {['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(st) && r.provider?.phone && (
                    <div className="md:col-span-2 mb-2 mt-2">
                       <p className="text-xs text-gray-500 mb-1 font-semibold">🗺️ Provider Live Location:</p>
                       <TrackProviderMap 
                          customerLocation={r.location} 
                          customerLat={r.latitude} 
                          customerLng={r.longitude} 
                          providerLat={r.providerLat} 
                          providerLng={r.providerLng} 
                       />
                    </div>
                  )}
                </div>

                {r.message && <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl text-sm border border-gray-100 dark:border-gray-700 mb-4"><span className="font-semibold text-gray-700 dark:text-gray-300">Message: </span>{r.message}</div>}

                {/* BUTTONS SECTION */}
                {['ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_REVIEW'].includes(st) && (
                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-2">
                    
                    <button onClick={() => { setChatRequestId(r.id); setChatReceiver({ id: r.provider.userId, name: r.provider.name }); setShowChat(true); }} className="relative flex-1 min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2">
                      💬 Chat
                      {unreadCounts[r.id] > 0 && (<span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span></span>)}
                    </button>

                    {st !== 'IN_PROGRESS' && st !== 'AWAITING_REVIEW' && (
                      <button onClick={() => { setCancelReqId(r.id); setShowCancelModal(true); setCancelCategory(''); setCancelDesc(''); }} className="flex-1 min-w-[120px] bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition">
                        ❌ Cancel Request
                      </button>
                    )}

                    {isReviewed ? (
                      <div className="flex-1 min-w-[120px] bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-center px-4 py-2 rounded-lg font-bold text-sm border border-blue-200 dark:border-blue-800">
                        ✅ Reviewed
                      </div>
                    ) : (
                      <button onClick={() => { setReviewRequestId(r.id); setShowReviewModal(true); setReviewError(''); setReviewRating(5); setReviewComment(''); }} className="flex-1 min-w-[120px] bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition animate-pulse">
                        ⭐ Give Review
                      </button>
                    )}
                  </div>
                )}

                {/* Terminal Buttons */}
                {isTerminal && (
                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                     <Link to="/providers" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-bold text-sm transition">
                       Browse Providers →
                     </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODALS */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Rate Your Provider</h2>
            <p className="text-sm text-gray-500 mb-6">Kaam kaisa laga? Apni rating dein.</p>
            {reviewError && <div className="bg-red-50 text-red-700 p-2 rounded mb-4 text-sm">{reviewError}</div>}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (<button key={star} onClick={() => setReviewRating(star)} className={`text-4xl transition ${reviewRating >= star ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>))}
            </div>
            <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Write a short review (optional)..." rows="3" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-6 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <div className="flex gap-3">
              <button onClick={handleSubmitReview} disabled={reviewSubmitting} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-bold transition disabled:opacity-50">{reviewSubmitting ? 'Submitting...' : 'Submit Review'}</button>
              <button onClick={() => setShowReviewModal(false)} className="px-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 py-3 rounded-xl font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Cancel Request</h2>
            <p className="text-sm text-gray-500 mb-4">Your cancellation request will be reviewed by Admin.</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason Category *</label>
                <select value={cancelCategory} onChange={(e) => setCancelCategory(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option value="">-- Select Reason --</option>
                  <option value="Provider is taking too long">Provider is taking too long</option>
                  <option value="Found another provider">Found another provider</option>
                  <option value="Change of plans">Change of plans</option>
                  <option value="Emergency">Emergency</option>
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

      {showChat && chatReceiver && (
        <ChatWindow requestId={chatRequestId} receiverId={chatReceiver.id} receiverName={chatReceiver.name} onClose={() => setShowChat(false)} />
      )}
    </div>
  );
}

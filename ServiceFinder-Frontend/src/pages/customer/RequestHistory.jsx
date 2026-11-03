import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRequestsByUser } from "../../services/api";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function RequestHistory() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewedRequestIds, setReviewedRequestIds] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRequestId, setReviewRequestId] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await getRequestsByUser(user.id);
      const historyStatuses = ['COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'];
      const history = (res.data || [])
        .filter(r => historyStatuses.includes((r.status || '').toUpperCase()))
        .sort((a, b) => (b.id || 0) - (a.id || 0));
      setRequests(history);

      const reviewsRes = await api.get('/reviews/customer');
      setReviewedRequestIds(reviewsRes.data.map(rev => rev.request.id));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmitReview = async () => {
    if (reviewRating < 1 || reviewRating > 5) return setReviewError('Please select 1 to 5 stars');
    setReviewSubmitting(true); setReviewError('');
    try {
      await api.post('/reviews', { requestId: reviewRequestId, rating: reviewRating, comment: reviewComment });
      setShowReviewModal(false);
      alert('⭐ Thank you! Aapka review submit ho gaya hai.');
      fetchHistory();
    } catch (err) { setReviewError(err.response?.data?.error || 'Review submit nahi ho saka'); }
    finally { setReviewSubmitting(false); }
  };

  const statusColor = (status) => {
    switch ((status || '').toUpperCase()) {
      case "COMPLETED": return "bg-emerald-100 text-emerald-800";
      case "CANCELLED": return "bg-gray-200 text-gray-800";
      case "REJECTED": return "bg-red-100 text-red-800";
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
      <Link to="/profile" className="text-primary-600 hover:underline text-sm font-semibold mb-4 inline-block">← Back to Profile</Link>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Request History</h1>

      {requests.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-6xl mb-4">📋</p>
          <p className="text-gray-500">Abhi tak koi finalized request nahi hai.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const st = (r.status || '').toUpperCase();
            const isReviewed = reviewedRequestIds.includes(r.id);

            return (
              <div key={r.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Request #{r.id} - {r.serviceName || 'Service'}</h3>
                    <p className="text-sm text-gray-500 mt-1">To: <strong>{r.provider?.name || "Multiple Providers"}</strong></p>
                    {r.createdAt && <p className="text-xs text-gray-500 mt-1">🕒 Request bheji: {fullTimestamp(r.createdAt)}</p>}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor(r.status)}`}>{st.replace('_', ' ')}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <p className="md:col-span-2">📍 <strong>Location:</strong> {r.location || '-'}</p>
                  {r.provider && <p className="md:col-span-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold">💰 Provider Rate: Rs. {r.provider?.rate || 'Negotiable'}</p>}
                  
                  {st === 'COMPLETED' && !isReviewed && (
                    <div className="md:col-span-2 mt-2">
                      <button onClick={() => { setReviewRequestId(r.id); setShowReviewModal(true); setReviewError(''); setReviewRating(5); setReviewComment(''); }} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition">⭐ Give Review</button>
                    </div>
                  )}
                  {st === 'COMPLETED' && isReviewed && (
                    <div className="md:col-span-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl flex items-center justify-center mt-2 border border-blue-200 dark:border-blue-800">
                      <span className="text-blue-800 dark:text-blue-400 font-bold text-sm">✅ Request Completed & Reviewed</span>
                    </div>
                  )}
                  {st === 'CANCELLED' && r.adminRemarks && (
                    <div className="md:col-span-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl mt-2">
                      <p className="text-xs text-gray-500 mb-1">Admin Remarks:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{r.adminRemarks}</p>
                    </div>
                  )}
                </div>

                {r.message && <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl text-sm border border-gray-100 dark:border-gray-700"><span className="font-semibold text-gray-700 dark:text-gray-300">Message: </span>{r.message}</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* REVIEW MODAL */}
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
    </div>
  );
}

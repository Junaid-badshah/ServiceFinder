import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api, { getProviderById, getRequestsByUser } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import RequestForm from "../../components/providers/RequestForm";

function ProviderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  
  // 👇 NAYE STATES: Duplicate Request Check 👇
  const [hasActiveRequest, setHasActiveRequest] = useState(false);
  const [activeRequestStatus, setActiveRequestStatus] = useState("");

  useEffect(() => {
    fetchProvider();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get(`/reviews/provider/${id}`);
        setReviews(res.data || []);
      } catch (err) { console.error("Review fetch error:", err); }
    };
    if (id) fetchReviews();
  }, [id]);

  // 👇 CHECK: Kya customer ne pehle se request bheji hai? 👇
  useEffect(() => {
    const checkActiveRequest = async () => {
      if (!user || user.role !== 'CUSTOMER') return;
      try {
        const res = await getRequestsByUser(user.id);
        const activeStatuses = ['PENDING', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'CANCELLATION_PENDING'];
        
        const existing = res.data.find(r => 
            r.provider?.id === parseInt(id) && 
            activeStatuses.includes((r.status || '').toUpperCase())
        );

        if (existing) {
            setHasActiveRequest(true);
            setActiveRequestStatus(existing.status);
        } else {
            setHasActiveRequest(false);
            setActiveRequestStatus("");
        }
      } catch (err) { console.error("Error checking active requests:", err); }
    };
    checkActiveRequest();
  }, [user, id]);

  const fetchProvider = async () => {
    try {
      const res = await getProviderById(id);
      setProvider(res.data);
    } catch (err) {
      console.error(err);
      setError("Provider not found");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setSuccess(true);
    setTimeout(() => navigate("/my-requests"), 2000);
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  if (!provider) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 text-xl mb-4">{error || "Provider not found"}</p>
        <Link to="/providers" className="text-primary-600 dark:text-primary-500 hover:underline">← Back to providers</Link>
      </div>
    );
  }

  const isOwnCard = user && user.role === 'PROVIDER' && provider.userId === user.id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/providers" className="text-primary-600 dark:text-primary-500 hover:underline mb-6 inline-block">← Back to providers</Link>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white p-6 md:p-8">
          {isOwnCard && <span className="inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full mb-2">★ Your Card</span>}
          <h1 className="text-2xl md:text-4xl font-bold mb-2">{provider.name}</h1>
          <p className="text-lg md:text-xl opacity-90">{provider.service}</p>
        </div>

        <div className="p-6 md:p-8">
          {/* Detail Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg"><p className="text-gray-500 dark:text-gray-400 text-sm">Location</p><p className="text-lg font-semibold text-gray-900 dark:text-gray-100">📍 {provider.location || '-'}</p></div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg"><p className="text-gray-500 dark:text-gray-400 text-sm">Experience</p><p className="text-lg font-semibold text-gray-900 dark:text-gray-100">💼 {provider.experience || 0} years</p></div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg"><p className="text-gray-500 dark:text-gray-400 text-sm">Phone</p><p className="text-lg font-semibold text-gray-900 dark:text-gray-100">📞 {provider.phone || '-'}</p></div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg"><p className="text-gray-500 dark:text-gray-400 text-sm">Rating</p><p className="text-lg font-semibold text-gray-900 dark:text-gray-100">⭐ {provider.rating ? `${provider.rating}/5` : 'New Provider'}</p></div>
            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800"><p className="text-green-600 dark:text-green-400 text-sm font-medium">Rate</p><p className="text-lg font-bold text-green-700 dark:text-green-300">💰 {provider.rate ? `${provider.rate} PKR` : 'Negotiable'}</p>{provider.rate && <p className="text-xs text-green-600 dark:text-green-400 mt-1">per visit</p>}</div>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800"><p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Availability</p><p className="text-sm font-semibold text-blue-700 dark:text-blue-300">📅 {provider.availableDays || 'Not specified'}</p><p className="text-sm font-semibold text-blue-700 dark:text-blue-300">🕐 {provider.availableTime || 'Not specified'}</p></div>
          </div>

          {/* About */}
          {provider.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">About</h3>
              <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">{provider.description}</p>
            </div>
          )}

          {/* Reviews */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setShowReviews(!showReviews)} className="w-full flex justify-between items-center text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100 gap-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <span className="flex items-center gap-2">⭐ Customer Reviews ({reviews.length})</span>
              <span className="text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">{showReviews ? '▲ Hide' : '▼ Show'}</span>
            </button>
            {showReviews && (
              <div className="mt-4">
                {reviews.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg text-center"><p className="text-gray-500 dark:text-gray-400 text-sm">Abhi tak koi review nahi hai. Pehla review aap dein!</p></div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center font-bold text-sm">{rev.customer?.name?.charAt(0).toUpperCase() || 'C'}</div>
                            <div><p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{rev.customer?.name || 'Customer'}</p><p className="text-xs text-gray-500">{new Date(rev.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</p></div>
                          </div>
                          <div className="flex text-yellow-400 text-lg">{[...Array(5)].map((_, i) => (<span key={i}>{i < rev.rating ? '★' : '☆'}</span>))}</div>
                        </div>
                        {rev.comment && <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 italic bg-white dark:bg-gray-800 p-3 rounded-lg">"{rev.comment}"</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {isOwnCard && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 p-4 rounded-lg text-center text-sm mt-6">Ye aapka apna card hai — Request bhejne ke liye doosre providers ki profile kholo.</div>
          )}

          {/* 👇 UPDATED BUTTON LOGIC: Duplicate Check 👇 */}
          {!isOwnCard && !showForm && !success && (
            hasActiveRequest ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-5 rounded-xl text-center mt-6">
                    <p className="text-yellow-800 dark:text-yellow-400 font-bold text-lg mb-1">⚠️ Aapne is provider ko pehle hi request bhej rakhi hai.</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-500 mb-3">Current Status: <span className="font-bold">{activeRequestStatus}</span></p>
                    <Link to="/my-requests" className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-bold transition">Go to My Requests →</Link>
                </div>
            ) : (
                <button onClick={() => setShowForm(true)} className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold text-lg transition mt-6">📩 Request Service</button>
            )
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 p-6 rounded-lg text-center mt-6">
              <p className="text-xl font-semibold">✅ Request Submitted!</p>
              <p className="mt-2">Redirecting...</p>
            </div>
          )}

          {showForm && !success && (
            <div className="mt-6">
              <RequestForm providerId={id} onSuccess={handleSuccess} onCancel={() => setShowForm(false)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProviderDetails;

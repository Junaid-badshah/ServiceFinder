import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showTopup, setShowTopup] = useState(false);
  const [amount, setAmount] = useState('');
  const [toppingUp, setToppingUp] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState('');

  const navigate = useNavigate();

  const loadWalletData = async () => {
    setLoading(true);
    try {
      const [walletRes, txnRes] = await Promise.all([
        api.get('/wallet'),
        api.get('/wallet/transactions')
      ]);
      setWallet(walletRes.data);
      setTransactions(txnRes.data || []);
    } catch (err) {
      setError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  const handleTopup = async (e) => {
    e.preventDefault();
    if (!amount || amount < 200) {
      setError('Minimum top-up amount is Rs. 200');
      return;
    }
    setToppingUp(true);
    setError('');
    setTopupSuccess('');
    try {
      const res = await api.post('/wallet/topup', { amount: Number(amount) });
      setWallet(res.data.wallet);
      setTopupSuccess('Wallet topped up successfully!');
      setAmount('');
      setTimeout(() => {
        setShowTopup(false);
        setTopupSuccess('');
        loadWalletData();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Top-up failed');
    } finally {
      setToppingUp(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading Wallet...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-4 text-primary-600 hover:underline text-sm font-semibold">← Back</button>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">My Wallet</h1>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">{error}</div>}

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <p className="text-blue-100 font-medium mb-1">Available Balance</p>
            <h2 className="text-5xl font-bold">Rs. {wallet?.balance || '0.00'}</h2>
            <p className="text-sm text-blue-200 mt-2">Currency: {wallet?.currency || 'PKR'}</p>
          </div>
          <div>
            <button onClick={() => setShowTopup(true)} className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-xl font-bold text-lg shadow-md transition">
              + Top Up Wallet
            </button>
          </div>
        </div>

        {showTopup && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Add Funds</h3>
            {topupSuccess && <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm">{topupSuccess}</div>}
            <form onSubmit={handleTopup} className="flex gap-3">
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount (e.g. 200)" className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" min="200" required />
              <button type="submit" disabled={toppingUp} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition disabled:opacity-50">
                {toppingUp ? 'Processing...' : 'Pay Now'}
              </button>
              <button type="button" onClick={() => setShowTopup(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-xl font-bold transition">Cancel</button>
            </form>
            <p className="text-xs text-gray-500 mt-2">Note: This is a mock payment for testing.</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Transaction History</h2>
          </div>
          {transactions.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No transactions yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-sm">
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Type</th>
                    <th className="p-4 font-semibold">Reference ID</th>
                    <th className="p-4 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                  {transactions.map((txn) => {
                    const isCredit = txn.transactionType === 'TOP_UP';
                    return (
                      <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                        <td className="p-4 text-gray-800 dark:text-gray-200">{new Date(txn.createdAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${isCredit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {txn.transactionType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500 font-mono text-xs">{txn.referenceId || '-'}</td>
                        <td className={`p-4 font-bold text-right ${isCredit ? 'text-green-600' : 'text-red-600'}`}>{isCredit ? '+' : ''}{txn.amount} PKR</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

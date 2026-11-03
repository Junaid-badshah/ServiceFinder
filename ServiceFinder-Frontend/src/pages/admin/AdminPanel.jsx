import { useEffect, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function AdminPanel() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const urlTab = searchParams.get('tab');
  const [tab, setTab] = useState(urlTab || 'overview');

  const [users, setUsers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, admins: 0, providers: 0, customers: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [expandedRequestId, setExpandedRequestId] = useState(null);

  const [wallets, setWallets] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [commissions, setCommissions] = useState({});
  const [commissionSaving, setCommissionSaving] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  
  const [privacySettings, setPrivacySettings] = useState({
    commissionEnabled: true,
    hideCustomerName: false, hideCustomerEmail: false, hideCustomerPhone: false, hideCustomerPicture: false,
    hideProviderName: false, hideProviderEmail: false, hideProviderPhone: false, hideProviderPicture: false,
    hideProviderLocation: false, hideProviderExperience: false, hideProviderPrice: false
  });

  const [openSection, setOpenSection] = useState(null); 
  const [badges, setBadges] = useState({ customers: 0, providers: 0, services: 0, wallets: 0, cancellations: 0 });
  const [accordionBadges, setAccordionBadges] = useState({ control: false, settings: false, wallets: false, transactions: false });

  const [selectedCancelReq, setSelectedCancelReq] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const [svcForm, setSvcForm] = useState({ name: '', icon: '', color: '' });
  const [svcEditId, setSvcEditId] = useState(null);
  const [svcError, setSvcError] = useState('');
  const [svcSaving, setSvcSaving] = useState(false);

  // 👇 NAYE STATES: Date Filter ke liye 👇
  const [filterType, setFilterType] = useState('DAILY');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (urlTab) setTab(urlTab);
    else setTab('overview');
  }, [urlTab]);

  const fetchChartData = async () => {
    try {
      const params = new URLSearchParams();
      params.append('filterType', filterType);
      if (startDate) params.append('startDate', startDate);
      if (endDate && filterType === 'CUSTOM') params.append('endDate', endDate);
      
      const res = await api.get(`/admin/chart-data?${params.toString()}`);
      setChartData(res.data || []);
    } catch (err) {
      console.error("Failed to load chart data", err);
      setChartData([]);
    }
  };

  const loadAll = async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    try {
      const [uRes, sRes, rRes, pRes, svcRes] = await Promise.all([
        api.get('/admin/users'), api.get('/admin/stats'), api.get('/requests'), api.get('/providers'), api.get('/services'),
      ]);
      if (!isPolling) {
        setUsers(uRes.data || []);
        setStats(sRes.data || {});
        setRequests(rRes.data || []);
        setProviders(pRes.data || []);
        setServices(svcRes.data || []);
      }

      try {
        const [wRes, cRes, txnRes, revRes] = await Promise.all([
          api.get('/admin/wallet/all'), api.get('/admin/wallet/commission'), api.get('/admin/wallet/transactions'), api.get('/admin/wallet/revenue')
        ]);
        const txns = txnRes.data || [];
        setWallets(wRes.data || []);
        setAllTransactions(txns);
        setTotalRevenue(revRes.data?.totalRevenue || 0);
        
        if (cRes.data && Array.isArray(cRes.data)) {
          const commMap = {};
          cRes.data.forEach(rule => { commMap[rule.serviceId] = rule.commissionPercentage; });
          setCommissions(commMap);
        }

        if (txns.length > 0) {
          if (!localStorage.getItem('admin_seen_txn_id')) {
            const maxId = Math.max(...txns.map(t => t.id));
            localStorage.setItem('admin_seen_txn_id', maxId.toString());
            localStorage.setItem('admin_seen_wallet_id', maxId.toString());
          }
          const comms = txns.filter(t => t.type === 'COMMISSION_DEDUCTION');
          if (comms.length > 0 && !localStorage.getItem('admin_seen_comm_id')) {
            const maxCommId = Math.max(...comms.map(t => t.id));
            localStorage.setItem('admin_seen_comm_id', maxCommId.toString());
          }
        }

      } catch (wErr) { console.error(wErr); }

      try {
        const settingsRes = await api.get('/admin/settings');
        setPrivacySettings(settingsRes.data);
      } catch (sErr) { console.error(sErr); }

    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token'); window.location.href = '/login';
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => { 
    loadAll(); 
    fetchChartData(); // 👈 Graph ka data initial load par fetch karein
  }, [urlTab, location.pathname]);

  useEffect(() => {
    const interval = setInterval(() => loadAll(true), 10000);
    return () => clearInterval(interval);
  }, []);

  // Main Tab Badges
  useEffect(() => {
    if (loading) return;

    const seenCustomers = parseInt(localStorage.getItem('admin_seen_customers') || '0');
    const seenProviders = parseInt(localStorage.getItem('admin_seen_providers') || '0');
    const seenServices = parseInt(localStorage.getItem('admin_seen_services') || '0');
    const seenWallets = parseInt(localStorage.getItem('admin_seen_wallets') || '0');
    const seenCancellations = parseInt(localStorage.getItem('admin_seen_cancellations') || '0');

    const customers = users.filter(u => u.role === 'CUSTOMER');
    const providerUsers = users.filter(u => u.role === 'PROVIDER');
    const pendingCancellations = requests.filter(r => (r.status || '').toUpperCase() === 'CANCELLATION_PENDING');

    const newCustomers = customers.filter(c => c.id > seenCustomers).length;
    const newProviders = providerUsers.filter(p => p.id > seenProviders).length;
    const newServices = services.filter(s => s.id > seenServices).length;
    const newWallets = allTransactions.filter(t => t.id > seenWallets).length;
    const newCancellations = pendingCancellations.filter(r => r.id > seenCancellations).length;

    setBadges({
      customers: newCustomers,
      providers: newProviders,
      services: newServices,
      wallets: newWallets,
      cancellations: newCancellations
    });
  }, [users, services, allTransactions, requests, loading]);

  useEffect(() => {
    if (loading) return;

    const seenTxnId = parseInt(localStorage.getItem('admin_seen_txn_id') || '0');
    const seenWalletId = parseInt(localStorage.getItem('admin_seen_wallet_id') || '0');
    const seenCommId = parseInt(localStorage.getItem('admin_seen_comm_id') || '0');
    const hasNewCommSettings = localStorage.getItem('admin_has_new_comm_settings') === 'true';

    const newWalletActivity = allTransactions.filter(t => t.id > seenWalletId && ['TOP_UP', 'REFUND'].includes(t.type));
    const newTxnActivity = allTransactions.filter(t => t.id > seenTxnId);
    const newCommActivity = allTransactions.filter(t => t.type === 'COMMISSION_DEDUCTION' && t.id > seenCommId);

    setAccordionBadges({
      control: false,
      settings: newCommActivity.length > 0 || hasNewCommSettings,
      wallets: newWalletActivity.length > 0,
      transactions: newTxnActivity.length > 0
    });
  }, [allTransactions, loading]);

  const handleTabClick = (tabKey) => {
    setTab(tabKey);
    const customers = users.filter(u => u.role === 'CUSTOMER');
    const providerUsers = users.filter(u => u.role === 'PROVIDER');
    const pendingCancellations = requests.filter(r => (r.status || '').toUpperCase() === 'CANCELLATION_PENDING');

    if (tabKey === 'customers' && customers.length > 0) {
      const maxId = Math.max(...customers.map(c => c.id));
      localStorage.setItem('admin_seen_customers', maxId.toString());
      setBadges(prev => ({ ...prev, customers: 0 }));
    }
    if (tabKey === 'providers' && providerUsers.length > 0) {
      const maxId = Math.max(...providerUsers.map(p => p.id));
      localStorage.setItem('admin_seen_providers', maxId.toString());
      setBadges(prev => ({ ...prev, providers: 0 }));
    }
    if (tabKey === 'services' && services.length > 0) {
      const maxId = Math.max(...services.map(s => s.id));
      localStorage.setItem('admin_seen_services', maxId.toString());
      setBadges(prev => ({ ...prev, services: 0 }));
    }
    if (tabKey === 'wallets' && allTransactions.length > 0) {
      const maxId = Math.max(...allTransactions.map(t => t.id));
      localStorage.setItem('admin_seen_wallets', maxId.toString());
      setBadges(prev => ({ ...prev, wallets: 0 }));
    }
    if (tabKey === 'cancellations' && pendingCancellations.length > 0) {
      const maxId = Math.max(...pendingCancellations.map(r => r.id));
      localStorage.setItem('admin_seen_cancellations', maxId.toString());
      setBadges(prev => ({ ...prev, cancellations: 0 }));
    }
  };

  const toggleAccordion = (section) => {
    setOpenSection(openSection === section ? null : section);

    if (section === 'settings') {
      const comms = allTransactions.filter(t => t.type === 'COMMISSION_DEDUCTION');
      const maxId = comms.length > 0 ? Math.max(...comms.map(t => t.id)) : 0;
      localStorage.setItem('admin_seen_comm_id', maxId.toString());
      localStorage.removeItem('admin_has_new_comm_settings');
      setAccordionBadges(prev => ({ ...prev, settings: false }));
    }
    if (section === 'wallets') {
      const walletTxns = allTransactions.filter(t => ['TOP_UP', 'REFUND'].includes(t.type));
      const maxId = walletTxns.length > 0 ? Math.max(...walletTxns.map(t => t.id)) : 0;
      localStorage.setItem('admin_seen_wallet_id', maxId.toString());
      setAccordionBadges(prev => ({ ...prev, wallets: false }));
    }
    if (section === 'transactions') {
      const maxId = allTransactions.length > 0 ? Math.max(...allTransactions.map(t => t.id)) : 0;
      localStorage.setItem('admin_seen_txn_id', maxId.toString());
      setAccordionBadges(prev => ({ ...prev, transactions: false }));
    }
  };

  const handleUpdateCommission = async (serviceId) => {
    const percentage = commissions[serviceId];
    if (percentage === undefined || percentage < 0 || percentage > 100) {
      return alert('Please enter a valid percentage between 0 and 100');
    }
    setCommissionSaving(true);
    try {
      await api.post('/admin/wallet/commission', { percentage: Number(percentage), serviceId: serviceId === 'global' ? null : Number(serviceId) });
      localStorage.setItem('admin_has_new_comm_settings', 'true');
      alert('✅ Commission updated successfully!');
      loadAll();
    } catch (err) { alert('Failed to update commission'); }
    finally { setCommissionSaving(false); }
  };

  const handleTogglePrivacy = async (key, value) => {
    const previousSettings = { ...privacySettings };
    const newSettings = { ...privacySettings, [key]: value };
    setPrivacySettings(newSettings);
    try { await api.put('/admin/settings', newSettings); } 
    catch (err) { setPrivacySettings(previousSettings); alert('Failed to save setting'); }
  };

  const handleCancelDecision = async (decision) => {
    if (!selectedCancelReq) return;
    setProcessing(true);
    try {
      await api.put(`/requests/${selectedCancelReq.id}/admin-cancel-decision`, {
        decision,
        refundAmount: Number(refundAmount) || 0,
        deductionAmount: 0, 
        adminRemarks: '' 
      });
      alert(`✅ Cancellation ${decision}!`);
      setSelectedCancelReq(null);
      loadAll();
    } catch (err) {
      alert('Failed to process cancellation');
    } finally {
      setProcessing(false);
    }
  };

  const customers = users.filter((u) => u.role === 'CUSTOMER').sort((a, b) => (b.id || 0) - (a.id || 0));
  const providerUsers = users.filter((u) => u.role === 'PROVIDER').sort((a, b) => (b.id || 0) - (a.id || 0));
  const getCustomerRequests = (customerId) => requests.filter((r) => r.user?.id === customerId).sort((a, b) => (b.id || 0) - (a.id || 0));
  const getCounts = (list) => ({ total: list.length, pending: list.filter((r) => (r.status || '').toUpperCase() === 'PENDING').length, accepted: list.filter((r) => (r.status || '').toUpperCase() === 'ACCEPTED').length, rejected: list.filter((r) => (r.status || '').toUpperCase() === 'REJECTED').length });

  const formatTime = (t) => { if (!t) return '-'; const [h, m] = t.split(':'); const hour = parseInt(h); const ampm = hour >= 12 ? 'PM' : 'AM'; const hr12 = hour % 12 || 12; return `${hr12}:${m} ${ampm}`; };
  const handleDeleteUser = async (id) => { if (!window.confirm('Delete this user?')) return; try { await api.delete(`/admin/users/${id}`); loadAll(); } catch (err) { alert('Delete failed'); } };
  const handleServiceSubmit = async (e) => { e.preventDefault(); setSvcError(''); setSvcSaving(true); try { if (svcEditId) await api.put(`/services/${svcEditId}`, svcForm); else await api.post('/services', svcForm); setSvcForm({ name: '', icon: '', color: '' }); setSvcEditId(null); loadAll(); } catch (err) { setSvcError(err.response?.data?.error || 'Failed'); } finally { setSvcSaving(false); } };
  const handleServiceEdit = (s) => { setSvcEditId(s.id); setSvcForm({ name: s.name, icon: s.icon, color: s.color }); };
  const handleServiceDelete = async (id) => { if (!window.confirm('Delete this service?')) return; try { await api.delete(`/services/${id}`); loadAll(); } catch (err) { alert('Delete failed'); } };
  const cancelServiceEdit = () => { setSvcEditId(null); setSvcForm({ name: '', icon: '', color: '' }); setSvcError(''); };

  const AccordionHeader = ({ id, icon, title, badgeCount, isOpen, hasDot }) => (
    <button
      onClick={() => toggleAccordion(id)}
      className={`w-full p-4 flex justify-between items-center transition-colors ${isOpen ? 'bg-gray-100 dark:bg-gray-700/80 border-b border-gray-200 dark:border-gray-700' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
        {hasDot && <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" title="New Activity"></span>}
        {badgeCount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{badgeCount}</span>}
        <svg className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>
    </button>
  );

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>;
  
  const isServicesOnlyView = urlTab === 'services';
  const isCustomersOnlyView = urlTab === 'customers';
  const isRequestsHistoryView = urlTab === 'requests_history';
  const isStandaloneView = isServicesOnlyView || isCustomersOnlyView || isRequestsHistoryView;

  const totalUsers = users.length || 1;
  const customerPct = Math.round((stats.customers / totalUsers) * 100);
  const providerPct = Math.round((stats.providers / totalUsers) * 100);
  const adminPct = 100 - customerPct - providerPct;
  const donutGradient = `conic-gradient(#3b82f6 0% ${customerPct}%, #a855f7 ${customerPct}% ${customerPct + providerPct}%, #22c55e ${customerPct + providerPct}% 100%)`;

  const totalReqs = requests.length || 1;
  const getStatusCount = (status) => requests.filter(r => (r.status || '').toUpperCase() === status).length;
  const getPct = (count) => Math.round((count / totalReqs) * 100);

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">
          {isServicesOnlyView && '🛠️ Manage Services'}
          {isCustomersOnlyView && '👤 Manage Customers'}
          {isRequestsHistoryView && '📜 All Requests History'}
          {!isStandaloneView && '👑 Admin Panel'}
        </h1>

        {/* 👇 NAVBAR TABS (4 Buttons) 👇 */}
        {!isStandaloneView && (
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { key: 'overview', label: '📊 Overview', badge: 0 },
              { key: 'wallets', label: `💰 Wallets & Commission`, badge: badges.wallets },
              { key: 'cancellations', label: '❌ Cancellations', badge: badges.cancellations },
              { key: 'privacy', label: '🔒 Privacy Settings', badge: 0 }
            ].map((t) => (
              <button key={t.key} onClick={() => handleTabClick(t.key)} className={`relative px-4 py-2 rounded-lg font-semibold text-sm transition ${tab === t.key ? 'bg-primary-600 text-white' : 'bg-[#111827] text-gray-300 hover:bg-gray-800 border border-gray-800'}`}>
                {t.label}
                {t.badge > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-[#0B1120]">{t.badge > 99 ? '99+' : t.badge}</span>}
              </button>
            ))}
          </div>
        )}

        {/* 👇 NAYA OVERVIEW DASHBOARD 👇 */}
        {tab === 'overview' && !isStandaloneView && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">📊 Platform Overview</h2>
                <p className="text-gray-400 text-sm">Welcome back! Here's an overview of your platform.</p>
              </div>
            </div>

            {/* 5 Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Card 1 */}
              <div className="bg-[#0f172a] rounded-2xl p-5 border border-blue-900/50 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </div>
                  <span className="text-gray-400 text-sm font-medium">Total Users</span>
                </div>
                <div className="text-3xl font-bold text-white mb-2">{users.length.toLocaleString()}</div>
                <div className="flex items-center gap-1 text-xs text-green-400 font-medium">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  <span>12%</span>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-5 text-blue-400">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-[#0f172a] rounded-2xl p-5 border border-green-900/50 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <span className="text-gray-400 text-sm font-medium">Customers</span>
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stats.customers || 0}</div>
                <div className="flex items-center gap-1 text-xs text-green-400 font-medium">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  <span>10%</span>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-5 text-green-400">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-[#0f172a] rounded-2xl p-5 border border-purple-900/50 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <span className="text-gray-400 text-sm font-medium">Providers</span>
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stats.providers || 0}</div>
                <div className="flex items-center gap-1 text-xs text-green-400 font-medium">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  <span>8%</span>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-5 text-purple-400">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-[#0f172a] rounded-2xl p-5 border border-yellow-900/50 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <span className="text-gray-400 text-sm font-medium">Services</span>
                </div>
                <div className="text-3xl font-bold text-white mb-2">{services.length}</div>
                <div className="flex items-center gap-1 text-xs text-green-400 font-medium">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  <span>5%</span>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-5 text-yellow-400">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                </div>
              </div>

              {/* Card 5 */}
              <div className="bg-[#0f172a] rounded-2xl p-5 border border-emerald-900/50 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  </div>
                  <span className="text-gray-400 text-sm font-medium">Platform Revenue</span>
                </div>
                <div className="text-3xl font-bold text-white mb-2">Rs. {totalRevenue.toLocaleString()}</div>
                <div className="flex items-center gap-1 text-xs text-green-400 font-medium">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  <span>18%</span>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-5 text-emerald-400">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Request Status */}
              <div className="bg-[#111827] rounded-2xl p-6 border border-gray-800">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    Request Status
                  </h2>
                  <button onClick={() => handleTabClick('requests_history')} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-1 transition">View All <span className="text-lg leading-none">→</span></button>
                </div>
                
                <div className="space-y-4">
                  {[
                    { label: 'Pending', key: 'PENDING', color: 'bg-yellow-500', barBg: 'bg-yellow-900/30', icon: '⏳' },
                    { label: 'Accepted', key: 'ACCEPTED', color: 'bg-green-500', barBg: 'bg-green-900/30', icon: '✅' },
                    { label: 'Rejected', key: 'REJECTED', color: 'bg-red-500', barBg: 'bg-red-900/30', icon: '❌' },
                    { label: 'Cancelled', key: 'CANCELLED', color: 'bg-purple-500', barBg: 'bg-purple-900/30', icon: '🚫' },
                    { label: 'Expired', key: 'EXPIRED', color: 'bg-blue-500', barBg: 'bg-blue-900/30', icon: '⌛' },
                    { label: 'Completed', key: 'COMPLETED', color: 'bg-emerald-500', barBg: 'bg-emerald-900/30', icon: '🏁' },
                    { label: 'In Progress', key: 'IN_PROGRESS', color: 'bg-cyan-500', barBg: 'bg-cyan-900/30', icon: '▶️' },
                    { label: 'Cancellation Pending', key: 'CANCELLATION_PENDING', color: 'bg-orange-500', barBg: 'bg-orange-900/30', icon: '⏳' },
                  ].map(st => {
                    const count = getStatusCount(st.key);
                    const pct = getPct(count);
                    return (
                      <div key={st.key} className="flex items-center gap-4">
                        <div className="flex items-center gap-2 w-40 shrink-0 text-sm font-medium text-gray-300">
                          <span>{st.icon}</span> {st.label}
                        </div>
                        <div className="text-sm font-bold text-white w-8 text-right">{count}</div>
                        <div className={`flex-1 h-2 rounded-full overflow-hidden ${st.barBg}`}>
                          <div className={`h-full ${st.color} rounded-full`} style={{ width: `${pct}%` }}></div>
                        </div>
                        <div className="text-xs text-gray-400 w-8 text-right">{pct}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Side (Role + Platform) */}
              <div className="space-y-6">
                
                {/* Role Distribution */}
                <div className="bg-[#111827] rounded-2xl p-6 border border-gray-800">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      Role Distribution
                    </h2>
                    <button onClick={() => handleTabClick('customers')} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-1 transition">View Details <span className="text-lg leading-none">→</span></button>
                  </div>
                  <div className="flex items-center justify-between gap-8 mt-6">
                    <div className="relative w-40 h-40 rounded-full flex items-center justify-center shrink-0" style={{ background: donutGradient }}>
                      <div className="absolute inset-0 rounded-full flex items-center justify-center bg-[#111827] scale-[0.65] flex-col">
                        <span className="text-2xl font-bold text-white">{users.length}</span>
                        <span className="text-xs text-gray-400 font-medium">Total</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-300"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Customers</div>
                        <div className="text-sm font-bold text-white">{stats.customers} <span className="text-gray-500 text-xs ml-1 font-normal">({customerPct}%)</span></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-300"><span className="w-3 h-3 rounded-full bg-purple-500"></span> Providers</div>
                        <div className="text-sm font-bold text-white">{stats.providers} <span className="text-gray-500 text-xs ml-1 font-normal">({providerPct}%)</span></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-300"><span className="w-3 h-3 rounded-full bg-green-500"></span> Admins</div>
                        <div className="text-sm font-bold text-white">{stats.admins} <span className="text-gray-500 text-xs ml-1 font-normal">({adminPct}%)</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Platform Overview (Dynamic Line Chart + Date Filter) */}
                <div className="bg-[#111827] rounded-2xl p-6 border border-gray-800">
                  
                  {/* 👇 NAYA: Date Filter UI 👇 */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                      Platform Revenue
                    </h2>
                    
                    {/* Filter Inputs */}
                    <div className="flex flex-wrap items-center gap-2 bg-[#0B1120] p-2 rounded-lg border border-gray-800">
                      <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-gray-800 text-white px-2 py-1.5 rounded-md text-xs border border-gray-700 outline-none">
                        <option value="DAILY">Daily</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="YEARLY">Yearly</option>
                        <option value="CUSTOM">Custom Range</option>
                      </select>
                      {filterType === 'DAILY' && (
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-gray-800 text-white px-2 py-1 rounded-md text-xs border border-gray-700 outline-none" />
                      )}
                      {filterType === 'MONTHLY' && (
                        <input type="month" value={startDate.substring(0, 7)} onChange={(e) => setStartDate(e.target.value + '-01')} className="bg-gray-800 text-white px-2 py-1 rounded-md text-xs border border-gray-700 outline-none" />
                      )}
                      {filterType === 'YEARLY' && (
                        <input type="number" value={startDate.substring(0, 4)} onChange={(e) => setStartDate(e.target.value + '-01-01')} className="bg-gray-800 text-white px-2 py-1 rounded-md text-xs border border-gray-700 outline-none w-20" />
                      )}
                      {filterType === 'CUSTOM' && (
                        <>
                          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-gray-800 text-white px-2 py-1 rounded-md text-xs border border-gray-700 outline-none" />
                          <span className="text-gray-500 text-xs">to</span>
                          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-gray-800 text-white px-2 py-1 rounded-md text-xs border border-gray-700 outline-none" />
                        </>
                      )}
                      <button onClick={fetchChartData} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-bold transition">Apply</button>
                      <button onClick={() => { setFilterType('DAILY'); setStartDate(new Date().toISOString().split('T')[0]); setTimeout(fetchChartData, 100); }} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-md text-xs font-bold transition">Clear</button>
                    </div>
                  </div>
                  
                  <div className="h-48 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData.length > 0 ? chartData : [{ name: 'No Data', revenue: 0 }]}
                        margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `Rs ${value}`} width={60} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                          itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                          formatter={(value) => [`Rs. ${value}`, 'Revenue']}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 👇 ALL REQUESTS HISTORY (EXPANDABLE CARDS) 👇 */}
        {tab === 'requests_history' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Complete Requests History</h2>
            
            <div className="space-y-4">
              {requests.sort((a,b) => (b.id||0) - (a.id||0)).map((r) => {
                const st = (r.status || '').toUpperCase();
                
                let statusColor = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
                if (st === 'COMPLETED') statusColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
                else if (st === 'ACCEPTED' || st === 'ARRIVED' || st === 'IN_PROGRESS') statusColor = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
                else if (st === 'PENDING') statusColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
                else if (st === 'REJECTED' || st === 'EXPIRED') statusColor = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
                else if (st === 'CANCELLED') statusColor = 'bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
                else if (st === 'CANCELLATION_PENDING') statusColor = 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';

                const finalPrice = Number(r.agreedPrice || r.offeredPrice || r.provider?.rate || 0);
                const commTxn = allTransactions.find(t => t.type === 'COMMISSION_DEDUCTION' && t.referenceId === `REQ-${r.id}`);
                let originalCommission = commTxn ? Math.abs(commTxn.amount) : (Number(r.commissionAmount) || 0);
                
                if (originalCommission === 0 && ['COMPLETED', 'AWAITING_REVIEW', 'CANCELLED'].includes(st)) {
                    let rate = commissions['global'] !== undefined ? Number(commissions['global']) : 10;
                    if (r.provider?.service) {
                        const svc = services.find(s => s.name === r.provider.service);
                        if (svc && commissions[svc.id] !== undefined) rate = Number(commissions[svc.id]);
                    }
                    originalCommission = finalPrice * (rate / 100);
                }
                
                const refundTxn = allTransactions.find(t => (t.type === 'TOP_UP' || t.type === 'REFUND') && t.referenceId === `REFUND-REQ-${r.id}`);
                const adminRefund = refundTxn ? Math.abs(refundTxn.amount) : (Number(r.refundAmount) || 0);
                const finalCommission = Math.max(0, originalCommission - adminRefund);
                let providerAmount = finalPrice - finalCommission;
                if (st === 'CANCELLED') { providerAmount = 0; } 

                const isExpanded = expandedRequestId === r.id;

                return (
                  <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <button 
                      onClick={() => setExpandedRequestId(isExpanded ? null : r.id)}
                      className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition text-left gap-3"
                    >
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <span className="text-lg font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-lg">
                          Request #{r.id}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                          {st.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between w-full sm:w-auto gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <span>{r.createdAt ? new Date(r.createdAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</span>
                        <span className="font-bold text-gray-800 dark:text-gray-100">Rs. {finalPrice}</span>
                        <svg className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                            <span className="text-gray-500 dark:text-gray-400">Date & Time</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-right">{r.createdAt ? new Date(r.createdAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                            <span className="text-gray-500 dark:text-gray-400">Service Name</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-right">{r.provider?.service || '-'}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                            <span className="text-gray-500 dark:text-gray-400">Customer Name</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-right">{r.user?.name || '-'}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                            <span className="text-gray-500 dark:text-gray-400">Provider Name</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-right">{r.provider?.name || '-'}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                            <span className="text-gray-500 dark:text-gray-400">Customer Phone</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-right">{r.user?.phone || '-'}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                            <span className="text-gray-500 dark:text-gray-400">Provider Phone</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-right">{r.provider?.phone || '-'}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                            <span className="text-gray-500 dark:text-gray-400 shrink-0">Customer Location</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-right break-words max-w-[70%]">{r.location || '-'}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                            <span className="text-gray-500 dark:text-gray-400 shrink-0">Provider Location</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-right break-words max-w-[70%]">{r.provider?.location || '-'}</span>
                          </div>
                          {['CANCELLED', 'CANCELLATION_PENDING'].includes(st) && (
                            <>
                              <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                                <span className="text-gray-500 dark:text-gray-400">Cancelled By</span>
                                <span className="font-semibold text-red-600 dark:text-red-400 text-right">{r.cancelledBy || '-'}</span>
                              </div>
                              <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                                <span className="text-gray-500 dark:text-gray-400">Reason</span>
                                <span className="font-semibold text-gray-800 dark:text-gray-200 text-right break-words max-w-[70%]">
                                  {r.cancelReasonCategory} {r.cancelReasonDescription ? `(${r.cancelReasonDescription})` : ''}
                                </span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                            <span className="text-gray-500 dark:text-gray-400">Total Request Price</span>
                            <span className="font-bold text-gray-800 dark:text-gray-100 text-right">Rs. {finalPrice.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                            <span className="text-gray-500 dark:text-gray-400">Original Commission</span>
                            <span className="font-bold text-red-600 dark:text-red-400 text-right">Rs. {originalCommission.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                            <span className="text-gray-500 dark:text-gray-400">Admin Refund</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400 text-right">Rs. {adminRefund.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                            <span className="text-gray-500 dark:text-gray-400">Final Commission Deducted</span>
                            <span className="font-bold text-orange-600 dark:text-orange-400 text-right">Rs. {finalCommission.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 md:col-span-2 bg-green-50 dark:bg-green-900/10 p-2 rounded">
                            <span className="text-green-700 dark:text-green-400 font-semibold">Provider Final Amount</span>
                            <span className="font-bold text-green-700 dark:text-green-400 text-right">Rs. {providerAmount.toFixed(0)}</span>
                          </div>
                          {r.adminRemarks && (
                            <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 md:col-span-2">
                              <span className="text-gray-500 dark:text-gray-400">Admin Remarks</span>
                              <span className="font-semibold text-gray-800 dark:text-gray-200 text-right break-words max-w-[70%]">{r.adminRemarks}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {requests.length === 0 && (
                <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-500">No requests found in database.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 👇 CANCELLATIONS TAB 👇 */}
        {tab === 'cancellations' && !isStandaloneView && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Cancellation Requests</h2>
            {requests.filter(r => r.status === 'CANCELLATION_PENDING').length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-10 rounded-xl text-center shadow-sm">
                <p className="text-gray-500">No pending cancellation requests.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requests.filter(r => r.status === 'CANCELLATION_PENDING').map(req => (
                  <div key={req.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-2 border-red-300 dark:border-red-900">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">Request #{req.id}</h3>
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">PENDING</span>
                    </div>
                    <div className="text-sm space-y-1 mb-4 text-gray-600 dark:text-gray-400">
                      <p><strong>Initiated By:</strong> {req.cancelledBy}</p>
                      <p><strong>Reason:</strong> {req.cancelReasonCategory}</p>
                      <p><strong>Description:</strong> {req.cancelReasonDescription || '-'}</p>
                      <p><strong>Booking Price:</strong> Rs. {req.originalBookingPrice || req.agreedPrice || req.offeredPrice}</p>
                    </div>
                    <button onClick={() => { setSelectedCancelReq(req); setRefundAmount(req.originalBookingPrice || req.agreedPrice || req.offeredPrice || 0); }} className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-bold text-sm">
                      Review & Decide
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 👇 WALLETS & COMMISSION TAB 👇 */}
        {tab === 'wallets' && !isStandaloneView && (
          <div className="space-y-4">
            
            {/* 1. Commission Control */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <AccordionHeader 
                id="control" 
                icon="⚙️" 
                title="Commission Control" 
                badgeCount={0} 
                isOpen={openSection === 'control'} 
                hasDot={false}
              />
              <div className={`transition-all duration-300 ease-in-out ${openSection === 'control' ? 'max-h-[500px] opacity-100 p-6' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className={`rounded-xl shadow-sm p-6 border ${privacySettings.commissionEnabled ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} flex items-center justify-between`}>
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">{privacySettings.commissionEnabled ? '🟢 Commission System is ON' : '🔴 Commission System is OFF'}</h2>
                    <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">{privacySettings.commissionEnabled ? 'Providers se commission deduct ho raha hai.' : 'App completely free hai. Koi commission deduct nahi ho raha.'}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={privacySettings.commissionEnabled} onChange={(e) => handleTogglePrivacy('commissionEnabled', e.target.checked)} className="sr-only peer" />
                    <div className="w-16 h-8 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* 2. Service-wise Commission Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <AccordionHeader 
                id="settings" 
                icon="🛠️" 
                title="Service-wise Commission Settings" 
                badgeCount={0} 
                isOpen={openSection === 'settings'} 
                hasDot={accordionBadges.settings} 
              />
              <div className={`transition-all duration-300 ease-in-out ${openSection === 'settings' ? 'max-h-[2000px] opacity-100 p-6' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="space-y-3">
                  <div className="flex flex-col md:flex-row items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex-1 font-semibold text-blue-800 dark:text-blue-300">Global Default Commission (%)</div>
                    <input type="number" value={commissions['global'] || ''} onChange={(e) => setCommissions({ ...commissions, global: e.target.value })} placeholder="e.g. 10" className="w-24 px-3 py-1.5 border border-blue-300 rounded-lg focus:outline-none text-center font-bold text-black dark:text-white bg-white dark:bg-gray-800" />
                    <button onClick={() => handleUpdateCommission('global')} disabled={commissionSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-bold text-sm">Update</button>
                  </div>
                  {services.map((svc) => (
                    <div key={svc.id} className="flex flex-col md:flex-row items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex-1 font-medium text-gray-800 dark:text-gray-200">{svc.icon} {svc.name}</div>
                      <input type="number" value={commissions[svc.id] || ''} onChange={(e) => setCommissions({ ...commissions, [svc.id]: e.target.value })} placeholder="e.g. 15" className="w-24 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none text-center font-bold" />
                      <button onClick={() => handleUpdateCommission(svc.id)} disabled={commissionSaving} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg font-bold text-sm">Set</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Provider Wallets */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <AccordionHeader 
                id="wallets" 
                icon="💼" 
                title="Provider Wallets" 
                badgeCount={0} 
                isOpen={openSection === 'wallets'} 
                hasDot={accordionBadges.wallets} 
              />
              <div className={`transition-all duration-300 ease-in-out ${openSection === 'wallets' ? 'max-h-[2000px] opacity-100 p-6' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Provider Name</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Email</th><th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300">Balance (PKR)</th></tr></thead>
                    <tbody>
                      {wallets.map((w) => (<tr key={w.walletId} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30"><td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-100">{w.name}</td><td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{w.email}</td><td className="px-4 py-3 text-sm font-bold text-right text-green-600 dark:text-green-400">Rs. {w.balance}</td></tr>))}
                      {wallets.length === 0 && <tr><td colSpan="3" className="text-center py-6 text-gray-500">No wallets found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 4. All Recent Transactions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <AccordionHeader 
                id="transactions" 
                icon="📊" 
                title="All Recent Transactions" 
                badgeCount={0} 
                isOpen={openSection === 'transactions'} 
                hasDot={accordionBadges.transactions} 
              />
              <div className={`transition-all duration-300 ease-in-out ${openSection === 'transactions' ? 'max-h-[3000px] opacity-100 p-6' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Date</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Provider</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Type</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Ref ID</th><th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300">Amount (PKR)</th></tr></thead>
                    <tbody>
                      {allTransactions.map((txn, idx) => {
                        const isCredit = txn.type === 'TOP_UP' || txn.type === 'REFUND';
                        return (<tr key={idx} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30"><td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{new Date(txn.createdAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}</td><td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-100">{txn.providerName || 'Unknown'}</td><td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-bold ${isCredit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{txn.type.replace('_', ' ')}</span></td><td className="px-4 py-3 text-xs text-gray-500 font-mono">{txn.referenceId || '-'}</td><td className={`px-4 py-3 text-sm font-bold text-right ${isCredit ? 'text-green-600' : 'text-red-600'}`}>{isCredit ? '+' : '-'}{Math.abs(txn.amount)}</td></tr>);
                      })}
                      {allTransactions.length === 0 && <tr><td colSpan="5" className="text-center py-6 text-gray-500">No transactions found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 👇 PRIVACY TAB 👇 */}
        {tab === 'privacy' && !isStandaloneView && privacySettings && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">👤 Customer Information Management</h2>
              <div className="space-y-3">
                {[{ key: 'hideCustomerName', label: 'Hide Customer Name' },{ key: 'hideCustomerEmail', label: 'Hide Customer Email' },{ key: 'hideCustomerPhone', label: 'Hide Customer Phone' },{ key: 'hideCustomerPicture', label: 'Hide Customer Profile Picture' }].map((item) => (
                  <div key={item.key} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg"><span className="font-medium text-gray-800 dark:text-gray-200">{item.label}</span><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={privacySettings[item.key]} onChange={(e) => handleTogglePrivacy(item.key, e.target.checked)} className="sr-only peer" /><div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-500"></div></label></div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">🔧 Provider Information Management</h2>
              <div className="space-y-3">
                {[{ key: 'hideProviderName', label: 'Hide Provider Name' },{ key: 'hideProviderEmail', label: 'Hide Provider Email' },{ key: 'hideProviderPhone', label: 'Hide Provider Phone' },{ key: 'hideProviderPicture', label: 'Hide Provider Profile Picture' },{ key: 'hideProviderLocation', label: 'Hide Provider Location' },{ key: 'hideProviderExperience', label: 'Hide Provider Experience' },{ key: 'hideProviderPrice', label: 'Hide Provider Service Price' }].map((item) => (
                  <div key={item.key} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg"><span className="font-medium text-gray-800 dark:text-gray-200">{item.label}</span><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={privacySettings[item.key]} onChange={(e) => handleTogglePrivacy(item.key, e.target.checked)} className="sr-only peer" /><div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-500"></div></label></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 👇 CUSTOMERS TAB 👇 */}
        {tab === 'customers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {customers.map((c) => {
              const myReqs = getCustomerRequests(c.id); const counts = getCounts(myReqs); const isOpen = expandedCustomer === c.id; const isNewest = c.id === customers[0]?.id;
              return (
                <div key={c.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border-2 transition-all ${isNewest ? 'border-green-400 ring-2 ring-green-200 dark:ring-green-900' : 'border-gray-200 dark:border-gray-700'} ${isOpen ? 'md:col-span-2 lg:col-span-3' : ''}`}>
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white relative">{isNewest && (<span className="absolute top-2 right-2 bg-green-400 text-green-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">🆕 NEW</span>)}<div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold flex-shrink-0">{c.name?.charAt(0).toUpperCase() || '?'}</div><div className="flex-1 min-w-0"><h3 className="text-lg font-bold truncate">{c.name}</h3><p className="text-xs opacity-90">ID: #{c.id}</p></div></div></div>
                  <div className="p-4 space-y-2 text-sm text-gray-600 dark:text-gray-300"><p className="truncate">📧 {c.email || '-'}</p><p>📞 {c.phone || '-'}</p></div>
                  <div className="px-4 pb-3 flex flex-wrap gap-1"><span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full text-xs font-semibold">Total: {counts.total}</span><span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-full text-xs font-semibold">⏳ {counts.pending}</span><span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full text-xs font-semibold">✅ {counts.accepted}</span><span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full text-xs font-semibold">❌ {counts.rejected}</span></div>
                  <div className="p-4 pt-0 grid grid-cols-3 gap-2"><button onClick={() => setExpandedCustomer(isOpen ? null : c.id)} className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold text-sm transition">{isOpen ? '▲ Hide' : '▼ Details'}</button><button onClick={() => handleViewCustomerReviews(c)} className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg font-semibold text-sm transition">⭐ Reviews</button><button onClick={() => handleDeleteUser(c.id)} className="bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold text-sm transition">Delete</button></div>
                  {isOpen && (<div className="border-t-2 border-blue-500 bg-gray-50 dark:bg-gray-900/50 p-5"><div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5"><div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"><h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">📋 Contact Information</h4><div className="space-y-2 text-sm"><p><span className="text-gray-500">Full Name:</span> <strong>{c.name || '-'}</strong></p><p><span className="text-gray-500">Email:</span> {c.email || '-'}</p><p><span className="text-gray-500">Phone:</span> <strong>{c.phone || '-'}</strong></p><p><span className="text-gray-500">Role:</span> <span className="text-blue-600 font-semibold">{c.role}</span></p><p><span className="text-gray-500">User ID:</span> #{c.id}</p></div></div><div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"><h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">📊 Request Summary</h4><div className="grid grid-cols-2 gap-3"><div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-blue-600">{counts.total}</p><p className="text-xs text-gray-500">Total</p></div><div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-yellow-600">{counts.pending}</p><p className="text-xs text-gray-500">Pending</p></div><div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-green-600">{counts.accepted}</p><p className="text-xs text-gray-500">Accepted</p></div><div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-red-600">{counts.rejected}</p><p className="text-xs text-gray-500">Rejected</p></div></div></div></div><div><h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">📩 All Requests ({myReqs.length})</h4>{myReqs.length === 0 ? (<p className="text-center text-gray-500 text-sm py-6 bg-white dark:bg-gray-800 rounded-lg">Is customer ne koi request nahi bheji</p>) : (<div className="space-y-2">{myReqs.map((r) => { const st = (r.status || '').toUpperCase(); const color = st === 'ACCEPTED' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : st === 'PENDING' ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'; return (<div key={r.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"><div className="flex justify-between items-start mb-2"><p className="font-semibold text-gray-800 dark:text-gray-100">Request #{r.id} → {r.provider?.name || '-'}</p><span className={`px-2 py-1 rounded-full text-xs font-bold ${color}`}>{st}</span></div><div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs text-gray-600 dark:text-gray-400"><p>🔧 <strong>Service:</strong> {r.provider?.service || '-'}</p><p>📅 <strong>Date:</strong> {r.preferredDate || '-'}</p><p>🕐 <strong>Time:</strong> {formatTime(r.preferredTime)}</p><p>📍 <strong>Location:</strong> {r.location || '-'}</p><p>🏠 <strong>Type:</strong> {r.locationType || '-'}</p>{r.locationNote && <p className="md:col-span-2">📝 <strong>Note:</strong> {r.locationNote}</p>}</div>{r.message && <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-700/50 p-2 rounded">"{r.message}"</p>}</div>); })}</div>)}</div></div>)}
                </div>
              );
            })}
            {customers.length === 0 && <p className="col-span-full text-center py-8 text-gray-500">No customers</p>}
          </div>
        )}

        {/* 👇 PROVIDERS TAB 👇 */}
        {tab === 'providers' && !isStandaloneView && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"><table className="w-full"><thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">ID</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Name</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Email</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Phone</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Action</th></tr></thead><tbody>{providerUsers.map((u) => (<tr key={u.id} className="border-t border-gray-100 dark:border-gray-700"><td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{u.id}</td><td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-100">{u.name}</td><td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{u.email}</td><td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{u.phone}</td><td className="px-4 py-3"><button onClick={() => handleDeleteUser(u.id)} className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold">Delete</button></td></tr>))}</tbody></table></div>
        )}

        {/* 👇 SERVICES TAB 👇 */}
        {tab === 'services' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"><h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">{svcEditId ? '✏️ Edit Service' : '➕ Add New Service'}</h2>{svcError && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg mb-3 text-sm">{svcError}</div>}<form onSubmit={handleServiceSubmit} className="space-y-3"><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service Name *</label><input type="text" required value={svcForm.name} onChange={(e) => setSvcForm({ ...svcForm, name: e.target.value })} placeholder="e.g. Electrician" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon (emoji)</label><input type="text" value={svcForm.icon} onChange={(e) => setSvcForm({ ...svcForm, icon: e.target.value })} placeholder="⚡ 🔧 👨‍🔧" maxLength={10} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label><select value={svcForm.color} onChange={(e) => setSvcForm({ ...svcForm, color: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"><option value="">-- Select color --</option><option value="bg-yellow-500">Yellow</option><option value="bg-blue-500">Blue</option><option value="bg-cyan-500">Cyan</option><option value="bg-purple-500">Purple</option><option value="bg-green-500">Green</option><option value="bg-pink-500">Pink</option><option value="bg-orange-500">Orange</option><option value="bg-indigo-500">Indigo</option><option value="bg-teal-500">Teal</option><option value="bg-red-500">Red</option><option value="bg-rose-500">Rose</option><option value="bg-gray-500">Gray</option></select></div><div className="flex gap-2"><button type="submit" disabled={svcSaving} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50 transition">{svcSaving ? 'Saving...' : (svcEditId ? 'Update' : 'Add')}</button>{svcEditId && <button type="button" onClick={cancelServiceEdit} className="px-4 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 text-gray-800 dark:text-gray-100 rounded-lg font-semibold transition">Cancel</button>}</div></form></div>
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"><h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">All Services ({services.length})</h2>{services.length === 0 ? (<p className="text-center text-gray-500 py-8">No services yet</p>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-3">{services.map((s) => (<div key={s.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg"><div className="flex items-center gap-3"><div className={`${s.color} w-10 h-10 rounded-lg flex items-center justify-center text-xl`}>{s.icon}</div><div><p className="font-semibold text-gray-800 dark:text-gray-100">{s.name}</p><p className="text-xs text-gray-500">ID: {s.id}</p></div></div><div className="flex gap-1"><button onClick={() => handleServiceEdit(s)} className="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs font-semibold">Edit</button><button onClick={() => handleServiceDelete(s.id)} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold">Del</button></div></div>))}</div>)}</div>
          </div>
        )}

        {/* 👇 REVIEW CANCELLATION MODAL 👇 */}
        {selectedCancelReq && (() => {
          const r = selectedCancelReq;
          const finalPrice = Number(r.originalBookingPrice || r.agreedPrice || r.offeredPrice || r.provider?.rate || 0);
          
          const commTxn = allTransactions.find(t => t.type === 'COMMISSION_DEDUCTION' && t.referenceId === `REQ-${r.id}`);
          let commissionAmount = commTxn ? Math.abs(commTxn.amount) : (Number(r.commissionAmount) || 0);
          
          if (commissionAmount === 0) {
              let rate = commissions['global'] !== undefined ? Number(commissions['global']) : 10;
              if (r.provider?.service) {
                  const svc = services.find(s => s.name === r.provider.service);
                  if (svc && commissions[svc.id] !== undefined) rate = Number(commissions[svc.id]);
              }
              commissionAmount = finalPrice * (rate / 100);
          }

          return (
            <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Review Cancellation</h2>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl mb-6 text-sm">
                  <p className="mb-1"><strong>Request ID:</strong> #{r.id}</p>
                  <p className="mb-1"><strong>Service:</strong> {r.provider?.service || '-'}</p>
                  <p className="mb-1"><strong>Cancelled By:</strong> {r.cancelledBy}</p>
                  <p className="mb-1"><strong>Reason:</strong> {r.cancelReasonCategory}</p>
                  <p className="mb-1"><strong>Description:</strong> {r.cancelReasonDescription || '-'}</p>
                  <p className="mb-1"><strong>Original Request Price:</strong> Rs. {finalPrice.toFixed(0)}</p>
                  <p className="mb-1"><strong>Commission Amount:</strong> Rs. {commissionAmount.toFixed(0)}</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Refund Amount (Rs.)</label>
                  <input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleCancelDecision('APPROVED')} disabled={processing} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition">Approve & Refund</button>
                  <button onClick={() => handleCancelDecision('REJECTED')} disabled={processing} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition">Reject Cancellation</button>
                  <button onClick={() => setSelectedCancelReq(null)} className="px-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 py-3 rounded-xl font-bold">Close</button>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}

export default AdminPanel;

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profilePic, setProfilePic] = useState(user?.profilePicture || '');

  const [customerNotifCount, setCustomerNotifCount] = useState(0);
  const [providerNotifCount, setProviderNotifCount] = useState(0);

  // 👇 NAYE STATES: Admin Navbar Independent Badges 👇
  const [adminNewCustomers, setAdminNewCustomers] = useState(0);
  const [adminNewProviders, setAdminNewProviders] = useState(0);
  const [adminNewRequests, setAdminNewRequests] = useState(0);

  // 👇 Admin Panel (Overview) ke liye alag states 👇
  const [adminNewOverview, setAdminNewOverview] = useState(0);

  const maxAdminIdsRef = useRef({ customers: 0, providers: 0, requests: 0 });

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      try {
        const res = await api.get('/profile/me');
        setProfilePic(res.data.profilePicture || '');
      } catch (err) {}
    };
    loadProfile();
  }, [user, location.pathname]);

  // 👇 ADMIN NOTIFICATION LOGIC (Independent Tracking) 👇
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    const fetchAdminCounts = async () => {
      try {
        const [uRes, rRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/requests')
        ]);
        const users = uRes.data || [];
        const reqs = rRes.data || [];

        // 1. Tab-specific seen IDs
        const seenCust = parseInt(localStorage.getItem('adminSeenCustomers') || '0');
        const seenProv = parseInt(localStorage.getItem('adminSeenProviders') || '0');
        const seenReq = parseInt(localStorage.getItem('adminSeenRequests') || '0');

        // 2. Overview-specific seen IDs (Independent)
        const seenOvCust = parseInt(localStorage.getItem('adminSeenOvCust') || '0');
        const seenOvProv = parseInt(localStorage.getItem('adminSeenOvProv') || '0');
        const seenOvReq = parseInt(localStorage.getItem('adminSeenOvReq') || '0');

        // Calculate max IDs for current data
        const maxCust = Math.max(0, ...users.filter(u => u.role === 'CUSTOMER').map(u => u.id));
        const maxProv = Math.max(0, ...users.filter(u => u.role === 'PROVIDER').map(u => u.id));
        const maxReq = Math.max(0, ...reqs.map(r => r.id));

        maxAdminIdsRef.current = { customers: maxCust, providers: maxProv, requests: maxReq };

        // Set Individual Tab Counts
        setAdminNewCustomers(users.filter(u => u.role === 'CUSTOMER' && u.id > seenCust).length);
        setAdminNewProviders(users.filter(u => u.role === 'PROVIDER' && u.id > seenProv).length);
        setAdminNewRequests(reqs.filter(r => r.id > seenReq).length);

        // Set Overview Count (Independent)
        const ovNewCust = users.filter(u => u.role === 'CUSTOMER' && u.id > seenOvCust).length;
        const ovNewProv = users.filter(u => u.role === 'PROVIDER' && u.id > seenOvProv).length;
        const ovNewReq = reqs.filter(r => r.id > seenOvReq).length;

        setAdminNewOverview(ovNewCust + ovNewProv + ovNewReq);

      } catch (err) {}
    };
    fetchAdminCounts();
    const interval = setInterval(fetchAdminCounts, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // 👇 INDEPENDENT CLICK HANDLER 👇
  const handleAdminLinkClick = (to) => {
    if (to === '/admin') {
      // Sirf Overview clear hoga
      localStorage.setItem('adminSeenOvCust', maxAdminIdsRef.current.customers);
      localStorage.setItem('adminSeenOvProv', maxAdminIdsRef.current.providers);
      localStorage.setItem('adminSeenOvReq', maxAdminIdsRef.current.requests);
      setAdminNewOverview(0);
    } else if (to === '/admin?tab=customers') {
      localStorage.setItem('adminSeenCustomers', maxAdminIdsRef.current.customers);
      setAdminNewCustomers(0);
    } else if (to === '/providers') {
      localStorage.setItem('adminSeenProviders', maxAdminIdsRef.current.providers);
      setAdminNewProviders(0);
    } else if (to === '/admin?tab=requests_history') {
      localStorage.setItem('adminSeenRequests', maxAdminIdsRef.current.requests);
      setAdminNewRequests(0);
    }
  };

  // 👇 CUSTOMER NOTIFICATION LOGIC (FIXED: Synced with Backend) 👇
  useEffect(() => {
    if (!user || user.role !== 'CUSTOMER') return;
    const checkUpdates = async () => {
      try {
        const res = await api.get(`/requests/user/${user.id}`);
        const requests = res.data || [];

        const activeStatuses = ['PENDING', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'CANCELLATION_PENDING', 'AWAITING_REVIEW'];
        const activeReqs = requests.filter(r => activeStatuses.includes((r.status || '').toUpperCase()));

        const highestActiveId = Math.max(0, ...activeReqs.map(r => Number(r.id) || 0));

        const terminalStatuses = ['REJECTED', 'CANCELLED', 'EXPIRED'];
        const unreadTerminal = requests.filter(r => {
          const st = (r.status || '').toUpperCase();
          const isTerminal = terminalStatuses.includes(st);
          // 👇 LOCAL STORAGE KI JAGAH BACKEND FIELD CHECK KIYA HAI 👇
          const isUnread = !r.isReadByCustomer;
          const isOlderThanActive = Number(r.id) < highestActiveId;
          return isTerminal && isUnread && !isOlderThanActive;
        });

        setCustomerNotifCount(activeReqs.length + unreadTerminal.length);
      } catch (err) { }
    };
    checkUpdates();
    const interval = setInterval(checkUpdates, 5000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  // Provider Notification Logic
  useEffect(() => {
    if (!user || user.role !== 'PROVIDER') { setProviderNotifCount(0); return; }
    const loadPendingCount = async () => {
      try {
        const provRes = await api.get('/providers');
        const myProviders = (provRes.data || []).filter((p) => p.userId === user.id);
        if (myProviders.length === 0) { setProviderNotifCount(0); return; }

        const promises = myProviders.map(p => api.get(`/requests/provider/${p.id}`));
        const responses = await Promise.all(promises);

        const seenIds = JSON.parse(localStorage.getItem(`seenRequests_${user.id}`) || '[]');
        let count = 0;

        responses.forEach(res => {
          const reqs = res.data || [];
          const activeReqs = reqs.filter(r =>
              ['PENDING', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'CANCELLATION_PENDING'].includes((r.status || '').toUpperCase())
          );
          count += activeReqs.filter(r => !seenIds.map(String).includes(String(r.id))).length;
        });
        setProviderNotifCount(count);
      } catch (err) { console.error(err); }
    };
    loadPendingCount();
    const interval = setInterval(loadPendingCount, 10000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  if (!user) return null;
  const role = user.role;

  let links = [];
  if (role === 'CUSTOMER') {
    links = [ { to: '/home', label: 'Home' }, { to: '/providers', label: 'Providers' } ];
  } else if (role === 'PROVIDER') {
    // 👇 SIRF YEH LINE CHANGE HUI HAI 👇
    links = [ { to: '/dashboard', label: 'Dashboard' }, { to: '/wallet', label: 'My Wallet' }, { to: '/add-provider', label: 'Add Service' }, { to: '/my-services', label: 'My Services' } ];
  } else if (role === 'ADMIN') {
    links = [
      { to: '/admin', label: 'Admin Panel' },
      { to: '/admin?tab=customers', label: 'Customers' },
      { to: '/admin?tab=services', label: 'Services' },
      { to: '/providers', label: 'Providers' },
      { to: '/admin?tab=requests_history', label: '📜 All Requests' },
    ];
  }

  const isActive = (linkTo) => {
    if (linkTo === '/admin') return location.pathname === '/admin' && !location.search.includes('tab=');
    if (linkTo.includes('tab=customers')) return location.pathname === '/admin' && location.search.includes('tab=customers');
    if (linkTo.includes('tab=services')) return location.pathname === '/admin' && location.search.includes('tab=services');
    if (linkTo.includes('tab=requests_history')) return location.pathname === '/admin' && location.search.includes('tab=requests_history');
    return location.pathname === linkTo;
  };

  const linkClass = (linkTo) => `relative px-3 py-2 rounded-lg text-sm font-medium transition ${isActive(linkTo) ? 'bg-primary-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-gray-800'}`;

  const BellButton = () => {
    if (role === 'CUSTOMER') {
      return (
          <button onClick={() => navigate('/notifications')} className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition mr-2" title="Notifications">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {customerNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 border-2 border-white dark:border-gray-800 animate-pulse">
              {customerNotifCount > 99 ? '99+' : customerNotifCount}
            </span>
            )}
          </button>
      );
    }

    if (role === 'PROVIDER') {
      return (
          <button onClick={() => navigate('/dashboard')} className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition mr-2" title="Pending Requests">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {providerNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 border-2 border-white dark:border-gray-800">
              {providerNotifCount > 99 ? '99+' : providerNotifCount}
            </span>
            )}
          </button>
      );
    }
    return null;
  };

  const ProfileButton = () => (
      <button onClick={() => navigate('/profile')} title={`${user.name} — View Profile`} className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
        <span className="hidden md:inline text-sm font-semibold text-gray-800 dark:text-gray-100 max-w-[120px] truncate">{user.name}</span>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden border-2 border-white dark:border-gray-700 shadow-sm flex-shrink-0">
          {profilePic ? <img src={profilePic} alt={user.name} className="w-full h-full object-cover" /> : <span>{user.name?.charAt(0).toUpperCase() || '?'}</span>}
        </div>
      </button>
  );

  return (
      <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to={role === 'ADMIN' ? '/admin' : role === 'PROVIDER' ? '/dashboard' : '/home'} className="text-xl md:text-2xl font-bold text-primary-600 dark:text-primary-500 flex-shrink-0">🔧 ServiceFinder</Link>

            <div className="hidden md:flex items-center gap-1 flex-1 justify-end">
              {links.map((l) => {
                let badgeCount = 0;
                if (role === 'ADMIN') {
                  if (l.to === '/admin') badgeCount = adminNewOverview;
                  else if (l.to === '/admin?tab=customers') badgeCount = adminNewCustomers;
                  else if (l.to === '/providers') badgeCount = adminNewProviders;
                  else if (l.to === '/admin?tab=requests_history') badgeCount = adminNewRequests;
                }
                return (
                    <Link
                        key={l.to}
                        to={l.to}
                        className={linkClass(l.to)}
                        onClick={() => { if (role === 'ADMIN') handleAdminLinkClick(l.to); }}
                    >
                      {l.label}
                      {badgeCount > 0 && (
                          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 border-2 border-white dark:border-gray-800">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                      )}
                    </Link>
                );
              })}
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
              <BellButton />
              <ProfileButton />
            </div>

            <div className="flex md:hidden items-center gap-2">
              <BellButton />
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white">{menuOpen ? '✖' : '☰'}</button>
            </div>
          </div>

          {menuOpen && (
              <div className="md:hidden py-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
                <button onClick={() => { navigate('/profile'); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 mb-2">
                  <div className="flex-1 text-left"><p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{user.name}</p><p className="text-xs text-gray-500 dark:text-gray-400 truncate">View Profile →</p></div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">{profilePic ? <img src={profilePic} alt={user.name} className="w-full h-full object-cover" /> : <span>{user.name?.charAt(0).toUpperCase() || '?'}</span>}</div>
                </button>
                {links.map((l) => {
                  let badgeCount = 0;
                  if (role === 'ADMIN') {
                    if (l.to === '/admin') badgeCount = adminNewOverview;
                    else if (l.to === '/admin?tab=customers') badgeCount = adminNewCustomers;
                    else if (l.to === '/providers') badgeCount = adminNewProviders;
                    else if (l.to === '/admin?tab=requests_history') badgeCount = adminNewRequests;
                  }
                  return (
                      <Link
                          key={l.to}
                          to={l.to}
                          onClick={() => { if (role === 'ADMIN') handleAdminLinkClick(l.to); setMenuOpen(false); }}
                          className={`flex justify-between items-center ${linkClass(l.to)}`}
                      >
                        <span>{l.label}</span>
                        {badgeCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                        )}
                      </Link>
                  );
                })}
              </div>
          )}
        </div>
      </nav>
  );
}

export default Navbar;
import { useEffect, useState, useRef } from 'react';
import { getServices } from '../../services/api';
import ServiceIcon from '../service/ServiceIcon';

const FALLBACK_SERVICES = [
  { name: 'Electrician' },
  { name: 'Plumber' },
  { name: 'AC Technician' },
  { name: 'Computer Repair' },
  { name: 'Tutor' },
  { name: 'Painter' },
];

function ServiceSelect({ value, onChange, services: externalServices }) {
  const [services, setServices] = useState(externalServices || FALLBACK_SERVICES);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (externalServices) {
      setServices(externalServices);
      return;
    }
    const load = async () => {
      try {
        const res = await getServices();
        if (res.data && res.data.length > 0) setServices(res.data);
      } catch (err) {
        console.error('Services load failed:', err);
      }
    };
    load();
  }, [externalServices]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = services.find((s) => s.name === value);

  return (
      <div ref={ref} className="relative flex-1">
        <button
            type="button"
            onClick={() => setOpen(!open)}
            className="w-full flex items-center gap-3 px-4 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 min-h-[56px] text-left transition"
        >
          {/* Icon — bigger */}
          <span
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
          >
          {selected ? (
              // 👇 YAHAN FIX KIYA HAI: Database se aaya hua icon pehle show hoga, warna fallback 👇
              selected.icon ? (
                  <span style={{ fontSize: '24px' }}>{selected.icon}</span>
              ) : (
                  <ServiceIcon name={selected.name} size={30} />
              )
          ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
          )}
        </span>

          {/* Text — bigger */}
          <span className={`flex-1 text-base md:text-lg truncate ${value ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
          {value || 'Select Service'}
        </span>

          <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1.5 max-h-80 overflow-y-auto z-50">
              <button
                  type="button"
                  onClick={() => { onChange(''); setOpen(false); }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 text-base"
              >
            <span style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
                <span className="flex-1 text-left">All Services</span>
              </button>

              {services.map((s, idx) => (
                  <button
                      type="button"
                      key={s.id || idx}
                      onClick={() => { onChange(s.name); setOpen(false); }}
                      className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${value === s.name ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
                  >
              <span style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {/* 👇 YAHAN BHI FIX KIYA HAI: List mein database ka emoji show hoga 👇 */}
                {s.icon ? (
                    <span style={{ fontSize: '24px' }}>{s.icon}</span>
                ) : (
                    <ServiceIcon name={s.name} size={30} />
                )}
              </span>
                    <span className="text-base md:text-lg text-gray-800 dark:text-gray-200 flex-1 text-left">{s.name}</span>
                    {value === s.name && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                  </button>
              ))}
            </div>
        )}
      </div>
  );
}

export default ServiceSelect;
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PasswordInput from '../../components/auth/PasswordInput';

function RegisterCustomerPhone() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const sendOtp = async () => {
    if (!phone) { setError('Please enter phone number'); return; }
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await fetch('http://localhost:8082/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setOtpSent(true);
      setDemoOtp(data.demoOtp || '');
      setSuccess('OTP sent! Check the yellow hint below.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) { setError('Please enter OTP'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('http://localhost:8082/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      setVerified(true);
      setSuccess('Phone verified! Ab password set karein.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!verified) { setError('Please verify phone first'); return; }
    if (password.length < 4) { setError('Password must be at least 4 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setError(''); setLoading(true);
    try {
      const res = await fetch('http://localhost:8082/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${firstName} ${lastName}`.trim(),
          email: '',
          phone,
          password,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Registration failed');
      }
      const user = await res.json();
      login(user);
      navigate('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-900 px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg">

        <button onClick={() => navigate('/register/customer')}
          className="text-sm text-primary-600 hover:underline mb-4">
          ← Back to options
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-500">
            📱 Sign up with Phone
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Verify your phone to continue
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg mb-4 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>First Name *</label>
              <input type="text" required value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass} placeholder="Ali" />
            </div>
            <div>
              <label className={labelClass}>Last Name *</label>
              <input type="text" required value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass} placeholder="Khan" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Phone Number *</label>
            <div className="flex gap-3">
              <input type="tel" required value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={otpSent}
                className={`${inputClass} flex-1 disabled:opacity-60`}
                placeholder="0300-1234567" />
              <button type="button" onClick={sendOtp}
                disabled={loading || otpSent || verified}
                className="whitespace-nowrap px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50 transition">
                {verified ? 'Verified ✓' : otpSent ? 'Sent ✓' : 'Send OTP'}
              </button>
            </div>
          </div>

          {otpSent && !verified && (
            <div>
              <label className={labelClass}>Enter OTP *</label>
              <div className="flex gap-3">
                <input type="text" value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className={`${inputClass} flex-1`}
                  placeholder="6-digit code" maxLength={6} />
                <button type="button" onClick={verifyOtp} disabled={loading}
                  className="whitespace-nowrap px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50 transition">
                  Verify
                </button>
              </div>
              {demoOtp && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                  💡 Dev Mode — OTP: <strong className="font-mono">{demoOtp}</strong>
                </p>
              )}
            </div>
          )}

          {verified && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg text-sm">
              ✅ Phone verified — ab password set karein
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Password *</label>
              <PasswordInput value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 4 characters"
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Confirm Password *</label>
              <PasswordInput value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className={inputClass} />
            </div>
          </div>

          <button type="submit" disabled={loading || !verified}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:underline font-semibold">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterCustomerPhone;

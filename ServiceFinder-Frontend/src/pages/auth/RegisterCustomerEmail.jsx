import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PasswordInput from '../../components/auth/PasswordInput';

function RegisterCustomerEmail() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const sendEmailOtp = async () => {
    if (!email || !email.includes('@')) { setError('Please enter valid email'); return; }
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await fetch('http://localhost:8082/api/otp/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setEmailOtpSent(true);
      setSuccess('Email OTP sent! Check your inbox (also spam folder).');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOtp = async () => {
    if (!emailOtp) { setError('Please enter email OTP'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('http://localhost:8082/api/otp/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: emailOtp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      setEmailVerified(true);
      setSuccess('Email verified! Ab password set karein.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!emailVerified) { setError('Please verify email first'); return; }
    if (!firstName.trim()) { setError('First name required'); return; }
    if (password.length < 4) { setError('Password must be at least 4 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    setError(''); setLoading(true);
    try {
      const res = await fetch('http://localhost:8082/api/auth/register-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email,
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-900 px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg">

        <button onClick={() => navigate('/register/customer')}
          className="text-sm text-primary-600 hover:underline mb-4">
          ← Back to options
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            ✉ Sign up with Email
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Verify your email to continue
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
          {/* First Name + Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>First Name *</label>
              <input type="text" required value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={emailOtpSent}
                className={`${inputClass} disabled:opacity-60`}
                placeholder="Ali" />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input type="text" value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={emailOtpSent}
                className={`${inputClass} disabled:opacity-60`}
                placeholder="Khan" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Email Address *</label>
            <div className="flex gap-3">
              <input type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={emailOtpSent}
                className={`${inputClass} flex-1 disabled:opacity-60`}
                placeholder="ali@example.com" />
              <button type="button" onClick={sendEmailOtp}
                disabled={loading || emailOtpSent || emailVerified}
                className="whitespace-nowrap px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50 transition">
                {emailVerified ? 'Verified ✓' : emailOtpSent ? 'Sent ✓' : 'Send OTP'}
              </button>
            </div>
          </div>

          {emailOtpSent && !emailVerified && (
            <div>
              <label className={labelClass}>Enter Email OTP *</label>
              <div className="flex gap-3">
                <input type="text" value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value)}
                  className={`${inputClass} flex-1`}
                  placeholder="6-digit code" maxLength={6} />
                <button type="button" onClick={verifyEmailOtp} disabled={loading}
                  className="whitespace-nowrap px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50 transition">
                  Verify
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                📧 Check your email inbox (aur spam folder bhi)
              </p>
            </div>
          )}

          {emailVerified && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg text-sm">
              ✅ Email verified — ab password set karein
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

          <button type="submit" disabled={loading || !emailVerified}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition">
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

export default RegisterCustomerEmail;

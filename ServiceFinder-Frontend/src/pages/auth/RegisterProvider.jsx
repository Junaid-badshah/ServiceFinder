import { Link, useNavigate } from 'react-router-dom';
import GoogleSignIn from '../../components/auth/GoogleSignIn';

function RegisterProvider() {
  const navigate = useNavigate();

  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-900 px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-600 dark:text-green-500">
              Register as Provider
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Choose sign-up method
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4">

            {/* Google Sign-Up */}
            <GoogleSignIn />

            {/* OR Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">OR</span>
              <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
            </div>

            {/* Email Sign-Up */}
            <button
                onClick={() => navigate('/register/provider/email')}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Sign up with Email
            </button>

            {/* Phone Sign-Up */}
            <button
                onClick={() => navigate('/register/provider/phone')}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Sign up with Phone Number
            </button>

          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-green-600 hover:underline font-semibold">
                Login
              </Link>
            </p>
          </div>

        </div>
      </div>
  );
}

export default RegisterProvider;

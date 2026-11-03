import { Link, useNavigate } from 'react-router-dom';

function ProviderCard({ provider, onDelete }) {
  const navigate = useNavigate();

  const serviceColors = {
    Electrician: 'from-yellow-500 to-yellow-700',
    Plumber: 'from-blue-500 to-blue-700',
    'AC Technician': 'from-cyan-500 to-cyan-700',
    'Computer Repair': 'from-purple-500 to-purple-700',
    Tutor: 'from-green-500 to-green-700',
    Painter: 'from-pink-500 to-pink-700',
  };

  const gradient = serviceColors[provider.service] || 'from-gray-500 to-gray-700';

  return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-xl transition-all overflow-hidden flex flex-col">

        {/* 👇 YAHAN PROFILE PICTURE ADD KI HAI 👇 */}
        <div className={`bg-gradient-to-r ${gradient} p-4 flex items-center gap-3`}>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/50 shrink-0">
            {provider.profilePicture ? (
                <img src={provider.profilePicture} alt={provider.name} className="w-full h-full object-cover" />
            ) : (
                <span className="text-lg font-bold text-white">{provider.name?.charAt(0).toUpperCase() || '?'}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg md:text-xl font-bold text-white truncate">{provider.name}</h3>
            <p className="text-white/90 text-sm truncate">{provider.service}</p>
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">
            <p className="truncate">📍 {provider.location}</p>
            <p>💼 {provider.experience} years exp.</p>
            {provider.rating > 0 && <p>⭐ {provider.rating}/5</p>}
          </div>

          {provider.description && (
              <p className="text-gray-500 dark:text-gray-500 text-xs mb-4 line-clamp-2">
                {provider.description}
              </p>
          )}

          <div className="space-y-2">
            <Link
                to={`/providers/${provider.id}`}
                className="block text-center bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium text-sm transition"
            >
              View Details
            </Link>

            <div className="flex gap-2">
              <button
                  onClick={() => navigate(`/edit-provider/${provider.id}`)}
                  className="flex-1 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-800 dark:text-yellow-400 py-2 rounded-lg text-sm font-medium"
              >
                Edit
              </button>
              {onDelete && (
                  <button
                      onClick={() => onDelete(provider.id)}
                      className="flex-1 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 py-2 rounded-lg text-sm font-medium"
                  >
                    Delete
                  </button>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}

export default ProviderCard;
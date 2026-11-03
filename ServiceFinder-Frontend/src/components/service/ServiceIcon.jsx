// ============================================
// SERVICE ICONS — Real Emoji (native)
// Proper sizing so no cut/half rendering
// ============================================

function ServiceIcon({ name, size = 20, className = '' }) {
  const EMOJIS = {
    Electrician: '⚡',
    Plumber: '🔧',
    'AC Technician': '❄️',
    'Computer Repair': '💻',
    Tutor: '📚',
    Painter: '🎨',
    Carpenter: '🪚',
    'Mobile Repair': '📱',
    'Cleaning Service': '🧹',
    'Mover & Packer': '📦',
    Beautician: '💇',
    'Lawn care': '🌿',
    chef: '🍳',
    'Car driver': '🚗',
    Other: '🔨',
  };

  const emoji = EMOJIS[name] || '🔨';

  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.9,
        lineHeight: 1,
        flexShrink: 0,
        overflow: 'visible',
        fontFamily:
          '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "EmojiOne Color", "Android Emoji", sans-serif',
      }}
      role="img"
      aria-label={name}
    >
      {emoji}
    </span>
  );
}

export default ServiceIcon;

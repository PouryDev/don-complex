import React from 'react';

export const RoleIcon = ({ roleName, size = 120, color = '#ffffff' }) => {
  const iconMap = {
    'بازپرس': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <path
            d="M60 10 L75 20 L75 45 Q75 60 60 75 Q45 60 45 45 L45 20 Z"
            fill={color}
            opacity={0.9}
          />
          <circle cx="60" cy="42" r="8" fill="#1a1a1a" />
          <circle cx="60" cy="90" r="15" stroke={color} strokeWidth="3" fill="none" />
          <path d="M72 100 L85 113" stroke={color} strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>
    ),
    'محقق': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <rect x="35" y="20" width="50" height="70" rx="5" fill={color} opacity={0.9} />
          <rect x="42" y="30" width="36" height="3" fill="#1a1a1a" />
          <rect x="42" y="38" width="36" height="3" fill="#1a1a1a" />
          <rect x="42" y="46" width="24" height="3" fill="#1a1a1a" />
          <path
            d="M75 65 L90 80 L85 85 L70 70 Z"
            fill={color}
            opacity={0.9}
          />
          <circle cx="72" cy="68" r="3" fill="#1a1a1a" />
        </g>
      </svg>
    ),
    'دکتر': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <rect x="52" y="25" width="16" height="70" rx="3" fill={color} opacity={0.9} />
          <rect x="30" y="47" width="60" height="16" rx="3" fill={color} opacity={0.9} />
          <circle cx="60" cy="55" r="8" fill="#1a1a1a" />
        </g>
      </svg>
    ),
    'کارآگاه': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <rect x="35" y="40" width="50" height="8" rx="2" fill={color} opacity={0.9} />
          <path
            d="M45 40 L45 25 L75 25 L75 40"
            fill={color}
            opacity={0.9}
          />
          <circle cx="60" cy="75" r="18" stroke={color} strokeWidth="4" fill="none" />
          <circle cx="60" cy="75" r="12" stroke={color} strokeWidth="2" fill="none" opacity={0.5} />
          <path d="M74 88 L90 104" stroke={color} strokeWidth="5" strokeLinecap="round" />
        </g>
      </svg>
    ),
    'شهروند ساده': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <circle cx="60" cy="40" r="18" fill={color} opacity={0.9} />
          <path
            d="M35 95 Q35 65 60 65 Q85 65 85 95 Z"
            fill={color}
            opacity={0.9}
          />
        </g>
      </svg>
    ),
    'رویین‌تن': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <path
            d="M60 15 L85 25 L85 55 Q85 75 60 100 Q35 75 35 55 L35 25 Z"
            fill={color}
            opacity={0.9}
          />
          <path
            d="M60 30 L75 37 L75 55 Q75 68 60 85 Q45 68 45 55 L45 37 Z"
            fill="#1a1a1a"
            opacity={0.3}
          />
          <rect x="57" y="40" width="6" height="35" fill="#1a1a1a" opacity={0.5} />
        </g>
      </svg>
    ),
    'اسنایپر': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <circle cx="60" cy="60" r="35" stroke={color} strokeWidth="3" fill="none" opacity={0.9} />
          <circle cx="60" cy="60" r="25" stroke={color} strokeWidth="2" fill="none" opacity={0.6} />
          <path d="M60 25 L60 40" stroke={color} strokeWidth="3" strokeLinecap="round" />
          <path d="M60 80 L60 95" stroke={color} strokeWidth="3" strokeLinecap="round" />
          <path d="M25 60 L40 60" stroke={color} strokeWidth="3" strokeLinecap="round" />
          <path d="M80 60 L95 60" stroke={color} strokeWidth="3" strokeLinecap="round" />
          <circle cx="60" cy="60" r="3" fill={color} />
        </g>
      </svg>
    ),
    'مین‌گذار': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <circle cx="60" cy="70" r="28" fill={color} opacity={0.9} />
          <path
            d="M65 42 Q70 35 75 40 Q70 45 65 42"
            fill={color}
            opacity={0.9}
          />
          <path d="M65 42 L65 50" stroke={color} strokeWidth="3" />
          <path
            d="M75 35 L80 25 L78 35 L88 30 L78 38 L85 45 L75 40"
            fill="#ff4444"
            opacity={0.8}
          />
        </g>
      </svg>
    ),
    'محافظ': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <path
            d="M60 20 L80 28 L80 60 Q80 78 60 100 Q40 78 40 60 L40 28 Z"
            fill={color}
            opacity={0.9}
          />
          <path
            d="M60 35 L65 55 L70 55 L60 90 L60 55 L55 45 Z"
            fill="#1a1a1a"
            opacity={0.6}
          />
        </g>
      </svg>
    ),
    'وکیل': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <path d="M60 30 L60 85" stroke={color} strokeWidth="4" strokeLinecap="round" />
          <path d="M40 85 L80 85" stroke={color} strokeWidth="4" strokeLinecap="round" />
          <path d="M35 45 L55 45 L50 60 L40 60 Z" fill={color} opacity={0.9} />
          <path d="M45 45 L45 40 L60 35" stroke={color} strokeWidth="2" />
          <path d="M65 45 L85 45 L80 60 L70 60 Z" fill={color} opacity={0.9} />
          <path d="M75 45 L75 40 L60 35" stroke={color} strokeWidth="2" />
        </g>
      </svg>
    ),
    'راهنما': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <circle cx="60" cy="60" r="35" stroke={color} strokeWidth="3" fill="none" opacity={0.9} />
          <circle cx="60" cy="60" r="5" fill={color} />
          <path
            d="M60 60 L55 30 L60 35 L65 30 Z"
            fill={color}
            opacity={0.9}
          />
          <path
            d="M60 60 L65 90 L60 85 L55 90 Z"
            fill={color}
            opacity={0.5}
          />
        </g>
      </svg>
    ),
    'سرباز': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <path
            d="M40 55 Q40 30 60 25 Q80 30 80 55 L75 60 L45 60 Z"
            fill={color}
            opacity={0.9}
          />
          <path
            d="M60 80 L63 89 L72 89 L65 94 L68 103 L60 97 L52 103 L55 94 L48 89 L57 89 Z"
            fill={color}
            opacity={0.9}
          />
        </g>
      </svg>
    ),
    'عطار': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <path
            d="M50 35 L50 30 L70 30 L70 35 Q75 40 75 60 Q75 85 60 90 Q45 85 45 60 Q45 40 50 35"
            fill={color}
            opacity={0.9}
          />
          <circle cx="55" cy="55" r="4" fill="#1a1a1a" opacity={0.3} />
          <circle cx="65" cy="65" r="5" fill="#1a1a1a" opacity={0.3} />
          <circle cx="58" cy="72" r="3" fill="#1a1a1a" opacity={0.3} />
        </g>
      </svg>
    ),
    'مظنون': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <circle cx="60" cy="60" r="38" fill={color} opacity={0.2} />
          <path
            d="M52 40 Q52 30 60 30 Q68 30 68 38 Q68 45 60 48 L60 58"
            stroke={color}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            opacity={0.9}
          />
          <circle cx="60" cy="70" r="4" fill={color} opacity={0.9} />
        </g>
      </svg>
    ),
    'زره‌ساز': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <path
            d="M40 35 L50 30 L60 28 L70 30 L80 35 L80 75 Q80 85 60 95 Q40 85 40 75 Z"
            fill={color}
            opacity={0.9}
          />
          <path
            d="M50 40 L60 38 L70 40 L70 70 Q70 78 60 85 Q50 78 50 70 Z"
            fill="#1a1a1a"
            opacity={0.3}
          />
          <rect x="57" y="45" width="6" height="30" fill="#1a1a1a" opacity={0.4} />
        </g>
      </svg>
    ),
    'وارث': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <path
            d="M35 70 L40 45 L50 55 L60 40 L70 55 L80 45 L85 70 Z"
            fill={color}
            opacity={0.9}
          />
          <circle cx="40" cy="45" r="5" fill={color} />
          <circle cx="60" cy="40" r="5" fill={color} />
          <circle cx="80" cy="45" r="5" fill={color} />
          <rect x="35" y="70" width="50" height="8" rx="2" fill={color} opacity={0.9} />
        </g>
      </svg>
    ),
    'کدخدا': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <path d="M45 25 L45 95" stroke={color} strokeWidth="5" strokeLinecap="round" opacity={0.9} />
          <circle cx="45" cy="25" r="10" fill={color} opacity={0.9} />
          <path
            d="M40 25 Q35 20 35 30 Q35 35 40 35"
            stroke="#1a1a1a"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M65 55 Q65 45 75 45 Q85 45 85 55 Q85 70 75 75 Q65 70 65 55"
            fill={color}
            opacity={0.7}
          />
        </g>
      </svg>
    ),
    'دن مافیا': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <rect x="35" y="45" width="50" height="6" rx="3" fill={color} opacity={0.9} />
          <path
            d="M42 45 L42 30 Q42 25 60 25 Q78 25 78 30 L78 45"
            fill={color}
            opacity={0.9}
          />
          <rect x="48" y="32" width="24" height="3" fill="#1a1a1a" opacity={0.5} />
          <path
            d="M50 55 L50 90 L70 90 L70 55"
            fill={color}
            opacity={0.8}
          />
          <path
            d="M60 55 L57 65 L60 75 L63 65 Z"
            fill="#1a1a1a"
            opacity={0.6}
          />
        </g>
      </svg>
    ),
    'شیاد': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <path
            d="M35 45 Q35 30 50 30 Q55 30 55 45 Q55 60 50 65 Q35 60 35 45"
            fill={color}
            opacity={0.9}
          />
          <circle cx="45" cy="42" r="3" fill="#1a1a1a" />
          <path d="M40 52 Q45 55 50 52" stroke="#1a1a1a" strokeWidth="2" fill="none" />
          <path
            d="M65 45 Q65 30 80 30 Q85 30 85 45 Q85 60 80 65 Q65 60 65 45"
            fill={color}
            opacity={0.9}
          />
          <circle cx="75" cy="42" r="3" fill="#1a1a1a" />
          <path d="M70 52 Q75 48 80 52" stroke="#1a1a1a" strokeWidth="2" fill="none" />
        </g>
      </svg>
    ),
    'ناتو': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <rect x="30" y="55" width="60" height="12" rx="2" fill={color} opacity={0.9} />
          <rect x="20" y="58" width="15" height="6" rx="1" fill={color} opacity={0.7} />
          <path
            d="M50 55 L50 50 L55 50 L55 55"
            fill={color}
            opacity={0.9}
          />
          <path d="M25 58 L25 64" stroke="#1a1a1a" strokeWidth="1" />
          <path d="M28 58 L28 64" stroke="#1a1a1a" strokeWidth="1" />
          <path d="M31 58 L31 64" stroke="#1a1a1a" strokeWidth="1" />
        </g>
      </svg>
    ),
    'مافیا ساده': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <rect x="45" y="40" width="30" height="5" rx="2" fill={color} opacity={0.9} />
          <path
            d="M50 40 L50 30 L70 30 L70 40"
            fill={color}
            opacity={0.9}
          />
          <circle cx="60" cy="60" r="15" fill={color} opacity={0.9} />
          <path
            d="M40 95 Q40 75 60 75 Q80 75 80 95"
            fill={color}
            opacity={0.9}
          />
        </g>
      </svg>
    ),
    'یاغی': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <path
            d="M35 50 Q35 40 45 40 L75 40 Q85 40 85 50 L85 60 Q85 65 80 65 L40 65 Q35 65 35 60 Z"
            fill={color}
            opacity={0.9}
          />
          <circle cx="50" cy="52" r="6" fill="#1a1a1a" />
          <circle cx="70" cy="52" r="6" fill="#1a1a1a" />
          <path
            d="M55 75 L60 95 L65 75"
            stroke={color}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="57" y="72" width="6" height="8" fill={color} />
        </g>
      </svg>
    ),
    'هکر': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <rect x="30" y="35" width="60" height="45" rx="3" fill={color} opacity={0.9} />
          <rect x="35" y="40" width="50" height="35" fill="#1a1a1a" opacity={0.8} />
          <path d="M45 50 L42 57 L45 64" stroke={color} strokeWidth="2" fill="none" />
          <path d="M75 50 L78 57 L75 64" stroke={color} strokeWidth="2" fill="none" />
          <rect x="50" y="55" width="20" height="2" fill={color} />
          <rect x="55" y="60" width="10" height="2" fill={color} />
          <rect x="35" y="85" width="50" height="8" rx="2" fill={color} opacity={0.7} />
        </g>
      </svg>
    ),
    'جلاد': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <path
            d="M35 30 L50 30 L50 35 Q55 35 55 45 L55 95"
            stroke={color}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M30 25 L55 25 L60 35 L55 45 L30 45 L35 35 Z"
            fill={color}
            opacity={0.9}
          />
          <path
            d="M40 30 L50 40"
            stroke="#1a1a1a"
            strokeWidth="1"
            opacity={0.5}
          />
        </g>
      </svg>
    ),
    'جادوگر': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <path
            d="M60 20 L75 65 L45 65 Z"
            fill={color}
            opacity={0.9}
          />
          <rect x="40" y="65" width="40" height="8" rx="2" fill={color} opacity={0.9} />
          <path
            d="M60 40 L61 43 L64 43 L62 45 L63 48 L60 46 L57 48 L58 45 L56 43 L59 43 Z"
            fill="#1a1a1a"
            opacity={0.6}
          />
          <path d="M70 75 L85 90" stroke={color} strokeWidth="3" strokeLinecap="round" />
          <path
            d="M84 88 L88 84 L86 88 L90 90 L86 92 L88 96 L84 94"
            fill={color}
          />
        </g>
      </svg>
    ),
    'خبرچین': (
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g>
          <path
            d="M55 45 Q45 45 40 55 Q35 65 40 75 Q45 80 55 80"
            stroke={color}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            opacity={0.9}
          />
          <path
            d="M55 52 Q50 52 48 58 Q46 64 48 70 Q50 73 55 73"
            stroke={color}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            opacity={0.7}
          />
          <path d="M70 50 Q75 55 75 62 Q75 69 70 74" stroke={color} strokeWidth="2" fill="none" opacity={0.6} />
          <path d="M78 45 Q85 55 85 62 Q85 69 78 79" stroke={color} strokeWidth="2" fill="none" opacity={0.4} />
        </g>
      </svg>
    ),
  };

  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      {iconMap[roleName] || iconMap['شهروند ساده']}
    </div>
  );
};



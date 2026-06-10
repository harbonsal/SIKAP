export default function MosqueDome() {
    return (
        <div className="relative w-full h-48 overflow-hidden">
            {/* Glow effect container */}
            <div className="absolute inset-0 bg-gradient-to-b from-teal-400/20 to-transparent blur-xl"></div>
            
            {/* Main Dome SVG */}
            <svg
                viewBox="0 0 400 192"
                className="w-full h-full relative z-10"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    {/* Gradient for dome */}
                    <linearGradient id="domeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#14b8a6', stopOpacity: 1 }} />
                        <stop offset="30%" style={{ stopColor: '#0d9488', stopOpacity: 1 }} />
                        <stop offset="70%" style={{ stopColor: '#0f766e', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#115e59', stopOpacity: 1 }} />
                    </linearGradient>
                    
                    {/* Glow filter */}
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    
                    {/* Gold gradient for ornaments */}
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
                    </linearGradient>

                    {/* Enriched batik pattern 1 - main geometric */}
                    <pattern id="batikPattern1" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                        <rect width="50" height="50" fill="none"/>
                        {/* Outer diamond */}
                        <polygon points="25,5 45,25 25,45 5,25" fill="none" stroke="rgba(251, 191, 36, 0.15)" strokeWidth="1"/>
                        {/* Inner diamond */}
                        <polygon points="25,12 38,25 25,38 12,25" fill="rgba(251, 191, 36, 0.1)" stroke="rgba(251, 191, 36, 0.2)" strokeWidth="0.5"/>
                        {/* Center circle */}
                        <circle cx="25" cy="25" r="6" fill="rgba(251, 191, 36, 0.2)"/>
                        {/* Corner ornaments */}
                        <circle cx="25" cy="5" r="2" fill="rgba(251, 191, 36, 0.3)"/>
                        <circle cx="25" cy="45" r="2" fill="rgba(251, 191, 36, 0.3)"/>
                        <circle cx="5" cy="25" r="2" fill="rgba(251, 191, 36, 0.3)"/>
                        <circle cx="45" cy="25" r="2" fill="rgba(251, 191, 36, 0.3)"/>
                        {/* Small dots */}
                        <circle cx="15" cy="15" r="1" fill="rgba(251, 191, 36, 0.2)"/>
                        <circle cx="35" cy="15" r="1" fill="rgba(251, 191, 36, 0.2)"/>
                        <circle cx="15" cy="35" r="1" fill="rgba(251, 191, 36, 0.2)"/>
                        <circle cx="35" cy="35" r="1" fill="rgba(251, 191, 36, 0.2)"/>
                    </pattern>

                    {/* Enriched batik pattern 2 - floral/curved */}
                    <pattern id="batikPattern2" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                        <rect width="60" height="60" fill="none"/>
                        {/* Floral curves */}
                        <path d="M30,5 Q45,15 30,30 Q15,15 30,5" fill="none" stroke="rgba(251, 191, 36, 0.15)" strokeWidth="1"/>
                        <path d="M30,55 Q45,45 30,30 Q15,45 30,55" fill="none" stroke="rgba(251, 191, 36, 0.15)" strokeWidth="1"/>
                        <path d="M5,30 Q15,45 30,30 Q15,15 5,30" fill="none" stroke="rgba(251, 191, 36, 0.15)" strokeWidth="1"/>
                        <path d="M55,30 Q45,45 30,30 Q45,15 55,30" fill="none" stroke="rgba(251, 191, 36, 0.15)" strokeWidth="1"/>
                        {/* Center motif */}
                        <circle cx="30" cy="30" r="8" fill="rgba(251, 191, 36, 0.15)"/>
                        <circle cx="30" cy="30" r="4" fill="rgba(251, 191, 36, 0.25)"/>
                    </pattern>

                    {/* Decorative vine pattern */}
                    <pattern id="vinePattern" x="0" y="0" width="80" height="30" patternUnits="userSpaceOnUse">
                        <rect width="80" height="30" fill="none"/>
                        <path d="M0,15 Q20,5 40,15 Q60,25 80,15" fill="none" stroke="rgba(251, 191, 36, 0.1)" strokeWidth="1"/>
                        <path d="M0,15 Q20,25 40,15 Q60,5 80,15" fill="none" stroke="rgba(251, 191, 36, 0.1)" strokeWidth="1"/>
                        <circle cx="20" cy="10" r="1.5" fill="rgba(251, 191, 36, 0.2)"/>
                        <circle cx="40" cy="15" r="1.5" fill="rgba(251, 191, 36, 0.2)"/>
                        <circle cx="60" cy="20" r="1.5" fill="rgba(251, 191, 36, 0.2)"/>
                    </pattern>
                </defs>

                {/* Main dome shape - more tapered/pointed */}
                <path
                    d="M0,192 L0,100 Q80,90 140,50 Q180,15 200,0 Q220,15 260,50 Q320,90 400,100 L400,192 Z"
                    fill="url(#domeGradient)"
                    filter="url(#glow)"
                />

                {/* Batik pattern 1 overlay */}
                <path
                    d="M0,192 L0,100 Q80,90 140,50 Q180,15 200,0 Q220,15 260,50 Q320,90 400,100 L400,192 Z"
                    fill="url(#batikPattern1)"
                    opacity="0.3"
                />

                {/* Batik pattern 2 overlay */}
                <path
                    d="M0,192 L0,100 Q80,90 140,50 Q180,15 200,0 Q220,15 260,50 Q320,90 400,100 L400,192 Z"
                    fill="url(#batikPattern2)"
                    opacity="0.2"
                />

                {/* Vine pattern overlay */}
                <path
                    d="M0,192 L0,100 Q80,90 140,50 Q180,15 200,0 Q220,15 260,50 Q320,90 400,100 L400,192 Z"
                    fill="url(#vinePattern)"
                    opacity="0.15"
                />

                {/* Central ornament - Islamic star (smaller, higher up) */}
                <g transform="translate(200, 35)">
                    {/* 8-pointed star */}
                    <polygon
                        points="0,-25 6,-6 25,0 6,6 0,25 -6,6 -25,0 -6,-6"
                        fill="url(#goldGradient)"
                        stroke="#d97706"
                        strokeWidth="1.5"
                        filter="url(#glow)"
                    />
                    {/* Inner circle */}
                    <circle cx="0" cy="0" r="10" fill="#0d9488" stroke="url(#goldGradient)" strokeWidth="2"/>
                    {/* Crescent moon */}
                    <path
                        d="M0,-6 Q5,-3 5,3 Q0,6 -5,3 Q-5,-3 0,-6"
                        fill="url(#goldGradient)"
                    />
                    {/* Star in crescent */}
                    <polygon
                        points="0,-2.5 0.8,-0.8 2.5,0 0.8,0.8 0,2.5 -0.8,0.8 -2.5,0 -0.8,-0.8"
                        fill="#0d9488"
                    />
                </g>

                {/* Additional side ornaments - left upper */}
                <g transform="translate(70, 70)">
                    <circle cx="0" cy="0" r="12" fill="none" stroke="url(#goldGradient)" strokeWidth="1.5"/>
                    <circle cx="0" cy="0" r="6" fill="rgba(251, 191, 36, 0.25)"/>
                    <polygon
                        points="0,-8 2,-2 8,0 2,2 0,8 -2,2 -8,0 -2,-2"
                        fill="url(#goldGradient)"
                    />
                </g>

                {/* Additional side ornaments - right upper */}
                <g transform="translate(330, 70)">
                    <circle cx="0" cy="0" r="12" fill="none" stroke="url(#goldGradient)" strokeWidth="1.5"/>
                    <circle cx="0" cy="0" r="6" fill="rgba(251, 191, 36, 0.25)"/>
                    <polygon
                        points="0,-8 2,-2 8,0 2,2 0,8 -2,2 -8,0 -2,-2"
                        fill="url(#goldGradient)"
                    />
                </g>

                {/* Side ornaments - left lower */}
                <g transform="translate(50, 110)">
                    <circle cx="0" cy="0" r="10" fill="none" stroke="rgba(251, 191, 36, 0.4)" strokeWidth="1"/>
                    <circle cx="0" cy="0" r="5" fill="rgba(251, 191, 36, 0.2)"/>
                    <polygon
                        points="0,-7 2,-2 7,0 2,2 0,7 -2,2 -7,0 -2,-2"
                        fill="rgba(251, 191, 36, 0.5)"
                    />
                </g>

                {/* Side ornaments - right lower */}
                <g transform="translate(350, 110)">
                    <circle cx="0" cy="0" r="10" fill="none" stroke="rgba(251, 191, 36, 0.4)" strokeWidth="1"/>
                    <circle cx="0" cy="0" r="5" fill="rgba(251, 191, 36, 0.2)"/>
                    <polygon
                        points="0,-7 2,-2 7,0 2,2 0,7 -2,2 -7,0 -2,-2"
                        fill="rgba(251, 191, 36, 0.5)"
                    />
                </g>

                {/* Decorative arches - left */}
                <g transform="translate(30, 140)">
                    <path
                        d="M0,52 Q13,0 26,52"
                        fill="none"
                        stroke="rgba(251, 191, 36, 0.4)"
                        strokeWidth="2"
                    />
                    <path
                        d="M4,52 Q13,12 22,52"
                        fill="none"
                        stroke="rgba(251, 191, 36, 0.25)"
                        strokeWidth="1"
                    />
                    <path
                        d="M8,52 Q13,24 18,52"
                        fill="none"
                        stroke="rgba(251, 191, 36, 0.15)"
                        strokeWidth="0.5"
                    />
                </g>

                {/* Decorative arches - right */}
                <g transform="translate(344, 140)">
                    <path
                        d="M0,52 Q13,0 26,52"
                        fill="none"
                        stroke="rgba(251, 191, 36, 0.4)"
                        strokeWidth="2"
                    />
                    <path
                        d="M4,52 Q13,12 22,52"
                        fill="none"
                        stroke="rgba(251, 191, 36, 0.25)"
                        strokeWidth="1"
                    />
                    <path
                        d="M8,52 Q13,24 18,52"
                        fill="none"
                        stroke="rgba(251, 191, 36, 0.15)"
                        strokeWidth="0.5"
                    />
                </g>

                {/* Geometric border at bottom */}
                <rect x="0" y="182" width="400" height="10" fill="url(#goldGradient)" filter="url(#glow)"/>
                <g transform="translate(0, 182)">
                    {/* Repeating pattern along border */}
                    {[...Array(20)].map((_, i) => (
                        <polygon
                            key={i}
                            points={`${i * 20 + 10},0 ${i * 20 + 15},10 ${i * 20 + 5},10`}
                            fill="#0d9488"
                        />
                    ))}
                </g>

                {/* Arabic-style calligraphy placeholder */}
                <text
                    x="200"
                    y="172"
                    textAnchor="middle"
                    fill="url(#goldGradient)"
                    fontSize="13"
                    fontFamily="serif"
                    fontWeight="bold"
                    filter="url(#glow)"
                >
                    بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                </text>
            </svg>
        </div>
    );
}

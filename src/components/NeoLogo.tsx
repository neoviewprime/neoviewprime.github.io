
// src/components/NeoLogo.tsx
import React from 'react';
import logoUrl from '/src/components/images/IB-Symbol positive colour_white background.png';

interface NeoLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const NeoLogo: React.FC<NeoLogoProps> = ({ size = 'md', showText = true }) => {
  const dimensions = {
    sm: { icon: 35, text: 'text-lg' },
    md: { icon: 35, text: 'text-xl' },
    lg: { icon: 40, text: 'text-3xl' },
  };
  const { icon, text } = dimensions[size];

  return (
    <div className="flex items-center gap-2">
      <img
        src={logoUrl}
        style={{ width: icon , height: 'auto' }}  // evita distorção do PNG
        alt={showText ? '' : 'Logo NeoView'}
        aria-hidden={showText}
        className="block"
        loading="eager"
      />
      {showText && (
        <span className={`font-bold ${text} tracking-tight`}>
          <span className="text-primary">NEO</span>
          <span className="text-secondary">VIEW</span>
        </span>
      )}
    </div>
  );
};

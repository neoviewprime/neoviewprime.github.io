import React from 'react';
import companyLogo from './images/IB-Symbol positive colour_white background.png';

interface CompanyCardProps {
  name: string;
  fullName: string;
  onClick: () => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ name, fullName, onClick }) => {
  return (
    <button onClick={onClick} className="company-card group w-full text-left">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex-shrink-0">
          <img
            src={companyLogo}
            alt={`${name} logo`}
            className="h-auto w-10 transition-transform duration-300 group-hover:scale-110 sm:w-12"
            loading="eager"
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-primary transition-colors group-hover:text-primary/80 sm:text-xl">
            {name}
          </h3>
        </div>
      </div>
    </button>
  );
};

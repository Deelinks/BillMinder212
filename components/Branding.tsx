
import React from 'react';

// Use className as the standard prop for custom styling
export const LogoMark: React.FC<{ className?: string; variant?: string }> = ({ className = "w-10 h-10", variant = "default" }) => (
  <div className={`${className} ${variant === 'white' ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'} rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200`}>
    <i className="fa-solid fa-check-double text-lg"></i>
  </div>
);

const Branding: React.FC<{ size?: 'sm' | 'md' | 'lg'; variant?: 'default' | 'white'; showText?: boolean }> = ({ 
  size = 'md', 
  variant = 'default', 
  showText = true 
}) => {
  const sizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' };
  const textColorClass = variant === 'white' ? 'text-white' : 'text-slate-900';

  return (
    <div className="flex items-center gap-3">
      <LogoMark className={size === 'lg' ? 'w-12 h-12' : 'w-9 h-9'} variant={variant} />
      {showText && (
        <span className={`${sizes[size]} font-black ${textColorClass} tracking-tighter`}>
          Bill<span className="text-indigo-600">Minder</span>
        </span>
      )}
    </div>
  );
};

export default Branding;
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ElementType;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  icon: Icon,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold tracking-tight transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden";
  
  const variants = {
    // Primary: Gold Background, White Text (High Contrast)
    primary: "bg-brand-primary text-white shadow-[0_4px_14px_rgba(255,208,0,0.3)] hover:shadow-[0_6px_20px_rgba(255,208,0,0.4)] hover:bg-[#FFE04D] border border-transparent",
    // Secondary: Light Surface
    secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border border-transparent",
    // Outline: Border
    outline: "bg-transparent text-zinc-700 border border-zinc-300 hover:border-black hover:bg-zinc-50 hover:text-black",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100",
    ghost: "bg-transparent text-zinc-500 hover:text-black hover:bg-zinc-100"
  };

  const sizes = {
    sm: "h-9 px-4 text-xs rounded-full",
    md: "h-12 px-6 text-sm rounded-full",
    lg: "h-14 px-8 text-base rounded-full"
  };

  return (
    <button 
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''} 
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon className={`mr-2 ${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} strokeWidth={2.5} />}
      {children}
    </button>
  );
};
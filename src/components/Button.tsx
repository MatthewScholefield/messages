import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'circular';
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = 'default', icon, ...props }) => {
  const baseStyles = `
    bg-gray-200
    text-gray-800
    border-none
    font-inter
    text-base
    hover:bg-gray-300
    focus:bg-gray-300
    focus:outline-none
    focus:ring-2
    focus:ring-gray-400
    focus:ring-opacity-75
    transition-colors
    duration-200
    ease-in-out
    cursor-pointer
  `;

  const variantStyles = {
    default: `
      py-2
      px-4
      rounded-md
    `,
    circular: `
      flex
      items-center
      justify-center
      rounded-full
      w-14
      h-14
      shadow-lg
      hover:shadow-xl
    `
  };

  return (
    <button 
      className={`${baseStyles} ${variantStyles[variant]} ${className || ''}`} 
      {...props}
    >
      {icon && <span className="flex items-center justify-center">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
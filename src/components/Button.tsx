import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
  const baseStyles = `
    bg-gray-200
    text-gray-800
    py-2
    px-4
    rounded-md
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

  return (
    <button className={`${baseStyles} ${className || ''}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
// components/ui/Button.tsx
import React from 'react';
import classNames from 'classnames';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' ;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className, ...props }) => {
  return (
    <button
      {...props}
      className={classNames(
        'px-4 py-2 rounded font-semibold focus:outline-none transition',
        {
          'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
          'bg-gray-300 text-gray-700 hover:bg-gray-400': variant === 'secondary',
          'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
          'bg-lime-600 text-white hover:bg-lime-700': variant === 'success',
          'bg-amber-600 text-white hover:bg-yellow-600': variant === 'warning',
        },
        className
      )}
    >
      {children}
    </button>
  );
};

export { Button };

import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

/**
 * Modern button component with animations and consistent styling
 */
const ModernButton = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon = null,
  iconPosition = 'right',
  disabled = false,
  className = '',
  showArrow = false,
  rounded = 'lg',
  onClick,
  href,
  type = 'button',
  ...props
}) => {
  // Variants
  const variants = {
    primary: `bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 shadow-sm`,
    secondary: `bg-white text-gray-700 border border-gray-300 hover:border-blue-600 hover:text-blue-600 shadow-sm`,
    outline: `bg-transparent text-blue-600 border border-blue-600 hover:bg-blue-50`,
    ghost: `bg-transparent text-blue-600 hover:bg-blue-50 border-none`,
    danger: `bg-red-600 text-white hover:bg-red-700 shadow-sm`,
    success: `bg-green-600 text-white hover:bg-green-700 shadow-sm`,
    white: `bg-white text-blue-600 hover:bg-gray-50 shadow-sm`,
  };

  // Sizes
  const sizes = {
    sm: 'text-sm py-1 px-3',
    md: 'text-base py-2 px-4',
    lg: 'text-lg py-3 px-6',
    xl: 'text-xl py-4 px-8',
  };
  
  // Rounded options
  const roundedOptions = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  const buttonClasses = `
    ${variants[variant]}
    ${sizes[size]}
    ${roundedOptions[rounded]}
    ${fullWidth ? 'w-full' : ''}
    font-medium transition-all duration-200
    flex items-center justify-center gap-2
    ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `;

  const content = (
    <>
      {icon && iconPosition === 'left' && <span>{icon}</span>}
      {children}
      {showArrow && <ArrowRight className={`h-4 w-4 ${size === 'lg' || size === 'xl' ? 'h-5 w-5' : ''} transition-transform group-hover:translate-x-0.5`} />}
      {icon && iconPosition === 'right' && <span>{icon}</span>}
    </>
  );

  const motionProps = {
    whileHover: disabled ? {} : { scale: 1.02 },
    whileTap: disabled ? {} : { scale: 0.98 },
    transition: { duration: 0.2 },
  };

  if (href && !disabled) {
    return (
      <motion.a
        href={href}
        className={`${buttonClasses} group`}
        {...motionProps}
        {...props}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={disabled ? undefined : onClick}
      className={`${buttonClasses} group`}
      disabled={disabled}
      {...motionProps}
      {...props}
    >
      {content}
    </motion.button>
  );
};

ModernButton.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost', 'danger', 'success', 'white']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  fullWidth: PropTypes.bool,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  disabled: PropTypes.bool,
  className: PropTypes.string,
  showArrow: PropTypes.bool,
  rounded: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl', 'full']),
  onClick: PropTypes.func,
  href: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export default ModernButton;

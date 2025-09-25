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
  // Variants - Using only the variant class names from CSS
  const variants = {
    primary: `variant-primary`,
    secondary: `variant-secondary`,
    outline: `variant-outline`,
    ghost: `variant-ghost`,
    danger: `variant-danger`,
    success: `variant-success`,
    white: `variant-white`,
  };

  // Sizes - Using CSS classes instead of Tailwind
  const sizes = {
    sm: 'size-sm',
    md: 'size-md',
    lg: 'size-lg',
    xl: 'size-xl',
  };
  
  // We won't use these rounded options directly
  // as the .modern-button class already has border-radius defined
  const roundedOptions = {
    none: '',
    sm: '',
    md: '',
    lg: '',
    xl: '',
    full: '',
  };

  const buttonClasses = `
    modern-button
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? 'disabled' : ''}
    ${className}
  `.trim();

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

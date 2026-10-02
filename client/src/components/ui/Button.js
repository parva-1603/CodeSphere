import React, { forwardRef } from 'react';
import clsx from 'clsx';
import './Button.css';

const Button = forwardRef(({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'default', 
  loading = false, 
  iconOnly = false,
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      className={clsx(
        'ui-btn',
        `ui-btn-${variant}`,
        `ui-btn-${size}`,
        iconOnly && 'ui-btn-icon-only',
        loading && 'ui-btn-loading',
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="ui-btn-spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="32" strokeDashoffset="32" strokeLinecap="round" />
        </svg>
      )}
      <span className={clsx('ui-btn-content', loading && 'ui-btn-content-hidden')}>
        {children}
      </span>
    </button>
  );
});

Button.displayName = 'Button';
export default Button;

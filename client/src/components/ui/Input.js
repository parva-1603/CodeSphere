import React, { forwardRef } from 'react';
import clsx from 'clsx';
import './Input.css';

const Input = forwardRef(({ className, icon: Icon, error, ...props }, ref) => {
  return (
    <div className={clsx('ui-input-wrapper', className)}>
      {Icon && (
        <div className="ui-input-icon">
          <Icon size={14} />
        </div>
      )}
      <input
        ref={ref}
        className={clsx('ui-input', Icon && 'ui-input-with-icon', error && 'ui-input-error')}
        {...props}
      />
    </div>
  );
});

Input.displayName = 'Input';
export default Input;

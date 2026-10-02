import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import clsx from 'clsx';
import './Dropdown.css';

export const Dropdown = DropdownMenu.Root;
export const DropdownTrigger = DropdownMenu.Trigger;

export const DropdownContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DropdownMenu.Portal>
    <DropdownMenu.Content
      ref={ref}
      className={clsx('ui-dropdown-content', className)}
      sideOffset={4}
      {...props}
    >
      {children}
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
));
DropdownContent.displayName = 'DropdownContent';

export const DropdownItem = React.forwardRef(({ className, danger, ...props }, ref) => (
  <DropdownMenu.Item
    ref={ref}
    className={clsx('ui-dropdown-item', danger && 'ui-dropdown-item-danger', className)}
    {...props}
  />
));
DropdownItem.displayName = 'DropdownItem';

export const DropdownSeparator = () => <DropdownMenu.Separator className="ui-dropdown-separator" />;

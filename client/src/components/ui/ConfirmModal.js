import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from './Dialog';
import Button from './Button';

export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  description = "This action cannot be undone.", 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  isDanger = false 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onClose(false)}>
            {cancelText}
          </Button>
          <Button 
            variant="primary" 
            style={isDanger ? { backgroundColor: 'var(--danger)', color: '#fff' } : {}}
            onClick={() => {
              onConfirm();
              onClose(false);
            }}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

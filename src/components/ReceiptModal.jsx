import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ReceiptModal({ open, onOpenChange, url }) {
  if (!url) return null;
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
        </DialogHeader>
        {isImage ? (
          <img src={url} alt="Receipt" className="w-full rounded-lg" />
        ) : (
          <iframe src={url} title="Receipt" className="w-full h-[70vh] rounded-lg border-0" />
        )}
      </DialogContent>
    </Dialog>
  );
}

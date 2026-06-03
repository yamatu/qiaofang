'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function isProtectedImageTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return !!target.closest('img, [data-protected-image="true"]');
}

function selectionContainsImage() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  for (let i = 0; i < selection.rangeCount; i += 1) {
    const fragment = selection.getRangeAt(i).cloneContents();
    if (fragment.querySelector?.('img')) return true;
  }

  return false;
}

function markImagesAsProtected() {
  document.querySelectorAll<HTMLImageElement>('img').forEach((image) => {
    image.draggable = false;
    image.setAttribute('data-protected-image', 'true');
  });
}

export default function ImageProtection() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/admin')) {
      document.documentElement.classList.remove('image-protection-enabled');
      return;
    }

    document.documentElement.classList.add('image-protection-enabled');

    markImagesAsProtected();

    const observer = new MutationObserver(markImagesAsProtected);
    observer.observe(document.body, { childList: true, subtree: true });

    const blockImageAction = (event: Event) => {
      if (isProtectedImageTarget(event.target)) {
        event.preventDefault();
      }
    };

    const blockImageCopy = (event: ClipboardEvent) => {
      if (isProtectedImageTarget(event.target) || selectionContainsImage()) {
        event.preventDefault();
      }
    };

    document.addEventListener('contextmenu', blockImageAction, true);
    document.addEventListener('dragstart', blockImageAction, true);
    document.addEventListener('copy', blockImageCopy, true);

    return () => {
      document.documentElement.classList.remove('image-protection-enabled');
      observer.disconnect();
      document.removeEventListener('contextmenu', blockImageAction, true);
      document.removeEventListener('dragstart', blockImageAction, true);
      document.removeEventListener('copy', blockImageCopy, true);
    };
  }, [pathname]);

  return null;
}

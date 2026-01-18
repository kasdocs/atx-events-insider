'use client';

import { useState } from 'react';

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      const absolute =
        typeof window !== 'undefined' && url.startsWith('/') ? `${window.location.origin}${url}` : url;

      await navigator.clipboard.writeText(absolute);

      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error('CopyLinkButton error:', err);
      // Fallback
      try {
        const absolute =
          typeof window !== 'undefined' && url.startsWith('/') ? `${window.location.origin}${url}` : url;
        window.prompt('Copy this link:', absolute);
      } catch {}
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className="flex-1 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold"
    >
      {copied ? '✅ Copied' : '📱 Copy Link'}
    </button>
  );
}

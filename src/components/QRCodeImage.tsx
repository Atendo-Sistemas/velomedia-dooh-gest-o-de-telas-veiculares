import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeImageProps {
  value: string;
  alt: string;
  size: number;
  className?: string;
}

export const QRCodeImage: React.FC<QRCodeImageProps> = ({ value, alt, size, className }) => {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    if (!value) {
      setDataUrl('');
      return;
    }

    let isCurrent = true;
    QRCode.toDataURL(value, { width: size * 2, margin: 1, errorCorrectionLevel: 'M' })
      .then(result => {
        if (isCurrent) setDataUrl(result);
      })
      .catch(() => {
        if (isCurrent) setDataUrl('');
      });
    return () => { isCurrent = false; };
  }, [value, size]);

  if (!dataUrl) {
    return <div className={`flex items-center justify-center text-center text-xs text-slate-500 ${className || ''}`} role="status">Gerando QR Code…</div>;
  }

  return <img src={dataUrl} alt={alt} width={size} height={size} className={className} />;
};

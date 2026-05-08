'use client';

import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

type Props = {
  value?: string;
  size?: number;
  logoSrc?: string;
  logoSize?: number;
  bgColor?: string;
  fgColor?: string;
  level?: 'L' | 'M' | 'Q' | 'H';
  filename?: string;
  showDownload?: boolean;
  className?: string;
};

export function QRCodeWithLogo({
  value = 'https://braziliancorepilates.com',
  size = 200,
  logoSrc = '/logo/brazilian-core-pilates-logo.png',
  logoSize,
  bgColor = '#ffffff',
  fgColor = '#000000',
  level = 'H',
  filename = 'qrcode-braziliancorepilates',
  showDownload = true,
  className,
}: Props) {
  const computedLogoSize = logoSize ?? Math.round(size * 0.38);
  const containerRef = useRef<HTMLDivElement>(null);

  const [logoDims, setLogoDims] = useState<{ w: number; h: number }>({
    w: computedLogoSize,
    h: computedLogoSize,
  });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (ratio >= 1) {
        // wider than tall
        setLogoDims({ w: computedLogoSize, h: Math.round(computedLogoSize / ratio) });
      } else {
        // taller than wide
        setLogoDims({ w: Math.round(computedLogoSize * ratio), h: computedLogoSize });
      }
    };
    img.src = logoSrc;
  }, [logoSrc, computedLogoSize]);

  function handleDownload() {
    const svg = containerRef.current?.querySelector('svg');
    if (!svg) return;

    const scale = 3;
    const canvasSize = size * scale;

    // Fetch logo as data URL so canvas doesn't get tainted
    fetch(logoSrc)
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          }),
      )
      .then((logoDataUrl) => {
        const canvas = document.createElement('canvas');
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw QR without the embedded logo element
        const svgClone = svg.cloneNode(true) as SVGElement;
        svgClone.querySelectorAll('image').forEach((el) => el.remove());
        const svgData = new XMLSerializer().serializeToString(svgClone);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        const qrImg = new Image();
        qrImg.onload = () => {
          ctx.drawImage(qrImg, 0, 0, canvasSize, canvasSize);
          URL.revokeObjectURL(svgUrl);

          // Draw logo centered on top
          const logoImg = new Image();
          logoImg.onload = () => {
            const lw = logoDims.w * scale;
            const lh = logoDims.h * scale;
            const lx = (canvasSize - lw) / 2;
            const ly = (canvasSize - lh) / 2;

            const pad = 4 * scale;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(lx - pad, ly - pad, lw + pad * 2, lh + pad * 2);
            ctx.drawImage(logoImg, lx, ly, lw, lh);

            const pngUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = pngUrl;
            link.download = `${filename}.png`;
            link.click();
          };
          logoImg.src = logoDataUrl;
        };
        qrImg.src = svgUrl;
      });
  }

  return (
    <div className={className} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div ref={containerRef} style={{ lineHeight: 0 }}>
        <QRCodeSVG
          value={value}
          size={size}
          bgColor={bgColor}
          fgColor={fgColor}
          level={level}
          imageSettings={{
            src: logoSrc,
            x: undefined,
            y: undefined,
            height: logoDims.h,
            width: logoDims.w,
            excavate: true,
          }}
        />
      </div>

      {showDownload && (
        <button
          type="button"
          onClick={handleDownload}
          style={{
            padding: '6px 16px',
            fontSize: 13,
            borderRadius: 6,
            border: '1px solid #d1d5db',
            background: '#f9fafb',
            cursor: 'pointer',
          }}
        >
          Baixar QR Code (.png)
        </button>
      )}
    </div>
  );
}

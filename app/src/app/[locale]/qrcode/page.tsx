'use client';

import { QRCodeWithLogo } from '@/components/atoms/QRCodeWithLogo';

export default function QRCodePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white p-8">
      <h1 className="text-xl font-semibold text-gray-800">QR Code — Brazilian Core Pilates</h1>
      <QRCodeWithLogo size={280} />
      <p className="text-sm text-gray-500">aponta para braziliancorepilates.com</p>
    </div>
  );
}

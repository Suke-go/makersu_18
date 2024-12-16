import React from 'react';
import QRCode from 'qrcode.react';

export default function QrPage() {
  const participantUrl = `${process.env.REACT_APP_FRONTEND_URL}/participant`; // 環境変数を使用
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl mb-4 font-bold text-primary">参加者用QRコード</h1>
      <QRCode value={participantUrl} size={200} />
      <div className="mt-4 text-sm">{participantUrl}</div>
    </div>
  );
}

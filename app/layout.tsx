import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AdPanel – AI Reklam Yönetimi',
  description: 'İşletmeniz için yapay zeka destekli reklam yönetim paneli',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}

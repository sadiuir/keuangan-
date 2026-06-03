import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wealth Manager',
  description: 'Sistem Manajemen Finansial Proaktif Modern dengan ACID Transactions dan Smart Budgeting.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className="antialiased text-slate-100 bg-slate-950">
        {children}
      </body>
    </html>
  );
}

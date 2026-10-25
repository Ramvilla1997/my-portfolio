import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Unbounded } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const display = Unbounded({ subsets: ['latin'], weight: ['500', '700', '800'], variable: '--font-display', display: 'swap' });
const body = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'Ram Villa · Senior Full-Stack Engineer',
  description: 'Ram Villa, Senior Full-Stack Engineer. React, TypeScript and AWS for healthcare and fintech teams.',
};

export const viewport: Viewport = {
  themeColor: '#070912',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}

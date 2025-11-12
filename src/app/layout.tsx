import type { Metadata } from 'next';

import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

const title = 'Bridge Canada | Connecting Continents';
const description =
    'Bridge Canada designs concierge delegations, trade missions, and cultural exchanges that connect international partners with Canadian opportunities.';

export const metadata: Metadata = {
    alternates: { canonical: '/' },
    authors: [{ name: 'Bridge Canada N World' }],
    description,
    icons: { apple: '/icon.png', icon: '/icon.png' },
    keywords: [
        'Bridge Canada',
        'trade missions',
        'concierge delegations',
        'Canada business travel',
        'international relations',
        'Bangladesh delegations',
    ],
    metadataBase: new URL('https://bridgecanada.ca'),
    openGraph: {
        description,
        images: [
            {
                alt: 'Bridge Canada concierge team welcoming international partners',
                height: 630,
                url: '/og-image.jpg',
                width: 1200,
            },
        ],
        locale: 'en_CA',
        siteName: 'Bridge Canada',
        title,
        type: 'website',
        url: 'https://bridgecanada.ca/',
    },
    robots: { follow: true, index: true },
    title: { default: title, template: '%s | Bridge Canada' },
    twitter: { card: 'summary_large_image', description, images: ['/og-image.jpg'], title },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
        </html>
    );
}

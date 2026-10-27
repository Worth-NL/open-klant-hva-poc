import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import TestloginBanner from "@/components/TestloginBanner";
import { MenuIcoon, ZoekIcoon } from "@/components/Icons";
import "./globals.css";
import styles from "./layout.module.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: {
        default: "Mijn Amsterdam",
        template: "%s | Mijn Amsterdam",
    },
    description:
        "Regel uw contactvoorkeuren met de gemeente (prototype met nepgegevens).",
};

function Kruisjes() {
    return (
        <svg
            className={styles.kruisjes}
            viewBox="0 0 10 30"
            aria-hidden="true"
            focusable="false"
        >
            {[5, 15, 25].map((y) => (
                <path
                    key={y}
                    d={`M1 ${y - 4}L9 ${y + 4}M9 ${y - 4}L1 ${y + 4}`}
                    stroke="currentColor"
                    strokeWidth="2.2"
                />
            ))}
        </svg>
    );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html
            lang="nl"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">
                <a className={styles.skiplink} href="#hoofdinhoud">
                    Ga naar de inhoud
                </a>
                <TestloginBanner />
                <header className={styles.header}>
                    <a href="#" className={styles.logo}>
                        <Kruisjes />
                        <span className={styles.logotekst}>
                            Gemeente
                            <br />
                            Amsterdam
                        </span>
                    </a>
                    <span className={styles.sitenaam}>Mijn Amsterdam</span>
                    <nav aria-label="Account en menu" className={styles.nav}>
                        <a href="#">
                            Zoeken <ZoekIcoon />
                        </a>
                        <a href="#">W.Beemsterboer</a>
                        <a href="#">Uitloggen</a>
                        <a href="#">
                            Menu <MenuIcoon />
                        </a>
                    </nav>
                </header>
                <main id="hoofdinhoud" className={styles.main}>
                    {children}
                </main>
            </body>
        </html>
    );
}

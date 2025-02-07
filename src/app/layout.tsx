import "@/styles/globals.css";

import {Jersey_10, Russo_One, Roboto} from 'next/font/google'

import { type Metadata } from "next";

import { TRPCReactProvider } from "@/trpc/react";

const jersey = Jersey_10({ subsets: ['latin'], weight:"400" });
const russo = Russo_One({ subsets: ['latin'], weight:"400" });
const roboto = Roboto({ subsets: ['latin'], weight:"400" });

export const metadata: Metadata = {
  title: "Mio Panel",
  description: "Mio Mideal CMS Config Panel",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${jersey.className} ${russo.className} ${roboto.className}`}>
      <body>
        <TRPCReactProvider>
          {children}
        </TRPCReactProvider>
      </body>
    </html>
  );
}

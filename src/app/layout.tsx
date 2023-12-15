import type { Metadata } from "next";
import { fonts } from "./fonts";
import "./globals.css";
import { description, title } from "./constants";

export const metadata: Metadata = {
  title,
  description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fonts.rubik.variable}>
      <body>
        <main className="flex h-screen flex-col justify-start overflow-clip">
          {children}
        </main>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { fonts } from "./fonts";
import "./globals.css";
import { description, title } from "./constants";
import { Provider } from "./provider";

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
          <Provider>{children}</Provider>
        </main>
      </body>
    </html>
  );
}

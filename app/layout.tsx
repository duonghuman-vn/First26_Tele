import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Linkspace — Personal Link Manager",
  description: "A private library for the links you save from Telegram.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

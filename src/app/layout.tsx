import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BullMandu",
  description: "BullMandu is a NEPSE stock analysis platform with explainable forecasts and watchlists."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

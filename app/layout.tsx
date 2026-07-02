import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "efin CRM — Media & Event Sales",
  description: "CRM สำหรับทีมขาย Media & Event ของ efin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased">{children}</body>
    </html>
  );
}

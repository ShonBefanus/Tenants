import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tenants - Property Management",
  description: "Secure rent property management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

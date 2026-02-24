import "./globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI for Interior Design — Homeplay",
  description: "Course feedback survey",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DarBladi",
    template: "%s | DarBladi",
  },
  description: "Plateforme immobilière intelligente au Maroc",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}

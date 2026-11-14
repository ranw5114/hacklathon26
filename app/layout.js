import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import SyncWatcher from "@/components/SyncWatcher";

// Fredoka for headings and buttons (from the Lovable design), Nunito for body text.
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const nunito = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata = {
  title: "Cluck In",
  description: "A personalized study plan that works backwards from your goal grade.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/* Copies progress to your account (when logged in) */}
        <SyncWatcher />
        {children}
      </body>
    </html>
  );
}

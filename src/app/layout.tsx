import "./globals.css";
import PWARegister from "@/components/PWARegister";

export const metadata = {
  title: "Habits Huntrix",
  description: "Kid-friendly habit tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f9fafb] text-neutral-900">
        <PWARegister />
        <div className="mx-auto max-w-md p-3 pb-20">{children}</div>
        <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t bg-white/90 backdrop-blur">
          <div className="grid grid-cols-3 text-center">
            <a className="p-3 block" href="/">Check-in</a>
            <a className="p-3 block" href="/dashboard">Dashboard</a>
            <a className="p-3 block" href="/settings">Settings</a>
          </div>
        </nav>
      </body>
    </html>
  );
}

import "./globals.css";
import Sidebar from "@/src/components/layout/Sidebar";
import Topbar from "@/src/components/layout/Topbar";
import { ThemeProvider } from "@/src/contexts/ThemeContext";

export const metadata = {
  title: "GeoImpact Air AI",
  description: "Hyperlocal Air Quality Intelligence Platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <div className="air-root">
            <Sidebar />
            <div className="air-content">
              <Topbar aqi={132} stale={false} />
              <main className="air-main">{children}</main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

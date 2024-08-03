import Header from "./header";
import { ReactNode } from "react";

interface SiteLayoutProps {
  children: ReactNode;
  fullHeight?: boolean;
}

export default function SiteLayout({ children, fullHeight = true }: SiteLayoutProps) {
  return (
    <div className={`flex flex-col ${fullHeight ? 'h-screen' : 'min-h-screen'}`}>
      <Header />
      <main className={fullHeight ? "flex-1 overflow-hidden" : "flex-1"}>
        {children}
      </main>
    </div>
  );
}

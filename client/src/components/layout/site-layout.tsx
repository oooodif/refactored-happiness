import Header from "./header";
import { ReactNode } from "react";
import { VisuallyHiddenHeading } from "@/components/seo/visually-hidden-heading";

interface SiteLayoutProps {
  children: ReactNode;
  fullHeight?: boolean;
  seoTitle?: string;
}

export default function SiteLayout({ 
  children, 
  fullHeight = true, 
  seoTitle = "AI LaTeX Generator for Students" 
}: SiteLayoutProps) {
  return (
    <div className={`flex flex-col ${fullHeight ? 'h-screen' : 'min-h-screen'}`}>
      <Header />
      <main className={fullHeight ? "flex-1 overflow-y-auto" : "flex-1"}>
        {/* Visually hidden H1 for SEO purposes */}
        <VisuallyHiddenHeading>{seoTitle}</VisuallyHiddenHeading>
        {children}
      </main>
    </div>
  );
}

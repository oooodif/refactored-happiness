import Header from "./header";
import Footer from "./footer";
import { ReactNode, useEffect } from "react";
import { VisuallyHiddenHeading } from "@/components/seo/visually-hidden-heading";

interface SiteLayoutProps {
  children: ReactNode;
  fullHeight?: boolean;
  seoTitle?: string;
  hideFooter?: boolean;
  enableSmoothScroll?: boolean;
}

export default function SiteLayout({ 
  children, 
  fullHeight = true, 
  seoTitle = "AI LaTeX Generator for Students",
  hideFooter = true,
  enableSmoothScroll = true
}: SiteLayoutProps) {
  // Mark the main container as a scroll container for Locomotive Scroll
  useEffect(() => {
    if (enableSmoothScroll) {
      // Add data-scroll-container attribute for locomotive-scroll
      const mainElement = document.querySelector('main');
      if (mainElement) {
        mainElement.setAttribute('data-scroll-container', '');
      }
      
      // Add additional classes to enable smooth scrolling
      document.documentElement.classList.add('has-scroll-smooth');
    }
    
    return () => {
      if (enableSmoothScroll) {
        document.documentElement.classList.remove('has-scroll-smooth');
      }
    };
  }, [enableSmoothScroll]);
  
  return (
    <div className={`flex flex-col ${fullHeight ? 'h-screen' : 'min-h-screen'}`}>
      <Header />
      <main 
        className={fullHeight ? "flex-1 overflow-y-auto" : "flex-1"} 
        data-scroll-section=""
      >
        {/* Visually hidden H1 for SEO purposes */}
        <VisuallyHiddenHeading>{seoTitle}</VisuallyHiddenHeading>
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}

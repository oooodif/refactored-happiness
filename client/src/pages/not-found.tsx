import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import SiteLayout from "@/components/layout/site-layout";
import { useHttpStatus } from "@/hooks/use-http-status";
import { useEffect } from "react";

export default function NotFound() {
  // Set 404 status code for SEO
  useHttpStatus(404);
  
  // Additional SEO measure - add a title tag with 404
  useEffect(() => {
    document.title = "404 Page Not Found - AI LaTeX Generator";
    
    // Add a meta tag to prevent indexing of 404 pages
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex';
    document.head.appendChild(metaRobots);
    
    return () => {
      // Clean up the meta tag when component unmounts
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta) {
        document.head.removeChild(robotsMeta);
      }
    };
  }, []);

  return (
    <SiteLayout seoTitle="404 Page Not Found - AI LaTeX Generator">
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
            </div>

            <p className="mt-4 text-sm text-gray-600">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}

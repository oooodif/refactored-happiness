import { useEffect } from "react";
import SiteLayout from "@/components/layout/site-layout";

export default function PrivacyPolicy() {
  // Update page title and meta description for SEO
  useEffect(() => {
    document.title = "Privacy Policy - AI LaTeX Generator";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        "Privacy Policy for AI LaTeX Generator. Learn how we collect, use, and protect your personal information.");
    }
  }, []);

  return (
    <SiteLayout seoTitle="Privacy Policy - AI LaTeX Generator">
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-lg mb-6">
            Last updated: May 13, 2025
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>
            Welcome to AI LaTeX Generator ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. 
            This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Data We Collect</h2>
          <p>We may collect, use, store and transfer different kinds of personal data about you, including:</p>
          <ul className="list-disc pl-6 mt-4 mb-6">
            <li><strong>Identity Data</strong> includes email address and username.</li>
            <li><strong>Technical Data</strong> includes internet protocol (IP) address, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform.</li>
            <li><strong>Usage Data</strong> includes information about how you use our website and services.</li>
            <li><strong>LaTeX Generation Data</strong> includes the input content you provide and the LaTeX content generated.</li>
            <li><strong>Subscription Data</strong> includes information about your subscription plan and payment history.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Data</h2>
          <p>We use your data for the following purposes:</p>
          <ul className="list-disc pl-6 mt-4 mb-6">
            <li>To provide and maintain our service</li>
            <li>To notify you about changes to our service</li>
            <li>To allow you to participate in interactive features of our service</li>
            <li>To provide customer support</li>
            <li>To gather analysis or valuable information so that we can improve our service</li>
            <li>To monitor the usage of our service</li>
            <li>To detect, prevent and address technical issues</li>
            <li>To process payments and maintain subscription records</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Retention</h2>
          <p>
            We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, 
            including for the purposes of satisfying any legal, accounting, or reporting requirements.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Security</h2>
          <p>
            We have implemented appropriate security measures to prevent your personal data from being accidentally lost, 
            used, or accessed in an unauthorized way, altered, or disclosed. We limit access to your personal data to those 
            employees, agents, contractors, and other third parties who have a business need to know.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Third-Party Services</h2>
          <p>
            We use third-party services that may collect information used to identify you. These include:
          </p>
          <ul className="list-disc pl-6 mt-4 mb-6">
            <li><strong>Payment Processors:</strong> We use Stripe to process payments. Their privacy policy can be viewed at <a href="https://stripe.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://stripe.com/privacy</a>.</li>
            <li><strong>AI Service Providers:</strong> We use external AI services to generate LaTeX documents. These providers have access to the content you submit for generation.</li>
            <li><strong>Analytics:</strong> We use analytics to track usage of our service.</li>
            <li><strong>Advertising:</strong> We use Google AdSense to display ads on our site. Google may use cookies to personalize ads. You can learn more about how Google uses data at <a href="https://policies.google.com/technologies/partner-sites" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://policies.google.com/technologies/partner-sites</a>.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Your Rights</h2>
          <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including:</p>
          <ul className="list-disc pl-6 mt-4 mb-6">
            <li>The right to request access to your personal data</li>
            <li>The right to request correction of your personal data</li>
            <li>The right to request erasure of your personal data</li>
            <li>The right to object to processing of your personal data</li>
            <li>The right to request restriction of processing your personal data</li>
            <li>The right to request transfer of your personal data</li>
            <li>The right to withdraw consent</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Cookies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our website and hold certain information. 
            Cookies are files with a small amount of data that may include an anonymous unique identifier. You can instruct 
            your browser to refuse all cookies or to indicate when a cookie is being sent.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Children's Privacy</h2>
          <p>
            Our service does not address anyone under the age of 18. We do not knowingly collect personally identifiable 
            information from anyone under the age of 18. If we become aware that we have collected personal data from children 
            without verification of parental consent, we take steps to remove that information from our servers.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
            Privacy Policy on this page and updating the "Last updated" date.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="mt-2">
            <strong>Email:</strong> <a href="mailto:support@aitexgen.com" className="text-blue-600 hover:underline">support@aitexgen.com</a>
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}
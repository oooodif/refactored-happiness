import { useEffect, useState } from "react";
import SiteLayout from "@/components/layout/site-layout";
import { motion, useScroll, useTransform } from "framer-motion";
import { useInView } from "react-intersection-observer";

// Animated section component with fade-in and slide-up effect
const AnimatedSection = ({ 
  children, 
  className = "", 
  delay = 0,
}) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ 
        duration: 0.7, 
        delay: delay,
        ease: [0.25, 0.1, 0.25, 1.0]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Enhanced section heading with decorative elements
const SectionHeading = ({ number, title }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative mb-8 mt-16"
    >
      <div className="flex items-center">
        <div className="mr-4 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 p-[2px]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-gray-900">
            <span className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
              {number}
            </span>
          </div>
        </div>
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
          {title}
        </h2>
      </div>
      <motion.div
        initial={{ width: 0 }}
        animate={inView ? { width: "100%" } : { width: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="h-[1px] w-full bg-gradient-to-r from-blue-600/50 to-cyan-500/30 mt-4"
      />
    </motion.div>
  );
};

// Card component with glass effect
const GlassCard = ({ children, className = "" }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className={`relative backdrop-blur-lg bg-white/30 dark:bg-gray-900/30 rounded-2xl border border-gray-200/30 dark:border-gray-700/30 shadow-xl overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 -z-10" />
      <div className="p-6">{children}</div>
    </motion.div>
  );
};

export default function PrivacyPolicy() {
  const { scrollYProgress } = useScroll();
  const backgroundOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const gradientY = useTransform(scrollYProgress, [0, 1], [0, 500]);
  const titleScale = useTransform(scrollYProgress, [0, 0.1], [1, 0.9]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.8]);
  
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
      {/* Hero section with parallax effect */}
      <motion.div 
        className="relative min-h-[30vh] flex items-center justify-center overflow-hidden"
        style={{ opacity: backgroundOpacity }}
      >
        <motion.div 
          className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-cyan-500/20 -z-10"
          style={{ y: gradientY }}
        />
        <div className="absolute inset-0 bg-grid-pattern opacity-5 -z-10" />
        
        <motion.div 
          className="text-center px-4 py-16 max-w-4xl mx-auto z-10"
          style={{ scale: titleScale, opacity: titleOpacity }}
        >
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7 }}
            className="text-5xl sm:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500"
          >
            Privacy Policy
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto"
          >
            Learn how we protect your data and respect your privacy
          </motion.p>
        </motion.div>
      </motion.div>
      
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <AnimatedSection delay={0.2}>
          <div className="flex justify-between items-center mb-10">
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
              Last updated: May 13, 2025
            </p>
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Policy</span>
            </div>
          </div>
        </AnimatedSection>
        
        <AnimatedSection delay={0.3} className="mb-12">
          <GlassCard>
            <p className="text-lg leading-relaxed">
              Welcome to AI LaTeX Generator ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
            </p>
          </GlassCard>
        </AnimatedSection>
        
        <div className="space-y-8">
          {/* Section 1: Data Collection */}
          <section>
            <SectionHeading number="1" title="Data We Collect" />
            <AnimatedSection>
              <p className="mb-4 text-gray-700 dark:text-gray-300">We may collect, use, store and transfer different kinds of personal data about you, including:</p>
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                {[
                  { title: "Identity Data", description: "Email address and username" },
                  { title: "Technical Data", description: "IP address, browser type and version, time zone setting and location" },
                  { title: "Usage Data", description: "Information about how you use our website and services" },
                  { title: "LaTeX Generation Data", description: "Input content you provide and the LaTeX content generated" },
                ].map((item, i) => (
                  <AnimatedSection key={i} delay={0.1 * i}>
                    <div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 h-full">
                      <h3 className="text-xl font-semibold mb-3 text-blue-600 dark:text-blue-400">{item.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </AnimatedSection>
          </section>
          
          {/* Section 2: Data Usage */}
          <section>
            <SectionHeading number="2" title="How We Use Your Data" />
            <AnimatedSection>
              <p className="mb-6 text-gray-700 dark:text-gray-300">We use your data for the following purposes:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Provide and maintain our service",
                  "Notify you about changes",
                  "Allow interactive features",
                  "Provide customer support",
                  "Gather analysis to improve service",
                  "Monitor usage",
                  "Detect and address technical issues",
                  "Process payments and maintain records",
                ].map((item, i) => (
                  <AnimatedSection key={i} delay={0.05 * i}>
                    <div className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-xs">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{item}</p>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </AnimatedSection>
          </section>
          
          {/* Section 3: Data Retention and Security */}
          <section>
            <SectionHeading number="3" title="Data Retention & Security" />
            <div className="grid md:grid-cols-2 gap-8">
              <AnimatedSection>
                <div className="h-full p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full"></div>
                  <h3 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">Data Retention</h3>
                  <p className="relative z-10 text-gray-700 dark:text-gray-300">
                    We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, 
                    including for the purposes of satisfying any legal, accounting, or reporting requirements.
                  </p>
                </div>
              </AnimatedSection>
              
              <AnimatedSection delay={0.1}>
                <div className="h-full p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-bl-full"></div>
                  <h3 className="text-xl font-semibold mb-4 text-cyan-600 dark:text-cyan-400">Data Security</h3>
                  <p className="relative z-10 text-gray-700 dark:text-gray-300">
                    We have implemented appropriate security measures to prevent your personal data from being accidentally lost, 
                    used, or accessed in an unauthorized way, altered, or disclosed. We limit access to your personal data to those 
                    who have a business need to know.
                  </p>
                </div>
              </AnimatedSection>
            </div>
          </section>
          
          {/* Section 4: Third-Party Services */}
          <section>
            <SectionHeading number="4" title="Third-Party Services" />
            <AnimatedSection>
              <GlassCard className="mb-8">
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  We use third-party services that may collect information used to identify you. These include:
                </p>
                <div className="space-y-4">
                  {[
                    { 
                      title: "Payment Processors", 
                      description: "We use Stripe to process payments.",
                      link: "https://stripe.com/privacy",
                      linkText: "View Stripe's privacy policy"
                    },
                    { 
                      title: "AI Service Providers", 
                      description: "We use external AI services to generate LaTeX documents. These providers have access to the content you submit for generation."
                    },
                    { 
                      title: "Analytics", 
                      description: "We use analytics to track usage of our service."
                    },
                    { 
                      title: "Advertising", 
                      description: "We use Google AdSense to display ads on our site.",
                      link: "https://policies.google.com/technologies/partner-sites",
                      linkText: "Learn how Google uses data"
                    },
                  ].map((item, i) => (
                    <AnimatedSection key={i} delay={0.1 * i} className="flex gap-4 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
                        {item.link && (
                          <a 
                            href={item.link} 
                            className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {item.linkText}
                            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </AnimatedSection>
                  ))}
                </div>
              </GlassCard>
            </AnimatedSection>
          </section>
          
          {/* Section 5: Your Rights */}
          <section>
            <SectionHeading number="5" title="Your Rights" />
            <AnimatedSection>
              <p className="mb-6 text-gray-700 dark:text-gray-300">Under certain circumstances, you have rights under data protection laws in relation to your personal data, including:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  "Request access to your data",
                  "Request correction of your data",
                  "Request erasure of your data",
                  "Object to processing of your data",
                  "Request restriction of processing",
                  "Request transfer of your data",
                  "Withdraw consent at any time"
                ].map((right, i) => (
                  <AnimatedSection key={i} delay={0.05 * i}>
                    <div className="p-4 h-full rounded-lg bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 shadow border border-gray-100 dark:border-gray-700 flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-700 dark:text-gray-300">{right}</p>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </AnimatedSection>
          </section>
          
          {/* Final Sections */}
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <AnimatedSection>
              <div className="h-full p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Cookies</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  We use cookies and similar tracking technologies to track activity on our website and hold certain information. 
                  Cookies are files with a small amount of data that may include an anonymous unique identifier. You can instruct 
                  your browser to refuse all cookies or to indicate when a cookie is being sent.
                </p>
              </div>
            </AnimatedSection>
            
            <AnimatedSection delay={0.1}>
              <div className="h-full p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Children's Privacy</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Our service does not address anyone under the age of 18. We do not knowingly collect personally identifiable 
                  information from anyone under the age of 18. If we become aware that we have collected personal data from children 
                  without verification of parental consent, we take steps to remove that information from our servers.
                </p>
              </div>
            </AnimatedSection>
          </div>
          
          {/* Contact Section */}
          <section className="mt-16">
            <AnimatedSection>
              <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-blue-500 to-cyan-500 p-[2px]">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">Contact Us</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    If you have any questions about this Privacy Policy, please contact us at:
                  </p>
                  <a 
                    href="mailto:support@aitexgen.com" 
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    support@aitexgen.com
                  </a>
                </div>
              </div>
            </AnimatedSection>
          </section>
        </div>
      </div>
      
      {/* Fixed progress bar at the top of the page */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 origin-left z-50"
        style={{ scaleX: scrollYProgress }}
      />
    </SiteLayout>
  );
}
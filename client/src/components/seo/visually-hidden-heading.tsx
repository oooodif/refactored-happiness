import React from 'react';

interface VisuallyHiddenHeadingProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}

/**
 * A component that renders a visually hidden heading for SEO purposes
 * The heading is hidden from view but still accessible to screen readers and search engines
 * 
 * Implementation follows best practices for accessibility and SEO:
 * - Content stays in the DOM for crawlers
 * - The element is not set to display:none (which would be ignored by crawlers)
 * - Uses aria attributes for better screen reader support
 */
export function VisuallyHiddenHeading({
  level = 1,
  children,
  className = '',
}: VisuallyHiddenHeadingProps) {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <HeadingTag 
      className={`visually-hidden ${className}`}
      // Add ARIA role for accessibility but maintain semantic H1 for SEO
      aria-hidden="false"
      tabIndex={-1}
      // Adding data attribute to make it extra clear this content is important for SEO
      data-seo-important="true"
    >
      {/* Add a comment to make the important heading more visible in HTML source */}
      {/* Important SEO H1 content: */}
      {children}
    </HeadingTag>
  );
}
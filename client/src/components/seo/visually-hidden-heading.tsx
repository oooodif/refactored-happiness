import React from 'react';

interface VisuallyHiddenHeadingProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}

/**
 * A component that renders a visually hidden heading for SEO purposes
 * The heading is hidden from view but still accessible to screen readers and search engines
 */
export function VisuallyHiddenHeading({
  level = 1,
  children,
  className = '',
}: VisuallyHiddenHeadingProps) {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <HeadingTag className={`visually-hidden ${className}`}>
      {children}
    </HeadingTag>
  );
}
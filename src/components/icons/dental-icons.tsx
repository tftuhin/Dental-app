import React from "react";

export function ToothIcon({ className = "h-4 w-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 2C8.5 2 6 4.5 6 8c0 3 1.5 5.5 2 8 .5 2.5 1 5 2.5 5 1.2 0 1.5-2 1.5-4 0-1.5.5-2 0-3-.5-1-1.5-1-1.5-2 0-2 1.5-3 3-3s3 1 3 3c0 1-1 1-1.5 2-.5 1 0 1.5 0 3 0 2 .3 4 1.5 4 1.5 0 2-2.5 2.5-5 .5-2.5 2-5 2-8 0-3.5-2.5-6-6-6z" />
    </svg>
  );
}

export function MolarIcon({ className = "h-4 w-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M7 3C5 3 3 5 3 8c0 4 1.5 7 2.5 10 .8 2.5 1.5 3 2.5 3 1 0 1.5-1.5 2-3.5.5-2 .5-3.5 2-3.5s1.5 1.5 2 3.5c.5 2 1 3.5 2 3.5 1 0 1.7-.5 2.5-3 1-3 2.5-6 2.5-10 0-3-2-5-4-5-1.5 0-2.5.8-3.5 1.5C12.5 3.8 11.5 3 10 3H7z" />
    </svg>
  );
}

export function PeriodontalProbeIcon({ className = "h-4 w-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M4 20L18 6" />
      <path d="M15 3l6 6" />
      <path d="M12 8l2 2" />
      <path d="M9 11l2 2" />
      <path d="M6 14l2 2" />
    </svg>
  );
}

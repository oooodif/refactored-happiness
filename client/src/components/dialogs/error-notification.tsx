import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ErrorNotificationData } from "@/lib/types";

interface ErrorNotificationProps {
  data: ErrorNotificationData;
  onClose: () => void;
  autoCloseDelay?: number;
}

export default function ErrorNotification({
  data,
  onClose,
  autoCloseDelay = 10000,
}: ErrorNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  // Auto-close the notification after the specified delay
  useEffect(() => {
    if (!autoCloseDelay) return;

    const timer = setTimeout(() => {
      handleClose();
    }, autoCloseDelay);

    return () => clearTimeout(timer);
  }, [autoCloseDelay]);

  // Handle the closing animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 bg-white border border-red-300 rounded-lg shadow-lg p-4 max-w-md transition-opacity duration-300",
        isClosing ? "opacity-0" : "opacity-100"
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900">{data.title}</h3>
          <div className="mt-1 text-sm text-gray-600">
            <p>{data.message}</p>
          </div>
          {data.actions && data.actions.length > 0 && (
            <div className="mt-2 flex space-x-3">
              {data.actions.map((action, index) => (
                <button
                  key={index}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  onClick={() => {
                    action.action();
                    handleClose();
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            className="text-gray-400 hover:text-gray-500"
            onClick={handleClose}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

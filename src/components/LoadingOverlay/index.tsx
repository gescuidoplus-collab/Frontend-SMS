"use client";

import { useEffect, useState } from "react";

export default function LoadingOverlay() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hideLoader = () => {
      setIsLoading(false);
      const root = document.getElementById('__next');
      if (root) {
        root.classList.add('styles-loaded');
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', hideLoader);
      window.addEventListener('load', hideLoader);
      return () => {
        document.removeEventListener('DOMContentLoaded', hideLoader);
        window.removeEventListener('load', hideLoader);
      };
    } else {
      hideLoader();
    }
  }, []);

  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <div className="spinner"></div>
    </div>
  );
}

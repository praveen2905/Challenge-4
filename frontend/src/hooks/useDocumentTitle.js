import { useEffect } from "react";

export function useDocumentTitle(title) {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = title ? `${title} | VenueIQ` : "VenueIQ — AI-Powered Venue Operations";
    return () => {
      document.title = originalTitle;
    };
  }, [title]);
}

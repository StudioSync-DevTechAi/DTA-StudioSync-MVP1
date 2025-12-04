import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PhotographyOwner {
  photography_owner_phno: string;
  photography_owner_email: string;
  photography_owner_name: string;
}

/**
 * Custom hook to fetch photography owner data from the database
 * This hook is specific to the estimates module and handles data fetching separately
 * from the projects module.
 */
export function usePhotographyOwner() {
  const [photographyOwner, setPhotographyOwner] = useState<PhotographyOwner | null>(null);
  const [loadingOwner, setLoadingOwner] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPhotographyOwner = async () => {
      setLoadingOwner(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from("photography_owner_table")
          .select("photography_owner_phno, photography_owner_email, photography_owner_name")
          .limit(1)
          .maybeSingle();

        if (fetchError) {
          console.error("Error fetching photography owner:", fetchError);
          console.error("Error details:", {
            code: fetchError.code,
            message: fetchError.message,
            details: fetchError.details,
            hint: fetchError.hint
          });
          setError(new Error(fetchError.message || "Failed to fetch photography owner data"));
        } else if (data) {
          setPhotographyOwner(data);
          console.log("Photography owner data loaded:", data);
        } else {
          console.warn("No photography owner data found in database");
          console.warn("This might be due to RLS policies. Check if SELECT policy exists for photography_owner_table");
          setError(new Error("No photography owner data found"));
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        console.error("Error in fetchPhotographyOwner:", err);
        setError(new Error(errorMessage));
      } finally {
        setLoadingOwner(false);
      }
    };

    // Fetch immediately on hook initialization
    fetchPhotographyOwner();
  }, []); // Empty dependency array ensures this runs only once

  return {
    photographyOwner,
    loadingOwner,
    error
  };
}


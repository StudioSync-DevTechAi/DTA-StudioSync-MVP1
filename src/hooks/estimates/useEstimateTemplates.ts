import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EstimateTemplate, PhotographyOwnerTemplateData } from "@/types/estimateTemplate";
import { defaultTemplates } from "@/data/defaultTemplates";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export function useEstimateTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EstimateTemplate[]>(defaultTemplates);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [user]);

  const loadTemplates = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First, get the photography owner record
      const { data: ownerData, error: ownerError } = await supabase
        .from("photography_owner_table")
        .select("photography_owner_email, photography_owner_estimateForm_template")
        .eq("photography_owner_email", user.email)
        .single();

      if (ownerError) {
        // PGRST116 = no rows returned
        if (ownerError.code === "PGRST116") {
          // No record found, initialize with defaults
          console.log("No photography owner record found, initializing templates");
          await initializeTemplates();
          return;
        }
        throw ownerError;
      }

      if (ownerData?.photography_owner_estimateForm_template) {
        const templateData = ownerData.photography_owner_estimateForm_template;
        
        // Handle both direct array and wrapped object structure
        if (Array.isArray(templateData)) {
          // If it's directly an array of templates
          setTemplates(templateData);
        } else if (templateData && typeof templateData === 'object' && 'templates' in templateData) {
          // If it's wrapped in an object with templates property
          const wrappedData = templateData as PhotographyOwnerTemplateData["photography_owner_estimateForm_template"];
          if (wrappedData.templates && wrappedData.templates.length > 0) {
            setTemplates(wrappedData.templates);
          } else {
            // Templates array is empty, initialize with defaults
            await initializeTemplates();
          }
        } else {
          // Invalid structure, initialize with defaults
          await initializeTemplates();
        }
      } else {
        // If no templates exist, initialize with defaults
        await initializeTemplates();
      }
    } catch (err: any) {
      console.error("Error loading templates:", err);
      setError(err.message || "Failed to load templates");
      // Fallback to default templates
      setTemplates(defaultTemplates);
    } finally {
      setLoading(false);
    }
  };

  const initializeTemplates = async () => {
    if (!user?.email) return;

    try {
      const templateData: PhotographyOwnerTemplateData["photography_owner_estimateForm_template"] = {
        templates: defaultTemplates,
        defaultTemplateId: defaultTemplates[0].id,
      };

      const { error: updateError } = await supabase
        .from("photography_owner_table")
        .update({
          photography_owner_estimateForm_template: templateData,
        })
        .eq("photography_owner_email", user.email);

      if (updateError) throw updateError;

      setTemplates(defaultTemplates);
    } catch (err: any) {
      console.error("Error initializing templates:", err);
      throw err;
    }
  };

  const updateTemplate = async (template: EstimateTemplate) => {
    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    try {
      setError(null);

      // Get current templates
      const { data: ownerData, error: fetchError } = await supabase
        .from("photography_owner_table")
        .select("photography_owner_estimateForm_template")
        .eq("photography_owner_email", user.email)
        .single();

      if (fetchError) throw fetchError;

      const currentTemplateData =
        (ownerData?.photography_owner_estimateForm_template as PhotographyOwnerTemplateData["photography_owner_estimateForm_template"]) ||
        { templates: defaultTemplates };

      // Update the template in the array
      const updatedTemplates = currentTemplateData.templates.map((t) =>
        t.id === template.id ? { ...template, updatedAt: new Date().toISOString() } : t
      );

      const updatedTemplateData: PhotographyOwnerTemplateData["photography_owner_estimateForm_template"] = {
        ...currentTemplateData,
        templates: updatedTemplates,
      };

      const { error: updateError } = await supabase
        .from("photography_owner_table")
        .update({
          photography_owner_estimateForm_template: updatedTemplateData,
        })
        .eq("photography_owner_email", user.email);

      if (updateError) throw updateError;

      setTemplates(updatedTemplates);
      toast({
        title: "Template updated",
        description: "Your template has been saved successfully.",
      });
    } catch (err: any) {
      console.error("Error updating template:", err);
      setError(err.message || "Failed to update template");
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    templates,
    loading,
    error,
    updateTemplate,
    reloadTemplates: loadTemplates,
  };
}


import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EstimateTemplate } from "@/types/estimateTemplate";
import { useEstimateTemplates } from "@/hooks/estimates/useEstimateTemplates";
import { TemplateEditor } from "./TemplateEditor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface TemplateSelectorProps {
  onTemplateSelect?: (template: EstimateTemplate) => void;
}

export function TemplateSelector({ onTemplateSelect }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EstimateTemplate | null>(null);
  const { templates, loading, error, reloadTemplates } = useEstimateTemplates();

  const handleOpenDialog = () => {
    setIsOpen(true);
    // Reload templates when dialog opens to ensure we have the latest data
    reloadTemplates();
  };

  const handleTemplateClick = (template: EstimateTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
    setIsOpen(false);
  };

  const handleEditTemplate = (template: EstimateTemplate) => {
    setEditingTemplate(template);
  };

  const handleCloseEditor = async () => {
    setEditingTemplate(null);
    // Reload templates after closing editor to get updated data
    await reloadTemplates();
  };

  if (editingTemplate) {
    return (
      <TemplateEditor
        template={editingTemplate}
        onClose={handleCloseEditor}
        onSave={handleCloseEditor}
      />
    );
  }

  return (
    <>
      <Button
        variant="outline"
        className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground px-3 w-full sm:w-auto"
        onClick={handleOpenDialog}
      >
        Estimate Template
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Estimate Templates</DialogTitle>
            <DialogDescription>
              Select a template or edit an existing one to customize your estimate form structure.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-red-500 p-4">Error loading templates: {error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleTemplateClick(template)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.description && (
                      <CardDescription>{template.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Entry Form:</span>{" "}
                        {Object.entries(template.EntryForm)
                          .filter(([_, value]) => typeof value === "boolean" && value)
                          .map(([key]) => key.replace(/_/g, " "))
                          .join(", ")}
                      </div>
                      <div>
                        <span className="font-medium">Event Types:</span>{" "}
                        {template.Services.eventTypes.length}
                      </div>
                      <div>
                        <span className="font-medium">Add-Ons:</span>{" "}
                        {template.Services.optionalAddOns.checkListableItems.length} items
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTemplate(template);
                      }}
                    >
                      Edit Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}


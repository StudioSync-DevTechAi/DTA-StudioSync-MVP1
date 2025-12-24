import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EstimateTemplate } from "@/types/estimateTemplate";
import { useEstimateTemplates } from "@/hooks/estimates/useEstimateTemplates";
import { Plus, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TemplateEditorProps {
  template: EstimateTemplate;
  onClose: () => void;
  onSave: () => void;
}

export function TemplateEditor({ template, onClose, onSave }: TemplateEditorProps) {
  const { updateTemplate } = useEstimateTemplates();
  const [editedTemplate, setEditedTemplate] = useState<EstimateTemplate>({ ...template });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateTemplate(editedTemplate);
      onSave();
    } catch (error) {
      console.error("Error saving template:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateEntryForm = (field: keyof EstimateTemplate["EntryForm"], value: any) => {
    setEditedTemplate((prev) => ({
      ...prev,
      EntryForm: {
        ...prev.EntryForm,
        [field]: value,
      },
    }));
  };

  const addEventType = () => {
    setEditedTemplate((prev) => ({
      ...prev,
      Services: {
        ...prev.Services,
        eventTypes: [
          ...prev.eventTypes,
          {
            EstimateType_Heading: "",
            events_list: [],
          },
        ],
      },
    }));
  };

  const updateEventType = (index: number, field: string, value: any) => {
    setEditedTemplate((prev) => ({
      ...prev,
      Services: {
        ...prev.Services,
        eventTypes: prev.eventTypes.map((et, i) =>
          i === index ? { ...et, [field]: value } : et
        ),
      },
    }));
  };

  const addEventToList = (eventTypeIndex: number) => {
    setEditedTemplate((prev) => ({
      ...prev,
      Services: {
        ...prev.Services,
        eventTypes: prev.eventTypes.map((et, i) =>
          i === eventTypeIndex
            ? { ...et, events_list: [...et.events_list, ""] }
            : et
        ),
      },
    }));
  };

  const updateEventInList = (eventTypeIndex: number, eventIndex: number, value: string) => {
    setEditedTemplate((prev) => ({
      ...prev,
      Services: {
        ...prev.Services,
        eventTypes: prev.eventTypes.map((et, i) =>
          i === eventTypeIndex
            ? {
                ...et,
                events_list: et.events_list.map((e, j) => (j === eventIndex ? value : e)),
              }
            : et
        ),
      },
    }));
  };

  const removeEventFromList = (eventTypeIndex: number, eventIndex: number) => {
    setEditedTemplate((prev) => ({
      ...prev,
      Services: {
        ...prev.Services,
        eventTypes: prev.eventTypes.map((et, i) =>
          i === eventTypeIndex
            ? {
                ...et,
                events_list: et.events_list.filter((_, j) => j !== eventIndex),
              }
            : et
        ),
      },
    }));
  };

  const removeEventType = (index: number) => {
    setEditedTemplate((prev) => ({
      ...prev,
      Services: {
        ...prev.Services,
        eventTypes: prev.eventTypes.filter((_, i) => i !== index),
      },
    }));
  };

  const addAddOnItem = () => {
    setEditedTemplate((prev) => ({
      ...prev,
      Services: {
        ...prev.Services,
        optionalAddOns: {
          ...prev.Services.optionalAddOns,
          checkListableItems: [...prev.Services.optionalAddOns.checkListableItems, ""],
        },
      },
    }));
  };

  const updateAddOnItem = (index: number, value: string) => {
    setEditedTemplate((prev) => ({
      ...prev,
      Services: {
        ...prev.Services,
        optionalAddOns: {
          ...prev.Services.optionalAddOns,
          checkListableItems: prev.Services.optionalAddOns.checkListableItems.map((item, i) =>
            i === index ? value : item
          ),
        },
      },
    }));
  };

  const removeAddOnItem = (index: number) => {
    setEditedTemplate((prev) => ({
      ...prev,
      Services: {
        ...prev.Services,
        optionalAddOns: {
          ...prev.Services.optionalAddOns,
          checkListableItems: prev.Services.optionalAddOns.checkListableItems.filter(
            (_, i) => i !== index
          ),
        },
      },
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Template: {editedTemplate.name}</DialogTitle>
          <DialogDescription>
            Customize the template structure for your estimate forms.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={editedTemplate.name}
                  onChange={(e) =>
                    setEditedTemplate((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editedTemplate.description || ""}
                  onChange={(e) =>
                    setEditedTemplate((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Entry Form */}
          <Card>
            <CardHeader>
              <CardTitle>Entry Form Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="studioName"
                  checked={editedTemplate.EntryForm.photography_owner_studioName}
                  onCheckedChange={(checked) =>
                    updateEntryForm("photography_owner_studioName", checked)
                  }
                />
                <Label htmlFor="studioName">Studio Name</Label>
              </div>
              {editedTemplate.EntryForm.photography_owner_studioName && (
                <div className="space-y-2 ml-6">
                  <Label>Studio Name Subtext</Label>
                  <Input
                    value={editedTemplate.EntryForm.studioName_subText}
                    onChange={(e) => updateEntryForm("studioName_subText", e.target.value)}
                  />
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="clientName"
                  checked={editedTemplate.EntryForm.clientName}
                  onCheckedChange={(checked) => updateEntryForm("clientName", checked)}
                />
                <Label htmlFor="clientName">Client Name</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="clientEmail"
                  checked={editedTemplate.EntryForm.clientEmail}
                  onCheckedChange={(checked) => updateEntryForm("clientEmail", checked)}
                />
                <Label htmlFor="clientEmail">Client Email</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="clientPhNo"
                  checked={editedTemplate.EntryForm.clientPhNo}
                  onCheckedChange={(checked) => updateEntryForm("clientPhNo", checked)}
                />
                <Label htmlFor="clientPhNo">Client Phone Number</Label>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>Services Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Services Subtext</Label>
                <Input
                  value={editedTemplate.Services.Services_SubText}
                  onChange={(e) =>
                    setEditedTemplate((prev) => ({
                      ...prev,
                      Services: {
                        ...prev.Services,
                        Services_SubText: e.target.value,
                      },
                    }))
                  }
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Event Types</Label>
                  <Button type="button" size="sm" onClick={addEventType}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Event Type
                  </Button>
                </div>

                {editedTemplate.Services.eventTypes.map((eventType, etIndex) => (
                  <Card key={etIndex} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Input
                        placeholder="Event Type Heading"
                        value={eventType.EstimateType_Heading}
                        onChange={(e) =>
                          updateEventType(etIndex, "EstimateType_Heading", e.target.value)
                        }
                        className="flex-1 mr-2"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEventType(etIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2 ml-4">
                      {eventType.events_list.map((event, eIndex) => (
                        <div key={eIndex} className="flex items-center space-x-2">
                          <Input
                            placeholder="Event name"
                            value={event}
                            onChange={(e) =>
                              updateEventInList(etIndex, eIndex, e.target.value)
                            }
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEventFromList(etIndex, eIndex)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addEventToList(etIndex)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Event
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Optional Add-Ons */}
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label>Optional Add-Ons Heading</Label>
                  <Input
                    value={editedTemplate.Services.optionalAddOns.heading}
                    onChange={(e) =>
                      setEditedTemplate((prev) => ({
                        ...prev,
                        Services: {
                          ...prev.Services,
                          optionalAddOns: {
                            ...prev.Services.optionalAddOns,
                            heading: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Checklist Items</Label>
                  {editedTemplate.Services.optionalAddOns.checkListableItems.map(
                    (item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={item}
                          onChange={(e) => updateAddOnItem(index, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAddOnItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={addAddOnItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estimates */}
          <Card>
            <CardHeader>
              <CardTitle>Estimates Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Estimates Subtext</Label>
                <Input
                  value={editedTemplate.Estimates.Estimates_SubText}
                  onChange={(e) =>
                    setEditedTemplate((prev) => ({
                      ...prev,
                      Estimates: {
                        ...prev.Estimates,
                        Estimates_SubText: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { serviceTemplates } from "../data/serviceTemplates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InvoiceItemsCardProps {
  items: { description: string; amount: string }[];
  onItemsChange: (items: { description: string; amount: string }[]) => void;
  errors?: Record<string, string>;
}

export function InvoiceItemsCard({ items, onItemsChange, errors = {} }: InvoiceItemsCardProps) {
  const addItem = () => {
    onItemsChange([...items, { description: "", amount: "" }]);
  };

  const removeItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const handleTemplateSelect = (index: number, template: typeof serviceTemplates[0]) => {
    const newItems = [...items];
    newItems[index] = {
      description: template.label,
      amount: template.price,
    };
    onItemsChange(newItems);
  };

  return (
    <Card 
      className="p-4"
      style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}
    >
      <h3 className="font-medium mb-4 text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Invoice Items</h3>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <Label htmlFor={`description-${index}`} className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Description</Label>
                <Select
                  onValueChange={(value) => {
                    const template = serviceTemplates.find(t => t.label === value);
                    if (template) {
                      handleTemplateSelect(index, template);
                    }
                  }}
                >
                  <SelectTrigger 
                    className="mt-2 text-white"
                    style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
                  >
                    <SelectValue placeholder="Select service or type custom" />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
                    {serviceTemplates.map((template) => (
                      <SelectItem key={template.label} value={template.label} className="text-white hover:bg-[#1a0f3d]">
                        {template.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id={`description-${index}`}
                  placeholder="Or type custom service description"
                  className="mt-2 text-white placeholder:text-gray-400"
                  value={item.description}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].description = e.target.value;
                    onItemsChange(newItems);
                  }}
                  style={{ 
                    backgroundColor: 'rgba(45, 27, 78, 0.95)', 
                    borderColor: errors[`items.${index}.description`] ? '#ef4444' : '#5a4a7a', 
                    color: '#ffffff', 
                    borderWidth: '1.5px', 
                    borderStyle: 'solid' 
                  }}
                />
                {errors[`items.${index}.description`] && (
                  <p className="text-sm text-red-400 mt-1" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                    {errors[`items.${index}.description`]}
                  </p>
                )}
              </div>
              <div className="w-32">
                <Label htmlFor={`amount-${index}`} className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Amount</Label>
                <Input
                  id={`amount-${index}`}
                  placeholder="₹0.00"
                  className="mt-2 text-white placeholder:text-gray-400 text-center"
                  value={item.amount}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].amount = e.target.value;
                    onItemsChange(newItems);
                  }}
                  style={{ 
                    backgroundColor: 'rgba(45, 27, 78, 0.95)', 
                    borderColor: errors[`items.${index}.amount`] ? '#ef4444' : '#5a4a7a', 
                    color: '#ffffff', 
                    borderWidth: '1.5px', 
                    borderStyle: 'solid', 
                    textAlign: 'center' 
                  }}
                />
                {errors[`items.${index}.amount`] && (
                  <p className="text-sm text-red-400 mt-1" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                    {errors[`items.${index}.amount`]}
                  </p>
                )}
              </div>
              {items.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-8 text-white hover:bg-white/10"
                  onClick={() => removeItem(index)}
                  style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff' }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      {errors.items && (
        <p className="text-sm text-red-400 mt-2" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
          {errors.items}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        className="mt-4 w-full text-white border-[#5a4a7a] hover:bg-[#1a0f3d]"
        onClick={addItem}
        style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Item
      </Button>
    </Card>
  );
}

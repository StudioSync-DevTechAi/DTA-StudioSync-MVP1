
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Pencil, ChevronDown, ChevronUp, Plus, X, Check } from "lucide-react";

interface Service {
  title: string;
  items: string[];
}

export const services: Record<string, Service> = {
  bigFat: {
    title: "BigFat Weddings",
    items: [
      "Candid Photography",
      "Cinematography",
      "Traditional Photography",
      "Traditional Videography",
      "Premium Albums",
      "Cloud Gallery"
    ]
  },
  intimate: {
    title: "Intimate Weddings",
    items: [
      "Candid Photography",
      "Cinematography",
      "Cloud Gallery"
    ]
  },
  addons: {
    title: "Optional Addons",
    items: [
      "Evite (E-invitations) - starts from 2,000/-",
      "LED Screen 25,000/-",
      "Live Streaming HD - 15,000/-",
      "Traditional Video coverage - 30,000/- Per Day",
      "Traditional Photo - 20,000/- Per Day",
      "Albums - 25,000/- (35-40 sheets)"
    ]
  }
};

interface ServicesPageProps {
  selectedServices: string[];
  onServicesChange: (services: string[]) => void;
  isReadOnly?: boolean;
}

export function ServicesPage({ selectedServices, onServicesChange, isReadOnly = false }: ServicesPageProps) {
  const [description] = useState(() => {
    const saved = localStorage.getItem('servicesPageDescription');
    return saved || '(Optional) Select service packages to include in your estimate. This page will always be displayed in the final estimate.';
  });

  const handleToggleService = (serviceKey: string) => {
    if (selectedServices.includes(serviceKey)) {
      onServicesChange(selectedServices.filter(s => s !== serviceKey));
    } else {
      onServicesChange([...selectedServices, serviceKey]);
    }
  };

  // Handle individual addon selection
  const handleToggleAddon = (addonItem: string) => {
    const addonKey = `addon:${addonItem}`;
    if (selectedServices.includes(addonKey)) {
      onServicesChange(selectedServices.filter(s => s !== addonKey));
    } else {
      onServicesChange([...selectedServices, addonKey]);
    }
  };

  // Check if an addon item is selected
  const isAddonSelected = (addonItem: string) => {
    return selectedServices.includes(`addon:${addonItem}`);
  };

  // State for editable services (loaded from localStorage or default)
  const [editableServices, setEditableServices] = useState<Record<string, Service>>(() => {
    const saved = localStorage.getItem('editableServices');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return services;
      }
    }
    return services;
  });

  // State for editing mode per service
  const [editingMode, setEditingMode] = useState<Record<string, boolean>>({});
  
  // State for editing items
  const [editingItems, setEditingItems] = useState<Record<string, Set<number>>>({});
  const [editingItemText, setEditingItemText] = useState<Record<string, Record<number, string>>>({});
  const [addingNewItem, setAddingNewItem] = useState<Record<string, boolean>>({});
  const [newItemText, setNewItemText] = useState<Record<string, string>>({});

  useEffect(() => {
    localStorage.setItem('editableServices', JSON.stringify(editableServices));
  }, [editableServices]);

  // Separate addons from other services
  const serviceEntries = Object.entries(editableServices).filter(([key]) => key !== 'addons');
  const addonsService = editableServices.addons;
  
  // Combine all services including addons
  const allServices = [...serviceEntries, ...(addonsService ? [['addons', addonsService]] : [])];
  
  // State for expanded tabs
  const [expandedTabs, setExpandedTabs] = useState<Set<string>>(new Set());

  const toggleTab = (key: string) => {
    setExpandedTabs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const toggleEditMode = (serviceKey: string) => {
    if (isReadOnly) return;
    setEditingMode(prev => ({
      ...prev,
      [serviceKey]: !prev[serviceKey]
    }));
    // Clear editing states when exiting edit mode
    if (editingMode[serviceKey]) {
      setEditingItems(prev => {
        const newState = { ...prev };
        delete newState[serviceKey];
        return newState;
      });
      setAddingNewItem(prev => ({
        ...prev,
        [serviceKey]: false
      }));
    }
  };

  const startEditingItem = (serviceKey: string, index: number) => {
    if (isReadOnly || !editingMode[serviceKey]) return;
    const service = editableServices[serviceKey];
    if (!service) return;
    
    setEditingItems(prev => ({
      ...prev,
      [serviceKey]: new Set([...(prev[serviceKey] || []), index])
    }));
    setEditingItemText(prev => ({
      ...prev,
      [serviceKey]: {
        ...(prev[serviceKey] || {}),
        [index]: service.items[index] || ''
      }
    }));
  };

  const saveItemEdit = (serviceKey: string, index: number) => {
    const newText = editingItemText[serviceKey]?.[index]?.trim();
    if (!newText) return;

    setEditableServices(prev => {
      const updated = { ...prev };
      if (updated[serviceKey]) {
        updated[serviceKey] = {
          ...updated[serviceKey],
          items: updated[serviceKey].items.map((item, i) => i === index ? newText : item)
        };
      }
      return updated;
    });

    setEditingItems(prev => {
      const newSet = new Set(prev[serviceKey] || []);
      newSet.delete(index);
      return { ...prev, [serviceKey]: newSet };
    });
  };

  const cancelItemEdit = (serviceKey: string, index: number) => {
    setEditingItems(prev => {
      const newSet = new Set(prev[serviceKey] || []);
      newSet.delete(index);
      return { ...prev, [serviceKey]: newSet };
    });
  };

  const deleteItem = (serviceKey: string, index: number) => {
    if (isReadOnly || !editingMode[serviceKey]) return;
    setEditableServices(prev => {
      const updated = { ...prev };
      if (updated[serviceKey]) {
        updated[serviceKey] = {
          ...updated[serviceKey],
          items: updated[serviceKey].items.filter((_, i) => i !== index)
        };
      }
      return updated;
    });
  };

  const startAddingItem = (serviceKey: string) => {
    if (isReadOnly || !editingMode[serviceKey]) return;
    setAddingNewItem(prev => ({ ...prev, [serviceKey]: true }));
    setNewItemText(prev => ({ ...prev, [serviceKey]: '' }));
  };

  const saveNewItem = (serviceKey: string) => {
    const newText = newItemText[serviceKey]?.trim();
    if (!newText) {
      setAddingNewItem(prev => ({ ...prev, [serviceKey]: false }));
      return;
    }

    setEditableServices(prev => {
      const updated = { ...prev };
      if (updated[serviceKey]) {
        updated[serviceKey] = {
          ...updated[serviceKey],
          items: [...updated[serviceKey].items, newText]
        };
      }
      return updated;
    });

    setAddingNewItem(prev => ({ ...prev, [serviceKey]: false }));
    setNewItemText(prev => ({ ...prev, [serviceKey]: '' }));
  };

  const cancelAddingItem = (serviceKey: string) => {
    setAddingNewItem(prev => ({ ...prev, [serviceKey]: false }));
    setNewItemText(prev => ({ ...prev, [serviceKey]: '' }));
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-light text-white text-center">SERVICES</h2>
        <p className="text-sm text-gray-300 mt-2">
          {description}
        </p>
      </div>
      
      {/* Horizontal Tabs */}
      <div className="w-full">
        {/* Tab Headers: BigFat and Intimate equal width, Optional Addons full width below */}
        <div className="grid grid-cols-2 gap-2 mb-4 border-b border-white/20 pb-2">
          {serviceEntries.map(([key, service]) => {
            const isExpanded = expandedTabs.has(key);
            const isServiceSelected = selectedServices.includes(key);
            
            return (
              <div
                key={key}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all min-w-0 ${
                  isExpanded 
                    ? 'bg-white/20 text-white border-b-2 border-white' 
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {!isReadOnly && (
                  <Checkbox 
                    checked={isServiceSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        if (!isExpanded) {
                          toggleTab(key);
                        }
                        handleToggleService(key);
                      } else {
                        handleToggleService(key);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    id={`tab-checkbox-${key}`}
                  />
                )}
                <button
                  onClick={() => toggleTab(key)}
                  className="flex items-center gap-2 min-w-0 flex-1"
                >
                  <span className="font-medium truncate">{service.title}</span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  )}
                </button>
              </div>
            );
          })}
          {addonsService && (
            <div className="col-span-2">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all ${
                  expandedTabs.has('addons') 
                    ? 'bg-white/20 text-white border-b-2 border-white' 
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <button
                  onClick={() => toggleTab('addons')}
                  className="flex items-center gap-2"
                >
                  <span className="font-medium">{addonsService.title}</span>
                  {expandedTabs.has('addons') ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {allServices.map(([key, service]) => {
            const isExpanded = expandedTabs.has(key);
            const isAddons = key === 'addons';
            
            if (!isExpanded) return null;

            const isEditing = editingMode[key];
            const isEditingThisItem = (index: number) => editingItems[key]?.has(index);
            const isAddingItem = addingNewItem[key];

            return (
              <Card 
                key={key} 
                className="p-6 space-y-4 relative rounded-lg border bg-card text-card-foreground shadow-sm" 
                style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-medium text-white">{service.title}</h3>
                  <div className="flex items-center gap-2">
                    {!isReadOnly && !isAddons && (
                      <Checkbox 
                        checked={selectedServices.includes(key)}
                        onCheckedChange={() => handleToggleService(key)}
                        id={`service-${key}`}
                      />
                    )}
                    {!isReadOnly && (
                      <button
                        onClick={() => toggleEditMode(key)}
                        className={`p-1.5 rounded transition-colors ${
                          isEditing 
                            ? 'bg-white/20 text-white' 
                            : 'hover:bg-white/10 text-white/70 hover:text-white'
                        }`}
                        title={isEditing ? "Exit edit mode" : "Edit items"}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                {isAddons ? (
                  <ul className="space-y-3 text-sm text-gray-300">
                    {service.items.map((item, index) => (
                      <li key={`${key}-${index}`} className="flex items-start justify-between gap-3">
                        {isEditing && isEditingThisItem(index) ? (
                          <div className="flex-1 flex items-center gap-2">
                            <Input
                              value={editingItemText[key]?.[index] || item}
                              onChange={(e) => setEditingItemText(prev => ({
                                ...prev,
                                [key]: {
                                  ...(prev[key] || {}),
                                  [index]: e.target.value
                                }
                              }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveItemEdit(key, index);
                                } else if (e.key === 'Escape') {
                                  cancelItemEdit(key, index);
                                }
                              }}
                              className="flex-1 text-sm bg-transparent border-white/30 focus:border-white/50 text-white"
                              style={{ backgroundColor: 'rgba(26, 15, 61, 0.5)' }}
                              autoFocus
                            />
                            <button
                              onClick={() => saveItemEdit(key, index)}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                              title="Save"
                            >
                              <Check className="h-4 w-4 text-green-400" />
                            </button>
                            <button
                              onClick={() => cancelItemEdit(key, index)}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                              title="Cancel"
                            >
                              <X className="h-4 w-4 text-red-400" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1">{item}</span>
                            <div className="flex items-center gap-2">
                              {isEditing && (
                                <>
                                  <button
                                    onClick={() => startEditingItem(key, index)}
                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                    title="Edit item"
                                  >
                                    <Pencil className="h-4 w-4 text-white/70 hover:text-white" />
                                  </button>
                                  <button
                                    onClick={() => deleteItem(key, index)}
                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                    title="Delete item"
                                  >
                                    <X className="h-4 w-4 text-red-400/70 hover:text-red-400" />
                                  </button>
                                </>
                              )}
                              {!isReadOnly && (
                                <div className="flex-shrink-0 mt-0.5">
                                  <Checkbox 
                                    checked={isAddonSelected(item)}
                                    onCheckedChange={() => handleToggleAddon(item)}
                                    id={`addon-${index}`}
                                  />
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                    {isEditing && isAddingItem && (
                      <li className="flex items-center gap-2">
                        <Input
                          value={newItemText[key] || ''}
                          onChange={(e) => setNewItemText(prev => ({
                            ...prev,
                            [key]: e.target.value
                          }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveNewItem(key);
                            } else if (e.key === 'Escape') {
                              cancelAddingItem(key);
                            }
                          }}
                          placeholder="Enter new item..."
                          className="flex-1 text-sm bg-transparent border-white/30 focus:border-white/50 text-white"
                          style={{ backgroundColor: 'rgba(26, 15, 61, 0.5)' }}
                          autoFocus
                        />
                        <button
                          onClick={() => saveNewItem(key)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          title="Save"
                        >
                          <Check className="h-4 w-4 text-green-400" />
                        </button>
                        <button
                          onClick={() => cancelAddingItem(key)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          title="Cancel"
                        >
                          <X className="h-4 w-4 text-red-400" />
                        </button>
                      </li>
                    )}
                    {isEditing && !isAddingItem && (
                      <li>
                        <button
                          onClick={() => startAddingItem(key)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          Add new item
                        </button>
                      </li>
                    )}
                  </ul>
                ) : (
                  <ul className="space-y-2 text-sm text-gray-300">
                    {service.items.map((item, index) => (
                      <li key={`${key}-${index}`} className="flex items-center justify-between gap-2">
                        {isEditing && isEditingThisItem(index) ? (
                          <div className="flex-1 flex items-center gap-2">
                            <Input
                              value={editingItemText[key]?.[index] || item}
                              onChange={(e) => setEditingItemText(prev => ({
                                ...prev,
                                [key]: {
                                  ...(prev[key] || {}),
                                  [index]: e.target.value
                                }
                              }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveItemEdit(key, index);
                                } else if (e.key === 'Escape') {
                                  cancelItemEdit(key, index);
                                }
                              }}
                              className="flex-1 text-sm bg-transparent border-white/30 focus:border-white/50 text-white"
                              style={{ backgroundColor: 'rgba(26, 15, 61, 0.5)' }}
                              autoFocus
                            />
                            <button
                              onClick={() => saveItemEdit(key, index)}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                              title="Save"
                            >
                              <Check className="h-4 w-4 text-green-400" />
                            </button>
                            <button
                              onClick={() => cancelItemEdit(key, index)}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                              title="Cancel"
                            >
                              <X className="h-4 w-4 text-red-400" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1">{item}</span>
                            {isEditing && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => startEditingItem(key, index)}
                                  className="p-1 hover:bg-white/10 rounded transition-colors"
                                  title="Edit item"
                                >
                                  <Pencil className="h-4 w-4 text-white/70 hover:text-white" />
                                </button>
                                <button
                                  onClick={() => deleteItem(key, index)}
                                  className="p-1 hover:bg-white/10 rounded transition-colors"
                                  title="Delete item"
                                >
                                  <X className="h-4 w-4 text-red-400/70 hover:text-red-400" />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </li>
                    ))}
                    {isEditing && isAddingItem && (
                      <li className="flex items-center gap-2">
                        <Input
                          value={newItemText[key] || ''}
                          onChange={(e) => setNewItemText(prev => ({
                            ...prev,
                            [key]: e.target.value
                          }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveNewItem(key);
                            } else if (e.key === 'Escape') {
                              cancelAddingItem(key);
                            }
                          }}
                          placeholder="Enter new item..."
                          className="flex-1 text-sm bg-transparent border-white/30 focus:border-white/50 text-white"
                          style={{ backgroundColor: 'rgba(26, 15, 61, 0.5)' }}
                          autoFocus
                        />
                        <button
                          onClick={() => saveNewItem(key)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          title="Save"
                        >
                          <Check className="h-4 w-4 text-green-400" />
                        </button>
                        <button
                          onClick={() => cancelAddingItem(key)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          title="Cancel"
                        >
                          <X className="h-4 w-4 text-red-400" />
                        </button>
                      </li>
                    )}
                    {isEditing && !isAddingItem && (
                      <li>
                        <button
                          onClick={() => startAddingItem(key)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          Add new item
                        </button>
                      </li>
                    )}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

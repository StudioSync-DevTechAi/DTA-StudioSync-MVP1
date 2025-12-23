
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

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

  // Separate addons from other services
  const serviceEntries = Object.entries(services).filter(([key]) => key !== 'addons');
  const addonsService = services.addons;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-light">SERVICES</h2>
        {!isReadOnly && (
          <p className="text-sm text-muted-foreground mt-2">
            (Optional) Select service packages to include in your estimate. This page will always be displayed in the final estimate.
          </p>
        )}
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Render regular service packages */}
        {serviceEntries.map(([key, service]) => (
          <Card key={key} className="p-6 space-y-4 relative">
            {!isReadOnly && (
              <div className="absolute right-4 top-4">
                <Checkbox 
                  checked={selectedServices.includes(key)}
                  onCheckedChange={() => handleToggleService(key)}
                  id={`service-${key}`}
                />
              </div>
            )}
            <h3 className="text-xl font-medium">{service.title}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {service.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        ))}

        {/* Render addons card with individual checkboxes */}
        {addonsService && (
          <Card className="p-6 space-y-4 relative">
            <h3 className="text-xl font-medium">{addonsService.title}</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {addonsService.items.map((item, index) => (
                <li key={item} className="flex items-start justify-between gap-3">
                  <span className="flex-1">{item}</span>
                  {!isReadOnly && (
                    <div className="flex-shrink-0 mt-0.5">
                      <Checkbox 
                        checked={isAddonSelected(item)}
                        onCheckedChange={() => handleToggleAddon(item)}
                        id={`addon-${index}`}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>TailorMade - Customised as per clients requirement</p>
      </div>
    </div>
  );
}

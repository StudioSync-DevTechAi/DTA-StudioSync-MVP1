
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Object.entries(services).map(([key, service]) => (
          <Card key={key} className="p-4 sm:p-6 space-y-4 relative w-full max-w-sm mx-auto sm:mx-0">
            {!isReadOnly && (
              <div className="absolute right-4 top-4">
                <Checkbox 
                  checked={selectedServices.includes(key)}
                  onCheckedChange={() => handleToggleService(key)}
                  id={`service-${key}`}
                />
              </div>
            )}
            <h3 className="text-lg sm:text-xl font-medium pr-8">{service.title}</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {service.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>TailorMade - Customised as per clients requirement</p>
      </div>
    </div>
  );
}

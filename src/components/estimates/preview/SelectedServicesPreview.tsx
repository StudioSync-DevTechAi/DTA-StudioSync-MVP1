import { Card } from "@/components/ui/card";
import { services as serviceOptions } from "../pages/ServicesPage";

interface SelectedServicesPreviewProps {
  selectedServices: string[];
  description?: string;
}

const defaultDescription =
  "(Optional) Select service packages to include in your estimate. This page will always be displayed in the final estimate.";

export function SelectedServicesPreview({
  selectedServices,
  description = defaultDescription,
}: SelectedServicesPreviewProps) {
  const packageKeys = selectedServices.filter((key) => !key.startsWith("addon:"));
  const hasAddons = selectedServices.some((key) => key.startsWith("addon:"));
  const addonItems = selectedServices
    .filter((key) => key.startsWith("addon:"))
    .map((key) => key.replace("addon:", ""));

  const hasAny = packageKeys.length > 0 || hasAddons;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-light text-white text-center">SERVICES</h2>
        <p className="text-sm text-gray-300 mt-2">{description}</p>
      </div>

      {!hasAny ? (
        <p className="text-center text-gray-400 text-sm">No services selected for this estimate.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packageKeys.map((serviceKey) => {
            const service = serviceOptions[serviceKey];
            if (!service) return null;
            return (
              <Card
                key={serviceKey}
                className="p-6 rounded-lg border"
                style={{ backgroundColor: "#2d1b4e", borderColor: "#3d2a5f" }}
              >
                <h3 className="text-xl font-medium text-white mb-3">{service.title}</h3>
                <ul className="list-disc ml-5 space-y-1 text-sm text-gray-300">
                  {service.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </Card>
            );
          })}

          {hasAddons && (
            <Card
              className="p-6 rounded-lg border md:col-span-2"
              style={{ backgroundColor: "#2d1b4e", borderColor: "#3d2a5f" }}
            >
              <h3 className="text-xl font-medium text-white mb-3">
                {serviceOptions.addons?.title || "Optional Addons"}
              </h3>
              <ul className="list-disc ml-5 space-y-1 text-sm text-gray-300">
                {addonItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

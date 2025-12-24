
import { ReactNode } from "react";
import { services as serviceOptions } from "../pages/ServicesPage";
import { PortfolioLink } from "../form/types";
import { estimateTemplates } from "../pages/TemplateSelectionPage";
import { Youtube, Video, Globe, Instagram, Link as LinkIcon } from "lucide-react";

interface EstimateDetailsProps {
  estimate: {
    id: string;
    clientName: string;
    date: string;
    amount: string;
    status: string;
    selectedServices?: string[];
    selectedTemplate?: string;
    portfolioLinks?: PortfolioLink[];
    services?: Array<{
      event: string;
      date: string;
      photographers: string;
      cinematographers: string;
    }>;
    deliverables?: string[];
    packages?: Array<{
      name?: string;
      amount: string;
      services: Array<{
        event: string;
        date: string;
        photographers: string;
        cinematographers: string;
      }>;
      deliverables: string[];
    }>;
    terms?: string[];
  };
}

export function EstimateDetails({ estimate }: EstimateDetailsProps) {
  const statusClasses = {
    approved: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
    negotiating: "bg-yellow-100 text-yellow-800",
    pending: "bg-gray-100 text-gray-800"
  };

  const statusClass = statusClasses[estimate.status] || statusClasses.pending;

  // Check if we have packages data (multiple estimate options)
  const hasPackages = estimate.packages && estimate.packages.length > 0;
  
  // If we don't have packages, use the legacy format (services and deliverables directly on estimate)
  const legacyPackage = {
    name: "Standard Package", // Add a default name for legacy packages
    amount: estimate.amount,
    services: estimate.services || [],
    deliverables: estimate.deliverables || []
  };
  
  // Use packages if available, otherwise create a single package from the estimate's direct properties
  const packagesToRender = hasPackages ? estimate.packages : [legacyPackage];
  
  // Default terms if none provided
  const defaultTerms = [
    "This estimate is valid for 30 days from the date of issue.",
    "A 50% advance payment is required to confirm the booking.",
    "The balance payment is due before the event date."
  ];
  
  // Use provided terms or default terms
  const termsToDisplay = estimate.terms && estimate.terms.length > 0 ? estimate.terms : defaultTerms;

  // Get the selected services
  const selectedServices = estimate.selectedServices || [];

  // Get the selected template
  const templateId = estimate.selectedTemplate || "modern";
  const selectedTemplate = estimateTemplates.find(t => t.id === templateId) || estimateTemplates[0];

  // Portfolio links
  const portfolioLinks = estimate.portfolioLinks || [];

  // Platform icons for portfolio links
  const platformIcons = {
    youtube: <Youtube className="h-5 w-5 text-red-500" />,
    vimeo: <Video className="h-5 w-5 text-blue-500" />,
    website: <Globe className="h-5 w-5 text-green-500" />,
    instagram: <Instagram className="h-5 w-5 text-pink-500" />,
    other: <LinkIcon className="h-5 w-5 text-gray-500" />,
  };

  // Template-specific styles
  const getTemplateStyles = () => {
    switch (templateId) {
      case "bold":
        return {
          headerClass: "bg-black text-white py-8",
          sectionClass: "border-l-4 border-black pl-4 mb-6",
          cardClass: "border-none shadow-lg",
          headingClass: "font-bold uppercase tracking-widest",
        };
      case "classic":
        return {
          headerClass: "bg-gray-100 text-gray-800 py-6 border-b-2 border-gray-300",
          sectionClass: "border-b border-gray-200 pb-6 mb-6",
          cardClass: "border rounded-none",
          headingClass: "font-serif text-xl",
        };
      case "modern":
      default:
        return {
          headerClass: "bg-white text-gray-800 py-4",
          sectionClass: "mb-6",
          cardClass: "border rounded-lg",
          headingClass: "font-medium",
        };
    }
  };

  const styles = getTemplateStyles();

  // Function to extract amount from addon string
  // Examples: "LED Screen 25,000/-" -> 25000, "Evite (E-invitations) - starts from 2,000/-" -> 2000
  const extractAmountFromAddon = (addonString: string): number => {
    // Remove "addon:" prefix if present
    const cleaned = addonString.replace(/^addon:/, '');
    
    // Try to find patterns like "25,000/-", "2,000/-", "15,000/-", etc.
    // Look for numbers with optional commas followed by "/-" or just numbers
    const patterns = [
      /(\d{1,3}(?:,\d{3})*)\s*\/-/,  // Pattern: "25,000/-" or "2,000/-"
      /starts from\s*(\d{1,3}(?:,\d{3})*)/,  // Pattern: "starts from 2,000"
      /(\d{1,3}(?:,\d{3})*)\s*Per Day/,  // Pattern: "30,000 Per Day"
      /(\d{1,3}(?:,\d{3})*)/,  // Fallback: any number with commas
    ];
    
    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match && match[1]) {
        // Remove commas and parse as float
        return parseFloat(match[1].replace(/,/g, '')) || 0;
      }
    }
    
    return 0;
  };

  // Calculate total addon amount from selected addons
  const calculateAddonTotal = (): number => {
    const selectedAddons = selectedServices.filter(key => key.startsWith('addon:'));
    return selectedAddons.reduce((total, addonKey) => {
      const amount = extractAmountFromAddon(addonKey);
      return total + amount;
    }, 0);
  };

  const addonTotal = calculateAddonTotal();

  // Function to calculate package total including addons
  const calculatePackageTotal = (packageAmount: string): string => {
    // Parse package amount (remove currency symbols and commas)
    const packageNum = parseFloat(packageAmount.replace(/[₹,]/g, '')) || 0;
    const total = packageNum + addonTotal;
    return `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${templateId === "bold" ? "border-none" : ""}`}>
      <div className={`text-center space-y-3 ${styles.headerClass}`}>
        <h1 className={`text-2xl font-semibold ${styles.headingClass}`}>ESTIMATE</h1>
        <p className="text-muted-foreground">StudioSyncWork Photography Services</p>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${statusClass}`}>
          Status: {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
        </div>
      </div>

      <div className={`p-6 space-y-6 ${templateId === "bold" ? "bg-gray-50" : ""}`}>
        <div className={`flex justify-between items-start border-b pb-4 ${styles.sectionClass}`}>
          <div>
            <h2 className={styles.headingClass}>Client</h2>
            <p>{estimate.clientName}</p>
            <p className="text-sm text-muted-foreground">
              Date: {new Date(estimate.date).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <h2 className={styles.headingClass}>Estimate #{estimate.id}</h2>
            <p className="text-sm text-muted-foreground capitalize">
              Valid until: {new Date(new Date(estimate.date).getTime() + 30*24*60*60*1000).toLocaleDateString()}
            </p>
          </div>
        </div>

        {portfolioLinks.length > 0 && (
          <div className={styles.sectionClass}>
            <h3 className={`${styles.headingClass} mb-4`}>Our Portfolio</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {portfolioLinks.map((link) => (
                <div key={link.id} className={`${styles.cardClass} p-4 rounded-md`}>
                  <div className="flex items-center gap-2 mb-2">
                    {platformIcons[link.platform]}
                    <h4 className="font-medium">{link.title}</h4>
                  </div>
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm block mb-2"
                  >
                    {link.url}
                  </a>
                  {link.description && (
                    <p className="text-sm text-muted-foreground">{link.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedServices.length > 0 && (
          <div className={styles.sectionClass}>
            <h3 className={`${styles.headingClass} mb-4`}>Selected Services</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Regular service packages */}
              {selectedServices
                .filter(serviceKey => !serviceKey.startsWith('addon:'))
                .map(serviceKey => {
                  const service = serviceOptions[serviceKey];
                  if (!service) return null;
                  return (
                    <div key={serviceKey} className={`${styles.cardClass} p-4 rounded-md`}>
                      <h4 className="font-medium mb-2">{service.title}</h4>
                      <ul className="list-disc ml-5 space-y-1 text-sm text-muted-foreground">
                        {service.items.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              
              {/* Individual selected addons */}
              {selectedServices.some(key => key.startsWith('addon:')) && (
                <div className={`${styles.cardClass} p-4 rounded-md`}>
                  <h4 className="font-medium mb-2">{serviceOptions.addons?.title || "Optional Addons"}</h4>
                  <ul className="list-disc ml-5 space-y-1 text-sm text-muted-foreground">
                    {selectedServices
                      .filter(key => key.startsWith('addon:'))
                      .map(key => {
                        const addonItem = key.replace('addon:', '');
                        return <li key={key}>{addonItem}</li>;
                      })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {packagesToRender.map((pkg, packageIndex) => (
          <div key={packageIndex} className={`${styles.cardClass} p-4 rounded-md mb-6`}>
            <h2 className={`text-xl ${styles.headingClass} mb-4`}>
              {pkg.name || `Package Option ${packageIndex + 1}`}
            </h2>
            
            {pkg.services && pkg.services.length > 0 && (
              <div className="mb-4">
                <h3 className={`${styles.headingClass} mb-2`}>Services</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Event</th>
                      <th className="text-left py-2">Date</th>
                      <th className="text-center py-2">Photographers</th>
                      <th className="text-center py-2">Cinematographers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pkg.services.map((service, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{service.event}</td>
                        <td className="py-2">{new Date(service.date).toLocaleDateString()}</td>
                        <td className="py-2 text-center">{service.photographers}</td>
                        <td className="py-2 text-center">{service.cinematographers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pkg.deliverables && pkg.deliverables.length > 0 && (
              <div className="mb-4">
                <h3 className={`${styles.headingClass} mb-2`}>Deliverables</h3>
                <ul className="list-disc ml-5 space-y-1">
                  {pkg.deliverables.map((deliverable, index) => (
                    <li key={index}>{deliverable}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className={`text-right pt-2 border-t ${templateId === "bold" ? "border-black" : ""}`}>
              <span className="font-medium">Package Total: </span>
              <span className={`text-xl font-semibold ${templateId === "bold" ? "text-black" : ""}`}>
                {calculatePackageTotal(pkg.amount)}
              </span>
              {addonTotal > 0 && (
                <div className="text-sm text-muted-foreground mt-1">
                  (Base: {pkg.amount} + Addons: ₹{addonTotal.toLocaleString('en-IN')})
                </div>
              )}
            </div>
          </div>
        ))}

        <div className={`pt-4 text-sm text-muted-foreground ${styles.sectionClass}`}>
          <p className={styles.headingClass}>Terms & Conditions</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            {termsToDisplay.map((term, index) => (
              <li key={index}>{term}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

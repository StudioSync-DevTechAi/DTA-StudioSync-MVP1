
import { WelcomePage } from "../pages/WelcomePage";
import { PortfolioPage } from "../pages/PortfolioPage";
import { TemplateSelectionPage } from "../pages/TemplateSelectionPage";
import { EstimateDetails } from "./EstimateDetails";
import { SelectedServicesPreview } from "./SelectedServicesPreview";

interface PreviewContentProps {
  currentPageIndex: number;
  estimate: any;
}

export function PreviewContent({ currentPageIndex, estimate }: PreviewContentProps) {
  // Ensure selectedServices is always an array
  const selectedServices = estimate?.selectedServices || [];
  
  // Ensure portfolioLinks is always an array
  const portfolioLinks = estimate?.portfolioLinks || [];
  
  // Ensure selectedTemplate is always a string
  const selectedTemplate = estimate?.selectedTemplate || "modern";

  // Support both clientPhNo and clientPhone (used when loading from DB/list)
  const clientPhNo = estimate?.clientPhNo || (estimate as any)?.clientPhone || "";
  const countryCode = estimate?.countryCode || "+91";

  const pages = [
    <WelcomePage 
      key="welcome" 
      clientName={estimate.clientName}
      clientEmail={estimate.clientEmail || ""}
      clientPhNo={clientPhNo}
      countryCode={countryCode}
      onClientNameChange={() => {}} // No-op function since this is read-only
      onClientEmailChange={() => {}} // No-op function since this is read-only
      onClientPhNoChange={() => {}} // No-op function since this is read-only
      onCountryCodeChange={() => {}} // No-op function since this is read-only
      isReadOnly={true}
    />,
    <SelectedServicesPreview
      key="services"
      selectedServices={selectedServices}
      description={
        typeof localStorage !== "undefined"
          ? localStorage.getItem("servicesPageDescription") ||
            "(Optional) Select service packages to include in your estimate. This page will always be displayed in the final estimate."
          : undefined
      }
    />,
    <EstimateDetails 
      key="details"
      estimate={estimate} 
    />,
    <PortfolioPage
      key="portfolio"
      portfolioLinks={portfolioLinks}
      onPortfolioLinksChange={() => {}} // No-op function since this is read-only
      isReadOnly={true}
    />,
    <TemplateSelectionPage
      key="template"
      selectedTemplate={selectedTemplate}
      onTemplateChange={() => {}} // No-op function since this is read-only
      isReadOnly={true}
    />
  ];

  return pages[currentPageIndex] || null;
}

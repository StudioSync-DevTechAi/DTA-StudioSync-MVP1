
import { WelcomePage } from "../pages/WelcomePage";
import { ServicesPage } from "../pages/ServicesPage";
import { PortfolioPage } from "../pages/PortfolioPage";
import { TemplateSelectionPage } from "../pages/TemplateSelectionPage";
import { EstimateDetails } from "./EstimateDetails";

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

  const pages = [
    <WelcomePage 
      key="welcome" 
      clientName={estimate.clientName}
      clientEmail={estimate.clientEmail || ""}
      clientPhNo={estimate.clientPhNo || ""}
      onClientNameChange={() => {}} // No-op function since this is read-only
      onClientEmailChange={() => {}} // No-op function since this is read-only
      onClientPhNoChange={() => {}} // No-op function since this is read-only
      isReadOnly={true}
    />,
    <ServicesPage 
      key="services"
      selectedServices={selectedServices}
      onServicesChange={() => {}} // No-op function since this is read-only
      isReadOnly={true}
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

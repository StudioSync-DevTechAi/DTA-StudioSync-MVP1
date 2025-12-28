
export interface EstimateFormData {
  clientName: string;
  clientEmail: string;
  clientPhNo?: string;
  countryCode?: string;
  selectedServices: string[];
  estimateDetails: {
    events: any[];
    estimates: any[];
    deliverables: string[];
  };
  terms: string[];
  portfolioLinks: PortfolioLink[];
  selectedTemplate: string;
}

export interface PortfolioLink {
  id: string;
  title: string;
  url: string;
  platform: 'youtube' | 'vimeo' | 'website' | 'instagram' | 'other';
  description?: string;
}

export interface PreviewEstimate {
  id?: string;
  status?: string;
  clientName: string;
  clientEmail?: string;
  clientPhNo?: string;
  countryCode?: string;
  selectedPackageIndex?: number;
  portfolioLinks?: PortfolioLink[];
  selectedTemplate?: string;
  selectedServices?: string[];
  terms?: string[];
  date?: string;
  amount?: string;
  services?: any[];
  deliverables?: string[];
  packages?: any[];
  [key: string]: any;
}

export type EstimateTemplate = {
  id: string;
  name: string;
  description: string;
  previewImage: string;
}

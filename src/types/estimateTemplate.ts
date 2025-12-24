// Estimate Template Types

export interface EntryFormFields {
  photography_owner_studioName: boolean;
  studioName_subText: string;
  clientName: boolean;
  clientEmail: boolean;
  clientPhNo: boolean;
}

export interface ServiceEventType {
  EstimateType_Heading: string;
  events_list: string[];
}

export interface ServicesFields {
  Services_SubText: string;
  eventTypes: ServiceEventType[];
  optionalAddOns: {
    heading: string;
    checkListableItems: string[];
  };
}

export interface EstimatesFields {
  Estimates_SubText: string;
  events: string[];
}

export interface EstimateTemplate {
  id: string;
  name: string;
  description?: string;
  EntryForm: EntryFormFields;
  Services: ServicesFields;
  Estimates: EstimatesFields;
  createdAt?: string;
  updatedAt?: string;
}

export interface PhotographyOwnerTemplateData {
  photography_owner_estimateForm_template: {
    templates: EstimateTemplate[];
    defaultTemplateId?: string;
  };
}


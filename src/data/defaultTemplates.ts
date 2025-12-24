import { EstimateTemplate } from "@/types/estimateTemplate";

// Default Template 1
export const defaultTemplate1: EstimateTemplate = {
  id: "template_1",
  name: "Template 1",
  description: "Standard estimate template with entry form, services, and estimates",
  EntryForm: {
    photography_owner_studioName: true,
    studioName_subText: "Your trusted photography studio",
    clientName: true,
    clientEmail: true,
    clientPhNo: true,
  },
  Services: {
    Services_SubText: "Select the services you need for your event",
    eventTypes: [
      {
        EstimateType_Heading: "Wedding Events",
        events_list: ["Big Fat Wedding", "Intimate Wedding", "Reception"],
      },
      {
        EstimateType_Heading: "Pre-Wedding",
        events_list: ["Engagement", "Haldi", "Mehendi", "Sangam"],
      },
    ],
    optionalAddOns: {
      heading: "Optional Add-Ons",
      checkListableItems: [
        "Drone Photography",
        "Video Coverage",
        "Photo Album",
        "Raw Images",
        "Same Day Edit",
      ],
    },
  },
  Estimates: {
    Estimates_SubText: "Review your estimate details",
    events: ["Event 1", "Event 2"],
  },
};

// Default Template 2
export const defaultTemplate2: EstimateTemplate = {
  id: "template_2",
  name: "Template 2",
  description: "Alternative template with different structure",
  EntryForm: {
    photography_owner_studioName: true,
    studioName_subText: "Professional photography services",
    clientName: true,
    clientEmail: true,
    clientPhNo: true,
  },
  Services: {
    Services_SubText: "Choose from our service packages",
    eventTypes: [
      {
        EstimateType_Heading: "Main Events",
        events_list: ["Wedding Ceremony", "Reception Party"],
      },
    ],
    optionalAddOns: {
      heading: "Additional Services",
      checkListableItems: [
        "Extended Coverage",
        "Second Photographer",
        "Wedding Album",
      ],
    },
  },
  Estimates: {
    Estimates_SubText: "Your customized estimate",
    events: ["Main Event"],
  },
};

// Default Template 3
export const defaultTemplate3: EstimateTemplate = {
  id: "template_3",
  name: "Template 3",
  description: "Comprehensive template with all options",
  EntryForm: {
    photography_owner_studioName: true,
    studioName_subText: "Capturing your special moments",
    clientName: true,
    clientEmail: true,
    clientPhNo: true,
  },
  Services: {
    Services_SubText: "Select services for your special day",
    eventTypes: [
      {
        EstimateType_Heading: "Full Wedding Package",
        events_list: ["Pre-Wedding", "Wedding Day", "Post-Wedding"],
      },
      {
        EstimateType_Heading: "Individual Events",
        events_list: ["Engagement", "Haldi", "Mehendi", "Sangam", "Reception"],
      },
    ],
    optionalAddOns: {
      heading: "Premium Add-Ons",
      checkListableItems: [
        "Drone Photography",
        "4K Video Coverage",
        "Premium Photo Album",
        "All Raw Images",
        "Same Day Highlights",
        "Social Media Package",
      ],
    },
  },
  Estimates: {
    Estimates_SubText: "Complete estimate breakdown",
    events: ["Pre-Wedding", "Wedding Day", "Post-Wedding"],
  },
};

export const defaultTemplates: EstimateTemplate[] = [
  defaultTemplate1,
  defaultTemplate2,
  defaultTemplate3,
];


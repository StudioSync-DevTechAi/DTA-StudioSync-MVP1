
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EstimateDetails, Service } from "../types";
import { EstimateCard } from "../components/EstimateCard";
import { useToast } from "@/components/ui/use-toast";

interface EstimateDetailsPageProps {
  estimateDetails: EstimateDetails;
  onDetailsChange: (details: EstimateDetails) => void;
  projectName?: string;
  onProjectNameChange?: (name: string) => void;
}

export function EstimateDetailsPage({ estimateDetails, onDetailsChange, projectName = "", onProjectNameChange }: EstimateDetailsPageProps) {
  const { toast } = useToast();
  
  // Initialize with one default estimate with one default service if none exist
  useEffect(() => {
    if (estimateDetails.estimates.length === 0) {
      onDetailsChange({
        ...estimateDetails,
        estimates: [
          { 
            name: "",
            services: [
              {
                event: "",
                date: "",
                photographers: "",
                cinematographers: ""
              }
            ], 
            total: "",
            deliverables: [
              "Curated online Gallery with 400+ images",
              "1200+ Processed Images in hard drive (provided by you)",
              "20-90 min Documentary film of all events Individually, delivered online for you to download",
              "Wedding film 8-12mins (with live audio & Audio bytes) - delivered online with password protection",
              "Live streaming for Wedding event only - Complimentary",
              "Customised 35 Sheet Album - 2 Copies"
            ]
          }
        ]
      });
    }
  }, []); // Only run once on mount
  
  const addEstimate = () => {
    // Check if we've reached the maximum of 3 estimate options
    if (estimateDetails.estimates.length >= 3) {
      toast({
        title: "Maximum packages reached",
        description: "You can only create up to 3 package options",
        variant: "destructive",
      });
      return;
    }
    
    onDetailsChange({
      ...estimateDetails,
      estimates: [
        ...estimateDetails.estimates,
        { 
          name: "",
          services: [], 
          total: "",
          deliverables: [
            "Curated online Gallery with 400+ images",
            "1200+ Processed Images in hard drive (provided by you)",
            "20-90 min Documentary film of all events Individually, delivered online for you to download",
            "Wedding film 8-12mins (with live audio & Audio bytes) - delivered online with password protection",
            "Live streaming for Wedding event only - Complimentary",
            "Customised 35 Sheet Album - 2 Copies"
          ]
        }
      ]
    });
  };

  const addService = (estimateIndex: number) => {
    const newEstimates = [...estimateDetails.estimates];
    newEstimates[estimateIndex].services.push({
      event: "",
      date: "",
      photographers: "",
      cinematographers: ""
    });
    onDetailsChange({
      ...estimateDetails,
      estimates: newEstimates
    });
  };

  const updateService = (
    estimateIndex: number,
    serviceIndex: number,
    field: keyof Service,
    value: string
  ) => {
    const newEstimates = [...estimateDetails.estimates];
    newEstimates[estimateIndex].services[serviceIndex][field] = value;
    onDetailsChange({
      ...estimateDetails,
      estimates: newEstimates
    });
  };

  const removeService = (estimateIndex: number, serviceIndex: number) => {
    const newEstimates = [...estimateDetails.estimates];
    newEstimates[estimateIndex].services.splice(serviceIndex, 1);
    onDetailsChange({
      ...estimateDetails,
      estimates: newEstimates
    });
  };

  const addDeliverable = (estimateIndex: number) => {
    const newEstimates = [...estimateDetails.estimates];
    newEstimates[estimateIndex].deliverables.push("");
    onDetailsChange({
      ...estimateDetails,
      estimates: newEstimates
    });
  };

  const updateDeliverable = (estimateIndex: number, deliverableIndex: number, value: string) => {
    const newEstimates = [...estimateDetails.estimates];
    newEstimates[estimateIndex].deliverables[deliverableIndex] = value;
    onDetailsChange({
      ...estimateDetails,
      estimates: newEstimates
    });
  };

  const removeDeliverable = (estimateIndex: number, deliverableIndex: number) => {
    const newEstimates = [...estimateDetails.estimates];
    newEstimates[estimateIndex].deliverables.splice(deliverableIndex, 1);
    onDetailsChange({
      ...estimateDetails,
      estimates: newEstimates
    });
  };

  const updateEstimateTotal = (estimateIndex: number, total: string) => {
    const newEstimates = [...estimateDetails.estimates];
    
    // We need to check if this total makes the package identical to another
    const isIdentical = checkIfIdenticalPackage(estimateIndex, {
      ...newEstimates[estimateIndex],
      total
    });
    
    if (isIdentical) {
      toast({
        title: "Identical package detected",
        description: "Please ensure each package is unique by varying deliverables or pricing",
        variant: "destructive",
      });
      return;
    }
    
    newEstimates[estimateIndex].total = total;
    onDetailsChange({
      ...estimateDetails,
      estimates: newEstimates
    });
  };
  
  const updateEstimateName = (estimateIndex: number, name: string) => {
    const newEstimates = [...estimateDetails.estimates];
    newEstimates[estimateIndex].name = name;
    onDetailsChange({
      ...estimateDetails,
      estimates: newEstimates
    });
  };
  
  const checkIfIdenticalPackage = (currentIndex: number, updatedPackage: any) => {
    // We'll compare the deliverables list and total amount to check for identical packages
    // Event services are allowed to be the same across packages
    
    for (let i = 0; i < estimateDetails.estimates.length; i++) {
      // Skip comparing with itself
      if (i === currentIndex) continue;
      
      const otherPackage = estimateDetails.estimates[i];
      
      // Check if total is the same
      if (updatedPackage.total === otherPackage.total) {
        
        // Check if deliverables are the same
        // Convert to strings for comparison
        const updatedDeliverables = JSON.stringify(updatedPackage.deliverables.sort());
        const otherDeliverables = JSON.stringify(otherPackage.deliverables.sort());
        
        if (updatedDeliverables === otherDeliverables) {
          return true; // Identical package found
        }
      }
    }
    
    return false; // No identical package found
  };

  const deletePackage = (estimateIndex: number) => {
    // Don't allow deleting if it's the only package
    if (estimateDetails.estimates.length <= 1) {
      toast({
        title: "Cannot Delete Package",
        description: "You must have at least one package option",
        variant: "destructive",
      });
      return;
    }

    const newEstimates = [...estimateDetails.estimates];
    newEstimates.splice(estimateIndex, 1);
    
    onDetailsChange({
      ...estimateDetails,
      estimates: newEstimates
    });
    
    toast({
      title: "Package Deleted",
      description: `Package option ${estimateIndex + 1} has been deleted`,
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-3xl font-light text-white text-center">ESTIMATES</h2>
        
        <Card className="p-6" style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
          <div className="space-y-6">
            {/* Project Name Input Field */}
            <div className="space-y-2">
              <label htmlFor="projectName" className="text-lg font-medium text-white">
                Project Name
              </label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => onProjectNameChange?.(e.target.value)}
                placeholder="Enter project name"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white placeholder:text-gray-400"
                style={{ 
                  backgroundColor: '#2d1b4e', 
                  borderColor: '#5a4a7a', 
                  color: '#ffffff', 
                  borderWidth: '1.5px', 
                  borderStyle: 'solid' 
                }}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4 text-white">Events Coverage</h3>
              <div className="space-y-4">
                <p className="text-sm text-gray-300">
                  Candid Photography & Cinematography (All events)
                </p>
              </div>
            </div>

            {estimateDetails.estimates.map((estimate, estimateIndex) => (
              <EstimateCard
                key={estimateIndex}
                estimate={estimate}
                index={estimateIndex}
                onServiceAdd={() => addService(estimateIndex)}
                onServiceUpdate={(serviceIndex, field, value) => 
                  updateService(estimateIndex, serviceIndex, field, value)}
                onServiceRemove={(serviceIndex) => removeService(estimateIndex, serviceIndex)}
                onDeliverableAdd={() => addDeliverable(estimateIndex)}
                onDeliverableUpdate={(deliverableIndex, value) => 
                  updateDeliverable(estimateIndex, deliverableIndex, value)}
                onDeliverableRemove={(deliverableIndex) => 
                  removeDeliverable(estimateIndex, deliverableIndex)}
                onTotalUpdate={(total) => updateEstimateTotal(estimateIndex, total)}
                onNameUpdate={(name) => updateEstimateName(estimateIndex, name)}
                onPackageDelete={() => deletePackage(estimateIndex)}
              />
            ))}

            <div className="space-y-4 p-3 rounded-lg" style={{ backgroundColor: '#1a0f3d' }}>
              <Button
                type="button"
                variant="outline"
                onClick={addEstimate}
                className="w-full"
                disabled={estimateDetails.estimates.length >= 3}
                style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Estimate Option {estimateDetails.estimates.length >= 3 && "(Maximum 3)"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

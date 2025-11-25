import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { EstimatesHeader } from "@/components/estimates/list/EstimatesHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { TimePickerClock } from "@/components/ui/time-picker-clock";
import { CalendarIcon, ArrowRight, Plus, Trash2, Pencil, Eye, Download, Share2, ChevronDown, ChevronUp, Phone, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface Photographer {
  id: string;
  name: string;
  contactNumber: string;
}

interface Videographer {
  id: string;
  name: string;
  contactNumber: string;
}

interface EventPackage {
  id: string;
  eventType: string;
  photographersCount: string;
  videographersCount: string;
  startDate?: Date;
  startHour?: string;
  startMinute?: string;
  photographyCoordinatorId?: string;
  videographyCoordinatorId?: string;
  deliverablesNotes?: string;
  savedDeliverablesNotes?: string; // Saved version of notes
  isEditingDeliverablesNotes?: boolean; // Track if notes are being edited
  hasSavedDeliverablesNotes?: boolean; // Track if notes have been saved at least once
  prepChecklist?: ChecklistItem[];
}

// Mock data for photographers
const mockPhotographers: Photographer[] = [
  { id: "photo-1", name: "Rajesh Kumar", contactNumber: "+91 98765 43210" },
  { id: "photo-2", name: "Priya Sharma", contactNumber: "+91 98765 43211" },
  { id: "photo-3", name: "Amit Patel", contactNumber: "+91 98765 43212" },
  { id: "photo-4", name: "Sneha Reddy", contactNumber: "+91 98765 43213" },
  { id: "photo-5", name: "Vikram Singh", contactNumber: "+91 98765 43214" },
];

// Mock data for videographers
const mockVideographers: Videographer[] = [
  { id: "video-1", name: "Anil Mehta", contactNumber: "+91 98765 43220" },
  { id: "video-2", name: "Deepa Nair", contactNumber: "+91 98765 43221" },
  { id: "video-3", name: "Rohit Desai", contactNumber: "+91 98765 43222" },
  { id: "video-4", name: "Kavita Joshi", contactNumber: "+91 98765 43223" },
  { id: "video-5", name: "Manoj Iyer", contactNumber: "+91 98765 43224" },
];

export default function NewProjectPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    projectName: "",
    eventType: "",
    clientFullName: "",
    clientEmail: "",
    clientPhone: "+91 ",
    startDate: undefined as Date | undefined,
    startHour: "",
    startMinute: "",
    confirmationStatus: "tentative" as "confirmed" | "tentative",
  });
  const [eventPackages, setEventPackages] = useState<EventPackage[]>([
    { id: "1", eventType: "wedding", photographersCount: "5", videographersCount: "2", prepChecklist: [] as ChecklistItem[] },
    { id: "2", eventType: "engagement", photographersCount: "4", videographersCount: "1", prepChecklist: [] as ChecklistItem[] },
    { id: "3", eventType: "", photographersCount: "", videographersCount: "", prepChecklist: [] as ChecklistItem[] },
  ]);
  const [selectedFormat, setSelectedFormat] = useState("standard_wedding");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [photographyOwner, setPhotographyOwner] = useState<{
    photography_owner_phno: string;
    photography_owner_email: string;
    photography_owner_name: string;
  } | null>(null);
  const [loadingOwner, setLoadingOwner] = useState(false);

  // Fetch photography owner data immediately when New Project page loads
  useEffect(() => {
    const fetchPhotographyOwner = async () => {
      setLoadingOwner(true);
      try {
        const { data, error } = await supabase
          .from("photography_owner_table")
          .select("photography_owner_phno, photography_owner_email, photography_owner_name")
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error fetching photography owner:", error);
          console.error("Error details:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          // Don't show error to user, just log it
        } else if (data) {
          setPhotographyOwner(data);
          console.log("Photography owner data loaded:", data);
        } else {
          console.warn("No photography owner data found in database");
          console.warn("This might be due to RLS policies. Check if SELECT policy exists for photography_owner_table");
        }
      } catch (error) {
        console.error("Error in fetchPhotographyOwner:", error);
      } finally {
        setLoadingOwner(false);
      }
    };

    // Fetch immediately on page load
    fetchPhotographyOwner();
  }, []); // Empty dependency array ensures this runs only once on component mount

  const handleInputChange = (field: string, value: string | Date | undefined | "confirmed" | "tentative") => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isPage1Valid = () => {
    // Client phone should be "+91 " followed by exactly 10 digits
    const phoneValid = /^\+91 \d{10}$/.test(formData.clientPhone);
    return (
      formData.projectName.trim() !== "" &&
      formData.eventType !== "" &&
      phoneValid
    );
  };

  const handleClientPhoneChange = (value: string) => {
    // Ensure it starts with +91
    if (!value.startsWith("+91")) {
      value = "+91 " + value.replace(/[^0-9]/g, "");
    }
    
    // Remove all non-numeric characters except the +91 prefix and space
    const afterPrefix = value.substring(3).replace(/[^0-9 ]/g, "");
    const numericPart = afterPrefix.replace(/[^0-9]/g, "");
    
    // Limit to 10 digits after +91
    const limitedNumeric = numericPart.slice(0, 10);
    
    // Combine +91 with space and the numeric part
    const formattedPhone = "+91 " + limitedNumeric;
    
    handleInputChange("clientPhone", formattedPhone);
  };

  const handleNext = () => {
    if (currentPage === 1) {
      // Validate required fields before proceeding
      if (!isPage1Valid()) {
        return; // Don't proceed if validation fails
      }
      setCurrentPage(2);
    } else if (currentPage === 2) {
      setCurrentPage(3);
    } else if (currentPage === 3) {
      // Handle final submission or navigation
      handleSaveEvent();
    }
  };

  const handlePrevious = () => {
    if (currentPage === 2) {
      setCurrentPage(1);
    } else if (currentPage === 3) {
      setCurrentPage(2);
    }
  };

  const handleAddEventPackage = () => {
    const newPackage: EventPackage = {
      id: Date.now().toString(),
      eventType: "",
      photographersCount: "",
      videographersCount: "",
      prepChecklist: [],
    };
    setEventPackages([...eventPackages, newPackage]);
  };

  const handleRemoveEventPackage = (id: string) => {
    setEventPackages(eventPackages.filter((pkg) => pkg.id !== id));
  };

  const handleEventPackageChange = (id: string, field: keyof EventPackage, value: string | Date | ChecklistItem[] | undefined) => {
    setEventPackages(
      eventPackages.map((pkg) => (pkg.id === id ? { ...pkg, [field]: value } : pkg))
    );
  };

  const handleAddChecklistItem = (eventId: string) => {
    const pkg = eventPackages.find((p) => p.id === eventId);
    if (pkg) {
      const newChecklist = [
        ...(pkg.prepChecklist || []),
        { id: Date.now().toString(), text: "", checked: false }
      ];
      handleEventPackageChange(eventId, "prepChecklist", newChecklist);
    }
  };

  const handleChecklistItemChange = (eventId: string, itemId: string, field: "text" | "checked", value: string | boolean) => {
    const pkg = eventPackages.find((p) => p.id === eventId);
    if (pkg && pkg.prepChecklist) {
      const newChecklist = pkg.prepChecklist.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      );
      handleEventPackageChange(eventId, "prepChecklist", newChecklist);
    }
  };

  const handleRemoveChecklistItem = (eventId: string, itemId: string) => {
    const pkg = eventPackages.find((p) => p.id === eventId);
    if (pkg && pkg.prepChecklist) {
      const newChecklist = pkg.prepChecklist.filter((item) => item.id !== itemId);
      handleEventPackageChange(eventId, "prepChecklist", newChecklist);
    }
  };

  const toggleEventDetails = (eventId: string) => {
    const newExpandedId = expandedEventId === eventId ? null : eventId;
    setExpandedEventId(newExpandedId);
    // Initialize editing state when expanding
    if (newExpandedId) {
      handleEventDetailsExpanded(newExpandedId);
    }
  };

  const handleEditDeliverablesNotes = (eventId: string) => {
    const pkg = eventPackages.find((p) => p.id === eventId);
    if (pkg) {
      // Set editing mode and restore saved notes if they exist
      handleEventPackageChange(eventId, "isEditingDeliverablesNotes", true);
      if (pkg.savedDeliverablesNotes !== undefined) {
        handleEventPackageChange(eventId, "deliverablesNotes", pkg.savedDeliverablesNotes);
      }
    }
  };

  // Initialize editing state when event details are expanded for the first time
  const handleEventDetailsExpanded = (eventId: string) => {
    const pkg = eventPackages.find((p) => p.id === eventId);
    if (pkg && pkg.isEditingDeliverablesNotes === undefined) {
      // First time expanding - set to editing mode if not saved yet
      if (!pkg.hasSavedDeliverablesNotes) {
        handleEventPackageChange(eventId, "isEditingDeliverablesNotes", true);
      } else {
        handleEventPackageChange(eventId, "isEditingDeliverablesNotes", false);
      }
    }
  };

  const handleSaveDeliverablesNotes = (eventId: string) => {
    const pkg = eventPackages.find((p) => p.id === eventId);
    if (pkg) {
      // Save current notes and exit edit mode
      handleEventPackageChange(eventId, "savedDeliverablesNotes", pkg.deliverablesNotes || "");
      handleEventPackageChange(eventId, "isEditingDeliverablesNotes", false);
      handleEventPackageChange(eventId, "hasSavedDeliverablesNotes", true);
    }
  };

  const isDeliverablesNotesChanged = (pkg: EventPackage) => {
    return pkg.deliverablesNotes !== (pkg.savedDeliverablesNotes || "");
  };

  const calculatePrice = () => {
    // Base pricing logic - can be customized
    const basePricePerPhotographer = 10000;
    const basePricePerVideographer = 15000;
    const eventTypeMultiplier: { [key: string]: number } = {
      wedding: 1.2,
      engagement: 1.0,
      corporate: 1.1,
      portrait: 0.8,
      event: 1.0,
      commercial: 1.3,
      other: 1.0,
    };

    let actualPrice = 0;
    eventPackages.forEach((pkg) => {
      if (pkg.eventType && pkg.photographersCount && pkg.videographersCount) {
        const photographers = parseInt(pkg.photographersCount, 10) || 0;
        const videographers = parseInt(pkg.videographersCount, 10) || 0;
        const multiplier = eventTypeMultiplier[pkg.eventType] || 1.0;
        const packagePrice =
          (photographers * basePricePerPhotographer + videographers * basePricePerVideographer) *
          multiplier;
        actualPrice += packagePrice;
      }
    });

    const subtotal = actualPrice;
    const gst = subtotal * 0.18; // 18% GST
    const total = subtotal + gst;

    return { 
      actualPrice: isNaN(actualPrice) ? 0 : actualPrice, 
      subtotal: isNaN(subtotal) ? 0 : subtotal, 
      gst: isNaN(gst) ? 0 : gst, 
      total: isNaN(total) ? 0 : total 
    };
  };

  const isFormValid = () => {
    return (
      formData.projectName &&
      formData.eventType &&
      formData.clientFullName &&
      formData.clientEmail &&
      formData.clientPhone &&
      formData.startDate &&
      formData.startHour &&
      formData.startMinute
    );
  };

  const handleNewEstimate = () => {
    navigate("/estimates");
  };

  const handleCancel = () => {
    navigate("/estimates");
  };

  const handleSaveEvent = () => {
    // TODO: Implement save logic
    // Save formData and eventPackages to database
    navigate("/estimates");
  };

  // Calculate price only when on page 2
  const priceData = currentPage === 2 ? calculatePrice() : { actualPrice: 0, subtotal: 0, gst: 0, total: 0 };
  const { actualPrice, subtotal, gst, total } = priceData;

  return (
    <Layout>
      <div className="space-y-6 p-6">
        <EstimatesHeader 
          onNewEstimate={handleNewEstimate}
          canCreate={true}
          showActions={false}
        />
        
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-6xl shadow-lg">
            <CardContent className="p-8">
              {currentPage === 1 ? (
                <>
                  {/* Project Owner Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg mb-6">
                    <div className="space-y-2">
                      <Label>Project Owner</Label>
                      <Input
                        value={loadingOwner ? "Loading..." : (photographyOwner?.photography_owner_name || "Not available")}
                        disabled
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Project Owner PhNo</Label>
                      <Input
                        value={loadingOwner ? "Loading..." : (photographyOwner?.photography_owner_phno || "Not available")}
                        disabled
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Project Owner Email Id</Label>
                      <Input
                        value={loadingOwner ? "Loading..." : (photographyOwner?.photography_owner_email || "Not available")}
                        disabled
                        className="bg-background"
                      />
                    </div>
                  </div>
                  <h2 className="text-2xl font-semibold mb-6">Add New Client Booking</h2>
                  <div className="space-y-6">

              {/* Project Name and Type of Event Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">
                    Project Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="projectName"
                    placeholder="Enter project name"
                    value={formData.projectName}
                    onChange={(e) => handleInputChange("projectName", e.target.value)}
                    required
                    className={formData.projectName.trim() === "" ? "border-red-300" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventType">
                    Type of Event <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(value) => handleInputChange("eventType", value)}
                    required
                  >
                    <SelectTrigger 
                      id="eventType"
                      className={formData.eventType === "" ? "border-red-300" : ""}
                    >
                      <SelectValue placeholder="Select Event Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wedding">Wedding</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Client's Full Name */}
              <div className="space-y-2 max-w-md">
                <Label htmlFor="clientFullName">Client's Full Name</Label>
                <Input
                  id="clientFullName"
                  placeholder="Enter client's full name"
                  value={formData.clientFullName}
                  onChange={(e) => handleInputChange("clientFullName", e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Client Email and Phone Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client Email Address</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.clientEmail}
                    onChange={(e) => handleInputChange("clientEmail", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">
                    Client Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="clientPhone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.clientPhone}
                    onChange={(e) => handleClientPhoneChange(e.target.value)}
                    required
                    className={!isPage1Valid() && formData.clientPhone.length < 14 ? "border-red-300" : ""}
                    maxLength={14}
                  />
                  {formData.clientPhone.length < 14 && formData.clientPhone.length > 4 && (
                    <p className="text-xs text-muted-foreground">
                      {10 - (formData.clientPhone.length - 4)} digits remaining
                    </p>
                  )}
                </div>
              </div>

              {/* Start Date & Time */}
              <div className="space-y-2">
                <Label>Project Start Date & Time <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-12 gap-2 items-end">
                  {/* Date Selection - Narrower */}
                  <div className="col-span-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="startDate"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.startDate ? (
                            format(formData.startDate, "MM/dd/yyyy")
                          ) : (
                            <span>mm/dd/yyyy</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.startDate}
                          onSelect={(date) => handleInputChange("startDate", date)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time Picker Clock */}
                  <div className="col-span-3 max-w-[70%]">
                    <TimePickerClock
                      hour={formData.startHour || "00"}
                      minute={formData.startMinute || "00"}
                      onHourChange={(h) => handleInputChange("startHour", h)}
                      onMinuteChange={(m) => handleInputChange("startMinute", m)}
                    />
                  </div>

                  {/* Confirmation Status */}
                  <div className="col-span-6 flex items-center gap-2">
                    <RadioGroup
                      value={formData.confirmationStatus}
                      onValueChange={(value: "confirmed" | "tentative") => handleInputChange("confirmationStatus", value)}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="confirmed" id="confirmed" />
                        <Label htmlFor="confirmed" className="font-normal cursor-pointer">
                          Confirmed
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="tentative" id="tentative" />
                        <Label htmlFor="tentative" className="font-normal cursor-pointer">
                          Tentative
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>

              {/* Next Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleNext}
                  disabled={!isPage1Valid()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
                  </div>
                </>
              ) : currentPage === 2 ? (
                <>
                  {/* Event Details Page */}
                  <div className="mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-2xl font-semibold">Event Details</h2>
                        <div className="flex flex-wrap items-center gap-2 text-sm mt-2">
                          <span className="font-medium">Project:</span>
                          <span className="text-muted-foreground">{formData.projectName || "Not set"}</span>
                          <span className="text-muted-foreground">|</span>
                          <span className="font-medium">StartDate:</span>
                          <span className="text-muted-foreground">
                            {formData.startDate ? format(formData.startDate, "MM/dd/yyyy") : "Not set"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveEvent} className="bg-blue-600 hover:bg-blue-700 text-white">
                          Save Event
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">Client Name:</span>
                      <span className="text-muted-foreground">{formData.clientFullName || "Not set"}</span>
                      <span className="text-muted-foreground">|</span>
                      <span className="font-medium">Client PhNo:</span>
                      <span className="text-muted-foreground">{formData.clientPhone || "Not set"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    {/* Left Column - Event Packages */}
                    <div className="col-span-2 space-y-4">
                      {eventPackages.map((pkg, index) => (
                        <Card key={pkg.id} className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">Event Package {index + 1}</h3>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleEventDetails(pkg.id)}
                                  className="h-8"
                                >
                                  Details
                                  {expandedEventId === pkg.id ? (
                                    <ChevronUp className="ml-2 h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                  )}
                                </Button>
                                {eventPackages.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveEventPackage(pkg.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`eventType-${pkg.id}`}>Type of Event</Label>
                                <Select
                                  value={pkg.eventType}
                                  onValueChange={(value) =>
                                    handleEventPackageChange(pkg.id, "eventType", value)
                                  }
                                >
                                  <SelectTrigger id={`eventType-${pkg.id}`}>
                                    <SelectValue placeholder="Select an event type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="wedding">Wedding</SelectItem>
                                    <SelectItem value="engagement">Engagement</SelectItem>
                                    <SelectItem value="corporate">Corporate</SelectItem>
                                    <SelectItem value="portrait">Portrait</SelectItem>
                                    <SelectItem value="event">Event</SelectItem>
                                    <SelectItem value="commercial">Commercial</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`photographers-${pkg.id}`}>Photographers Count</Label>
                                <Input
                                  id={`photographers-${pkg.id}`}
                                  type="number"
                                  min="0"
                                  placeholder="e.g., 2"
                                  value={pkg.photographersCount}
                                  onChange={(e) =>
                                    handleEventPackageChange(
                                      pkg.id,
                                      "photographersCount",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`videographers-${pkg.id}`}>Videographers Count</Label>
                                <Input
                                  id={`videographers-${pkg.id}`}
                                  type="number"
                                  min="0"
                                  placeholder="e.g., 1"
                                  value={pkg.videographersCount}
                                  onChange={(e) =>
                                    handleEventPackageChange(
                                      pkg.id,
                                      "videographersCount",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                            </div>

                            {/* Expanded Details Section */}
                            {expandedEventId === pkg.id && (
                              <div className="mt-4 pt-4 border-t space-y-4">
                                {/* Project Name */}
                                <div className="space-y-2">
                                  <Label>Project Name</Label>
                                  <Input
                                    value={formData.projectName}
                                    disabled
                                    className="bg-muted"
                                  />
                                </div>

                                {/* Start Date & Time */}
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium leading-none">Event Start Date & Time</Label>
                                  <div className="grid grid-cols-12 gap-4 items-end">
                                    <div className="col-span-4 space-y-2">
                                      <Label className="text-xs text-muted-foreground">Start Date</Label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !pkg.startDate && "text-muted-foreground"
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {pkg.startDate ? (
                                            format(pkg.startDate, "MM/dd/yyyy")
                                          ) : (
                                            <span>mm/dd/yyyy</span>
                                          )}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                          mode="single"
                                          selected={pkg.startDate}
                                          onSelect={(date) => handleEventPackageChange(pkg.id, "startDate", date)}
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                  <div className="col-span-2 space-y-2">
                                    <Label htmlFor={`startHour-${pkg.id}`} className="text-xs text-muted-foreground mb-1 block">Hours</Label>
                                    <Input
                                      id={`startHour-${pkg.id}`}
                                      type="number"
                                      min="0"
                                      max="23"
                                      placeholder="HH"
                                      value={pkg.startHour || ""}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        const numValue = parseInt(value, 10);
                                        if (value === "" || (!isNaN(numValue) && numValue >= 0 && numValue <= 23)) {
                                          handleEventPackageChange(pkg.id, "startHour", value);
                                        }
                                      }}
                                      className="text-center"
                                    />
                                  </div>
                                  <div className="col-span-2 space-y-2">
                                    <Label htmlFor={`startMinute-${pkg.id}`} className="text-xs text-muted-foreground mb-1 block">Minutes</Label>
                                    <Input
                                      id={`startMinute-${pkg.id}`}
                                      type="number"
                                      min="0"
                                      max="59"
                                      placeholder="MM"
                                      value={pkg.startMinute || ""}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        const numValue = parseInt(value, 10);
                                        if (value === "" || (!isNaN(numValue) && numValue >= 0 && numValue <= 59)) {
                                          handleEventPackageChange(pkg.id, "startMinute", value);
                                        }
                                      }}
                                      className="text-center"
                                    />
                                  </div>
                                  </div>
                                </div>

                                {/* Photography & Videography Coordinators */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`photoCoordinator-${pkg.id}`}>Photography Coordinator</Label>
                                    {pkg.photographyCoordinatorId ? (
                                      <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                        <div className="flex-1">
                                          <div className="font-medium text-sm">
                                            {mockPhotographers.find(p => p.id === pkg.photographyCoordinatorId)?.name}
                                          </div>
                                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                            <Phone className="h-3 w-3" />
                                            {mockPhotographers.find(p => p.id === pkg.photographyCoordinatorId)?.contactNumber}
                                          </div>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEventPackageChange(pkg.id, "photographyCoordinatorId", undefined)}
                                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Select
                                        value={pkg.photographyCoordinatorId || ""}
                                        onValueChange={(value) =>
                                          handleEventPackageChange(pkg.id, "photographyCoordinatorId", value)
                                        }
                                      >
                                        <SelectTrigger id={`photoCoordinator-${pkg.id}`}>
                                          <SelectValue placeholder="Select photography coordinator" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {mockPhotographers.map((photographer) => (
                                            <SelectItem key={photographer.id} value={photographer.id}>
                                              <div className="flex flex-col py-1">
                                                <span className="font-medium">{photographer.name}</span>
                                                <span className="text-xs text-muted-foreground">{photographer.contactNumber}</span>
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`videoCoordinator-${pkg.id}`}>Videography Coordinator</Label>
                                    {pkg.videographyCoordinatorId ? (
                                      <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                        <div className="flex-1">
                                          <div className="font-medium text-sm">
                                            {mockVideographers.find(v => v.id === pkg.videographyCoordinatorId)?.name}
                                          </div>
                                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                            <Phone className="h-3 w-3" />
                                            {mockVideographers.find(v => v.id === pkg.videographyCoordinatorId)?.contactNumber}
                                          </div>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEventPackageChange(pkg.id, "videographyCoordinatorId", undefined)}
                                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Select
                                        value={pkg.videographyCoordinatorId || ""}
                                        onValueChange={(value) =>
                                          handleEventPackageChange(pkg.id, "videographyCoordinatorId", value)
                                        }
                                      >
                                        <SelectTrigger id={`videoCoordinator-${pkg.id}`}>
                                          <SelectValue placeholder="Select videography coordinator" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {mockVideographers.map((videographer) => (
                                            <SelectItem key={videographer.id} value={videographer.id}>
                                              <div className="flex flex-col py-1">
                                                <span className="font-medium">{videographer.name}</span>
                                                <span className="text-xs text-muted-foreground">{videographer.contactNumber}</span>
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </div>
                                </div>

                                {/* Client Phone Number */}
                                <div className="space-y-2 max-w-[200px]">
                                  <Label>Client Phone Number</Label>
                                  <Input
                                    value={formData.clientPhone}
                                    disabled
                                    className="bg-muted"
                                  />
                                </div>

                                {/* Event Deliverables Notes */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Label htmlFor={`deliverablesNotes-${pkg.id}`}>Event Deliverables Notes</Label>
                                      <Pencil className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    {pkg.isEditingDeliverablesNotes !== false ? (
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => handleSaveDeliverablesNotes(pkg.id)}
                                        disabled={
                                          !pkg.hasSavedDeliverablesNotes && 
                                          (!pkg.deliverablesNotes || pkg.deliverablesNotes.trim() === "")
                                        }
                                        className="h-8"
                                      >
                                        Save
                                      </Button>
                                    ) : (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditDeliverablesNotes(pkg.id)}
                                        className="h-8"
                                      >
                                        Edit
                                      </Button>
                                    )}
                                  </div>
                                  <Textarea
                                    id={`deliverablesNotes-${pkg.id}`}
                                    placeholder="Enter deliverables notes..."
                                    value={pkg.deliverablesNotes || ""}
                                    onChange={(e) =>
                                      handleEventPackageChange(pkg.id, "deliverablesNotes", e.target.value)
                                    }
                                    disabled={pkg.isEditingDeliverablesNotes === false}
                                    rows={4}
                                    className={pkg.isEditingDeliverablesNotes === false ? "bg-muted cursor-not-allowed" : ""}
                                  />
                                </div>

                                {/* Event Prep Checklist */}
                                <div className="space-y-2">
                                  <Label>Event Prep Checklist</Label>
                                  <div className="space-y-2">
                                    {(pkg.prepChecklist || []).map((item) => (
                                      <div key={item.id} className="flex items-center gap-2">
                                        <Checkbox
                                          id={`checklist-${pkg.id}-${item.id}`}
                                          checked={item.checked}
                                          onCheckedChange={(checked) =>
                                            handleChecklistItemChange(pkg.id, item.id, "checked", checked === true)
                                          }
                                        />
                                        <Input
                                          value={item.text}
                                          placeholder="Enter checklist item..."
                                          onChange={(e) =>
                                            handleChecklistItemChange(pkg.id, item.id, "text", e.target.value)
                                          }
                                          className="flex-1"
                                        />
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveChecklistItem(pkg.id, item.id)}
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAddChecklistItem(pkg.id)}
                                      className="w-full"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Checklist Item
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}

                      <Button
                        variant="outline"
                        onClick={handleAddEventPackage}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Event
                      </Button>
                    </div>

                    {/* Right Column - Price Summary */}
                    <div className="col-span-1">
                      <Card className="p-4 sticky top-4">
                        <h3 className="font-semibold mb-4">Price</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Actual price:</span>
                            <span>₹{actualPrice.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Sub total:</span>
                            <span>₹{subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">GST (18%):</span>
                            <span>₹{gst.toLocaleString()}</span>
                          </div>
                          <div className="border-t pt-3 mt-3">
                            <div className="flex justify-between">
                              <span className="font-semibold">Total price:</span>
                              <span className="font-bold text-blue-600 text-lg">
                                ₹{total.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Next Button */}
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={handlePrevious}
                      variant="outline"
                      className="mr-4"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                    >
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Page 3 - Quotation Format Selection */}
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-end justify-between gap-4">
                      <div className="flex flex-col">
                        <Label className="text-sm text-muted-foreground mb-2">Select a template</Label>
                        <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard_wedding">Standard Wedding</SelectItem>
                            <SelectItem value="premium_wedding">Premium Wedding</SelectItem>
                            <SelectItem value="corporate">Corporate</SelectItem>
                            <SelectItem value="portrait">Portrait</SelectItem>
                            <SelectItem value="event">Event</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-9">
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="h-9">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white h-9" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white h-9" size="sm">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>

                    {/* PDF Viewer Area */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 min-h-[500px] flex flex-col items-center justify-center bg-gray-50">
                      <div className="text-center space-y-4 mb-6">
                        <p className="text-lg font-semibold text-gray-700">
                          Your quotation will appear here
                        </p>
                        <p className="text-sm text-gray-500">
                          Please select a quotation format and then choose 'Preview' or 'Edit' to begin.
                        </p>
                      </div>
                      <Button variant="outline" className="h-10 px-4 py-2 bg-white">
                        Upload Custom Template
                      </Button>
                    </div>


                    {/* Navigation Buttons */}
                    <div className="flex justify-center pt-4 gap-4">
                      <Button
                        onClick={handlePrevious}
                        variant="outline"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={handleSaveEvent}
                        variant="outline"
                        className="px-8"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={handleSaveEvent}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                      >
                        Submit
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}


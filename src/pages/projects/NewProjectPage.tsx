import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { TimePickerClock } from "@/components/ui/time-picker-clock";
import { CalendarIcon, ArrowRight, Plus, Trash2, Pencil, Eye, Download, Share2, ChevronDown, ChevronUp, Phone, X, Save, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface Photographer {
  photographer_phno: string;
  photographer_name: string;
  payperday?: number | null;
}

interface Videographer {
  videographer_phno: string;
  videographer_name: string;
  payperday?: number | null;
}

interface EventPackage {
  id: string; // Local UI ID
  event_uuid?: string; // Database UUID (set after saving)
  packageName?: string; // Custom name for the event package (e.g., "Package 1", "Wedding Event")
  eventType: string; // Maps to event_name
  customEventTypeName?: string; // Custom event type name when "other" is selected
  photographersCount: string; // Maps to event_photographers_count
  videographersCount: string; // Maps to event_videographers_count
  startDate?: Date; // Maps to event_start_date
  startHour?: string; // Maps to event_start_time
  startMinute?: string; // Maps to event_start_time
  photographyCoordinatorId?: string; // Maps to event_photo_coordinator_phno (needs conversion to phone)
  videographyCoordinatorId?: string; // Maps to event_video_coordinator_phno (needs conversion to phone)
  deliverablesNotes?: string; // Maps to event_deliverables_notes_json
  savedDeliverablesNotes?: string; // Saved version of notes
  isEditingDeliverablesNotes?: boolean; // Track if notes are being edited
  hasSavedDeliverablesNotes?: boolean; // Track if notes have been saved at least once
  prepChecklist?: ChecklistItem[]; // Maps to event_prep_checklist_json
  daysCount?: string; // Maps to event_days_count
  photographyWorkdays?: string; // Maps to photography_workdays
  videographyWorkdays?: string; // Maps to videography_workdays
  isSaved?: boolean; // Track if this event has been saved to database
  isEditingPackageName?: boolean; // Track if package name is being edited
}

// Removed mock data - will be fetched from database

export default function NewProjectPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get projectUuid from URL if editing existing project
  const projectUuidFromUrl = searchParams.get('projectUuid');
  
  // Initialize currentPage from URL query parameter, fallback to 1
  const pageFromUrl = searchParams.get('page');
  const initialPage = pageFromUrl ? parseInt(pageFromUrl, 10) : 1;
  const [currentPage, setCurrentPage] = useState(initialPage >= 1 && initialPage <= 3 ? initialPage : 1);
  const [formData, setFormData] = useState({
    projectName: "",
    eventType: "",
    clientFullName: "",
    clientEmail: "",
    clientPhone: "+91 ",
    startDate: undefined as Date | undefined,
    startHour: "",
    startMinute: "",
    confirmationStatus: false, // false = tentative (left/grey), true = confirmed (right/green)
    endDate: undefined as Date | undefined,
    endHour: "",
    endMinute: "",
    endConfirmationStatus: false, // false = tentative (left/grey), true = confirmed (right/green)
  });
  const [eventPackages, setEventPackages] = useState<EventPackage[]>([]);
  const [selectedFormat, setSelectedFormat] = useState("standard_wedding.pdf");
  // PDF path - using public folder path for Vite static assets
  const [selectedPdfPath, setSelectedPdfPath] = useState("/docs/test-pdfloader/file-sample_150kB.pdf");
  const [editedPdfBlob, setEditedPdfBlob] = useState<Blob | null>(null);
  const [isEditingPdf, setIsEditingPdf] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [pdfEditText, setPdfEditText] = useState<string>("");
  // Editable price fields
  const [editablePrices, setEditablePrices] = useState({
    actualPrice: "",
    subtotal: "",
    gst: "",
    total: "",
  });
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [isPriceDetailsExpanded, setIsPriceDetailsExpanded] = useState(false);
  const [editingPackageNameId, setEditingPackageNameId] = useState<string | null>(null);
  const [photographyOwner, setPhotographyOwner] = useState<{
    photography_owner_phno: string;
    photography_owner_email: string;
    photography_owner_name: string;
  } | null>(null);
  const [loadingOwner, setLoadingOwner] = useState(false);
  // Initialize projectEstimateUuid from URL or sessionStorage
  const [projectEstimateUuid, setProjectEstimateUuid] = useState<string | null>(
    projectUuidFromUrl || sessionStorage.getItem("newProjectEstimateUuid")
  );

  // Update projectEstimateUuid when URL parameter changes
  useEffect(() => {
    if (projectUuidFromUrl) {
      setProjectEstimateUuid(projectUuidFromUrl);
      sessionStorage.setItem("newProjectEstimateUuid", projectUuidFromUrl);
    }
  }, [projectUuidFromUrl]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectDetails, setProjectDetails] = useState<{
    project_name: string;
    project_type: string;
    clientid_phno: string;
    client_name: string;
  } | null>(null);
  const [loadingProjectDetails, setLoadingProjectDetails] = useState(false);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [videographers, setVideographers] = useState<Videographer[]>([]);
  const [loadingPhotographers, setLoadingPhotographers] = useState(false);
  const [loadingVideographers, setLoadingVideographers] = useState(false);
  const [isSavingEvents, setIsSavingEvents] = useState(false);

  // Load form data from sessionStorage on component mount
  // This runs FIRST and provides fallback data even if database query fails
  useEffect(() => {
    try {
      const savedFormData = sessionStorage.getItem("newProjectFormData");
      const savedCurrentPage = sessionStorage.getItem("newProjectCurrentPage");
      const savedEventPackages = sessionStorage.getItem("newProjectEventPackages");
      const savedSelectedFormat = sessionStorage.getItem("newProjectSelectedFormat");
      const savedProjectEstimateUuid = sessionStorage.getItem("newProjectEstimateUuid");
      const savedPhotographyOwnerPhno = sessionStorage.getItem("newProjectPhotographyOwnerPhno");
      const savedProjectName = sessionStorage.getItem("newProjectName");
      const savedProjectType = sessionStorage.getItem("newProjectType");

      // Restore currentPage from URL first (takes precedence), then fallback to sessionStorage
      const pageFromUrl = searchParams.get('page');
      if (pageFromUrl) {
        const page = parseInt(pageFromUrl, 10);
        if (page >= 1 && page <= 3) {
          setCurrentPage(page);
        }
      } else if (savedCurrentPage) {
        const page = parseInt(savedCurrentPage, 10);
        if (page >= 1 && page <= 3) {
          setCurrentPage(page);
          // Update URL to reflect the page from sessionStorage
          setSearchParams({ page: page.toString() }, { replace: true });
        }
      }

      if (savedFormData) {
        const parsed = JSON.parse(savedFormData);
        // Convert date strings back to Date objects
        if (parsed.startDate) parsed.startDate = new Date(parsed.startDate);
        if (parsed.endDate) parsed.endDate = new Date(parsed.endDate);
        setFormData(parsed);
      }

      // Only load event packages from sessionStorage if we're on Page 2 or 3
      // For fresh navigation from Page 1, we'll initialize with empty event cards
      const currentPageNum = pageFromUrl ? parseInt(pageFromUrl, 10) : (savedCurrentPage ? parseInt(savedCurrentPage, 10) : 1);
      
      if (savedEventPackages && (currentPageNum === 2 || currentPageNum === 3)) {
        const parsed = JSON.parse(savedEventPackages);
        // Convert date strings back to Date objects in event packages
        const packagesWithDates = parsed.map((pkg: any) => {
          if (pkg.startDate) pkg.startDate = new Date(pkg.startDate);
          return pkg;
        });
        // Only set if we have packages, otherwise will be initialized later
        if (packagesWithDates.length > 0) {
          setEventPackages(packagesWithDates);
        }
      } else if (currentPageNum === 2) {
        // If on Page 2 and no saved event packages, initialize with one empty event card
        const newPackage: EventPackage = {
          id: Date.now().toString(),
          eventType: "",
          photographersCount: "",
          videographersCount: "",
          prepChecklist: [],
          isSaved: false,
        };
        setEventPackages([newPackage]);
      }

      if (savedSelectedFormat) {
        setSelectedFormat(savedSelectedFormat);
      }

      if (savedProjectEstimateUuid) {
        setProjectEstimateUuid(savedProjectEstimateUuid);
      }

      // Restore project metadata if available (for use in page 2)
      // These values are stored separately for easy access in page 2
      if (savedPhotographyOwnerPhno) {
        console.log('Photography owner phone from sessionStorage:', savedPhotographyOwnerPhno);
      }
      if (savedProjectName && !formData.projectName) {
        handleInputChange('projectName', savedProjectName);
      }
      if (savedProjectType && !formData.eventType) {
        handleInputChange('eventType', savedProjectType);
      }
    } catch (error) {
      console.error("Error loading form data from sessionStorage:", error);
    }
  }, []); // Run only once on mount

  // Save form data to sessionStorage whenever it changes
  useEffect(() => {
    try {
      const dataToSave = {
        ...formData,
        startDate: formData.startDate ? formData.startDate.toISOString() : null,
        endDate: formData.endDate ? formData.endDate.toISOString() : null,
      };
      sessionStorage.setItem("newProjectFormData", JSON.stringify(dataToSave));
      sessionStorage.setItem("newProjectLastModified", new Date().toISOString());
    } catch (error) {
      console.error("Error saving form data to sessionStorage:", error);
    }
  }, [formData]);

  // Update URL query parameter and sessionStorage whenever currentPage changes
  useEffect(() => {
    try {
      // Update URL query parameter
      setSearchParams({ page: currentPage.toString() }, { replace: true });
      
      // Also save to sessionStorage as backup
      sessionStorage.setItem("newProjectCurrentPage", currentPage.toString());
      sessionStorage.setItem("newProjectLastModified", new Date().toISOString());
    } catch (error) {
      console.error("Error saving currentPage:", error);
    }
  }, [currentPage, setSearchParams]);

  // Save eventPackages to sessionStorage whenever it changes
  useEffect(() => {
    try {
      const packagesToSave = eventPackages.map((pkg) => ({
        ...pkg,
        startDate: pkg.startDate ? pkg.startDate.toISOString() : null,
      }));
      sessionStorage.setItem("newProjectEventPackages", JSON.stringify(packagesToSave));
      sessionStorage.setItem("newProjectLastModified", new Date().toISOString());
    } catch (error) {
      console.error("Error saving eventPackages to sessionStorage:", error);
    }
  }, [eventPackages]);

  // Note: Removed auto-open behavior to allow users to manually control Details section visibility

  // Build comprehensive drafted_json object with all form data
  const buildDraftedJson = useCallback(() => {
    // Format dates and times for JSON storage
    const formatDateForJson = (date: Date | undefined) => 
      date ? date.toISOString() : null;
    
    const formatTimeForJson = (hour: string, minute: string) => 
      (hour && minute) ? `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}` : null;

    // Format event packages for JSON (convert Date objects to ISO strings)
    const formattedEventPackages = eventPackages.map(pkg => ({
      ...pkg,
      startDate: pkg.startDate ? pkg.startDate.toISOString() : null,
    }));

    return {
      is_drafted: true, // Include is_drafted in JSON as requested
      currentPage,
      formData: {
        projectName: formData.projectName,
        eventType: formData.eventType,
        clientFullName: formData.clientFullName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        startDate: formatDateForJson(formData.startDate),
        startHour: formData.startHour,
        startMinute: formData.startMinute,
        confirmationStatus: formData.confirmationStatus,
        endDate: formatDateForJson(formData.endDate),
        endHour: formData.endHour,
        endMinute: formData.endMinute,
        endConfirmationStatus: formData.endConfirmationStatus,
      },
      eventPackages: formattedEventPackages,
      selectedFormat,
      photographyOwnerPhno: photographyOwner?.photography_owner_phno || '',
      lastModified: new Date().toISOString(),
    };
  }, [formData, eventPackages, selectedFormat, currentPage, photographyOwner]);

  // Update drafted_json in database when form data changes (debounced)
  useEffect(() => {
    if (!projectEstimateUuid) return; // Only update if we have a UUID

    // Debounce: wait 2 seconds after last change before updating
    const timeoutId = setTimeout(async () => {
      try {
        const draftedJson = buildDraftedJson();
        await supabase.rpc('update_project_draft_status', {
          p_project_estimate_uuid: projectEstimateUuid,
          p_is_drafted: true,
          p_drafted_json: draftedJson as any,
        });
      } catch (error) {
        console.warn('Failed to auto-update draft status:', error);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [formData, eventPackages, selectedFormat, currentPage, projectEstimateUuid, buildDraftedJson]);

  // Save selectedFormat to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem("newProjectSelectedFormat", selectedFormat);
    } catch (error) {
      console.error("Error saving selectedFormat to sessionStorage:", error);
    }
  }, [selectedFormat]);

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

  // Load draft data from database on initial mount if projectEstimateUuid exists (resuming a draft)
  useEffect(() => {
    const loadDraftFromDatabase = async () => {
      // Only load if we have a projectEstimateUuid (means we're resuming an existing draft)
      // For a fresh "+ New Project", projectEstimateUuid will be null, so skip this
      if (!projectEstimateUuid) {
        return;
      }

      // Only load once on mount, not on every page change
      // Check if we already have project details to avoid duplicate loads
      if (projectDetails) {
        return;
      }

      setLoadingProjectDetails(true);
      try {
        // Try to fetch with drafted_json and is_drafted columns
        // If columns don't exist (406 error), fall back to basic columns
        let projectData: any = null;
        let projectError: any = null;

        // First try with all columns including drafted_json
        const { data, error } = await supabase
          .from('project_estimation_table')
          .select('project_name, project_type, clientid_phno, drafted_json, is_drafted')
          .eq('project_estimate_uuid', projectEstimateUuid)
          .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

        if (error) {
          // If 406 error (columns don't exist), try without drafted_json columns
          if (error.code === 'PGRST116' || error.code === '406' || error.message?.includes('406')) {
            console.warn('drafted_json columns may not exist, trying without them...');
            const { data: basicData, error: basicError } = await supabase
              .from('project_estimation_table')
              .select('project_name, project_type, clientid_phno')
              .eq('project_estimate_uuid', projectEstimateUuid)
              .maybeSingle();
            
            if (!basicError && basicData) {
              projectData = basicData;
            } else {
              projectError = basicError;
            }
          } else {
            projectError = error;
          }
        } else {
          projectData = data;
        }

        if (projectError) {
          console.error('Error fetching project details:', projectError);
          // Don't return - continue to use sessionStorage data
          return;
        }

        if (projectData) {
          // Only load draft data if the project is actually a draft
          // For completed projects (is_drafted = false), don't load draft data
          if (projectData.is_drafted === false) {
            console.log('Project is not a draft, skipping draft data load');
            // Still fetch client name for display purposes
            const { data: clientData } = await supabase
              .from('client_details_table')
              .select('client_name')
              .eq('clientid_phno', projectData.clientid_phno)
              .maybeSingle();

            setProjectDetails({
              project_name: projectData.project_name || '',
              project_type: projectData.project_type || '',
              clientid_phno: projectData.clientid_phno || '',
              client_name: clientData?.client_name || ''
            });
            return;
          }

          // Fetch client name using clientid_phno
          const { data: clientData, error: clientError } = await supabase
            .from('client_details_table')
            .select('client_name')
            .eq('clientid_phno', projectData.clientid_phno)
            .maybeSingle();

          if (clientError) {
            console.warn('Error fetching client name:', clientError);
            // Still set project details even if client fetch fails
          }

          setProjectDetails({
            project_name: projectData.project_name || '',
            project_type: projectData.project_type || '',
            clientid_phno: projectData.clientid_phno || '',
            client_name: clientData?.client_name || ''
          });

          // Restore form data from drafted_json if available and valid
          // This will override sessionStorage data if it exists
          if (projectData.drafted_json && 
              typeof projectData.drafted_json === 'object' && 
              Object.keys(projectData.drafted_json).length > 0) {
            const draftData = projectData.drafted_json as any;
            
            // Restore form data
            if (draftData.formData) {
              const fd = draftData.formData;
              setFormData({
                projectName: fd.projectName || '',
                eventType: fd.eventType || '',
                clientFullName: fd.clientFullName || '',
                clientEmail: fd.clientEmail || '',
                clientPhone: fd.clientPhone || '+91 ',
                startDate: fd.startDate ? new Date(fd.startDate) : undefined,
                startHour: fd.startHour || '',
                startMinute: fd.startMinute || '',
                confirmationStatus: fd.confirmationStatus || false,
                endDate: fd.endDate ? new Date(fd.endDate) : undefined,
                endHour: fd.endHour || '',
                endMinute: fd.endMinute || '',
                endConfirmationStatus: fd.endConfirmationStatus || false,
              });
            }

            // Restore current page (this is important for staying on page 2 after refresh)
            if (draftData.currentPage) {
              setCurrentPage(draftData.currentPage);
            }

            // Restore event packages only if they exist in draft
            // If no draft event packages, start with one empty event card
            if (draftData.eventPackages && Array.isArray(draftData.eventPackages) && draftData.eventPackages.length > 0) {
              const restoredPackages = draftData.eventPackages.map((pkg: any) => ({
                ...pkg,
                startDate: pkg.startDate ? new Date(pkg.startDate) : undefined,
              }));
              setEventPackages(restoredPackages);
            } else if (currentPage === 2 && eventPackages.length === 0) {
              // If on Page 2 and no event packages, initialize with one empty event card
              const newPackage: EventPackage = {
                id: Date.now().toString(),
                eventType: "",
                photographersCount: "",
                videographersCount: "",
                prepChecklist: [],
                isSaved: false,
              };
              setEventPackages([newPackage]);
            }

            // Restore selected format
            if (draftData.selectedFormat) {
              setSelectedFormat(draftData.selectedFormat);
            }
          }
        }
      } catch (error) {
        console.error('Exception fetching project details:', error);
        // Don't throw - sessionStorage data will be used as fallback
      } finally {
        setLoadingProjectDetails(false);
      }
    };

    loadDraftFromDatabase();
  }, [projectEstimateUuid]); // Only run when projectEstimateUuid changes (on mount or when set)

  // Fetch project and client details for Page 2 - using RPC function
  useEffect(() => {
    const fetchProjectDetailsForPage2 = async () => {
      // Only fetch if we have UUID and we're on page 2
      if (!projectEstimateUuid || currentPage !== 2) {
        return;
      }

      // If we already have the details, don't fetch again
      if (projectDetails && projectDetails.client_name) {
        return;
      }

      setLoadingProjectDetails(true);
      try {
        // Use RPC function to get project estimation details
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_project_estimation_details', {
          p_project_estimate_uuid: projectEstimateUuid
        });

        if (rpcError) {
          console.error('Error fetching project details via RPC:', rpcError);
          // Fallback to sessionStorage
          const savedProjectName = sessionStorage.getItem('newProjectName');
          const savedProjectType = sessionStorage.getItem('newProjectType');
          const savedClientName = sessionStorage.getItem('newProjectClientName');
          const savedClientPhone = sessionStorage.getItem('newProjectClientPhone');
          
          if (savedProjectName || savedProjectType || savedClientName) {
            setProjectDetails({
              project_name: savedProjectName || formData.projectName || '',
              project_type: savedProjectType || formData.eventType || '',
              clientid_phno: savedClientPhone || formData.clientPhone?.replace(/\s/g, '') || '',
              client_name: savedClientName || formData.clientFullName || ''
            });
          }
          return;
        }

        if (rpcData && typeof rpcData === 'object' && 'project_name' in rpcData) {
          // RPC function returned data successfully
          setProjectDetails({
            project_name: rpcData.project_name || '',
            project_type: rpcData.project_type || '',
            clientid_phno: rpcData.clientid_phno || '',
            client_name: rpcData.client_name || ''
          });
          
          // Also update sessionStorage with fetched data for consistency
          try {
            if (rpcData.project_name) sessionStorage.setItem('newProjectName', rpcData.project_name);
            if (rpcData.project_type) sessionStorage.setItem('newProjectType', rpcData.project_type);
            if (rpcData.client_name) sessionStorage.setItem('newProjectClientName', rpcData.client_name);
            if (rpcData.clientid_phno) sessionStorage.setItem('newProjectClientPhone', rpcData.clientid_phno);
            if (rpcData.photography_owner_phno) sessionStorage.setItem('newProjectPhotographyOwnerPhno', rpcData.photography_owner_phno);
          } catch (e) {
            console.warn('Failed to update sessionStorage:', e);
          }
        } else {
          // RPC returned empty or invalid data - use sessionStorage as fallback
          console.warn('RPC returned empty data, using sessionStorage');
          const savedProjectName = sessionStorage.getItem('newProjectName');
          const savedProjectType = sessionStorage.getItem('newProjectType');
          const savedClientName = sessionStorage.getItem('newProjectClientName');
          const savedClientPhone = sessionStorage.getItem('newProjectClientPhone');
          
          if (savedProjectName || savedProjectType || savedClientName) {
            setProjectDetails({
              project_name: savedProjectName || formData.projectName || '',
              project_type: savedProjectType || formData.eventType || '',
              clientid_phno: savedClientPhone || formData.clientPhone?.replace(/\s/g, '') || '',
              client_name: savedClientName || formData.clientFullName || ''
            });
          }
        }
      } catch (error) {
        console.error('Exception fetching project details:', error);
        // Use sessionStorage data as fallback
        const savedProjectName = sessionStorage.getItem('newProjectName');
        const savedProjectType = sessionStorage.getItem('newProjectType');
        const savedClientName = sessionStorage.getItem('newProjectClientName');
        const savedClientPhone = sessionStorage.getItem('newProjectClientPhone');
        
        if (savedProjectName || savedProjectType || savedClientName) {
          setProjectDetails({
            project_name: savedProjectName || formData.projectName || '',
            project_type: savedProjectType || formData.eventType || '',
            clientid_phno: savedClientPhone || formData.clientPhone?.replace(/\s/g, '') || '',
            client_name: savedClientName || formData.clientFullName || ''
          });
        }
      } finally {
        setLoadingProjectDetails(false);
      }
    };

    fetchProjectDetailsForPage2();
    
    // Initialize event packages with one empty event card when Page 2 loads
    // Only if we don't already have event packages (fresh load, not from draft/sessionStorage)
    if (currentPage === 2 && eventPackages.length === 0) {
      const newPackage: EventPackage = {
        id: Date.now().toString(),
        eventType: "",
        photographersCount: "",
        videographersCount: "",
        prepChecklist: [],
        isSaved: false,
      };
      setEventPackages([newPackage]);
    }
  }, [projectEstimateUuid, currentPage, eventPackages.length]);

  // Load existing events when opening a project from dashboard
  useEffect(() => {
    const loadExistingEvents = async () => {
      // Only load if we have a projectEstimateUuid and we're on Page 2
      if (!projectEstimateUuid || currentPage !== 2) {
        return;
      }

      // Don't reload if we already have events loaded
      if (eventPackages.length > 0 && eventPackages.some(pkg => pkg.event_uuid)) {
        return;
      }

      try {
        console.log('Loading existing events for project:', projectEstimateUuid);
        
        // Fetch events from events_details_table
        const { data: eventsData, error: eventsError } = await supabase
          .from('events_details_table' as any)
          .select(`
            event_uuid,
            event_name,
            event_start_date,
            event_start_time,
            event_photographers_count,
            event_videographers_count,
            event_photo_coordinator_phno,
            event_video_coordinator_phno,
            event_deliverables_notes_json,
            event_prep_checklist_json,
            event_days_count,
            photography_workdays,
            videography_workdays,
            event_photographers_days_count,
            event_videographers_days_count
          `)
          .eq('project_uuid', projectEstimateUuid)
          .order('event_start_date', { ascending: true });

        if (eventsError) {
          console.error('Error fetching existing events:', eventsError);
          return;
        }

        if (eventsData && eventsData.length > 0) {
          console.log(`Loaded ${eventsData.length} existing events`);
          
          // Transform database events to EventPackage format
          const loadedEvents: EventPackage[] = eventsData.map((event: any) => {
            // Parse start date and time
            const startDate = event.event_start_date ? new Date(event.event_start_date) : undefined;
            const startTime = event.event_start_time ? event.event_start_time.split(':') : null;
            
            // Parse checklist
            let prepChecklist: ChecklistItem[] = [];
            if (event.event_prep_checklist_json && Array.isArray(event.event_prep_checklist_json)) {
              prepChecklist = event.event_prep_checklist_json.map((item: any, index: number) => ({
                id: item.id || `checklist-${index}`,
                text: item.text || item,
                checked: item.checked || false
              }));
            }

            return {
              id: Date.now().toString() + Math.random(), // Generate unique ID
              event_uuid: event.event_uuid,
              packageName: event.event_name || `Event Package ${eventsData.indexOf(event) + 1}`,
              eventType: event.event_name || "",
              photographersCount: event.event_photographers_count?.toString() || "",
              videographersCount: event.event_videographers_count?.toString() || "",
              startDate: startDate,
              startHour: startTime ? startTime[0] : "",
              startMinute: startTime ? startTime[1] : "",
              photographyCoordinatorId: event.event_photo_coordinator_phno || undefined,
              videographyCoordinatorId: event.event_video_coordinator_phno || undefined,
              deliverablesNotes: event.event_deliverables_notes_json || "",
              savedDeliverablesNotes: event.event_deliverables_notes_json || "",
              hasSavedDeliverablesNotes: !!event.event_deliverables_notes_json,
              prepChecklist: prepChecklist,
              daysCount: event.event_days_count?.toString() || "",
              photographyWorkdays: event.photography_workdays?.toString() || "",
              videographyWorkdays: event.videography_workdays?.toString() || "",
              isSaved: true, // These are already saved
            };
          });

          setEventPackages(loadedEvents);
        } else {
          // No existing events, initialize with one empty event card
          console.log('No existing events found, initializing with empty event card');
          if (eventPackages.length === 0) {
            const newPackage: EventPackage = {
              id: Date.now().toString(),
              eventType: "",
              photographersCount: "",
              videographersCount: "",
              prepChecklist: [],
              isSaved: false,
            };
            setEventPackages([newPackage]);
          }
        }
      } catch (error) {
        console.error('Exception loading existing events:', error);
      }
    };

    loadExistingEvents();
  }, [projectEstimateUuid, currentPage]);

  // Fetch photographers and videographers when Page 2 loads
  useEffect(() => {
    const fetchPhotographersAndVideographers = async () => {
      // Only fetch when on Page 2 (Event Details)
      if (currentPage !== 2) {
        return;
      }

      // Fetch photographers
      setLoadingPhotographers(true);
      try {
        const { data: photographersData, error: photographersError } = await supabase
          .from('photographers_details_table' as any)
          .select('photographer_phno, photographer_name, payperday')
          .order('photographer_name', { ascending: true });

        if (photographersError) {
          console.error('Error fetching photographers:', photographersError);
        } else {
          setPhotographers((photographersData as unknown as Photographer[]) || []);
        }
      } catch (error) {
        console.error('Exception fetching photographers:', error);
      } finally {
        setLoadingPhotographers(false);
      }

      // Fetch videographers
      setLoadingVideographers(true);
      try {
        const { data: videographersData, error: videographersError } = await supabase
          .from('videographers_details_table' as any)
          .select('videographer_phno, videographer_name, payperday')
          .order('videographer_name', { ascending: true });

        if (videographersError) {
          console.error('Error fetching videographers:', videographersError);
        } else {
          setVideographers((videographersData as unknown as Videographer[]) || []);
        }
      } catch (error) {
        console.error('Exception fetching videographers:', error);
      } finally {
        setLoadingVideographers(false);
      }
    };

    fetchPhotographersAndVideographers();
  }, [currentPage]);

  const handleInputChange = (field: string, value: string | Date | undefined | boolean) => {
    // Validate end date is not before start date
    if (field === "endDate" && value instanceof Date && formData.startDate) {
      const startDateOnly = new Date(formData.startDate);
      startDateOnly.setHours(0, 0, 0, 0);
      const endDateOnly = new Date(value);
      endDateOnly.setHours(0, 0, 0, 0);
      
      if (endDateOnly < startDateOnly) {
        // Don't update if end date is before start date
        return;
      }
    }
    
    // If start date changes and end date exists, validate end date is still valid
    if (field === "startDate" && value instanceof Date && formData.endDate) {
      const startDateOnly = new Date(value);
      startDateOnly.setHours(0, 0, 0, 0);
      const endDateOnly = new Date(formData.endDate);
      endDateOnly.setHours(0, 0, 0, 0);
      
      if (endDateOnly < startDateOnly) {
        // Clear end date if it becomes invalid
        setFormData((prev) => ({ ...prev, [field]: value, endDate: undefined }));
        return;
      }
    }
    
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isValidEmail = (email: string) => {
    if (!email) return false;
    // Check if email contains '@' and has a domain after '@'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isPage1Valid = () => {
    // Client phone should be "+91 " followed by exactly 10 digits
    const phoneValid = /^\+91 \d{10}$/.test(formData.clientPhone);
    // Email validation
    const emailValid = !formData.clientEmail || isValidEmail(formData.clientEmail);
    return (
      formData.projectName.trim() !== "" &&
      formData.eventType !== "" &&
      phoneValid &&
      emailValid
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

  const handleNext = async () => {
    if (currentPage === 1) {
      // Validate required fields before proceeding
      if (!isPage1Valid()) {
        return; // Don't proceed if validation fails
      }

      // Call RPC function to create project estimation
      setIsSubmitting(true);
      try {
        // Format time as HH:MM:SS
        const formatTime = (hour: string, minute: string) => {
          const h = hour.padStart(2, '0');
          const m = minute.padStart(2, '0');
          return `${h}:${m}:00`;
        };

        // Build drafted_json with all form data
        const draftedJson = buildDraftedJson();

        // Prepare request data
        const requestData = {
          p_project_name: formData.projectName,
          p_project_type: formData.eventType,
          p_start_date: formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : null,
          p_start_time: formData.startHour && formData.startMinute 
            ? formatTime(formData.startHour, formData.startMinute)
            : null,
          p_start_datetime_confirmed: formData.confirmationStatus,
          p_end_date: formData.endDate ? format(formData.endDate, 'yyyy-MM-dd') : null,
          p_end_time: formData.endHour && formData.endMinute 
            ? formatTime(formData.endHour, formData.endMinute)
            : null,
          p_end_datetime_confirmed: formData.endConfirmationStatus,
          p_photography_owner_phno: photographyOwner?.photography_owner_phno || '',
          p_client_name: formData.clientFullName,
          p_client_email: formData.clientEmail,
          p_client_phno: formData.clientPhone.replace(/\s/g, ''), // Remove spaces for storage
          p_is_drafted: true, // Set as draft when clicking Next
          p_drafted_json: draftedJson as any, // Pass the comprehensive draft JSON
        };

        // Call Supabase RPC function
        const { data, error } = await supabase.rpc('create_project_estimation', requestData);

        if (error) {
          console.error('Error creating project estimation:', error);
          alert(`Error: ${error.message || 'Failed to create project estimation'}`);
          setIsSubmitting(false);
          return;
        }

        if (data && data.success) {
          // Store the project estimate UUID
          const uuid = data.project_estimate_uuid;
          setProjectEstimateUuid(uuid);
          
          // Save project and client info to sessionStorage for use in page 2
          try {
            // Project Info
            sessionStorage.setItem('newProjectEstimateUuid', uuid);
            sessionStorage.setItem('newProjectPhotographyOwnerPhno', photographyOwner?.photography_owner_phno || '');
            sessionStorage.setItem('newProjectName', formData.projectName);
            sessionStorage.setItem('newProjectType', formData.eventType);
            
            // Client Info
            sessionStorage.setItem('newProjectClientName', formData.clientFullName);
            sessionStorage.setItem('newProjectClientEmail', formData.clientEmail);
            sessionStorage.setItem('newProjectClientPhone', formData.clientPhone.replace(/\s/g, '')); // Remove spaces
          } catch (e) {
            console.warn('Failed to save project and client info to sessionStorage:', e);
          }
          
          console.log('Project estimation created successfully with is_drafted=true:', uuid);
          
          // Initialize event packages with one empty event card when navigating to Page 2
          // Only if we don't already have event packages (fresh navigation from Page 1)
          if (eventPackages.length === 0) {
            const newPackage: EventPackage = {
              id: Date.now().toString(),
              eventType: "",
              photographersCount: "",
              videographersCount: "",
              prepChecklist: [],
              isSaved: false,
            };
            setEventPackages([newPackage]);
          }
          
          // Navigate to next page
          setCurrentPage(2);
        } else {
          console.error('Failed to create project estimation:', data);
          alert(`Error: ${data?.error || 'Unknown error occurred'}`);
        }
      } catch (error: any) {
        console.error('Exception creating project estimation:', error);
        alert(`Error: ${error.message || 'Failed to create project estimation'}`);
      } finally {
        setIsSubmitting(false);
      }
    } else if (currentPage === 2) {
      // Save all unsaved events before moving to page 3
      await saveUnsavedEvents();
      
      // Update drafted_json with events and all column info when moving to page 3
      if (projectEstimateUuid) {
        const draftedJson = buildDraftedJson();
        try {
          await supabase.rpc('update_project_draft_status', {
            p_project_estimate_uuid: projectEstimateUuid,
            p_is_drafted: true,
            p_drafted_json: draftedJson as any,
          });
          console.log('Project JSON updated with events and all column info');
        } catch (error) {
          console.warn('Failed to update draft status:', error);
        }
      }
      // Navigate to Page 3 (Quotation Format Selection)
      setCurrentPage(3);
      setSearchParams({ page: '3' });
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

  // Convert coordinator ID (phone number) to phone number (already stored as phone number)
  const getCoordinatorPhone = (coordinatorId: string | undefined, type: 'photo' | 'video'): string | null => {
    if (!coordinatorId || coordinatorId.trim() === '') return null;
    // Coordinator ID is now the phone number directly, just remove spaces
    const cleaned = coordinatorId.replace(/\s/g, '');
    // Return null if empty after cleaning
    return cleaned === '' ? null : cleaned;
  };

  // Convert EventPackage to database format and save to events_details_table
  const saveEventToDatabase = async (eventPackage: EventPackage, index: number): Promise<string | null> => {
    if (!projectEstimateUuid || !photographyOwner?.photography_owner_phno) {
      console.warn('Cannot save event: missing projectEstimateUuid or photographyOwner');
      return null;
    }

    // Validate required fields
    if (!eventPackage.eventType || !eventPackage.startDate) {
      console.warn(`Cannot save event ${index + 1}: missing eventType or startDate`);
      return null;
    }

    try {
      // Format time as HH:MM:SS
      const formatTime = (hour: string, minute: string) => {
        const h = hour.padStart(2, '0');
        const m = minute.padStart(2, '0');
        return `${h}:${m}:00`;
      };

      // Convert checklist to JSONB format
      const checklistJson = eventPackage.prepChecklist 
        ? eventPackage.prepChecklist.map(item => ({
            id: item.id,
            text: item.text,
            checked: item.checked
          }))
        : [];

      // Prepare request data
      // Use customEventTypeName if eventType is "other", otherwise use eventType
      const eventName = eventPackage.eventType === "other" && eventPackage.customEventTypeName
        ? eventPackage.customEventTypeName
        : eventPackage.eventType;
      
      // Get client phone number - ensure it exists
      const clientPhno = (projectDetails?.clientid_phno || formData.clientPhone || '').replace(/\s/g, '');
      if (!clientPhno) {
        console.error('Cannot save event: missing client phone number');
        return null;
      }

      // Get coordinator phone numbers
      const photoCoordinatorPhno = getCoordinatorPhone(eventPackage.photographyCoordinatorId, 'photo');
      const videoCoordinatorPhno = getCoordinatorPhone(eventPackage.videographyCoordinatorId, 'video');

      const requestData = {
        p_event_name: eventName,
        p_event_start_date: format(eventPackage.startDate, 'yyyy-MM-dd'),
        p_event_start_time: (eventPackage.startHour && eventPackage.startMinute)
          ? formatTime(eventPackage.startHour, eventPackage.startMinute)
          : null,
        p_event_photo_coordinator_phno: photoCoordinatorPhno,
        p_event_video_coordinator_phno: videoCoordinatorPhno,
        p_event_photographers_count: parseInt(eventPackage.photographersCount || '0', 10),
        p_event_videographers_count: parseInt(eventPackage.videographersCount || '0', 10),
        p_event_deliverables_notes_json: eventPackage.savedDeliverablesNotes || eventPackage.deliverablesNotes || null,
        p_event_prep_checklist_json: checklistJson as any,
        p_project_uuid: projectEstimateUuid,
        p_photography_eventowner_phno: photographyOwner.photography_owner_phno,
        p_event_client_phno: clientPhno,
        p_event_uuid: eventPackage.event_uuid || null, // If exists, update; otherwise create new
        p_event_days_count: eventPackage.daysCount ? parseFloat(eventPackage.daysCount) : null,
        p_photography_workdays: eventPackage.photographyWorkdays ? parseFloat(eventPackage.photographyWorkdays) : null,
        p_videography_workdays: eventPackage.videographyWorkdays ? parseFloat(eventPackage.videographyWorkdays) : null,
        p_event_photographers_days_count: eventPackage.photographyWorkdays ? parseFloat(eventPackage.photographyWorkdays) : null, // PGDays -> event_photographers_days_count
        p_event_videographers_days_count: eventPackage.videographyWorkdays ? parseFloat(eventPackage.videographyWorkdays) : null, // VGDays -> event_videographers_days_count
      };

      // Log the request data for debugging
      console.log('Saving event with data:', {
        project_uuid: projectEstimateUuid,
        client_phno: clientPhno,
        photo_coordinator: photoCoordinatorPhno,
        video_coordinator: videoCoordinatorPhno,
        photography_owner: photographyOwner.photography_owner_phno,
        event_name: eventName
      });

      // Call Supabase RPC function
      const { data, error } = await supabase.rpc('create_event', requestData);

      if (error) {
        console.error(`Error saving event ${index + 1}:`, error);
        console.error('Request data sent:', requestData);
        return null;
      }

      if (data && (data as any).success) {
        const eventUuid = (data as any).event_uuid;
        const isDuplicate = (data as any).is_duplicate || false;
        const isUpdate = (data as any).is_update || false;
        
        if (isDuplicate) {
          console.log(`Duplicate event detected for event ${index + 1}. Existing event updated with UUID:`, eventUuid);
        } else if (isUpdate) {
          console.log(`Event ${index + 1} updated successfully with UUID:`, eventUuid);
        } else {
          console.log(`Event ${index + 1} created successfully with UUID:`, eventUuid);
        }
        
        return eventUuid;
      } else {
        console.error(`Failed to save event ${index + 1}:`, data);
        if ((data as any)?.error_detail) {
          console.error('Detailed error:', (data as any).error_detail);
          console.error('Foreign key values that failed:', {
            project_uuid: (data as any).project_uuid,
            client_phno: (data as any).client_phno,
            photo_coordinator: (data as any).photo_coordinator,
            video_coordinator: (data as any).video_coordinator
          });
        }
        // Show user-friendly error message
        if (data?.error && data.error.includes('Foreign key')) {
          alert(`Failed to save event: ${data.error}\n\nPlease ensure:\n- Project exists\n- Client phone number is correct\n- Coordinator phone numbers exist in the database (or leave empty)`);
        }
        return null;
      }
    } catch (error: any) {
      console.error(`Exception saving event ${index + 1}:`, error);
      return null;
    }
  };

  // Save all events that haven't been saved yet
  const saveUnsavedEvents = async () => {
    if (!projectEstimateUuid) return;

    const savePromises = eventPackages.map(async (pkg, index) => {
      // Only save if not already saved or if it has been modified
      if (!pkg.isSaved && pkg.eventType && pkg.startDate) {
        const eventUuid = await saveEventToDatabase(pkg, index);
        if (eventUuid) {
          // Update the event package with the UUID and mark as saved
          return { ...pkg, event_uuid: eventUuid, isSaved: true };
        }
      }
      return pkg;
    });

    const updatedPackages = await Promise.all(savePromises);
    setEventPackages(updatedPackages);
  };

  const handleAddEventPackage = async () => {
    // Save the last event package before adding a new one (if it has required data)
    if (eventPackages.length > 0) {
      const lastPackage = eventPackages[eventPackages.length - 1];
      // Only save if it has eventType and startDate (required fields)
      if (lastPackage.eventType && lastPackage.startDate && !lastPackage.isSaved) {
        const eventIndex = eventPackages.length - 1;
        const eventUuid = await saveEventToDatabase(lastPackage, eventIndex);
        if (eventUuid) {
          // Update the last package with UUID and mark as saved
          const updatedPackages = [...eventPackages];
          updatedPackages[eventIndex] = {
            ...lastPackage,
            event_uuid: eventUuid,
            isSaved: true,
          };
          setEventPackages(updatedPackages);
        }
      }
    }

    // Add new event package
    const newPackage: EventPackage = {
      id: Date.now().toString(),
      eventType: "",
      photographersCount: "",
      videographersCount: "",
      prepChecklist: [],
      isSaved: false,
    };
    setEventPackages([...eventPackages, newPackage]);
  };

  const handleRemoveEventPackage = (id: string) => {
    setEventPackages(eventPackages.filter((pkg) => pkg.id !== id));
  };

  // Save individual event card
  const handleSaveEventCard = async (eventId: string) => {
    const eventIndex = eventPackages.findIndex((pkg) => pkg.id === eventId);
    if (eventIndex === -1) return;

    const eventPackage = eventPackages[eventIndex];
    
    // Validate required fields
    if (!eventPackage.eventType || !eventPackage.startDate) {
      console.warn('Cannot save event: missing eventType or startDate');
      return;
    }

    const eventUuid = await saveEventToDatabase(eventPackage, eventIndex);
    if (eventUuid) {
      // Update the event package with the UUID and mark as saved
      const updatedPackages = [...eventPackages];
      updatedPackages[eventIndex] = {
        ...eventPackage,
        event_uuid: eventUuid,
        isSaved: true,
      };
      setEventPackages(updatedPackages);
    }
  };

  const handleEditPackageName = (id: string) => {
    setEditingPackageNameId(id);
  };

  const handleSavePackageName = (id: string, newName: string) => {
    handleEventPackageChange(id, "packageName", newName || undefined);
    setEditingPackageNameId(null);
  };

  // Save event card data to sessionStorage
  const saveEventCardToSessionStorage = (eventPackage: EventPackage) => {
    try {
      const eventCardData = {
        id: eventPackage.id,
        eventType: eventPackage.eventType,
        customEventTypeName: eventPackage.customEventTypeName,
        photographersCount: eventPackage.photographersCount,
        photographyWorkdays: eventPackage.photographyWorkdays,
        videographersCount: eventPackage.videographersCount,
        videographyWorkdays: eventPackage.videographyWorkdays,
        startDate: eventPackage.startDate?.toISOString(),
        startHour: eventPackage.startHour,
        startMinute: eventPackage.startMinute,
        daysCount: eventPackage.daysCount,
        photographyCoordinatorId: eventPackage.photographyCoordinatorId,
        videographyCoordinatorId: eventPackage.videographyCoordinatorId,
        deliverablesNotes: eventPackage.deliverablesNotes,
        savedDeliverablesNotes: eventPackage.savedDeliverablesNotes,
        prepChecklist: eventPackage.prepChecklist,
        packageName: eventPackage.packageName,
        event_uuid: eventPackage.event_uuid,
        isSaved: eventPackage.isSaved,
      };
      
      const allEventCards = JSON.parse(sessionStorage.getItem('eventCardsData') || '{}');
      allEventCards[eventPackage.id] = eventCardData;
      sessionStorage.setItem('eventCardsData', JSON.stringify(allEventCards));
    } catch (error) {
      console.error('Error saving event card to sessionStorage:', error);
    }
  };

  const handleEventPackageChange = (id: string, field: keyof EventPackage, value: string | Date | ChecklistItem[] | undefined) => {
    // When certain fields change, mark the event as unsaved so it gets saved again
    const fieldsThatRequireResave = ['eventType', 'startDate', 'startHour', 'startMinute', 
      'photographyCoordinatorId', 'videographyCoordinatorId', 'photographersCount', 
      'videographersCount', 'deliverablesNotes', 'prepChecklist', 'daysCount', 
      'photographyWorkdays', 'videographyWorkdays'];
    
    setEventPackages(
      eventPackages.map((pkg) => {
        if (pkg.id === id) {
          const updated = { ...pkg, [field]: value };
          // Mark as unsaved if a significant field changed
          if (fieldsThatRequireResave.includes(field)) {
            updated.isSaved = false;
          }
          // Auto-save to sessionStorage
          saveEventCardToSessionStorage(updated);
          return updated;
        }
        return pkg;
      })
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
    // Toggle normally for all events (including last event)
    const newExpandedId = expandedEventId === eventId ? null : eventId;
    setExpandedEventId(newExpandedId);
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
      // Mark event as unsaved so it gets saved to database
      handleEventPackageChange(eventId, "isSaved", false);
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

  // Calculate event-wise cost breakdown
  // PDF Editing Functions
  const loadPdfWithPriceCard = async () => {
    try {
      const { actualPrice, subtotal, gst, total } = calculatePrice();
      
      // Fetch the original PDF
      const response = await fetch(selectedPdfPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      
      // Load PDF
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Add a new page for price card
      const pricePage = pdfDoc.addPage([595, 842]); // A4 size
      const { width, height } = pricePage.getSize();
      
      // Start from top of page (PDF coordinates: y=0 is bottom, y=height is top)
      let currentY = height - 50; // Start 50 points from top
      
      // Title
      pricePage.drawText("Price Summary", {
        x: 70,
        y: currentY,
        size: 24,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      
      currentY -= 40; // Move down for price details
      
      // Draw price card background (positioned below title)
      const cardY = currentY - 200; // Card height will be 200
      pricePage.drawRectangle({
        x: 50,
        y: cardY,
        width: width - 100,
        height: 200,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 2,
        color: rgb(0.98, 0.98, 0.98),
      });
      
      // Price details
      const priceDetails = [
        { label: "Actual Price:", value: `₹${actualPrice.toLocaleString()}` },
        { label: "Sub Total:", value: `₹${subtotal.toLocaleString()}` },
        { label: "GST (18%):", value: `₹${gst.toLocaleString()}` },
      ];
      
      // Draw price details inside the card
      let yPos = currentY - 20;
      priceDetails.forEach((detail) => {
        pricePage.drawText(detail.label, {
          x: 70,
          y: yPos,
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        
        pricePage.drawText(detail.value, {
          x: width - 200,
          y: yPos,
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        
        yPos -= 30;
      });
      
      // Draw separator line before total
      pricePage.drawLine({
        start: { x: 70, y: yPos - 10 },
        end: { x: width - 70, y: yPos - 10 },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7),
      });
      
      yPos -= 20;
      
      // Total Price (larger and bold)
      pricePage.drawText("Total Price:", {
        x: 70,
        y: yPos,
        size: 16,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      
      pricePage.drawText(`₹${total.toLocaleString()}`, {
        x: width - 200,
        y: yPos,
        size: 18,
        font: helveticaBold,
        color: rgb(0, 0.4, 0.8),
      });
      
      yPos -= 50;
      
      // Add editable text area label
      pricePage.drawText("Additional Notes:", {
        x: 70,
        y: yPos,
        size: 14,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      
      // Draw a box for additional notes
      pricePage.drawRectangle({
        x: 70,
        y: yPos - 100,
        width: width - 140,
        height: 80,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 1,
        color: rgb(1, 1, 1),
      });
      
      // Save PDF as blob
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setEditedPdfBlob(blob);
      
      console.log("PDF with price card created successfully");
      return blob;
    } catch (error) {
      console.error("Error loading PDF with price card:", error);
      throw error;
    }
  };

  const handleEditPdf = async () => {
    setIsEditingPdf(true);
    try {
      // Load PDF with price card if not already loaded
      let blob = editedPdfBlob;
      if (!blob) {
        blob = await loadPdfWithPriceCard();
        setEditedPdfBlob(blob);
      }
      
      // Initialize editable prices from current calculated values
      const { actualPrice, subtotal, gst, total } = calculatePrice();
      setEditablePrices({
        actualPrice: actualPrice.toLocaleString(),
        subtotal: subtotal.toLocaleString(),
        gst: gst.toLocaleString(),
        total: total.toLocaleString(),
      });
      
      // Show the PDF in viewer
      const url = URL.createObjectURL(blob);
      setSelectedPdfPath(url);
      setPdfEditText(""); // Initialize with empty text or load from saved state
    } catch (error) {
      console.error("Error editing PDF:", error);
    }
  };

  const handleSavePdf = async () => {
    try {
      // Ensure we have a blob to work with
      let workingBlob = editedPdfBlob;
      if (!workingBlob) {
        workingBlob = await loadPdfWithPriceCard();
        setEditedPdfBlob(workingBlob);
      }
      
      // Create a new PDF with edited text and prices
      const arrayBuffer = await workingBlob.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Get the last page (price card page)
      const pages = pdfDoc.getPages();
      const pricePage = pages[pages.length - 1];
      const { width, height } = pricePage.getSize();
      
      // Clear and redraw the entire price card section with updated values
      let currentY = height - 50;
      
      // Redraw title
      pricePage.drawText("Price Summary", {
        x: 70,
        y: currentY,
        size: 24,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      
      currentY -= 40;
      
      // Redraw price card background
      const cardY = currentY - 200;
      pricePage.drawRectangle({
        x: 50,
        y: cardY,
        width: width - 100,
        height: 200,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 2,
        color: rgb(0.98, 0.98, 0.98),
      });
      
      // Parse editable prices (remove commas and convert to numbers)
      const actualPriceValue = editablePrices.actualPrice.replace(/,/g, '') || calculatePrice().actualPrice.toString();
      const subtotalValue = editablePrices.subtotal.replace(/,/g, '') || calculatePrice().subtotal.toString();
      const gstValue = editablePrices.gst.replace(/,/g, '') || calculatePrice().gst.toString();
      const totalValue = editablePrices.total.replace(/,/g, '') || calculatePrice().total.toString();
      
      // Format prices with commas
      const formatPrice = (value: string) => {
        const num = parseFloat(value) || 0;
        return `₹${num.toLocaleString()}`;
      };
      
      // Draw updated price details
      const priceDetails = [
        { label: "Actual Price:", value: formatPrice(actualPriceValue) },
        { label: "Sub Total:", value: formatPrice(subtotalValue) },
        { label: "GST (18%):", value: formatPrice(gstValue) },
      ];
      
      let yPos = currentY - 20;
      priceDetails.forEach((detail) => {
        pricePage.drawText(detail.label, {
          x: 70,
          y: yPos,
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        
        pricePage.drawText(detail.value, {
          x: width - 200,
          y: yPos,
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        
        yPos -= 30;
      });
      
      // Draw separator line
      pricePage.drawLine({
        start: { x: 70, y: yPos - 10 },
        end: { x: width - 70, y: yPos - 10 },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7),
      });
      
      yPos -= 20;
      
      // Draw updated total
      pricePage.drawText("Total Price:", {
        x: 70,
        y: yPos,
        size: 16,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      
      pricePage.drawText(formatPrice(totalValue), {
        x: width - 200,
        y: yPos,
        size: 18,
        font: helveticaBold,
        color: rgb(0, 0.4, 0.8),
      });
      
      yPos -= 50;
      
      // Draw additional notes label
      pricePage.drawText("Additional Notes:", {
        x: 70,
        y: yPos,
        size: 14,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      
      // Draw notes box
      pricePage.drawRectangle({
        x: 70,
        y: yPos - 100,
        width: width - 140,
        height: 80,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 1,
        color: rgb(1, 1, 1),
      });
      
      // Add edited text if provided
      if (pdfEditText.trim()) {
        const lines = pdfEditText.split('\n');
        let textY = yPos - 20;
        
        lines.forEach((line, index) => {
          if (index < 5) { // Limit to 5 lines
            pricePage.drawText(line, {
              x: 80,
              y: textY,
              size: 11,
              font: helveticaFont,
              color: rgb(0, 0, 0),
              maxWidth: width - 160,
            });
            textY -= 15;
          }
        });
      }
      
      // Save updated PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setEditedPdfBlob(blob);
      
      // Update preview
      const url = URL.createObjectURL(blob);
      setSelectedPdfPath(url);
      
      setIsEditingPdf(false);
      console.log("PDF saved successfully with edited text and prices");
    } catch (error) {
      console.error("Error saving PDF:", error);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      let blob = editedPdfBlob;
      
      // If no edited PDF exists, create one
      if (!blob) {
        blob = await loadPdfWithPriceCard();
      }
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `quotation_${formData.projectName || "project"}_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  const handlePreviewPdf = async () => {
    setIsPreviewMode(true);
    try {
      let blob = editedPdfBlob;
      
      // If no edited PDF exists, create one
      if (!blob) {
        blob = await loadPdfWithPriceCard();
      }
      
      const url = URL.createObjectURL(blob);
      setSelectedPdfPath(url);
    } catch (error) {
      console.error("Error previewing PDF:", error);
    }
  };

  // Auto-load PDF with price card when Standard Wedding is selected on Page 3
  useEffect(() => {
    if (currentPage === 3 && selectedFormat === "standard_wedding.pdf" && !editedPdfBlob && !isEditingPdf) {
      loadPdfWithPriceCard().then((blob) => {
        const url = URL.createObjectURL(blob);
        setSelectedPdfPath(url);
      }).catch(console.error);
    }
  }, [currentPage, selectedFormat, editedPdfBlob, isEditingPdf]);

  const calculateEventWiseCosts = () => {
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

    return eventPackages
      .filter((pkg) => pkg.eventType && pkg.photographersCount && pkg.videographersCount)
      .map((pkg, index) => {
        const photographers = parseInt(pkg.photographersCount || '0', 10) || 0;
        const videographers = parseInt(pkg.videographersCount || '0', 10) || 0;
        const multiplier = eventTypeMultiplier[pkg.eventType] || 1.0;
        const packagePrice =
          (photographers * basePricePerPhotographer + videographers * basePricePerVideographer) *
          multiplier;
        const packageGst = packagePrice * 0.18;
        const packageTotal = packagePrice + packageGst;

        return {
          eventName: pkg.packageName || `Event Package ${index + 1}`,
          eventType: pkg.eventType,
          photographers,
          videographers,
          basePrice: packagePrice,
          gst: packageGst,
          total: packageTotal,
        };
      });
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

  const handleSaveEvent = async (isSubmit: boolean = false) => {
    if (!projectEstimateUuid) {
      alert('Project UUID not found. Please go back to Page 1 and click Next.');
      return;
    }

    // Validate and save all event cards with valid data
    setIsSavingEvents(true);
    
    try {
      // Filter valid event cards (must have eventType and startDate)
      const validEventCards = eventPackages.filter(
        (pkg) => pkg.eventType && pkg.startDate
      );

      if (validEventCards.length === 0) {
        alert('No valid event cards to save. Please add at least one event with Event Type and Start Date.');
        setIsSavingEvents(false);
        return;
      }

      // Save events sequentially
      const updatedPackages = [...eventPackages];
      let savedCount = 0;
      let failedCount = 0;

      for (let i = 0; i < validEventCards.length; i++) {
        const pkg = validEventCards[i];
        const eventIndex = eventPackages.findIndex((ep) => ep.id === pkg.id);
        
        if (eventIndex === -1) continue;

        const eventUuid = await saveEventToDatabase(pkg, eventIndex);
        
        if (eventUuid) {
          // Update the event package with the UUID and mark as saved
          updatedPackages[eventIndex] = {
            ...pkg,
            event_uuid: eventUuid,
            isSaved: true,
          };
          savedCount++;
        } else {
          failedCount++;
        }
      }

      // Update state with all saved events
      setEventPackages(updatedPackages);

      // Update draft status
      if (projectEstimateUuid) {
        if (isSubmit) {
          // When submitting, set is_drafted = false
          const { data, error } = await supabase.rpc('update_project_draft_status', {
            p_project_estimate_uuid: projectEstimateUuid,
            p_is_drafted: false,
            p_drafted_json: null, // Clear draft data on submit
          });

          if (error) {
            console.error('Error updating draft status:', error);
            alert(`Error: ${error.message || 'Failed to submit project'}`);
            setIsSavingEvents(false);
            return;
          }

          if (data && data.success) {
            console.log('Project submitted successfully (is_drafted = false)');
          }
        } else {
          // When saving (not submitting), update drafted_json but keep is_drafted = true
          const draftedJson = buildDraftedJson();
          const { data, error } = await supabase.rpc('update_project_draft_status', {
            p_project_estimate_uuid: projectEstimateUuid,
            p_is_drafted: true,
            p_drafted_json: draftedJson as any,
          });

          if (error) {
            console.warn('Failed to update draft status:', error);
          } else if (data && data.success) {
            console.log('Draft saved successfully');
          }
        }
      }

      // Show success message
      if (savedCount > 0) {
        if (failedCount > 0) {
          alert(`${savedCount} event(s) saved successfully. ${failedCount} event(s) failed to save.`);
        } else {
          alert(`${savedCount} event(s) saved successfully!`);
        }
      } else {
        alert('Failed to save events. Please check the console for errors.');
      }
    } catch (error: any) {
      console.error('Exception saving events:', error);
      alert(`Error: ${error.message || 'Failed to save events'}`);
    } finally {
      setIsSavingEvents(false);
    }
    
    // Only clear sessionStorage and navigate if submitting (isSubmit = true)
    if (isSubmit) {
      // Clear sessionStorage after successful submit
      try {
        sessionStorage.removeItem("newProjectFormData");
        sessionStorage.removeItem("newProjectCurrentPage");
        sessionStorage.removeItem("newProjectEventPackages");
        sessionStorage.removeItem("newProjectSelectedFormat");
        sessionStorage.removeItem("newProjectEstimateUuid");
        sessionStorage.removeItem("newProjectPhotographyOwnerPhno");
        sessionStorage.removeItem("newProjectName");
        sessionStorage.removeItem("newProjectType");
        sessionStorage.removeItem("newProjectLastModified");
      } catch (error) {
        console.error("Error clearing sessionStorage:", error);
      }
      
      alert("Project submitted successfully!");
      navigate("/estimates/projects");
    } else {
      // Stay on the current page (Page 2) after saving events
      // Don't navigate - allow user to proceed to next page for quote documentation
      // Don't clear sessionStorage - keep the data for the next page
      console.log("Events saved successfully. Staying on Events Details page.");
    }
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
                      <Label className="text-left block">Project Owner</Label>
                      <Input
                        value={loadingOwner ? "Loading..." : (photographyOwner?.photography_owner_name || "Not available")}
                        disabled
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-left block">Project Owner PhNo</Label>
                      <Input
                        value={loadingOwner ? "Loading..." : (photographyOwner?.photography_owner_phno || "Not available")}
                        disabled
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-left block">Project Owner Email Id</Label>
                      <Input
                        value={loadingOwner ? "Loading..." : (photographyOwner?.photography_owner_email || "Not available")}
                        disabled
                        className="bg-background"
                      />
                    </div>
                  </div>
                  <h2 className="text-2xl font-semibold mb-6">Add New Client Booking</h2>
                  <div className="space-y-6">

              {/* Project Name and Project Type Row */}
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
                    Project Type <span className="text-red-500">*</span>
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

              {/* Client Name, Email, and Phone Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientFullName">Client Name:</Label>
                  <Input
                    id="clientFullName"
                    placeholder="Enter client name"
                    value={formData.clientFullName}
                    onChange={(e) => handleInputChange("clientFullName", e.target.value)}
                    className="w-full max-w-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client Email:</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.clientEmail}
                    onChange={(e) => handleInputChange("clientEmail", e.target.value)}
                    className={cn(
                      "w-full max-w-xs",
                      formData.clientEmail && !isValidEmail(formData.clientEmail) ? "border-red-300" : ""
                    )}
                  />
                  {formData.clientEmail && !isValidEmail(formData.clientEmail) && (
                    <p className="text-xs text-red-500">
                      Email must contain '@' symbol and a valid domain name (e.g., example@domain.com)
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">
                    Client Ph: <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="clientPhone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.clientPhone}
                    onChange={(e) => handleClientPhoneChange(e.target.value)}
                    required
                    className={cn(
                      "w-full max-w-xs",
                      !isPage1Valid() && formData.clientPhone.length < 14 ? "border-red-300" : ""
                    )}
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
                <div className="grid grid-cols-12 gap-1 items-end">
                  {/* Date Selection - Narrower */}
                  <div className="col-span-3 max-w-[70%]">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="startDate"
                          variant="outline"
                          className={cn(
                            "inline-flex items-center gap-1 sm:gap-2 whitespace-nowrap rounded-md text-xs sm:text-sm md:text-base ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:h-3 [&_svg]:w-3 sm:[&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 w-full justify-start text-left font-normal",
                            !formData.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          {formData.startDate ? (
                            format(formData.startDate, "MM/dd/yyyy")
                          ) : (
                            <span className="text-xs sm:text-sm">mm/dd/yyyy</span>
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
                  <div className="col-span-6 flex items-end gap-2 sm:gap-3 -ml-8 md:-ml-6 sm:-ml-4">
                    <div className="flex items-center gap-2 sm:gap-3 pb-0.5 sm:pb-1">
                      <Label 
                        htmlFor="confirmationStatus" 
                        className={cn(
                          "font-normal cursor-pointer whitespace-nowrap text-xs sm:text-sm md:text-base transition-colors",
                          formData.confirmationStatus ? "text-green-600" : "text-gray-500"
                        )}
                      >
                        Confirmed
                      </Label>
                      <Switch
                        id="confirmationStatus"
                        checked={formData.confirmationStatus}
                        onCheckedChange={(checked) => handleInputChange("confirmationStatus", checked)}
                        className={cn(
                          "data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400"
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* End Date & Time */}
              <div className="space-y-2">
                <Label>Project End Date & Time</Label>
                <div className="grid grid-cols-12 gap-1 items-end">
                  {/* Date Selection - Narrower */}
                  <div className="col-span-3 max-w-[70%]">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="endDate"
                          variant="outline"
                          className={cn(
                            "inline-flex items-center gap-1 sm:gap-2 whitespace-nowrap rounded-md text-xs sm:text-sm md:text-base ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:h-3 [&_svg]:w-3 sm:[&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 w-full justify-start text-left font-normal",
                            !formData.endDate && "text-muted-foreground",
                            (() => {
                              if (!formData.endDate || !formData.startDate) return false;
                              const startDateOnly = new Date(formData.startDate);
                              startDateOnly.setHours(0, 0, 0, 0);
                              const endDateOnly = new Date(formData.endDate);
                              endDateOnly.setHours(0, 0, 0, 0);
                              return endDateOnly < startDateOnly;
                            })() && "border-red-300"
                          )}
                        >
                          <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          {formData.endDate ? (
                            format(formData.endDate, "MM/dd/yyyy")
                          ) : (
                            <span className="text-xs sm:text-sm">mm/dd/yyyy</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.endDate}
                          onSelect={(date) => handleInputChange("endDate", date)}
                          disabled={(date) => {
                            if (!formData.startDate) return false;
                            const startDateOnly = new Date(formData.startDate);
                            startDateOnly.setHours(0, 0, 0, 0);
                            const checkDate = new Date(date);
                            checkDate.setHours(0, 0, 0, 0);
                            return checkDate < startDateOnly;
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    {(() => {
                      if (!formData.endDate || !formData.startDate) return null;
                      const startDateOnly = new Date(formData.startDate);
                      startDateOnly.setHours(0, 0, 0, 0);
                      const endDateOnly = new Date(formData.endDate);
                      endDateOnly.setHours(0, 0, 0, 0);
                      if (endDateOnly < startDateOnly) {
                        return (
                          <p className="text-xs text-red-500 mt-1">
                            End date cannot be before start date
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Time Picker Clock */}
                  <div className="col-span-3 max-w-[70%]">
                    <TimePickerClock
                      hour={formData.endHour || "00"}
                      minute={formData.endMinute || "00"}
                      onHourChange={(h) => handleInputChange("endHour", h)}
                      onMinuteChange={(m) => handleInputChange("endMinute", m)}
                    />
                  </div>

                  {/* Confirmation Status */}
                  <div className="col-span-6 flex items-end gap-2 sm:gap-3 -ml-8 md:-ml-6 sm:-ml-4">
                    <div className="flex items-center gap-2 sm:gap-3 pb-0.5 sm:pb-1">
                      <Label 
                        htmlFor="endConfirmationStatus" 
                        className={cn(
                          "font-normal cursor-pointer whitespace-nowrap text-xs sm:text-sm md:text-base transition-colors",
                          formData.endConfirmationStatus ? "text-green-600" : "text-gray-500"
                        )}
                      >
                        Confirmed
                      </Label>
                      <Switch
                        id="endConfirmationStatus"
                        checked={formData.endConfirmationStatus}
                        onCheckedChange={(checked) => handleInputChange("endConfirmationStatus", checked)}
                        className={cn(
                          "data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400"
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleNext}
                  disabled={!isPage1Valid() || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating Project...' : 'Next'}
                  {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
                  </div>
                </>
              ) : currentPage === 2 ? (
                <>
                  {/* Event Details Page */}
                  {/* 
                    Available from sessionStorage for use in Page 2:
                    - projectEstimateUuid (project_uuid): stored in state and sessionStorage
                    - photographyOwner?.photography_owner_phno: available from state or sessionStorage
                    - formData.projectName (project_name): available from formData state
                    - formData.eventType (project_type): available from formData state
                    
                    Access via:
                    - projectEstimateUuid (state variable)
                    - sessionStorage.getItem('newProjectEstimateUuid')
                    - sessionStorage.getItem('newProjectPhotographyOwnerPhno')
                    - sessionStorage.getItem('newProjectName')
                    - sessionStorage.getItem('newProjectType')
                  */}
                  <div className="mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-2xl font-semibold">Events Details</h2>
                        <div className="flex flex-wrap items-center gap-2 text-sm mt-2">
                          <span className="font-medium">Project:</span>
                          <span className="text-muted-foreground">{formData.projectName || "Not set"}</span>
                          <span className="text-muted-foreground">|</span>
                          <span className="font-medium">Project Type:</span>
                          <span className="text-muted-foreground">{projectDetails?.project_type || formData.eventType || "Not set"}</span>
                          <span className="text-muted-foreground">|</span>
                          <span className="font-medium">StartDate:</span>
                          <span className="text-muted-foreground">
                            {formData.startDate ? format(formData.startDate, "MM/dd/yyyy") : "Not set"}
                          </span>
                          <span className="text-muted-foreground">|</span>
                          <span className="font-medium">EndDate:</span>
                          <span className="text-muted-foreground">
                            {formData.endDate ? format(formData.endDate, "MM/dd/yyyy") : "Not set"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => handleSaveEvent(false)} 
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={isSavingEvents}
                        >
                          {isSavingEvents ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving Events...
                            </>
                          ) : (
                            'Save Events'
                          )}
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

                  <div className="space-y-4">
                    {/* Event Packages */}
                    <div className="flex flex-wrap gap-4 justify-start items-start">
                      {eventPackages.map((pkg, index) => {
                        const isActiveEvent = index === eventPackages.length - 1; // Last event is the active one
                        const isExpanded = expandedEventId === pkg.id;
                        
                        return (
                          <Card 
                            key={pkg.id} 
                            className="p-4 w-[45%] relative"
                            onClick={(e) => {
                              // Only save if clicking on the card itself (white space), not on interactive elements
                              const target = e.target as HTMLElement;
                              // Check if click is on the card container or non-interactive elements
                              if (target.closest('.p-4') && 
                                  !target.closest('button') && 
                                  !target.closest('input') && 
                                  !target.closest('select') && 
                                  !target.closest('[role="button"]') &&
                                  !target.closest('[role="combobox"]') &&
                                  !target.closest('[role="option"]')) {
                                saveEventCardToSessionStorage(pkg);
                              }
                            }}
                          >
                            {/* Green dot indicator for saved events */}
                            {pkg.event_uuid && (
                              <div className="absolute top-2 left-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" 
                                   title="Event saved to database" />
                            )}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                {editingPackageNameId === pkg.id ? (
                                  <Input
                                    defaultValue={pkg.packageName || `Event Package ${index + 1}`}
                                    onBlur={(e) => handleSavePackageName(pkg.id, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleSavePackageName(pkg.id, e.currentTarget.value);
                                      } else if (e.key === "Escape") {
                                        setEditingPackageNameId(null);
                                      }
                                    }}
                                    autoFocus
                                    className="font-medium h-8 w-auto min-w-[150px]"
                                  />
                                ) : (
                                  <h3 
                                    className="font-medium cursor-pointer hover:text-primary"
                                    onClick={() => handleEditPackageName(pkg.id)}
                                  >
                                    {pkg.packageName || `Event Package ${index + 1}`}
                                  </h3>
                                )}
                                <div className="flex items-center gap-2">
                                  {!isActiveEvent && (
                                    <button
                                      onClick={() => toggleEventDetails(pkg.id)}
                                      disabled={isExpanded}
                                      className={`p-1 rounded transition-colors ${
                                        isExpanded 
                                          ? 'opacity-50 cursor-not-allowed' 
                                          : 'hover:bg-accent'
                                      }`}
                                      aria-label="Edit event"
                                      title={isExpanded ? "Save changes first" : "Edit event"}
                                    >
                                      <Pencil className={`h-4 w-4 ${
                                        isExpanded 
                                          ? 'text-muted-foreground' 
                                          : 'text-muted-foreground hover:text-foreground'
                                      }`} />
                                    </button>
                                  )}
                                  {!isExpanded && pkg.daysCount && (
                                    <span className="text-sm text-muted-foreground">
                                      Days {pkg.daysCount}
                                    </span>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleEventDetails(pkg.id)}
                                    className="h-8"
                                  >
                                    Details
                                    {isExpanded ? (
                                      <ChevronUp className="ml-2 h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="ml-2 h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSaveEventCard(pkg.id)}
                                    className={`${
                                      isExpanded && pkg.eventType && pkg.startDate
                                        ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                        : 'text-muted-foreground opacity-50'
                                    }`}
                                    disabled={!isExpanded || !pkg.eventType || !pkg.startDate}
                                    title={
                                      !isExpanded 
                                        ? "Expand event card to save" 
                                        : (!pkg.eventType || !pkg.startDate)
                                        ? "Fill required fields to save"
                                        : "Save event card"
                                    }
                                  >
                                    <Save className="h-4 w-4" />
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
                              
                              {/* Show input boxes for active event, or collapsed view for completed events */}
                              {isActiveEvent ? (
                                // Active event - show input boxes
                                <div className="space-y-4">
                                  {/* First row: Event Type */}
                                  <div className="flex items-center gap-4 w-full">
                                    <div className="w-1/2">
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
                                    {pkg.eventType === "other" && (
                                      <div className="flex-1">
                                        <Input
                                          id={`customEventType-${pkg.id}`}
                                          type="text"
                                          placeholder="Enter event type name"
                                          value={pkg.customEventTypeName || ""}
                                          onChange={(e) =>
                                            handleEventPackageChange(pkg.id, "customEventTypeName", e.target.value)
                                          }
                                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {/* Second row: PGs No, PGDays, VGs No, VGDays */}
                                  <div className="grid grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor={`photographers-${pkg.id}`} className="text-sm font-medium leading-none">PGs No</Label>
                                      <Input
                                        id={`photographers-${pkg.id}`}
                                        type="number"
                                        min="0"
                                        placeholder="PGs No"
                                        value={pkg.photographersCount}
                                        onChange={(e) =>
                                          handleEventPackageChange(
                                            pkg.id,
                                            "photographersCount",
                                            e.target.value
                                          )
                                        }
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`photographyWorkdays-${pkg.id}`} className="text-sm font-medium leading-none">PGDays</Label>
                                      <Input
                                        id={`photographyWorkdays-${pkg.id}`}
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        placeholder="PGDays"
                                        value={pkg.photographyWorkdays || ""}
                                        onChange={(e) => handleEventPackageChange(pkg.id, "photographyWorkdays", e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`videographers-${pkg.id}`} className="text-sm font-medium leading-none">VGs No</Label>
                                      <Input
                                        id={`videographers-${pkg.id}`}
                                        type="number"
                                        min="0"
                                        placeholder="VGs No"
                                        value={pkg.videographersCount}
                                        onChange={(e) =>
                                          handleEventPackageChange(
                                            pkg.id,
                                            "videographersCount",
                                            e.target.value
                                          )
                                        }
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`videographyWorkdays-${pkg.id}`} className="text-sm font-medium leading-none">VGDays</Label>
                                      <Input
                                        id={`videographyWorkdays-${pkg.id}`}
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        placeholder="VGDays"
                                        value={pkg.videographyWorkdays || ""}
                                        onChange={(e) => handleEventPackageChange(pkg.id, "videographyWorkdays", e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                // Completed event - show editable fields when expanded, read-only when collapsed
                                <div className="space-y-4">
                                  {isExpanded ? (
                                    // Expanded (edit mode) - show editable input fields
                                    <>
                                      {/* First row: Event Type */}
                                      <div className="flex items-center gap-4 w-full">
                                        <div className="w-1/2">
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
                                        {pkg.eventType === "other" && (
                                          <div className="flex-1">
                                            <Input
                                              id={`customEventType-${pkg.id}`}
                                              type="text"
                                              placeholder="Enter event type name"
                                              value={pkg.customEventTypeName || ""}
                                              onChange={(e) =>
                                                handleEventPackageChange(pkg.id, "customEventTypeName", e.target.value)
                                              }
                                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                            />
                                          </div>
                                        )}
                                      </div>

                                      {/* Second row: PGs No, PGDays, VGs No, VGDays */}
                                      <div className="grid grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor={`photographers-${pkg.id}`} className="text-sm font-medium leading-none">PGs No</Label>
                                          <Input
                                            id={`photographers-${pkg.id}`}
                                            type="number"
                                            min="0"
                                            placeholder="PGs No"
                                            value={pkg.photographersCount}
                                            onChange={(e) =>
                                              handleEventPackageChange(
                                                pkg.id,
                                                "photographersCount",
                                                e.target.value
                                              )
                                            }
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`photographyWorkdays-${pkg.id}`} className="text-sm font-medium leading-none">PGDays</Label>
                                          <Input
                                            id={`photographyWorkdays-${pkg.id}`}
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            placeholder="PGDays"
                                            value={pkg.photographyWorkdays || ""}
                                            onChange={(e) => handleEventPackageChange(pkg.id, "photographyWorkdays", e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`videographers-${pkg.id}`} className="text-sm font-medium leading-none">VGs No</Label>
                                          <Input
                                            id={`videographers-${pkg.id}`}
                                            type="number"
                                            min="0"
                                            placeholder="VGs No"
                                            value={pkg.videographersCount}
                                            onChange={(e) =>
                                              handleEventPackageChange(
                                                pkg.id,
                                                "videographersCount",
                                                e.target.value
                                              )
                                            }
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`videographyWorkdays-${pkg.id}`} className="text-sm font-medium leading-none">VGDays</Label>
                                          <Input
                                            id={`videographyWorkdays-${pkg.id}`}
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            placeholder="VGDays"
                                            value={pkg.videographyWorkdays || ""}
                                            onChange={(e) => handleEventPackageChange(pkg.id, "videographyWorkdays", e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                          />
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    // Collapsed view - show read-only values
                                    <>
                                      {/* First row: Event Type with Date and Cost */}
                                      <div className="w-full">
                                        <div className="flex items-center gap-4 text-sm flex-wrap">
                                          <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">Event Type:</span>
                                            <span className="font-medium capitalize">
                                              {pkg.eventType === "other" && pkg.customEventTypeName
                                                ? pkg.customEventTypeName
                                                : pkg.eventType || "Not set"}
                                            </span>
                                          </div>
                                          {pkg.startDate && (
                                            <div className="flex items-center gap-2">
                                              <span className="text-muted-foreground">On:</span>
                                              <span className="font-medium">{format(pkg.startDate, "MMM dd, yyyy")}</span>
                                            </div>
                                          )}
                                          <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">Cost:</span>
                                            <span className="font-medium">₹{(() => {
                                              // Calculate cost for this event package using same logic as calculateEventWiseCosts
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
                                              
                                              if (pkg.eventType && pkg.photographersCount && pkg.videographersCount) {
                                                const photographers = parseInt(pkg.photographersCount, 10) || 0;
                                                const videographers = parseInt(pkg.videographersCount, 10) || 0;
                                                const multiplier = eventTypeMultiplier[pkg.eventType] || 1.0;
                                                const packagePrice =
                                                  (photographers * basePricePerPhotographer + videographers * basePricePerVideographer) *
                                                  multiplier;
                                                return packagePrice.toLocaleString("en-IN");
                                              }
                                              return "0";
                                            })()}</span>
                                          </div>
                                        </div>
                                      </div>
                                      {/* Second row: PGs No, PGDays, VGs No, VGDays */}
                                      <div className="grid grid-cols-4 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                          <span className="text-muted-foreground">PGs No:</span>
                                          <span className="font-medium">{pkg.photographersCount || "0"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-muted-foreground">PGDays:</span>
                                          <span className="font-medium">{pkg.photographyWorkdays || "0"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-muted-foreground">VGs No:</span>
                                          <span className="font-medium">{pkg.videographersCount || "0"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-muted-foreground">VGDays:</span>
                                          <span className="font-medium">{pkg.videographyWorkdays || "0"}</span>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}

                            {/* Expanded Details Section - Show when Details is clicked */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t space-y-4">
                                {/* Start Date & Time */}
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium leading-none max-w-fit">Event StartDate & Time</Label>
                                  <div className="flex items-end gap-4">
                                    {/* Date Selection */}
                                    <div className="flex-shrink-0">
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            className={cn(
                                              "inline-flex items-center gap-1 sm:gap-2 whitespace-nowrap rounded-md text-xs sm:text-sm md:text-base ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:h-3 [&_svg]:w-3 sm:[&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 w-full justify-start text-left font-normal",
                                              !pkg.startDate && "text-muted-foreground"
                                            )}
                                          >
                                            <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                            {pkg.startDate ? (
                                              format(pkg.startDate, "MM/dd/yyyy")
                                            ) : (
                                              <span className="text-xs sm:text-sm">mm/dd/yyyy</span>
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

                                    {/* Time Picker Clock - Same as Project Start Time */}
                                    <div className="flex-shrink-0">
                                      <TimePickerClock
                                        hour={pkg.startHour || "00"}
                                        minute={pkg.startMinute || "00"}
                                        onHourChange={(h) => handleEventPackageChange(pkg.id, "startHour", h)}
                                        onMinuteChange={(m) => handleEventPackageChange(pkg.id, "startMinute", m)}
                                      />
                                    </div>

                                    {/* Days Count Input */}
                                    <div className="flex-shrink-0 space-y-2">
                                      <Label htmlFor={`daysCount-${pkg.id}`} className="text-sm font-medium leading-none">Days No.</Label>
                                      <Input
                                        id={`daysCount-${pkg.id}`}
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        placeholder="Days No."
                                        value={pkg.daysCount || ""}
                                        onChange={(e) => handleEventPackageChange(pkg.id, "daysCount", e.target.value)}
                                        className="w-24"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* PhotoPOC & VideoPOC */}
                                <div className="grid grid-cols-2 gap-4 items-start">
                                  <div className="space-y-2">
                                    <Label htmlFor={`photoCoordinator-${pkg.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 whitespace-nowrap max-w-fit">PhotoPOC</Label>
                                    <div className="flex items-end gap-2">
                                      {pkg.photographyCoordinatorId ? (
                                        <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50 flex-1 w-[60%]">
                                          <div className="flex-1">
                                            <div className="font-medium text-sm">
                                              {photographers.find(p => p.photographer_phno === pkg.photographyCoordinatorId)?.photographer_name || 'Photographer'}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                              <Phone className="h-3 w-3" />
                                              {pkg.photographyCoordinatorId}
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
                                          disabled={loadingPhotographers}
                                        >
                                          <SelectTrigger id={`photoCoordinator-${pkg.id}`} className="w-[60%]">
                                            <SelectValue placeholder={loadingPhotographers ? "Loading..." : "select POC"} />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {photographers.map((photographer) => (
                                              <SelectItem key={photographer.photographer_phno} value={photographer.photographer_phno}>
                                                {photographer.photographer_name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`videoCoordinator-${pkg.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 whitespace-nowrap max-w-fit">VideoPOC</Label>
                                    <div className="flex items-end gap-2">
                                      {pkg.videographyCoordinatorId ? (
                                        <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50 flex-1 w-[60%]">
                                          <div className="flex-1">
                                            <div className="font-medium text-sm">
                                              {videographers.find(v => v.videographer_phno === pkg.videographyCoordinatorId)?.videographer_name || 'Videographer'}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                              <Phone className="h-3 w-3" />
                                              {pkg.videographyCoordinatorId}
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
                                          disabled={loadingVideographers}
                                        >
                                          <SelectTrigger id={`videoCoordinator-${pkg.id}`} className="w-[60%]">
                                            <SelectValue placeholder={loadingVideographers ? "Loading..." : "select POC"} />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {videographers.map((videographer) => (
                                              <SelectItem key={videographer.videographer_phno} value={videographer.videographer_phno}>
                                                {videographer.videographer_name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Client Name and Phone Number */}
                                <div className="grid grid-cols-2 gap-4 items-start">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 whitespace-nowrap max-w-fit">Client Name:</Label>
                                    <Input
                                      value={loadingProjectDetails ? "Loading..." : (projectDetails?.client_name || formData.clientFullName || "Not set")}
                                      disabled
                                      className="bg-muted"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 whitespace-nowrap max-w-fit">Client Ph:</Label>
                                    <Input
                                      value={loadingProjectDetails ? "Loading..." : (projectDetails?.clientid_phno || formData.clientPhone || "Not set")}
                                      disabled
                                      className="bg-muted max-w-[200px]"
                                    />
                                  </div>
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
                                    className={cn(
                                      pkg.isEditingDeliverablesNotes === false ? "bg-muted cursor-not-allowed" : "",
                                      "w-full"
                                    )}
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
                      );
                      })}

                      {/* Add New Event Button - Position based on event count */}
                      {eventPackages.length % 2 === 1 ? (
                        // Odd number: beside right side of last event card
                        <Button
                          variant="outline"
                          onClick={handleAddEventPackage}
                          className="w-[45%] h-fit self-start"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Event
                        </Button>
                      ) : (
                        // Even number: below left side (aligned with event card width)
                        <div className="w-full">
                          <Button
                            variant="outline"
                            onClick={handleAddEventPackage}
                            className="w-[45%]"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Event
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price Summary - Bottom left, same width as event cards */}
                  <div className="w-full mt-4">
                    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 w-[45%]">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold">Price</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsPriceDetailsExpanded(!isPriceDetailsExpanded)}
                          className="h-8 px-2"
                        >
                          Details
                          {isPriceDetailsExpanded ? (
                            <ChevronUp className="ml-1 h-4 w-4" />
                          ) : (
                            <ChevronDown className="ml-1 h-4 w-4" />
                          )}
                        </Button>
                      </div>
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

                      {/* Event-wise Cost Breakdown */}
                      {isPriceDetailsExpanded && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <h4 className="font-semibold text-sm mb-3">Event-wise Cost Estimates</h4>
                          {calculateEventWiseCosts().map((eventCost, index) => (
                            <div key={index} className="bg-muted/50 rounded-md p-3 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm">{eventCost.eventName}</p>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {eventCost.eventType}
                                  </p>
                                </div>
                                <p className="font-semibold text-sm">
                                  ₹{eventCost.total.toLocaleString()}
                                </p>
                              </div>
                              <div className="text-xs space-y-1 text-muted-foreground">
                                <div className="flex justify-between">
                                  <span>
                                    {eventCost.photographers} Photographer{eventCost.photographers !== 1 ? 's' : ''} × {eventCost.videographers} Videographer{eventCost.videographers !== 1 ? 's' : ''}
                                  </span>
                                  <span>₹{eventCost.basePrice.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>GST (18%)</span>
                                  <span>₹{eventCost.gst.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {calculateEventWiseCosts().length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-2">
                              No events with complete details
                            </p>
                          )}
                        </div>
                      )}
                    </Card>
                  </div>

                  {/* Navigation Buttons */}
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
                        <Select 
                          value={selectedFormat} 
                          onValueChange={(value) => {
                            setSelectedFormat(value);
                            // Reset edited PDF when template changes
                            setEditedPdfBlob(null);
                            setIsEditingPdf(false);
                            setIsPreviewMode(false);
                            if (value === "standard_wedding.pdf") {
                              setSelectedPdfPath("/docs/test-pdfloader/file-sample_150kB.pdf");
                            } else {
                              setSelectedPdfPath(`/docs/test-pdfloader/${value}`);
                            }
                          }}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard_wedding.pdf">Standard Wedding</SelectItem>
                            <SelectItem value="file-sample_150kB.pdf">Sample Template</SelectItem>
                            <SelectItem value="premium_wedding.pdf">Premium Wedding</SelectItem>
                            <SelectItem value="corporate.pdf">Corporate</SelectItem>
                            <SelectItem value="portrait.pdf">Portrait</SelectItem>
                            <SelectItem value="event.pdf">Event</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9"
                          onClick={handleEditPdf}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9"
                          onClick={handlePreviewPdf}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700 text-white h-9" 
                          size="sm"
                          onClick={handleDownloadPdf}
                        >
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
                    <div className="border-2 border-gray-300 rounded-lg bg-white min-h-[600px] flex flex-col">
                      {isEditingPdf ? (
                        <div className="flex flex-col h-full">
                          {/* PDF Viewer */}
                          <div className="flex-1 w-full h-full border-b">
                            <iframe
                              src={selectedPdfPath}
                              className="w-full h-full min-h-[400px] border-0"
                              title="PDF Viewer"
                            />
                          </div>
                          
                          {/* Editable Form Section */}
                          <div className="p-6 bg-gray-50 border-t max-h-[400px] overflow-y-auto">
                            <div className="space-y-6">
                              {/* Price Table Editor */}
                              <div className="border rounded-lg p-4 bg-white">
                                <h3 className="font-semibold text-lg mb-4">Edit Price Summary</h3>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-actual-price">Actual Price (₹)</Label>
                                    <Input
                                      id="edit-actual-price"
                                      type="text"
                                      value={editablePrices.actualPrice}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9,]/g, '');
                                        setEditablePrices(prev => ({ ...prev, actualPrice: value }));
                                      }}
                                      placeholder="Enter actual price"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-subtotal">Sub Total (₹)</Label>
                                    <Input
                                      id="edit-subtotal"
                                      type="text"
                                      value={editablePrices.subtotal}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9,]/g, '');
                                        setEditablePrices(prev => ({ ...prev, subtotal: value }));
                                      }}
                                      placeholder="Enter subtotal"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-gst">GST (18%) (₹)</Label>
                                    <Input
                                      id="edit-gst"
                                      type="text"
                                      value={editablePrices.gst}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9,]/g, '');
                                        setEditablePrices(prev => ({ ...prev, gst: value }));
                                      }}
                                      placeholder="Enter GST amount"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-total">Total Price (₹)</Label>
                                    <Input
                                      id="edit-total"
                                      type="text"
                                      value={editablePrices.total}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9,]/g, '');
                                        setEditablePrices(prev => ({ ...prev, total: value }));
                                      }}
                                      placeholder="Enter total price"
                                      className="font-semibold"
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              {/* Additional Notes Editor */}
                              <div className="border rounded-lg p-4 bg-white">
                                <Label htmlFor="pdf-edit-text" className="mb-2 block font-semibold">
                                  Edit Additional Notes:
                                </Label>
                                <Textarea
                                  id="pdf-edit-text"
                                  value={pdfEditText}
                                  onChange={(e) => setPdfEditText(e.target.value)}
                                  placeholder="Enter additional notes or text to add to the price card page..."
                                  rows={6}
                                  className="mb-3"
                                />
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setIsEditingPdf(false);
                                    if (editedPdfBlob) {
                                      const url = URL.createObjectURL(editedPdfBlob);
                                      setSelectedPdfPath(url);
                                    }
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={handleSavePdf} className="bg-blue-600 hover:bg-blue-700">
                                  <Save className="h-4 w-4 mr-2" />
                                  Save PDF
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : selectedPdfPath ? (
                        <div className="flex-1 w-full h-full">
                          <iframe
                            src={selectedPdfPath}
                            className="w-full h-full min-h-[600px] border-0"
                            title="PDF Viewer"
                            onLoad={() => {
                              // Auto-load PDF with price card when Standard Wedding is selected
                              if (selectedFormat === "standard_wedding.pdf" && !editedPdfBlob && !isEditingPdf && !isPreviewMode) {
                                loadPdfWithPriceCard().then((blob) => {
                                  const url = URL.createObjectURL(blob);
                                  setSelectedPdfPath(url);
                                }).catch(console.error);
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-12 min-h-[500px] bg-gray-50">
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
                      )}
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
                        onClick={() => handleSaveEvent(true)}
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


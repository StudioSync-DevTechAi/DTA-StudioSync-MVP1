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
import { CalendarIcon, ArrowRight, Plus, Trash2, Pencil, Eye, Download, Share2, ChevronDown, ChevronUp, Phone, X, Save, Loader2, ArrowLeft, RotateCcw } from "lucide-react";
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
  pgType?: string; // PG-Type: EF or GH (maps to pg_type JSONB column)
  vgType?: string; // VG-Type: AB or CD (maps to vg_type JSONB column)
  deliverablesNotes?: string; // Maps to event_deliverables_notes_json
  savedDeliverablesNotes?: string; // Saved version of notes
  isEditingDeliverablesNotes?: boolean; // Track if notes are being edited
  hasSavedDeliverablesNotes?: boolean; // Track if notes have been saved at least once
  prepChecklist?: ChecklistItem[]; // Maps to event_prep_checklist_json
  daysCount?: string; // Maps to event_days_count
  isSaved?: boolean; // Track if this event has been saved to database
  isEditingPackageName?: boolean; // Track if package name is being edited
  savedState?: Partial<EventPackage>; // Snapshot of saved state to detect changes
}

// Removed mock data - will be fetched from database

export default function NewProjectPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get projectUuid from URL if editing existing project
  const projectUuidFromUrl = searchParams.get('projectUuid');
  // Get projectName from URL if provided
  const projectNameFromUrl = searchParams.get('projectName');
  
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
  const [isEditingPriceCard, setIsEditingPriceCard] = useState(false);
  const [costItemsUuid, setCostItemsUuid] = useState<string | null>(null);
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

  // Load project details when projectUuid is in URL (for editing existing projects)
  // GET API: Direct table query - no POST calls
  useEffect(() => {
    const loadProjectFromUuid = async () => {
      // Only load if we have projectUuid from URL
      if (!projectUuidFromUrl) {
        return;
      }

      // If we already have the details, don't fetch again
      if (projectDetails && projectDetails.client_name) {
        return;
      }

      setLoadingProjectDetails(true);
      try {
        console.log('=== GET API: Loading project details for UUID ===');
        console.log('Project UUID:', projectUuidFromUrl);
        
        // Direct table query - GET call, not POST
        const { data: projectRecord, error: fetchError } = await supabase
          .from('project_estimation_table' as any)
          .select(`
            project_estimate_uuid,
            project_name,
            project_type,
            clientid_phno,
            photography_owner_phno,
            start_date,
            start_time,
            startdatetime_confirmed,
            end_date,
            end_time,
            enddatetime_confirmed,
            project_status,
            is_drafted,
            drafted_json,
            created_at,
            updated_at
          `)
          .eq('project_estimate_uuid', projectUuidFromUrl)
          .single();

        if (fetchError) {
          console.error('❌ Error fetching project_estimation_table record:', fetchError);
          setLoadingProjectDetails(false);
          return;
        }

        if (projectRecord) {
          console.log('✅ Successfully loaded project_estimation_table record');
          console.log('Full record data:', projectRecord);
          
          // Fetch client name separately
          let clientName = '';
          if (projectRecord.clientid_phno) {
            const { data: clientData } = await supabase
              .from('client_details_table' as any)
              .select('client_name')
              .eq('clientid_phno', projectRecord.clientid_phno)
              .single();
            
            if (clientData) {
              clientName = clientData.client_name || '';
              console.log('Client Name:', clientName);
            }
          }
          
          // Set project details
          setProjectDetails({
            project_name: projectRecord.project_name || '',
            project_type: projectRecord.project_type || '',
            clientid_phno: projectRecord.clientid_phno || '',
            client_name: clientName
          });
          
          // Populate formData with project details when loading from URL
          setFormData(prev => ({
            ...prev,
            projectName: projectRecord.project_name || prev.projectName,
            eventType: projectRecord.project_type || prev.eventType,
            clientFullName: clientName || prev.clientFullName,
            clientPhone: projectRecord.clientid_phno || prev.clientPhone,
            startDate: projectRecord.start_date ? new Date(projectRecord.start_date) : prev.startDate,
            startHour: projectRecord.start_time ? projectRecord.start_time.split(':')[0] : prev.startHour,
            startMinute: projectRecord.start_time ? projectRecord.start_time.split(':')[1] : prev.startMinute,
            confirmationStatus: projectRecord.startdatetime_confirmed || prev.confirmationStatus,
            endDate: projectRecord.end_date ? new Date(projectRecord.end_date) : prev.endDate,
            endHour: projectRecord.end_time ? projectRecord.end_time.split(':')[0] : prev.endHour,
            endMinute: projectRecord.end_time ? projectRecord.end_time.split(':')[1] : prev.endMinute,
            endConfirmationStatus: projectRecord.enddatetime_confirmed || prev.endConfirmationStatus,
          }));
          
          // Set the projectEstimateUuid
          setProjectEstimateUuid(projectUuidFromUrl);
          sessionStorage.setItem("newProjectEstimateUuid", projectUuidFromUrl);
          
          // If page=2 is in URL, ensure we stay on page 2
          if (pageFromUrl === '2') {
            setCurrentPage(2);
          }
          
          // Parse dates and times
          const startDate = projectRecord.start_date ? new Date(projectRecord.start_date) : undefined;
          const startTime = projectRecord.start_time ? projectRecord.start_time.split(':') : null;
          const endDate = projectRecord.end_date ? new Date(projectRecord.end_date) : undefined;
          const endTime = projectRecord.end_time ? projectRecord.end_time.split(':') : null;
          
          // Format phone number consistently
          const formattedPhone = formatPhoneNumber(projectRecord.clientid_phno);
          
          // Populate form data with fetched project information
          setFormData(prev => ({
            ...prev,
            projectName: projectRecord.project_name || prev.projectName,
            eventType: projectRecord.project_type || prev.eventType,
            clientFullName: clientName || prev.clientFullName,
            clientPhone: formattedPhone || prev.clientPhone,
            startDate: startDate || prev.startDate,
            startHour: startTime ? startTime[0] : prev.startHour,
            startMinute: startTime ? startTime[1] : prev.startMinute,
            confirmationStatus: projectRecord.startdatetime_confirmed || prev.confirmationStatus,
            endDate: endDate || prev.endDate,
            endHour: endTime ? endTime[0] : prev.endHour,
            endMinute: endTime ? endTime[1] : prev.endMinute,
            endConfirmationStatus: projectRecord.enddatetime_confirmed || prev.endConfirmationStatus,
          }));
          
          // Update sessionStorage with fetched data
          try {
            if (projectRecord.project_name) sessionStorage.setItem('newProjectName', projectRecord.project_name);
            if (projectRecord.project_type) sessionStorage.setItem('newProjectType', projectRecord.project_type);
            if (clientName) sessionStorage.setItem('newProjectClientName', clientName);
            if (projectRecord.clientid_phno) sessionStorage.setItem('newProjectClientPhone', projectRecord.clientid_phno);
            if (projectRecord.photography_owner_phno) sessionStorage.setItem('newProjectPhotographyOwnerPhno', projectRecord.photography_owner_phno);
          } catch (e) {
            console.warn('Failed to update sessionStorage:', e);
          }

          console.log('✅ Project details loaded successfully via GET call');
        } else {
          console.warn('⚠️ No project record found for UUID:', projectUuidFromUrl);
        }
      } catch (error) {
        console.error('❌ Exception loading project details:', error);
      } finally {
        setLoadingProjectDetails(false);
      }
    };

    loadProjectFromUuid();
  }, [projectUuidFromUrl]); // Run when projectUuidFromUrl changes

  // GET API: Load project_estimation_table record by project_name (finds UUID first, then fetches full record)
  useEffect(() => {
    const loadProjectByName = async () => {
      // Only load if we're on page 1 and have a projectName (but no projectUuid)
      if (currentPage !== 1 || !projectNameFromUrl || projectUuidFromUrl) {
        return;
      }

      // Skip if we already loaded the details
      if (projectDetails && projectDetails.project_name) {
        console.log('Project details already loaded, skipping GET call');
        return;
      }

      setLoadingProjectDetails(true);
      try {
        console.log('=== GET API: Finding project by name ===');
        console.log('Project Name:', projectNameFromUrl);
        console.log('Current Page:', currentPage);
        
        // Step 1: Find project_estimate_uuid by project_name
        const { data: matchingProjects, error: searchError } = await supabase
          .from('project_estimation_table' as any)
          .select('project_estimate_uuid, project_name')
          .eq('project_name', projectNameFromUrl)
          .order('created_at', { ascending: false })
          .limit(1);

        if (searchError) {
          console.error('❌ Error searching for project by name:', searchError);
          setLoadingProjectDetails(false);
          return;
        }

        if (!matchingProjects || matchingProjects.length === 0) {
          console.warn(`⚠️ No project found with name: ${projectNameFromUrl}`);
          setLoadingProjectDetails(false);
          return;
        }

        const foundProject = matchingProjects[0];
        const foundUuid = foundProject.project_estimate_uuid;
        
        console.log('✅ Found project UUID:', foundUuid);
        console.log('Project Name Match:', foundProject.project_name);
        
        // Step 2: Use the found UUID to fetch the full record
        console.log('=== GET API: Fetching full project_estimation_table record ===');
        console.log('Using Project Estimate UUID:', foundUuid);
        
        const { data: projectRecord, error: fetchError } = await supabase
          .from('project_estimation_table' as any)
          .select(`
            project_estimate_uuid,
            project_name,
            project_type,
            clientid_phno,
            photography_owner_phno,
            start_date,
            start_time,
            startdatetime_confirmed,
            end_date,
            end_time,
            enddatetime_confirmed,
            project_status,
            is_drafted,
            drafted_json,
            created_at,
            updated_at
          `)
          .eq('project_estimate_uuid', foundUuid)
          .single();

        if (fetchError) {
          console.error('❌ Error fetching project_estimation_table record:', fetchError);
          setLoadingProjectDetails(false);
          return;
        }

        if (projectRecord) {
          console.log('✅ Successfully loaded project_estimation_table record');
          console.log('Full record data:', projectRecord);
          
          // Fetch client name separately
          let clientName = '';
          if (projectRecord.clientid_phno) {
            const { data: clientData } = await supabase
              .from('client_details_table' as any)
              .select('client_name')
              .eq('clientid_phno', projectRecord.clientid_phno)
              .single();
            
            if (clientData) {
              clientName = clientData.client_name || '';
            }
          }
          
          // Update project details state
          setProjectDetails({
            project_name: projectRecord.project_name || '',
            project_type: projectRecord.project_type || '',
            clientid_phno: projectRecord.clientid_phno || '',
            client_name: clientName
          });

          // Set the projectEstimateUuid
          setProjectEstimateUuid(foundUuid);
          sessionStorage.setItem("newProjectEstimateUuid", foundUuid);

          // Parse dates and times
          const startDate = projectRecord.start_date ? new Date(projectRecord.start_date) : undefined;
          const startTime = projectRecord.start_time ? projectRecord.start_time.split(':') : null;
          const endDate = projectRecord.end_date ? new Date(projectRecord.end_date) : undefined;
          const endTime = projectRecord.end_time ? projectRecord.end_time.split(':') : null;

          // Populate form data
          setFormData(prev => ({
            ...prev,
            projectName: projectRecord.project_name || prev.projectName,
            eventType: projectRecord.project_type || prev.eventType,
            clientFullName: clientName || prev.clientFullName,
            clientPhone: projectRecord.clientid_phno ? `+91 ${projectRecord.clientid_phno}` : prev.clientPhone,
            startDate: startDate || prev.startDate,
            startHour: startTime ? startTime[0] : prev.startHour,
            startMinute: startTime ? startTime[1] : prev.startMinute,
            confirmationStatus: projectRecord.startdatetime_confirmed || prev.confirmationStatus,
            endDate: endDate || prev.endDate,
            endHour: endTime ? endTime[0] : prev.endHour,
            endMinute: endTime ? endTime[1] : prev.endMinute,
            endConfirmationStatus: projectRecord.enddatetime_confirmed || prev.endConfirmationStatus,
          }));

          // Update sessionStorage
          try {
            if (projectRecord.project_name) sessionStorage.setItem('newProjectName', projectRecord.project_name);
            if (projectRecord.project_type) sessionStorage.setItem('newProjectType', projectRecord.project_type);
            if (clientName) sessionStorage.setItem('newProjectClientName', clientName);
            if (projectRecord.clientid_phno) sessionStorage.setItem('newProjectClientPhone', projectRecord.clientid_phno);
            if (projectRecord.photography_owner_phno) sessionStorage.setItem('newProjectPhotographyOwnerPhno', projectRecord.photography_owner_phno);
          } catch (e) {
            console.warn('Failed to update sessionStorage:', e);
          }

          console.log('✅ Project loaded successfully by name');
        }
      } catch (error) {
        console.error('❌ Exception loading project by name:', error);
      } finally {
        setLoadingProjectDetails(false);
      }
    };

    loadProjectByName();
  }, [currentPage, projectNameFromUrl, projectUuidFromUrl, projectDetails]);

  // Load project_estimation_table record by project_estimate_uuid when on page 1
  useEffect(() => {
    const loadProjectEstimationRecord = async () => {
      // Only load if we're on page 1 and have a projectUuid (but no projectName)
      if (currentPage !== 1 || !projectUuidFromUrl || projectNameFromUrl) {
        return;
      }

      // Skip if we already loaded the details
      if (projectDetails && projectDetails.project_name) {
        console.log('Project details already loaded, skipping GET call');
        return;
      }

      setLoadingProjectDetails(true);
      try {
        console.log('=== GET Call: Fetching project_estimation_table record ===');
        console.log('Project Estimate UUID:', projectUuidFromUrl);
        console.log('Current Page:', currentPage);
        
        // Direct GET call to project_estimation_table by project_estimate_uuid
        const { data: projectRecord, error: fetchError } = await supabase
          .from('project_estimation_table' as any)
          .select(`
            project_estimate_uuid,
            project_name,
            project_type,
            clientid_phno,
            photography_owner_phno,
            start_date,
            start_time,
            startdatetime_confirmed,
            end_date,
            end_time,
            enddatetime_confirmed,
            project_status,
            is_drafted,
            drafted_json,
            created_at,
            updated_at
          `)
          .eq('project_estimate_uuid', projectUuidFromUrl)
          .single();

        if (fetchError) {
          console.error('❌ Error fetching project_estimation_table record:', fetchError);
          console.error('Error details:', {
            message: fetchError.message,
            details: fetchError.details,
            hint: fetchError.hint,
            code: fetchError.code
          });
          setLoadingProjectDetails(false);
          return;
        }

        if (projectRecord) {
          console.log('✅ Successfully loaded project_estimation_table record:');
          console.log('Full record data:', projectRecord);
          console.log('Project Name:', projectRecord.project_name);
          console.log('Project Type:', projectRecord.project_type);
          console.log('Client Phone:', projectRecord.clientid_phno);
          console.log('Project Status:', projectRecord.project_status);
          console.log('Is Drafted:', projectRecord.is_drafted);
          
          // Fetch client name separately if needed
          let clientName = '';
          if (projectRecord.clientid_phno) {
            const { data: clientData } = await supabase
              .from('client_details_table' as any)
              .select('client_name')
              .eq('clientid_phno', projectRecord.clientid_phno)
              .single();
            
            if (clientData) {
              clientName = clientData.client_name || '';
              console.log('Client Name:', clientName);
            }
          }
          
          // Update project details state
          setProjectDetails({
            project_name: projectRecord.project_name || '',
            project_type: projectRecord.project_type || '',
            clientid_phno: projectRecord.clientid_phno || '',
            client_name: clientName
          });

          // Parse dates and times
          const startDate = projectRecord.start_date ? new Date(projectRecord.start_date) : undefined;
          const startTime = projectRecord.start_time ? projectRecord.start_time.split(':') : null;
          const endDate = projectRecord.end_date ? new Date(projectRecord.end_date) : undefined;
          const endTime = projectRecord.end_time ? projectRecord.end_time.split(':') : null;

          console.log('Parsed Start Date:', startDate);
          console.log('Parsed Start Time:', startTime);
          console.log('Parsed End Date:', endDate);
          console.log('Parsed End Time:', endTime);

          // Populate form data with fetched project information
          setFormData(prev => ({
            ...prev,
            projectName: projectRecord.project_name || prev.projectName,
            eventType: projectRecord.project_type || prev.eventType,
            clientFullName: clientName || prev.clientFullName,
            clientPhone: projectRecord.clientid_phno ? `+91 ${projectRecord.clientid_phno}` : prev.clientPhone,
            startDate: startDate || prev.startDate,
            startHour: startTime ? startTime[0] : prev.startHour,
            startMinute: startTime ? startTime[1] : prev.startMinute,
            confirmationStatus: projectRecord.startdatetime_confirmed || prev.confirmationStatus,
            endDate: endDate || prev.endDate,
            endHour: endTime ? endTime[0] : prev.endHour,
            endMinute: endTime ? endTime[1] : prev.endMinute,
            endConfirmationStatus: projectRecord.enddatetime_confirmed || prev.endConfirmationStatus,
          }));

          // Update sessionStorage
          try {
            if (projectRecord.project_name) sessionStorage.setItem('newProjectName', projectRecord.project_name);
            if (projectRecord.project_type) sessionStorage.setItem('newProjectType', projectRecord.project_type);
            if (clientName) sessionStorage.setItem('newProjectClientName', clientName);
            if (projectRecord.clientid_phno) sessionStorage.setItem('newProjectClientPhone', projectRecord.clientid_phno);
            if (projectRecord.photography_owner_phno) sessionStorage.setItem('newProjectPhotographyOwnerPhno', projectRecord.photography_owner_phno);
          } catch (e) {
            console.warn('Failed to update sessionStorage:', e);
          }

          console.log('✅ Project_estimation_table record loaded and form populated successfully');
        } else {
          console.warn('⚠️ No project_estimation_table record found for UUID:', projectUuidFromUrl);
        }
      } catch (error) {
        console.error('❌ Exception loading project_estimation_table record:', error);
      } finally {
        setLoadingProjectDetails(false);
      }
    };

    loadProjectEstimationRecord();
  }, [currentPage, projectUuidFromUrl, projectDetails]); // Run when currentPage or projectUuidFromUrl changes

  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [videographers, setVideographers] = useState<Videographer[]>([]);
  const [loadingPhotographers, setLoadingPhotographers] = useState(false);
  const [loadingVideographers, setLoadingVideographers] = useState(false);
  const [isSavingEvents, setIsSavingEvents] = useState(false);
  const [eventsSaved, setEventsSaved] = useState(false); // Track if events have been saved on page 2
  const [savedEventsSnapshot, setSavedEventsSnapshot] = useState<EventPackage[]>([]); // Snapshot of saved events to detect changes

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
      const pageFromUrlInEffect = searchParams.get('page');
      let finalPage = currentPage; // Use current state as default
      
      // Prioritize page from URL if present (especially when navigating from project card)
      if (pageFromUrlInEffect) {
        const page = parseInt(pageFromUrlInEffect, 10);
        if (page >= 1 && page <= 3) {
          finalPage = page;
          setCurrentPage(page);
        }
      } else if (savedCurrentPage) {
        const page = parseInt(savedCurrentPage, 10);
        if (page >= 1 && page <= 3) {
          finalPage = page;
          setCurrentPage(page);
          // Update URL to reflect the page from sessionStorage
          setSearchParams({ page: page.toString() }, { replace: true });
        }
      }

      // Load form data from sessionStorage (but don't override if loading from database)
      // Only load if we don't have projectUuidFromUrl (which means we're loading from database)
      if (savedFormData && !projectUuidFromUrl) {
        const parsed = JSON.parse(savedFormData);
        // Convert date strings back to Date objects
        if (parsed.startDate) parsed.startDate = new Date(parsed.startDate);
        if (parsed.endDate) parsed.endDate = new Date(parsed.endDate);
        setFormData(parsed);
      }

      // Only load event packages from sessionStorage if we're on Page 2 or 3
      // BUT: If we have projectUuidFromUrl and page=2, skip sessionStorage events
      // because loadExistingEvents will fetch from database
      if (finalPage === 2 && projectUuidFromUrl) {
        // Don't load from sessionStorage - events will be loaded from database
        // The loadExistingEvents effect will handle this
        console.log('Skipping sessionStorage event loading - will load from database');
      } else if (savedEventPackages && (finalPage === 2 || finalPage === 3)) {
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
      } else if (finalPage === 2 && !projectUuidFromUrl) {
        // If on Page 2 and no saved event packages and no projectUuid, initialize with one empty event card
        const newPackage: EventPackage = {
          id: Date.now().toString(),
          eventType: "",
          photographersCount: "",
          videographersCount: "",
          prepChecklist: [],
          daysCount: "1",
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

  // Track if this is the initial load to prevent POST calls on page load
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Mark initial load as complete after GET calls have time to complete
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
      console.log('✅ Initial load complete - auto-save enabled');
    }, 2000); // Wait 2 seconds after mount to allow GET calls to complete
    
    return () => clearTimeout(timer);
  }, []);

  // Update drafted_json in database when form data changes (debounced)
  // BUT: Only if it's NOT the initial page load (to prevent POST calls during GET operations)
  useEffect(() => {
    // Skip auto-save on initial load - we should only GET data, not POST
    if (isInitialLoad) {
      console.log('⏸️ Skipping auto-save: Initial page load - using GET calls only');
      return;
    }

    // Don't auto-save if we don't have a UUID (page is empty/new)
    if (!projectEstimateUuid) {
      console.log('⏸️ Skipping auto-save: No project UUID - page is empty');
      return;
    }

    // Don't auto-save if form is empty (no project name)
    if (!formData.projectName || formData.projectName.trim() === '') {
      console.log('⏸️ Skipping auto-save: Form is empty - no project name');
      return;
    }

    // Debounce: wait 2 seconds after last change before updating
    const timeoutId = setTimeout(async () => {
      try {
        console.log('💾 Auto-saving draft status...');
        const draftedJson = buildDraftedJson();
        await supabase.rpc('update_project_draft_status', {
          p_project_estimate_uuid: projectEstimateUuid,
          p_is_drafted: true,
          p_drafted_json: draftedJson as any,
        });
        console.log('✅ Draft status auto-saved successfully');
      } catch (error) {
        console.warn('Failed to auto-update draft status:', error);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [formData, eventPackages, selectedFormat, currentPage, projectEstimateUuid, buildDraftedJson, isInitialLoad]);

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

  // Fetch project and client details for Page 2 - GET API: Direct table query
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
        console.log('=== GET API: Fetching project details for Page 2 ===');
        console.log('Project Estimate UUID:', projectEstimateUuid);
        
        // Direct table query - GET call, not POST
        const { data: projectRecord, error: fetchError } = await supabase
          .from('project_estimation_table' as any)
          .select(`
            project_estimate_uuid,
            project_name,
            project_type,
            clientid_phno,
            photography_owner_phno,
            start_date,
            start_time,
            startdatetime_confirmed,
            end_date,
            end_time,
            enddatetime_confirmed,
            project_status,
            is_drafted,
            drafted_json,
            created_at,
            updated_at
          `)
          .eq('project_estimate_uuid', projectEstimateUuid)
          .single();

        if (fetchError) {
          console.error('❌ Error fetching project_estimation_table record:', fetchError);
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
          setLoadingProjectDetails(false);
          return;
        }

        if (projectRecord) {
          console.log('✅ Successfully loaded project_estimation_table record for Page 2');
          
          // Fetch client name separately
          let clientName = '';
          if (projectRecord.clientid_phno) {
            const { data: clientData } = await supabase
              .from('client_details_table' as any)
              .select('client_name')
              .eq('clientid_phno', projectRecord.clientid_phno)
              .single();
            
            if (clientData) {
              clientName = clientData.client_name || '';
            }
          }
          
          // Set project details
          setProjectDetails({
            project_name: projectRecord.project_name || '',
            project_type: projectRecord.project_type || '',
            clientid_phno: projectRecord.clientid_phno || '',
            client_name: clientName
          });
          
          // Also update sessionStorage with fetched data for consistency
          try {
            if (projectRecord.project_name) sessionStorage.setItem('newProjectName', projectRecord.project_name);
            if (projectRecord.project_type) sessionStorage.setItem('newProjectType', projectRecord.project_type);
            if (clientName) sessionStorage.setItem('newProjectClientName', clientName);
            if (projectRecord.clientid_phno) sessionStorage.setItem('newProjectClientPhone', projectRecord.clientid_phno);
            if (projectRecord.photography_owner_phno) sessionStorage.setItem('newProjectPhotographyOwnerPhno', projectRecord.photography_owner_phno);
          } catch (e) {
            console.warn('Failed to update sessionStorage:', e);
          }
        } else {
          // No record found - use sessionStorage as fallback
          console.warn('⚠️ No project record found, using sessionStorage');
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
        console.error('❌ Exception fetching project details:', error);
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
            pg_type,
            vg_type,
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

            // Parse pg_type and vg_type from JSON
            let pgType: string | undefined = undefined;
            let vgType: string | undefined = undefined;
            
            if (event.pg_type) {
              try {
                // Handle JSONB: could be {"type": "EF"} or already parsed
                const pgTypeObj = typeof event.pg_type === 'string' ? JSON.parse(event.pg_type) : event.pg_type;
                pgType = pgTypeObj?.type || pgTypeObj;
              } catch (e) {
                console.warn('Error parsing pg_type:', e);
              }
            }
            
            if (event.vg_type) {
              try {
                // Handle JSONB: could be {"type": "AB"} or already parsed
                const vgTypeObj = typeof event.vg_type === 'string' ? JSON.parse(event.vg_type) : event.vg_type;
                vgType = vgTypeObj?.type || vgTypeObj;
              } catch (e) {
                console.warn('Error parsing vg_type:', e);
              }
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
              daysCount: event.event_days_count?.toString() || "1",
              pgType: pgType,
              vgType: vgType,
              isSaved: true, // These are already saved
            };
          });

          setEventPackages(loadedEvents);
          
          // Mark events as saved and create snapshot since they're loaded from database
          setEventsSaved(true);
          const snapshot = loadedEvents.map((pkg) => ({
            ...pkg,
            startDate: pkg.startDate ? new Date(pkg.startDate) : undefined,
            prepChecklist: pkg.prepChecklist ? JSON.parse(JSON.stringify(pkg.prepChecklist)) : undefined,
          }));
          setSavedEventsSnapshot(snapshot);
          console.log('Events loaded from database - marked as saved, Next button should be enabled');
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

  // Helper function to format phone number consistently: "+91 " + 10 digits
  const formatPhoneNumber = (phone: string | null | undefined): string => {
    if (!phone) return "+91 ";
    // Extract just the digits (remove any existing +91, spaces, or other characters)
    const digitsOnly = phone.replace(/[^0-9]/g, '').slice(-10); // Take last 10 digits
    return digitsOnly.length === 10 ? `+91 ${digitsOnly}` : "+91 ";
  };

  const isPage1Valid = () => {
    // Required fields: Project Name and Event Type
    const projectNameValid = formData.projectName.trim() !== "";
    const eventTypeValid = formData.eventType !== "";
    
    // Phone validation: If provided, must be valid format (+91 followed by 10 digits)
    // Phone is optional - if empty or just "+91 ", it's considered valid
    const phoneNumber = formData.clientPhone.replace(/^\+91\s*/, ''); // Extract digits after +91
    const phoneEmpty = !formData.clientPhone || formData.clientPhone.trim() === "+91" || formData.clientPhone.trim() === "+91 ";
    const phoneValid = phoneEmpty || (/^\d{10}$/.test(phoneNumber) && formData.clientPhone.startsWith('+91'));
    
    // Email validation: If provided, must be valid format (email is optional)
    const emailValid = !formData.clientEmail || isValidEmail(formData.clientEmail);
    
    const isValid = (
      projectNameValid &&
      eventTypeValid &&
      phoneValid &&
      emailValid
    );
    
    // Debug logging to help identify validation issues (only log when validation fails)
    if (!isValid && process.env.NODE_ENV === 'development') {
      console.log('🔍 Page 1 Validation Status:', {
        projectName: projectNameValid ? '✓' : `✗ (empty: "${formData.projectName}")`,
        eventType: eventTypeValid ? '✓' : `✗ (not selected: "${formData.eventType}")`,
        phoneValid: phoneValid ? '✓' : `✗ (phone: "${formData.clientPhone}", extracted: "${phoneNumber}", need: 10 digits or empty, got: ${phoneNumber.length})`,
        emailValid: emailValid ? '✓' : `✗ (email: "${formData.clientEmail}")`,
        isButtonDisabled: !isValid || isSubmitting,
        isSubmitting: isSubmitting
      });
    }
    
    return isValid;
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
        p_pg_type: eventPackage.pgType ? { type: eventPackage.pgType } : null, // PG-Type JSON: {"type": "EF"} or {"type": "GH"}
        p_vg_type: eventPackage.vgType ? { type: eventPackage.vgType } : null, // VG-Type JSON: {"type": "AB"} or {"type": "CD"}
        p_event_photographers_days_count: null, // Deprecated - using pg_type instead
        p_event_videographers_days_count: null, // Deprecated - using vg_type instead
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
      daysCount: "1",
      isSaved: false,
    };
    setEventPackages([...eventPackages, newPackage]);
  };

  const handleRemoveEventPackage = (id: string) => {
    setEventPackages(eventPackages.filter((pkg) => pkg.id !== id));
  };

  // Save individual event card
  // Check if event card has unsaved changes
  const hasUnsavedChanges = (pkg: EventPackage): boolean => {
    if (!pkg.isSaved || !pkg.savedState) {
      // Not saved yet, so check if required fields are filled
      return !!(pkg.eventType && pkg.startDate);
    }

    // Compare current state with saved state
    const saved = pkg.savedState;
    return (
      pkg.eventType !== saved.eventType ||
      pkg.customEventTypeName !== saved.customEventTypeName ||
      pkg.photographersCount !== saved.photographersCount ||
      pkg.videographersCount !== saved.videographersCount ||
      pkg.pgType !== saved.pgType ||
      pkg.vgType !== saved.vgType ||
      pkg.daysCount !== saved.daysCount ||
      pkg.startHour !== saved.startHour ||
      pkg.startMinute !== saved.startMinute ||
      pkg.photographyCoordinatorId !== saved.photographyCoordinatorId ||
      pkg.videographyCoordinatorId !== saved.videographyCoordinatorId ||
      pkg.pgType !== saved.pgType ||
      pkg.vgType !== saved.vgType ||
      pkg.packageName !== saved.packageName ||
      JSON.stringify(pkg.prepChecklist) !== JSON.stringify(saved.prepChecklist) ||
      pkg.deliverablesNotes !== saved.deliverablesNotes ||
      (pkg.startDate?.getTime() !== saved.startDate?.getTime())
    );
  };

  // Check if there are any unsaved changes across all events
  const hasAnyUnsavedChanges = (): boolean => {
    // If events haven't been saved yet, check if there are valid events to save
    if (!eventsSaved || savedEventsSnapshot.length === 0) {
      const validEventCards = eventPackages.filter(
        (pkg) => pkg.eventType && pkg.startDate
      );
      return validEventCards.length > 0;
    }

    // Compare current events with saved snapshot
    // Check if number of events changed
    const validCurrentEvents = eventPackages.filter(
      (pkg) => pkg.eventType && pkg.startDate
    );
    const validSavedEvents = savedEventsSnapshot.filter(
      (pkg) => pkg.eventType && pkg.startDate
    );

    if (validCurrentEvents.length !== validSavedEvents.length) {
      return true; // Number of events changed
    }

    // Check each current event against saved snapshot
    for (const currentPkg of validCurrentEvents) {
      const savedPkg = savedEventsSnapshot.find((sp) => sp.id === currentPkg.id);
      
      if (!savedPkg) {
        return true; // New event added
      }

      // Compare all fields
      if (
        currentPkg.eventType !== savedPkg.eventType ||
        currentPkg.customEventTypeName !== savedPkg.customEventTypeName ||
        currentPkg.photographersCount !== savedPkg.photographersCount ||
        currentPkg.videographersCount !== savedPkg.videographersCount ||
        currentPkg.pgType !== savedPkg.pgType ||
        currentPkg.vgType !== savedPkg.vgType ||
        currentPkg.daysCount !== savedPkg.daysCount ||
        currentPkg.startHour !== savedPkg.startHour ||
        currentPkg.startMinute !== savedPkg.startMinute ||
        currentPkg.photographyCoordinatorId !== savedPkg.photographyCoordinatorId ||
        currentPkg.videographyCoordinatorId !== savedPkg.videographyCoordinatorId ||
        currentPkg.packageName !== savedPkg.packageName ||
        JSON.stringify(currentPkg.prepChecklist) !== JSON.stringify(savedPkg.prepChecklist) ||
        currentPkg.deliverablesNotes !== savedPkg.deliverablesNotes ||
        (currentPkg.startDate?.getTime() !== savedPkg.startDate?.getTime())
      ) {
        return true; // Event changed
      }
    }

    return false; // No changes detected
  };

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
      // Create a snapshot of the current state for comparison
      const savedState: Partial<EventPackage> = {
        eventType: eventPackage.eventType,
        customEventTypeName: eventPackage.customEventTypeName,
        photographersCount: eventPackage.photographersCount,
        videographersCount: eventPackage.videographersCount,
        pgType: eventPackage.pgType,
        vgType: eventPackage.vgType,
        daysCount: eventPackage.daysCount,
        startHour: eventPackage.startHour,
        startMinute: eventPackage.startMinute,
        photographyCoordinatorId: eventPackage.photographyCoordinatorId,
        videographyCoordinatorId: eventPackage.videographyCoordinatorId,
        packageName: eventPackage.packageName,
        prepChecklist: eventPackage.prepChecklist ? JSON.parse(JSON.stringify(eventPackage.prepChecklist)) : undefined,
        deliverablesNotes: eventPackage.deliverablesNotes,
        startDate: eventPackage.startDate ? new Date(eventPackage.startDate) : undefined,
      };

      // Update the event package with the UUID, mark as saved, and store saved state
      const updatedPackages = [...eventPackages];
      updatedPackages[eventIndex] = {
        ...eventPackage,
        event_uuid: eventUuid,
        isSaved: true,
        savedState: savedState,
      };
      setEventPackages(updatedPackages);

      // Collapse the event card after saving
      if (expandedEventId === eventId) {
        setExpandedEventId(null);
      }
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
        pgType: eventPackage.pgType,
        videographersCount: eventPackage.videographersCount,
        vgType: eventPackage.vgType,
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
      'pgType', 'vgType'];
    
    setEventPackages(
      eventPackages.map((pkg) => {
        if (pkg.id === id) {
          const updated = { ...pkg, [field]: value };
          // Mark as unsaved if a significant field changed (but keep savedState for comparison)
          if (fieldsThatRequireResave.includes(field)) {
            // Don't clear isSaved flag, but keep savedState to detect changes
            // This allows the Save button to be disabled when no changes exist
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
        { label: "Actual Price:", value: `Rs.${actualPrice.toLocaleString()}` },
        { label: "Sub Total:", value: `Rs.${subtotal.toLocaleString()}` },
        { label: "GST (18%):", value: `Rs.${gst.toLocaleString()}` },
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
      
      pricePage.drawText(`Rs.${total.toLocaleString()}`, {
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
        return `Rs.${num.toLocaleString()}`;
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

  // Save price card details to cost_items_table
  const saveCostItems = async () => {
    if (!projectEstimateUuid) {
      console.error('Cannot save cost items: missing project UUID');
      return null;
    }

    // Get client phone number
    const clientPhno = (projectDetails?.clientid_phno || formData.clientPhone || '').replace(/\s/g, '');
    if (!clientPhno) {
      console.error('Cannot save cost items: missing client phone number');
      return null;
    }

    // Get price values - use editablePrices if available, otherwise calculate
    const { actualPrice } = calculatePrice();
    const actualPriceValue = editablePrices.actualPrice 
      ? parseFloat(editablePrices.actualPrice.replace(/,/g, '')) 
      : actualPrice;
    // Calculate GST from actualPrice (18%)
    const gstValue = actualPriceValue * 0.18;
    // Sub total = actualPrice + GST
    const subtotalValue = actualPriceValue + gstValue;
    // Total = actualPrice + GST
    const totalValue = actualPriceValue + gstValue;

    try {
      // Call Supabase RPC function to insert or update cost items
      const { data, error } = await supabase.rpc('create_or_update_cost_items', {
        p_project_uuid: projectEstimateUuid,
        p_clientid_phno: clientPhno,
        p_actual_price: actualPriceValue,
        p_subtotal_price: subtotalValue,
        p_totalprice_withgst: totalValue,
        p_cost_items_uuid: costItemsUuid || null,
      });

      if (error) {
        console.error('Error saving cost items:', error);
        return null;
      }

      if (data && (data as any).success) {
        const result = {
          cost_items_uuid: (data as any).cost_items_uuid,
          project_uuid: (data as any).project_uuid,
          clientid_phno: (data as any).clientid_phno,
        };
        setCostItemsUuid(result.cost_items_uuid);
        console.log('Cost items saved successfully:', result);
        return result;
      } else {
        console.error('Failed to save cost items:', data);
        return null;
      }
    } catch (error: any) {
      console.error('Exception saving cost items:', error);
      return null;
    }
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
      // OR already saved events (have event_uuid) - these should be updatable
      const validEventCards = eventPackages.filter(
        (pkg) => (pkg.eventType && pkg.startDate) || pkg.event_uuid
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

      // Save cost items (price card) to cost_items_table
      await saveCostItems();

      // Show success message
      if (savedCount > 0) {
        if (failedCount > 0) {
          alert(`${savedCount} event(s) saved successfully. ${failedCount} event(s) failed to save.`);
        } else {
          alert(`${savedCount} event(s) saved successfully!`);
        }
        // Mark events as saved to enable Next button
        setEventsSaved(true);
        // Save a deep copy snapshot of all events for change detection
        const snapshot = updatedPackages.map((pkg) => ({
          ...pkg,
          startDate: pkg.startDate ? new Date(pkg.startDate) : undefined,
          prepChecklist: pkg.prepChecklist ? JSON.parse(JSON.stringify(pkg.prepChecklist)) : undefined,
        }));
        setSavedEventsSnapshot(snapshot);
      } else {
        alert('Failed to save events. Please check the console for errors.');
        setEventsSaved(false);
        setSavedEventsSnapshot([]);
      }
    } catch (error: any) {
      console.error('Exception saving events:', error);
      setEventsSaved(false);
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
          title="Projects"
          headerNavigationPath="/estimates/projects"
          description="Create and manage your photography projects"
        />
        
        <div className="flex items-center justify-center px-2 sm:px-4">
          <Card className="rounded-lg bg-card text-card-foreground shadow-sm w-full max-w-6xl relative border-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.6),0_0_40px_rgba(59,130,246,0.4)] hover:border-blue-400/60 hover:scale-[1.02]" style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}>
            <CardContent className="p-4 sm:p-6 md:p-8" style={{ backgroundColor: 'transparent' }}>
              {currentPage === 1 ? (
                <>
                  {/* Project Owner Information */}
                  <div className="rounded-lg bg-card text-card-foreground shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-3 sm:p-4 mb-4 sm:mb-6 relative border-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.6),0_0_40px_rgba(59,130,246,0.4)] hover:border-blue-400/60 hover:scale-[1.02]" style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}>
                    <div className="space-y-2">
                      <Label className="text-center block text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>Project Owner</Label>
                      <Input
                        value={loadingOwner ? "Loading..." : (photographyOwner?.photography_owner_name || "Not available")}
                        disabled
                        className="bg-background text-white text-center"
                        style={{ backgroundColor: 'transparent', borderColor: '#ffffff', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-center block text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>Project Owner PhNo</Label>
                      <Input
                        value={loadingOwner ? "Loading..." : (photographyOwner?.photography_owner_phno || "Not available")}
                        disabled
                        className="bg-background text-white text-center"
                        style={{ backgroundColor: 'transparent', borderColor: '#ffffff', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-center block text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>Project Owner Email Id</Label>
                      <Input
                        value={loadingOwner ? "Loading..." : (photographyOwner?.photography_owner_email || "Not available")}
                        disabled
                        className="bg-background text-white text-center"
                        style={{ backgroundColor: 'transparent', borderColor: '#ffffff', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                      />
                    </div>
                  </div>
                  <div className="rounded-lg bg-card text-card-foreground shadow-sm space-y-4 sm:space-y-6 p-3 sm:p-4 relative border-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.6),0_0_40px_rgba(59,130,246,0.4)] hover:border-blue-400/60 hover:scale-[1.02]" style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}>

              {/* Project Name and Project Type Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg bg-card text-card-foreground shadow-sm space-y-2 min-w-0 p-3 sm:p-4 relative border-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.6),0_0_40px_rgba(59,130,246,0.4)] hover:border-blue-400/60 hover:scale-[1.02]" style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}>
                  <Label htmlFor="projectName" className="text-sm sm:text-base text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>
                    Project Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="projectName"
                    placeholder="Enter project name"
                    value={formData.projectName}
                    onChange={(e) => handleInputChange("projectName", e.target.value)}
                    required
                    className={`w-full text-white placeholder:text-gray-400 ${formData.projectName.trim() === "" ? "border-red-300" : ""}`}
                    style={{ backgroundColor: 'transparent', borderColor: '#ffffff', color: '#ffffff' }}
                  />
                </div>
                <div className="rounded-lg bg-card text-card-foreground shadow-sm space-y-2 min-w-0 p-3 sm:p-4 relative border-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.6),0_0_40px_rgba(59,130,246,0.4)] hover:border-blue-400/60 hover:scale-[1.02]" style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}>
                  <Label htmlFor="eventType" className="text-sm sm:text-base text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>
                    Project Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(value) => handleInputChange("eventType", value)}
                    required
                  >
                    <SelectTrigger 
                      id="eventType"
                      className={`text-white placeholder:text-gray-400 ${formData.eventType === "" ? "border-red-300" : ""}`}
                      style={{ backgroundColor: 'transparent', borderColor: '#ffffff', color: '#ffffff' }}
                    >
                      <SelectValue placeholder="Select Event Type" className="text-white" />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: 'transparent', borderColor: '#ffffff' }}>
                      <SelectItem value="wedding" className="text-white hover:bg-[#1a0f3d]">Wedding</SelectItem>
                      <SelectItem value="corporate" className="text-white hover:bg-[#1a0f3d]">Corporate</SelectItem>
                      <SelectItem value="portrait" className="text-white hover:bg-[#1a0f3d]">Portrait</SelectItem>
                      <SelectItem value="event" className="text-white hover:bg-[#1a0f3d]">Event</SelectItem>
                      <SelectItem value="commercial" className="text-white hover:bg-[#1a0f3d]">Commercial</SelectItem>
                      <SelectItem value="other" className="text-white hover:bg-[#1a0f3d]">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Client Name, Email, and Phone Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="rounded-lg bg-card text-card-foreground shadow-sm space-y-2 min-w-0 p-3 sm:p-4 relative border-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.6),0_0_40px_rgba(59,130,246,0.4)] hover:border-blue-400/60 hover:scale-[1.02]" style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}>
                  <Label htmlFor="clientFullName" className="text-sm sm:text-base text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>Client Name:</Label>
                  <Input
                    id="clientFullName"
                    placeholder="Enter client name"
                    value={formData.clientFullName}
                    onChange={(e) => handleInputChange("clientFullName", e.target.value)}
                    className="w-full text-white placeholder:text-gray-400"
                    style={{ backgroundColor: 'transparent', borderColor: '#ffffff', color: '#ffffff' }}
                  />
                </div>
                <div className="rounded-lg bg-card text-card-foreground shadow-sm space-y-2 min-w-0 p-3 sm:p-4 relative border-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.6),0_0_40px_rgba(59,130,246,0.4)] hover:border-blue-400/60 hover:scale-[1.02]" style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}>
                  <Label htmlFor="clientEmail" className="text-sm sm:text-base text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>Client Email:</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.clientEmail}
                    onChange={(e) => handleInputChange("clientEmail", e.target.value)}
                    className={cn(
                      "w-full text-white placeholder:text-gray-400",
                      formData.clientEmail && !isValidEmail(formData.clientEmail) ? "border-red-300" : ""
                    )}
                    style={{ backgroundColor: 'transparent', borderColor: '#ffffff', color: '#ffffff' }}
                  />
                  {formData.clientEmail && !isValidEmail(formData.clientEmail) && (
                    <p className="text-xs text-red-400">
                      Email must contain '@' symbol and a valid domain name (e.g., example@domain.com)
                    </p>
                  )}
                </div>
                <div className="rounded-lg bg-card text-card-foreground shadow-sm space-y-2 min-w-0 p-3 sm:p-4 relative border-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.6),0_0_40px_rgba(59,130,246,0.4)] hover:border-blue-400/60 hover:scale-[1.02]" style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}>
                  <Label htmlFor="clientPhone" className="text-sm sm:text-base text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>
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
                      "w-full text-white placeholder:text-gray-400",
                      !isPage1Valid() && formData.clientPhone.length < 14 ? "border-red-300" : ""
                    )}
                    style={{ backgroundColor: 'transparent', borderColor: '#ffffff', color: '#ffffff' }}
                    maxLength={14}
                  />
                  {formData.clientPhone.length < 14 && formData.clientPhone.length > 4 && (
                    <p className="text-xs text-gray-300">
                      {10 - (formData.clientPhone.length - 4)} digits remaining
                    </p>
                  )}
                </div>
              </div>

              {/* Start Date & Time */}
              <div className="rounded-lg bg-card text-card-foreground shadow-sm space-y-2 p-3 sm:p-4 relative border-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.6),0_0_40px_rgba(59,130,246,0.4)] hover:border-blue-400/60 hover:scale-[1.02]" style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}>
                <Label className="text-sm sm:text-base text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>Project Start Date & Time <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-1 items-end" style={{ backgroundColor: 'transparent' }}>
                  {/* Date Selection - Narrower */}
                  <div className="col-span-1 sm:col-span-3 w-full sm:max-w-[70%] rounded-lg border-2" style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="startDate"
                          variant="outline"
                          className={cn(
                            "inline-flex items-center gap-1 sm:gap-2 whitespace-nowrap rounded-md text-xs sm:text-sm md:text-base ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:h-3 [&_svg]:w-3 sm:[&_svg]:size-4 [&_svg]:shrink-0 border-0 bg-background hover:bg-accent hover:text-accent-foreground h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 w-full justify-start text-left font-normal text-white",
                            !formData.startDate && "text-gray-400"
                          )}
                          style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                        >
                          <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          {formData.startDate ? (
                            format(formData.startDate, "MM/dd/yyyy")
                          ) : (
                            <span className="text-xs sm:text-sm">mm/dd/yyyy</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-auto p-0 rounded-lg"
                        style={{ backgroundColor: '#1a0f3d', borderColor: '#ffffff', borderWidth: '2px', borderStyle: 'solid' }} 
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={formData.startDate}
                          onSelect={(date) => handleInputChange("startDate", date)}
                          className="text-white"
                          classNames={{
                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                            month: "space-y-4 w-full",
                            caption: "flex justify-center pt-1 relative items-center",
                            caption_label: "text-sm font-medium uppercase text-white text-center",
                            nav: "space-x-1 flex items-center",
                            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-0 text-white",
                            nav_button_previous: "absolute left-1",
                            nav_button_next: "absolute right-1",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex justify-center",
                            head_cell: "text-white rounded-md w-9 font-normal text-[0.8rem] uppercase font-medium opacity-80 text-center",
                            row: "flex w-full mt-2 justify-center",
                            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent/50 text-sm rounded-md text-white text-center flex items-center justify-center",
                            day_range_end: "day-range-end",
                            day_selected: "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary",
                            day_today: "border border-primary/50 text-primary font-medium",
                            day_outside: "day-outside text-white opacity-50 aria-selected:bg-accent/50 aria-selected:text-white aria-selected:opacity-30",
                            day_disabled: "text-white opacity-50",
                            day_range_middle: "aria-selected:bg-accent aria-selected:text-white",
                            day_hidden: "invisible",
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time Picker Clock */}
                  <div className="col-span-1 sm:col-span-3 w-full sm:max-w-[70%] rounded-lg border-2" style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}>
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
                          formData.confirmationStatus ? "text-green-400" : "text-gray-300"
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
              <div className="rounded-lg bg-card text-card-foreground shadow-sm space-y-2 p-3 sm:p-4 relative border-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.6),0_0_40px_rgba(59,130,246,0.4)] hover:border-blue-400/60 hover:scale-[1.02]" style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}>
                <Label className="text-sm sm:text-base text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>Project End Date & Time</Label>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-1 items-end" style={{ backgroundColor: 'transparent' }}>
                  {/* Date Selection - Narrower */}
                  <div className="col-span-1 sm:col-span-3 w-full sm:max-w-[70%] rounded-lg border-2" style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="endDate"
                          variant="outline"
                          className={cn(
                            "inline-flex items-center gap-1 sm:gap-2 whitespace-nowrap rounded-md text-xs sm:text-sm md:text-base ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:h-3 [&_svg]:w-3 sm:[&_svg]:size-4 [&_svg]:shrink-0 border-0 bg-background hover:bg-accent hover:text-accent-foreground h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 w-full justify-start text-left font-normal text-white",
                            !formData.endDate && "text-gray-400",
                            (() => {
                              if (!formData.endDate || !formData.startDate) return false;
                              const startDateOnly = new Date(formData.startDate);
                              startDateOnly.setHours(0, 0, 0, 0);
                              const endDateOnly = new Date(formData.endDate);
                              endDateOnly.setHours(0, 0, 0, 0);
                              return endDateOnly < startDateOnly;
                            })() && "border-red-300"
                          )}
                          style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                        >
                          <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          {formData.endDate ? (
                            format(formData.endDate, "MM/dd/yyyy")
                          ) : (
                            <span className="text-xs sm:text-sm">mm/dd/yyyy</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-auto p-0 rounded-lg"
                        style={{ backgroundColor: '#1a0f3d', borderColor: '#ffffff', borderWidth: '2px', borderStyle: 'solid' }} 
                        align="start"
                      >
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
                          className="text-white"
                          classNames={{
                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                            month: "space-y-4 w-full",
                            caption: "flex justify-center pt-1 relative items-center",
                            caption_label: "text-sm font-medium uppercase text-white text-center",
                            nav: "space-x-1 flex items-center",
                            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-0 text-white",
                            nav_button_previous: "absolute left-1",
                            nav_button_next: "absolute right-1",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex justify-center",
                            head_cell: "text-white rounded-md w-9 font-normal text-[0.8rem] uppercase font-medium opacity-80 text-center",
                            row: "flex w-full mt-2 justify-center",
                            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent/50 text-sm rounded-md text-white text-center flex items-center justify-center",
                            day_range_end: "day-range-end",
                            day_selected: "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary",
                            day_today: "border border-primary/50 text-primary font-medium",
                            day_outside: "day-outside text-white opacity-50 aria-selected:bg-accent/50 aria-selected:text-white aria-selected:opacity-30",
                            day_disabled: "text-white opacity-50",
                            day_range_middle: "aria-selected:bg-accent aria-selected:text-white",
                            day_hidden: "invisible",
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
                  <div className="col-span-1 sm:col-span-3 w-full sm:max-w-[70%] rounded-lg border-2" style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}>
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
                          formData.endConfirmationStatus ? "text-green-400" : "text-gray-300"
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
              <div className="flex flex-col items-center pt-4 gap-2">
                <Button
                  onClick={handleNext}
                  disabled={!isPage1Valid() || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating Project...' : 'Next'}
                  {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
                {/* Debug info - shows why button might be disabled */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-500 text-center">
                    <div>Valid: {isPage1Valid() ? '✓' : '✗'} | Submitting: {isSubmitting ? 'Yes' : 'No'}</div>
                    <div>Disabled: {(!isPage1Valid() || isSubmitting) ? 'Yes' : 'No'}</div>
                  </div>
                )}
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
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {eventsSaved && hasAnyUnsavedChanges() && (
                            <button
                              onClick={() => {
                                // Revert to saved snapshot
                                setEventPackages(JSON.parse(JSON.stringify(savedEventsSnapshot)));
                              }}
                              className="p-2 hover:bg-accent rounded-md transition-colors"
                              title="Revert changes"
                              style={{ backgroundColor: 'transparent', borderColor: '#ffffff' }}
                            >
                              <RotateCcw className="h-5 w-5 text-gray-300 hover:text-white" />
                            </button>
                          )}
                          {projectEstimateUuid && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCurrentPage(1);
                                setSearchParams({ projectUuid: projectEstimateUuid, page: '1' });
                              }}
                              className="flex items-center gap-2 bg-[#2d1b4e] text-white border-[#5a4a7a] hover:bg-[#1a0f3d]"
                              style={{ borderWidth: '1.5px', borderStyle: 'solid' }}
                            >
                              <ArrowLeft className="h-4 w-4" />
                              Project Details
                            </Button>
                          )}
                          <div className="flex-1 flex justify-center">
                            <h2 className="text-2xl font-semibold text-white">Events Details</h2>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm mt-2">
                          <span className="font-medium text-white">Project:</span>
                          <span className="text-gray-300" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>{projectDetails?.project_name || formData.projectName || "Not set"}</span>
                          <span className="text-gray-300" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>|</span>
                          <span className="font-medium text-white">Project Type:</span>
                          <span className="text-gray-300" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>{projectDetails?.project_type || formData.eventType || "Not set"}</span>
                          <span className="text-gray-300" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>|</span>
                          <span className="font-medium text-white">StartDate:</span>
                          <span className="text-gray-300" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>
                            {formData.startDate ? format(formData.startDate, "MM/dd/yyyy") : "Not set"}
                          </span>
                          <span className="text-gray-300" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>|</span>
                          <span className="font-medium text-white">EndDate:</span>
                          <span className="text-gray-300" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>
                            {formData.endDate ? format(formData.endDate, "MM/dd/yyyy") : "Not set"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => handleSaveEvent(false)} 
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={isSavingEvents || (eventsSaved && !hasAnyUnsavedChanges())}
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
                        <Button variant="outline" onClick={handleCancel} className="bg-[#2d1b4e] text-white border-[#3d2a5f] hover:bg-[#1a0f3d]">
                          Cancel
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>Client Name:</span>
                      <span className="text-gray-300" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>{formData.clientFullName || "Not set"}</span>
                      <span className="text-gray-300" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>|</span>
                      <span className="font-medium text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>Client PhNo:</span>
                      <span className="text-gray-300" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>{formData.clientPhone || "Not set"}</span>
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
                            className="rounded-lg bg-card text-card-foreground shadow-sm p-3 sm:p-4 w-full sm:w-[45%] relative border-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.6),0_0_40px_rgba(59,130,246,0.4)] hover:border-blue-400/60 hover:scale-[1.02]"
                            style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}
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
                              <div className="flex items-center relative">
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
                                    className="font-medium h-8 w-auto min-w-[150px] text-white placeholder:text-gray-400"
                                    style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                                  />
                                ) : (
                                  <h3 
                                    className="font-medium cursor-pointer hover:text-primary text-white"
                                    style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}
                                    onClick={() => handleEditPackageName(pkg.id)}
                                  >
                                    {pkg.packageName || `Event Package ${index + 1}`}
                                  </h3>
                                )}
                                {!isExpanded && pkg.daysCount && (
                                  <span className="text-sm text-gray-300 absolute left-[42%] transform -translate-x-1/2" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>
                                    Days {pkg.daysCount || "1"}
                                  </span>
                                )}
                                <div className="flex items-center gap-2 ml-auto">
                                  {!isActiveEvent && (
                                    <button
                                      onClick={() => toggleEventDetails(pkg.id)}
                                      disabled={isExpanded}
                                      className={`p-1 rounded transition-colors ${
                                        isExpanded 
                                          ? 'opacity-50 cursor-not-allowed' 
                                          : 'hover:bg-accent'
                                      }`}
                                      style={{ backgroundColor: 'transparent' }}
                                      aria-label="Edit event"
                                      title={isExpanded ? "Save changes first" : "Edit event"}
                                    >
                                      <Pencil className={`h-4 w-4 ${
                                        isExpanded 
                                          ? 'text-gray-400' 
                                          : 'text-gray-300 hover:text-white'
                                      }`} />
                                    </button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleEventDetails(pkg.id)}
                                    className="h-8 bg-[#2d1b4e] text-white border-[#3d2a5f] hover:bg-[#1a0f3d]"
                                    style={{ color: '#ffffff' }}
                                  >
                                    <span style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>Details</span>
                                    {isExpanded ? (
                                      <ChevronUp className="ml-2 h-4 w-4 text-white" style={{ color: '#ffffff' }} />
                                    ) : (
                                      <ChevronDown className="ml-2 h-4 w-4 text-white" style={{ color: '#ffffff' }} />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSaveEventCard(pkg.id)}
                                    className={`${
                                      isExpanded && pkg.eventType && pkg.startDate && hasUnsavedChanges(pkg)
                                        ? 'text-green-400 hover:text-green-300 hover:bg-[#1a0f3d]'
                                        : 'text-gray-300 opacity-50'
                                    }`}
                                    disabled={!isExpanded || !pkg.eventType || !pkg.startDate || !hasUnsavedChanges(pkg)}
                                    title={
                                      !isExpanded 
                                        ? "Expand event card to save" 
                                        : (!pkg.eventType || !pkg.startDate)
                                        ? "Fill required fields to save"
                                        : !hasUnsavedChanges(pkg) && pkg.isSaved
                                        ? "No changes to save"
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
                                      className="text-red-400 hover:text-red-300 hover:bg-[#1a0f3d]"
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
                                  {/* First row: Event Type and Days No. */}
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full">
                                    <div className={pkg.eventType === "other" ? "w-full sm:w-[35%]" : "w-full sm:w-1/2"}>
                                      <Select
                                        value={pkg.eventType}
                                        onValueChange={(value) =>
                                          handleEventPackageChange(pkg.id, "eventType", value)
                                        }
                                      >
                                        <SelectTrigger id={`eventType-${pkg.id}`} className="text-white placeholder:text-gray-400" style={{ backgroundColor: 'transparent', borderColor: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid', color: '#ffffff' }}>
                                          <SelectValue placeholder="Select an event type" className="text-white" />
                                        </SelectTrigger>
                                        <SelectContent style={{ backgroundColor: 'transparent', borderColor: '#ffffff' }}>
                                          <SelectItem value="wedding" className="text-white hover:bg-[#1a0f3d]">Wedding</SelectItem>
                                          <SelectItem value="engagement" className="text-white hover:bg-[#1a0f3d]">Engagement</SelectItem>
                                          <SelectItem value="corporate" className="text-white hover:bg-[#1a0f3d]">Corporate</SelectItem>
                                          <SelectItem value="portrait" className="text-white hover:bg-[#1a0f3d]">Portrait</SelectItem>
                                          <SelectItem value="event" className="text-white hover:bg-[#1a0f3d]">Event</SelectItem>
                                          <SelectItem value="commercial" className="text-white hover:bg-[#1a0f3d]">Commercial</SelectItem>
                                          <SelectItem value="other" className="text-white hover:bg-[#1a0f3d]">Other</SelectItem>
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
                                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-white"
                                          style={{ backgroundColor: 'transparent', borderColor: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                                        />
                                      </div>
                                    )}
                                    <div className="flex-shrink-0 flex items-center gap-2 ml-4">
                                      <Label htmlFor={`daysCount-${pkg.id}`} className="text-sm font-medium leading-none whitespace-nowrap text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>Days No.</Label>
                                      <Input
                                        id={`daysCount-${pkg.id}`}
                                        type="number"
                                        step="1"
                                        min="0"
                                        placeholder="Days No."
                                        value={pkg.daysCount || "1"}
                                        onChange={(e) => handleEventPackageChange(pkg.id, "daysCount", e.target.value)}
                                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-20 text-white"
                                        style={{ backgroundColor: 'transparent', borderColor: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                                      />
                                    </div>
                                  </div>

                                  {/* Second row: PGs No, PGDays, VGs No, VGDays */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                    <div className="space-y-2 min-w-0">
                                      <Label htmlFor={`photographers-${pkg.id}`} className="text-xs sm:text-sm font-medium leading-none text-white">PGs No</Label>
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
                                        className="w-full text-sm text-white placeholder:text-gray-400"
                                        style={{ backgroundColor: 'transparent', borderColor: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                                      />
                                    </div>
                                    <div className="space-y-2 min-w-0">
                                      <Label htmlFor={`pgType-${pkg.id}`} className="text-xs sm:text-sm font-medium leading-none text-white">PG-Type</Label>
                                      <Select
                                        value={pkg.pgType || ""}
                                        onValueChange={(value) =>
                                          handleEventPackageChange(pkg.id, "pgType", value)
                                        }
                                      >
                                        <SelectTrigger id={`pgType-${pkg.id}`} className="w-full sm:w-16 text-white placeholder:text-gray-400" style={{ backgroundColor: 'transparent', borderColor: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid', color: '#ffffff' }}>
                                          <SelectValue placeholder="--" className="text-white" />
                                        </SelectTrigger>
                                        <SelectContent style={{ backgroundColor: 'transparent', borderColor: '#ffffff' }}>
                                          <SelectItem value="EF" className="text-white hover:bg-[#1a0f3d]">EF</SelectItem>
                                          <SelectItem value="GH" className="text-white hover:bg-[#1a0f3d]">GH</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2 min-w-0">
                                      <Label htmlFor={`videographers-${pkg.id}`} className="text-xs sm:text-sm font-medium leading-none text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>VGs No</Label>
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
                                        className="w-full text-sm text-white placeholder:text-gray-400"
                                        style={{ backgroundColor: 'transparent', borderColor: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`vgType-${pkg.id}`} className="text-sm font-medium leading-none text-white">VG-Type</Label>
                                      <Select
                                        value={pkg.vgType || ""}
                                        onValueChange={(value) =>
                                          handleEventPackageChange(pkg.id, "vgType", value)
                                        }
                                      >
                                        <SelectTrigger id={`vgType-${pkg.id}`} className="w-16 text-white placeholder:text-gray-400" style={{ backgroundColor: 'transparent', borderColor: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid', color: '#ffffff' }}>
                                          <SelectValue placeholder="--" className="text-white" />
                                        </SelectTrigger>
                                        <SelectContent style={{ backgroundColor: 'transparent', borderColor: '#ffffff' }}>
                                          <SelectItem value="AB" className="text-white hover:bg-[#1a0f3d]">AB</SelectItem>
                                          <SelectItem value="CD" className="text-white hover:bg-[#1a0f3d]">CD</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                // Completed event - show editable fields when expanded, read-only when collapsed
                                <div className="space-y-4">
                                  {isExpanded ? (
                                    // Expanded (edit mode) - show editable input fields
                                    <>
                                      {/* First row: Event Type and Days No. */}
                                      <div className="flex items-center gap-4 w-full">
                                        <div className={pkg.eventType === "other" ? "w-full sm:w-[35%]" : "w-full sm:w-1/2"}>
                                          <Select
                                            value={pkg.eventType}
                                            onValueChange={(value) =>
                                              handleEventPackageChange(pkg.id, "eventType", value)
                                            }
                                          >
                                            <SelectTrigger id={`eventType-${pkg.id}`} className="text-white placeholder:text-gray-400" style={{ backgroundColor: 'transparent', borderColor: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid', color: '#ffffff' }}>
                                              <SelectValue placeholder="Select an event type" className="text-white" />
                                            </SelectTrigger>
                                            <SelectContent style={{ backgroundColor: 'transparent', borderColor: '#ffffff' }}>
                                              <SelectItem value="wedding" className="text-white hover:bg-[#1a0f3d]">Wedding</SelectItem>
                                              <SelectItem value="engagement" className="text-white hover:bg-[#1a0f3d]">Engagement</SelectItem>
                                              <SelectItem value="corporate" className="text-white hover:bg-[#1a0f3d]">Corporate</SelectItem>
                                              <SelectItem value="portrait" className="text-white hover:bg-[#1a0f3d]">Portrait</SelectItem>
                                              <SelectItem value="event" className="text-white hover:bg-[#1a0f3d]">Event</SelectItem>
                                              <SelectItem value="commercial" className="text-white hover:bg-[#1a0f3d]">Commercial</SelectItem>
                                              <SelectItem value="other" className="text-white hover:bg-[#1a0f3d]">Other</SelectItem>
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
                                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-white"
                                          style={{ backgroundColor: 'transparent', borderColor: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                                            />
                                          </div>
                                        )}
                                        <div className="flex-shrink-0 flex items-center gap-2 ml-4">
                                          <Label htmlFor={`daysCount-${pkg.id}`} className="text-sm font-medium leading-none whitespace-nowrap text-white">Days No.</Label>
                                          <Input
                                            id={`daysCount-${pkg.id}`}
                                            type="number"
                                            step="1"
                                            min="0"
                                            placeholder="Days No."
                                            value={pkg.daysCount || "1"}
                                            onChange={(e) => handleEventPackageChange(pkg.id, "daysCount", e.target.value)}
                                            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-20 text-white"
                                            style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                                          />
                                        </div>
                                      </div>

                                      {/* Second row: PGs No, PGDays, VGs No, VGDays */}
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                        <div className="space-y-2 min-w-0">
                                          <Label htmlFor={`photographers-${pkg.id}`} className="text-xs sm:text-sm font-medium leading-none text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>PGs No</Label>
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
                                            className="w-full text-sm text-white placeholder:text-gray-400"
                                            style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                                          />
                                        </div>
                                        <div className="space-y-2 min-w-0">
                                          <Label htmlFor={`pgType-${pkg.id}`} className="text-xs sm:text-sm font-medium leading-none text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>PG-Type</Label>
                                          <Select
                                            value={pkg.pgType || ""}
                                            onValueChange={(value) =>
                                              handleEventPackageChange(pkg.id, "pgType", value)
                                            }
                                          >
                                            <SelectTrigger id={`pgType-${pkg.id}`} className="w-full sm:w-16 text-white placeholder:text-gray-400" style={{ backgroundColor: 'transparent', borderColor: '#ffffff', color: '#ffffff' }}>
                                              <SelectValue placeholder="--" className="text-white" />
                                            </SelectTrigger>
                                            <SelectContent style={{ backgroundColor: 'transparent', borderColor: '#ffffff' }}>
                                              <SelectItem value="EF" className="text-white hover:bg-[#1a0f3d]">EF</SelectItem>
                                              <SelectItem value="GH" className="text-white hover:bg-[#1a0f3d]">GH</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-2 min-w-0">
                                          <Label htmlFor={`videographers-${pkg.id}`} className="text-xs sm:text-sm font-medium leading-none text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>VGs No</Label>
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
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-white"
                                            style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`vgType-${pkg.id}`} className="text-sm font-medium leading-none text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>VG-Type</Label>
                                          <Select
                                            value={pkg.vgType || ""}
                                            onValueChange={(value) =>
                                              handleEventPackageChange(pkg.id, "vgType", value)
                                            }
                                          >
                                            <SelectTrigger id={`vgType-${pkg.id}`} className="w-16 text-white placeholder:text-gray-400" style={{ backgroundColor: 'transparent', borderColor: '#ffffff', color: '#ffffff' }}>
                                              <SelectValue placeholder="--" className="text-white" />
                                            </SelectTrigger>
                                            <SelectContent style={{ backgroundColor: 'transparent', borderColor: '#ffffff' }}>
                                              <SelectItem value="AB" className="text-white hover:bg-[#1a0f3d]">AB</SelectItem>
                                              <SelectItem value="CD" className="text-white hover:bg-[#1a0f3d]">CD</SelectItem>
                                            </SelectContent>
                                          </Select>
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
                                            <span className="text-gray-300" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>Event Type:</span>
                                            <span className="font-medium capitalize text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>
                                              {pkg.eventType === "other" && pkg.customEventTypeName
                                                ? pkg.customEventTypeName
                                                : pkg.eventType || "Not set"}
                                            </span>
                                          </div>
                                          {pkg.startDate && (
                                            <div className="flex items-center gap-2">
                                              <span className="text-gray-300" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>On:</span>
                                              <span className="font-medium text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>{format(pkg.startDate, "MMM dd, yyyy")}</span>
                                            </div>
                                          )}
                                          <div className="flex items-center gap-2">
                                            <span className="text-gray-300" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>Cost:</span>
                                            <span className="font-medium text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>₹{(() => {
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
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="text-gray-300 truncate" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>PGs No:</span>
                                          <span className="font-medium text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>{pkg.photographersCount || "0"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="text-gray-300 truncate" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>PG-Type:</span>
                                          <span className="font-medium text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>{pkg.pgType || "--"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="text-gray-300 truncate" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>VGs No:</span>
                                          <span className="font-medium text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>{pkg.videographersCount || "0"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="text-gray-300 truncate" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>VG-Type:</span>
                                          <span className="font-medium text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>{pkg.vgType || "--"}</span>
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
                                  <Label className="text-sm font-medium leading-none text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>Event StartDate & Time</Label>
                                  <div className="flex items-end gap-4">
                                    {/* Date Selection */}
                                    <div className="flex-shrink-0">
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            className={cn(
                                              "inline-flex items-center gap-1 sm:gap-2 whitespace-nowrap rounded-md text-xs sm:text-sm md:text-base ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:h-3 [&_svg]:w-3 sm:[&_svg]:size-4 [&_svg]:shrink-0 border-0 bg-background hover:bg-accent hover:text-accent-foreground h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 w-full justify-start text-left font-normal text-white",
                                              !pkg.startDate && "text-gray-400"
                                            )}
                                            style={{ backgroundColor: 'transparent', borderColor: '#ffffff', color: '#ffffff' }}
                                          >
                                            <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" />
                                            {pkg.startDate ? (
                                              format(pkg.startDate, "MM/dd/yyyy")
                                            ) : (
                                              <span className="text-xs sm:text-sm text-gray-400">mm/dd/yyyy</span>
                                            )}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 rounded-lg" align="start" style={{ backgroundColor: '#1a0f3d', borderColor: '#ffffff', borderWidth: '2px', borderStyle: 'solid' }}>
                                          <Calendar
                                            mode="single"
                                            selected={pkg.startDate}
                                            onSelect={(date) => handleEventPackageChange(pkg.id, "startDate", date)}
                                            className="text-white"
                                            classNames={{
                                              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                              month: "space-y-4 w-full",
                                              caption: "flex justify-center pt-1 relative items-center",
                                              caption_label: "text-sm font-medium uppercase text-white text-center",
                                              nav: "space-x-1 flex items-center",
                                              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-0 text-white",
                                              nav_button_previous: "absolute left-1",
                                              nav_button_next: "absolute right-1",
                                              table: "w-full border-collapse space-y-1",
                                              head_row: "flex justify-center",
                                              head_cell: "text-white rounded-md w-9 font-normal text-[0.8rem] uppercase font-medium opacity-80 text-center",
                                              row: "flex w-full mt-2 justify-center",
                                              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent/50 text-sm rounded-md text-white text-center flex items-center justify-center",
                                              day_range_end: "day-range-end",
                                              day_selected: "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary",
                                              day_today: "border border-primary/50 text-primary font-medium",
                                              day_outside: "day-outside text-white opacity-50 aria-selected:bg-accent/50 aria-selected:text-white aria-selected:opacity-30",
                                              day_disabled: "text-white opacity-50",
                                              day_range_middle: "aria-selected:bg-accent aria-selected:text-white",
                                              day_hidden: "invisible",
                                            }}
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
                                  </div>
                                </div>

                                {/* PG-Type & VG-Type */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                                  <div className="space-y-2 min-w-0">
                                    <Label htmlFor={`pgType-${pkg.id}`} className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>PG-Type</Label>
                                    <Select
                                      value={pkg.pgType || ""}
                                      onValueChange={(value) =>
                                        handleEventPackageChange(pkg.id, "pgType", value)
                                      }
                                    >
                                    <SelectTrigger id={`pgType-${pkg.id}`} className="w-full sm:w-16 text-white placeholder:text-gray-400" style={{ backgroundColor: 'transparent', borderColor: '#ffffff', color: '#ffffff' }}>
                                      <SelectValue placeholder="--" className="text-white" />
                                    </SelectTrigger>
                                    <SelectContent style={{ backgroundColor: 'transparent', borderColor: '#ffffff' }}>
                                      <SelectItem value="EF" className="text-white hover:bg-[#1a0f3d]">EF</SelectItem>
                                      <SelectItem value="GH" className="text-white hover:bg-[#1a0f3d]">GH</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2 min-w-0">
                                  <Label htmlFor={`vgType-${pkg.id}`} className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>VG-Type</Label>
                                    <Select
                                      value={pkg.vgType || ""}
                                      onValueChange={(value) =>
                                        handleEventPackageChange(pkg.id, "vgType", value)
                                      }
                                    >
                                    <SelectTrigger id={`vgType-${pkg.id}`} className="w-full sm:w-16 text-white placeholder:text-gray-400" style={{ backgroundColor: 'transparent', borderColor: '#ffffff', color: '#ffffff' }}>
                                      <SelectValue placeholder="--" className="text-white" />
                                    </SelectTrigger>
                                    <SelectContent style={{ backgroundColor: 'transparent', borderColor: '#ffffff' }}>
                                      <SelectItem value="AB" className="text-white hover:bg-[#1a0f3d]">AB</SelectItem>
                                      <SelectItem value="CD" className="text-white hover:bg-[#1a0f3d]">CD</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {/* PhotoPOC & VideoPOC */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                                <div className="space-y-2 min-w-0">
                                  <Label htmlFor={`photoCoordinator-${pkg.id}`} className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>PhotoPOC</Label>
                                    <div className="flex items-end gap-2">
                                      {pkg.photographyCoordinatorId ? (
                                        <div className="flex items-center justify-between p-3 border rounded-md flex-1 w-[60%]" style={{ backgroundColor: 'transparent', borderColor: '#ffffff' }}>
                                          <div className="flex-1">
                                            <div className="font-medium text-sm text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>
                                              {photographers.find(p => p.photographer_phno === pkg.photographyCoordinatorId)?.photographer_name || 'Photographer'}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-300 mt-1" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>
                                              <Phone className="h-3 w-3" />
                                              {pkg.photographyCoordinatorId}
                                            </div>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEventPackageChange(pkg.id, "photographyCoordinatorId", undefined)}
                                            className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-[#1a0f3d]"
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
                                          <SelectTrigger id={`photoCoordinator-${pkg.id}`} className="w-[60%] text-white placeholder:text-gray-400" style={{ backgroundColor: 'transparent', borderColor: '#ffffff', color: '#ffffff' }}>
                                            <SelectValue placeholder={loadingPhotographers ? "Loading..." : "select POC"} className="text-white" />
                                          </SelectTrigger>
                                          <SelectContent style={{ backgroundColor: 'transparent', borderColor: '#ffffff' }}>
                                            {photographers.map((photographer) => (
                                              <SelectItem key={photographer.photographer_phno} value={photographer.photographer_phno} className="text-white hover:bg-[#1a0f3d]">
                                                {photographer.photographer_name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`videoCoordinator-${pkg.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 whitespace-nowrap max-w-fit text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>VideoPOC</Label>
                                    <div className="flex items-end gap-2">
                                      {pkg.videographyCoordinatorId ? (
                                        <div className="flex items-center justify-between p-3 border rounded-md flex-1 w-[60%]" style={{ backgroundColor: 'transparent', borderColor: '#ffffff' }}>
                                          <div className="flex-1">
                                            <div className="font-medium text-sm text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>
                                              {videographers.find(v => v.videographer_phno === pkg.videographyCoordinatorId)?.videographer_name || 'Videographer'}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-300 mt-1" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>
                                              <Phone className="h-3 w-3" />
                                              {pkg.videographyCoordinatorId}
                                            </div>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEventPackageChange(pkg.id, "videographyCoordinatorId", undefined)}
                                            className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-[#1a0f3d]"
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
                                          <SelectTrigger id={`videoCoordinator-${pkg.id}`} className="w-[60%] text-white placeholder:text-gray-400" style={{ backgroundColor: 'transparent', borderColor: '#ffffff', color: '#ffffff' }}>
                                            <SelectValue placeholder={loadingVideographers ? "Loading..." : "select POC"} className="text-white" />
                                          </SelectTrigger>
                                          <SelectContent style={{ backgroundColor: 'transparent', borderColor: '#ffffff' }}>
                                            {videographers.map((videographer) => (
                                              <SelectItem key={videographer.videographer_phno} value={videographer.videographer_phno} className="text-white hover:bg-[#1a0f3d]">
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
                                    <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 whitespace-nowrap max-w-fit text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>Client Name:</Label>
                                    <Input
                                      value={loadingProjectDetails ? "Loading..." : (projectDetails?.client_name || formData.clientFullName || "Not set")}
                                      disabled
                                      className="bg-muted text-white"
                                      style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 whitespace-nowrap max-w-fit text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>Client Ph:</Label>
                                    <Input
                                      value={loadingProjectDetails ? "Loading..." : (projectDetails?.clientid_phno || formData.clientPhone || "Not set")}
                                      disabled
                                      className="bg-muted max-w-[200px] text-white"
                                      style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                                    />
                                  </div>
                                </div>

                                {/* Event Deliverables Notes */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor={`deliverablesNotes-${pkg.id}`} className="text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>Event Deliverables Notes</Label>
                                    <Pencil className="h-4 w-4 text-gray-300" />
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
                                      "w-full text-white placeholder:text-gray-400"
                                    )}
                                    style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                                  />
                                </div>

                                {/* Event Prep Checklist */}
                                <div className="space-y-2">
                                  <Label className="text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>Event Prep Checklist</Label>
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
                                          className="flex-1 text-white placeholder:text-gray-400"
                                          style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                                        />
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveChecklistItem(pkg.id, item.id)}
                                          className="text-red-400 hover:text-red-300 hover:bg-[#1a0f3d]"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAddChecklistItem(pkg.id)}
                                      className="w-full bg-[#2d1b4e] text-white border-[#3d2a5f] hover:bg-[#1a0f3d]"
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
                          className="w-full sm:w-[45%] h-fit self-start bg-[#2d1b4e] text-white border-[#5a4a7a] hover:bg-[#1a0f3d]"
                          style={{ borderWidth: '1.5px', borderStyle: 'solid' }}
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
                            className="w-full sm:w-[45%] bg-[#2d1b4e] text-white border-[#5a4a7a] hover:bg-[#1a0f3d]"
                            style={{ borderWidth: '1.5px', borderStyle: 'solid' }}
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
                    <Card className="rounded-lg bg-card text-card-foreground shadow-sm p-3 sm:p-4 w-full sm:w-[45%] relative border-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.6),0_0_40px_rgba(59,130,246,0.4)] hover:border-blue-400/60 hover:scale-[1.02]" style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-white">Price</h3>
                        <div className="flex items-center gap-2">
                          {!isEditingPriceCard ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setIsEditingPriceCard(true);
                                // Initialize editable prices with current calculated values
                                // Only actualPrice is editable, others are calculated
                                const gstCalc = actualPrice * 0.18;
                                const subtotalCalc = actualPrice + gstCalc; // Sub total = actualPrice + GST
                                const totalCalc = actualPrice + gstCalc; // Total = actualPrice + GST
                                setEditablePrices({
                                  actualPrice: actualPrice.toLocaleString(),
                                  subtotal: subtotalCalc.toLocaleString(),
                                  gst: gstCalc.toLocaleString(),
                                  total: totalCalc.toLocaleString(),
                                });
                              }}
                              className="h-8 px-2 text-white"
                              style={{ color: '#ffffff' }}
                              title="Edit price values"
                            >
                              <Pencil className="h-4 w-4 text-white" style={{ color: '#ffffff' }} />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                await saveCostItems();
                                setIsEditingPriceCard(false);
                              }}
                              className="h-8 px-2 text-green-600 hover:text-green-700"
                              title="Save price values"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsPriceDetailsExpanded(!isPriceDetailsExpanded)}
                            className="h-8 px-2 text-white"
                            style={{ color: '#ffffff' }}
                          >
                            <span style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>Details</span>
                            {isPriceDetailsExpanded ? (
                              <ChevronUp className="ml-1 h-4 w-4 text-white" style={{ color: '#ffffff' }} />
                            ) : (
                              <ChevronDown className="ml-1 h-4 w-4 text-white" style={{ color: '#ffffff' }} />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {isEditingPriceCard ? (
                          <>
                            {/* Row 1: Actual Price (editable) */}
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-300" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>Actual price:</span>
                              <div className="flex items-center gap-2">
                                <span className="text-white">₹</span>
                                <Input
                                  type="text"
                                  value={editablePrices.actualPrice}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9,]/g, '');
                                    const actualPriceNum = parseFloat(value.replace(/,/g, '')) || 0;
                                    const gstValue = actualPriceNum * 0.18;
                                    const subtotalValue = actualPriceNum + gstValue; // Sub total = actualPrice + GST
                                    const totalValue = actualPriceNum + gstValue;
                                    setEditablePrices(prev => ({
                                      ...prev,
                                      actualPrice: value,
                                      subtotal: subtotalValue.toLocaleString(),
                                      gst: gstValue.toLocaleString(),
                                      total: totalValue.toLocaleString(),
                                    }));
                                  }}
                                  className="w-24 h-8 text-right text-white placeholder:text-gray-400"
                                  style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                            {/* Row 2: GST (not editable, calculated) */}
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-300" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>GST (18%):</span>
                              <div className="flex items-center gap-2">
                                <span className="text-white">₹</span>
                                <span className="w-24 h-8 text-right flex items-center justify-end text-white">
                                  {(() => {
                                    const actualPriceNum = parseFloat(editablePrices.actualPrice.replace(/,/g, '')) || 0;
                                    const gstValue = actualPriceNum * 0.18;
                                    return gstValue.toLocaleString();
                                  })()}
                                </span>
                              </div>
                            </div>
                            {/* Row 3: Sub Total (not editable, actualPrice + GST) */}
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-300" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>Sub total:</span>
                              <div className="flex items-center gap-2">
                                <span className="text-white">₹</span>
                                <span className="w-24 h-8 text-right flex items-center justify-end text-white">
                                  {(() => {
                                    const actualPriceNum = parseFloat(editablePrices.actualPrice.replace(/,/g, '')) || 0;
                                    const gstValue = actualPriceNum * 0.18;
                                    const subtotalValue = actualPriceNum + gstValue;
                                    return subtotalValue.toLocaleString();
                                  })()}
                                </span>
                              </div>
                            </div>
                            {/* Row 4: Total Price (not editable, calculated as actualPrice + GST) */}
                            <div className="border-t pt-3 mt-3" style={{ borderColor: '#ffffff' }}>
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-white">Total price:</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-white">₹</span>
                                  <span className="w-32 h-8 text-right font-bold text-blue-400 flex items-center justify-end">
                                    {(() => {
                                      const actualPriceNum = parseFloat(editablePrices.actualPrice.replace(/,/g, '')) || 0;
                                      const gstValue = actualPriceNum * 0.18;
                                      const totalValue = actualPriceNum + gstValue;
                                      return totalValue.toLocaleString();
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Row 1: Actual Price */}
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-300" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>Actual price:</span>
                              <span className="text-white">₹{editablePrices.actualPrice || actualPrice.toLocaleString()}</span>
                            </div>
                            {/* Row 2: GST */}
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-300" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>GST (18%):</span>
                              <span className="text-white">₹{(() => {
                                const actualPriceNum = editablePrices.actualPrice 
                                  ? parseFloat(editablePrices.actualPrice.replace(/,/g, '')) 
                                  : actualPrice;
                                const gstValue = actualPriceNum * 0.18;
                                return gstValue.toLocaleString();
                              })()}</span>
                            </div>
                            {/* Row 3: Sub Total */}
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-300" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>Sub total:</span>
                              <span className="text-white">₹{(() => {
                                const actualPriceNum = editablePrices.actualPrice 
                                  ? parseFloat(editablePrices.actualPrice.replace(/,/g, '')) 
                                  : actualPrice;
                                const gstValue = actualPriceNum * 0.18;
                                const subtotalValue = actualPriceNum + gstValue;
                                return subtotalValue.toLocaleString();
                              })()}</span>
                            </div>
                            {/* Row 4: Total Price */}
                            <div className="border-t pt-3 mt-3" style={{ borderColor: '#ffffff' }}>
                              <div className="flex justify-between">
                                <span className="font-semibold text-white">Total price:</span>
                                <span className="font-bold text-blue-400 text-lg">
                                  ₹{(() => {
                                    const actualPriceNum = editablePrices.actualPrice 
                                      ? parseFloat(editablePrices.actualPrice.replace(/,/g, '')) 
                                      : actualPrice;
                                    const gstValue = actualPriceNum * 0.18;
                                    const totalValue = actualPriceNum + gstValue;
                                    return totalValue.toLocaleString();
                                  })()}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Event-wise Cost Breakdown */}
                      {isPriceDetailsExpanded && (
                        <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: '#ffffff' }}>
                          <h4 className="font-semibold text-sm mb-3 text-white">Event-wise Cost Estimates</h4>
                          {calculateEventWiseCosts().map((eventCost, index) => (
                            <div key={index} className="rounded-lg bg-card text-card-foreground shadow-sm p-3 sm:p-4 space-y-2 relative border-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.6),0_0_40px_rgba(59,130,246,0.4)] hover:border-blue-400/60 hover:scale-[1.02]" style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm text-white">{eventCost.eventName}</p>
                                  <p className="text-xs text-gray-300 capitalize">
                                    {eventCost.eventType}
                                  </p>
                                </div>
                                <p className="font-semibold text-sm text-white">
                                  ₹{eventCost.total.toLocaleString()}
                                </p>
                              </div>
                              <div className="text-xs space-y-1 text-gray-300">
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
                            <p className="text-sm text-gray-300 text-center py-2">
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
                      className="mr-4 bg-[#2d1b4e] text-white border-[#5a4a7a] hover:bg-[#1a0f3d]"
                      style={{ borderWidth: '1.5px', borderStyle: 'solid' }}
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={!eventsSaved}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <Label className="text-sm text-gray-300 mb-2">Select a template</Label>
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
                          <SelectTrigger className="w-48 text-white placeholder:text-gray-400" style={{ backgroundColor: 'transparent', borderColor: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid', color: '#ffffff' }}>
                            <SelectValue placeholder="Select template" className="text-white" />
                          </SelectTrigger>
                          <SelectContent style={{ backgroundColor: 'transparent', borderColor: '#ffffff' }}>
                            <SelectItem value="standard_wedding.pdf" className="text-white hover:bg-[#1a0f3d]">Standard Wedding</SelectItem>
                            <SelectItem value="file-sample_150kB.pdf" className="text-white hover:bg-[#1a0f3d]">Sample Template</SelectItem>
                            <SelectItem value="premium_wedding.pdf" className="text-white hover:bg-[#1a0f3d]">Premium Wedding</SelectItem>
                            <SelectItem value="corporate.pdf" className="text-white hover:bg-[#1a0f3d]">Corporate</SelectItem>
                            <SelectItem value="portrait.pdf" className="text-white hover:bg-[#1a0f3d]">Portrait</SelectItem>
                            <SelectItem value="event.pdf" className="text-white hover:bg-[#1a0f3d]">Event</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 bg-[#2d1b4e] text-white border-[#5a4a7a] hover:bg-[#1a0f3d]"
                          style={{ borderWidth: '1.5px', borderStyle: 'solid' }}
                          onClick={handleEditPdf}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 bg-[#2d1b4e] text-white border-[#5a4a7a] hover:bg-[#1a0f3d]"
                          style={{ borderWidth: '1.5px', borderStyle: 'solid' }}
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
                    <div className="rounded-lg bg-card text-card-foreground shadow-sm min-h-[600px] flex flex-col p-3 sm:p-4 relative border-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.6),0_0_40px_rgba(59,130,246,0.4)] hover:border-blue-400/60 hover:scale-[1.02]" style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}>
                      {isEditingPdf ? (
                        <div className="flex flex-col h-full">
                          {/* PDF Viewer */}
                          <div className="flex-1 w-full h-full border-b" style={{ borderColor: '#ffffff' }}>
                            <iframe
                              src={selectedPdfPath}
                              className="w-full h-full min-h-[400px] border-0"
                              title="PDF Viewer"
                            />
                          </div>
                          
                          {/* Editable Form Section */}
                          <div className="p-6 border-t max-h-[400px] overflow-y-auto" style={{ backgroundColor: 'transparent', borderColor: '#ffffff' }}>
                            <div className="space-y-6">
                              {/* Price Table Editor */}
                              <div className="rounded-lg bg-card text-card-foreground shadow-sm p-3 sm:p-4 relative border-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.6),0_0_40px_rgba(59,130,246,0.4)] hover:border-blue-400/60 hover:scale-[1.02]" style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}>
                                <h3 className="font-semibold text-lg mb-4 text-white">Edit Price Summary</h3>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-actual-price" className="text-white">Actual Price (₹)</Label>
                                    <Input
                                      id="edit-actual-price"
                                      type="text"
                                      value={editablePrices.actualPrice}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9,]/g, '');
                                        setEditablePrices(prev => ({ ...prev, actualPrice: value }));
                                      }}
                                      placeholder="Enter actual price"
                                      className="text-white placeholder:text-gray-400"
                                      style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-subtotal" className="text-white">Sub Total (₹)</Label>
                                    <Input
                                      id="edit-subtotal"
                                      type="text"
                                      value={editablePrices.subtotal}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9,]/g, '');
                                        setEditablePrices(prev => ({ ...prev, subtotal: value }));
                                      }}
                                      placeholder="Enter subtotal"
                                      className="text-white placeholder:text-gray-400"
                                      style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-gst" className="text-white">GST (18%) (₹)</Label>
                                    <Input
                                      id="edit-gst"
                                      type="text"
                                      value={editablePrices.gst}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9,]/g, '');
                                        setEditablePrices(prev => ({ ...prev, gst: value }));
                                      }}
                                      placeholder="Enter GST amount"
                                      className="text-white placeholder:text-gray-400"
                                      style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-total" className="text-white">Total Price (₹)</Label>
                                    <Input
                                      id="edit-total"
                                      type="text"
                                      value={editablePrices.total}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9,]/g, '');
                                        setEditablePrices(prev => ({ ...prev, total: value }));
                                      }}
                                      placeholder="Enter total price"
                                      className="font-semibold text-white placeholder:text-gray-400"
                                      style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              {/* Additional Notes Editor */}
                              <div className="rounded-lg bg-card text-card-foreground shadow-sm p-3 sm:p-4 relative border-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.6),0_0_40px_rgba(59,130,246,0.4)] hover:border-blue-400/60 hover:scale-[1.02]" style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}>
                                <Label htmlFor="pdf-edit-text" className="mb-2 block font-semibold text-white">
                                  Edit Additional Notes:
                                </Label>
                                <Textarea
                                  id="pdf-edit-text"
                                  value={pdfEditText}
                                  onChange={(e) => setPdfEditText(e.target.value)}
                                  placeholder="Enter additional notes or text to add to the price card page..."
                                  rows={6}
                                  className="mb-3 text-white placeholder:text-gray-400"
                                  style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
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
                                  className="bg-[#2d1b4e] text-white border-[#3d2a5f] hover:bg-[#1a0f3d]"
                                >
                                  Cancel
                                </Button>
                                <Button onClick={handleSavePdf} className="bg-blue-600 hover:bg-blue-700 text-white">
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
                        <div className="rounded-lg bg-card text-card-foreground shadow-sm flex flex-col items-center justify-center p-12 min-h-[500px] relative border-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.6),0_0_40px_rgba(59,130,246,0.4)] hover:border-blue-400/60 hover:scale-[1.02]" style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}>
                          <div className="text-center space-y-4 mb-6">
                            <p className="text-lg font-semibold text-white">
                              Your quotation will appear here
                            </p>
                            <p className="text-sm text-gray-300">
                              Please select a quotation format and then choose 'Preview' or 'Edit' to begin.
                            </p>
                          </div>
                          <Button variant="outline" className="h-10 px-4 py-2 bg-[#2d1b4e] text-white border-[#3d2a5f] hover:bg-[#1a0f3d]">
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
                        className="h-9 bg-[#2d1b4e] text-white border-[#5a4a7a] hover:bg-[#1a0f3d]"
                        style={{ borderWidth: '1.5px', borderStyle: 'solid' }}
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={handleSaveEvent}
                        variant="outline"
                        className="h-9 bg-[#2d1b4e] text-white border-[#5a4a7a] hover:bg-[#1a0f3d] px-8"
                        style={{ borderWidth: '1.5px', borderStyle: 'solid' }}
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


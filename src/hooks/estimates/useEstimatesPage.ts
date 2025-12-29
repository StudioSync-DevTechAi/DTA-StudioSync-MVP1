
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useEstimatesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showNewEstimateForm, setShowNewEstimateForm] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTab, setCurrentTab] = useState("pending");
  const [estimates, setEstimates] = useState(() => {
    const savedEstimates = localStorage.getItem("estimates");
    return savedEstimates ? JSON.parse(savedEstimates) : [];
  });
  const [approvedEstimatesFromDB, setApprovedEstimatesFromDB] = useState<any[]>([]);
  const [isLoadingApproved, setIsLoadingApproved] = useState(false);
  const [estimateCounts, setEstimateCounts] = useState({ pending: 0, approved: 0, declined: 0 });

  useEffect(() => {
    localStorage.setItem("estimates", JSON.stringify(estimates));
  }, [estimates]);

  const handleEditEstimate = (estimate) => {
    setSelectedEstimate(estimate);
    setIsEditing(true);
    setShowNewEstimateForm(true);
  };

  const handleOpenPreview = (estimate) => {
    setSelectedEstimate(estimate);
    setShowPreview(true);
  };

  // Function to save approved estimate to both project_estimation_table and invoice_items_table
  const saveApprovedEstimateToDatabase = async (
    estimateId: string, 
    estimate: any,
    options?: { isProjectRequested?: boolean; isInvoiceRequested?: boolean }
  ) => {
    try {
      // Get photography owner phone number
      const { data: ownerData, error: ownerError } = await supabase
        .from("photography_owner_table")
        .select("photography_owner_phno")
        .limit(1)
        .maybeSingle();
      
      if (ownerError) {
        console.warn("Error fetching photography owner:", ownerError);
      }

      const photographyOwnerPhno = ownerData?.photography_owner_phno;
      if (!photographyOwnerPhno) {
        throw new Error("Photography owner not found. Please ensure you are enrolled as a photography owner.");
      }

      const isProjectRequested = options?.isProjectRequested ?? false;
      const isInvoiceRequested = options?.isInvoiceRequested ?? false;

      // Get or create project_estimate_uuid
      let projectEstimateUuid = estimate.project_estimate_uuid;
      
      // Step 1: Update or create in project_estimation_table
      if (projectEstimateUuid) {
        // If isProjectRequested is true, set status to PRE-PROD (so it shows in ProjectBoard)
        // Otherwise, set status to LEAD-INPROGRESS (shows in "Lead In Progress" column)
        const projectStatus = isProjectRequested ? 'PRE-PROD' : 'LEAD-INPROGRESS';
        
        // Update existing project status with boolean flags and estimate_status
        const { data: updateData, error: updateError } = await supabase.rpc('update_project_status', {
          p_project_estimate_uuid: projectEstimateUuid,
          p_project_status: projectStatus,
          p_is_project_requested: isProjectRequested,
          p_is_invoice_requested: isInvoiceRequested,
          p_estimate_status: 'APPROVED'  // Set estimate_status to APPROVED when approving
        });

        if (updateError) {
          console.error("Error updating project status:", updateError);
          // Try direct update as fallback
          const projectStatus = isProjectRequested ? 'PRE-PROD' : 'LEAD-INPROGRESS';
          const { error: directUpdateError } = await supabase
            .from('project_estimation_table')
            .update({
              project_status: projectStatus,
              estimate_status: 'APPROVED',  // Set estimate_status to APPROVED
              is_project_requested: isProjectRequested,
              is_invoice_requested: isInvoiceRequested,
              updated_at: new Date().toISOString()
            })
            .eq('project_estimate_uuid', projectEstimateUuid);

          if (directUpdateError) {
            throw directUpdateError;
          }
        }
      } else {
        // Create new project estimation record if it doesn't exist
        const { data: projectData, error: projectError } = await supabase.rpc('create_project_estimation', {
          p_project_name: estimate.clientName || estimate.projectName || '',
          p_project_type: estimate.projectType || '',
          p_start_date: estimate.startDate || null,
          p_start_time: estimate.startTime || null,
          p_start_datetime_confirmed: false,
          p_end_date: estimate.endDate || null,
          p_end_time: estimate.endTime || null,
          p_end_datetime_confirmed: false,
          p_photography_owner_phno: photographyOwnerPhno,
          p_client_name: estimate.clientName || '',
          p_client_email: estimate.clientEmail || '',
          p_client_phno: estimate.clientPhone || '',
          p_is_drafted: false,
          p_is_project_requested: isProjectRequested,
          p_is_invoice_requested: isInvoiceRequested
        });

        if (projectError) {
          console.error("Error creating project estimation:", projectError);
          throw projectError;
        }

        projectEstimateUuid = projectData?.project_estimate_uuid;
        
        // If isProjectRequested is true, set status to PRE-PROD (so it shows in ProjectBoard)
        // Otherwise, set status to LEAD-INPROGRESS (shows in "Lead In Progress" column)
        const projectStatus = isProjectRequested ? 'PRE-PROD' : 'LEAD-INPROGRESS';
        
        // Update status with boolean flags and estimate_status
        if (projectEstimateUuid) {
          const { error: statusError } = await supabase.rpc('update_project_status', {
            p_project_estimate_uuid: projectEstimateUuid,
            p_project_status: projectStatus,
            p_is_project_requested: isProjectRequested,
            p_is_invoice_requested: isInvoiceRequested,
            p_estimate_status: 'APPROVED'  // Set estimate_status to APPROVED when approving
          });

          if (statusError) {
            console.warn("Error setting project status:", statusError);
          }
        }
      }

      // Step 2: Create/update in invoice_items_table (only if isInvoiceRequested is true)
      // Note: We still create invoice if isInvoiceRequested is false for backward compatibility
      // but you can add a check here if you want to skip invoice creation when checkbox is unchecked
      const clientPhno = estimate.clientPhone?.replace(/\s/g, '') || '';
      if (!clientPhno) {
        console.warn("No client phone number found, skipping invoice creation");
        return;
      }

      const invoiceFormData = {
        clientDetails: {
          name: estimate.clientName || '',
          email: estimate.clientEmail || '',
          phone: clientPhno
        },
        invoiceDate: new Date().toISOString().split('T')[0],
        invoiceType: 'proforma',
        items: estimate.items || [],
        totals: {
          subtotal: estimate.amount || '0',
          gst: '0',
          total: estimate.amount || '0'
        },
        paymentTracking: {
          totalAmount: estimate.amount || '0',
          paidAmount: '0',
          balanceAmount: estimate.amount || '0'
        },
        // Store estimate data for reference
        estimateData: {
          ...estimate,
          status: 'approved',
          project_estimate_uuid: projectEstimateUuid
        }
      };

      const { data: invoiceData, error: invoiceError } = await supabase.rpc('save_invoice_items_form_data', {
        p_photography_owner_phno: photographyOwnerPhno,
        p_client_phno: clientPhno,
        p_invoice_form_data: invoiceFormData,
        p_project_estimate_uuid: projectEstimateUuid,
        p_cost_items_uuid: null,
        p_invoice_uuid: null // Create new invoice
      });

      if (invoiceError) {
        console.error("Error saving invoice:", invoiceError);
        throw invoiceError;
      }

      console.log("Approved estimate saved to database successfully", {
        projectEstimateUuid,
        invoiceUuid: invoiceData?.invoice_uuid
      });

      // Update local estimate with project_estimate_uuid if it was created
      if (projectEstimateUuid && !estimate.project_estimate_uuid) {
        setEstimates(prevEstimates => 
          prevEstimates.map(est => 
            est.id === estimateId 
              ? { ...est, project_estimate_uuid: projectEstimateUuid }
              : est
          )
        );
      }
    } catch (error) {
      console.error("Error saving approved estimate to database:", error);
      throw error;
    }
  };

  const handleStatusChange = async (
    estimateId: string, 
    newStatus: string, 
    optionsOrNegotiatedAmount?: { isProjectRequested?: boolean; isInvoiceRequested?: boolean } | string,
    negotiatedAmountOrSelectedIndex?: string | number,
    selectedPackageIndex?: number
  ) => {
    // Handle backward compatibility with multiple function signatures:
    // 1. handleStatusChange(id, status) - no additional params
    // 2. handleStatusChange(id, status, options) - new signature with options object
    // 3. handleStatusChange(id, status, negotiatedAmount, selectedPackageIndex) - old signature
    let actualOptions: { isProjectRequested?: boolean; isInvoiceRequested?: boolean } | undefined;
    let actualNegotiatedAmount: string | undefined;
    let actualSelectedPackageIndex: number | undefined;

    if (optionsOrNegotiatedAmount === undefined) {
      // Case 1: No additional parameters
      actualOptions = undefined;
      actualNegotiatedAmount = undefined;
      actualSelectedPackageIndex = undefined;
    } else if (typeof optionsOrNegotiatedAmount === 'object' && !Array.isArray(optionsOrNegotiatedAmount)) {
      // Case 2: New signature with options object
      actualOptions = optionsOrNegotiatedAmount;
      actualNegotiatedAmount = typeof negotiatedAmountOrSelectedIndex === 'string' ? negotiatedAmountOrSelectedIndex : undefined;
      actualSelectedPackageIndex = typeof negotiatedAmountOrSelectedIndex === 'number' 
        ? negotiatedAmountOrSelectedIndex 
        : selectedPackageIndex;
    } else if (typeof optionsOrNegotiatedAmount === 'string') {
      // Case 3: Old signature - optionsOrNegotiatedAmount is actually negotiatedAmount
      actualOptions = undefined;
      actualNegotiatedAmount = optionsOrNegotiatedAmount;
      actualSelectedPackageIndex = typeof negotiatedAmountOrSelectedIndex === 'number' 
        ? negotiatedAmountOrSelectedIndex 
        : selectedPackageIndex;
    }

    // Update local state first (optimistic update)
    const updatedEstimates = estimates.map(est => {
      if (est.id === estimateId) {
        const updatedEstimate = {
          ...est,
          status: newStatus,
          selectedPackageIndex: actualSelectedPackageIndex
        };
        
        if (actualSelectedPackageIndex !== undefined && updatedEstimate.packages && updatedEstimate.packages[actualSelectedPackageIndex]) {
          updatedEstimate.amount = updatedEstimate.packages[actualSelectedPackageIndex].amount;
        }
        
        if (actualNegotiatedAmount) {
          updatedEstimate.amount = actualNegotiatedAmount;
          
          if (actualSelectedPackageIndex !== undefined && updatedEstimate.packages) {
            updatedEstimate.packages = updatedEstimate.packages.map((pkg, idx) => {
              if (idx === actualSelectedPackageIndex) {
                return {
                  ...pkg,
                  amount: actualNegotiatedAmount
                };
              }
              return pkg;
            });
          } else if (updatedEstimate.packages) {
            const ratio = parseFloat(actualNegotiatedAmount) / parseFloat(est.amount);
            updatedEstimate.packages = updatedEstimate.packages.map(pkg => ({
              ...pkg,
              amount: (parseFloat(pkg.amount) * ratio).toFixed(2)
            }));
          }
        }
        
        return updatedEstimate;
      }
      return est;
    });
    
    setEstimates(updatedEstimates);
    const updatedEstimate = updatedEstimates.find(est => est.id === estimateId);
    setSelectedEstimate(updatedEstimate);
    
    // Update estimate_status in database based on newStatus
    if (updatedEstimate?.project_estimate_uuid) {
      try {
        let estimateStatus: 'PENDING' | 'APPROVED' | 'DECLINED' | null = null;
        
        if (newStatus === "approved") {
          estimateStatus = 'APPROVED';
          // Also call saveApprovedEstimateToDatabase for full approval flow
          await saveApprovedEstimateToDatabase(estimateId, updatedEstimate, actualOptions);
        } else if (newStatus === "declined") {
          estimateStatus = 'DECLINED';
          // Update estimate_status to DECLINED
          const { error: statusError } = await supabase.rpc('update_estimate_status', {
            p_project_estimate_uuid: updatedEstimate.project_estimate_uuid,
            p_estimate_status: 'DECLINED'
          });
          
          if (statusError) {
            console.error("Error updating estimate status to DECLINED:", statusError);
            // Try direct update as fallback
            await supabase
              .from('project_estimation_table')
              .update({ 
                estimate_status: 'DECLINED',
                updated_at: new Date().toISOString()
              })
              .eq('project_estimate_uuid', updatedEstimate.project_estimate_uuid);
          }
        } else if (newStatus === "pending" || newStatus === "negotiating") {
          estimateStatus = 'PENDING';
          // Update estimate_status to PENDING
          const { error: statusError } = await supabase.rpc('update_estimate_status', {
            p_project_estimate_uuid: updatedEstimate.project_estimate_uuid,
            p_estimate_status: 'PENDING'
          });
          
          if (statusError) {
            console.error("Error updating estimate status to PENDING:", statusError);
            // Try direct update as fallback
            await supabase
              .from('project_estimation_table')
              .update({ 
                estimate_status: 'PENDING',
                updated_at: new Date().toISOString()
              })
              .eq('project_estimate_uuid', updatedEstimate.project_estimate_uuid);
          }
        }
      } catch (error) {
        console.error("Error updating estimate status in database:", error);
        // Show error toast but don't revert the UI change
        if (newStatus === "approved") {
          toast({
            title: "Warning",
            description: "Estimate approved locally but failed to save to database. Please try again or contact support.",
            variant: "destructive"
          });
        }
      }
    }
    
    const toastMessages = {
      approved: "Estimate has been approved! Proceeding to next steps.",
      declined: "Estimate has been declined.",
      negotiating: "Estimate status updated to negotiating.",
      pending: "Estimate status updated to pending."
    };
    
    toast({
      title: "Status Updated",
      description: toastMessages[newStatus] || "Estimate status has been updated.",
      variant: newStatus === "declined" ? "destructive" : "default"
    });
  };

  const handleQuickStatusChange = (estimateId: string, newStatus: string) => {
    handleStatusChange(estimateId, newStatus);
    setShowPreview(false);
  };

  const handleGoToScheduling = (estimateId: string) => {
    navigate(`/scheduling?estimateId=${estimateId}`);
  };

  const handleCreateNewEstimate = () => {
    setIsEditing(false);
    setSelectedEstimate(null);
    setShowNewEstimateForm(true);
  };

  const handleCloseForm = () => {
    setShowNewEstimateForm(false);
    setIsEditing(false);
    setSelectedEstimate(null);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  const handleEstimateSaved = (savedEstimate: any) => {
    // Add the saved estimate to the estimates list
    setEstimates(prevEstimates => {
      // Check if estimate already exists (in case of edit)
      const existingIndex = prevEstimates.findIndex(est => est.id === savedEstimate.id);
      if (existingIndex >= 0) {
        // Update existing estimate
        const updated = [...prevEstimates];
        updated[existingIndex] = savedEstimate;
        return updated;
      } else {
        // Add new estimate at the beginning
        return [savedEstimate, ...prevEstimates];
      }
    });
    
    // Switch to pending tab for new estimates, or appropriate tab for edited estimates
    if (isEditing) {
      // For edited estimates, switch to the appropriate tab based on status
      if (savedEstimate.status === "approved") {
        setCurrentTab("approved");
      } else if (savedEstimate.status === "declined") {
        setCurrentTab("declined");
      } else {
        setCurrentTab("pending");
      }
    } else {
      // For new estimates, always switch to pending tab
      setCurrentTab("pending");
    }
    
    // Don't close the form - keep it open so user can continue editing or view the saved estimate
    // The form will remain open until user manually closes it
  };

  // Fetch approved estimates from database when Approved tab is selected
  useEffect(() => {
    const fetchApprovedEstimates = async () => {
      if (currentTab !== "approved") {
        setApprovedEstimatesFromDB([]);
        return;
      }

      setIsLoadingApproved(true);
      try {
        // First, fetch from project_estimation_table with APPROVED estimate_status
        const { data: projectsData, error: projectsError } = await supabase
          .from('project_estimation_table')
          .select('*')
          .eq('estimate_status', 'APPROVED')  // Changed from project_status to estimate_status
          .order('created_at', { ascending: false });

        if (projectsError) {
          console.error("Error fetching approved projects:", projectsError);
        }

        // Then fetch from invoice_items_table (as per your URL pattern)
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoice_items_table')
          .select('*')
          .order('invoice_date', { ascending: false })
          .order('created_at', { ascending: false });

        if (invoicesError) {
          console.error("Error fetching approved estimates from invoice_items_table:", invoicesError);
          // If we have project data, use that; otherwise fallback to localStorage
          if (projectsData && projectsData.length > 0) {
            const mappedFromProjects = projectsData.map(project => {
              const estimateData = project.estimate_form_data || {};
              return {
                id: project.project_estimate_uuid,
                project_estimate_uuid: project.project_estimate_uuid,
                status: "approved",
                clientName: estimateData.clientName,
                clientEmail: estimateData.clientEmail,
                clientPhone: project.clientid_phno,
                amount: estimateData.amount,
                projectName: project.project_name || estimateData.projectName,
                projectType: project.project_type || estimateData.projectType,
                packages: estimateData.packages,
                items: estimateData.items,
                isProjectRequested: project.is_project_requested || false,
                isInvoiceRequested: project.is_invoice_requested || false,
                ...estimateData
              };
            });
            setApprovedEstimatesFromDB(mappedFromProjects);
            setIsLoadingApproved(false);
            return;
          }
          setApprovedEstimatesFromDB([]);
          setIsLoadingApproved(false);
          return;
        }

        // Combine data from both sources, prioritizing invoice_items_table
        const invoiceMap = new Map();
        (invoicesData || []).forEach(item => {
          if (item.project_estimate_uuid) {
            invoiceMap.set(item.project_estimate_uuid, item);
          }
        });

        // Map invoice_items_table data to estimate format
        const mappedFromInvoices = (invoicesData || [])
          .filter(item => {
            // Include if it has project_estimate_uuid (linked to approved estimate)
            // or if estimateData has approved status
            const estimateData = item.invoice_form_data?.estimateData;
            return item.project_estimate_uuid || estimateData?.status === "approved";
          })
          .map(item => {
            const estimateData = item.invoice_form_data?.estimateData || {};
            // Try to get the flags from the linked project if available
            const linkedProject = projectsData?.find(p => p.project_estimate_uuid === item.project_estimate_uuid);
            return {
              id: item.project_estimate_uuid || item.invoice_uuid,
              project_estimate_uuid: item.project_estimate_uuid,
              invoice_uuid: item.invoice_uuid,
              status: "approved",
              clientName: estimateData.clientName || item.invoice_form_data?.clientDetails?.name,
              clientEmail: estimateData.clientEmail || item.invoice_form_data?.clientDetails?.email,
              clientPhone: item.clientid_phno,
              amount: estimateData.amount || item.invoice_form_data?.totals?.total,
              projectName: estimateData.projectName,
              projectType: estimateData.projectType,
              packages: estimateData.packages,
              items: estimateData.items || item.invoice_form_data?.items,
              isProjectRequested: linkedProject?.is_project_requested || false,
              isInvoiceRequested: linkedProject?.is_invoice_requested || false,
              ...estimateData,
              // Store reference to invoice
              invoiceData: item
            };
          });

        // Also include approved projects that don't have invoices yet
        const projectsWithoutInvoices = (projectsData || [])
          .filter(project => !invoiceMap.has(project.project_estimate_uuid))
          .map(project => {
            const estimateData = project.estimate_form_data || {};
            return {
              id: project.project_estimate_uuid,
              project_estimate_uuid: project.project_estimate_uuid,
              status: "approved",
              clientName: estimateData.clientName,
              clientEmail: estimateData.clientEmail,
              clientPhone: project.clientid_phno,
              amount: estimateData.amount,
              projectName: project.project_name || estimateData.projectName,
              projectType: project.project_type || estimateData.projectType,
              packages: estimateData.packages,
              items: estimateData.items,
              isProjectRequested: project.is_project_requested || false,
              isInvoiceRequested: project.is_invoice_requested || false,
              ...estimateData
            };
          });

        // Combine both sources
        const allApprovedEstimates = [...mappedFromInvoices, ...projectsWithoutInvoices];
        setApprovedEstimatesFromDB(allApprovedEstimates);
      } catch (error) {
        console.error("Error fetching approved estimates:", error);
        setApprovedEstimatesFromDB([]);
      } finally {
        setIsLoadingApproved(false);
      }
    };

    fetchApprovedEstimates();
  }, [currentTab]);

  const getFilteredEstimates = () => {
    if (currentTab === "approved") {
      // Prioritize DB data, fallback to localStorage
      if (approvedEstimatesFromDB.length > 0) {
        return approvedEstimatesFromDB;
      }
      // Fallback to localStorage
      return estimates.filter(estimate => estimate.status === "approved");
    }
    
    return estimates.filter(estimate => {
      if (currentTab === "pending") return estimate.status === "pending" || estimate.status === "negotiating";
      if (currentTab === "declined") return estimate.status === "declined";
      return true;
    });
  };

  // Fetch estimate counts from database
  useEffect(() => {
    const fetchEstimateCounts = async () => {
      try {
        // Get photography owner phone number
        const { data: ownerData } = await supabase
          .from("photography_owner_table")
          .select("photography_owner_phno")
          .limit(1)
          .maybeSingle();
        
        if (ownerData?.photography_owner_phno) {
          const { data, error } = await supabase.rpc('get_estimate_counts', {
            p_photography_owner_phno: ownerData.photography_owner_phno
          });
          
          if (!error && data) {
            setEstimateCounts({
              pending: data.pending || 0,
              approved: data.approved || 0,
              declined: data.declined || 0
            });
          }
        }
      } catch (error) {
        console.error("Error fetching estimate counts:", error);
      }
    };
    
    fetchEstimateCounts();
  }, [currentTab, estimates]); // Refresh counts when tab changes or estimates update

  // Calculate counts for each tab
  const getTabCounts = () => {
    // Use database counts if available, otherwise fallback to local counts
    const pendingCount = estimateCounts.pending > 0 
      ? estimateCounts.pending 
      : estimates.filter(
          estimate => estimate.status === "pending" || estimate.status === "negotiating"
        ).length;
    
    const approvedCount = estimateCounts.approved > 0 
      ? estimateCounts.approved 
      : (approvedEstimatesFromDB.length > 0 
          ? approvedEstimatesFromDB.length 
          : estimates.filter(estimate => estimate.status === "approved").length);
    
    const declinedCount = estimateCounts.declined > 0 
      ? estimateCounts.declined 
      : estimates.filter(estimate => estimate.status === "declined").length;
    
    return {
      pending: pendingCount,
      approved: approvedCount,
      declined: declinedCount
    };
  };

  return {
    showNewEstimateForm,
    selectedEstimate,
    showPreview,
    isEditing,
    currentTab,
    estimates,
    filteredEstimates: getFilteredEstimates(),
    tabCounts: getTabCounts(),
    isLoadingApproved,
    setCurrentTab,
    handleEditEstimate,
    handleOpenPreview,
    handleStatusChange,
    handleQuickStatusChange,
    handleGoToScheduling,
    handleCreateNewEstimate,
    handleCloseForm,
    handleClosePreview,
    handleEstimateSaved
  };
}

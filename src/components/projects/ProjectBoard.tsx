import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Project {
  id: string;
  title: string;
  status: "prospect_in_progress" | "yet_to_start" | "started" | "completed" | "dues_cleared_delivered";
  clientName?: string;
  eventType?: string;
  startDate?: string;
  projectUuid?: string;
}

interface ProjectBoardProps {
  onNewProject: () => void;
}

const statusColumns = [
  { id: "prospect_in_progress", label: "Lead In Progress", color: "bg-yellow-100" },
  { id: "yet_to_start", label: "PRE-PROD", color: "bg-gray-100" },
  { id: "started", label: "PROD", color: "bg-blue-100" },
  { id: "completed", label: "POST-PROD", color: "bg-green-100" },
  { id: "dues_cleared_delivered", label: "DELIVERED", color: "bg-purple-100" },
];

// Map database status values to frontend status values
const mapDatabaseStatusToFrontend = (dbStatus: string | null): Project["status"] => {
  const statusMap: Record<string, Project["status"]> = {
    "LEAD-INPROGRESS": "prospect_in_progress",
    "PRE-PROD": "yet_to_start",
    "PROD": "started",
    "POST-PROD": "completed",
    "DELIVERED": "dues_cleared_delivered",
    // Legacy support for old values (if any exist in database)
    "IN-PROGRESS": "prospect_in_progress",
    "YET-TO-START": "yet_to_start",
    "STARTED": "started",
    "COMPLETED": "completed",
  };
  
  if (!dbStatus) {
    return "yet_to_start"; // Default to "yet_to_start" if status is null
  }
  
  return statusMap[dbStatus] || "yet_to_start";
};

// Map frontend status values to database status values
const mapFrontendStatusToDatabase = (frontendStatus: Project["status"]): string => {
  const statusMap: Record<Project["status"], string> = {
    "prospect_in_progress": "LEAD-INPROGRESS",
    "yet_to_start": "PRE-PROD",
    "started": "PROD",
    "completed": "POST-PROD",
    "dues_cleared_delivered": "DELIVERED",
  };
  
  return statusMap[frontendStatus] || "PRE-PROD";
};

export function ProjectBoard({ onNewProject }: ProjectBoardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedProject, setDraggedProject] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch projects from database
  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching projects from project_estimation_table...");
      console.log("Supabase client initialized:", !!supabase);
      console.log("Current user:", user?.email || "Not authenticated");
      
      // Check authentication state
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Session exists:", !!session);
      
      // First, try a simple count query to check if RLS is blocking
      const { count: projectCount, error: countError } = await supabase
        .from('project_estimation_table')
        .select('*', { count: 'exact', head: true });
      
      console.log("Project count (with RLS):", projectCount, "Error:", countError);
      
      if (countError) {
        console.error("Count query error:", countError);
        if (countError.code === '42501' || countError.message?.includes('policy')) {
          setError(`RLS Policy Error: ${countError.message}. Please run FIX_PROJECT_ESTIMATION_RLS_POLICIES.sql in Supabase SQL Editor.`);
          setLoading(false);
          return;
        }
      }
      
      // Fetch projects from project_estimation_table
      const { data: projectsData, error: fetchError } = await supabase
        .from('project_estimation_table')
        .select(`
          project_estimate_uuid,
          project_name,
          project_type,
          project_status,
          start_date,
          clientid_phno
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error("Error fetching projects:", fetchError);
        console.error("Error details:", {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code
        });
        
        // Check if it's an RLS policy error
        if (fetchError.code === '42501' || fetchError.message?.includes('policy') || fetchError.message?.includes('permission')) {
          setError(`Permission denied. Please check RLS policies on project_estimation_table. Error: ${fetchError.message}`);
        } else {
          throw fetchError;
        }
        return;
      }

      console.log(`Found ${projectsData?.length || 0} projects in database`);
      console.log("Sample project data:", projectsData?.slice(0, 2));

      if (projectsData && projectsData.length > 0) {
        // Get unique client phone numbers
        const clientPhNos = [...new Set(projectsData.map((p: any) => p.clientid_phno).filter(Boolean))];
        
        console.log(`Fetching client details for ${clientPhNos.length} clients...`);
        
        // Fetch client details
        let clientMap: Record<string, string> = {};
        if (clientPhNos.length > 0) {
          const { data: clientsData, error: clientsError } = await supabase
            .from('client_details_table')
            .select('clientid_phno, client_name')
            .in('clientid_phno', clientPhNos);

          if (clientsError) {
            console.warn("Error fetching client details:", clientsError);
          } else if (clientsData) {
            clientMap = clientsData.reduce((acc: Record<string, string>, client: any) => {
              acc[client.clientid_phno] = client.client_name;
              return acc;
            }, {});
            console.log(`Loaded ${Object.keys(clientMap).length} client names`);
          }
        }

        // Transform database data to Project interface
        const transformedProjects: Project[] = projectsData.map((project: any) => ({
          id: project.project_estimate_uuid,
          projectUuid: project.project_estimate_uuid,
          title: project.project_name || "Untitled Project",
          status: mapDatabaseStatusToFrontend(project.project_status),
          clientName: project.clientid_phno ? clientMap[project.clientid_phno] : undefined,
          eventType: project.project_type || undefined,
          startDate: project.start_date || undefined,
        }));

        console.log(`Transformed ${transformedProjects.length} projects for display`);
        
        // Print UUIDs of all project cards on project_dashboard
        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📋 PROJECT DASHBOARD - ALL PROJECT CARDS UUIDs');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`Total Projects: ${transformedProjects.length}`);
        console.log('');
        
        transformedProjects.forEach((project, index) => {
          console.log(`┌─ Project ${index + 1} ──────────────────────────────────────────────`);
          console.log(`│ Title:      ${project.title || 'Untitled'}`);
          console.log(`│ UUID:       ${project.projectUuid || 'N/A'}`);
          console.log(`│ Status:     ${project.status || 'N/A'}`);
          console.log(`│ Client:     ${project.clientName || 'N/A'}`);
          console.log(`│ Event Type: ${project.eventType || 'N/A'}`);
          console.log(`│ Start Date: ${project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}`);
          console.log(`└────────────────────────────────────────────────────────`);
          console.log('');
        });
        
        // Also print a simple list of just UUIDs for easy copying
        console.log('📝 UUID List (for easy copying):');
        const uuidList = transformedProjects.map((p, idx) => `${idx + 1}. ${p.projectUuid || 'N/A'}`);
        uuidList.forEach(uuid => console.log(`   ${uuid}`));
        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        
        setProjects(transformedProjects);
      } else {
        // No projects found
        console.log("No projects found in database");
        setProjects([]);
      }
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      setError(err.message || "Failed to load projects. Please check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Refetch projects function (can be called after updates)
  const refetchProjects = async () => {
    await fetchProjects();
  };

  const getProjectsByStatus = (status: string) => {
    return projects.filter((p) => p.status === status);
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedProject(projectId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", projectId);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear dragOverColumn if we're leaving the column area
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('[data-drop-zone]')) {
      setDragOverColumn(null);
    }
  };

  // Handle drop - Updates database in real-time
  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const projectId = e.dataTransfer.getData("text/plain") || draggedProject;
    if (!projectId) return;

    const project = projects.find((p) => p.id === projectId);
    if (!project || !project.projectUuid) {
      console.error("Project not found or missing UUID");
      setDraggedProject(null);
      setDragOverColumn(null);
      return;
    }

    // Check if the status is actually changing
    if (project.status === targetColumnId) {
      setDraggedProject(null);
      setDragOverColumn(null);
      return;
    }

    // Store original status for potential rollback
    const originalStatus = project.status;
    const originalDbStatus = mapFrontendStatusToDatabase(originalStatus);
    
    // Map frontend status to database status
    const newDbStatus = mapFrontendStatusToDatabase(targetColumnId as Project["status"]);
    
    console.log(`🔄 Updating project status in database: ${project.title}`);
    console.log(`   From: ${originalDbStatus} (${statusColumns.find(c => c.id === originalStatus)?.label})`);
    console.log(`   To: ${newDbStatus} (${statusColumns.find(c => c.id === targetColumnId)?.label})`);

    setIsUpdatingStatus(true);

    try {
      // Update in database FIRST using RPC function to bypass RLS
      const { data: rpcResult, error: rpcError } = await supabase.rpc('update_project_status', {
        p_project_estimate_uuid: project.projectUuid,
        p_project_status: newDbStatus
      });

      if (rpcError) {
        console.error("❌ RPC update error:", rpcError);
        throw rpcError;
      }

      // Check RPC result
      if (!rpcResult || !rpcResult.success) {
        const errorMsg = rpcResult?.error || 'Unknown error';
        const errorCode = rpcResult?.error_code || 'UNKNOWN';
        console.error("❌ RPC update failed:", errorMsg, "Code:", errorCode);
        throw new Error(`Database update failed: ${errorMsg} (${errorCode})`);
      }

      // Verify the status was updated correctly
      const updatedStatus = rpcResult.project_status;
      if (updatedStatus !== newDbStatus) {
        console.error("❌ Database update verification failed - status mismatch");
        console.error(`Expected: ${newDbStatus}, Got: ${updatedStatus}`);
        throw new Error(`Database update verification failed: Expected ${newDbStatus}, got ${updatedStatus}`);
      }

      console.log(`✅ Database updated successfully via RPC: ${updatedStatus}`);

      // Update local state AFTER successful database update
      setProjects((prevProjects) =>
        prevProjects.map((p) =>
          p.id === projectId
            ? { ...p, status: targetColumnId as Project["status"] }
            : p
        )
      );

      // Optional: Refetch from database to ensure 100% sync (commented out for performance)
      // Uncomment if you want to always verify with database after update
      // await refetchProjects();

      // Clear any previous errors
      setError(null);

      console.log(`✅ Project "${project.title}" moved to ${statusColumns.find(c => c.id === targetColumnId)?.label}`);
    } catch (err: any) {
      console.error("❌ Error updating project status in database:", err);
      
      // Revert local state if it was optimistically updated
      setProjects((prevProjects) =>
        prevProjects.map((p) =>
          p.id === projectId
            ? { ...p, status: originalStatus }
            : p
        )
      );

      // Set error message
      const errorMessage = err.message || "Failed to update project status in database";
      setError(`Failed to update project status: ${errorMessage}`);
      
      // Log detailed error for debugging
      console.error("Error details:", {
        projectId,
        projectUuid: project.projectUuid,
        originalStatus,
        targetStatus: targetColumnId,
        originalDbStatus,
        newDbStatus,
        error: err
      });
    } finally {
      setIsUpdatingStatus(false);
      setDraggedProject(null);
      setDragOverColumn(null);
    }
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedProject(null);
    setDragOverColumn(null);
  };

  return (
    <div className="flex-1 p-3 sm:p-4 md:p-6">

      {/* Loading State */}
      {loading && (
        <LoadingSpinner text="Loading projects..." fullScreen={false} />
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="border border-red-200 rounded-lg p-4 mb-4" style={{ backgroundColor: 'transparent' }}>
          <p className="text-sm text-red-800">Error: {error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Projects Board */}
      {!loading && !error && (
      <div 
        className="space-y-3 sm:space-y-4"
      >
        {/* Status Headers Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 rounded-lg border-2 p-3 sm:p-4 transition-all duration-300" style={{ borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid', backgroundColor: 'transparent' }}>
          {statusColumns.map((column) => (
            <div key={column.id} className="flex items-center justify-center h-8 sm:h-10">
              <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wide text-center text-white">
                {column.label}
              </h3>
            </div>
          ))}
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 rounded-lg border-2 p-3 sm:p-4 transition-all duration-300" style={{ borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid', backgroundColor: 'transparent' }}>
          {statusColumns.map((column) => {
            const columnProjects = getProjectsByStatus(column.id);
            const isDragOver = dragOverColumn === column.id;
            return (
              <div
                key={column.id}
                className="flex flex-col"
                data-drop-zone
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div
                  className={`space-y-2 sm:space-y-3 min-h-[300px] sm:min-h-[400px] rounded-lg bg-card text-card-foreground shadow-sm p-2 m-1 relative border-2 transition-all duration-300 ${
                    isDragOver
                      ? "border-dashed border-primary"
                      : "border-transparent hover:shadow-[0_0_10px_rgba(59,130,246,0.3),0_0_20px_rgba(59,130,246,0.2)] hover:border-blue-400/60"
                  }`}
                  style={{ backgroundColor: 'transparent' }}
                >
                  {columnProjects.length === 0 ? (
                    <div
                      className={`text-center text-xs sm:text-sm text-muted-foreground py-6 sm:py-8 rounded-lg bg-card text-card-foreground shadow-sm border-2 border-dashed relative transition-all duration-300 ${
                        isDragOver 
                          ? "border-primary" 
                          : "border-transparent hover:shadow-[0_0_10px_rgba(59,130,246,0.3),0_0_20px_rgba(59,130,246,0.2)] hover:border-blue-400/60"
                      }`}
                      style={{ backgroundColor: 'transparent' }}
                    >
                      {isDragOver ? "Drop here" : "No projects"}
                    </div>
                  ) : (
                    columnProjects.map((project) => {
                      const isDragging = draggedProject === project.id;
                      return (
                        <Card
                          key={project.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, project.id)}
                          onDragEnd={handleDragEnd}
                          className={`rounded-lg bg-card text-card-foreground shadow-sm relative overflow-hidden transition-all duration-300 p-3 sm:p-4 cursor-move border-2 mb-2 ${
                            isDragging
                              ? "opacity-50 scale-95 shadow-lg border-primary"
                              : "opacity-100 hover:shadow-[0_0_10px_rgba(59,130,246,0.3),0_0_20px_rgba(59,130,246,0.2)] hover:border-blue-400/60 hover:scale-[1.01]"
                          }`}
                          style={{ 
                            backgroundColor: 'transparent', 
                            borderColor: 'rgb(255, 255, 255)',
                            borderWidth: '2px',
                            borderStyle: 'solid'
                          }}
                          onClick={(e) => {
                            // Only navigate if not dragging
                            if (!isDragging && project.projectUuid) {
                              navigate(`/estimates/projects/new?projectUuid=${project.projectUuid}&page=2`);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-medium text-sm sm:text-base flex-1 truncate text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
                              {project.title}
                            </h4>
                            {isUpdatingStatus && isDragging && (
                              <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                            )}
                          </div>
                          {project.clientName && (
                            <p className="text-xs text-white/80 mb-1 truncate" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                              {project.clientName}
                            </p>
                          )}
                          {project.eventType && (
                            <p className="text-xs text-white/80 mb-1 truncate" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                              {project.eventType}
                            </p>
                          )}
                          {project.startDate && (
                            <p className="text-xs text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                              {new Date(project.startDate).toLocaleDateString()}
                            </p>
                          )}
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
}


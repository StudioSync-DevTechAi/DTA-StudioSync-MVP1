import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  { id: "prospect_in_progress", label: "Prospect In Progress", color: "bg-yellow-100" },
  { id: "yet_to_start", label: "Yet to Start", color: "bg-gray-100" },
  { id: "started", label: "Started", color: "bg-blue-100" },
  { id: "completed", label: "Completed", color: "bg-green-100" },
  { id: "dues_cleared_delivered", label: "DUEs CLEARED & DELIVERED", color: "bg-purple-100" },
];

// Map database status values to frontend status values
const mapDatabaseStatusToFrontend = (dbStatus: string | null): Project["status"] => {
  const statusMap: Record<string, Project["status"]> = {
    "IN-PROGRESS": "prospect_in_progress",
    "YET-TO-START": "yet_to_start",
    "STARTED": "started",
    "COMPLETED": "completed",
    "DELIVERED": "dues_cleared_delivered",
  };
  
  if (!dbStatus) {
    return "yet_to_start"; // Default to "yet_to_start" if status is null
  }
  
  return statusMap[dbStatus] || "yet_to_start";
};

export function ProjectBoard({ onNewProject }: ProjectBoardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch projects from database
  useEffect(() => {
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

    fetchProjects();
  }, []);

  const getProjectsByStatus = (status: string) => {
    return projects.filter((p) => p.status === status);
  };

  return (
    <div className="flex-1 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your photography projects
          </p>
        </div>
        <Button onClick={onNewProject}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading projects...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
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
      <div className="space-y-4">
        {/* Status Headers Row */}
        <div className="grid grid-cols-5 gap-4">
          {statusColumns.map((column) => (
            <div key={column.id} className="flex items-center justify-center h-8">
              <h3 className="font-bold text-sm uppercase tracking-wide text-center">
                {column.label}
              </h3>
            </div>
          ))}
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-5 gap-4">
          {statusColumns.map((column) => {
            const columnProjects = getProjectsByStatus(column.id);
            return (
              <div key={column.id} className="flex flex-col">
                <div className="space-y-3 min-h-[400px]">
                  {columnProjects.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                      No projects
                    </div>
                  ) : (
                    columnProjects.map((project) => (
                      <Card
                        key={project.id}
                        className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                          // Navigate to Events Details page (Page 2) for this project
                          if (project.projectUuid) {
                            navigate(`/estimates/projects/new?projectUuid=${project.projectUuid}&page=2`);
                          }
                        }}
                      >
                        <h4 className="font-medium mb-2">{project.title}</h4>
                        {project.clientName && (
                          <p className="text-xs text-muted-foreground mb-1">
                            {project.clientName}
                          </p>
                        )}
                        {project.eventType && (
                          <p className="text-xs text-muted-foreground mb-1">
                            {project.eventType}
                          </p>
                        )}
                        {project.startDate && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(project.startDate).toLocaleDateString()}
                          </p>
                        )}
                      </Card>
                    ))
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


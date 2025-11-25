import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  title: string;
  status: "prospect_in_progress" | "yet_to_start" | "started" | "completed" | "dues_cleared_delivered";
  clientName?: string;
  eventType?: string;
  startDate?: string;
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

export function ProjectBoard({ onNewProject }: ProjectBoardProps) {
  const [projects] = useState<Project[]>([]); // Empty for now as per requirements
  const navigate = useNavigate();

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
                          // Navigate to project details when implemented
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
    </div>
  );
}


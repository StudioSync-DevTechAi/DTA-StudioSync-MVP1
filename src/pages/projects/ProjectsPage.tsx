import Layout from "@/components/Layout";
import { EstimatesHeader } from "@/components/estimates/list/EstimatesHeader";
import { ProjectBoard } from "@/components/projects/ProjectBoard";
import { useNavigate } from "react-router-dom";

export default function ProjectsPage() {
  const navigate = useNavigate();

  const handleNewProject = () => {
    navigate("/estimates/projects/new");
  };

  const handleNewEstimate = () => {
    navigate("/estimates");
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
        <EstimatesHeader 
          onNewEstimate={handleNewEstimate}
          canCreate={true}
          showActions={false}
          title="Projects"
          headerNavigationPath="/estimates/projects"
          description="View and manage all projects"
          showDashboardTitle={true}
          dashboardTitle="Projects Dashboard"
          dashboardDescription="Manage your photography projects"
        />
        <ProjectBoard onNewProject={handleNewProject} />
      </div>
    </Layout>
  );
}


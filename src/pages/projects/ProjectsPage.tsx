import Layout from "@/components/Layout";
import { EstimatesHeader } from "@/components/estimates/list/EstimatesHeader";
import { ProjectBoard } from "@/components/projects/ProjectBoard";
import { useNavigate } from "react-router-dom";

export default function ProjectsPage() {
  const navigate = useNavigate();

  const handleNewProject = () => {
    navigate("/projects/new");
  };

  const handleNewEstimate = () => {
    navigate("/estimates");
  };

  return (
    <Layout>
      <div 
        className="space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6 p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6 w-full overflow-x-hidden"
        style={{ backgroundColor: 'rgba(26, 15, 61, 0.98)', backdropFilter: 'blur(10px)', minHeight: '100vh' }}
      >
        <EstimatesHeader 
          onNewEstimate={handleNewEstimate}
          canCreate={true}
          showActions={false}
          title="Projects"
          headerNavigationPath="/projects"
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


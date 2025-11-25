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
      <div className="space-y-6">
        <EstimatesHeader 
          onNewEstimate={handleNewEstimate}
          canCreate={true}
          showActions={false}
        />
        <ProjectBoard onNewProject={handleNewProject} />
      </div>
    </Layout>
  );
}


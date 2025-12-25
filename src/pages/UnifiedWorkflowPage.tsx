
import { useState } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Users, Clock, CheckCircle } from "lucide-react";
import { useUnifiedWorkflowManager } from "@/hooks/workflow/useUnifiedWorkflowManager";
import { CreateEventModal } from "@/components/scheduling/CreateEventModal";
import { WorkflowStageView } from "@/components/workflow/unified/WorkflowStageView";
import { WorkflowOverview } from "@/components/workflow/unified/WorkflowOverview";
import { TeamManagement } from "@/components/team/TeamManagement";

export default function UnifiedWorkflowPage() {
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [mainTab, setMainTab] = useState("overview");
  
  const {
    events,
    selectedEvent,
    isLoading,
    activeStage,
    teamMembers,
    setSelectedEvent,
    setActiveStage,
    getEventsByStage,
    handleCreateEvent,
    handleUpdateEvent,
    handleMoveToNextStage,
    handleAssignTeamMember,
    handleUpdateAssignmentStatus,
    handleLogTime,
    getAssignmentCounts,
    handleAddTeamMember,
    handleUpdateTeamMember,
    handleDeleteTeamMember
  } = useUnifiedWorkflowManager();

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "overview": return Calendar;
      case "pre-production": return Users;
      case "production": return Clock;
      case "post-production": return CheckCircle;
      case "team": return Users;
      default: return Calendar;
    }
  };

  const getStageCount = (stage: "pre-production" | "production" | "post-production" | "completed") => {
    return getEventsByStage(stage).length;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading workflow...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div 
        className="space-y-6 p-3 sm:p-4 md:p-6"
        style={{ backgroundColor: 'rgba(26, 15, 61, 0.98)', backdropFilter: 'blur(10px)', minHeight: '100vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Workflow Management</h1>
            <p className="text-white/80">
              Manage your entire workflow from planning to delivery
            </p>
          </div>
          <Button onClick={() => setShowCreateEventModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="w-full justify-start mb-6 bg-white/10 border-white/20" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }}>
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300">
              <Calendar className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="pre-production" className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300">
              <Users className="h-4 w-4" />
              Pre-Production ({getStageCount("pre-production")})
            </TabsTrigger>
            <TabsTrigger value="production" className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300">
              <Clock className="h-4 w-4" />
              Production ({getStageCount("production")})
            </TabsTrigger>
            <TabsTrigger value="post-production" className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300">
              <CheckCircle className="h-4 w-4" />
              Post-Production ({getStageCount("post-production")})
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <WorkflowOverview 
              events={events}
              getEventsByStage={getEventsByStage}
              onSelectEvent={setSelectedEvent}
              onCreateEvent={() => setShowCreateEventModal(true)}
            />
          </TabsContent>

          {/* Stage-specific Tabs */}
          <TabsContent value="pre-production">
            <WorkflowStageView
              stage="pre-production"
              events={getEventsByStage("pre-production")}
              selectedEvent={selectedEvent}
              teamMembers={teamMembers}
              onSelectEvent={setSelectedEvent}
              onUpdateEvent={handleUpdateEvent}
              onMoveToNextStage={handleMoveToNextStage}
              onAssignTeamMember={handleAssignTeamMember}
              onUpdateAssignmentStatus={handleUpdateAssignmentStatus}
              onLogTime={handleLogTime}
              getAssignmentCounts={getAssignmentCounts}
            />
          </TabsContent>

          <TabsContent value="production">
            <WorkflowStageView
              stage="production"
              events={getEventsByStage("production")}
              selectedEvent={selectedEvent}
              teamMembers={teamMembers}
              onSelectEvent={setSelectedEvent}
              onUpdateEvent={handleUpdateEvent}
              onMoveToNextStage={handleMoveToNextStage}
              onAssignTeamMember={handleAssignTeamMember}
              onUpdateAssignmentStatus={handleUpdateAssignmentStatus}
              onLogTime={handleLogTime}
              getAssignmentCounts={getAssignmentCounts}
            />
          </TabsContent>

          <TabsContent value="post-production">
            <WorkflowStageView
              stage="post-production"
              events={getEventsByStage("post-production")}
              selectedEvent={selectedEvent}
              teamMembers={teamMembers}
              onSelectEvent={setSelectedEvent}
              onUpdateEvent={handleUpdateEvent}
              onMoveToNextStage={handleMoveToNextStage}
              onAssignTeamMember={handleAssignTeamMember}
              onUpdateAssignmentStatus={handleUpdateAssignmentStatus}
              onLogTime={handleLogTime}
              getAssignmentCounts={getAssignmentCounts}
            />
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <TeamManagement 
              teamMembers={teamMembers}
              onAddTeamMember={handleAddTeamMember}
              onUpdateTeamMember={handleUpdateTeamMember}
              onDeleteTeamMember={handleDeleteTeamMember}
            />
          </TabsContent>
        </Tabs>

        {/* Create Event Modal */}
        {showCreateEventModal && (
          <CreateEventModal
            open={showCreateEventModal}
            onClose={() => setShowCreateEventModal(false)}
            onCreateEvent={handleCreateEvent}
          />
        )}
      </div>
    </Layout>
  );
}

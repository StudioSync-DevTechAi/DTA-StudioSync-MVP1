
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScheduledEvent } from "@/components/scheduling/types";
import { Calendar, MapPin, Users, Clock, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";

interface WorkflowOverviewProps {
  events: ScheduledEvent[];
  getEventsByStage: (stage: "pre-production" | "production" | "post-production" | "completed") => ScheduledEvent[];
  onSelectEvent: (event: ScheduledEvent) => void;
  onCreateEvent: () => void;
}

export function WorkflowOverview({ 
  events, 
  getEventsByStage, 
  onSelectEvent, 
  onCreateEvent 
}: WorkflowOverviewProps) {
  const preProductionEvents = getEventsByStage("pre-production");
  const productionEvents = getEventsByStage("production");
  const postProductionEvents = getEventsByStage("post-production");
  const completedEvents = getEventsByStage("completed");

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "pre-production": return "bg-blue-100 text-blue-800";
      case "production": return "bg-yellow-100 text-yellow-800";
      case "post-production": return "bg-purple-100 text-purple-800";
      case "completed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const EventCard = ({ event }: { event: ScheduledEvent }) => (
    <Card 
      className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all"
      style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}
      onClick={() => onSelectEvent(event)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>{event.name}</h4>
          <Badge className={getStageColor(event.stage)}>
            {event.stage.replace('-', ' ')}
          </Badge>
        </div>
        
        <div className="space-y-2 text-sm text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            {format(parseISO(event.date), 'MMM dd, yyyy')}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            {event.location}
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3" />
            {event.clientName}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            {event.startTime} - {event.endTime}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Pre-Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
              {preProductionEvents.length}
            </div>
            <p className="text-xs text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>Events in planning</p>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
              {productionEvents.length}
            </div>
            <p className="text-xs text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>Active shoots</p>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Post-Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
              {postProductionEvents.length}
            </div>
            <p className="text-xs text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>In editing</p>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
              {completedEvents.length}
            </div>
            <p className="text-xs text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>Delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Upcoming Events</CardTitle>
            <Button 
              size="sm" 
              onClick={onCreateEvent}
              className="text-white border-[#3d2a5f] hover:bg-[#1a0f3d]"
              style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Event
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {preProductionEvents.slice(0, 3).map(event => (
                <EventCard key={event.id} event={event} />
              ))}
              {preProductionEvents.length === 0 && (
                <div className="text-center py-4 text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                  No upcoming events
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
          <CardHeader>
            <CardTitle className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Active Productions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {productionEvents.slice(0, 3).map(event => (
                <EventCard key={event.id} event={event} />
              ))}
              {productionEvents.length === 0 && (
                <div className="text-center py-4 text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                  No active productions
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline View */}
      <Card style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
        <CardHeader>
          <CardTitle className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Workflow Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.slice(0, 5).map(event => (
              <div 
                key={event.id} 
                className="flex items-center gap-4 p-3 border rounded-lg hover:bg-white/10 cursor-pointer transition-all" 
                style={{ borderColor: '#3d2a5f' }}
                onClick={() => onSelectEvent(event)}
              >
                <div className="flex-shrink-0">
                  <Badge className={getStageColor(event.stage)}>
                    {event.stage.replace('-', ' ')}
                  </Badge>
                </div>
                <div className="flex-grow">
                  <h4 className="font-medium text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>{event.name}</h4>
                  <p className="text-sm text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                    {event.clientName} • {format(parseISO(event.date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="text-sm text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                  {event.assignments.length} team members
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center py-8 text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No events found</p>
                <Button 
                  className="mt-4 text-white border-[#3d2a5f] hover:bg-[#1a0f3d]"
                  style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
                  onClick={onCreateEvent}
                >
                  Create Your First Event
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

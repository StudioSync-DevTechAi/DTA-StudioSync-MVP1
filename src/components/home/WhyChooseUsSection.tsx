
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Camera, UserPlus } from "lucide-react";

export function WhyChooseUsSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-dustyBlue-dark to-velvet">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-8 font-playfair text-dustyBlue-soft">
          Why Choose StudioSyncWork?
        </h2>
        <p className="text-xl max-w-3xl mx-auto mb-16 text-dustyBlue-whisper">
          We understand the unique challenges of running a creative business. That's why we've built 
          a platform that addresses every aspect of your workflow.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center border-2 shadow-lg bg-dustyBlue-whisper/90 backdrop-blur-sm" style={{ borderColor: 'hsl(var(--dusty-blue-light))' }}>
            <CardHeader>
              <div className="mx-auto mb-4 p-3 rounded-full w-fit bg-dustyBlue shadow-md">
                <Calendar className="h-6 w-6 text-warmWhite" />
              </div>
              <CardTitle className="text-lg font-playfair text-velvet-dark">Streamlined Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-velvet-muted">
                From booking to delivery, manage every step of your creative process in one platform.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-2 shadow-lg bg-dustyBlue-whisper/90 backdrop-blur-sm" style={{ borderColor: 'hsl(var(--dusty-blue-light))' }}>
            <CardHeader>
              <div className="mx-auto mb-4 p-3 rounded-full w-fit bg-dustyBlue shadow-md">
                <Users className="h-6 w-6 text-warmWhite" />
              </div>
              <CardTitle className="text-lg font-playfair text-velvet-dark">Client Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-velvet-muted">
                Keep clients engaged with real-time updates and seamless communication tools.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-2 shadow-lg bg-dustyBlue-whisper/90 backdrop-blur-sm" style={{ borderColor: 'hsl(var(--dusty-blue-light))' }}>
            <CardHeader>
              <div className="mx-auto mb-4 p-3 rounded-full w-fit bg-dustyBlue shadow-md">
                <Camera className="h-6 w-6 text-warmWhite" />
              </div>
              <CardTitle className="text-lg font-playfair text-velvet-dark">Professional Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-velvet-muted">
                Access industry-leading tools for project management, financial tracking, and team coordination.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-2 shadow-lg bg-dustyBlue-whisper/90 backdrop-blur-sm" style={{ borderColor: 'hsl(var(--dusty-blue-light))' }}>
            <CardHeader>
              <div className="mx-auto mb-4 p-3 rounded-full w-fit bg-dustyBlue shadow-md">
                <UserPlus className="h-6 w-6 text-warmWhite" />
              </div>
              <CardTitle className="text-lg font-playfair text-velvet-dark">Talent Network</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-velvet-muted">
                Connect with skilled photographers, editors, and specialists to grow your business.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

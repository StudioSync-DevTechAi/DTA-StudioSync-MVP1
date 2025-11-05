
import { Button } from "@/components/ui/button";
import { ArrowRight, Camera, Users, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function GetStartedSection() {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-dustyBlue-whisper">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-dustyBlue-dark mb-4">
            Ready to Transform Your Studio?
          </h2>
          <p className="text-xl text-dustyBlue-muted max-w-2xl mx-auto">
            Join thousands of photographers who have streamlined their business with StudioSyncWork
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-dustyBlue-soft rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="h-8 w-8 text-dustyBlue-dark" />
            </div>
            <h3 className="text-xl font-semibold text-dustyBlue-dark mb-2">Professional Tools</h3>
            <p className="text-dustyBlue-muted">Industry-standard features designed by photographers, for photographers</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-dustyBlue-soft rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-dustyBlue-dark" />
            </div>
            <h3 className="text-xl font-semibold text-dustyBlue-dark mb-2">Team Collaboration</h3>
            <p className="text-dustyBlue-muted">Seamlessly work with your team and manage projects together</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-dustyBlue-soft rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-dustyBlue-dark" />
            </div>
            <h3 className="text-xl font-semibold text-dustyBlue-dark mb-2">Lightning Fast</h3>
            <p className="text-dustyBlue-muted">Optimized performance to keep your workflow moving at speed</p>
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-dustyBlue text-dustyBlue-whisper hover:bg-dustyBlue-dark px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => navigate('/auth')}
            >
              Create Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-dustyBlue text-dustyBlue hover:bg-dustyBlue hover:text-dustyBlue-whisper px-8 py-3 text-lg font-semibold transition-all duration-300"
              onClick={() => navigate('/photographers')}
            >
              For Photographers
            </Button>
          </div>
          
          <p className="mt-6 text-sm text-dustyBlue-muted">
            Free 14-day trial • No credit card required • 5GB storage included
          </p>
        </div>
      </div>
    </section>
  );
}

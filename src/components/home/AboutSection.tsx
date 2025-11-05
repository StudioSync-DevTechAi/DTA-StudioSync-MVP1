
import { Camera, Users, Globe } from "lucide-react";

export function AboutSection() {
  return (
    <section className="py-20 px-4 bg-cream">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-8 font-playfair text-velvet-dark">
          About StudioSyncWork
        </h2>
        <p className="text-xl max-w-3xl mx-auto mb-12 text-velvet-muted">
          StudioSyncWork is the complete platform designed for photographers, videographers, and their clients.
          We streamline every aspect of your creative business, from initial consultation to final delivery, 
          making collaboration seamless and professional.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="mx-auto mb-6 p-4 rounded-full w-fit bg-dustyBlue shadow-lg">
              <Camera className="h-10 w-10 text-warmWhite" />
            </div>
            <h3 className="text-xl font-semibold mb-4 font-playfair text-velvet-dark">For Creatives</h3>
            <p className="text-velvet-muted">
              Manage your entire workflow from scheduling to delivery. Handle clients, projects, 
              team collaboration, and financial tracking all in one place.
            </p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto mb-6 p-4 rounded-full w-fit bg-dustyBlue shadow-lg">
              <Users className="h-10 w-10 text-warmWhite" />
            </div>
            <h3 className="text-xl font-semibold mb-4 font-playfair text-velvet-dark">For Clients</h3>
            <p className="text-velvet-muted">
              Stay connected with your photographer throughout the entire process. View progress, 
              provide feedback, and access your deliverables through a beautiful client portal.
            </p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto mb-6 p-4 rounded-full w-fit bg-dustyBlue shadow-lg">
              <Globe className="h-10 w-10 text-warmWhite" />
            </div>
            <h3 className="text-xl font-semibold mb-4 font-playfair text-velvet-dark">For Teams</h3>
            <p className="text-velvet-muted">
              Scale your business by collaborating with other photographers, editors, and specialists. 
              Find talent or offer your services through our marketplace.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

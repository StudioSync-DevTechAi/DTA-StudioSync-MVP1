
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { usePhotographyOwner } from "../form/hooks/usePhotographyOwner";

interface WelcomePageProps {
  clientName: string;
  clientEmail: string;
  onClientNameChange: (name: string) => void;
  onClientEmailChange: (email: string) => void;
  isReadOnly?: boolean;
}

export function WelcomePage({ 
  clientName, 
  clientEmail,
  onClientNameChange, 
  onClientEmailChange,
  isReadOnly = false 
}: WelcomePageProps) {
  const { toast } = useToast();
  const { photographyOwner, loadingOwner } = usePhotographyOwner();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    onClientEmailChange(email);
    // Removed the immediate toast notification for invalid email
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-light tracking-tight">STUDIOSYNC</h1>
      </div>
      
      {/* Project Owner Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-3 sm:p-4 bg-muted/50 rounded-lg mb-4 sm:mb-6">
        <div className="space-y-2">
          <Label className="text-left block">Project Owner</Label>
          <Input
            value={loadingOwner ? "Loading..." : (photographyOwner?.photography_owner_name || "Not available")}
            disabled
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-left block">Project Owner PhNo</Label>
          <Input
            value={loadingOwner ? "Loading..." : (photographyOwner?.photography_owner_phno || "Not available")}
            disabled
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-left block">Project Owner Email Id</Label>
          <Input
            value={loadingOwner ? "Loading..." : (photographyOwner?.photography_owner_email || "Not available")}
            disabled
            className="bg-background"
          />
        </div>
      </div>
      
      <div className="max-w-md mx-auto space-y-4">
        <div className="space-y-2">
          <Label htmlFor="clientName">Client Name</Label>
          <Input
            id="clientName"
            value={clientName}
            onChange={(e) => onClientNameChange(e.target.value)}
            placeholder="Enter client name"
            readOnly={isReadOnly}
            className={isReadOnly ? "bg-gray-100" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientEmail">Client Email</Label>
          <Input
            id="clientEmail"
            type="email"
            value={clientEmail}
            onChange={handleEmailChange}
            placeholder="Enter client email"
            readOnly={isReadOnly}
            className={isReadOnly ? "bg-gray-100" : ""}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto text-center text-muted-foreground">
        <p className="text-sm leading-relaxed">
          We are a Hyderabad based Wedding Photography firm with over 11 years of experience in non-meddling,
          inventive, photojournalistic approach. We need you to recollect how you felt on your big day. At each
          wedding, We plan to archive genuine minutes and crude feelings in new and remarkable manners.
        </p>
      </div>
    </div>
  );
}

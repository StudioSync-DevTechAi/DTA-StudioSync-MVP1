
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface WhatsAppFormProps {
  onClose: () => void;
  estimate: {
    clientName: string;
    amount: string;
    date: string;
    packages?: Array<{
      name?: string;
      amount: string;
      services: Array<{
        event: string;
        date: string;
        photographers: string;
        cinematographers: string;
      }>;
      deliverables: string[];
    }>;
  };
}

export function WhatsAppForm({ onClose, estimate }: WhatsAppFormProps) {
  const [phoneInput, setPhoneInput] = useState("");
  const { toast } = useToast();

  const handleSendWhatsApp = () => {
    if (!phoneInput) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    const formattedPhone = phoneInput.replace(/\D/g, "");
    
    // Generate package information
    let packageText = "";
    
    if (estimate.packages && estimate.packages.length > 0) {
      estimate.packages.forEach((pkg, idx) => {
        packageText += `\n\n*Package Option ${idx + 1}${pkg.name ? `: ${pkg.name}` : ''}*`;
        packageText += `\nAmount: ${pkg.amount}`;
        
        if (pkg.services && pkg.services.length > 0) {
          packageText += "\n\nEvents:";
          pkg.services.forEach(service => {
            packageText += `\n- ${service.event} (${new Date(service.date).toLocaleDateString()})`;
          });
        }
      });
    } else {
      packageText = `\n\nAmount: ${estimate.amount}`;
    }
    
    const message = encodeURIComponent(
      `*Estimate for ${estimate.clientName}*\n\nDate: ${new Date(estimate.date).toLocaleDateString()}${packageText}\n\nThank you for considering our services!`
    );
    
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, "_blank");
    
    toast({
      title: "WhatsApp Opened",
      description: "You can now send the estimate message",
    });
    
    setPhoneInput("");
    onClose();
  };

  return (
    <Card className="mb-4" style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
      <CardContent className="pt-6">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-2">
            <Label htmlFor="phone" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Client Phone Number (with country code)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="text-white placeholder:text-gray-400"
              style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
            />
          </div>
          <Button 
            onClick={handleSendWhatsApp}
            className="text-white hover:bg-[#1a0f3d]"
            style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
          >
            Share
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="ml-2 h-4 w-4"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.372a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10 border"
            style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface WelcomePageProps {
  clientName: string;
  clientEmail: string;
  clientPhNo?: string;
  countryCode?: string;
  onClientNameChange: (name: string) => void;
  onClientEmailChange: (email: string) => void;
  onClientPhNoChange?: (phNo: string) => void;
  onCountryCodeChange?: (code: string) => void;
  isReadOnly?: boolean;
  phoneError?: string;
}

export function WelcomePage({ 
  clientName, 
  clientEmail,
  clientPhNo = '',
  countryCode = '+91',
  onClientNameChange, 
  onClientEmailChange,
  onClientPhNoChange,
  onCountryCodeChange,
  isReadOnly = false,
  phoneError
}: WelcomePageProps) {
  const { toast } = useToast();
  const [title] = useState(() => {
    const saved = localStorage.getItem('studioSyncTitle');
    return saved || 'STUDIOSYNC';
  });

  const [greeting] = useState(() => {
    const saved = localStorage.getItem('studioSyncGreeting');
    return saved || '';
  });

  const [description] = useState(() => {
    const saved = localStorage.getItem('studioSyncDescription');
    return saved || 'We are a Hyderabad based Wedding Photography firm with over 11 years of experience in non-meddling, inventive, photojournalistic approach. We need you to recollect how you felt on your big day. At each wedding, We plan to archive genuine minutes and crude feelings in new and remarkable manners.';
  });

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    onClientEmailChange(email);
    // Removed the immediate toast notification for invalid email
  };

  const handlePhNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and limit to 10 digits
    const input = e.target.value.replace(/\D/g, '').slice(0, 10);
    if (onClientPhNoChange) {
      onClientPhNoChange(input);
    }
  };

  const handleCountryCodeChange = (value: string) => {
    if (onCountryCodeChange) {
      onCountryCodeChange(value);
    }
  };

  const displayGreeting = greeting || (clientName ? `Hello ${clientName}!` : "Welcome");

  // Ensure country code is always a valid Select value (+91 or +1) so the dropdown shows the selected option
  const normalizedCountryCode =
    countryCode === "+1" || countryCode === "+91" ? countryCode : "+91";
  const countryCodeLabel = normalizedCountryCode === "+1" ? "🇺🇸 USA (+1)" : "🇮🇳 India (+91)";

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <h1 className="text-4xl font-light tracking-tight text-white">{title}</h1>
        </div>
        <div className="flex items-center justify-center">
          <p className="text-2xl font-light text-gray-300">
            {displayGreeting}
          </p>
        </div>
      </div>
      
      <div className="max-w-md mx-auto space-y-4">
        <div className="space-y-2">
          <Label htmlFor="clientName" className="text-white">
            Client Name <span className="text-red-400">*</span>
          </Label>
          <Input
            id="clientName"
            value={clientName.slice(0, 30)}
            onChange={(e) => onClientNameChange(e.target.value.slice(0, 30))}
            placeholder="Enter client name (max 30 characters)"
            readOnly={isReadOnly}
            maxLength={30}
            required
            className={`text-white placeholder:text-gray-400 ${isReadOnly ? "bg-gray-700" : ""}`}
            style={!isReadOnly ? { backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' } : {}}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientPhNo" className="text-white">
            Client PhNo <span className="text-red-400">*</span>
          </Label>
          <div className="flex gap-2">
            {isReadOnly ? (
              <Input
                readOnly
                value={countryCodeLabel}
                className="w-[140px] text-white border-[#3d2a5f]"
                style={{ backgroundColor: '#374151', borderColor: '#3d2a5f', color: '#ffffff', cursor: 'default' }}
              />
            ) : (
              <Select
                value={normalizedCountryCode}
                onValueChange={handleCountryCodeChange}
              >
                <SelectTrigger
                  className="w-[140px] text-white border-[#3d2a5f]"
                  style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
                >
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent
                  style={{ backgroundColor: 'rgba(26, 15, 61, 0.98)', backdropFilter: 'blur(10px)', borderColor: '#3d2a5f' }}
                >
                  <SelectItem value="+91" className="text-white focus:bg-[#3d2a5f]">
                    🇮🇳 India (+91)
                  </SelectItem>
                  <SelectItem value="+1" className="text-white focus:bg-[#3d2a5f]">
                    🇺🇸 USA (+1)
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
            <div className="flex-1">
              <Input
                id="clientPhNo"
                type="tel"
                value={clientPhNo}
                onChange={handlePhNoChange}
                placeholder="Enter 10 digit number"
                readOnly={isReadOnly}
                maxLength={10}
                required
                className={`w-full text-white placeholder:text-gray-400 ${isReadOnly ? "bg-gray-700" : ""} ${phoneError ? "border-red-500" : ""}`}
                style={!isReadOnly ? { backgroundColor: '#2d1b4e', borderColor: phoneError ? '#ef4444' : '#3d2a5f', color: '#ffffff' } : {}}
              />
              {phoneError && (
                <p className="text-red-400 text-sm mt-1">{phoneError}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientEmail" className="text-white">Client Email</Label>
          <Input
            id="clientEmail"
            type="email"
            value={clientEmail}
            onChange={handleEmailChange}
            placeholder="Enter client email"
            readOnly={isReadOnly}
            className={`text-white placeholder:text-gray-400 ${isReadOnly ? "bg-gray-700" : ""}`}
            style={!isReadOnly ? { backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' } : {}}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto text-center text-gray-300">
        <p className="text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

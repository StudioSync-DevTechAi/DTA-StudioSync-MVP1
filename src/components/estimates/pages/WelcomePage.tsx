
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Pencil } from "lucide-react";

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
  const [title, setTitle] = useState(() => {
    const saved = localStorage.getItem('studioSyncTitle');
    return saved || 'STUDIOSYNC';
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  const [greeting, setGreeting] = useState(() => {
    const saved = localStorage.getItem('studioSyncGreeting');
    return saved || '';
  });
  const [isEditingGreeting, setIsEditingGreeting] = useState(false);
  const [tempGreeting, setTempGreeting] = useState(greeting);

  const [description, setDescription] = useState(() => {
    const saved = localStorage.getItem('studioSyncDescription');
    return saved || 'We are a Hyderabad based Wedding Photography firm with over 11 years of experience in non-meddling, inventive, photojournalistic approach. We need you to recollect how you felt on your big day. At each wedding, We plan to archive genuine minutes and crude feelings in new and remarkable manners.';
  });
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState(description);

  useEffect(() => {
    localStorage.setItem('studioSyncTitle', title);
  }, [title]);

  useEffect(() => {
    localStorage.setItem('studioSyncGreeting', greeting);
  }, [greeting]);

  useEffect(() => {
    localStorage.setItem('studioSyncDescription', description);
  }, [description]);

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

  const handleTitleEdit = () => {
    if (isReadOnly) return;
    setIsEditingTitle(true);
    setTempTitle(title);
  };

  const handleTitleSave = () => {
    if (tempTitle.trim()) {
      setTitle(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setTempTitle(title);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  const handleGreetingEdit = () => {
    if (isReadOnly) return;
    setIsEditingGreeting(true);
    setTempGreeting(greeting || (clientName ? `Hello ${clientName}!` : "Welcome"));
  };

  const handleGreetingSave = () => {
    if (tempGreeting.trim()) {
      setGreeting(tempGreeting.trim());
    }
    setIsEditingGreeting(false);
  };

  const handleGreetingCancel = () => {
    setTempGreeting(greeting || (clientName ? `Hello ${clientName}!` : "Welcome"));
    setIsEditingGreeting(false);
  };

  const handleGreetingKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleGreetingSave();
    } else if (e.key === 'Escape') {
      handleGreetingCancel();
    }
  };

  const displayGreeting = greeting || (clientName ? `Hello ${clientName}!` : "Welcome");

  const handleDescriptionEdit = () => {
    if (isReadOnly) return;
    setIsEditingDescription(true);
    setTempDescription(description);
  };

  const handleDescriptionSave = () => {
    if (tempDescription.trim()) {
      setDescription(tempDescription.trim());
    }
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setTempDescription(description);
    setIsEditingDescription(false);
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleDescriptionSave();
    } else if (e.key === 'Escape') {
      handleDescriptionCancel();
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          {isEditingTitle ? (
            <Input
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="text-4xl font-light tracking-tight text-white text-center bg-transparent border-white/30 focus:border-white/50"
              style={{ backgroundColor: 'rgba(45, 27, 78, 0.5)', maxWidth: '400px' }}
              autoFocus
            />
          ) : (
            <>
              <h1 className="text-4xl font-light tracking-tight text-white">{title}</h1>
              {!isReadOnly && (
                <button
                  onClick={handleTitleEdit}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Edit title"
                >
                  <Pencil className="h-5 w-5 text-white/70 hover:text-white" />
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center justify-center gap-3">
          {isEditingGreeting ? (
            <Input
              value={tempGreeting}
              onChange={(e) => setTempGreeting(e.target.value)}
              onBlur={handleGreetingSave}
              onKeyDown={handleGreetingKeyDown}
              className="text-2xl font-light text-gray-300 text-center bg-transparent border-white/30 focus:border-white/50"
              style={{ backgroundColor: 'rgba(45, 27, 78, 0.5)', maxWidth: '400px' }}
              autoFocus
            />
          ) : (
            <>
              <p className="text-2xl font-light text-gray-300">
                {displayGreeting}
              </p>
              {!isReadOnly && (
                <button
                  onClick={handleGreetingEdit}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Edit greeting"
                >
                  <Pencil className="h-5 w-5 text-gray-300/70 hover:text-gray-300" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="max-w-md mx-auto space-y-4">
        <div className="space-y-2">
          <Label htmlFor="clientName" className="text-white">Client Name</Label>
          <Input
            id="clientName"
            value={clientName.slice(0, 30)}
            onChange={(e) => onClientNameChange(e.target.value.slice(0, 30))}
            placeholder="Enter client name (max 30 characters)"
            readOnly={isReadOnly}
            maxLength={30}
            className={`text-white placeholder:text-gray-400 ${isReadOnly ? "bg-gray-700" : ""}`}
            style={!isReadOnly ? { backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' } : {}}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientPhNo" className="text-white">
            Client PhNo <span className="text-red-400">*</span>
          </Label>
          <div className="flex gap-2">
            <Select
              value={countryCode}
              onValueChange={handleCountryCodeChange}
              disabled={isReadOnly}
            >
              <SelectTrigger
                className="w-[140px] text-white border-[#3d2a5f]"
                style={!isReadOnly ? { backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' } : {}}
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
        <div className="flex items-start justify-center gap-3">
          {isEditingDescription ? (
            <Textarea
              value={tempDescription}
              onChange={(e) => setTempDescription(e.target.value)}
              onBlur={handleDescriptionSave}
              onKeyDown={handleDescriptionKeyDown}
              className="text-sm leading-relaxed text-gray-300 text-center bg-transparent border-white/30 focus:border-white/50 resize-none"
              style={{ backgroundColor: 'rgba(45, 27, 78, 0.5)', minHeight: '100px', maxWidth: '100%' }}
              autoFocus
            />
          ) : (
            <>
              <p className="text-sm leading-relaxed">
                {description}
              </p>
              {!isReadOnly && (
                <button
                  onClick={handleDescriptionEdit}
                  className="p-1 hover:bg-white/10 rounded transition-colors mt-1"
                  title="Edit description"
                >
                  <Pencil className="h-4 w-4 text-gray-300/70 hover:text-gray-300" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

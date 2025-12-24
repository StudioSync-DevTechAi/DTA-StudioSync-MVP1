
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PortfolioLink } from "../form/types";
import { X, Youtube, Video, Link, Globe, Instagram, Pencil } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface PortfolioPageProps {
  portfolioLinks: PortfolioLink[];
  onPortfolioLinksChange: (links: PortfolioLink[]) => void;
  isReadOnly?: boolean;
}

export function PortfolioPage({
  portfolioLinks,
  onPortfolioLinksChange,
  isReadOnly = false,
}: PortfolioPageProps) {
  const [description, setDescription] = useState(() => {
    const saved = localStorage.getItem('portfolioPageDescription');
    return saved || 'Add links to your portfolio work that you\'d like to showcase to your clients.';
  });
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState(description);

  useEffect(() => {
    localStorage.setItem('portfolioPageDescription', description);
  }, [description]);

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

  const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleDescriptionSave();
    } else if (e.key === 'Escape') {
      handleDescriptionCancel();
    }
  };

  const [newLink, setNewLink] = useState<Omit<PortfolioLink, "id">>({
    title: "",
    url: "",
    platform: "youtube",
  });

  const platformIcons = {
    youtube: <Youtube className="h-5 w-5 text-red-500" />,
    vimeo: <Video className="h-5 w-5 text-blue-500" />,
    website: <Globe className="h-5 w-5 text-green-500" />,
    instagram: <Instagram className="h-5 w-5 text-pink-500" />,
    other: <Link className="h-5 w-5 text-gray-500" />,
  };

  const handleAddLink = () => {
    if (!newLink.title || !newLink.url) return;

    const updatedLinks = [
      ...portfolioLinks,
      { ...newLink, id: uuidv4() },
    ];
    onPortfolioLinksChange(updatedLinks);
    setNewLink({
      title: "",
      url: "",
      platform: "youtube",
      description: "",
    });
  };

  const handleRemoveLink = (id: string) => {
    const updatedLinks = portfolioLinks.filter((link) => link.id !== id);
    onPortfolioLinksChange(updatedLinks);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-light text-white">PORTFOLIO SHOWCASE</h2>
        {!isReadOnly && (
          <div className="flex items-center justify-center gap-3 mt-2">
            {isEditingDescription ? (
              <Input
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                onBlur={handleDescriptionSave}
                onKeyDown={handleDescriptionKeyDown}
                className="text-sm text-gray-300 text-center bg-transparent border-white/30 focus:border-white/50"
                style={{ backgroundColor: 'rgba(45, 27, 78, 0.5)', maxWidth: '600px' }}
                autoFocus
              />
            ) : (
              <>
                <p className="text-sm text-gray-300 mt-2">
                  {description}
                </p>
                <button
                  onClick={handleDescriptionEdit}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Edit description"
                >
                  <Pencil className="h-4 w-4 text-gray-300/70 hover:text-gray-300" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {!isReadOnly && (
        <Card style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
          <CardHeader>
            <CardTitle className="text-white">Add Portfolio Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-white">Title</label>
                <Input
                  placeholder="Wedding Highlight Film"
                  value={newLink.title}
                  onChange={(e) =>
                    setNewLink({ ...newLink, title: e.target.value })
                  }
                  className="text-white placeholder:text-gray-400"
                  style={{ backgroundColor: '#1a0f3d', borderColor: '#3d2a5f', color: '#ffffff' }}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white">Platform</label>
                <Select
                  value={newLink.platform}
                  onValueChange={(value: any) =>
                    setNewLink({ ...newLink, platform: value })
                  }
                >
                  <SelectTrigger className="text-white placeholder:text-gray-400" style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}>
                    <SelectValue placeholder="Select platform" className="text-white" />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
                    <SelectItem value="youtube" className="text-white hover:bg-[#1a0f3d]">YouTube</SelectItem>
                    <SelectItem value="vimeo" className="text-white hover:bg-[#1a0f3d]">Vimeo</SelectItem>
                    <SelectItem value="website" className="text-white hover:bg-[#1a0f3d]">Website</SelectItem>
                    <SelectItem value="instagram" className="text-white hover:bg-[#1a0f3d]">Instagram</SelectItem>
                    <SelectItem value="other" className="text-white hover:bg-[#1a0f3d]">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-white">URL</label>
              <Input
                placeholder="https://youtube.com/watch?v=..."
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                className="text-white placeholder:text-gray-400"
                style={{ backgroundColor: '#1a0f3d', borderColor: '#3d2a5f', color: '#ffffff' }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white">Description (Optional)</label>
              <Textarea
                placeholder="A brief description of this portfolio item..."
                value={newLink.description || ""}
                onChange={(e) =>
                  setNewLink({ ...newLink, description: e.target.value })
                }
                rows={3}
                className="text-white placeholder:text-gray-400"
                style={{ backgroundColor: '#1a0f3d', borderColor: '#3d2a5f', color: '#ffffff' }}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddLink}>Add Portfolio Item</Button>
          </CardFooter>
        </Card>
      )}

      {portfolioLinks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {portfolioLinks.map((link) => (
            <Card key={link.id} style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2 text-white">
                  {platformIcons[link.platform]}
                  {link.title}
                </CardTitle>
                {!isReadOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveLink(link.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-sm truncate text-blue-400 hover:underline">
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.url}
                  </a>
                </div>
                {link.description && (
                  <p className="text-sm text-gray-300 mt-2">
                    {link.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border rounded-md bg-muted/20" style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
          <p className="text-gray-300">
            No portfolio links have been added yet.
            {!isReadOnly && " Add some links to showcase your work!"}
          </p>
        </div>
      )}
    </div>
  );
}

import { useState, useCallback, memo, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Tag, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MediaTaggerProps {
  eventId?: string;
  eventName?: string;
  clientName?: string;
  eventType?: string;
  onTagsGenerated?: (tags: Record<string, string[]>) => void;
}

function MediaTaggerComponent({
  eventId,
  eventName,
  clientName,
  eventType,
  onTagsGenerated
}: MediaTaggerProps) {
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const handleGenerateTags = useCallback(async () => {
    if (!mediaUrl) {
      toast({
        variant: "destructive",
        title: "Media URL required",
        description: "Please enter a URL to an image or video file."
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('media-tagging', {
        body: {
          mediaType,
          mediaUrl,
          eventContext: eventName && clientName ? {
            eventName,
            clientName,
            eventType
          } : undefined
        }
      });
      
      if (error) throw new Error(error.message);
      
      if (data.tags) {
        setTags(data.tags);
        
        if (onTagsGenerated) {
          onTagsGenerated(data.tags);
        }
        
        toast({
          title: "Tags Generated",
          description: `Successfully generated tags for your ${mediaType}.`
        });
      } else {
        setNotes(data.rawResponse || "");
        
        toast({
          variant: "default",
          title: "Tag Analysis Complete",
          description: "AI couldn't structure tags but provided a text analysis."
        });
      }
    } catch (err: any) {
      console.error("Error generating tags:", err);
      toast({
        variant: "destructive",
        title: "Failed to generate tags",
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  }, [mediaUrl, mediaType, eventName, clientName, eventType, onTagsGenerated, toast]);

  const copyAllTags = useCallback(() => {
    const allTags = Object.values(tags).flat().join(", ");
    navigator.clipboard.writeText(allTags);
    toast({
      title: "Tags Copied",
      description: "All tags have been copied to clipboard."
    });
  }, [tags, toast]);
  
  const clearResults = useCallback(() => {
    setTags({});
    setNotes("");
  }, []);

  return (
    <Card className="w-full" style={{ backgroundColor: 'transparent', borderColor: '#00bfe7' }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2" style={{ color: '#ffffff' }}>
            <Tag className="h-5 w-5" />
            <span>AI Media Tagger</span>
          </CardTitle>
          {Object.keys(tags).length > 0 && (
            <Button variant="outline" size="sm" onClick={clearResults}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-3">
            <Label htmlFor="media-url" style={{ color: '#ffffff' }}>Media URL</Label>
            <Input
              id="media-url"
              placeholder="Enter a URL to an image or video file"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="w-full"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="media-type" style={{ color: '#ffffff' }}>Type</Label>
            <Select 
              value={mediaType} 
              onValueChange={(value) => setMediaType(value as "image" | "video")}
              disabled={loading}
            >
              <SelectTrigger id="media-type">
                <SelectValue placeholder="Media Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button 
          onClick={handleGenerateTags} 
          className="w-full" 
          disabled={loading || !mediaUrl}
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Tags...</>
          ) : (
            'Generate Tags'
          )}
        </Button>
        
        {Object.keys(tags).length > 0 ? (
          <div className="space-y-4">
            <div className="space-y-3">
              {Object.entries(tags).map(([category, tagList]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium capitalize mb-1" style={{ color: '#ffffff' }}>{category}</h3>
                  <div className="flex flex-wrap gap-1">
                    {tagList.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <Button variant="outline" className="w-full" onClick={copyAllTags}>
              Copy All Tags
            </Button>
          </div>
        ) : notes ? (
          <div className="space-y-2">
            <h3 className="text-sm font-medium" style={{ color: '#ffffff' }}>AI Analysis</h3>
            <Textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              className="h-36" 
              readOnly 
            />
          </div>
        ) : null}
        
        {!loading && !Object.keys(tags).length && !notes && (
          <div className="text-center py-6" style={{ color: '#adadad' }}>
            <p>Enter a media URL and click "Generate Tags" to analyze and tag your content.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export memoized component to prevent unnecessary re-renders
export const MediaTagger = memo(MediaTaggerComponent);

// Default export for lazy loading
export default { MediaTagger };
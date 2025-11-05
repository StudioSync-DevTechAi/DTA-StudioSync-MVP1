import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Upload, 
  Edit, 
  Heart, 
  Mountain, 
  Palette,
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  Globe
} from "lucide-react";
import { usePortfolioData } from "@/hooks/portfolio/usePortfolioData";
import { PortfolioGallery } from "@/components/portfolio/PortfolioGallery";
import { FileUploader } from "@/components/portfolio/FileUploader";
import { WeddingTemplate } from "@/components/portfolio/WeddingTemplate";
import { useToast } from "@/hooks/use-toast";

interface TemplateConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  sections: {
    hero: {
      title: string;
      subtitle: string;
      backgroundImage: string;
    };
    about: {
      title: string;
      content: string;
    };
    services: string[];
    contact: {
      email: string;
      phone: string;
      location: string;
      website: string;
    };
  };
}

const templateConfigs: Record<string, TemplateConfig> = {
  wedding: {
    id: "wedding",
    name: "Wedding Photography",
    icon: <Heart className="h-6 w-6" />,
    color: "bg-pink-50 border-pink-200 text-pink-700",
    sections: {
      hero: {
        title: "Capturing Your Love Story",
        subtitle: "Elegant wedding photography that tells your unique story",
        backgroundImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=600&fit=crop"
      },
      about: {
        title: "About My Wedding Photography",
        content: "I specialize in capturing the most precious moments of your special day with elegance and artistry."
      },
      services: ["Wedding Ceremony", "Reception Coverage", "Engagement Sessions", "Bridal Portraits"],
      contact: {
        email: "",
        phone: "",
        location: "",
        website: ""
      }
    }
  },
  wildlife: {
    id: "wildlife",
    name: "Wildlife Photography",
    icon: <Mountain className="h-6 w-6" />,
    color: "bg-green-50 border-green-200 text-green-700",
    sections: {
      hero: {
        title: "Wildlife Through My Lens",
        subtitle: "Exploring the beauty and wonder of the natural world",
        backgroundImage: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=600&fit=crop"
      },
      about: {
        title: "About My Wildlife Photography",
        content: "Passionate about conservation and capturing the raw beauty of wildlife in their natural habitats."
      },
      services: ["Wildlife Portraits", "Nature Landscapes", "Conservation Projects", "Adventure Photography"],
      contact: {
        email: "",
        phone: "",
        location: "",
        website: ""
      }
    }
  },
  passion: {
    id: "passion",
    name: "Passion Photography",
    icon: <Palette className="h-6 w-6" />,
    color: "bg-purple-50 border-purple-200 text-purple-700",
    sections: {
      hero: {
        title: "Art Through Photography",
        subtitle: "Creative expressions and artistic vision through the lens",
        backgroundImage: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&h=600&fit=crop"
      },
      about: {
        title: "About My Creative Work",
        content: "Exploring the intersection of art and photography to create meaningful visual stories."
      },
      services: ["Artistic Portraits", "Creative Projects", "Fine Art Photography", "Conceptual Work"],
      contact: {
        email: "",
        phone: "",
        location: "",
        website: ""
      }
    }
  }
};

export default function PortfolioTemplate() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { portfolioData, setPortfolioData, handleSave } = usePortfolioData();

  // Load theme CSS only for PortfolioTemplate page (part of portfolio module)
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/theme-styles.css';
    link.id = 'portfolio-template-theme-styles';
    document.head.appendChild(link);

    return () => {
      // Remove theme CSS when component unmounts
      const themeLink = document.getElementById('portfolio-template-theme-styles');
      if (themeLink) {
        themeLink.remove();
      }
    };
  }, []);
  
  const [template, setTemplate] = useState<TemplateConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(template?.sections || null);
  const [useWeddingTemplate, setUseWeddingTemplate] = useState(false);

  useEffect(() => {
    if (templateId && templateConfigs[templateId]) {
      const selectedTemplate = templateConfigs[templateId];
      setTemplate(selectedTemplate);
      setEditedData(selectedTemplate.sections);
      setUseWeddingTemplate(templateId === 'wedding');
    } else {
      navigate('/portfolio');
    }
  }, [templateId, navigate]);

  const handleSaveTemplate = async () => {
    if (!template || !editedData) return;

    try {
      // Update portfolio data with template information (include gallery)
      const updatedPortfolio = {
        ...portfolioData,
        name: editedData.hero.title,
        tagline: editedData.hero.subtitle,
        about: editedData.about.content,
        services: editedData.services,
        contact: {
          ...portfolioData.contact,
          ...editedData.contact
        }
        // Note: gallery is already updated via onChange callbacks
      };

      setPortfolioData(updatedPortfolio);
      await handleSave();
      
      toast({
        title: "Template saved",
        description: "Your portfolio template has been saved successfully."
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save template. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePreview = () => {
    // Navigate to portfolio preview with template data
    navigate('/portfolio');
  };

  if (!template || !editedData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading template...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper portfolio-theme-wrapper">
      <div className="body-wrapper">
        <div className="body-wrapper-inner" style={{ paddingTop: 0 }}>
          <div className="container-fluid" style={{ paddingTop: 0 }}>
            <div className="min-h-screen bg-gray-50">
              <div className="max-w-6xl mx-auto px-6 pt-4 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/portfolio')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Portfolio
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                {template.icon}
                {template.name} Template
              </h1>
              <p className="text-muted-foreground">Customize your portfolio with this template</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Template
              </Button>
            )}
          </div>
        </div>

        {useWeddingTemplate ? (
          <WeddingTemplate
            data={{
              hero: {
                title: editedData?.hero.title || "Capturing Your Love Story",
                subtitle: editedData?.hero.subtitle || "Elegant wedding photography that tells your unique story",
                backgroundImage: editedData?.hero.backgroundImage || "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=600&fit=crop",
                ctaText: "View Our Work"
              },
              about: {
                photographerName: portfolioData.name || "",
                experience: portfolioData.about || "",
                style: "Traditional, Modern, Documentary",
                yearsExperience: 5,
                description: "I specialize in capturing the most precious moments of your special day with elegance and artistry."
              },
              services: {
                packages: [
                  {
                    name: "Basic Package",
                    price: 1500,
                    description: "Perfect for intimate weddings",
                    features: ["4 hours coverage", "100 edited photos", "Online gallery"]
                  },
                  {
                    name: "Premium Package", 
                    price: 2500,
                    description: "Complete wedding day coverage",
                    features: ["8 hours coverage", "300 edited photos", "Online gallery", "Engagement session"]
                  }
                ],
                additionalServices: ["Engagement Session", "Bridal Portraits", "Reception Coverage"]
              },
              testimonials: [
                {
                  clientName: "Sarah & John",
                  weddingDate: "June 2023",
                  review: "Absolutely amazing! Captured every moment perfectly.",
                  rating: 5
                }
              ],
              contact: {
                email: portfolioData.contact.email || "",
                phone: portfolioData.contact.phone || "",
                location: portfolioData.contact.location || "",
                website: portfolioData.contact.website || ""
              },
              gallery: portfolioData.gallery.map(img => ({
                ...img,
                x: Math.random() * 200,
                y: Math.random() * 200,
                width: 200,
                height: 150,
                zIndex: 1,
                isSelected: false
              }))
            }}
            onChange={(data) => {
              // Update portfolio data with template data
              setPortfolioData({
                ...portfolioData,
                name: data.about.photographerName,
                about: data.about.description,
                services: data.services.packages.map(pkg => pkg.name),
                contact: data.contact,
                gallery: data.gallery.map(img => ({
                  id: img.id,
                  url: img.url,
                  title: img.title,
                  category: img.category
                }))
              });
            }}
            onSave={handleSaveTemplate}
            isEditing={isEditing}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
            {/* Hero Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Hero Section
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={editedData.hero.title}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      hero: { ...editedData.hero, title: e.target.value }
                    })}
                    disabled={!isEditing}
                    placeholder="Enter your portfolio title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Subtitle</label>
                  <Input
                    value={editedData.hero.subtitle}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      hero: { ...editedData.hero, subtitle: e.target.value }
                    })}
                    disabled={!isEditing}
                    placeholder="Enter your tagline"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Background Image</label>
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={editedData.hero.backgroundImage}
                      alt="Hero background"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isEditing && (
                    <div className="mt-2">
                      <FileUploader
                        onUploadComplete={(url) => setEditedData({
                          ...editedData,
                          hero: { ...editedData.hero, backgroundImage: url }
                        })}
                        acceptedFileTypes="image/*"
                        maxFileSize={5}
                        folder="portfolio/hero"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle>About Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">About Title</label>
                  <Input
                    value={editedData.about.title}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      about: { ...editedData.about, title: e.target.value }
                    })}
                    disabled={!isEditing}
                    placeholder="About section title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">About Content</label>
                  <Textarea
                    value={editedData.about.content}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      about: { ...editedData.about, content: e.target.value }
                    })}
                    disabled={!isEditing}
                    placeholder="Tell your story..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Services Section */}
            <Card>
              <CardHeader>
                <CardTitle>Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {editedData.services.map((service, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="secondary" className="flex-1">
                        {service}
                      </Badge>
                      {isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditedData({
                            ...editedData,
                            services: editedData.services.filter((_, i) => i !== index)
                          })}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add new service"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement;
                            if (input.value.trim()) {
                              setEditedData({
                                ...editedData,
                                services: [...editedData.services, input.value.trim()]
                              });
                              input.value = '';
                            }
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Gallery */}
            <PortfolioGallery
              images={portfolioData.gallery}
              isEditing={isEditing}
              onImagesChange={(images) => {
                setPortfolioData({ 
                  ...portfolioData, 
                  gallery: images.map(img => ({
                    id: img.id,
                    url: img.url,
                    title: img.title,
                    category: img.category
                  }))
                });
              }}
              onUploadComplete={(url, fileName) => {
                const newImage = {
                  id: Date.now().toString(),
                  url,
                  title: fileName,
                  category: template.name
                };
                setPortfolioData({
                  ...portfolioData,
                  gallery: [...portfolioData.gallery, newImage]
                });
              }}
              onRemoveImage={(id) => {
                setPortfolioData({
                  ...portfolioData,
                  gallery: portfolioData.gallery.filter(img => img.id !== id)
                });
              }}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  <Input
                    value={editedData.contact.email}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      contact: { ...editedData.contact, email: e.target.value }
                    })}
                    disabled={!isEditing}
                    placeholder="your@email.com"
                    type="email"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </label>
                  <Input
                    value={editedData.contact.phone}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      contact: { ...editedData.contact, phone: e.target.value }
                    })}
                    disabled={!isEditing}
                    placeholder="+1 (555) 123-4567"
                    type="tel"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </label>
                  <Input
                    value={editedData.contact.location}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      contact: { ...editedData.contact, location: e.target.value }
                    })}
                    disabled={!isEditing}
                    placeholder="City, State"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website
                  </label>
                  <Input
                    value={editedData.contact.website}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      contact: { ...editedData.contact, website: e.target.value }
                    })}
                    disabled={!isEditing}
                    placeholder="https://yourwebsite.com"
                    type="url"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Template Info */}
            <Card>
              <CardHeader>
                <CardTitle>Template Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Template</span>
                  <Badge variant="outline">{template.name}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Status</span>
                  <Badge variant="secondary">Draft</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Images</span>
                  <span className="text-sm font-medium">{portfolioData.gallery.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Edit, Eye, Share2, Loader2, Settings, Heart, Mountain, Palette, Move, GripVertical, Image } from "lucide-react";
import { PortfolioGallery } from "@/components/portfolio/PortfolioGallery";
import { PortfolioEditor } from "@/components/portfolio/PortfolioEditor";
import { PortfolioPreview } from "@/components/portfolio/PortfolioPreview";
import { PortfolioTemplateSelector } from "@/components/portfolio/PortfolioTemplateSelector";
import { usePortfolioData } from "@/hooks/portfolio/usePortfolioData";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkInProgress } from "@/components/ui/WorkInProgress";
import { PortfolioSidebar } from "@/components/portfolio/PortfolioSidebar";

export default function Portfolio() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { 
    portfolioData, 
    setPortfolioData, 
    isLoading, 
    isEditing, 
    setIsEditing, 
    showPreview, 
    setShowPreview, 
    handleSave,
    handleAddGalleryItem,
    handleRemoveGalleryItem,
    hasPortfolio
  } = usePortfolioData();

  // Load theme CSS only for Portfolio page
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/theme-styles.css';
    link.id = 'portfolio-theme-styles';
    document.head.appendChild(link);

    return () => {
      // Remove theme CSS when component unmounts
      const themeLink = document.getElementById('portfolio-theme-styles');
      if (themeLink) {
        themeLink.remove();
      }
    };
  }, []);

  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isDragMode, setIsDragMode] = useState(false);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [portfolioLayout, setPortfolioLayout] = useState([
    { id: 'hero', title: 'Hero Section', visible: true, order: 0 },
    { id: 'about', title: 'About Section', visible: true, order: 1 },
    { id: 'services', title: 'Services Section', visible: true, order: 2 },
    { id: 'gallery', title: 'Gallery Section', visible: true, order: 3 },
    { id: 'testimonials', title: 'Testimonials Section', visible: true, order: 4 },
    { id: 'contact', title: 'Contact Section', visible: true, order: 5 }
  ]);

  // Template configurations for preview
  const templateConfigs = {
    wedding: {
      name: "Wedding Photography",
      icon: <Heart className="h-5 w-5" />,
      color: "bg-pink-50 border-pink-200 text-pink-700",
      description: "Elegant and romantic templates perfect for wedding photographers"
    },
    wildlife: {
      name: "Wildlife Photography", 
      icon: <Mountain className="h-5 w-5" />,
      color: "bg-green-50 border-green-200 text-green-700",
      description: "Dynamic and nature-focused templates for wildlife photographers"
    },
    passion: {
      name: "Passion Photography",
      icon: <Palette className="h-5 w-5" />,
      color: "bg-purple-50 border-purple-200 text-purple-700", 
      description: "Creative and artistic templates for passionate photographers"
    }
  };

  const currentTemplate = selectedTemplate ? templateConfigs[selectedTemplate as keyof typeof templateConfigs] : null;

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, elementId: string) => {
    setDraggedElement(elementId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedElement || draggedElement === targetId) return;

    const newLayout = [...portfolioLayout];
    const draggedIndex = newLayout.findIndex(item => item.id === draggedElement);
    const targetIndex = newLayout.findIndex(item => item.id === targetId);

    // Swap the elements
    [newLayout[draggedIndex], newLayout[targetIndex]] = [newLayout[targetIndex], newLayout[draggedIndex]];

    // Update order values
    newLayout.forEach((item, index) => {
      item.order = index;
    });

    setPortfolioLayout(newLayout);
    setDraggedElement(null);
  };

  const toggleElementVisibility = (elementId: string) => {
    setPortfolioLayout(prev => 
      prev.map(item => 
        item.id === elementId ? { ...item, visible: !item.visible } : item
      )
    );
  };

  const sortedLayout = [...portfolioLayout].sort((a, b) => a.order - b.order);

  // Handle upload complete from FileUploader
  const handleUploadComplete = (url: string, fileName: string) => {
    handleAddGalleryItem({
      url,
      title: fileName,
      category: "Portfolio"
    });
  };

  if (showPreview) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 border-b bg-white shadow-sm">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              <span className="text-sm text-muted-foreground">Portfolio Preview</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Back to Editor
              </Button>
              <Button onClick={() => {
                // In a real app, this would publish the portfolio
                setShowPreview(false);
              }}>
                <Share2 className="h-4 w-4 mr-2" />
                Publish
              </Button>
            </div>
          </div>
        </div>
        <PortfolioPreview data={portfolioData} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-64 w-full mb-6" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper portfolio-theme-wrapper">
      <PortfolioSidebar onToggle={setSidebarCollapsed} />
      <div 
        className="body-wrapper transition-all duration-300"
        style={{
          marginLeft: sidebarCollapsed ? 'calc(256px * 0.2)' : '256px'
        }}
      >
        <div className="body-wrapper-inner" style={{ paddingTop: 0 }}>
          <div className="container-fluid" style={{ paddingTop: 0 }}>
            <div className="min-h-screen bg-gray-50">
              <div className="max-w-6xl mx-auto px-6 pt-4 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Portfolio Manager</h1>
            <p className="text-muted-foreground">Create and manage your photography showcase</p>
            <WorkInProgress variant="banner" size="md" className="mt-4" />
            {currentTemplate && (
              <div className="mt-2 flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${currentTemplate.color}`}>
                  {currentTemplate.icon}
                  <span className="font-medium">{currentTemplate.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{currentTemplate.description}</span>
              </div>
            )}
          </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowPreview(true)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        <Button 
                          variant={isDragMode ? "default" : "outline"} 
                          onClick={() => setIsDragMode(!isDragMode)}
                        >
                          <Move className="h-4 w-4 mr-2" />
                          {isDragMode ? "Exit Drag Mode" : "Drag & Drop"}
                        </Button>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                {hasPortfolio ? "Edit Portfolio" : "Create Portfolio"}
              </Button>
            )}
          </div>
        </div>

        {isEditing ? (
          <PortfolioEditor 
            data={portfolioData} 
            onChange={setPortfolioData}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            onUploadComplete={handleUploadComplete}
          />
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                          {/* Drag & Drop Layout Manager */}
                          {isDragMode && (
                            <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <GripVertical className="h-5 w-5" />
                                  Portfolio Layout Manager
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <p className="text-sm text-gray-600 mb-4">
                                    Drag and drop to reorder sections. Click the eye icon to show/hide sections.
                                  </p>
                                  {sortedLayout.map((element) => (
                                    <div
                                      key={element.id}
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, element.id)}
                                      onDragOver={handleDragOver}
                                      onDrop={(e) => handleDrop(e, element.id)}
                                      className={`flex items-center justify-between p-3 bg-white rounded-lg border-2 cursor-move transition-all ${
                                        draggedElement === element.id 
                                          ? 'border-blue-500 bg-blue-100' 
                                          : 'border-gray-200 hover:border-gray-300'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <GripVertical className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium">{element.title}</span>
                                      </div>
                                      <button
                                        onClick={() => toggleElementVisibility(element.id)}
                                        className={`p-1 rounded ${
                                          element.visible 
                                            ? 'text-green-600 hover:bg-green-100' 
                                            : 'text-gray-400 hover:bg-gray-100'
                                        }`}
                                      >
                                        <Eye className={`h-4 w-4 ${element.visible ? '' : 'opacity-50'}`} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Portfolio Overview */}
                          {sortedLayout.find(el => el.id === 'hero')?.visible && (
                            <Card className="mb-6">
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle>Portfolio Overview</CardTitle>
                                  <Button variant="outline" size="sm" onClick={() => setShowTemplateSelector(!showTemplateSelector)}>
                                    <Settings className="h-4 w-4 mr-2" />
                                    Manage Portfolio
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  <div>
                                    <h3 className="text-xl font-semibold">{portfolioData.name || "Sarah Johnson Photography"}</h3>
                                    <p className="text-muted-foreground">{portfolioData.tagline || "Capturing life's beautiful moments with artistic vision"}</p>
                                  </div>
                                  <p className="text-sm">{portfolioData.about || "I'm Sarah Johnson, a passionate photographer specializing in portrait, event, and commercial photography. With over 5 years of experience, I bring a unique blend of technical expertise and creative vision to every project. My style combines natural lighting with authentic moments, creating timeless images that tell your story beautifully."}</p>
                                  {portfolioData.services.length > 0 && (
                                    <div>
                                      <h4 className="font-medium mb-2">Services</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {portfolioData.services.map((service, index) => (
                                          <div key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                                            {service}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Gallery Section */}
                          {sortedLayout.find(el => el.id === 'gallery')?.visible && (
                            <div className="mt-6">
                              <PortfolioGallery
                                images={portfolioData.gallery}
                                isEditing={false}
                                onImagesChange={() => {}}
                                onUploadComplete={handleUploadComplete}
                                onRemoveImage={handleRemoveGalleryItem}
                              />
                            </div>
                          )}

              {showTemplateSelector && (
                <div className="mt-6">
                  <PortfolioTemplateSelector 
                    onTemplateSelect={(template) => {
                      setSelectedTemplate(template.id);
                      setShowTemplateSelector(false);
                      // Navigate to template page
                      navigate(`/portfolio/template/${template.id}`);
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Email:</span>
                    <p className="text-sm text-muted-foreground">{portfolioData.contact.email || "Not set"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Phone:</span>
                    <p className="text-sm text-muted-foreground">{portfolioData.contact.phone || "Not set"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Location:</span>
                    <p className="text-sm text-muted-foreground">{portfolioData.contact.location || "Not set"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Gallery Images</span>
                    <span className="text-sm font-medium">{portfolioData.gallery.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Services Listed</span>
                    <span className="text-sm font-medium">{portfolioData.services.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Portfolio Status</span>
                    <div className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                      {hasPortfolio ? "Published" : "Draft"}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {!user && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-blue-900 mb-2">Sign in to save your portfolio</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Create an account to save your portfolio and make it accessible to potential clients.
                    </p>
                    <Button 
                      onClick={() => navigate('/auth')}
                      className="w-full"
                      style={{ backgroundColor: '#556ee6' }}
                    >
                      Sign In or Create Account
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
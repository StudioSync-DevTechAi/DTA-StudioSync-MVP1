import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Camera, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  Upload,
  Edit,
  Save,
  Eye,
  Star,
  Calendar,
  DollarSign,
  CheckCircle,
  Plus,
  X
} from "lucide-react";
import { GalleryBuilder } from "./GalleryBuilder";
import { FileUploader } from "./FileUploader";
import { ImageSelector } from "./ImageSelector";
import { useToast } from "@/hooks/use-toast";

interface WeddingTemplateData {
  hero: {
    title: string;
    subtitle: string;
    backgroundImage: string;
    ctaText: string;
  };
  about: {
    photographerName: string;
    experience: string;
    style: string;
    yearsExperience: number;
    description: string;
  };
  services: {
    packages: Array<{
      name: string;
      price: number;
      description: string;
      features: string[];
    }>;
    additionalServices: string[];
  };
  testimonials: Array<{
    clientName: string;
    weddingDate: string;
    review: string;
    rating: number;
  }>;
  contact: {
    email: string;
    phone: string;
    location: string;
    website: string;
  };
  gallery: Array<{
    id: string;
    url: string;
    title: string;
    category: string;
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
    isSelected: boolean;
  }>;
}

interface WeddingTemplateProps {
  data: WeddingTemplateData;
  onChange: (data: WeddingTemplateData) => void;
  onSave: () => void;
  isEditing?: boolean;
}

export function WeddingTemplate({ 
  data, 
  onChange, 
  onSave, 
  isEditing = false 
}: WeddingTemplateProps) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('gallery');
  const [showImageSelector, setShowImageSelector] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  // GenAI-generated dummy data for pre-filling
  const dummyData: WeddingTemplateData = {
    hero: {
      title: "Capturing Your Love Story",
      subtitle: "Elegant wedding photography that tells your unique story with timeless beauty and authentic moments",
      backgroundImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=600&fit=crop&q=80",
      ctaText: "View Our Portfolio"
    },
    about: {
      photographerName: "Sarah Mitchell",
      experience: "With over 8 years of experience in wedding photography, I specialize in capturing the most precious moments of your special day. My approach combines traditional elegance with modern storytelling, ensuring every emotion and detail is beautifully preserved.",
      style: "Romantic, Documentary, Fine Art",
      yearsExperience: 8,
      description: "I believe that every love story is unique and deserves to be told through beautiful, authentic imagery. My passion lies in creating timeless photographs that will be treasured for generations to come."
    },
    services: {
      packages: [
        {
          name: "Essential Package",
          price: 1200,
          description: "Perfect for intimate ceremonies and elopements",
          features: [
            "4 hours of coverage",
            "100+ edited high-resolution photos",
            "Online gallery for 1 year",
            "Basic retouching included",
            "Digital download link"
          ]
        },
        {
          name: "Premium Package",
          price: 2200,
          description: "Complete wedding day coverage with engagement session",
          features: [
            "8 hours of coverage",
            "300+ edited high-resolution photos",
            "Engagement session included",
            "Online gallery for 2 years",
            "Premium retouching",
            "USB drive with all photos",
            "Print release included"
          ]
        },
        {
          name: "Luxury Package",
          price: 3500,
          description: "Full-service wedding photography experience",
          features: [
            "10 hours of coverage",
            "500+ edited high-resolution photos",
            "Engagement + bridal session",
            "Second photographer included",
            "Online gallery for 3 years",
            "Premium album included",
            "Same-day preview photos",
            "Print release + commercial rights"
          ]
        }
      ],
      additionalServices: [
        "Bridal Portraits",
        "Reception Coverage Extension",
        "Photo Booth Setup",
        "Drone Photography",
        "Videography Add-on",
        "Custom Wedding Albums",
        "Same-Day Editing"
      ]
    },
    testimonials: [
      {
        clientName: "Emily & James",
        weddingDate: "June 2024",
        review: "Sarah captured our wedding day perfectly! Her attention to detail and ability to capture candid moments made our photos absolutely stunning. We couldn't be happier with the results.",
        rating: 5
      },
      {
        clientName: "Maria & David",
        weddingDate: "September 2024",
        review: "Working with Sarah was an absolute pleasure. She made us feel comfortable and natural, and the photos reflect our genuine joy. Highly recommend her services!",
        rating: 5
      },
      {
        clientName: "Jessica & Michael",
        weddingDate: "August 2024",
        review: "Sarah's artistic eye and professional approach exceeded our expectations. Every photo tells a story, and we'll treasure these memories forever. Thank you for making our day so special!",
        rating: 5
      }
    ],
    contact: {
      email: "sarah@weddingphotography.com",
      phone: "(555) 123-4567",
      location: "San Francisco, CA",
      website: "www.sarahmitchellphotography.com"
    },
    gallery: []
  };

  // Initialize with dummy data if data is empty
  const currentData = data.gallery.length === 0 && !data.hero.title ? dummyData : data;

  const updateData = (section: keyof WeddingTemplateData, updates: any) => {
    onChange({
      ...currentData,
      [section]: { ...currentData[section], ...updates }
    });
  };

  const addPackage = () => {
    const newPackage = {
      name: "New Package",
      price: 0,
      description: "",
      features: []
    };
    updateData('services', {
      packages: [...currentData.services.packages, newPackage]
    });
  };

  const updatePackage = (index: number, updates: any) => {
    const updatedPackages = currentData.services.packages.map((pkg, i) => 
      i === index ? { ...pkg, ...updates } : pkg
    );
    updateData('services', { packages: updatedPackages });
  };

  const addTestimonial = () => {
    const newTestimonial = {
      clientName: "",
      weddingDate: "",
      review: "",
      rating: 5
    };
    updateData('testimonials', {
      testimonials: [...data.testimonials, newTestimonial]
    });
  };

  const updateTestimonial = (index: number, updates: any) => {
    const updatedTestimonials = data.testimonials.map((testimonial, i) => 
      i === index ? { ...testimonial, ...updates } : testimonial
    );
    updateData('testimonials', { testimonials: updatedTestimonials });
  };

  const handleGalleryChange = (gallery: any[]) => {
    updateData('gallery', gallery);
  };

  const handleUploadComplete = (url: string, fileName: string) => {
    const newImage = {
      id: Date.now().toString(),
      url,
      title: fileName,
      category: "Wedding",
      x: Math.random() * 200,
      y: Math.random() * 200,
      width: 200,
      height: 150,
      zIndex: 1,
      isSelected: false
    };
    
    updateData('gallery', [...data.gallery, newImage]);
    
    toast({
      title: "Image uploaded",
      description: "Image has been added to your gallery"
    });
  };

  const handleRemoveImage = (imageId: string) => {
    const updatedGallery = data.gallery.filter(img => img.id !== imageId);
    updateData('gallery', updatedGallery);
  };

  const handleImagesSelect = (selectedImages: any[]) => {
    const newGalleryImages = selectedImages.map(img => ({
      id: img.id,
      url: img.url,
      title: img.name,
      category: img.category,
      x: Math.random() * 200,
      y: Math.random() * 200,
      width: 200,
      height: 150,
      zIndex: 1,
      isSelected: false
    }));

    updateData('gallery', [...data.gallery, ...newGalleryImages]);
    setShowImageSelector(false);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b">
        {[
          { id: 'hero', label: 'Hero Section', icon: <Camera className="h-4 w-4" /> },
          { id: 'about', label: 'About', icon: <User className="h-4 w-4" /> },
          { id: 'services', label: 'Services', icon: <DollarSign className="h-4 w-4" /> },
          { id: 'gallery', label: 'Gallery', icon: <Heart className="h-4 w-4" /> },
          { id: 'testimonials', label: 'Testimonials', icon: <Star className="h-4 w-4" /> },
          { id: 'contact', label: 'Contact', icon: <Mail className="h-4 w-4" /> }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeSection === tab.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection(tab.id)}
            className="flex items-center gap-2"
          >
            {tab.icon}
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Hero Section */}
      {activeSection === 'hero' && (
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
                value={currentData.hero.title}
                onChange={(e) => updateData('hero', { title: e.target.value })}
                disabled={!isEditing}
                placeholder="Capturing Your Love Story"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Subtitle</label>
              <Input
                value={currentData.hero.subtitle}
                onChange={(e) => updateData('hero', { subtitle: e.target.value })}
                disabled={!isEditing}
                placeholder="Elegant wedding photography that tells your unique story"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Call-to-Action Text</label>
              <Input
                value={currentData.hero.ctaText}
                onChange={(e) => updateData('hero', { ctaText: e.target.value })}
                disabled={!isEditing}
                placeholder="View Our Work"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Background Image</label>
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 mb-2">
                <img
                  src={currentData.hero.backgroundImage}
                  alt="Hero background"
                  className="w-full h-full object-cover"
                />
              </div>
              {isEditing && (
                <FileUploader
                  onUploadComplete={(url) => updateData('hero', { backgroundImage: url })}
                  acceptedFileTypes="image/*"
                  maxFileSize={5}
                  folder="wedding/hero"
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* About Section */}
      {activeSection === 'about' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              About Section
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Photographer Name</label>
                <Input
                  value={currentData.about.photographerName}
                  onChange={(e) => updateData('about', { photographerName: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Years of Experience</label>
                <Input
                  type="number"
                  value={currentData.about.yearsExperience}
                  onChange={(e) => updateData('about', { yearsExperience: parseInt(e.target.value) || 0 })}
                  disabled={!isEditing}
                  placeholder="5"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Photography Style</label>
              <Input
                value={currentData.about.style}
                onChange={(e) => updateData('about', { style: e.target.value })}
                disabled={!isEditing}
                placeholder="Traditional, Modern, Documentary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Experience Description</label>
              <Textarea
                value={currentData.about.experience}
                onChange={(e) => updateData('about', { experience: e.target.value })}
                disabled={!isEditing}
                placeholder="Describe your experience and expertise..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">About Description</label>
              <Textarea
                value={currentData.about.description}
                onChange={(e) => updateData('about', { description: e.target.value })}
                disabled={!isEditing}
                placeholder="Tell your story and what makes you unique..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services Section */}
      {activeSection === 'services' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Services & Packages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Packages */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Wedding Packages</h3>
                {isEditing && (
                  <Button size="sm" onClick={addPackage}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Package
                  </Button>
                )}
              </div>
              <div className="space-y-4">
                {currentData.services.packages.map((pkg, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          value={pkg.name}
                          onChange={(e) => updatePackage(index, { name: e.target.value })}
                          disabled={!isEditing}
                          placeholder="Package Name"
                        />
                        <Input
                          type="number"
                          value={pkg.price}
                          onChange={(e) => updatePackage(index, { price: parseInt(e.target.value) || 0 })}
                          disabled={!isEditing}
                          placeholder="Price"
                        />
                      </div>
                      <Textarea
                        value={pkg.description}
                        onChange={(e) => updatePackage(index, { description: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Package description"
                        rows={2}
                      />
                      <div>
                        <label className="text-sm font-medium">Features (one per line)</label>
                        <Textarea
                          value={pkg.features.join('\n')}
                          onChange={(e) => updatePackage(index, { features: e.target.value.split('\n').filter(f => f.trim()) })}
                          disabled={!isEditing}
                          placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                          rows={3}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Additional Services */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Additional Services</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['Engagement Session', 'Bridal Portraits', 'Reception Coverage', 'Photo Booth', 'Albums', 'Online Gallery'].map((service) => (
                  <label key={service} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={currentData.services.additionalServices.includes(service)}
                      onChange={(e) => {
                        const services = e.target.checked
                          ? [...currentData.services.additionalServices, service]
                          : currentData.services.additionalServices.filter(s => s !== service);
                        updateData('services', { additionalServices: services });
                      }}
                      disabled={!isEditing}
                      className="rounded"
                    />
                    <span className="text-sm">{service}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gallery Section */}
      {activeSection === 'gallery' && (
        <div className="space-y-6">
          <GalleryBuilder
            images={data.gallery}
            onImagesChange={handleGalleryChange}
            onUploadComplete={handleUploadComplete}
            onRemoveImage={handleRemoveImage}
          />
          
          {/* Image Selector */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Images from Remote Image Storage</h3>
              <Button
                variant="outline"
                onClick={() => setShowImageSelector(!showImageSelector)}
              >
                {showImageSelector ? 'Hide' : 'Show'} Image Selector
              </Button>
            </div>
            
            {showImageSelector && (
              <ImageSelector
                onImagesSelect={handleImagesSelect}
                selectedImages={[]}
                onClose={() => setShowImageSelector(false)}
              />
            )}
          </div>
        </div>
      )}

      {/* Testimonials Section */}
      {activeSection === 'testimonials' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Client Testimonials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing && (
              <Button size="sm" onClick={addTestimonial} className="mb-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Testimonial
              </Button>
            )}
            <div className="space-y-4">
              {data.testimonials.map((testimonial, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        value={testimonial.clientName}
                        onChange={(e) => updateTestimonial(index, { clientName: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Client Name"
                      />
                      <Input
                        value={testimonial.weddingDate}
                        onChange={(e) => updateTestimonial(index, { weddingDate: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Wedding Date"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Rating</label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <Textarea
                      value={testimonial.review}
                      onChange={(e) => updateTestimonial(index, { review: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Client review..."
                      rows={3}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Section */}
      {activeSection === 'contact' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <Input
                  value={currentData.contact.email}
                  onChange={(e) => updateData('contact', { email: e.target.value })}
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
                  value={currentData.contact.phone}
                  onChange={(e) => updateData('contact', { phone: e.target.value })}
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
                  value={currentData.contact.location}
                  onChange={(e) => updateData('contact', { location: e.target.value })}
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
                  value={currentData.contact.website}
                  onChange={(e) => updateData('contact', { website: e.target.value })}
                  disabled={!isEditing}
                  placeholder="https://yourwebsite.com"
                  type="url"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setShowPreview(true)}>
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button onClick={() => {
          onSave();
          navigate('/portfolio/editor');
        }}>
          <Save className="h-4 w-4 mr-2" />
          Proceed to edit Portfolio
        </Button>
      </div>

      {/* Portfolio Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Portfolio Preview</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Portfolio Preview Content */}
              <div className="space-y-8 overflow-y-auto max-h-[70vh]">
                {/* Hero Section */}
                <div className="relative h-96 rounded-lg overflow-hidden">
                  <img 
                    src={currentData.hero.backgroundImage} 
                    alt="Hero Background" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-center text-white">
                      <h1 className="text-4xl md:text-6xl font-bold mb-4">{currentData.hero.title}</h1>
                      <p className="text-xl md:text-2xl mb-6 max-w-2xl">{currentData.hero.subtitle}</p>
                      <Button size="lg" className="bg-white text-black hover:bg-gray-100">
                        {currentData.hero.ctaText}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* About Section */}
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-4">About {currentData.about.photographerName}</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-4">{currentData.about.experience}</p>
                  <div className="flex justify-center gap-4 text-sm text-gray-500">
                    <span>Style: {currentData.about.style}</span>
                    <span>Experience: {currentData.about.yearsExperience} years</span>
                  </div>
                </div>

                {/* Services Section */}
                <div>
                  <h2 className="text-3xl font-bold text-center mb-8">Wedding Packages</h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    {currentData.services.packages.map((pkg, index) => (
                      <Card key={index} className="text-center">
                        <CardHeader>
                          <CardTitle>{pkg.name}</CardTitle>
                          <div className="text-2xl font-bold text-blue-600">${pkg.price}</div>
                          <p className="text-sm text-gray-600">{pkg.description}</p>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            {pkg.features.map((feature, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Testimonials Section */}
                <div>
                  <h2 className="text-3xl font-bold text-center mb-8">What Couples Say</h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    {currentData.testimonials.map((testimonial, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="flex mb-2">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <p className="text-sm mb-4">"{testimonial.review}"</p>
                          <div className="text-sm font-medium">{testimonial.clientName}</div>
                          <div className="text-xs text-gray-500">{testimonial.weddingDate}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Gallery Section */}
                {currentData.gallery.length > 0 && (
                  <div>
                    <h2 className="text-3xl font-bold text-center mb-8">Portfolio Gallery</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {currentData.gallery.map((image, index) => (
                        <div key={image.id} className="aspect-square overflow-hidden rounded-lg bg-gray-100 group cursor-pointer">
                          <img
                            src={image.url}
                            alt={image.title}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
                              {image.title}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Section */}
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <h2 className="text-3xl font-bold mb-6">Let's Create Your Perfect Day</h2>
                  <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-600" />
                      <span>{currentData.contact.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-blue-600" />
                      <span>{currentData.contact.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <span>{currentData.contact.location}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <span>{currentData.contact.website}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

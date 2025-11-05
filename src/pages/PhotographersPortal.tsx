
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Camera, 
  Phone, 
  ExternalLink,
  ArrowLeft,
  Users,
  MapPin,
  Star
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// Photographer interface
interface Photographer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  role: string;
  is_freelancer?: boolean;
  availability?: any;
  portfolio_url?: string;
  specialization?: string;
  location?: string;
  rating?: number;
  created_at: string;
}

// Quotation form interface
interface QuotationForm {
  photographer_id: string;
  shoot_start_date?: string;
  shoot_end_date?: string;
  is_flexible: boolean;
  project_details?: string;
  budget_range?: string;
  custom_budget?: number;
  contact_number: string;
  customer_name?: string;
  customer_email?: string;
}

export default function PhotographersPortal() {
  const navigate = useNavigate();
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotographer, setSelectedPhotographer] = useState<Photographer | null>(null);
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [formData, setFormData] = useState<QuotationForm>({
    photographer_id: "",
    is_flexible: false,
    contact_number: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Load photographers from team_members table
  useEffect(() => {
    const loadPhotographers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('role', 'photographer')
          .order('name');

        if (error) throw error;

        // Add mock portfolio URLs and specializations for demo
        const photographersWithPortfolio = (data || []).map(photographer => ({
          ...photographer,
          portfolio_url: `/portfolio/${photographer.id}`,
          specialization: getSpecialization(photographer.name),
          location: getLocation(photographer.name),
          rating: getRating(photographer.name)
        }));

        setPhotographers(photographersWithPortfolio);
      } catch (error) {
        console.error('Error loading photographers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPhotographers();
  }, []);

  // Mock data helpers
  const getSpecialization = (name: string) => {
    const specializations = [
      "Wedding Photography",
      "Portrait Photography", 
      "Event Photography",
      "Commercial Photography",
      "Fashion Photography",
      "Real Estate Photography"
    ];
    return specializations[name.length % specializations.length];
  };

  const getLocation = (name: string) => {
    const locations = [
      "Mumbai, Maharashtra",
      "Delhi, NCR",
      "Bangalore, Karnataka", 
      "Chennai, Tamil Nadu",
      "Pune, Maharashtra",
      "Hyderabad, Telangana"
    ];
    return locations[name.length % locations.length];
  };

  const getRating = (name: string) => {
    return 4.0 + (name.length % 10) * 0.1; // 4.0 to 4.9
  };

  const handleGetQuotation = (photographer: Photographer) => {
    setSelectedPhotographer(photographer);
    setFormData(prev => ({ ...prev, photographer_id: photographer.id }));
    setShowQuotationForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.contact_number) {
      alert("Contact number is required");
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate enquiry ID
      const enquiryId = `EQ${Date.now().toString().slice(-6)}`;
      
      // Convert budget range to numeric value
      let quoteAmount = 0;
      if (formData.custom_budget && formData.custom_budget > 0) {
        quoteAmount = formData.custom_budget;
      } else if (formData.budget_range) {
        // Convert budget range text to numeric value
        switch (formData.budget_range) {
          case "Under ₹10,000":
            quoteAmount = 5000; // Mid-point
            break;
          case "₹10,000 - ₹25,000":
            quoteAmount = 17500; // Mid-point
            break;
          case "₹25,000 - ₹50,000":
            quoteAmount = 37500; // Mid-point
            break;
          case "₹50,000 - ₹1,00,000":
            quoteAmount = 75000; // Mid-point
            break;
          case "Above ₹1,00,000":
            quoteAmount = 150000; // Representative value
            break;
          default:
            quoteAmount = 0;
        }
      }
      
      // Prepare enquiry data
      const enquiryData = {
        enquiry_id: enquiryId,
        request_details: formData.project_details || "No details provided",
        shoot_start_date: formData.shoot_start_date || new Date().toISOString().split('T')[0],
        shoot_end_date: formData.shoot_end_date || new Date().toISOString().split('T')[0],
        quote_amount: quoteAmount,
        customer_phone: formData.contact_number,
        customer_email: formData.customer_email || "",
        customer_name: formData.customer_name || "Anonymous",
        status: 'pending',
        received_date: new Date().toISOString().split('T')[0],
        enquiry_datetime_stamp: new Date().toISOString(),
        budget_range: formData.budget_range || "",
        is_flexible: formData.is_flexible
      };

      // Insert into quote_enquiries table
      const { error } = await supabase
        .from('quote_enquiries')
        .insert([enquiryData]);

      if (error) throw error;

      setSubmitted(true);
      setTimeout(() => {
        setShowQuotationForm(false);
        setSubmitted(false);
        setFormData({
          photographer_id: "",
          is_flexible: false,
          contact_number: "",
        });
      }, 3000);

    } catch (error) {
      console.error('Error submitting quotation:', error);
      alert('Failed to submit quotation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const budgetRanges = [
    "Under ₹10,000",
    "₹10,000 - ₹25,000", 
    "₹25,000 - ₹50,000",
    "₹50,000 - ₹1,00,000",
    "Above ₹1,00,000",
    "Custom Amount"
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <img 
                src="/photosyncwork-logo.svg" 
                alt="StudioSyncWork Logo" 
                className="h-8 w-8 object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold">StudioSyncWork Photographers</CardTitle>
            <CardDescription>
              Professional photography & videography management platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <Camera className="h-8 w-8 animate-pulse mr-2" />
              <p className="text-muted-foreground">Loading photographers...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => navigate("/auth")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Login</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-3">
                <Users className="h-8 w-8" />
                <span>PhotoSync PhotoGraphers</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Choose from our talented team of professional photographers
              </p>
            </div>
          </div>
        </div>

        {/* Photographers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photographers.map((photographer) => (
            <Card key={photographer.id} className="hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Camera className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{photographer.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {photographer.specialization}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">{photographer.rating}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Location */}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{photographer.location}</span>
                </div>

                {/* Contact Info */}
                {photographer.phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{photographer.phone}</span>
                  </div>
                )}

                {/* Portfolio Link */}
                <div className="flex items-center space-x-2">
            <Button 
              variant="outline"
                    size="sm"
                    onClick={() => window.open(photographer.portfolio_url, '_blank')}
                    className="flex items-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>View Portfolio</span>
            </Button>
                </div>
            
                {/* Get Quotation Button */}
            <Button 
                  onClick={() => handleGetQuotation(photographer)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Get Quotation
            </Button>
              </CardContent>
            </Card>
          ))}
          </div>

        {/* Quotation Form Modal */}
        {showQuotationForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Get Quotation</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuotationForm(false)}
                  >
                    ×
                  </Button>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Request a quote from {selectedPhotographer?.name}
                </p>
              </CardHeader>
              
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                      <Camera className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-600 mb-2">
                      Thank You!
                    </h3>
                    <p className="text-gray-600">
                      Thanks for showing interest, it will be responded soon.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    {/* Date Range */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Shoot Date Range</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={formData.shoot_start_date || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, shoot_start_date: e.target.value }))}
                          className="px-3 py-2 border rounded-md text-sm"
                        />
                        <input
                          type="date"
                          value={formData.shoot_end_date || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, shoot_end_date: e.target.value }))}
                          className="px-3 py-2 border rounded-md text-sm"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="flexible"
                          checked={formData.is_flexible}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_flexible: e.target.checked }))}
                          className="rounded"
                        />
                        <label htmlFor="flexible" className="text-sm">Dates are flexible</label>
                      </div>
                    </div>

                    {/* Project Details */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Project Requirements</label>
                      <textarea
                        value={formData.project_details || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, project_details: e.target.value }))}
                        placeholder="Describe your photography needs..."
                        className="w-full px-3 py-2 border rounded-md text-sm h-20 resize-none"
                      />
                    </div>

                    {/* Budget Range */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Budget Range</label>
                      <select
                        value={formData.budget_range || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, budget_range: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      >
                        <option value="">Select budget range</option>
                        {budgetRanges.map(range => (
                          <option key={range} value={range}>{range}</option>
                        ))}
                      </select>
                      
                      {formData.budget_range === "Custom Amount" && (
                        <input
                          type="number"
                          placeholder="Enter custom amount"
                          value={formData.custom_budget || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, custom_budget: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                      )}
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Contact Number *</label>
                      <input
                        type="tel"
                        required
                        value={formData.contact_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_number: e.target.value }))}
                        placeholder="Your phone number"
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name (Optional)</label>
                      <input
                        type="text"
                        value={formData.customer_name || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                        placeholder="Your name"
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email (Optional)</label>
                      <input
                        type="email"
                        value={formData.customer_email || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                        placeholder="your@email.com"
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Quotation Request"}
                    </Button>
                  </form>
                )}
        </CardContent>
      </Card>
          </div>
        )}
      </div>
    </div>
  );
}

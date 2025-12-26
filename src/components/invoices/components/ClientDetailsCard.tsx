
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface ClientDetailsCardProps {
  invoiceType: "proforma" | "paid";
  onInvoiceTypeChange: (type: "proforma" | "paid") => void;
  paymentReceived?: boolean;
  onPaymentReceivedChange?: (received: boolean) => void;
  paymentDate?: string;
  onPaymentDateChange?: (date: string) => void;
  paymentMethod?: string;
  onPaymentMethodChange?: (method: string) => void;
  
  // Client details
  clientName: string;
  onClientNameChange: (name: string) => void;
  clientEmail: string;
  onClientEmailChange: (email: string) => void;
  clientPhone: string;
  onClientPhoneChange: (phone: string) => void;
  clientAddress: string;
  onClientAddressChange: (address: string) => void;
  clientGst: string;
  onClientGstChange: (gst: string) => void;
  
  // Company details
  companyName: string;
  onCompanyNameChange: (name: string) => void;
  companyEmail: string;
  onCompanyEmailChange: (email: string) => void;
  companyPhone: string;
  onCompanyPhoneChange: (phone: string) => void;
  companyAddress: string;
  onCompanyAddressChange: (address: string) => void;
  companyGst: string;
  onCompanyGstChange: (gst: string) => void;
  
  // Invoice details
  invoiceDate: string;
  onInvoiceDateChange: (date: string) => void;
}

export function ClientDetailsCard({ 
  invoiceType, 
  onInvoiceTypeChange,
  paymentReceived = false,
  onPaymentReceivedChange = () => {},
  paymentDate = "",
  onPaymentDateChange = () => {},
  paymentMethod = "bank",
  onPaymentMethodChange = () => {},
  clientName,
  onClientNameChange,
  clientEmail,
  onClientEmailChange,
  clientPhone,
  onClientPhoneChange,
  clientAddress,
  onClientAddressChange,
  clientGst,
  onClientGstChange,
  companyName,
  onCompanyNameChange,
  companyEmail,
  onCompanyEmailChange,
  companyPhone,
  onCompanyPhoneChange,
  companyAddress,
  onCompanyAddressChange,
  companyGst,
  onCompanyGstChange,
  invoiceDate,
  onInvoiceDateChange
}: ClientDetailsCardProps) {
  return (
    <Card 
      className="p-4"
      style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}
    >
      <h3 className="font-medium mb-4 text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Client & Company Details</h3>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="invoiceType" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Invoice Type</Label>
            <Select value={invoiceType} onValueChange={onInvoiceTypeChange}>
              <SelectTrigger 
                className="text-white"
                style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
              >
                <SelectValue placeholder="Select invoice type" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
                <SelectItem value="proforma" className="text-white hover:bg-[#1a0f3d]">Proforma Invoice</SelectItem>
                <SelectItem value="paid" className="text-white hover:bg-[#1a0f3d]">Paid Invoice</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Invoice Date</Label>
            <Input 
              id="date" 
              type="date" 
              value={invoiceDate}
              onChange={(e) => onInvoiceDateChange(e.target.value)}
              className="text-white"
              style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
            />
          </div>
        </div>

        {/* Payment Details Section - for paid invoices */}
        {invoiceType === "paid" && (
          <div className="border-t pt-4" style={{ borderColor: '#3d2a5f' }}>
            <h4 className="text-sm font-medium mb-4 text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Payment Details</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 flex items-center justify-between">
                <Label htmlFor="paymentReceived" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Payment Received</Label>
                <Switch 
                  id="paymentReceived" 
                  checked={paymentReceived}
                  onCheckedChange={onPaymentReceivedChange}
                />
              </div>
              {paymentReceived && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="paymentDate" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Payment Date</Label>
                    <Input 
                      id="paymentDate" 
                      type="date" 
                      value={paymentDate}
                      onChange={(e) => onPaymentDateChange(e.target.value)}
                      className="text-white"
                      style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="paymentMethod" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
                      <SelectTrigger 
                        className="text-white"
                        style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
                      >
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
                        <SelectItem value="bank" className="text-white hover:bg-[#1a0f3d]">Bank Transfer</SelectItem>
                        <SelectItem value="cash" className="text-white hover:bg-[#1a0f3d]">Cash</SelectItem>
                        <SelectItem value="upi" className="text-white hover:bg-[#1a0f3d]">UPI</SelectItem>
                        <SelectItem value="cheque" className="text-white hover:bg-[#1a0f3d]">Cheque</SelectItem>
                        <SelectItem value="other" className="text-white hover:bg-[#1a0f3d]">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Client Details Section */}
        <div className="border-t pt-4" style={{ borderColor: '#3d2a5f' }}>
          <h4 className="text-sm font-medium mb-4 text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Client Details</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Client Name</Label>
              <Input 
                id="client" 
                placeholder="Enter client name"
                value={clientName}
                onChange={(e) => onClientNameChange(e.target.value)}
                className="text-white placeholder:text-gray-400"
                style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="client@example.com"
                value={clientEmail}
                onChange={(e) => onClientEmailChange(e.target.value)}
                className="text-white placeholder:text-gray-400"
                style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Phone Number</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="+91 98765 43210"
                value={clientPhone}
                onChange={(e) => onClientPhoneChange(e.target.value)}
                className="text-white placeholder:text-gray-400"
                style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientAddress" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Address</Label>
              <Input 
                id="clientAddress" 
                placeholder="Enter client's address"
                value={clientAddress}
                onChange={(e) => onClientAddressChange(e.target.value)}
                className="text-white placeholder:text-gray-400"
                style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
              />
            </div>
            {invoiceType === "paid" && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="clientGst" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Client GST Number</Label>
                <Input 
                  id="clientGst" 
                  placeholder="Enter client's GST number"
                  className="uppercase text-white placeholder:text-gray-400"
                  value={clientGst}
                  onChange={(e) => onClientGstChange(e.target.value)}
                  style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Company Details Section */}
        <div className="border-t pt-4" style={{ borderColor: '#3d2a5f' }}>
          <h4 className="text-sm font-medium mb-4 text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Company Details</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Company Name</Label>
              <Input 
                id="companyName" 
                placeholder="Enter company name"
                value={companyName}
                onChange={(e) => onCompanyNameChange(e.target.value)}
                className="text-white placeholder:text-gray-400"
                style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyEmail" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Company Email</Label>
              <Input 
                id="companyEmail" 
                type="email" 
                placeholder="company@example.com"
                value={companyEmail}
                onChange={(e) => onCompanyEmailChange(e.target.value)}
                className="text-white placeholder:text-gray-400"
                style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyPhone" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Company Phone</Label>
              <Input 
                id="companyPhone" 
                type="tel" 
                placeholder="+91 98765 43210"
                value={companyPhone}
                onChange={(e) => onCompanyPhoneChange(e.target.value)}
                className="text-white placeholder:text-gray-400"
                style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyAddress" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Company Address</Label>
              <Input 
                id="companyAddress" 
                placeholder="Enter company address"
                value={companyAddress}
                onChange={(e) => onCompanyAddressChange(e.target.value)}
                className="text-white placeholder:text-gray-400"
                style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
              />
            </div>
            {invoiceType === "paid" && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="companyGst" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Company GST Number</Label>
                <Input 
                  id="companyGst" 
                  placeholder="Enter company's GST number"
                  className="uppercase text-white placeholder:text-gray-400"
                  value={companyGst}
                  onChange={(e) => onCompanyGstChange(e.target.value)}
                  style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

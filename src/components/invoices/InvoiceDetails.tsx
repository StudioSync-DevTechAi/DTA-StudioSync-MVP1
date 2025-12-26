
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Send, Edit, History } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Card } from "../ui/card";
import { Invoice } from "./types";
import { format } from "date-fns";
import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface InvoiceDetailsProps {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export function InvoiceDetails({ invoice, open, onClose, onEdit }: InvoiceDetailsProps) {
  if (!invoice) return null;

  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Format payment status with appropriate styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-600/30 text-green-300 px-2 py-1 rounded-full text-xs border border-green-500/50';
      case 'partial':
        return 'bg-yellow-600/30 text-yellow-300 px-2 py-1 rounded-full text-xs border border-yellow-500/50';
      default:
        return 'bg-gray-600/30 text-gray-300 px-2 py-1 rounded-full text-xs border border-gray-500/50';
    }
  };

  // Format date helper function
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch (e) {
      return dateStr;
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || isGeneratingPDF) return;

    setIsGeneratingPDF(true);
    try {
      // Capture the invoice details as canvas
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // Increase scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#1a0f3d', // Match the background of the invoice
        windowWidth: invoiceRef.current.scrollWidth,
        windowHeight: invoiceRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');

      // Calculate PDF dimensions in mm
      const pxToMm = 0.264583; // Standard conversion for 96dpi
      const scaleFactor = 2; // We used scale: 2 in html2canvas
      const actualPxToMm = pxToMm / scaleFactor; // Adjust for the scale

      const pdfWidth = (canvas.width * actualPxToMm);
      const pdfHeight = (canvas.height * actualPxToMm);

      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight] // Custom format to fit content on one page
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const clientName = (invoice?.client || 'Invoice').replace(/[^a-zA-Z0-9]/g, '_'); // Sanitize filename
      const invoiceNumber = invoice.displayNumber || invoice.id.substring(0, 8);
      const date = new Date().toISOString().split('T')[0];
      const filename = `Invoice_${invoiceNumber}_${clientName}_${date}.pdf`;

      pdf.save(filename);

      toast({
        title: "PDF Downloaded",
        description: "Your invoice PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'rgba(26, 15, 61, 0.98)', backdropFilter: 'blur(10px)', borderColor: '#3d2a5f' }}
      >
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center text-white pr-10" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
            <span>Invoice {invoice.displayNumber || `#${invoice.id.substring(0, 8)}`}</span>
            <div className="flex items-center gap-2">
              {invoice.versionHistory && invoice.versionHistory.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1 text-white border-[#5a4a7a] hover:bg-[#1a0f3d]"
                      style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
                    >
                      <History className="h-4 w-4" />
                      History
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-80 max-h-96 overflow-y-auto"
                    style={{ backgroundColor: 'rgba(26, 15, 61, 0.98)', backdropFilter: 'blur(10px)', borderColor: '#3d2a5f' }}
                  >
                    <div className="space-y-3">
                      <h4 className="font-semibold text-white mb-3" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
                        Version History
                        {invoice.currentVersion && (
                          <span className="text-sm font-normal text-white/70 ml-2">
                            (Current: v{invoice.currentVersion})
                          </span>
                        )}
                      </h4>
                      <div className="space-y-2">
                        {invoice.versionHistory
                          .slice()
                          .reverse()
                          .map((version, index) => {
                            const versionData = version.invoice_form_data || {};
                            const paymentTracking = versionData.paymentTracking || {};
                            const totals = versionData.totals || {};
                            const totalAmount = paymentTracking.totalAmount || totals.total || "0";
                            
                            return (
                              <div
                                key={index}
                                className="p-3 rounded-md border"
                                style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a' }}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
                                    Version {version.version}
                                  </span>
                                  <span className="text-xs text-white/70" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                                    {format(new Date(version.updated_at), 'MMM dd, yyyy HH:mm')}
                                  </span>
                                </div>
                                <div className="text-sm text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                                  <div>Total: ₹{totalAmount}</div>
                                  {version.updated_by && (
                                    <div className="text-xs text-white/60 mt-1">
                                      Updated by: {version.updated_by}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        {invoice.currentVersion && (
                          <div
                            className="p-3 rounded-md border"
                            style={{ backgroundColor: 'rgba(0, 136, 254, 0.2)', borderColor: '#0088FE' }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
                                Version {invoice.currentVersion} (Current)
                              </span>
                            </div>
                            <div className="text-sm text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                              <div>Total: ₹{invoice.amount}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              {onEdit && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onEdit} 
                  className="gap-1 text-white border-[#5a4a7a] hover:bg-[#1a0f3d]"
                  style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div ref={invoiceRef} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Client & Invoice Info */}
            <Card className="p-4 space-y-4" style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
              <div>
                <h3 className="font-medium text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Client Details</h3>
                <div className="mt-2 space-y-1">
                  <p className="font-medium text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{invoice.client}</p>
                  {invoice.clientEmail && <p className="text-sm text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{invoice.clientEmail}</p>}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Invoice Details</h3>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>Invoice Number:</span>
                    <span className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{invoice.displayNumber || `#${invoice.id.substring(0, 8)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>Date:</span>
                    <span className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{formatDate(invoice.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>Status:</span>
                    <span className={getStatusStyle(invoice.status)} style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Payment Summary */}
            <Card className="p-4 space-y-4" style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
              <div>
                <h3 className="font-medium text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Payment Summary</h3>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>Total Amount:</span>
                    <span className="font-medium text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>₹{invoice.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>Paid Amount:</span>
                    <span className="text-green-300" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>₹{invoice.paidAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>Balance Due:</span>
                    <span className="text-red-300" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>₹{invoice.balanceAmount}</span>
                  </div>
                </div>
              </div>
              
              {invoice.paymentMethod && (
                <div>
                  <h3 className="font-medium text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Payment Details</h3>
                  <div className="mt-2 space-y-1">
                    {invoice.paymentDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>Payment Date:</span>
                        <span className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{formatDate(invoice.paymentDate)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>Payment Method:</span>
                      <span className="capitalize text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{invoice.paymentMethod}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
          
          {/* Invoice Items */}
          <div>
            <h3 className="font-medium mb-2 text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Invoice Items</h3>
            <div className="rounded-md border" style={{ borderColor: '#3d2a5f' }}>
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: '#3d2a5f' }}>
                    <TableHead className="w-[70%] text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Description</TableHead>
                    <TableHead className="text-right text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item, index) => (
                    <TableRow key={index} style={{ borderColor: '#3d2a5f' }} className="hover:bg-white/5">
                      <TableCell className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{item.description}</TableCell>
                      <TableCell className="text-right text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>₹{item.amount}</TableCell>
                    </TableRow>
                  ))}
                  
                  {/* GST row if applicable */}
                  {invoice.gstRate && parseInt(invoice.gstRate) > 0 && (
                    <TableRow style={{ borderColor: '#3d2a5f' }} className="hover:bg-white/5">
                      <TableCell className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>GST ({invoice.gstRate}%)</TableCell>
                      <TableCell className="text-right text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                        ₹{(parseFloat(invoice.amount) - invoice.items.reduce((sum, item) => 
                          sum + (parseFloat(item.amount.replace(/[₹,]/g, "")) || 0), 0)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {/* Total row */}
                  <TableRow style={{ borderColor: '#3d2a5f' }} className="hover:bg-white/5">
                    <TableCell className="font-medium text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>Total</TableCell>
                    <TableCell className="text-right font-medium text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>₹{invoice.amount}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          
          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div>
              <h3 className="font-medium mb-2 text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Payment History</h3>
              <div className="rounded-md border" style={{ borderColor: '#3d2a5f' }}>
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderColor: '#3d2a5f' }}>
                      <TableHead className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Date</TableHead>
                      <TableHead className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Method</TableHead>
                      <TableHead className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Collected By</TableHead>
                      <TableHead className="text-right text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.payments.map((payment) => (
                      <TableRow key={payment.id} style={{ borderColor: '#3d2a5f' }} className="hover:bg-white/5">
                        <TableCell className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{formatDate(payment.date)}</TableCell>
                        <TableCell className="capitalize text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{payment.method}</TableCell>
                        <TableCell className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{payment.collected_by}</TableCell>
                        <TableCell className="text-right text-green-300" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>₹{payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          
          {/* Notes */}
          {invoice.notes && (
            <div>
              <h3 className="font-medium mb-2 text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Notes</h3>
              <p className="text-sm text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{invoice.notes}</p>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button 
              variant="outline" 
              className="gap-2 text-white border-[#5a4a7a] hover:bg-[#1a0f3d]"
              style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
            >
              <Download className="h-4 w-4" />
              {isGeneratingPDF ? "Generating..." : "Download PDF"}
            </Button>
            <Button 
              className="gap-2 text-white hover:bg-[#1a0f3d]"
              style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
            >
              <Send className="h-4 w-4" />
              Send to Client
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Percent } from "lucide-react";
import { calculateGST, calculateSubtotal, calculateTotal } from "../utils/calculations";

interface TotalCardProps {
  items: { amount: string }[];
  gstRate: string;
  onGstRateChange: (rate: string) => void;
  hideGst?: boolean;
}

export function TotalCard({ items, gstRate, onGstRateChange, hideGst = false }: TotalCardProps) {
  const subtotal = calculateSubtotal(items);
  const gst = hideGst ? 0 : calculateGST(subtotal, gstRate);
  const total = calculateTotal(subtotal, gst);

  return (
    <Card 
      className="p-4"
      style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}
    >
      <div className="space-y-4">
        {!hideGst && (
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="gst" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>GST Rate</Label>
              <div className="relative mt-2">
                <Input
                  id="gst"
                  type="number"
                  value={gstRate}
                  onChange={(e) => onGstRateChange(e.target.value)}
                  className="pr-10 text-white text-center"
                  style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid', textAlign: 'center' }}
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2 pt-4 border-t" style={{ borderColor: '#3d2a5f' }}>
          <div className="flex justify-between">
            <span className="text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>Subtotal:</span>
            <span className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>₹{subtotal.toFixed(2)}</span>
          </div>
          {!hideGst && (
            <div className="flex justify-between">
              <span className="text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>GST ({gstRate}%):</span>
              <span className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>₹{gst.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium">
            <span className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Total:</span>
            <span className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

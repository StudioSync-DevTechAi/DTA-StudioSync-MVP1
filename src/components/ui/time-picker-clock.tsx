import * as React from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface TimePickerClockProps {
  hour: string;
  minute: string;
  onHourChange: (hour: string) => void;
  onMinuteChange: (minute: string) => void;
  className?: string;
}

export function TimePickerClock({
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  className,
}: TimePickerClockProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"hour" | "minute">("hour");
  const [amPm, setAmPm] = React.useState<"AM" | "PM">("AM");
  const clockRef = React.useRef<HTMLDivElement>(null);

  const currentHour24 = parseInt(hour, 10) || 0;
  const currentMinute = parseInt(minute, 10) || 0;
  
  // Convert 24-hour to 12-hour format
  const currentHour12 = currentHour24 === 0 ? 12 : currentHour24 > 12 ? currentHour24 - 12 : currentHour24;
  const currentAmPm = currentHour24 >= 12 ? "PM" : "AM";
  
  // Initialize AM/PM based on current hour
  React.useEffect(() => {
    if (currentHour24 >= 12) {
      setAmPm("PM");
    } else {
      setAmPm("AM");
    }
  }, [currentHour24]);

  const handleClockClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!clockRef.current) return;

    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;

    const angle = Math.atan2(y, x);

    if (mode === "hour") {
      // Convert angle to hour (1-12)
      let hour12 = Math.round(((angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI) * 12);
      if (hour12 === 0) hour12 = 12;
      
      // Convert 12-hour to 24-hour format based on AM/PM
      let hour24: number;
      if (amPm === "AM") {
        hour24 = hour12 === 12 ? 0 : hour12;
      } else {
        hour24 = hour12 === 12 ? 12 : hour12 + 12;
      }
      
      onHourChange(hour24.toString().padStart(2, "0"));
    } else {
      // Convert angle to minute (0-59)
      let minuteValue = Math.round(((angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI) * 60);
      if (minuteValue === 60) minuteValue = 0;
      onMinuteChange(minuteValue.toString().padStart(2, "0"));
    }
  };
  
  const handleAmPmChange = (newAmPm: "AM" | "PM") => {
    setAmPm(newAmPm);
    // Update hour when AM/PM changes
    let hour24: number;
    if (newAmPm === "AM") {
      hour24 = currentHour12 === 12 ? 0 : currentHour12;
    } else {
      hour24 = currentHour12 === 12 ? 12 : currentHour12 + 12;
    }
    onHourChange(hour24.toString().padStart(2, "0"));
  };

  const getHourPosition = (h: number) => {
    // h is 1-12 for display
    const angle = ((h % 12 || 12) * (2 * Math.PI / 12)) - Math.PI / 2;
    const radius = 35; // Percentage from center
    return {
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle),
    };
  };

  const getMinutePosition = (m: number) => {
    // m is 0, 5, 10, 15, etc. (multiples of 5)
    const angle = (m * (2 * Math.PI / 60)) - Math.PI / 2;
    const radius = 35; // Percentage from center
    return {
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle),
    };
  };

  const displayHour = currentHour12;
  const displayMinute = currentMinute;

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 border rounded-md bg-background hover:bg-accent",
          "w-full justify-start text-left font-normal text-white"
        )}
        style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
      >
        <Clock className="h-4 w-4" />
        <span>
          {currentHour12}:{minute.padStart(2, "0")} {currentAmPm}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="absolute z-50 bottom-full mb-2 left-0 p-4 bg-background border rounded-lg shadow-lg"
            style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}
          >
            <div className="flex gap-4 items-center">
              {/* Mode Toggle */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setMode("hour")}
                  className={cn(
                    "px-3 py-1 rounded text-sm text-white",
                    mode === "hour"
                      ? "bg-blue-600 text-white"
                      : "bg-white/10 hover:bg-white/20"
                  )}
                  style={mode === "hour" ? {} : { backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  Hour
                </button>
                <button
                  type="button"
                  onClick={() => setMode("minute")}
                  className={cn(
                    "px-3 py-1 rounded text-sm text-white",
                    mode === "minute"
                      ? "bg-blue-600 text-white"
                      : "bg-white/10 hover:bg-white/20"
                  )}
                  style={mode === "minute" ? {} : { backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  Minute
                </button>
              </div>

              {/* Clock Face */}
              <div className="relative">
                <div
                  ref={clockRef}
                  onClick={handleClockClick}
                  className="relative w-48 h-48 border-2 border-primary rounded-full cursor-pointer bg-background"
                  style={{ backgroundColor: '#1a0f3d', borderColor: '#3d2a5f' }}
                >
                  {/* Clock Center */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full z-10" />

                  {/* Hour Hand */}
                  {mode === "hour" && (
                    <>
                      <div
                        className="absolute top-1/2 left-1/2 origin-bottom z-10"
                        style={{
                          transform: `translate(-50%, -100%) rotate(${
                            (displayHour * 30 - 90) % 360
                          }deg)`,
                          width: "3px",
                          height: "30%",
                          background: "hsl(var(--primary))",
                          borderRadius: "2px",
                        }}
                      />
                      {/* Show 12-hour value indicator */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-8 text-xs font-bold text-primary">
                        {displayHour}
                      </div>
                    </>
                  )}

                  {/* Minute Hand */}
                  {mode === "minute" && (
                    <>
                      <div
                        className="absolute top-1/2 left-1/2 origin-bottom z-10"
                        style={{
                          transform: `translate(-50%, -100%) rotate(${
                            (displayMinute * 6 - 90) % 360
                          }deg)`,
                          width: "2px",
                          height: "40%",
                          background: "hsl(var(--primary))",
                          borderRadius: "1px",
                        }}
                      />
                      {/* Show minute value indicator */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-8 text-xs font-bold text-primary">
                        {currentMinute}
                      </div>
                    </>
                  )}

                  {/* Hour Markers */}
                  {mode === "hour" &&
                    Array.from({ length: 12 }, (_, i) => {
                      const h = i === 0 ? 12 : i;
                      const pos = getHourPosition(h);
                      return (
                        <div
                          key={i}
                          className="absolute text-xs font-medium text-white"
                          style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}
                          style={{
                            left: `${pos.x}%`,
                            top: `${pos.y}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                        >
                          {h}
                        </div>
                      );
                    })}

                  {/* Minute Markers */}
                  {mode === "minute" &&
                    Array.from({ length: 12 }, (_, i) => {
                      const m = i * 5;
                      const pos = getMinutePosition(m);
                      return (
                        <div
                          key={i}
                          className="absolute text-xs font-medium text-white"
                          style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}
                          style={{
                            left: `${pos.x}%`,
                            top: `${pos.y}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                        >
                          {m}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Display Current Time and AM/PM */}
              <div className="flex flex-col gap-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
                    {displayHour}:{minute.padStart(2, "0")}
                  </div>
                  {/* AM/PM Toggle - Only show in hour mode */}
                  {mode === "hour" && (
                    <div className="flex gap-2 mt-2 justify-center">
                      <button
                        type="button"
                        onClick={() => handleAmPmChange("AM")}
                        className={cn(
                          "px-4 py-1 rounded text-sm font-medium text-white",
                          amPm === "AM"
                            ? "bg-blue-600 text-white"
                            : "bg-white/10 hover:bg-white/20"
                        )}
                        style={amPm === "AM" ? {} : { backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAmPmChange("PM")}
                        className={cn(
                          "px-4 py-1 rounded text-sm font-medium text-white",
                          amPm === "PM"
                            ? "bg-blue-600 text-white"
                            : "bg-white/10 hover:bg-white/20"
                        )}
                        style={amPm === "PM" ? {} : { backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                      >
                        PM
                      </button>
                    </div>
                  )}
                  <div className="text-xs text-white/80 mt-2 whitespace-nowrap" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                    {mode === "hour" ? "Select Hour (12-hour)" : "Select Minute"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


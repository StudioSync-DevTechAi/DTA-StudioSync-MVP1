import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Move, 
  RotateCcw, 
  Maximize2, 
  Minimize2,
  Grid3X3,
  Layout,
  Square,
  ZoomIn,
  ZoomOut,
  Settings,
  Trash2,
  Plus,
  Edit,
  Lock,
  Unlock,
  X
} from "lucide-react";
import { usePortfolioData } from "@/hooks/portfolio/usePortfolioData";
import { useToast } from "@/hooks/use-toast";

interface PortfolioElement {
  id: string;
  type: 'hero' | 'about' | 'services' | 'gallery' | 'testimonials' | 'contact';
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isSelected: boolean;
  isLocked: boolean;
  content?: any;
}

interface PortfolioEditorProps {}

export default function PortfolioEditor({}: PortfolioEditorProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { portfolioData, setPortfolioData, handleSave } = usePortfolioData();
  
  // Load theme CSS only for PortfolioEditor page (part of portfolio module)
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/theme-styles.css';
    link.id = 'portfolio-editor-theme-styles';
    document.head.appendChild(link);

    return () => {
      // Remove theme CSS when component unmounts
      const themeLink = document.getElementById('portfolio-editor-theme-styles');
      if (themeLink) {
        themeLink.remove();
      }
    };
  }, []);
  
  const [elements, setElements] = useState<PortfolioElement[]>([
    {
      id: 'hero',
      type: 'hero',
      title: 'Hero Section',
      x: 50,
      y: 50,
      width: 800,
      height: 400,
      zIndex: 1,
      isSelected: false,
      isLocked: false
    },
    {
      id: 'about',
      type: 'about',
      title: 'About Section',
      x: 50,
      y: 500,
      width: 600,
      height: 300,
      zIndex: 2,
      isSelected: false,
      isLocked: false
    },
    {
      id: 'gallery',
      type: 'gallery',
      title: 'Gallery Section',
      x: 700,
      y: 500,
      width: 500,
      height: 400,
      zIndex: 3,
      isSelected: false,
      isLocked: false
    },
    {
      id: 'services',
      type: 'services',
      title: 'Services Section',
      x: 50,
      y: 850,
      width: 700,
      height: 300,
      zIndex: 4,
      isSelected: false,
      isLocked: false
    },
    {
      id: 'testimonials',
      type: 'testimonials',
      title: 'Testimonials Section',
      x: 800,
      y: 850,
      width: 400,
      height: 300,
      zIndex: 5,
      isSelected: false,
      isLocked: false
    },
    {
      id: 'contact',
      type: 'contact',
      title: 'Contact Section',
      x: 50,
      y: 1200,
      width: 1150,
      height: 200,
      zIndex: 6,
      isSelected: false,
      isLocked: false
    }
  ]);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize] = useState(20);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle element selection
  const handleElementSelect = (elementId: string) => {
    setElements(prev => prev.map(el => ({
      ...el,
      isSelected: el.id === elementId
    })));
    setSelectedElement(elementId);
  };

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent, elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (!element || element.isLocked) return;

    setIsDragging(true);
    setSelectedElement(elementId);
    handleElementSelect(elementId);

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left - element.x * zoom,
        y: e.clientY - rect.top - element.y * zoom
      });
    }
  };

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !selectedElement || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const newX = (e.clientX - rect.left - dragOffset.x) / zoom;
    const newY = (e.clientY - rect.top - dragOffset.y) / zoom;

    // Snap to grid if enabled
    const snappedX = snapToGrid ? Math.round(newX / gridSize) * gridSize : newX;
    const snappedY = snapToGrid ? Math.round(newY / gridSize) * gridSize : newY;

    setElements(prev => prev.map(el => 
      el.id === selectedElement 
        ? { ...el, x: Math.max(0, snappedX), y: Math.max(0, snappedY) }
        : el
    ));
  }, [isDragging, selectedElement, dragOffset, zoom, snapToGrid, gridSize]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, elementId: string, handle: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setSelectedElement(elementId);
    handleElementSelect(elementId);
  };

  // Handle resize
  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing || !selectedElement || !resizeHandle) return;

    const element = elements.find(el => el.id === selectedElement);
    if (!element) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = (e.clientX - rect.left) / zoom;
    const mouseY = (e.clientY - rect.top) / zoom;

    let newWidth = element.width;
    let newHeight = element.height;
    let newX = element.x;
    let newY = element.y;

    switch (resizeHandle) {
      case 'se': // Southeast
        newWidth = Math.max(100, mouseX - element.x);
        newHeight = Math.max(100, mouseY - element.y);
        break;
      case 'sw': // Southwest
        newWidth = Math.max(100, element.x + element.width - mouseX);
        newHeight = Math.max(100, mouseY - element.y);
        newX = mouseX;
        break;
      case 'ne': // Northeast
        newWidth = Math.max(100, mouseX - element.x);
        newHeight = Math.max(100, element.y + element.height - mouseY);
        newY = mouseY;
        break;
      case 'nw': // Northwest
        newWidth = Math.max(100, element.x + element.width - mouseX);
        newHeight = Math.max(100, element.y + element.height - mouseY);
        newX = mouseX;
        newY = mouseY;
        break;
    }

    setElements(prev => prev.map(el => 
      el.id === selectedElement 
        ? { ...el, x: newX, y: newY, width: newWidth, height: newHeight }
        : el
    ));
  }, [isResizing, selectedElement, resizeHandle, elements, zoom]);

  // Add event listeners
  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', isDragging ? handleMouseMove : handleResize);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', isDragging ? handleMouseMove : handleResize);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleResize, handleMouseUp]);

  // Toggle element lock
  const toggleElementLock = (elementId: string) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, isLocked: !el.isLocked } : el
    ));
  };

  // Delete element
  const deleteElement = (elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    if (selectedElement === elementId) {
      setSelectedElement(null);
    }
  };

  // Reset layout
  const resetLayout = () => {
    setElements([
      {
        id: 'hero',
        type: 'hero',
        title: 'Hero Section',
        x: 50,
        y: 50,
        width: 800,
        height: 400,
        zIndex: 1,
        isSelected: false,
        isLocked: false
      },
      {
        id: 'about',
        type: 'about',
        title: 'About Section',
        x: 50,
        y: 500,
        width: 600,
        height: 300,
        zIndex: 2,
        isSelected: false,
        isLocked: false
      },
      {
        id: 'gallery',
        type: 'gallery',
        title: 'Gallery Section',
        x: 700,
        y: 500,
        width: 500,
        height: 400,
        zIndex: 3,
        isSelected: false,
        isLocked: false
      },
      {
        id: 'services',
        type: 'services',
        title: 'Services Section',
        x: 50,
        y: 850,
        width: 700,
        height: 300,
        zIndex: 4,
        isSelected: false,
        isLocked: false
      },
      {
        id: 'testimonials',
        type: 'testimonials',
        title: 'Testimonials Section',
        x: 800,
        y: 850,
        width: 400,
        height: 300,
        zIndex: 5,
        isSelected: false,
        isLocked: false
      },
      {
        id: 'contact',
        type: 'contact',
        title: 'Contact Section',
        x: 50,
        y: 1200,
        width: 1150,
        height: 200,
        zIndex: 6,
        isSelected: false,
        isLocked: false
      }
    ]);
    setSelectedElement(null);
  };

  // Save layout
  const saveLayout = () => {
    // Here you would save the layout to your portfolio data
    toast({
      title: "Layout saved",
      description: "Your portfolio layout has been saved successfully"
    });
  };

  return (
    <div className="page-wrapper portfolio-theme-wrapper">
      <div className="body-wrapper">
        <div className="body-wrapper-inner" style={{ paddingTop: 0 }}>
          <div className="container-fluid" style={{ paddingTop: 0 }}>
            <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/portfolio')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Portfolio
            </Button>
            <h1 className="text-2xl font-bold">Portfolio Layout Editor</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" onClick={resetLayout}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Layout
            </Button>
            <Button onClick={saveLayout}>
              <Save className="h-4 w-4 mr-2" />
              Save Layout
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Button
              variant={showGrid ? "default" : "outline"}
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={snapToGrid ? "default" : "outline"}
              size="sm"
              onClick={() => setSnapToGrid(!snapToGrid)}
            >
              <Layout className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {selectedElement && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleElementLock(selectedElement)}
              >
                {elements.find(el => el.id === selectedElement)?.isLocked ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteElement(selectedElement)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto p-4">
        <div
          ref={containerRef}
          className="relative bg-white border-2 border-dashed border-gray-300 mx-auto"
          style={{
            width: `${1200 * zoom}px`,
            height: `${1500 * zoom}px`,
            backgroundImage: showGrid 
              ? `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`
              : 'none',
            backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`
          }}
        >
          {/* Elements */}
          {elements.map((element) => (
            <div
              key={element.id}
              className={`absolute border-2 cursor-move transition-all ${
                element.isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 bg-white hover:border-gray-400'
              } ${element.isLocked ? 'opacity-60' : ''}`}
              style={{
                left: `${element.x * zoom}px`,
                top: `${element.y * zoom}px`,
                width: `${element.width * zoom}px`,
                height: `${element.height * zoom}px`,
                zIndex: element.zIndex
              }}
              onMouseDown={(e) => handleDragStart(e, element.id)}
            >
              {/* Element Header */}
              <div className="bg-gray-100 px-2 py-1 text-xs font-medium border-b flex items-center justify-between">
                <span>{element.title}</span>
                <div className="flex items-center gap-1">
                  {element.isLocked && <Lock className="h-3 w-3" />}
                  <Badge variant="secondary" className="text-xs">
                    {element.type}
                  </Badge>
                </div>
              </div>

              {/* Element Content */}
              <div className="p-2 text-xs text-gray-600">
                {element.type === 'hero' && (
                  <div className="text-center">
                    <div className="text-lg font-bold mb-2">Hero Section</div>
                    <div className="text-sm">Background image with title and subtitle</div>
                  </div>
                )}
                {element.type === 'about' && (
                  <div>
                    <div className="font-medium mb-1">About Section</div>
                    <div className="text-xs">Photographer information and bio</div>
                  </div>
                )}
                {element.type === 'gallery' && (
                  <div>
                    <div className="font-medium mb-1">Gallery Section</div>
                    <div className="text-xs">Image gallery with {portfolioData.gallery.length} photos</div>
                  </div>
                )}
                {element.type === 'services' && (
                  <div>
                    <div className="font-medium mb-1">Services Section</div>
                    <div className="text-xs">Wedding packages and pricing</div>
                  </div>
                )}
                {element.type === 'testimonials' && (
                  <div>
                    <div className="font-medium mb-1">Testimonials Section</div>
                    <div className="text-xs">Client reviews and ratings</div>
                  </div>
                )}
                {element.type === 'contact' && (
                  <div>
                    <div className="font-medium mb-1">Contact Section</div>
                    <div className="text-xs">Contact information and form</div>
                  </div>
                )}
              </div>

              {/* Resize Handles */}
              {element.isSelected && !element.isLocked && (
                <>
                  <div
                    className="absolute w-3 h-3 bg-blue-500 border border-white cursor-se-resize"
                    style={{
                      right: '-6px',
                      bottom: '-6px'
                    }}
                    onMouseDown={(e) => handleResizeStart(e, element.id, 'se')}
                  />
                  <div
                    className="absolute w-3 h-3 bg-blue-500 border border-white cursor-sw-resize"
                    style={{
                      left: '-6px',
                      bottom: '-6px'
                    }}
                    onMouseDown={(e) => handleResizeStart(e, element.id, 'sw')}
                  />
                  <div
                    className="absolute w-3 h-3 bg-blue-500 border border-white cursor-ne-resize"
                    style={{
                      right: '-6px',
                      top: '-6px'
                    }}
                    onMouseDown={(e) => handleResizeStart(e, element.id, 'ne')}
                  />
                  <div
                    className="absolute w-3 h-3 bg-blue-500 border border-white cursor-nw-resize"
                    style={{
                      left: '-6px',
                      top: '-6px'
                    }}
                    onMouseDown={(e) => handleResizeStart(e, element.id, 'nw')}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
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
              
              <div className="text-center py-12">
                <div className="text-lg text-gray-600 mb-4">
                  Portfolio preview will show the final layout with your content
                </div>
                <Button onClick={() => setShowPreview(false)}>
                  Close Preview
                </Button>
              </div>
            </div>
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

import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Layout, Save } from 'lucide-react';
import DashboardWidget from './DashboardWidget';
import toast from 'react-hot-toast';

interface Widget {
  id: string;
  type: string;
  title: string;
  component: React.ComponentType<any>;
  props?: any;
  size: 'small' | 'medium' | 'large';
}

interface CustomizableDashboardProps {
  initialWidgets?: Widget[];
  onSave?: (widgets: Widget[]) => void;
}

const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({
  initialWidgets = [],
  onSave
}) => {
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setWidgets(items);
    toast.success('Widget moved successfully!', {
      style: {
        background: '#ffffff',
        color: '#2a4152',
        fontFamily: 'Figtree, sans-serif'
      }
    });
  }, [widgets]);

  const removeWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    toast.success('Widget removed', {
      style: {
        background: '#ffffff',
        color: '#2a4152',
        fontFamily: 'Figtree, sans-serif'
      }
    });
  }, []);

  const addWidget = useCallback((widgetType: string) => {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: widgetType,
      title: getWidgetTitle(widgetType),
      component: getWidgetComponent(widgetType),
      size: 'medium'
    };
    
    setWidgets(prev => [...prev, newWidget]);
    setShowWidgetPicker(false);
    toast.success('Widget added!', {
      style: {
        background: '#ffffff',
        color: '#2a4152',
        fontFamily: 'Figtree, sans-serif'
      }
    });
  }, []);

  const saveLayout = useCallback(() => {
    if (onSave) {
      onSave(widgets);
    }
    setIsEditMode(false);
    toast.success('Dashboard layout saved!', {
      style: {
        background: '#ffffff',
        color: '#2a4152',
        fontFamily: 'Figtree, sans-serif'
      }
    });
  }, [widgets, onSave]);

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1';
      case 'large': return 'col-span-2';
      default: return 'col-span-1';
    }
  };

  return (
    <div className="p-6" style={{ backgroundColor: '#eee9dd' }}>
      {/* Dashboard Controls */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold font-figtree" style={{ color: '#2a4152' }}>
          My Dashboard
        </h2>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium font-figtree transition-all duration-200 ${
              isEditMode 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>{isEditMode ? 'Exit Edit' : 'Customize'}</span>
          </button>
          
          {isEditMode && (
            <>
              <button
                onClick={() => setShowWidgetPicker(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 border border-green-200 rounded-lg font-medium font-figtree hover:bg-green-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Widget</span>
              </button>
              
              <button
                onClick={saveLayout}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium font-figtree hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Layout</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Drag & Drop Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard" direction="horizontal">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px] transition-all duration-200 ${
                snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-4' : ''
              }`}
            >
              <AnimatePresence>
                {widgets.map((widget, index) => (
                  <Draggable
                    key={widget.id}
                    draggableId={widget.id}
                    index={index}
                    isDragDisabled={!isEditMode}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={getSizeClasses(widget.size)}
                      >
                        <DashboardWidget
                          id={widget.id}
                          title={widget.title}
                          onRemove={isEditMode ? removeWidget : undefined}
                          isDragging={snapshot.isDragging}
                        >
                          <widget.component {...widget.props} />
                        </DashboardWidget>
                      </div>
                    )}
                  </Draggable>
                ))}
              </AnimatePresence>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Widget Picker Modal */}
      <AnimatePresence>
        {showWidgetPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowWidgetPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold font-figtree mb-4" style={{ color: '#2a4152' }}>
                Add Widget
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {getAvailableWidgets().map(widget => (
                  <button
                    key={widget.type}
                    onClick={() => addWidget(widget.type)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="font-medium font-figtree" style={{ color: '#2a4152' }}>
                      {widget.title}
                    </div>
                    <div className="text-sm text-gray-500 font-figtree">
                      {widget.description}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper functions
function getWidgetTitle(type: string): string {
  const titles: Record<string, string> = {
    'trending': 'Trending Content',
    'analytics': 'Analytics Overview',
    'schedule': 'Content Schedule',
    'sentiment': 'Sentiment Analysis',
    'reach': 'Global Reach'
  };
  return titles[type] || 'Widget';
}

function getWidgetComponent(type: string): React.ComponentType<any> {
  // Return appropriate component based on type
  // This would import your existing components
  const components: Record<string, React.ComponentType<any>> = {
    'trending': () => <div className="text-center py-8 font-figtree" style={{ color: '#2a4152' }}>Trending Content Widget</div>,
    'analytics': () => <div className="text-center py-8 font-figtree" style={{ color: '#2a4152' }}>Analytics Widget</div>,
    'schedule': () => <div className="text-center py-8 font-figtree" style={{ color: '#2a4152' }}>Schedule Widget</div>,
    'sentiment': () => <div className="text-center py-8 font-figtree" style={{ color: '#2a4152' }}>Sentiment Widget</div>,
    'reach': () => <div className="text-center py-8 font-figtree" style={{ color: '#2a4152' }}>Global Reach Widget</div>
  };
  return components[type] || (() => <div>Unknown Widget</div>);
}

function getAvailableWidgets() {
  return [
    { type: 'trending', title: 'Trending', description: 'Latest trending content' },
    { type: 'analytics', title: 'Analytics', description: 'Performance metrics' },
    { type: 'schedule', title: 'Schedule', description: 'Content calendar' },
    { type: 'sentiment', title: 'Sentiment', description: 'Audience sentiment' },
    { type: 'reach', title: 'Global Reach', description: 'Geographic data' }
  ];
}

export default CustomizableDashboard;
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, Grid, BarChart3, TrendingUp, Users, Eye, Heart, MessageCircle, Share2, Settings, Move, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Widget {
  id: string;
  type: 'metric' | 'chart' | 'list' | 'trend';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  data: any;
  config: {
    showTitle: boolean;
    color: string;
    refreshInterval: number;
  };
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: Widget[];
  layout: 'grid' | 'freeform';
  createdAt: string;
  updatedAt: string;
}

const CustomDashboards: React.FC = () => {
  const { t } = useLanguage();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [activeDashboard, setActiveDashboard] = useState<Dashboard | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<Widget | null>(null);

  // Remove mock data for widgets - use real metrics
  const [realMetrics, setRealMetrics] = useState({
    totalViews: { value: '0', change: '0%', trend: 'neutral' },
    engagement: { value: '0%', change: '0%', trend: 'neutral' },
    followers: { value: '0', change: '0%', trend: 'neutral' },
    shares: { value: '0', change: '0%', trend: 'neutral' }
  });

  // Remove sample dashboards initialization
  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        // Fetch real dashboards and metrics
        const [dashboardsData, metricsData] = await Promise.all([
          dashboardService.getDashboards(),
          metricsService.getMetrics()
        ]);
        
        setDashboards(dashboardsData || []);
        setRealMetrics(metricsData || {
          totalViews: { value: '0', change: '0%', trend: 'neutral' },
          engagement: { value: '0%', change: '0%', trend: 'neutral' },
          followers: { value: '0', change: '0%', trend: 'neutral' },
          shares: { value: '0', change: '0%', trend: 'neutral' }
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setDashboards([]);
      }
    };

    fetchDashboards();
  }, []);

  // Update widget templates to use real metrics
  const widgetTemplates = [
    {
      type: 'metric',
      title: 'Total Views',
      icon: Eye,
      size: 'small',
      data: realMetrics.totalViews,
    },
    {
      type: 'metric',
      title: 'Engagement Rate',
      icon: Heart,
      size: 'small',
      data: realMetrics.engagement,
    },
    {
      type: 'metric',
      title: 'Followers',
      icon: Users,
      size: 'small',
      data: realMetrics.followers,
    },
    {
      type: 'chart',
      title: 'Performance Chart',
      icon: BarChart3,
      size: 'large',
      data: { chartType: 'line', period: '7d' }
    },
    {
      type: 'trend',
      title: 'Trending Content',
      icon: TrendingUp,
      size: 'medium',
      data: { limit: 5, platform: 'all' }
    },
    {
      type: 'list',
      title: 'Top Performers',
      icon: Share2,
      size: 'medium',
      data: { metric: 'engagement', limit: 10 }
    }
  ];

  // Initialize with sample dashboards
  useEffect(() => {
    const sampleDashboards: Dashboard[] = [
      {
        id: '1',
        name: 'Overview Dashboard',
        description: 'Main metrics and performance overview',
        layout: 'grid',
        widgets: [
          {
            id: 'w1',
            type: 'metric',
            title: 'Total Views',
            size: 'small',
            position: { x: 0, y: 0 },
            data: mockMetrics.totalViews,
            config: { showTitle: true, color: 'blue', refreshInterval: 30 }
          },
          {
            id: 'w2',
            type: 'metric',
            title: 'Engagement Rate',
            size: 'small',
            position: { x: 1, y: 0 },
            data: mockMetrics.engagement,
            config: { showTitle: true, color: 'green', refreshInterval: 30 }
          },
          {
            id: 'w3',
            type: 'chart',
            title: 'Performance Trends',
            size: 'large',
            position: { x: 0, y: 1 },
            data: { chartType: 'line', period: '7d' },
            config: { showTitle: true, color: 'purple', refreshInterval: 60 }
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Stefna Analytics',
        description: 'Platform-specific performance metrics',
        layout: 'grid',
        widgets: [
          {
            id: 'w4',
            type: 'metric',
            title: 'Followers',
            size: 'small',
            position: { x: 0, y: 0 },
            data: mockMetrics.followers,
            config: { showTitle: true, color: 'pink', refreshInterval: 30 }
          },
          {
            id: 'w5',
            type: 'trend',
            title: 'Trending Content',
            size: 'medium',
            position: { x: 1, y: 0 },
            data: { limit: 5, platform: 'all' },
            config: { showTitle: true, color: 'orange', refreshInterval: 15 }
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    setDashboards(sampleDashboards);
    setActiveDashboard(sampleDashboards[0]);
  }, []);

  const createNewDashboard = () => {
    const newDashboard: Dashboard = {
      id: Date.now().toString(),
      name: 'New Dashboard',
      description: 'Custom dashboard description',
      layout: 'grid',
      widgets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setDashboards(prev => [...prev, newDashboard]);
    setActiveDashboard(newDashboard);
    setIsCreating(false);
    setIsEditing(true);
  };

  const deleteDashboard = (dashboardId: string) => {
    setDashboards(prev => prev.filter(d => d.id !== dashboardId));
    if (activeDashboard?.id === dashboardId) {
      setActiveDashboard(dashboards[0] || null);
    }
  };

  const addWidget = (template: any) => {
    if (!activeDashboard) return;

    const newWidget: Widget = {
      id: Date.now().toString(),
      type: template.type,
      title: template.title,
      size: template.size,
      position: { x: 0, y: 0 },
      data: template.data,
      config: {
        showTitle: true,
        color: 'blue',
        refreshInterval: 30
      }
    };

    const updatedDashboard = {
      ...activeDashboard,
      widgets: [...activeDashboard.widgets, newWidget],
      updatedAt: new Date().toISOString()
    };

    setActiveDashboard(updatedDashboard);
    setDashboards(prev => prev.map(d => d.id === activeDashboard.id ? updatedDashboard : d));
    setShowWidgetLibrary(false);
  };

  const removeWidget = (widgetId: string) => {
    if (!activeDashboard) return;

    const updatedDashboard = {
      ...activeDashboard,
      widgets: activeDashboard.widgets.filter(w => w.id !== widgetId),
      updatedAt: new Date().toISOString()
    };

    setActiveDashboard(updatedDashboard);
    setDashboards(prev => prev.map(d => d.id === activeDashboard.id ? updatedDashboard : d));
  };

  const renderWidget = (widget: Widget) => {
    const sizeClasses = {
      small: 'col-span-1 row-span-1',
      medium: 'col-span-2 row-span-1',
      large: 'col-span-2 row-span-2'
    };

    const colorClasses = {
      blue: 'border-blue-200 bg-blue-50',
      green: 'border-green-200 bg-green-50',
      purple: 'border-purple-200 bg-purple-50',
      pink: 'border-pink-200 bg-pink-50',
      orange: 'border-orange-200 bg-orange-50'
    };

    return (
      <div
        key={widget.id}
        className={`${sizeClasses[widget.size]} ${colorClasses[widget.config.color as keyof typeof colorClasses]} border-2 rounded-xl p-4 relative group hover:shadow-lg transition-all duration-200`}
      >
        {isEditing && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={() => removeWidget(widget.id)}
              className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {widget.config.showTitle && (
          <h3 className="font-semibold text-gray-900 mb-3">{widget.title}</h3>
        )}

        {widget.type === 'metric' && (
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">{widget.data.value}</div>
            <div className={`text-sm font-medium ${
              widget.data.trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {widget.data.change}
            </div>
          </div>
        )}

        {widget.type === 'chart' && (
          <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-gray-400" />
            <span className="ml-2 text-gray-500">Chart Placeholder</span>
          </div>
        )}

        {widget.type === 'trend' && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2 p-2 bg-white rounded">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Trending Item {i}</div>
                  <div className="text-xs text-gray-500">Platform • 1.2M views</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {widget.type === 'list' && (
          <div className="space-y-1">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex justify-between items-center p-1">
                <span className="text-sm">Item {i}</span>
                <span className="text-xs text-gray-500">{Math.floor(Math.random() * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Grid className="w-8 h-8 text-button" />
          <h1 className="text-3xl font-bold text-button font-['Figtree']">
            Custom Dashboards
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {activeDashboard && (
            <>
              <button
                onClick={() => setShowWidgetLibrary(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={!isEditing}
              >
                <Plus className="w-4 h-4" />
                Add Widget
              </button>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isEditing 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                {isEditing ? 'Save' : 'Edit'}
              </button>
            </>
          )}
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-button text-white rounded-lg hover:bg-button/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Dashboard
          </button>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {dashboards.map(dashboard => (
          <div key={dashboard.id} className="flex items-center">
            <button
              onClick={() => setActiveDashboard(dashboard)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeDashboard?.id === dashboard.id
                  ? 'border-button text-button'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{dashboard.name}</span>
            </button>
            {dashboards.length > 1 && (
              <button
                onClick={() => deleteDashboard(dashboard.id)}
                className="p-1 ml-1 hover:bg-red-100 rounded transition-colors"
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Dashboard Content */}
      {activeDashboard ? (
        <div className="space-y-4">
          {/* Dashboard Info */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{activeDashboard.name}</h2>
                <p className="text-gray-600">{activeDashboard.description}</p>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {new Date(activeDashboard.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Widgets Grid */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            {activeDashboard.widgets.length > 0 ? (
              <div className="grid grid-cols-4 gap-4 auto-rows-fr">
                {activeDashboard.widgets.map(renderWidget)}
              </div>
            ) : (
              <div className="text-center py-12">
                <Grid className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No widgets added yet</h3>
                <p className="text-gray-600 mb-4">Start building your dashboard by adding widgets</p>
                <button
                  onClick={() => setShowWidgetLibrary(true)}
                  className="px-6 py-2 bg-button text-white rounded-lg hover:bg-button/90 transition-colors"
                >
                  Add Your First Widget
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Grid className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No dashboards created</h3>
          <p className="text-gray-600 mb-4">Create your first custom dashboard to get started</p>
          <button
            onClick={createNewDashboard}
            className="px-6 py-2 bg-button text-white rounded-lg hover:bg-button/90 transition-colors"
          >
            Create Dashboard
          </button>
        </div>
      )}

      {/* Widget Library Modal */}
      {showWidgetLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Widget Library</h2>
              <button
                onClick={() => setShowWidgetLibrary(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {widgetTemplates.map((template, index) => {
                const Icon = template.icon;
                return (
                  <div
                    key={index}
                    onClick={() => addWidget(template)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-button hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="w-6 h-6 text-button" />
                      <h3 className="font-semibold text-gray-900">{template.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {template.type === 'metric' && 'Display key performance metrics'}
                      {template.type === 'chart' && 'Visualize data with interactive charts'}
                      {template.type === 'trend' && 'Show trending content and topics'}
                      {template.type === 'list' && 'List top performing content'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">
                        {template.size}
                      </span>
                      <span className="text-xs text-button font-medium">+ Add</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Create Dashboard Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Dashboard</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dashboard Name</label>
                <input
                  type="text"
                  placeholder="Enter dashboard name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe your dashboard"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsCreating(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createNewDashboard}
                className="flex-1 px-4 py-2 bg-button text-white rounded-lg hover:bg-button/90 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDashboards;
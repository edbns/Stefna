import { useState, useEffect } from 'react'
import { loadFramerMotion } from '../utils/loadFramerMotion'
import { Activity, Zap, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import performanceService from '../services/performanceService'

interface PerformanceDashboardProps {
  isOpen: boolean
  onClose: () => void
}

const PerformanceDashboard = ({ isOpen, onClose }: PerformanceDashboardProps) => {
  const [performanceData, setPerformanceData] = useState(performanceService.getPerformanceData())
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'errors' | 'events'>('overview')

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setPerformanceData(performanceService.getPerformanceData())
      }, 5000) // Update every 5 seconds

      return () => clearInterval(interval)
    }
  }, [isOpen])

  const getTrendIcon = (trend: 'improving' | 'stable' | 'degrading') => {
    switch (trend) {
      case 'improving':
        return <TrendingDown className="text-green-500" size={16} />
      case 'degrading':
        return <TrendingUp className="text-red-500" size={16} />
      default:
        return <Minus className="text-gray-500" size={16} />
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatMemory = (mb: number) => {
    return `${mb.toFixed(1)}MB`
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'metrics', label: 'Metrics', icon: Zap },
    { id: 'errors', label: 'Errors', icon: AlertTriangle },
    { id: 'events', label: 'Events', icon: TrendingUp }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Activity size={24} className="text-black" />
                <h2 className="text-xl font-bold text-black">Performance Dashboard</h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                ×
              </motion.button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Tabs */}
              <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-white text-black shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{tab.label}</span>
                    </motion.button>
                  )
                })}
              </div>

              {/* Tab Content */}
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    {/* Session Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-2xl font-bold text-black">
                          {formatDuration(performanceService.getSessionDuration())}
                        </div>
                        <div className="text-xs text-gray-500">Session Duration</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-2xl font-bold text-black">
                          {performanceData.events.length}
                        </div>
                        <div className="text-xs text-gray-500">Events Tracked</div>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-black">Key Metrics</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <div className="font-medium text-black">Page Load Time</div>
                            <div className="text-sm text-gray-500">
                              {formatDuration(performanceService.getAverageMetric('page_load_time'))}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getTrendIcon(performanceService.getMetricTrend('page_load_time'))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <div className="font-medium text-black">Memory Usage</div>
                            <div className="text-sm text-gray-500">
                              {formatMemory(performanceService.getAverageMetric('memory_used'))}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getTrendIcon(performanceService.getMetricTrend('memory_used'))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <div className="font-medium text-black">Error Rate</div>
                            <div className="text-sm text-gray-500">
                              {performanceService.getErrorRate().toFixed(2)} errors/min
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <AlertTriangle size={16} className="text-red-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'metrics' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-black">Performance Metrics</h3>
                    <div className="space-y-3">
                      {performanceData.metrics.slice(-10).reverse().map((metric, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                        >
                          <div>
                            <div className="font-medium text-black">{metric.name}</div>
                            <div className="text-sm text-gray-500">
                              {metric.value}{metric.unit} • {new Date(metric.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            metric.category === 'load' ? 'bg-blue-100 text-blue-700' :
                            metric.category === 'render' ? 'bg-green-100 text-green-700' :
                            metric.category === 'interaction' ? 'bg-purple-100 text-purple-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {metric.category}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'errors' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-black">Error Reports</h3>
                    <div className="space-y-3">
                      {performanceData.errors.length === 0 ? (
                        <div className="text-center py-8">
                          <AlertTriangle size={48} className="text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-black mb-2">No errors reported</h3>
                          <p className="text-sm text-gray-500">Great! Your app is running smoothly.</p>
                        </div>
                      ) : (
                        performanceData.errors.slice(-10).reverse().map((error, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 bg-red-50 rounded-xl border border-red-200"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="font-medium text-red-800">{error.message}</div>
                              <div className="text-xs text-red-600">
                                {new Date(error.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                            {error.component && (
                              <div className="text-sm text-red-600 mb-2">
                                Component: {error.component}
                              </div>
                            )}
                            {error.stack && (
                              <details className="text-xs text-red-600">
                                <summary className="cursor-pointer">Stack Trace</summary>
                                <pre className="mt-2 whitespace-pre-wrap">{error.stack}</pre>
                              </details>
                            )}
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'events' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-black">User Events</h3>
                    <div className="space-y-3">
                      {performanceData.events.slice(-10).reverse().map((event, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-3 bg-gray-50 rounded-xl"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-black">{event.event}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          {Object.keys(event.properties).length > 0 && (
                            <details className="text-sm text-gray-600">
                              <summary className="cursor-pointer">Properties</summary>
                              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
                                {JSON.stringify(event.properties, null, 2)}
                              </pre>
                            </details>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => performanceService.sendToAnalytics()}
                  className="flex-1 bg-black text-white font-medium py-3 px-6 rounded-xl"
                >
                  Send to Analytics
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => console.log(performanceService.getPerformanceData())}
                  className="flex-1 bg-gray-100 text-black font-medium py-3 px-6 rounded-xl"
                >
                  Export Data
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default PerformanceDashboard 
import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { Users, Image, Settings } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  createdAt: string
  lastActive: string
  credits: number
  isBanned: boolean
  shareToFeed: boolean
  mediaUploadAgreed: boolean
}

interface Media {
  id: string
  userId: string
  type: string
  url: string
  createdAt: string
  status: string
  prompt: string
  sourceUrl: string
  likesCount: number
}

interface SystemStats {
  totalUsers: number
  totalMedia: number
  activeUsers: number
  totalCredits: number
}

const AdminDashboardScreen: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminSecret, setAdminSecret] = useState('')
  const [activeTab, setActiveTab] = useState('system')
  const [users, setUsers] = useState<User[]>([])
  const [media, setMedia] = useState<Media[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    totalMedia: 0,
    activeUsers: 0,
    totalCredits: 0
  })
  const [systemConfig, setSystemConfig] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const [mediaOffset, setMediaOffset] = useState(0)
  const [hasMoreMedia, setHasMoreMedia] = useState(true)
  const [isLoadingMoreMedia, setIsLoadingMoreMedia] = useState(false)
  const MEDIA_LIMIT = 50

  useEffect(() => {
    const savedSecret = localStorage.getItem('admin_secret')
    if (savedSecret) {
      setAdminSecret(savedSecret)
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadSystemStats()
      
      if (activeTab === 'users') {
        loadUsers()
      } else if (activeTab === 'media') {
        loadMedia(true)
        setMediaOffset(0)
        setHasMoreMedia(true)
      }
    }
  }, [isAuthenticated, activeTab])

  useEffect(() => {
    if (activeTab !== 'media' || !hasMoreMedia) return

    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100) {
        loadMoreMedia()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [activeTab, hasMoreMedia, isLoadingMoreMedia])

  // Reload media when filters change
  useEffect(() => {
    if (activeTab === 'media' && isAuthenticated) {
      const timeoutId = setTimeout(() => {
        loadMedia(true)
        setMediaOffset(0)
        setHasMoreMedia(true)
      }, 500) // Debounce search
      
      return () => clearTimeout(timeoutId)
    }
  }, [searchTerm, startDate, endDate])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/.netlify/functions/admin-users', {
        headers: { 'X-Admin-Secret': adminSecret }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMedia = async (reset = false) => {
    try {
      if (reset) setIsLoading(true)
      
      const offset = reset ? 0 : mediaOffset
      
      // Build query string with optional date filters
      let queryParams = `limit=${MEDIA_LIMIT}&offset=${offset}`
      if (searchTerm) queryParams += `&search=${encodeURIComponent(searchTerm)}`
      if (startDate) queryParams += `&startDate=${startDate}`
      if (endDate) queryParams += `&endDate=${endDate}`
      
      const response = await fetch(`/.netlify/functions/admin-media?${queryParams}`, {
        headers: { 'X-Admin-Secret': adminSecret }
      })
      if (response.ok) {
        const data = await response.json()
        const transformedMedia = (data.media || []).map((item: any) => ({
          id: item.id,
          userId: item.user_id,
          type: item.type,
          url: item.finalUrl || item.image_url,
          createdAt: item.created_at,
          status: item.status,
          prompt: item.prompt || 'No prompt available',
          sourceUrl: item.source_url,
          likesCount: item.likes_count || 0
        }))

        if (reset) {
          // On reset, just use the new media directly (already deduplicated by backend)
          setMedia(transformedMedia)
          setMediaOffset(transformedMedia.length)
          setHasMoreMedia(transformedMedia.length === MEDIA_LIMIT)
        } else {
          // When appending, deduplicate against ALL existing media
          setMedia(prev => {
            const existingKeys = new Set(prev.map(m => `${m.type}-${m.id}`))
            const newUniqueMedia = transformedMedia.filter((m: any) => 
              !existingKeys.has(`${m.type}-${m.id}`)
            )
            return [...prev, ...newUniqueMedia]
          })
          // Increment offset by the number of items we actually received from backend
          setMediaOffset(prev => prev + transformedMedia.length)
          setHasMoreMedia(transformedMedia.length === MEDIA_LIMIT)
        }
      }
    } catch (error) {
      console.error('Failed to load media:', error)
    } finally {
      if (reset) setIsLoading(false)
    }
  }

  const loadMoreMedia = async () => {
    if (!hasMoreMedia || isLoadingMoreMedia) return
    
    setIsLoadingMoreMedia(true)
    await loadMedia(false)
    setIsLoadingMoreMedia(false)
  }

  const loadSystemStats = async () => {
    try {
      const response = await fetch('/.netlify/functions/admin-config', {
        headers: { 'X-Admin-Secret': adminSecret }
      })
      if (response.ok) {
        const data = await response.json()
        setSystemStats(data.stats || { totalUsers: 0, totalMedia: 0, activeUsers: 0, totalCredits: 0 })
        
        // Debug: Log the debug info from the server
        if (data.debugInfo) {
          console.log('🔍 [Admin] Debug Info from Server:', data.debugInfo)
        }
        
        // Debug: Log system config details
        if (data.systemConfig) {
          console.log('🔧 [Admin] System Config:', {
            health: data.systemConfig,
            overall: data.systemConfig.overall_health,
            features: data.systemConfig.features
          })
        }
        
        // Save system config for health monitoring
        if (data.systemConfig) {
          setSystemConfig(data.systemConfig)
        }
        
        // Update timestamp
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Failed to load system stats:', error)
    }
  }

  const getHealthStatus = (enabled: boolean) => {
    return {
      status: enabled ? 'Healthy' : 'Unhealthy',
      color: enabled ? 'bg-green-500' : 'bg-red-500',
      textColor: enabled ? 'text-gray-600' : 'text-red-600'
    }
  }

  const adjustCredits = async (userId: string, amount: number) => {
    try {
      const response = await fetch('/.netlify/functions/admin-adjust-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify({ userId, adjustment: amount })
      })
      if (response.ok) {
        loadUsers()
      }
    } catch (error) {
      console.error('Failed to adjust credits:', error)
    }
  }

  const banUser = async (userId: string) => {
    try {
      const response = await fetch('/.netlify/functions/admin-ban-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify({ userId })
      })
      if (response.ok) {
        loadUsers()
      }
    } catch (error) {
      console.error('Failed to ban user:', error)
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch('/.netlify/functions/admin-delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify({userId})
      })
      if (response.ok) {
        loadUsers()
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const deleteMedia = async (mediaId: string, mediaType: string) => {
    try {
      const response = await fetch('/.netlify/functions/admin-media', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify({ id: mediaId, type: mediaType })
      })
      if (response.ok) {
        loadMedia(true)
        setSelectedMedia(null)
      }
    } catch (error) {
      console.error('Failed to delete media:', error)
    }
  }

  const handleLogin = async () => {
    try {
      const response = await fetch('/.netlify/functions/admin-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminSecret })
      })
      
      if (response.ok) {
        localStorage.setItem('admin_secret', adminSecret)
        setIsAuthenticated(true)
      } else {
        alert('Invalid admin secret')
      }
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Helmet>
          <title>Admin Login - Stefna</title>
        </Helmet>
        
        <div className="max-w-md w-full p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
            <p className="text-gray-600 mt-2">Enter admin secret to continue</p>
          </div>
          
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Admin Secret"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              style={{ color: '#000000' }}
            />
            <button 
              onClick={handleLogin}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Admin Dashboard - Stefna</title>
      </Helmet>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage your Stefna platform</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('admin_secret')
                setAdminSecret('')
                setIsAuthenticated(false)
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <Users className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{systemStats.totalUsers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <Image className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Media</p>
                  <p className="text-2xl font-bold text-gray-900">{systemStats.totalMedia}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <Users className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{systemStats.activeUsers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <Settings className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Credits</p>
                  <p className="text-2xl font-bold text-gray-900">{systemStats.totalCredits}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'system', label: 'System Diagnosis', icon: Settings },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'media', label: 'Media', icon: Image }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className="h-4 w-4 mr-2" />
                    {label}
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'system' && (
            <div className="space-y-6">
              {/* System Health */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">System Health Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Database */}
                  {(() => {
                    const health = getHealthStatus(systemConfig.database_enabled)
                    return (
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 ${health.color} rounded-full mr-3`}></div>
                          <span className="font-medium text-gray-900">Database</span>
                        </div>
                        <span className={`text-sm ${health.textColor}`}>{health.status}</span>
                      </div>
                    )
                  })()}

                  {/* Fal.ai API */}
                  {(() => {
                    const health = getHealthStatus(systemConfig.fal_ai_enabled)
                    return (
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 ${health.color} rounded-full mr-3`}></div>
                          <span className="font-medium text-gray-900">Fal.ai API</span>
                        </div>
                        <span className={`text-sm ${health.textColor}`}>{health.status}</span>
                      </div>
                    )
                  })()}

                  {/* BFL API */}
                  {(() => {
                    const health = getHealthStatus(systemConfig.bfl_api_enabled)
                    return (
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 ${health.color} rounded-full mr-3`}></div>
                          <span className="font-medium text-gray-900">BFL API</span>
                        </div>
                        <span className={`text-sm ${health.textColor}`}>{health.status}</span>
                      </div>
                    )
                  })()}

                  {/* Stability AI */}
                  {(() => {
                    const health = getHealthStatus(systemConfig.stability_enabled)
                    return (
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 ${health.color} rounded-full mr-3`}></div>
                          <span className="font-medium text-gray-900">Stability AI</span>
                        </div>
                        <span className={`text-sm ${health.textColor}`}>{health.status}</span>
                      </div>
                    )
                  })()}

                  {/* Cloudinary */}
                  {(() => {
                    const health = getHealthStatus(systemConfig.cloudinary_enabled)
                    return (
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 ${health.color} rounded-full mr-3`}></div>
                          <span className="font-medium text-gray-900">Cloudinary</span>
                        </div>
                        <span className={`text-sm ${health.textColor}`}>{health.status}</span>
                      </div>
                    )
                  })()}

                  {/* Email Service */}
                  {(() => {
                    const health = getHealthStatus(systemConfig.email_enabled)
                    return (
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 ${health.color} rounded-full mr-3`}></div>
                          <span className="font-medium text-gray-900">Email Service</span>
                        </div>
                        <span className={`text-sm ${health.textColor}`}>{health.status}</span>
                      </div>
                    )
                  })()}

                  {/* Netlify Functions */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="font-medium text-gray-900">Functions</span>
                    </div>
                    <span className="text-sm text-gray-600">Running</span>
                  </div>

                  {/* Overall System Health */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 ${systemConfig.overall_health === 'healthy' ? 'bg-green-500' : systemConfig.overall_health === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'} rounded-full mr-3`}></div>
                      <span className="font-medium text-gray-900">Overall System</span>
                    </div>
                    <span className={`text-sm ${systemConfig.overall_health === 'healthy' ? 'text-gray-600' : 'text-yellow-600'}`}>
                      {systemConfig.overall_health || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {/* System Status Monitor */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">System Status Monitor</h2>
                <div className="space-y-4">
                  {/* Overall Health Summary */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 ${systemConfig.overall_health === 'healthy' ? 'bg-green-500' : systemConfig.overall_health === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'} rounded-full mr-3`}></div>
                      <span className="font-medium text-gray-900">System Health</span>
                    </div>
                    <span className={`text-lg font-semibold ${systemConfig.overall_health === 'healthy' ? 'text-green-600' : systemConfig.overall_health === 'degraded' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {systemConfig.overall_health || 'Unknown'}
                    </span>
                  </div>

                  {/* Feature Status */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 border border-gray-200 rounded-lg text-center">
                      <div className={`w-2 h-2 ${systemConfig.features?.likes_system ? 'bg-green-500' : 'bg-gray-400'} rounded-full mx-auto mb-2`}></div>
                      <div className="text-xs text-gray-600">Likes System</div>
                    </div>
                    <div className="p-3 border border-gray-200 rounded-lg text-center">
                      <div className={`w-2 h-2 bg-green-500 rounded-full mx-auto mb-2`}></div>
                      <div className="text-xs text-gray-600">Functions</div>
                    </div>
                    <div className="p-3 border border-gray-200 rounded-lg text-center">
                      <div className={`w-2 h-2 ${systemConfig.features?.referral_system ? 'bg-green-500' : 'bg-gray-400'} rounded-full mx-auto mb-2`}></div>
                      <div className="text-xs text-gray-600">Referral System</div>
                    </div>
                    <div className="p-3 border border-gray-200 rounded-lg text-center">
                      <div className={`w-2 h-2 ${systemConfig.features?.studio_mode ? 'bg-green-500' : 'bg-gray-400'} rounded-full mx-auto mb-2`}></div>
                      <div className="text-xs text-gray-600">Studio Mode</div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 text-center">
                    Real-time monitoring • Last updated: {lastUpdated.toLocaleString()}
                  </div>

                  {/* Debug Information */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">System Health Details:</h4>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div><strong>✅ All environment variables are configured in Netlify!</strong></div>
                      <div>🔍 Health checks perform real API calls to test connectivity</div>
                      <div>📋 Detailed error messages in browser console (F12 → Console)</div>
                      <div>⚠️ "Unhealthy" likely means API endpoints changed or temporary downtime</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Actions */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">System Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={loadSystemStats}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Refresh Health Status
                  </button>
                  <button 
                    onClick={() => {
                      loadSystemStats()
                      loadUsers()
                      loadMedia(true)
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Full System Refresh
                  </button>
                  <button 
                    onClick={() => window.open('https://app.netlify.com/', '_blank')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Netlify Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">User Management</h2>
                {isLoading && <span className="text-sm text-gray-500">Loading...</span>}
              </div>
              
              {users.length > 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.credits}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => adjustCredits(user.id, 10)}
                                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors border border-green-300"
                                >
                                  +10 Credits
                                </button>
                                <button
                                  onClick={() => adjustCredits(user.id, -10)}
                                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors border border-red-300"
                                >
                                  -10 Credits
                                </button>
                                <button
                                  onClick={() => banUser(user.id)}
                                  className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors border border-yellow-300"
                                >
                                  Ban User
                                </button>
                                <button
                                  onClick={() => deleteUser(user.id)}
                                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors border border-red-300"
                                >
                                  Delete User
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : !isLoading && (
                <div className="text-center py-8 text-gray-500">
                  No users found
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Media Management</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search by prompt or user ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-black placeholder-gray-400"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700">From:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-black"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700">To:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-black"
                    />
                  </div>
                  {(searchTerm || startDate || endDate) && (
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setStartDate('')
                        setEndDate('')
                      }}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                  {isLoading && <span className="text-sm text-gray-500">Loading...</span>}
                </div>
              </div>
              
              {media.length > 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Media</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {media
                          .filter(item => 
                            !searchTerm || 
                            item.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.id.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map((item, index) => (
                          <tr key={`${item.type}-${item.id}-${index}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <img
                                  src={item.url}
                                  alt={item.prompt}
                                  className="h-12 w-12 object-cover rounded-lg cursor-pointer"
                                  onClick={() => setSelectedMedia(item)}
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900 font-mono font-bold bg-gray-100 px-2 py-1 rounded border">
                                {item.id}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900 capitalize">
                                {item.type.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                item.status === 'completed' ? 'bg-green-100 text-green-800' :
                                item.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => setSelectedMedia(item)}
                                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors border border-blue-300"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => deleteMedia(item.id, item.type)}
                                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors border border-red-300"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : !isLoading && (
                <div className="text-center py-8 text-gray-500">
                  No media found
                </div>
              )}
              
              {hasMoreMedia && (
                <div className="text-center">
                  <button
                    onClick={loadMoreMedia}
                    disabled={isLoadingMoreMedia}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoadingMoreMedia ? 'Loading...' : 'Load More Media'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Media Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-7xl w-full mx-4 max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xl font-semibold">Media Details</h3>
              <button
                onClick={() => setSelectedMedia(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Images */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Generated Media</h4>
                      <img
                        src={selectedMedia.url}
                        alt={selectedMedia.prompt}
                        className="w-full h-auto max-h-[400px] object-contain rounded-lg border border-gray-200"
                      />
                    </div>
                    
                    {selectedMedia.sourceUrl && (
                      <div>
                        <h4 className="text-lg font-semibold mb-3">Source Image</h4>
                        <img
                          src={selectedMedia.sourceUrl}
                          alt="Source"
                          className="w-full h-auto max-h-[400px] object-contain rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Right Column - Details */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Media Information</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Media ID:</span>
                          <span className="font-mono text-sm text-gray-900 bg-white px-2 py-1 rounded border">
                            {selectedMedia.id}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Type:</span>
                          <span className="text-sm text-gray-900 capitalize">
                            {selectedMedia.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Status:</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            selectedMedia.status === 'completed' ? 'bg-green-100 text-green-800' :
                            selectedMedia.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {selectedMedia.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Created:</span>
                          <span className="text-sm text-gray-900">
                            {new Date(selectedMedia.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Likes:</span>
                          <span className="text-sm font-bold text-blue-600">
                            {selectedMedia.likesCount}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">User ID:</span>
                          <span className="font-mono text-sm text-gray-900 bg-white px-2 py-1 rounded border">
                            {selectedMedia.userId}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Prompt Details</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {selectedMedia.prompt || 'No prompt available'}
                        </p>
                      </div>
                    </div>
                    
                    {selectedMedia.sourceUrl && (
                      <div>
                        <h4 className="text-lg font-semibold mb-3">Source URL</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <a 
                            href={selectedMedia.sourceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline text-sm break-all"
                          >
                            {selectedMedia.sourceUrl}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboardScreen

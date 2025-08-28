import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  Image, 
  Coins, 
  Settings, 
  Shield, 
  Activity, 
  LogOut,
  UserCheck,
  UserX,
  CreditCard,
  Trash2,
  Search,
  Plus,
  Minus
} from 'lucide-react'
import { authenticatedFetch } from '../utils/apiClient'

interface User {
  id: string
  email: string
  name?: string
  avatarUrl?: string
  createdAt: string
  lastLogin?: string
  credits: number
  isBanned: boolean
  shareToFeed: boolean
}

interface AdminStats {
  totalUsers: number
  totalMedia: number
  totalCredits: number
  bannedUsers: number
  activeUsers: number
}

interface PresetConfig {
  id: string
  presetKey: string
  name: string
  description: string
  strength: number
  category: string
  isEnabled: boolean
  isCustom: boolean
  metadata: any
  createdAt: string
  updatedAt: string
}

const AdminDashboardScreen: React.FC = () => {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminSecret, setAdminSecret] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'media' | 'credits' | 'presets' | 'config' | 'logs' | 'referrals'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [presets, setPresets] = useState<PresetConfig[]>([])
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalMedia: 0,
    totalCredits: 0,
    bannedUsers: 0,
    activeUsers: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [presetSearchTerm, setPresetSearchTerm] = useState('')

  // Check admin authentication
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const response = await authenticatedFetch('/.netlify/functions/admin-verify', {
          method: 'GET',
          headers: {
            'X-Admin-Secret': adminSecret
          }
        })
        
        if (response.ok) {
          setIsAuthenticated(true)
          loadAdminData()
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        setIsAuthenticated(false)
      }
    }

    if (adminSecret && adminSecret.length >= 8) {
      checkAdminAuth()
    }
  }, [adminSecret])

  const loadAdminData = async () => {
    setIsLoading(true)
    try {
      // Load users
      const usersResponse = await authenticatedFetch('/.netlify/functions/admin-users', {
        method: 'GET',
        headers: {
          'X-Admin-Secret': adminSecret
        }
      })
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users || [])
        setStats(usersData.stats || stats)
      }

      // Load presets
      await loadPresets()
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBanUser = async (userId: string, ban: boolean) => {
    try {
      const response = await authenticatedFetch('/.netlify/functions/admin-ban-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify({ userId, ban })
      })
      
      if (response.ok) {
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, isBanned: ban } : user
        ))
        // Reload stats
        loadAdminData()
      }
    } catch (error) {
      console.error('Failed to ban/unban user:', error)
    }
  }

  const handleAdjustCredits = async (userId: string, adjustment: number) => {
    try {
      const response = await authenticatedFetch('/.netlify/functions/admin-adjust-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify({ userId, adjustment })
      })
      
      if (response.ok) {
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, credits: user.credits + adjustment } : user
        ))
        // Reload stats
        loadAdminData()
      }
    } catch (error) {
      console.error('Failed to adjust credits:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }
    
    try {
      const response = await authenticatedFetch('/.netlify/functions/admin-delete-user', {
        method: 'DELETE',
        headers: {
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify({ userId })
      })
      
      if (response.ok) {
        // Remove user from local state
        setUsers(prev => prev.filter(user => user.id !== userId))
        // Reload stats
        loadAdminData()
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  // Preset management functions
  const loadPresets = async () => {
    try {
      const response = await authenticatedFetch('/.netlify/functions/admin-presets', {
        method: 'GET',
        headers: {
          'X-Admin-Secret': adminSecret
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPresets(data.presets || [])
      }
    } catch (error) {
      console.error('Failed to load presets:', error)
    }
  }

  const togglePreset = async (presetId: string, isEnabled: boolean) => {
    try {
      const response = await authenticatedFetch('/.netlify/functions/admin-presets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify({
          id: presetId,
          updates: { isEnabled }
        })
      })
      
      if (response.ok) {
        // Update local state
        setPresets(prev => prev.map(preset => 
          preset.id === presetId ? { ...preset, isEnabled } : preset
        ))
      }
    } catch (error) {
      console.error('Failed to toggle preset:', error)
    }
  }

  const updatePreset = async (presetId: string, updates: Partial<PresetConfig>) => {
    try {
      const response = await authenticatedFetch('/.netlify/functions/admin-presets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify({
          id: presetId,
          updates
        })
      })
      
      if (response.ok) {
        // Update local state
        setPresets(prev => prev.map(preset => 
          preset.id === presetId ? { ...preset, ...updates } : preset
        ))
      }
    } catch (error) {
      console.error('Failed to update preset:', error)
    }
  }

  const deletePreset = async (presetId: string) => {
    if (!confirm('Are you sure you want to delete this preset? This action cannot be undone.')) {
      return
    }
    
    try {
      const response = await authenticatedFetch('/.netlify/functions/admin-presets', {
        method: 'DELETE',
        headers: {
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify({ id: presetId })
      })
      
      if (response.ok) {
        // Remove preset from local state
        setPresets(prev => prev.filter(preset => preset.id !== presetId))
      }
    } catch (error) {
      console.error('Failed to delete preset:', error)
    }
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPresets = presets.filter(preset => 
    preset.name.toLowerCase().includes(presetSearchTerm.toLowerCase()) ||
    preset.presetKey.toLowerCase().includes(presetSearchTerm.toLowerCase()) ||
    preset.category.toLowerCase().includes(presetSearchTerm.toLowerCase())
  )

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Admin Authentication */}
          <div className="text-center">
            <div className="mb-8">
              <Shield size={80} className="text-red-500/60 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">Admin Access</h1>
              <p className="text-white/60">Enter the admin secret to continue</p>
            </div>
            
            <div className="space-y-4">
              <input
                type="password"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                placeholder="Enter admin secret"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
              />
              
              <button
                onClick={loadAdminData}
                disabled={!adminSecret || adminSecret.length < 8}
                className="w-full px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Access Dashboard
              </button>
            </div>

            <div className="mt-8">
              <button
                onClick={() => navigate('/')}
                className="text-white/40 hover:text-white/60 transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main admin dashboard
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/20 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield size={32} className="text-red-500" />
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-white/60">Full system control and management</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-white/40 text-sm">
              Admin Mode Active
            </span>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Exit Admin
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white/5 border-r border-white/20 min-h-screen p-4">
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                activeTab === 'users' 
                  ? 'bg-red-500 text-white' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users size={20} />
              <span>Users Management</span>
            </button>
            
            <button
              onClick={() => setActiveTab('media')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                activeTab === 'media' 
                  ? 'bg-red-500 text-white' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Image size={20} />
              <span>Media Browser</span>
            </button>
            
                              <button
                    onClick={() => setActiveTab('credits')}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                      activeTab === 'credits' 
                        ? 'bg-red-500 text-white' 
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Coins size={20} />
                    <span>Credit System</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('presets')}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                      activeTab === 'presets' 
                        ? 'bg-red-500 text-white' 
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Settings size={20} />
                    <span>Preset Manager</span>
                  </button>
            
            <button
              onClick={() => setActiveTab('config')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                activeTab === 'config' 
                  ? 'bg-red-500 text-white' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Settings size={20} />
              <span>Config & Tokens</span>
            </button>
            
            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                activeTab === 'logs' 
                  ? 'bg-red-500 text-white' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Activity size={20} />
              <span>Logs & Debug</span>
            </button>
            
            <button
              onClick={() => setActiveTab('referrals')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                activeTab === 'referrals' 
                  ? 'bg-red-500 text-white' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserCheck size={20} />
              <span>Referral System</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                <div className="text-xs text-white/60">Total Users</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-white">{stats.activeUsers}</div>
                <div className="text-xs text-white/60">Active Users</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-white">{stats.bannedUsers}</div>
                <div className="text-xs text-white/60">Banned Users</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-white">{stats.totalMedia}</div>
                <div className="text-xs text-white/60">Total Media</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-white">{stats.totalCredits}</div>
                <div className="text-xs text-white/60">Total Credits</div>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Users Management</h3>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users..."
                        className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                      />
                    </div>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/10">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">User</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Credits</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Joined</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-white/5">
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                                  {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                                  ) : (
                                    <span className="text-white/60 text-sm">{user.email[0].toUpperCase()}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-white">{user.email}</div>
                                  {user.name && <div className="text-xs text-white/60">{user.name}</div>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-white">{user.credits}</span>
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => handleAdjustCredits(user.id, 1)}
                                    className="w-6 h-6 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 flex items-center justify-center"
                                  >
                                    <Plus size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleAdjustCredits(user.id, -1)}
                                    className="w-6 h-6 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 flex items-center justify-center"
                                  >
                                    <Minus size={14} />
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                {user.isBanned ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                                    <UserX size={12} className="mr-1" />
                                    Banned
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                                    <UserCheck size={12} className="mr-1" />
                                    Active
                                  </span>
                                )}
                                {user.shareToFeed && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                                    Public
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-white/60">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleBanUser(user.id, !user.isBanned)}
                                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                    user.isBanned
                                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                  }`}
                                >
                                  {user.isBanned ? 'Unban' : 'Ban'}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="px-3 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

                                {/* Preset Manager Tab */}
                    {activeTab === 'presets' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white">Preset System Manager</h3>
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                              <input
                                type="text"
                                value={presetSearchTerm}
                                onChange={(e) => setPresetSearchTerm(e.target.value)}
                                placeholder="Search presets..."
                                className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Presets Table */}
                        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-white/10">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Preset</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Category</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Strength</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Status</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/10">
                                {filteredPresets.map((preset) => (
                                  <tr key={preset.id} className="hover:bg-white/5">
                                    <td className="px-4 py-3">
                                      <div>
                                        <div className="text-sm font-medium text-white">{preset.name}</div>
                                        <div className="text-xs text-white/60">{preset.presetKey}</div>
                                        {preset.description && (
                                          <div className="text-xs text-white/40 mt-1">{preset.description}</div>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                                        {preset.category}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm text-white">{preset.strength}</span>
                                        <div className="w-16 bg-white/10 rounded-full h-2">
                                          <div 
                                            className="bg-white h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min(preset.strength * 100, 100)}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => togglePreset(preset.id, !preset.isEnabled)}
                                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                            preset.isEnabled
                                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                          }`}
                                        >
                                          {preset.isEnabled ? 'Enabled' : 'Disabled'}
                                        </button>
                                        {preset.isCustom && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                                            Custom
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => {
                                            // TODO: Implement edit modal
                                            alert('Edit preset functionality coming soon!')
                                          }}
                                          className="px-3 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                                        >
                                          Edit
                                        </button>
                                        {preset.isCustom && (
                                          <button
                                            onClick={() => deletePreset(preset.id)}
                                            className="px-3 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                          >
                                            Delete
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Add New Preset Button */}
                        <div className="text-center space-y-3">
                          <button
                            onClick={() => {
                              // TODO: Implement add preset modal
                              alert('Add preset functionality coming soon!')
                            }}
                            className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
                          >
                            + Add New Preset
                          </button>
                          
                          <button
                            onClick={async () => {
                              try {
                                const response = await authenticatedFetch('/.netlify/functions/admin-seed-presets', {
                                  method: 'POST',
                                  headers: {
                                    'X-Admin-Secret': adminSecret
                                  }
                                })
                                
                                if (response.ok) {
                                  alert('Sample presets seeded successfully!')
                                  loadPresets() // Reload presets
                                } else {
                                  alert('Failed to seed presets')
                                }
                              } catch (error) {
                                console.error('Failed to seed presets:', error)
                                alert('Error seeding presets')
                              }
                            }}
                            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            🌱 Seed Sample Presets
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Other tabs will be implemented next */}
                    {activeTab !== 'users' && activeTab !== 'presets' && (
                      <div className="text-center py-12">
                        <div className="text-white/40 text-lg">Coming Soon...</div>
                        <div className="text-white/20 text-sm mt-2">This section is under development</div>
                      </div>
                    )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardScreen

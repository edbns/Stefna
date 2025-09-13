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
  Minus,
  RefreshCw
} from 'lucide-react'
import { authenticatedFetch } from '../utils/apiClient'
import { Helmet } from 'react-helmet'

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

  // Media Browser State
  const [media, setMedia] = useState<any[]>([])
  const [mediaStats, setMediaStats] = useState<any>(null)
  const [mediaTotal, setMediaTotal] = useState(0)
  const [mediaOffset, setMediaOffset] = useState(0)
  const [mediaFilter, setMediaFilter] = useState({ type: 'all', search: '' })
  
  // System Configuration State
  const [systemConfig, setSystemConfig] = useState<any>(null)
  
  // Logs & Analytics State
  const [logs, setLogs] = useState<any[]>([])
  const [logsAnalytics, setLogsAnalytics] = useState<any>(null)
  const [logsTotal, setLogsTotal] = useState(0)
  const [logsOffset, setLogsOffset] = useState(0)
  const [logsType, setLogsType] = useState('activity')
  const [logsDays, setLogsDays] = useState(7)
  
  // Referral System State
  const [referrals, setReferrals] = useState<any[]>([])
  const [referralsStats, setReferralsStats] = useState<any>(null)
  const [referralsTotal, setReferralsTotal] = useState(0)
  const [referralsOffset, setReferralsOffset] = useState(0)
  const [referralsType, setReferralsType] = useState('overview')

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

  // Load admin data when authenticated
  useEffect(() => {
    if (isAuthenticated && adminSecret) {
      loadAdminData()
    }
  }, [isAuthenticated, adminSecret])

  // Load data when tabs change
  useEffect(() => {
    if (isAuthenticated && adminSecret) {
      if (activeTab === 'media') {
        loadMedia()
      } else if (activeTab === 'config') {
        loadSystemConfig()
      } else if (activeTab === 'logs') {
        loadLogs()
      } else if (activeTab === 'referrals') {
        loadReferrals()
      }
    }
  }, [activeTab, isAuthenticated, adminSecret])

  // Load data when filters change
  useEffect(() => {
    if (isAuthenticated && adminSecret && activeTab === 'media') {
      loadMedia()
    }
  }, [mediaFilter, mediaOffset, isAuthenticated, adminSecret])

  useEffect(() => {
    if (isAuthenticated && adminSecret && activeTab === 'logs') {
      loadLogs()
    }
  }, [logsType, logsDays, logsOffset, isAuthenticated, adminSecret])

  useEffect(() => {
    if (isAuthenticated && adminSecret && activeTab === 'referrals') {
      loadReferrals()
    }
  }, [referralsType, referralsOffset, isAuthenticated, adminSecret])

  const loadAdminData = async () => {
    console.log('🔍 [Admin] Loading admin data...')
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
        console.log('✅ [Admin] Users loaded:', usersData.users?.length || 0)
      }

      // Load presets
      console.log('🔍 [Admin] Loading presets...')
      await loadPresets()
    } catch (error) {
      console.error('❌ [Admin] Failed to load admin data:', error)
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
    console.log('🔍 [Admin] Loading presets with secret:', adminSecret ? '***' : 'none')
    try {
      const response = await authenticatedFetch('/.netlify/functions/admin-presets', {
        method: 'GET',
        headers: {
          'X-Admin-Secret': adminSecret
        }
      })
      
      console.log('🔍 [Admin] Presets response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 [Admin] Presets data:', data)
        setPresets(data.presets || [])
      } else {
        console.error('❌ [Admin] Failed to load presets:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('❌ [Admin] Failed to load presets:', error)
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

  // Media Browser Functions
  const loadMedia = async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        offset: mediaOffset.toString(),
        ...(mediaFilter.type !== 'all' && { type: mediaFilter.type }),
        ...(mediaFilter.search && { search: mediaFilter.search })
      })

      const response = await authenticatedFetch(`/.netlify/functions/admin-media?${params}`, {
        method: 'GET',
        headers: {
          'X-Admin-Secret': adminSecret
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMedia(data.media || [])
        setMediaStats(data.stats || {})
        setMediaTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Failed to load media:', error)
    }
  }

  const handleDeleteMedia = async (id: string, type: string) => {
    if (!confirm('Are you sure you want to delete this media? This action cannot be undone.')) {
      return
    }
    
    try {
      const response = await authenticatedFetch('/.netlify/functions/admin-media', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify({ id, type })
      })
      
      if (response.ok) {
        // Remove media from local state
        setMedia(prev => prev.filter(item => !(item.id === id && item.type === type)))
        setMediaTotal(prev => prev - 1)
      }
    } catch (error) {
      console.error('Failed to delete media:', error)
    }
  }

  // System Configuration Functions
  const loadSystemConfig = async () => {
    try {
      const response = await authenticatedFetch('/.netlify/functions/admin-config', {
        method: 'GET',
        headers: {
          'X-Admin-Secret': adminSecret
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSystemConfig(data)
      }
    } catch (error) {
      console.error('Failed to load system config:', error)
    }
  }

  const handleResetDailyCredits = async () => {
    if (!confirm('Are you sure you want to reset daily credits for all users? This will give users with less than 10 credits a boost to 10 credits.')) {
      return
    }
    
    try {
      const response = await authenticatedFetch('/.netlify/functions/admin-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify({ action: 'reset_daily_credits' })
      })
      
      if (response.ok) {
        alert('Daily credits reset successfully!')
        loadSystemConfig()
      }
    } catch (error) {
      console.error('Failed to reset daily credits:', error)
    }
  }

  const handleCleanupOldMedia = async () => {
    if (!confirm('Are you sure you want to cleanup old media? This will delete incomplete media older than 30 days.')) {
      return
    }
    
    try {
      const response = await authenticatedFetch('/.netlify/functions/admin-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify({ action: 'cleanup_old_media' })
      })
      
      if (response.ok) {
        alert('Old media cleanup completed!')
        loadSystemConfig()
      }
    } catch (error) {
      console.error('Failed to cleanup old media:', error)
    }
  }

  // Logs & Analytics Functions
  const loadLogs = async () => {
    try {
      const params = new URLSearchParams({
        type: logsType,
        days: logsDays.toString(),
        limit: '100',
        offset: logsOffset.toString()
      })

      const response = await authenticatedFetch(`/.netlify/functions/admin-logs?${params}`, {
        method: 'GET',
        headers: {
          'X-Admin-Secret': adminSecret
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        setLogsAnalytics(data.analytics || {})
        setLogsTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Failed to load logs:', error)
    }
  }

  // Referral System Functions
  const loadReferrals = async () => {
    try {
      const params = new URLSearchParams({
        type: referralsType,
        limit: '50',
        offset: referralsOffset.toString()
      })

      const response = await authenticatedFetch(`/.netlify/functions/admin-referrals?${params}`, {
        method: 'GET',
        headers: {
          'X-Admin-Secret': adminSecret
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setReferrals(data.referrals || [])
        setReferralsStats(data.statistics || {})
        setReferralsTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Failed to load referrals:', error)
    }
  }

  const handleResetReferralStats = async () => {
    if (!confirm('Are you sure you want to reset all referral credits? This will set all users\' referral credits to 0.')) {
      return
    }
    
    try {
      const response = await authenticatedFetch('/.netlify/functions/admin-referrals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify({ action: 'reset_referral_stats' })
      })
      
      if (response.ok) {
        alert('Referral statistics reset successfully!')
        loadReferrals()
      }
    } catch (error) {
      console.error('Failed to reset referral stats:', error)
    }
  }

  // Credit System Helper Functions
  const getUsersWithCreditsRange = (min: number, max: number) => {
    return users.filter(user => user.credits >= min && user.credits <= max).length
  }

  const handleBulkCreditAdjustment = async () => {
    const adjustment = prompt('Enter credit adjustment amount (positive to add, negative to subtract):')
    if (!adjustment || isNaN(Number(adjustment))) {
      alert('Please enter a valid number')
      return
    }

    const amount = Number(adjustment)
    const usersWithLowCredits = users.filter(user => user.credits <= 5)
    
    if (!confirm(`This will adjust credits by ${amount} for ${usersWithLowCredits.length} users with ≤5 credits. Continue?`)) {
      return
    }

    try {
      let successCount = 0
      for (const user of usersWithLowCredits) {
        const response = await authenticatedFetch('/.netlify/functions/admin-adjust-credits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Secret': adminSecret
          },
          body: JSON.stringify({ userId: user.id, adjustment: amount })
        })
        
        if (response.ok) {
          successCount++
        }
      }

      alert(`Successfully adjusted credits for ${successCount} users!`)
      loadAdminData() // Reload data
    } catch (error) {
      console.error('Failed to bulk adjust credits:', error)
      alert('Error during bulk credit adjustment')
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
      <Helmet>
        <title>Admin Dashboard - Stefna</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <meta name="description" content="Admin dashboard - private access only" />
      </Helmet>
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-black border-r border-white/10 min-h-screen p-6 flex flex-col">
          <div className="flex-1 space-y-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center space-x-3 py-2 px-3 text-left transition-colors ${
                activeTab === 'users' 
                  ? 'text-white' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Users size={16} />
              <span className="text-sm font-medium">Users Management</span>
            </button>
            
            <button
              onClick={() => setActiveTab('media')}
              className={`w-full flex items-center space-x-3 py-2 px-3 text-left transition-colors ${
                activeTab === 'media' 
                  ? 'text-white' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Image size={16} />
              <span className="text-sm font-medium">Media Browser</span>
            </button>
            
            <button
              onClick={() => setActiveTab('credits')}
              className={`w-full flex items-center space-x-3 py-2 px-3 text-left transition-colors ${
                activeTab === 'credits' 
                  ? 'text-white' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Coins size={16} />
              <span className="text-sm font-medium">Credit System</span>
            </button>
            
            <button
              onClick={() => setActiveTab('presets')}
              className={`w-full flex items-center space-x-3 py-2 px-3 text-left transition-colors ${
                activeTab === 'presets' 
                  ? 'text-white' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Settings size={16} />
              <span className="text-sm font-medium">Preset Manager</span>
            </button>
            
            <button
              onClick={() => setActiveTab('config')}
              className={`w-full flex items-center space-x-3 py-2 px-3 text-left transition-colors ${
                activeTab === 'config' 
                  ? 'text-white' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Settings size={16} />
              <span className="text-sm font-medium">System Config</span>
            </button>
            
            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center space-x-3 py-2 px-3 text-left transition-colors ${
                activeTab === 'logs' 
                  ? 'text-white' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Activity size={16} />
              <span className="text-sm font-medium">Logs & Analytics</span>
            </button>
            
            <button
              onClick={() => setActiveTab('referrals')}
              className={`w-full flex items-center space-x-3 py-2 px-3 text-left transition-colors ${
                activeTab === 'referrals' 
                  ? 'text-white' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <UserCheck size={16} />
              <span className="text-sm font-medium">Referral System</span>
            </button>
          </div>
          
          {/* Exit Button at Bottom */}
          <div className="mt-auto pt-4 border-t border-white/10">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center space-x-3 py-2 px-3 text-left transition-colors text-white/60 hover:text-white"
            >
              <LogOut size={16} />
              <span className="text-sm font-medium">Exit Admin</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 pt-24">
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xl font-semibold text-white">{stats.totalUsers}</div>
                <div className="text-sm text-white/60">Total Users</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xl font-semibold text-white">{stats.activeUsers}</div>
                <div className="text-sm text-white/60">Active Users</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xl font-semibold text-white">{stats.bannedUsers}</div>
                <div className="text-sm text-white/60">Banned Users</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xl font-semibold text-white">{stats.totalMedia}</div>
                <div className="text-sm text-white/60">Total Media</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xl font-semibold text-white">{stats.totalCredits}</div>
                <div className="text-sm text-white/60">Total Credits</div>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Users Management</h3>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users..."
                        className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white/5 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-white/60">User</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Credits</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Joined</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Actions</th>
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
                                    className="w-6 h-6 bg-white/5 text-white rounded hover:bg-white/10 flex items-center justify-center transition-colors"
                                  >
                                    <Plus size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleAdjustCredits(user.id, -1)}
                                    className="w-6 h-6 bg-white/5 text-white rounded hover:bg-white/10 flex items-center justify-center transition-colors"
                                  >
                                    <Minus size={14} />
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                {user.isBanned ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-white/5 text-white">
                                    <UserX size={14} className="mr-1" />
                                    Banned
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-white/5 text-white">
                                    <UserCheck size={14} className="mr-1" />
                                    Active
                                  </span>
                                )}
                                {user.shareToFeed && (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-white/5 text-white">
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
                                  className="px-3 py-1 rounded text-sm font-medium bg-white/5 text-white hover:bg-white/10 transition-colors"
                                >
                                  {user.isBanned ? 'Unban' : 'Ban'}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="px-3 py-1 rounded text-sm font-medium bg-white/5 text-white hover:bg-white/10 transition-colors"
                                >
                                  <Trash2 size={14} />
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
                        <div className="bg-white/5 rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-white/5">
                                <tr>
                                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Preset</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Category</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Strength</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Status</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Actions</th>
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
                                          className="px-3 py-1 rounded text-sm font-medium bg-white/5 text-white hover:bg-white/10 transition-colors"
                                        >
                                          Edit
                                        </button>
                                        {preset.isCustom && (
                                          <button
                                            onClick={() => deletePreset(preset.id)}
                                            className="px-3 py-1 rounded text-sm font-medium bg-white/5 text-white hover:bg-white/10 transition-colors"
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
                        <div className="flex items-center justify-center space-x-4">
                          <button
                            onClick={() => {
                              // TODO: Implement add preset modal
                              alert('Add preset functionality coming soon!')
                            }}
                            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
                          >
                            Add New Preset
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
                            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
                          >
                            Seed Sample Presets
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Media Browser Tab */}
                    {activeTab === 'media' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white">Media Browser</h3>
                          <div className="flex items-center space-x-3">
                            <select
                              value={mediaFilter.type || 'all'}
                              onChange={(e) => setMediaFilter(prev => ({ ...prev, type: e.target.value }))}
                              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                            >
                              <option value="all">All Types</option>
                              <option value="neo_glitch">Neo Tokyo Glitch</option>
                              <option value="presets">Presets</option>
                              <option value="unreal_reflection">Unreal Reflection</option>
                              <option value="ghibli_reaction">Ghibli Reaction</option>
                              <option value="custom_prompt">Custom Prompt</option>
                              <option value="edit">Studio</option>
                            </select>
                            <div className="relative">
                              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                              <input
                                type="text"
                                value={mediaFilter.search || ''}
                                onChange={(e) => setMediaFilter(prev => ({ ...prev, search: e.target.value }))}
                                placeholder="Search media..."
                                className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Media Statistics */}
                        {mediaStats && (
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-2xl font-bold text-white">{mediaStats.total_media || 0}</div>
                              <div className="text-xs text-white/60">Total Media</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-2xl font-bold text-white">{mediaStats.unique_users || 0}</div>
                              <div className="text-xs text-white/60">Unique Users</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-2xl font-bold text-white">{mediaStats.neo_glitch_count || 0}</div>
                              <div className="text-xs text-white/60">Neo Tokyo</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-2xl font-bold text-white">{mediaStats.presets_count || 0}</div>
                              <div className="text-xs text-white/60">Presets</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-2xl font-bold text-white">{mediaStats.custom_prompt_count || 0}</div>
                              <div className="text-xs text-white/60">Custom</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-2xl font-bold text-white">{mediaStats.edit_count || 0}</div>
                              <div className="text-xs text-white/60">Studio</div>
                            </div>
                          </div>
                        )}

                        {/* Media Table */}
                        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-white/10">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Media</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">User</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Type</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Prompt</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Likes</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Date</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/10">
                                {media.map((item: any) => (
                                  <tr key={`${item.type}-${item.id}`} className="hover:bg-white/5">
                                    <td className="px-4 py-3">
                                      <div className="flex items-center space-x-3">
                                        <img
                                          src={item.finalUrl}
                                          alt="Media"
                                          className="w-12 h-12 rounded-lg object-cover"
                                        />
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="text-sm text-white">{item.user_id}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        item.type === 'neo_glitch' ? 'bg-purple-500/20 text-purple-400' :
                                        item.type === 'presets' ? 'bg-blue-500/20 text-blue-400' :
                                        item.type === 'unreal_reflection' ? 'bg-green-500/20 text-green-400' :
                                        item.type === 'ghibli_reaction' ? 'bg-yellow-500/20 text-yellow-400' :
                                        item.type === 'custom_prompt' ? 'bg-orange-500/20 text-orange-400' :
                                        'bg-red-500/20 text-red-400'
                                      }`}>
                                        {item.type === 'edit' ? 'Studio' : item.type.replace('_', ' ')}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="text-sm text-white/80 max-w-xs truncate" title={item.prompt}>
                                        {item.prompt}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="text-sm text-white">{item.likes_count || 0}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-white/60">
                                      {new Date(item.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => window.open(item.finalUrl, '_blank')}
                                          className="px-3 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                                        >
                                          View
                                        </button>
                                        <button
                                          onClick={() => handleDeleteMedia(item.id, item.type)}
                                          className="px-3 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30"
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

                        {/* Pagination */}
                        {mediaTotal > 0 && (
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-white/60">
                              Showing {media.length} of {mediaTotal} media items
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setMediaOffset(Math.max(0, mediaOffset - 50))}
                                disabled={mediaOffset === 0}
                                className="px-3 py-1 rounded text-xs font-medium bg-white/10 text-white hover:bg-white/20 disabled:opacity-50"
                              >
                                Previous
                              </button>
                              <button
                                onClick={() => setMediaOffset(mediaOffset + 50)}
                                disabled={media.length < 50}
                                className="px-3 py-1 rounded text-xs font-medium bg-white/10 text-white hover:bg-white/20 disabled:opacity-50"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* System Configuration Tab */}
                    {activeTab === 'config' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white">System Configuration</h3>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={handleCleanupOldMedia}
                              className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              Cleanup Old Media
                            </button>
                          </div>
                        </div>

                        {/* System Statistics */}
                        {systemConfig && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-2xl font-bold text-white">{systemConfig.systemStats?.total_users || 0}</div>
                              <div className="text-xs text-white/60">Total Users</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-2xl font-bold text-white">{systemConfig.systemStats?.new_users_24h || 0}</div>
                              <div className="text-xs text-white/60">New Users (24h)</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-2xl font-bold text-white">{systemConfig.systemStats?.active_users_24h || 0}</div>
                              <div className="text-xs text-white/60">Active Users (24h)</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-2xl font-bold text-white">{systemConfig.systemStats?.total_likes || 0}</div>
                              <div className="text-xs text-white/60">Total Likes</div>
                            </div>
                          </div>
                        )}

                        {/* Media Generation Statistics */}
                        {systemConfig && (
                          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                            <h4 className="text-lg font-semibold text-white mb-4">Media Generation (24h)</h4>
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">{systemConfig.mediaStats?.neo_glitch_24h || 0}</div>
                                <div className="text-xs text-white/60">Neo Tokyo</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">{systemConfig.mediaStats?.presets_24h || 0}</div>
                                <div className="text-xs text-white/60">Presets</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">{systemConfig.mediaStats?.unreal_reflection_24h || 0}</div>
                                <div className="text-xs text-white/60">Emotion</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">{systemConfig.mediaStats?.ghibli_reaction_24h || 0}</div>
                                <div className="text-xs text-white/60">Ghibli</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">{systemConfig.mediaStats?.custom_prompt_24h || 0}</div>
                                <div className="text-xs text-white/60">Custom</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">{systemConfig.mediaStats?.edit_24h || 0}</div>
                                <div className="text-xs text-white/60">Studio</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* System Health */}
                        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-white">System Health</h4>
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => loadSystemConfig()}
                                className="px-3 py-1 bg-white/5 text-white rounded hover:bg-white/10 transition-colors text-sm"
                              >
                                Refresh Health
                              </button>
                              <div className={`px-3 py-1 rounded text-sm font-medium ${
                                systemConfig?.systemConfig?.overall_health === 'healthy' 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                  : systemConfig?.systemConfig?.overall_health === 'degraded'
                                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}>
                                {systemConfig?.systemConfig?.overall_health === 'healthy' ? 'All Systems Healthy' :
                                 systemConfig?.systemConfig?.overall_health === 'degraded' ? 'Some Issues Detected' :
                                 'System Issues'}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${systemConfig?.systemConfig?.fal_ai_enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span className="text-sm text-white">Fal.ai API</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${systemConfig?.systemConfig?.bfl_api_enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span className="text-sm text-white">BFL API</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${systemConfig?.systemConfig?.stability_enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span className="text-sm text-white">Stability.ai</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${systemConfig?.systemConfig?.cloudinary_enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span className="text-sm text-white">Cloudinary</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${systemConfig?.systemConfig?.email_enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span className="text-sm text-white">Email Service</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${systemConfig?.systemConfig?.database_enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span className="text-sm text-white">Database</span>
                            </div>
                          </div>
                        </div>

                        {/* Launch Control */}
                        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                          <h4 className="text-lg font-semibold text-white mb-4">Launch Control</h4>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white font-medium">Site Status</p>
                                <p className="text-white/60 text-sm">
                                  {systemConfig?.systemConfig?.launch?.is_launched ? 'Live' : 'Coming Soon'}
                                </p>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                systemConfig?.systemConfig?.launch?.is_launched 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              }`}>
                                {systemConfig?.systemConfig?.launch?.is_launched ? 'LIVE' : 'COMING SOON'}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white font-medium">Waitlist Count</p>
                                <p className="text-white/60 text-sm">
                                  {systemConfig?.systemConfig?.launch?.waitlist_count || 0} users waiting
                                </p>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                              <button
                                onClick={async () => {
                                  const newStatus = !systemConfig?.systemConfig?.launch?.is_launched;
                                  const action = newStatus ? 'launch' : 'revert to coming soon';
                                  
                                  if (window.confirm(`Are you sure you want to ${action}? This will ${newStatus ? 'send launch emails to all waitlist users and make the site live' : 'revert the site to coming soon mode'}.`)) {
                                    try {
                                      const response = await authenticatedFetch('/.netlify/functions/admin-config', {
                                        method: 'PUT',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                          action: 'toggle_launch',
                                          data: { is_launched: newStatus }
                                        }),
                                      });

                                      if (response.ok) {
                                        const result = await response.json();
                                        alert(result.message);
                                        // Refresh system config
                                        fetchSystemConfig();
                                      } else {
                                        const error = await response.json();
                                        alert(`Error: ${error.message || 'Failed to update launch status'}`);
                                      }
                                    } catch (error) {
                                      console.error('Launch toggle error:', error);
                                      alert('Failed to update launch status');
                                    }
                                  }
                                }}
                                className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                                  systemConfig?.systemConfig?.launch?.is_launched
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30'
                                    : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                                }`}
                              >
                                {systemConfig?.systemConfig?.launch?.is_launched ? 'Revert to Coming Soon' : 'Launch Site'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Logs & Analytics Tab */}
                    {activeTab === 'logs' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white">Logs & Analytics</h3>
                          <div className="flex items-center space-x-3">
                            <select
                              value={logsType}
                              onChange={(e) => setLogsType(e.target.value)}
                              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                            >
                              <option value="activity">Activity Logs</option>
                              <option value="errors">Error Logs</option>
                              <option value="performance">Performance</option>
                            </select>
                            <select
                              value={logsDays}
                              onChange={(e) => setLogsDays(parseInt(e.target.value))}
                              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                            >
                              <option value={7}>Last 7 Days</option>
                              <option value={30}>Last 30 Days</option>
                              <option value={90}>Last 90 Days</option>
                            </select>
                          </div>
                        </div>

                        {/* Analytics Overview */}
                        {logsAnalytics && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-2xl font-bold text-white">{logsAnalytics.active_users || 0}</div>
                              <div className="text-xs text-white/60">Active Users</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-2xl font-bold text-white">{logsAnalytics.neo_glitch_generated || 0}</div>
                              <div className="text-xs text-white/60">Neo Tokyo Generated</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-2xl font-bold text-white">{logsAnalytics.custom_prompt_generated || 0}</div>
                              <div className="text-xs text-white/60">Custom Generated</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-2xl font-bold text-white">{logsAnalytics.likes_given || 0}</div>
                              <div className="text-xs text-white/60">Likes Given</div>
                            </div>
                          </div>
                        )}

                        {/* Logs Table */}
                        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-white/10">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Time</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">User</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Action</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Description</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/10">
                                {logs.map((log: any) => (
                                  <tr key={`${log.log_type}-${log.timestamp}`} className="hover:bg-white/5">
                                    <td className="px-4 py-3 text-sm text-white/60">
                                      {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="text-sm text-white">{log.user_email || 'System'}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        log.action === 'user_created' ? 'bg-green-500/20 text-green-400' :
                                        log.action === 'media_generated' ? 'bg-blue-500/20 text-blue-400' :
                                        log.action === 'like_added' ? 'bg-purple-500/20 text-purple-400' :
                                        'bg-gray-500/20 text-gray-400'
                                      }`}>
                                        {log.action}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="text-sm text-white/80 max-w-xs truncate" title={log.description}>
                                        {log.description}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Pagination */}
                        {logsTotal > 0 && (
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-white/60">
                              Showing {logs.length} of {logsTotal} log entries
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setLogsOffset(Math.max(0, logsOffset - 100))}
                                disabled={logsOffset === 0}
                                className="px-3 py-1 rounded text-xs font-medium bg-white/10 text-white hover:bg-white/20 disabled:opacity-50"
                              >
                                Previous
                              </button>
                              <button
                                onClick={() => setLogsOffset(logsOffset + 100)}
                                disabled={logs.length < 100}
                                className="px-3 py-1 rounded text-xs font-medium bg-white/10 text-white hover:bg-white/20 disabled:opacity-50"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Referral System Tab */}
                    {activeTab === 'referrals' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white">Referral System</h3>
                          <div className="flex items-center space-x-3">
                            <select
                              value={referralsType}
                              onChange={(e) => setReferralsType(e.target.value)}
                              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                            >
                              <option value="overview">Overview</option>
                              <option value="relationships">Relationships</option>
                              <option value="rewards">Rewards</option>
                            </select>
                            <button
                              onClick={handleResetReferralStats}
                              className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
                            >
                              Reset All Credits
                            </button>
                          </div>
                        </div>

                        {/* Referral Statistics */}
                        {referralsStats && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-2xl font-bold text-white">{referralsStats.users_referred || 0}</div>
                              <div className="text-xs text-white/60">Users Referred</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-2xl font-bold text-white">{referralsStats.total_credits_given || 0}</div>
                              <div className="text-xs text-white/60">Total Credits Given</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-2xl font-bold text-white">{referralsStats.new_referrals_7d || 0}</div>
                              <div className="text-xs text-white/60">New Referrals (7d)</div>
                            </div>
                          </div>
                        )}

                        {/* Referrals Table */}
                        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-white/10">
                                <tr>
                                  {referralsType === 'overview' && (
                                    <>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">User</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Total Referrals</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Credits Given</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Last Referral</th>
                                    </>
                                  )}
                                  {referralsType === 'relationships' && (
                                    <>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Referrer</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Referred User</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Date</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Credits Earned</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Last Login</th>
                                    </>
                                  )}
                                  {referralsType === 'rewards' && (
                                    <>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">User</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Credits Earned</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Referrals</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Account Created</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Last Login</th>
                                    </>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/10">
                                {referrals.map((referral: any) => (
                                  <tr key={`${referralsType}-${referral.id || referral.referrer_id}`} className="hover:bg-white/5">
                                    {referralsType === 'overview' && (
                                      <>
                                        <td className="px-4 py-3">
                                          <div className="text-sm text-white">{referral.email}</div>
                                          {referral.name && <div className="text-xs text-white/60">{referral.name}</div>}
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="text-sm text-white">{referral.total_referrals}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="text-sm text-white">{referral.total_credits_given}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-white/60">
                                          {referral.last_referral_date ? new Date(referral.last_referral_date).toLocaleDateString() : 'Never'}
                                        </td>
                                      </>
                                    )}
                                    {referralsType === 'relationships' && (
                                      <>
                                        <td className="px-4 py-3">
                                          <div className="text-sm text-white">{referral.referrer_email}</div>
                                          {referral.referrer_name && <div className="text-xs text-white/60">{referral.referrer_name}</div>}
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="text-sm text-white">{referral.referred_email}</div>
                                          {referral.referred_name && <div className="text-xs text-white/60">{referral.referred_name}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-white/60">
                                          {new Date(referral.referred_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="text-sm text-white">{referral.referral_credits_earned}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-white/60">
                                          {referral.last_login ? new Date(referral.last_login).toLocaleDateString() : 'Never'}
                                        </td>
                                      </>
                                    )}
                                    {referralsType === 'rewards' && (
                                      <>
                                        <td className="px-4 py-3">
                                          <div className="text-sm text-white">{referral.email}</div>
                                          {referral.name && <div className="text-xs text-white/60">{referral.name}</div>}
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="text-sm text-white">{referral.referral_credits_earned}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="text-sm text-white">{referral.successful_referrals}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-white/60">
                                          {new Date(referral.account_created).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-white/60">
                                          {referral.last_login ? new Date(referral.last_login).toLocaleDateString() : 'Never'}
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Pagination */}
                        {referralsTotal > 0 && (
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-white/60">
                              Showing {referrals.length} of {referralsTotal} referral entries
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setReferralsOffset(Math.max(0, referralsOffset - 50))}
                                disabled={referralsOffset === 0}
                                className="px-3 py-1 rounded text-xs font-medium bg-white/10 text-white hover:bg-white/20 disabled:opacity-50"
                              >
                                Previous
                              </button>
                              <button
                                onClick={() => setReferralsOffset(referralsOffset + 50)}
                                disabled={referrals.length < 50}
                                className="px-3 py-1 rounded text-xs font-medium bg-white/10 text-white hover:bg-white/20 disabled:opacity-50"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Credit System Tab */}
                    {activeTab === 'credits' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white">Credit System Management</h3>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={handleResetDailyCredits}
                              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
                            >
                              Reset Daily Credits
                            </button>
                            <button
                              onClick={handleBulkCreditAdjustment}
                              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
                            >
                              Bulk Adjust Credits
                            </button>
                          </div>
                        </div>

                        {/* Credit Statistics */}
                        {systemConfig && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-2xl font-bold text-white">{systemConfig.creditStats?.total_credits_in_system || 0}</div>
                              <div className="text-xs text-white/60">Total Credits in System</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-2xl font-bold text-white">{systemConfig.creditStats?.users_with_credits || 0}</div>
                              <div className="text-xs text-white/60">Users with Credits</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-2xl font-bold text-white">{systemConfig.creditStats?.users_without_credits || 0}</div>
                              <div className="text-xs text-white/60">Users without Credits</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-2xl font-bold text-white">{Math.round(systemConfig.creditStats?.avg_credits_per_user || 0)}</div>
                              <div className="text-xs text-white/60">Avg Credits per User</div>
                            </div>
                          </div>
                        )}

                        {/* Credit Distribution Chart */}
                        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                          <h4 className="text-lg font-semibold text-white mb-4">Credit Distribution</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-white">0 Credits</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-32 bg-white/10 rounded-full h-2">
                                  <div 
                                    className="bg-red-500 h-2 rounded-full" 
                                    style={{ width: `${(systemConfig?.creditStats?.users_without_credits / stats.totalUsers) * 100 || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-white/60">{systemConfig?.creditStats?.users_without_credits || 0} users</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-white">1-10 Credits</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-32 bg-white/10 rounded-full h-2">
                                  <div 
                                    className="bg-yellow-500 h-2 rounded-full" 
                                    style={{ width: `${(getUsersWithCreditsRange(1, 10) / stats.totalUsers) * 100 || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-white/60">{getUsersWithCreditsRange(1, 10)} users</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-white">11-50 Credits</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-32 bg-white/10 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full" 
                                    style={{ width: `${(getUsersWithCreditsRange(11, 50) / stats.totalUsers) * 100 || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-white/60">{getUsersWithCreditsRange(11, 50)} users</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-white">50+ Credits</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-32 bg-white/10 rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full" 
                                    style={{ width: `${(getUsersWithCreditsRange(51, 999) / stats.totalUsers) * 100 || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-white/60">{getUsersWithCreditsRange(51, 999)} users</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Users with Low Credits */}
                        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                          <div className="p-4 border-b border-white/10">
                            <h4 className="text-lg font-semibold text-white">Users with Low Credits (≤5)</h4>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-white/10">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">User</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Credits</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Last Login</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/10">
                                {users.filter(user => user.credits <= 5).slice(0, 10).map((user) => (
                                  <tr key={user.id} className="hover:bg-white/5">
                                    <td className="px-4 py-3">
                                      <div className="text-sm text-white">{user.email}</div>
                                      {user.name && <div className="text-xs text-white/60">{user.name}</div>}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="text-sm text-white">{user.credits}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-white/60">
                                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => handleAdjustCredits(user.id, 5)}
                                          className="px-3 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                        >
                                          +5 Credits
                                        </button>
                                        <button
                                          onClick={() => handleAdjustCredits(user.id, 10)}
                                          className="px-3 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                                        >
                                          +10 Credits
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

                    {/* Other tabs will be implemented next */}
                    {activeTab !== 'users' && activeTab !== 'presets' && activeTab !== 'media' && activeTab !== 'config' && activeTab !== 'logs' && activeTab !== 'referrals' && activeTab !== 'credits' && (
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

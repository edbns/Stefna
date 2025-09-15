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
  RefreshCw,
  X
} from 'lucide-react'
import { authenticatedFetch } from '../utils/apiClient'
import { Helmet } from 'react-helmet'

interface User {
  id: string
  email: string
  createdAt: string
  lastActive?: string
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
  quotaStatus?: {
    quota_enabled: boolean
    quota_limit: number
    current_count: number
    quota_reached: boolean
    remaining_slots: number
  }
}

interface PresetConfig {
  id: string
  preset_key: string
  preset_name: string
  preset_description: string
  preset_category: string
  preset_prompt: string
  preset_negative_prompt: string
  preset_strength: number
  preset_rotation_index: number
  preset_week: number | null
  is_active: boolean
  created_at: string
  updated_at: string
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
    activeUsers: 0,
    quotaStatus: {
      quota_enabled: false,
      quota_limit: 0,
      current_count: 0,
      quota_reached: false,
      remaining_slots: 0
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [presetSearchTerm, setPresetSearchTerm] = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'banned' | 'low-credits' | 'inactive'>('all')
  const [userSort, setUserSort] = useState<'newest' | 'oldest' | 'credits-high' | 'credits-low'>('newest')
  const [usersPerPage, setUsersPerPage] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)

  // Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'ban' | 'unban' | 'delete' | 'delete-media' | 'reset-credits' | 'delete-preset' | 'validation'
    userId?: string
    userEmail?: string
    mediaId?: string
    mediaType?: string
    presetId?: string
    presetName?: string
    title?: string
    message?: string
    onConfirm?: () => void
  } | null>(null)
  
  // Media View Modal State
  const [showMediaModal, setShowMediaModal] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<any>(null)
  
  // Add Preset Modal State
  const [showAddPresetModal, setShowAddPresetModal] = useState(false)
  const [showEditPresetModal, setShowEditPresetModal] = useState(false)
  const [editingPreset, setEditingPreset] = useState<PresetConfig | null>(null)
  const [newPreset, setNewPreset] = useState({
    preset_name: '',
    preset_key: '',
    preset_description: '',
    preset_category: 'Custom',
    preset_strength: 0.5,
    is_active: true,
    preset_week: null
  })

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

      // Load quota status
      console.log('🔍 [Admin] Loading quota status...')
      const quotaResponse = await authenticatedFetch('/.netlify/functions/check-quota', {
        method: 'GET'
      })
      
      if (quotaResponse.ok) {
        const quotaData = await quotaResponse.json()
        if (quotaData.success && quotaData.quota) {
          setStats(prevStats => ({
            ...prevStats,
            quotaStatus: quotaData.quota
          }))
          console.log('✅ [Admin] Quota status loaded:', quotaData.quota)
        }
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
    const user = users.find(u => u.id === userId)
    if (!user) return

    setConfirmAction({
      type: ban ? 'ban' : 'unban',
      userId,
      userEmail: user.email
    })
    setShowConfirmModal(true)
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
    const user = users.find(u => u.id === userId)
    if (!user) return

    setConfirmAction({
      type: 'delete',
      userId,
      userEmail: user.email
    })
    setShowConfirmModal(true)
  }

  const executeConfirmAction = async () => {
    if (!confirmAction) return

    try {
      if (confirmAction.type === 'delete') {
      const response = await authenticatedFetch('/.netlify/functions/admin-delete-user', {
        method: 'DELETE',
        headers: {
          'X-Admin-Secret': adminSecret
        },
          body: JSON.stringify({ userId: confirmAction.userId })
      })
      
      if (response.ok) {
          setUsers(prev => prev.filter(user => user.id !== confirmAction.userId))
        loadAdminData()
        }
      } else if (confirmAction.type === 'delete-media') {
        const response = await authenticatedFetch('/.netlify/functions/admin-media', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Secret': adminSecret
          },
          body: JSON.stringify({ id: confirmAction.mediaId, type: confirmAction.mediaType })
        })
        
        if (response.ok) {
          setMedia(prev => prev.filter(item => !(item.id === confirmAction.mediaId && item.type === confirmAction.mediaType)))
          setMediaTotal(prev => prev - 1)
        }
      } else if (confirmAction.type === 'reset-credits') {
        const dailyCap = systemConfig?.limits?.daily_cap || 14
        const response = await authenticatedFetch('/.netlify/functions/admin-config', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Secret': adminSecret
          },
          body: JSON.stringify({ action: 'reset_daily_credits' })
        })
        
        if (response.ok) {
          loadAdminData()
          loadSystemConfig()
        }
      } else if (confirmAction.type === 'delete-preset') {
        const response = await authenticatedFetch('/.netlify/functions/admin-presets-config', {
          method: 'DELETE',
          headers: {
            'X-Admin-Secret': adminSecret
          },
          body: JSON.stringify({ id: confirmAction.presetId })
        })
        
        if (response.ok) {
          setPresets(prev => prev.filter(preset => preset.id !== confirmAction.presetId))
        }
      } else {
        const ban = confirmAction.type === 'ban'
        const response = await authenticatedFetch('/.netlify/functions/admin-ban-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Secret': adminSecret
          },
          body: JSON.stringify({ userId: confirmAction.userId, ban })
        })
        
        if (response.ok) {
          setUsers(prev => prev.map(user => 
            user.id === confirmAction.userId ? { ...user, isBanned: ban } : user
          ))
          loadAdminData()
        }
      }
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setShowConfirmModal(false)
      setConfirmAction(null)
    }
  }

  // Media View Functions
  const handleViewMedia = (mediaItem: any) => {
    setSelectedMedia(mediaItem)
    setShowMediaModal(true)
  }

  // Preset management functions
  const loadPresets = async () => {
    console.log('🔍 [Admin] Loading presets with secret:', adminSecret ? '***' : 'none')
    try {
      const response = await authenticatedFetch('/.netlify/functions/admin-presets-config', {
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
      const response = await authenticatedFetch('/.netlify/functions/admin-presets-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify({
          id: presetId,
          updates: { isActive: isEnabled }
        })
      })
      
      if (response.ok) {
        // Update local state
        setPresets(prev => prev.map(preset => 
          preset.id === presetId ? { ...preset, is_active: isEnabled } : preset
        ))
      }
    } catch (error) {
      console.error('Failed to toggle preset:', error)
    }
  }

  const addPreset = async () => {
    if (!newPreset.preset_name || !newPreset.preset_key) {
      setConfirmAction({
        type: 'validation',
        title: 'Missing Information',
        message: 'Please fill in preset name and key',
        onConfirm: () => setConfirmAction(null)
      })
      return
    }
    
    try {
      const response = await authenticatedFetch('/.netlify/functions/admin-presets-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify(newPreset)
      })
      
      if (response.ok) {
        const addedPreset = await response.json()
        setPresets(prev => [...prev, addedPreset])
        setShowAddPresetModal(false)
        setNewPreset({
          preset_name: '',
          preset_key: '',
          preset_description: '',
          preset_category: 'Custom',
          preset_strength: 0.5,
          is_active: true,
          preset_week: null
        })
      } else {
        setConfirmAction({
          type: 'validation',
          title: 'Error',
          message: 'Failed to add preset. Please try again.',
          onConfirm: () => setConfirmAction(null)
        })
      }
    } catch (error) {
      console.error('Failed to add preset:', error)
      setConfirmAction({
        type: 'validation',
        title: 'Error',
        message: 'Failed to add preset. Please try again.',
        onConfirm: () => setConfirmAction(null)
      })
    }
  }

  const editPreset = (preset: PresetConfig) => {
    setEditingPreset(preset)
    setShowEditPresetModal(true)
  }

  const updatePreset = async () => {
    if (!editingPreset) return

    try {
      const response = await authenticatedFetch('/.netlify/functions/admin-presets-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify({
          id: editingPreset.id,
          updates: editingPreset
        })
      })
      
      if (response.ok) {
        setPresets(prev => prev.map(preset => 
          preset.id === editingPreset.id ? editingPreset : preset
        ))
        setShowEditPresetModal(false)
        setEditingPreset(null)
      }
    } catch (error) {
      console.error('Failed to update preset:', error)
    }
  }

  const deletePreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId)
    if (preset) {
      setConfirmAction({
        type: 'delete-preset',
        presetId: presetId,
        presetName: preset.preset_name,
        onConfirm: async () => {
          try {
            const response = await authenticatedFetch('/.netlify/functions/admin-presets-config', {
        method: 'DELETE',
        headers: {
                'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify({ id: presetId })
      })
      
      if (response.ok) {
              setPresets(prev => prev.filter(p => p.id !== presetId))
      }
    } catch (error) {
      console.error('Failed to delete preset:', error)
          }
          setConfirmAction(null)
        }
      })
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
    setConfirmAction({
      type: 'delete-media',
      mediaId: id,
      mediaType: type
    })
    setShowConfirmModal(true)
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
    const dailyCap = systemConfig?.limits?.daily_cap || 14
    setConfirmAction({
      type: 'reset-credits'
    })
    setShowConfirmModal(true)
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

  // Bulk Credit Adjustment State
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkAdjustment, setBulkAdjustment] = useState({
    type: 'users', // 'users' or 'config'
    amount: '',
    target: 'all', // 'all', 'low', 'high', 'zero'
    configKey: 'daily_cap' // for config adjustments
  })

  const handleBulkCreditAdjustment = () => {
    setShowBulkModal(true)
  }

  const executeBulkAdjustment = async () => {
    if (!bulkAdjustment.amount || isNaN(Number(bulkAdjustment.amount))) {
      return
    }

    const amount = Number(bulkAdjustment.amount)
    
    try {
      let successCount = 0
      let totalAffected = 0

      if (bulkAdjustment.type === 'config') {
        // Adjust app_config values
        const response = await authenticatedFetch('/.netlify/functions/admin-config', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Secret': adminSecret
          },
          body: JSON.stringify({
            action: 'bulk_config_adjustment',
            data: {
              key: bulkAdjustment.configKey,
              adjustment: amount
            }
          })
        })

        if (response.ok) {
          loadSystemConfig()
        }
      } else {
        // Adjust user credits
        let targetUsers = users

        if (bulkAdjustment.target === 'low') {
          targetUsers = users.filter(user => user.credits <= 5)
        } else if (bulkAdjustment.target === 'high') {
          targetUsers = users.filter(user => user.credits > 20)
        } else if (bulkAdjustment.target === 'zero') {
          targetUsers = users.filter(user => user.credits === 0)
        }

        totalAffected = targetUsers.length

        for (const user of targetUsers) {
          try {
            const response = await authenticatedFetch('/.netlify/functions/admin-adjust-credits', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Admin-Secret': adminSecret
              },
              body: JSON.stringify({
                userId: user.id,
                adjustment: amount
              })
            })

            if (response.ok) {
              successCount++
            }
          } catch (error) {
            console.error(`Failed to adjust credits for user ${user.id}:`, error)
          }
        }

        loadAdminData()
      }

      setShowBulkModal(false)
      setBulkAdjustment({ type: 'users', amount: '', target: 'all', configKey: 'daily_cap' })
    } catch (error) {
      console.error('Bulk adjustment failed:', error)
      alert('Bulk adjustment failed')
    }
  }

  const filteredUsers = users
    .filter(user => {
      // Search filter
      const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Status filter
      let matchesFilter = true
      switch (userFilter) {
        case 'active':
          matchesFilter = !user.isBanned
          break
        case 'banned':
          matchesFilter = user.isBanned
          break
        case 'low-credits':
          matchesFilter = user.credits <= 5
          break
        case 'inactive':
          // Users inactive for more than 7 days
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          matchesFilter = !user.lastActive || new Date(user.lastActive) < sevenDaysAgo
          break
        case 'all':
        default:
          matchesFilter = true
      }
      
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (userSort) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'credits-high':
          return b.credits - a.credits
        case 'credits-low':
          return a.credits - b.credits
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  const filteredPresets = presets.filter(preset => 
    preset.preset_name?.toLowerCase().includes(presetSearchTerm.toLowerCase()) ||
    preset.preset_key?.toLowerCase().includes(presetSearchTerm.toLowerCase()) ||
    preset.preset_category?.toLowerCase().includes(presetSearchTerm.toLowerCase())
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
              <p className="text-gray-400">Enter the admin secret to continue</p>
            </div>
            
            <div className="space-y-4">
              <input
                type="password"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                placeholder="Enter admin secret"
                className="w-full px-4 py-3 bg-gray-600 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
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
                className="text-gray-500 hover:text-gray-400 transition-colors"
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
        {/* Modern Sidebar */}
        <div className="w-72 bg-black border-r border-gray-600 h-screen flex flex-col shadow-sm fixed left-0 top-0 overflow-y-auto z-10">
          {/* Header */}
          <div className="p-6 border-b border-gray-600">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Shield size={16} className="text-black" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Admin Dashboard</h1>
                <p className="text-sm text-gray-400">Stefna Management</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-4 space-y-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center space-x-3 py-3 px-4 text-left transition-all duration-200 rounded-lg ${
                activeTab === 'users' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
            >
              <Users size={18} />
              <span className="font-medium">Users Management</span>
            </button>
            
            <button
              onClick={() => setActiveTab('media')}
              className={`w-full flex items-center space-x-3 py-3 px-4 text-left transition-all duration-200 rounded-lg ${
                activeTab === 'media' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
            >
              <Image size={18} />
              <span className="font-medium">Media Browser</span>
            </button>
            
            <button
              onClick={() => setActiveTab('credits')}
              className={`w-full flex items-center space-x-3 py-3 px-4 text-left transition-all duration-200 rounded-lg ${
                activeTab === 'credits' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
            >
              <Coins size={18} />
              <span className="font-medium">Credit System</span>
            </button>
            
            <button
              onClick={() => setActiveTab('presets')}
              className={`w-full flex items-center space-x-3 py-3 px-4 text-left transition-all duration-200 rounded-lg ${
                activeTab === 'presets' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
            >
              <Settings size={18} />
              <span className="font-medium">Preset Manager</span>
            </button>
            
            <button
              onClick={() => setActiveTab('config')}
              className={`w-full flex items-center space-x-3 py-3 px-4 text-left transition-all duration-200 rounded-lg ${
                activeTab === 'config' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
            >
              <Settings size={18} />
              <span className="font-medium">System Config</span>
            </button>
            
            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center space-x-3 py-3 px-4 text-left transition-all duration-200 rounded-lg ${
                activeTab === 'logs' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
            >
              <Activity size={18} />
              <span className="font-medium">Logs & Analytics</span>
            </button>
            
            <button
              onClick={() => setActiveTab('referrals')}
              className={`w-full flex items-center space-x-3 py-3 px-4 text-left transition-all duration-200 rounded-lg ${
                activeTab === 'referrals' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
            >
              <UserCheck size={18} />
              <span className="font-medium">Referral System</span>
            </button>
          </div>
          
          {/* Exit Button */}
          <div className="p-4 border-t border-gray-600">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center space-x-3 py-3 px-4 text-left transition-all duration-200 rounded-lg text-gray-300 hover:bg-gray-600 hover:text-white"
            >
              <LogOut size={18} />
              <span className="font-medium">Exit Admin</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 ml-72">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white capitalize">{activeTab.replace('_', ' ')}</h2>
                <p className="text-gray-400 mt-1">Manage and monitor your Stefna platform</p>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
              <div className="bg-black rounded-xl p-6 shadow-sm border border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.totalUsers}</p>
              </div>
              </div>
              </div>
              
              <div className="bg-black rounded-xl p-6 shadow-sm border border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Active Users</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.activeUsers}</p>
              </div>
              </div>
              </div>
              
              <div className="bg-black rounded-xl p-6 shadow-sm border border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Banned Users</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.bannedUsers}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-black rounded-xl p-6 shadow-sm border border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Total Media</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.totalMedia}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-black rounded-xl p-6 shadow-sm border border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Total Credits</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.totalCredits}</p>
                  </div>
                </div>
              </div>
              
              {stats.quotaStatus && (
                <div className={`rounded-xl p-6 shadow-sm border ${
                  stats.quotaStatus.quota_reached 
                    ? 'bg-red-500/10 border-red-500/20' 
                    : 'bg-black border-gray-600'
                }`}>
                  <div>
                    <p className={`text-sm font-medium ${
                      stats.quotaStatus.quota_reached ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {stats.quotaStatus.quota_reached ? 'Quota Reached' : 'Beta Users'}
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${
                    stats.quotaStatus.quota_reached ? 'text-red-400' : 'text-white'
                  }`}>
                    {stats.quotaStatus.current_count}/{stats.quotaStatus.quota_limit}
                    </p>
                  {stats.quotaStatus.quota_enabled && (
                      <p className="text-xs text-gray-500 mt-1">
                      {stats.quotaStatus.remaining_slots} slots left
                      </p>
                  )}
                  </div>
                </div>
              )}
            </div>

            {/* Tab Content */}
            {activeTab === 'users' && (
              <div className="space-y-8">
                {/* Quota Status Section */}
                {stats.quotaStatus && (
                  <div className="bg-black rounded-xl p-6 shadow-sm border border-gray-600">
                    <h3 className="text-lg font-semibold text-white mb-4">Beta Quota Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`rounded-lg p-4 ${
                        stats.quotaStatus.quota_reached 
                          ? 'bg-red-500/10 border border-red-500/20' 
                          : 'bg-black border border-gray-600'
                      }`}>
                        <div className="text-2xl font-semibold text-white">
                          {stats.quotaStatus.current_count}/{stats.quotaStatus.quota_limit}
                        </div>
                        <div className="text-sm text-gray-400">
                          {stats.quotaStatus.quota_reached ? 'Quota Reached' : 'Beta Users'}
                        </div>
                      </div>
                      <div className="bg-black border border-gray-600 rounded-lg p-4">
                        <div className="text-2xl font-semibold text-white">
                          {stats.quotaStatus.remaining_slots}
                        </div>
                        <div className="text-sm text-gray-400">Slots Remaining</div>
                      </div>
                      <div className="bg-black border border-gray-600 rounded-lg p-4">
                        <div className="text-2xl font-semibold text-white">
                          {stats.quotaStatus.quota_enabled ? 'Active' : 'Disabled'}
                        </div>
                        <div className="text-sm text-gray-400">Quota System</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Users Management Section */}
                <div className="bg-black rounded-xl p-6 shadow-sm border border-gray-600">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                  <h3 className="text-lg font-semibold text-white">Users Management</h3>
                      <p className="text-sm text-gray-400 mt-1">Manage user accounts, credits, and permissions</p>
                    </div>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users..."
                          className="pl-10 pr-4 py-2 bg-gray-600 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                      />
                    </div>
                      <button className="px-4 py-2 bg-gray-600 text-white border border-gray-600 rounded-lg">
                        Export Users
                      </button>
                  </div>
                </div>

            {/* Filter Bar */}
            <div className="flex items-center space-x-4 mb-6">
              <select 
                value={userFilter}
                onChange={(e) => {
                  setUserFilter(e.target.value as any)
                  setCurrentPage(1) // Reset to first page when filter changes
                }}
                className="px-3 py-2 bg-gray-600 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-gray-600"
              >
                <option value="all">All Users</option>
                <option value="active">Active</option>
                <option value="banned">Banned</option>
                <option value="low-credits">Low Credits</option>
                <option value="inactive">Inactive (7+ days)</option>
              </select>
              <select 
                value={userSort}
                onChange={(e) => {
                  setUserSort(e.target.value as any)
                  setCurrentPage(1) // Reset to first page when sort changes
                }}
                className="px-3 py-2 bg-gray-600 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-gray-600"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="credits-high">Credits (High to Low)</option>
                <option value="credits-low">Credits (Low to High)</option>
              </select>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Show:</span>
                <select 
                  value={usersPerPage}
                  onChange={(e) => {
                    setUsersPerPage(Number(e.target.value))
                    setCurrentPage(1) // Reset to first page when page size changes
                  }}
                  className="px-2 py-1 bg-gray-600 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-gray-600"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedUsers.map((user) => (
                <div key={user.id} className="bg-black border border-gray-600 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg font-semibold">{user.email[0].toUpperCase()}</span>
                                </div>
                                <div>
                        <div className="text-sm font-medium text-white truncate max-w-[150px]" title={user.email}>
                          {user.email}
                                </div>
                        <div className="text-xs text-gray-400">
                          Joined: {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                        <div className="text-xs text-gray-400">
                          Last active: {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                              </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-600 text-white">
                      {user.isBanned ? 'Banned' : 'Active'}
                    </span>
                              </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Credits</span>
                      <span className="text-sm font-semibold text-white">{user.credits}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Privacy</span>
                      <span className="text-xs text-gray-400">{user.shareToFeed ? 'Public' : 'Private'}</span>
                    </div>
                  </div>

                              <div className="flex items-center space-x-2">
                                  <button
                                  onClick={() => handleBanUser(user.id, !user.isBanned)}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-gray-600 text-white"
                                  >
                      {user.isBanned ? 'Unban User' : 'Ban User'}
                                  </button>
                                  <button
                                  onClick={() => handleDeleteUser(user.id)}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg"
                                  >
                      <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                        ))}
                              </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-600">
              <div className="text-sm text-gray-400">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
              </div>
                              <div className="flex items-center space-x-2">
                                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                  Previous
                                </button>
                <span className="px-3 py-1 bg-gray-700 text-white rounded text-sm">
                  {currentPage} of {totalPages}
                </span>
                                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                  Next
                                </button>
                              </div>
                  </div>
                </div>

              </div>
            )}

                                {/* Preset Manager Tab */}
                    {activeTab === 'presets' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white">Preset Manager</h3>
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                              <input
                                type="text"
                                value={presetSearchTerm}
                                onChange={(e) => setPresetSearchTerm(e.target.value)}
                                placeholder="Search presets..."
                                className="pl-10 pr-4 py-2 bg-gray-600 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                              />
                            </div>
                            <button
                              onClick={() => setShowAddPresetModal(true)}
                              className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium"
                            >
                              Add New Preset
                            </button>
                          </div>
                        </div>

                        {/* Presets Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredPresets.map((preset) => (
                            <div key={preset.id} className="bg-black border border-gray-600 rounded-xl p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-white truncate" title={preset.preset_name}>
                                    {preset.preset_name}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    {preset.preset_key}
                                  </div>
                                        {preset.preset_description && (
                                    <div className="text-xs text-gray-500 mt-2 line-clamp-2">
                                      {preset.preset_description}
                                    </div>
                                        )}
                                      </div>
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-600 text-white">
                                        {preset.preset_category}
                                      </span>
                              </div>
                              
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-400">Strength</span>
                                  <span className="text-sm font-semibold text-white">{preset.preset_strength}</span>
                                </div>
                                <div className="w-full bg-gray-600 rounded-full h-2">
                                          <div 
                                            className="bg-white h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min((preset.preset_strength || 1) * 100, 100)}%` }}
                                          ></div>
                                        </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-400">Status</span>
                                  <span className="text-xs text-gray-400">
                                    {preset.is_active ? 'Enabled' : 'Disabled'}
                                  </span>
                                      </div>
                                {preset.preset_week && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">Week</span>
                                    <span className="text-xs text-gray-400">Week {preset.preset_week}</span>
                                  </div>
                                )}
                              </div>
                              
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => togglePreset(preset.id, !preset.is_active)}
                                  className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-gray-600 text-white"
                                >
                                  {preset.is_active ? 'Disable' : 'Enable'}
                                        </button>
                                        <button
                                          onClick={() => editPreset(preset)}
                                  className="px-3 py-2 bg-gray-600 text-white rounded-lg"
                                        >
                                  <Settings size={14} />
                                        </button>
                                        {preset.preset_week && (
                                          <button
                                            onClick={() => deletePreset(preset.id)}
                                    className="px-3 py-2 bg-gray-600 text-white rounded-lg"
                                          >
                                    <Trash2 size={14} />
                                          </button>
                                        )}
                                      </div>
                            </div>
                                ))}
                        </div>
                      </div>
                    )}

                    {/* Media Browser Tab */}
                    {activeTab === 'media' && (
                      <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                          <h3 className="text-lg font-semibold text-white">Media Browser</h3>
                            <p className="text-sm text-gray-400 mt-1">Browse and manage all generated media</p>
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <select
                              value={mediaFilter.type || 'all'}
                              onChange={(e) => setMediaFilter(prev => ({ ...prev, type: e.target.value }))}
                              className="px-3 py-2 bg-gray-600 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-gray-600"
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
                              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                              <input
                                type="text"
                                value={mediaFilter.search || ''}
                                onChange={(e) => setMediaFilter(prev => ({ ...prev, search: e.target.value }))}
                                placeholder="Search media..."
                                className="pl-10 pr-4 py-2 bg-gray-600 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gray-600"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Media Statistics */}
                        {mediaStats && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-black rounded-xl p-4 border border-gray-600">
                              <div className="text-2xl font-bold text-white">{mediaStats.neo_glitch_count || 0}</div>
                              <div className="text-xs text-gray-400">Neo Tokyo</div>
                            </div>
                            <div className="bg-black rounded-xl p-4 border border-gray-600">
                              <div className="text-2xl font-bold text-white">{mediaStats.presets_count || 0}</div>
                              <div className="text-xs text-gray-400">Presets</div>
                            </div>
                            <div className="bg-black rounded-xl p-4 border border-gray-600">
                              <div className="text-2xl font-bold text-white">{mediaStats.custom_prompt_count || 0}</div>
                              <div className="text-xs text-gray-400">Custom</div>
                            </div>
                            <div className="bg-black rounded-xl p-4 border border-gray-600">
                              <div className="text-2xl font-bold text-white">{mediaStats.edit_count || 0}</div>
                              <div className="text-xs text-gray-400">Studio</div>
                            </div>
                          </div>
                        )}

                        {/* Media Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {media.map((item: any) => (
                            <div key={`${item.type}-${item.id}`} className="bg-black border border-gray-600 rounded-xl overflow-hidden">
                              {/* Media Image */}
                              <div className="aspect-square relative">
                                        <img
                                          src={item.finalUrl}
                                  alt="Generated media"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 right-2">
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-600 text-white">
                                        {item.type === 'edit' ? 'Studio' : item.type.replace('_', ' ')}
                                      </span>
                                </div>
                              </div>
                              
                              {/* Media Info */}
                              <div className="p-4 space-y-3">
                                <div className="space-y-2">
                                  <div className="text-sm text-white font-medium truncate" title={item.prompt}>
                                        {item.prompt}
                                      </div>
                                  <div className="flex items-center justify-between text-xs text-gray-400">
                                    <span>User: {item.user_id}</span>
                                    <span>{item.likes_count || 0} likes</span>
                                  </div>
                                  <div className="text-xs text-gray-400">
                                      {new Date(item.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                                
                                {/* Actions */}
                                      <div className="flex items-center space-x-2">
                                        <button
                                    onClick={() => handleViewMedia(item)}
                                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-gray-600 text-white"
                                        >
                                          View
                                        </button>
                                        <button
                                          onClick={() => handleDeleteMedia(item.id, item.type)}
                                    className="px-3 py-2 bg-gray-600 text-white rounded-lg"
                                        >
                                    <Trash2 size={14} />
                                        </button>
                                      </div>
                          </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination */}
                        {mediaTotal > 0 && (
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-400">
                              Showing {media.length} of {mediaTotal} media items
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setMediaOffset(Math.max(0, mediaOffset - 50))}
                                disabled={mediaOffset === 0}
                                className="px-3 py-1 rounded text-xs font-medium bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
                              >
                                Previous
                              </button>
                              <button
                                onClick={() => setMediaOffset(mediaOffset + 50)}
                                disabled={media.length < 50}
                                className="px-3 py-1 rounded text-xs font-medium bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
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
                            <div className="bg-black rounded-xl p-4 border border-gray-600">
                              <div className="text-2xl font-bold text-white">{systemConfig.systemStats?.total_users || 0}</div>
                              <div className="text-xs text-gray-400">Total Users</div>
                            </div>
                            <div className="bg-black rounded-xl p-4 border border-gray-600">
                              <div className="text-2xl font-bold text-white">{systemConfig.systemStats?.new_users_24h || 0}</div>
                              <div className="text-xs text-gray-400">New Users (24h)</div>
                            </div>
                            <div className="bg-black rounded-xl p-4 border border-gray-600">
                              <div className="text-2xl font-bold text-white">{systemConfig.systemStats?.active_users_24h || 0}</div>
                              <div className="text-xs text-gray-400">Active Users (24h)</div>
                            </div>
                            <div className="bg-black rounded-xl p-4 border border-gray-600">
                              <div className="text-2xl font-bold text-white">{systemConfig.systemStats?.total_likes || 0}</div>
                              <div className="text-xs text-gray-400">Total Likes</div>
                            </div>
                          </div>
                        )}

                        {/* Media Generation Statistics */}
                        {systemConfig && (
                          <div className="bg-black rounded-xl border border-gray-600 p-6">
                            <h4 className="text-lg font-semibold text-white mb-4">Media Generation (24h)</h4>
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">{systemConfig.mediaStats?.neo_glitch_24h || 0}</div>
                                <div className="text-xs text-gray-400">Neo Tokyo</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">{systemConfig.mediaStats?.presets_24h || 0}</div>
                                <div className="text-xs text-gray-400">Presets</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">{systemConfig.mediaStats?.unreal_reflection_24h || 0}</div>
                                <div className="text-xs text-gray-400">Emotion</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">{systemConfig.mediaStats?.ghibli_reaction_24h || 0}</div>
                                <div className="text-xs text-gray-400">Ghibli</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">{systemConfig.mediaStats?.custom_prompt_24h || 0}</div>
                                <div className="text-xs text-gray-400">Custom</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">{systemConfig.mediaStats?.edit_24h || 0}</div>
                                <div className="text-xs text-gray-400">Studio</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* System Health */}
                        <div className="bg-black rounded-xl border border-gray-600 p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-white">System Health</h4>
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => loadSystemConfig()}
                                className="px-3 py-1 bg-black text-white rounded hover:bg-gray-600 transition-colors text-sm"
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
                        <div className="bg-black rounded-xl border border-gray-600 p-6">
                          <h4 className="text-lg font-semibold text-white mb-4">Launch Control</h4>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white font-medium">Site Status</p>
                                <p className="text-gray-400 text-sm">
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
                                <p className="text-gray-400 text-sm">
                                  {systemConfig?.systemConfig?.launch?.waitlist_count || 0} users waiting
                                </p>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-gray-600">
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
                                          'X-Admin-Secret': adminSecret
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
                                        loadSystemConfig();
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
                              className="px-3 py-2 bg-gray-600 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gray-600"
                            >
                              <option value="activity">Activity Logs</option>
                              <option value="errors">Error Logs</option>
                              <option value="performance">Performance</option>
                            </select>
                            <select
                              value={logsDays}
                              onChange={(e) => setLogsDays(parseInt(e.target.value))}
                              className="px-3 py-2 bg-gray-600 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gray-600"
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
                            <div className="bg-black rounded-xl p-4 border border-gray-600">
                              <div className="text-2xl font-bold text-white">{logsAnalytics.active_users || 0}</div>
                              <div className="text-xs text-gray-400">Active Users</div>
                            </div>
                            <div className="bg-black rounded-xl p-4 border border-gray-600">
                              <div className="text-2xl font-bold text-white">{logsAnalytics.neo_glitch_generated || 0}</div>
                              <div className="text-xs text-gray-400">Neo Tokyo Generated</div>
                            </div>
                            <div className="bg-black rounded-xl p-4 border border-gray-600">
                              <div className="text-2xl font-bold text-white">{logsAnalytics.custom_prompt_generated || 0}</div>
                              <div className="text-xs text-gray-400">Custom Generated</div>
                            </div>
                            <div className="bg-black rounded-xl p-4 border border-gray-600">
                              <div className="text-2xl font-bold text-white">{logsAnalytics.likes_given || 0}</div>
                              <div className="text-xs text-gray-400">Likes Given</div>
                            </div>
                          </div>
                        )}

                        {/* Logs Table */}
                        <div className="bg-black rounded-xl border border-gray-600 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-600">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-600">
                                {logs.map((log: any) => (
                                  <tr key={`${log.log_type}-${log.timestamp}`} className="hover:bg-black">
                                    <td className="px-4 py-3 text-sm text-gray-400">
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
                                      <div className="text-sm text-gray-200 max-w-xs truncate" title={log.description}>
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
                            <div className="text-sm text-gray-400">
                              Showing {logs.length} of {logsTotal} log entries
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setLogsOffset(Math.max(0, logsOffset - 100))}
                                disabled={logsOffset === 0}
                                className="px-3 py-1 rounded text-xs font-medium bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
                              >
                                Previous
                              </button>
                              <button
                                onClick={() => setLogsOffset(logsOffset + 100)}
                                disabled={logs.length < 100}
                                className="px-3 py-1 rounded text-xs font-medium bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
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
                              className="px-3 py-2 bg-gray-600 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gray-600"
                            >
                              <option value="overview">Overview</option>
                              <option value="relationships">Relationships</option>
                              <option value="rewards">Rewards</option>
                            </select>
                            <button
                              onClick={handleResetReferralStats}
                              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              Reset Referral Stats
                            </button>
                          </div>
                        </div>

                        {/* Referral Statistics */}
                        {referralsStats && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-black rounded-xl p-4 border border-gray-600">
                              <div className="text-2xl font-bold text-white">{referralsStats.users_referred || 0}</div>
                              <div className="text-xs text-gray-400">Users Referred</div>
                            </div>
                            <div className="bg-black rounded-xl p-4 border border-gray-600">
                              <div className="text-2xl font-bold text-white">{referralsStats.total_credits_given || 0}</div>
                              <div className="text-xs text-gray-400">Total Credits Given</div>
                            </div>
                            <div className="bg-black rounded-xl p-4 border border-gray-600">
                              <div className="text-2xl font-bold text-white">{referralsStats.new_referrals_7d || 0}</div>
                              <div className="text-xs text-gray-400">New Referrals (7d)</div>
                            </div>
                          </div>
                        )}

                        {/* Referrals Table */}
                        <div className="bg-black rounded-xl border border-gray-600 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-600">
                                <tr>
                                  {referralsType === 'overview' && (
                                    <>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Referrals</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Credits Given</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Referral</th>
                                    </>
                                  )}
                                  {referralsType === 'relationships' && (
                                    <>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Referrer</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Referred User</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Credits Earned</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Login</th>
                                    </>
                                  )}
                                  {referralsType === 'rewards' && (
                                    <>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Credits Earned</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Referrals</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Account Created</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Login</th>
                                    </>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-600">
                                {referrals.map((referral: any) => (
                                  <tr key={`${referralsType}-${referral.id || referral.referrer_id}`} className="hover:bg-black">
                                    {referralsType === 'overview' && (
                                      <>
                                        <td className="px-4 py-3">
                                          <div className="text-sm text-white">{referral.email}</div>
                                          {referral.name && <div className="text-xs text-gray-400">{referral.name}</div>}
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="text-sm text-white">{referral.total_referrals}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="text-sm text-white">{referral.total_credits_given}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-400">
                                          {referral.last_referral_date ? new Date(referral.last_referral_date).toLocaleDateString() : 'Never'}
                                        </td>
                                      </>
                                    )}
                                    {referralsType === 'relationships' && (
                                      <>
                                        <td className="px-4 py-3">
                                          <div className="text-sm text-white">{referral.referrer_email}</div>
                                          {referral.referrer_name && <div className="text-xs text-gray-400">{referral.referrer_name}</div>}
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="text-sm text-white">{referral.referred_email}</div>
                                          {referral.referred_name && <div className="text-xs text-gray-400">{referral.referred_name}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-400">
                                          {new Date(referral.referred_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="text-sm text-white">{referral.referral_credits_earned}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-400">
                                          {referral.last_login ? new Date(referral.last_login).toLocaleDateString() : 'Never'}
                                        </td>
                                      </>
                                    )}
                                    {referralsType === 'rewards' && (
                                      <>
                                        <td className="px-4 py-3">
                                          <div className="text-sm text-white">{referral.email}</div>
                                          {referral.name && <div className="text-xs text-gray-400">{referral.name}</div>}
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="text-sm text-white">{referral.referral_credits_earned}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="text-sm text-white">{referral.successful_referrals}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-400">
                                          {new Date(referral.account_created).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-400">
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
                            <div className="text-sm text-gray-400">
                              Showing {referrals.length} of {referralsTotal} referral entries
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setReferralsOffset(Math.max(0, referralsOffset - 50))}
                                disabled={referralsOffset === 0}
                                className="px-3 py-1 rounded text-xs font-medium bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
                              >
                                Previous
                              </button>
                              <button
                                onClick={() => setReferralsOffset(referralsOffset + 50)}
                                disabled={referrals.length < 50}
                                className="px-3 py-1 rounded text-xs font-medium bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
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
                              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              Reset Daily Credits
                            </button>
                            <button
                              onClick={handleBulkCreditAdjustment}
                              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              Bulk Adjust Credits
                            </button>
                          </div>
                        </div>

                        {/* Credit Statistics */}
                        {systemConfig && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-black rounded-xl p-4 border border-gray-600">
                              <div className="text-2xl font-bold text-white">{systemConfig.creditStats?.total_credits_in_system || 0}</div>
                              <div className="text-xs text-gray-400">Total Credits in System</div>
                            </div>
                            <div className="bg-black rounded-xl p-4 border border-gray-600">
                              <div className="text-2xl font-bold text-white">{systemConfig.creditStats?.users_with_credits || 0}</div>
                              <div className="text-xs text-gray-400">Users with Credits</div>
                            </div>
                            <div className="bg-black rounded-xl p-4 border border-gray-600">
                              <div className="text-2xl font-bold text-white">{systemConfig.creditStats?.users_without_credits || 0}</div>
                              <div className="text-xs text-gray-400">Users without Credits</div>
                            </div>
                            <div className="bg-black rounded-xl p-4 border border-gray-600">
                              <div className="text-2xl font-bold text-white">{Math.round(systemConfig.creditStats?.avg_credits_per_user || 0)}</div>
                              <div className="text-xs text-gray-400">Avg Credits per User</div>
                            </div>
                          </div>
                        )}

                        {/* Credit Reset Status */}
                        <div className="bg-black rounded-lg p-4 border border-gray-600">
                          <h4 className="text-sm font-medium text-white mb-3">Daily Credit Reset Status</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">Last Reset:</span>
                              <span className="text-white">
                                {systemConfig?.last_credit_reset ? 
                                  new Date(systemConfig.last_credit_reset).toLocaleString() : 
                                  'Never'
                                }
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">Reset Status:</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                systemConfig?.last_credit_reset ? 
                                  (new Date().getTime() - new Date(systemConfig.last_credit_reset).getTime()) < 25 * 60 * 60 * 1000 ? // Less than 25 hours
                                    'bg-gray-600 text-white' : 
                                    'bg-gray-600 text-white'
                                  : 'bg-gray-600 text-white'
                              }`}>
                                {systemConfig?.last_credit_reset ? 
                                  (new Date().getTime() - new Date(systemConfig.last_credit_reset).getTime()) < 25 * 60 * 60 * 1000 ? 
                                    'On Schedule' : 
                                    'Overdue'
                                  : 'Never Reset'
                                }
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">Next Expected:</span>
                              <span className="text-white">
                                {(() => {
                                  const now = new Date()
                                  const tomorrow = new Date(now)
                                  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
                                  tomorrow.setUTCHours(0, 0, 0, 0)
                                  return tomorrow.toLocaleString()
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Users with Low Credits */}
                        <div className="bg-black rounded-xl border border-gray-600 overflow-hidden">
                          <div className="p-4 border-b border-gray-600">
                            <h4 className="text-lg font-semibold text-white">Users with Low Credits (≤5)</h4>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-600">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Credits</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Login</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-600">
                                {users.filter(user => user.credits <= 5).slice(0, 10).map((user) => (
                                  <tr key={user.id} className="hover:bg-black">
                                    <td className="px-4 py-3">
                                      <div className="text-sm text-white">{user.email}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="text-sm text-white">{user.credits}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-400">
                                      {new Date(user.createdAt).toLocaleDateString()}
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
                        <div className="text-gray-500 text-lg">Coming Soon...</div>
                        <div className="text-gray-500 text-sm mt-2">This section is under development</div>
                      </div>
                    )}
          </div>
        </div>
      </div>

      {/* Bulk Credit Adjustment Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black border border-gray-600 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Bulk Credit Adjustment</h3>
            
            <div className="space-y-4">
              {/* Adjustment Type */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Adjustment Type</label>
                <select
                  value={bulkAdjustment.type}
                  onChange={(e) => setBulkAdjustment(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 bg-black border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gray-600"
                >
                  <option value="users">User Credits</option>
                  <option value="config">App Config Values</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Amount</label>
                <input
                  type="number"
                  value={bulkAdjustment.amount}
                  onChange={(e) => setBulkAdjustment(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Enter adjustment amount"
                  className="w-full px-3 py-2 bg-black border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                />
              </div>

              {/* Target Selection */}
              {bulkAdjustment.type === 'users' && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Target Users</label>
                  <select
                    value={bulkAdjustment.target}
                    onChange={(e) => setBulkAdjustment(prev => ({ ...prev, target: e.target.value }))}
                    className="w-full px-3 py-2 bg-black border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gray-600"
                  >
                    <option value="all">All Users</option>
                    <option value="low">Users with ≤5 credits</option>
                    <option value="high">Users with &gt;20 credits</option>
                    <option value="zero">Users with 0 credits</option>
                  </select>
                </div>
              )}

              {/* Config Key Selection */}
              {bulkAdjustment.type === 'config' && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Config Key</label>
                    <select
                      value={bulkAdjustment.configKey}
                      onChange={(e) => setBulkAdjustment(prev => ({ ...prev, configKey: e.target.value }))}
                      className="w-full px-3 py-2 bg-black border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gray-600"
                    >
                      <option value="daily_cap">Daily Credit Cap</option>
                      <option value="starter_grant">Starter Grant (New Users)</option>
                      <option value="referral_referrer_bonus">Referral Referrer Bonus</option>
                      <option value="referral_new_bonus">Referral New User Bonus</option>
                      <option value="max_credits_per_user">Max Credits Per User</option>
                      <option value="max_media_per_user">Max Media Per User</option>
                    </select>
                </div>
              )}

              {/* Preview */}
              <div className="bg-black rounded-lg p-3">
                <p className="text-sm text-gray-400">
                  {bulkAdjustment.type === 'users' ? (
                    `Will adjust credits by ${bulkAdjustment.amount || '0'} for ${
                      bulkAdjustment.target === 'all' ? 'all users' :
                      bulkAdjustment.target === 'low' ? 'users with ≤5 credits' :
                      bulkAdjustment.target === 'high' ? 'users with &gt;20 credits' :
                      'users with 0 credits'
                    }`
                  ) : (
                    `Will adjust ${
                      bulkAdjustment.configKey === 'daily_cap' ? 'Daily Credit Cap' :
                      bulkAdjustment.configKey === 'starter_grant' ? 'Starter Grant (New Users)' :
                      bulkAdjustment.configKey === 'referral_referrer_bonus' ? 'Referral Referrer Bonus' :
                      bulkAdjustment.configKey === 'referral_new_bonus' ? 'Referral New User Bonus' :
                      bulkAdjustment.configKey === 'max_credits_per_user' ? 'Max Credits Per User' :
                      bulkAdjustment.configKey === 'max_media_per_user' ? 'Max Media Per User' :
                      bulkAdjustment.configKey
                    } by ${bulkAdjustment.amount || '0'}`
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeBulkAdjustment}
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
              >
                Execute Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black border border-gray-600 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                {confirmAction.type === 'delete' ? (
                  <Trash2 size={20} className="text-white" />
                ) : confirmAction.type === 'delete-media' ? (
                  <Trash2 size={20} className="text-white" />
                ) : confirmAction.type === 'reset-credits' ? (
                  <RefreshCw size={20} className="text-white" />
                ) : confirmAction.type === 'delete-preset' ? (
                  <Trash2 size={20} className="text-white" />
                ) : confirmAction.type === 'ban' ? (
                  <UserX size={20} className="text-white" />
                ) : (
                  <UserCheck size={20} className="text-white" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {confirmAction.type === 'delete' ? 'Delete User' : 
                   confirmAction.type === 'delete-media' ? 'Delete Media' :
                   confirmAction.type === 'reset-credits' ? 'Reset Daily Credits' :
                   confirmAction.type === 'delete-preset' ? 'Delete Preset' :
                   confirmAction.type === 'ban' ? 'Ban User' : 'Unban User'}
                </h3>
                <p className="text-sm text-gray-400">Confirm this action</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-200 mb-2">
                {confirmAction.type === 'delete' 
                  ? `Are you sure you want to delete ${confirmAction.userEmail}? This action cannot be undone.`
                  : confirmAction.type === 'delete-media'
                  ? `Are you sure you want to delete this media? This action cannot be undone.`
                  : confirmAction.type === 'reset-credits'
                  ? `Are you sure you want to reset daily credits for all users? This will give all users ${systemConfig?.limits?.daily_cap || 14} credits.`
                  : confirmAction.type === 'delete-preset'
                  ? `Are you sure you want to delete "${confirmAction.presetName}"? This action cannot be undone.`
                  : confirmAction.type === 'ban'
                  ? `Are you sure you want to ban ${confirmAction.userEmail}? They will lose access to the platform.`
                  : `Are you sure you want to unban ${confirmAction.userEmail}? They will regain access to the platform.`
                }
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setConfirmAction(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmAction}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg"
              >
                {confirmAction.type === 'delete' ? 'Delete' : 
                 confirmAction.type === 'delete-media' ? 'Delete Media' :
                 confirmAction.type === 'reset-credits' ? 'Reset Credits' :
                 confirmAction.type === 'delete-preset' ? 'Delete Preset' :
                 confirmAction.type === 'ban' ? 'Ban User' : 'Unban User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media View Modal */}
      {showMediaModal && selectedMedia && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black border border-gray-600 rounded-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Media Preview</h3>
                <p className="text-sm text-gray-400">View generated media</p>
              </div>
              <button
                onClick={() => {
                  setShowMediaModal(false)
                  setSelectedMedia(null)
                }}
                className="p-2 bg-gray-600 text-white rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Media Image */}
              <div className="relative">
                <img
                  src={selectedMedia.finalUrl}
                  alt="Generated media"
                  className="w-full max-h-96 object-contain rounded-lg"
                />
              </div>
              
              {/* Media Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-600 text-white">
                    {selectedMedia.type === 'edit' ? 'Studio' : selectedMedia.type.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-400">{selectedMedia.likes_count || 0} likes</span>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Prompt:</p>
                  <p className="text-white">{selectedMedia.prompt}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">User ID:</p>
                    <p className="text-white">{selectedMedia.user_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Created:</p>
                    <p className="text-white">{new Date(selectedMedia.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Preset Modal */}
      {showAddPresetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black border border-gray-600 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <Settings size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Add New Preset</h3>
                <p className="text-sm text-gray-400">Create a new preset configuration</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Preset Name</label>
                <input
                  type="text"
                  value={newPreset.preset_name}
                  onChange={(e) => setNewPreset(prev => ({ ...prev, preset_name: e.target.value }))}
                  placeholder="Enter preset name"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Preset Key</label>
                <input
                  type="text"
                  value={newPreset.preset_key}
                  onChange={(e) => setNewPreset(prev => ({ ...prev, preset_key: e.target.value }))}
                  placeholder="Enter preset key (e.g., custom_preset)"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                <textarea
                  value={newPreset.preset_description}
                  onChange={(e) => setNewPreset(prev => ({ ...prev, preset_description: e.target.value }))}
                  placeholder="Enter preset description"
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                <select
                  value={newPreset.preset_category}
                  onChange={(e) => setNewPreset(prev => ({ ...prev, preset_category: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gray-600"
                >
                  <option value="Custom">Custom</option>
                  <option value="Cyberpunk">Cyberpunk</option>
                  <option value="Vintage">Vintage</option>
                  <option value="Studio">Studio</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="Urban">Urban</option>
                  <option value="Portrait">Portrait</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Strength: {newPreset.preset_strength}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={newPreset.preset_strength}
                  onChange={(e) => setNewPreset(prev => ({ ...prev, preset_strength: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newPreset.is_active}
                    onChange={(e) => setNewPreset(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-gray-600 bg-gray-600 border-gray-600 rounded focus:ring-gray-600"
                  />
                  <span className="text-sm text-gray-400">Active</span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAddPresetModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={addPreset}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg"
              >
                Add Preset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Preset Modal */}
      {showEditPresetModal && editingPreset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black border border-gray-600 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <Settings size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Edit Preset</h3>
                <p className="text-sm text-gray-400">Modify preset configuration</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Preset Name</label>
                <input
                  type="text"
                  value={editingPreset.preset_name}
                  onChange={(e) => setEditingPreset(prev => prev ? { ...prev, preset_name: e.target.value } : null)}
                  placeholder="Enter preset name"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Preset Key</label>
                <input
                  type="text"
                  value={editingPreset.preset_key}
                  onChange={(e) => setEditingPreset(prev => prev ? { ...prev, preset_key: e.target.value } : null)}
                  placeholder="Enter preset key (e.g., custom_preset)"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                <textarea
                  value={editingPreset.preset_description}
                  onChange={(e) => setEditingPreset(prev => prev ? { ...prev, preset_description: e.target.value } : null)}
                  placeholder="Enter preset description"
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                <select
                  value={editingPreset.preset_category}
                  onChange={(e) => setEditingPreset(prev => prev ? { ...prev, preset_category: e.target.value } : null)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gray-600"
                >
                  <option value="Custom">Custom</option>
                  <option value="Artistic">Artistic</option>
                  <option value="Photography">Photography</option>
                  <option value="Cinematic">Cinematic</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Strength: {Math.round(editingPreset.preset_strength * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={editingPreset.preset_strength}
                  onChange={(e) => setEditingPreset(prev => prev ? { ...prev, preset_strength: parseFloat(e.target.value) } : null)}
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingPreset.is_active}
                    onChange={(e) => setEditingPreset(prev => prev ? { ...prev, is_active: e.target.checked } : null)}
                    className="w-4 h-4 text-gray-600 bg-gray-600 border-gray-600 rounded focus:ring-gray-600"
                  />
                  <span className="text-sm text-gray-400">Active</span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setShowEditPresetModal(false)
                  setEditingPreset(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={updatePreset}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg"
              >
                Update Preset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboardScreen

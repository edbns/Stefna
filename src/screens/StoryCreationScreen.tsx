import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { useNavigate } from 'react-router-dom'
import { Plus, BookOpen, List, Save, Eye, Trash2, Upload, Image } from 'lucide-react'
import { uploadToCloudinary } from '../lib/cloudinaryUpload'

interface StoryCard {
  url: string
  caption: string
  file?: File
  uploading?: boolean
  aspectRatio?: string
}

interface Story {
  id: string
  title: string
  slug: string
  teaser_text: string
  full_story_content: string
  hero_image_url: string
  hero_image_social?: string
  hero_image_thumbnail?: string
  story_images: StoryCard[]
  meta_title?: string
  meta_description?: string
  keywords?: string
  estimated_read_time?: number
  story_category?: string
  word_count?: number
  status: 'draft' | 'published' | 'archived'
  published_at?: string
  featured: boolean
  view_count: number
  created_at: string
  updated_at: string
}

const ALLOWED_USER_ID = '49b15f0e-6a2d-445d-9d32-d0a9bd859bfb'

const StoryCreationScreen: React.FC = () => {
  const navigate = useNavigate()
  const [stories, setStories] = useState<Story[]>([])
  const [currentView, setCurrentView] = useState<'list' | 'create'>('list')
  const [isLoading, setIsLoading] = useState(false)
  const [editingStory, setEditingStory] = useState<Story | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  
  const [storyForm, setStoryForm] = useState({
    title: '',
    teaser_text: '',
    hero_image_url: '',
    story_category: 'the-haunted',
    status: 'draft' as 'draft' | 'published' | 'archived',
    featured: false
  })
  
  const [heroImageUploading, setHeroImageUploading] = useState(false)
  
  const [storyCards, setStoryCards] = useState<StoryCard[]>([])

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = () => {
    // Simple authentication check using localStorage
    const authToken = localStorage.getItem('story_creation_auth')
    if (authToken === ALLOWED_USER_ID) {
      setIsAuthenticated(true)
      loadStories()
    } else {
      setIsAuthenticated(false)
    }
    setAuthChecked(true)
  }

  const handleLogin = () => {
    const password = prompt('Enter authentication token:')
    if (password === ALLOWED_USER_ID) {
      localStorage.setItem('story_creation_auth', ALLOWED_USER_ID)
      setIsAuthenticated(true)
      loadStories()
    } else {
      alert('Invalid authentication token')
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadStories()
    }
  }, [isAuthenticated])

  const loadStories = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/.netlify/functions/story-api')
      if (response.ok) {
        const data = await response.json()
        setStories(data || [])
      }
    } catch (error) {
      console.error('Failed to load stories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setStoryForm({
      title: '',
      teaser_text: '',
      hero_image_url: '',
      story_category: 'the-haunted',
      status: 'draft',
      featured: false
    })
    setStoryCards([])
    setEditingStory(null)
  }

  const addStoryCard = () => {
    setStoryCards([...storyCards, { url: '', caption: '', aspectRatio: '16:9' }])
  }

  const updateStoryCard = (index: number, field: keyof StoryCard, value: string | boolean | File) => {
    const updated = [...storyCards]
    updated[index][field] = value as any
    setStoryCards(updated)
  }

  const handleImageUpload = async (index: number, file: File) => {
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file must be less than 5MB')
      return
    }

    try {
      // Set uploading state
      updateStoryCard(index, 'uploading', true)
      
      // For now, create a data URL for immediate preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        updateStoryCard(index, 'url', dataUrl)
        updateStoryCard(index, 'uploading', false)
      }
      reader.readAsDataURL(file)
      
    } catch (error) {
      console.error('Upload failed:', error)
      updateStoryCard(index, 'uploading', false)
      alert('Preview failed. Please try again or paste an image URL manually.')
    }
  }

  const handleFileSelect = (index: number) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        updateStoryCard(index, 'file', file)
        handleImageUpload(index, file)
      }
    }
    input.click()
  }

  const handleHeroImageUpload = async (file: File) => {
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file must be less than 5MB')
      return
    }

    try {
      setHeroImageUploading(true)
      
      // For now, create a data URL for immediate preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setStoryForm({...storyForm, hero_image_url: dataUrl})
        setHeroImageUploading(false)
      }
      reader.readAsDataURL(file)
      
    } catch (error) {
      console.error('Hero image upload failed:', error)
      alert('Preview failed. Please try again or paste an image URL manually.')
      setHeroImageUploading(false)
    }
  }

  const handleHeroImageSelect = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleHeroImageUpload(file)
      }
    }
    input.click()
  }

  const removeStoryCard = (index: number) => {
    setStoryCards(storyCards.filter((_, i) => i !== index))
  }

  const saveStory = async () => {
    if (!storyForm.title || !storyForm.teaser_text) {
      alert('Title and teaser text are required')
      return
    }

    try {
      setIsLoading(true)
      
      // Generate full story content from cards
      const fullContent = storyCards
        .filter(card => card.url) // Only include cards with URLs
        .map(card => 
          card.caption ? `![Story card](${card.url})\n\n${card.caption}` : `![Story card](${card.url})`
        ).join('\n\n')

      const storyData = {
        ...storyForm,
        full_story_content: fullContent,
        story_images: storyCards.filter(card => card.url), // Only store cards with URLs
        slug: editingStory?.slug || storyForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      }

      const method = editingStory ? 'PUT' : 'POST'
      const url = editingStory 
        ? `/.netlify/functions/story-api?id=${editingStory.id}`
        : '/.netlify/functions/story-api'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(storyData)
      })

      if (response.ok) {
        await loadStories()
        resetForm()
        setCurrentView('list')
      } else {
        const error = await response.json()
        alert(`Failed to save story: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to save story:', error)
      alert('Failed to save story')
    } finally {
      setIsLoading(false)
    }
  }

  const editStory = (story: Story) => {
    setStoryForm({
      title: story.title,
      teaser_text: story.teaser_text,
      hero_image_url: story.hero_image_url,
      story_category: story.story_category || 'the-haunted',
      status: story.status,
      featured: story.featured
    })
    setStoryCards(story.story_images || [])
    setEditingStory(story)
    setCurrentView('create')
  }

  const deleteStory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/.netlify/functions/story-api?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadStories()
        alert('Story deleted successfully')
      } else {
        const error = await response.json()
        alert(`Failed to delete story: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to delete story:', error)
      alert('Failed to delete story')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking authentication
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Helmet>
          <title>Story Creation - Authentication Required</title>
          <meta name="robots" content="noindex,nofollow" />
        </Helmet>
        <div className="max-w-md mx-auto p-8 bg-white rounded-lg border border-gray-200">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Story Creation</h1>
            <p className="text-gray-600 mb-8">Authentication required to access story management</p>
            <button
              onClick={handleLogin}
              className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Authenticate to Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white absolute inset-0 overflow-auto" style={{backgroundColor: 'white !important'}}>
      <Helmet>
        <title>Story Creation</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="flex h-screen">
        {/* Fixed Sidebar - 10% width */}
        <div className="w-[10vw] bg-gray-50 border-r border-gray-200 flex flex-col items-center py-6">
          <div className="space-y-4">
            <button
              onClick={() => {
                setCurrentView('list')
                resetForm()
              }}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                currentView === 'list' 
                  ? 'bg-black text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
              title="Stories List"
            >
              <List className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => {
                resetForm()
                setCurrentView('create')
              }}
              className="w-12 h-12 rounded-lg bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors"
              title="Create New Story"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area - 90% width */}
        <div className="flex-1 overflow-auto">
          {currentView === 'list' ? (
            /* Stories List View */
            <div className="p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Story Management</h1>
                <p className="text-gray-600">Manage your fantasy stories and content</p>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                  <p className="mt-2 text-gray-600">Loading stories...</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {stories.map((story) => (
                    <div key={story.id} className="bg-white rounded-lg border border-gray-200 p-6 overflow-hidden">
                      {story.hero_image_url && (
                        <img
                          src={story.hero_image_url}
                          alt={story.title}
                          className="object-cover rounded-lg mb-4"
                          style={{ width: '400px', height: '250px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      )}
                      
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-900 line-clamp-2">{story.title}</h3>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            story.status === 'published' ? 'bg-green-100 text-green-800' :
                            story.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {story.status}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 text-sm line-clamp-3">{story.teaser_text}</p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{story.word_count || 0} words</span>
                          <span>{story.created_at.split('T')[0]}</span>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => editStory(story)}
                            className="flex-1 bg-black text-white py-2 px-3 rounded text-sm hover:bg-gray-800 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteStory(story.id)}
                            className="px-3 py-2 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50 transition-colors"
                            title="Delete Story"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                            title="View Story"
                            onClick={() => navigate(`/story/${story.slug}`)}
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Story Creation View */
            <div className="p-8">
              <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {editingStory ? 'Edit Story' : 'Create New Story'}
                  </h1>
                  <p className="text-gray-600">Design your story with multiple image and text cards</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-8">
                  {/* Story Basic Info */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Story Title *
                      </label>
                      <input
                        type="text"
                        value={storyForm.title}
                        onChange={(e) => setStoryForm({...storyForm, title: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                        placeholder="Enter story title..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Story Teaser *
                      </label>
                      <textarea
                        value={storyForm.teaser_text}
                        onChange={(e) => setStoryForm({...storyForm, teaser_text: e.target.value})}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                        placeholder="Write a brief description for your story..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hero Image
                      </label>
                      {storyForm.hero_image_url ? (
                        <div className="space-y-3">
                          <img
                            src={storyForm.hero_image_url}
                            alt="Hero image"
                            className="w-full h-40 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                          <div className="flex gap-3">
                            <button
                              onClick={handleHeroImageSelect}
                              disabled={heroImageUploading}
                              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                              <Upload className="w-4 h-4" />
                              {heroImageUploading ? 'Uploading...' : 'Replace Image'}
                            </button>
                            <button
                              onClick={() => setStoryForm({...storyForm, hero_image_url: ''})}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-black"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={handleHeroImageSelect}
                          className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-600 transition-colors"
                        >
                          {heroImageUploading ? (
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
                              <span className="text-sm text-gray-600">Uploading...</span>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <span className="text-sm text-gray-600">Click to upload hero image</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Manual URL input */}
                      <div className="mt-3">
                        <label className="block text-xs text-gray-500 mb-1">
                          For permanent storage, paste Cloudinary URL:
                        </label>
                        <input
                          type="url"
                          value={storyForm.hero_image_url}
                          onChange={(e) => setStoryForm({...storyForm, hero_image_url: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          value={storyForm.story_category}
                          onChange={(e) => setStoryForm({...storyForm, story_category: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                        >
                          <option value="the-haunted">The Haunted</option>
                          <option value="the-damned">The Damned</option>
                          <option value="the-divine">The Divine</option>
                          <option value="the-forgotten">The Forgotten</option>
                          <option value="the-masked">The Masked</option>
                          <option value="the-elemental">The Elemental</option>
                          <option value="the-eternal">The Eternal</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={storyForm.status}
                          onChange={(e) => setStoryForm({...storyForm, status: e.target.value as any})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={storyForm.featured}
                        onChange={(e) => setStoryForm({...storyForm, featured: e.target.checked})}
                        className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-600"
                      />
                      <label htmlFor="featured" className="ml-2 text-sm font-medium text-gray-700">
                        Featured Story
                      </label>
                    </div>
                  </div>

                  {/* Story Cards Section */}
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Story Cards</h3>
                    </div>

                    {storyCards.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No cards yet</p>
                        <button
                          onClick={addStoryCard}
                          className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          Create First Card
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {storyCards.map((card, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium text-gray-900">Card {index + 1}</h4>
                              <button
                                onClick={() => removeStoryCard(index)}
                                className="text-red-600 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Image Upload
                                </label>
                                {card.url ? (
                                  <div className="space-y-2">
                                    <div 
                                      className="w-full rounded-lg overflow-hidden"
                                      style={{
                                        aspectRatio: card.aspectRatio || '16:9',
                                        maxHeight: '300px'
                                      }}
                                    >
                                      <img
                                        src={card.url}
                                        alt={card.alt_text || 'Card image'}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleFileSelect(index)}
                                        disabled={card.uploading}
                                        className="flex-1 bg-black text-white py-1 px-3 rounded text-xs hover:bg-gray-800 disabled:opacity-50"
                                      >
                                        {card.uploading ? 'Uploading...' : 'Replace'}
                                      </button>
                                      <button
                                        onClick={() => updateStoryCard(index, 'url', '')}
                                        className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100 text-black"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => handleFileSelect(index)}
                                    className="w-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-600 transition-colors"
                                    style={{
                                      aspectRatio: card.aspectRatio || '16:9',
                                      maxHeight: '200px'
                                    }}
                                  >
                                    {card.uploading ? (
                                      <div className="text-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto mb-1"></div>
                                        <span className="text-xs text-gray-600">Uploading...</span>
                                      </div>
                                    ) : (
                                      <div className="text-center">
                                        <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                                        <span className="text-xs text-gray-600">Click to upload</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Aspect Ratio Selection */}
                                <div className="mt-2">
                                  <label className="block text-xs text-gray-500 mb-1">
                                    Aspect Ratio:
                                  </label>
                                  <select
                                    value={card.aspectRatio || '16:9'}
                                    onChange={(e) => updateStoryCard(index, 'aspectRatio', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-gray-600 focus:border-gray-600"
                                  >
                                    <option value="16:9">16:9 (Landscape)</option>
                                    <option value="6:19">6:19 (Portrait)</option>
                                    <option value="1:1">1:1 (Square)</option>
                                    <option value="4:3">4:3 (Classic)</option>
                                    <option value="3:4">3:4 (Portrait Classic)</option>
                                    <option value="21:9">21:9 (Ultra Wide)</option>
                                    <option value="2:3">2:3 (Photo Portrait)</option>
                                    <option value="3:2">3:2 (Photo Landscape)</option>
                                  </select>
                                </div>

                                {/* Manual URL input */}
                                <div className="mt-2">
                                  <label className="block text-xs text-gray-500 mb-1">
                                    For permanent storage, paste Cloudinary URL:
                                  </label>
                                  <input
                                    type="url"
                                    value={card.url}
                                    onChange={(e) => updateStoryCard(index, 'url', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-gray-600 focus:border-gray-600"
                                    placeholder="https://example.com/image.jpg"
                                  />
                                </div>
                              </div>
                              
                            </div>
                            
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Caption Text
                              </label>
                              <textarea
                                value={card.caption}
                                onChange={(e) => updateStoryCard(index, 'caption', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                                placeholder="Text that appears with this image..."
                              />
                            </div>
                            
                            {card.url && (
                              <div className="mt-4">
                                <img
                                  src={card.url}
                                  alt={card.alt_text || 'Card image'}
                                  className="object-cover rounded-lg"
                                  style={{ width: '400px', height: '250px', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Card Button */}
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={addStoryCard}
                      className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Card
                    </button>
                  </div>

                  {/* Save Actions */}
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {storyCards.length} card{storyCards.length !== 1 ? 's' : ''} • 
                        Draft saved automatically
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            resetForm()
                            setCurrentView('list')
                          }}
                          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveStory}
                          disabled={isLoading || !storyForm.title || !storyForm.teaser_text}
                          className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          {isLoading ? 'Saving...' : 'Save Story'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StoryCreationScreen

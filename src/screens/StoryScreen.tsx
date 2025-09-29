import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

interface StoryCard {
  url: string
  caption: string
}

interface Story {
  id: string
  title: string
  slug: string
  teaser_text: string
  full_story_content: string
  hero_image_url: string
  story_images: StoryCard[]
  story_category: string
  status: 'draft' | 'published' | 'archived'
  featured: boolean
  created_at: string
  updated_at: string
}

const StoryScreen: React.FC = () => {
  const navigate = useNavigate()
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [filteredStories, setFilteredStories] = useState<Story[]>([])

  const allCategories = [
    { value: 'the-haunted', label: 'The Haunted' },
    { value: 'the-damned', label: 'The Damned' },
    { value: 'the-divine', label: 'The Divine' },
    { value: 'the-forgotten', label: 'The Forgotten' },
    { value: 'the-masked', label: 'The Masked' },
    { value: 'the-elemental', label: 'The Elemental' },
    { value: 'the-eternal', label: 'The Eternal' }
  ]

  // Get categories that actually have stories
  const getAvailableCategories = () => {
    const storyCategories = new Set(stories.map(story => story.story_category))
    return allCategories.filter(cat => storyCategories.has(cat.value))
  }

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await fetch('/.netlify/functions/story-api')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        // Filter for published stories only
        const publishedStories = data.filter((story: Story) => story.status === 'published')
        setStories(publishedStories)
        setFilteredStories(publishedStories)
      } catch (err) {
        console.error('Failed to fetch stories:', err)
        setError('Failed to load stories')
      } finally {
        setIsLoading(false)
      }
    }
    fetchStories()
  }, [])

  // Filter stories when category changes
  useEffect(() => {
    if (selectedCategory) {
      const filtered = stories.filter(story => story.story_category === selectedCategory)
      setFilteredStories(filtered)
    } else {
      setFilteredStories(stories)
    }
  }, [selectedCategory, stories])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner text="Loading Stories..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-500 text-lg">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="story-screen">
      <Helmet>
        <title>Enter the Archive</title>
        <meta name="description" content="Tales from another life, told through shadow and flame." />
        <meta property="og:title" content="Enter the Archive" />
        <meta property="og:description" content="Tales from another life, told through shadow and flame." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://stefna.xyz/story" />
      </Helmet>

      <style>{`
        body {
          margin: 0;
          background-color: #000000;
          color: #ffffff;
          font-family: 'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          overflow-x: hidden;
        }

        /* Background layers for parallax mist/embers */
        .background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: -2;
        }
        .mist, .embers {
          position: absolute;
          width: 200%;
          height: 200%;
          background-repeat: repeat;
          opacity: 0.15;
          animation: drift 60s linear infinite;
        }
        .mist {
          background-image: url('https://www.transparenttextures.com/patterns/dark-mosaic.png');
          filter: blur(8px);
        }
        .embers {
          background-image: radial-gradient(rgba(255, 76, 76, 0.5) 2px, transparent 3px);
          background-size: 40px 40px;
          opacity: 0.2;
          animation: float 30s linear infinite;
        }

        @keyframes drift {
          from { transform: translate(0,0); }
          to { transform: translate(-50px, -50px); }
        }
        @keyframes float {
          from { transform: translateY(0); }
          to { transform: translateY(-100px); }
        }

        .categories-bar {
          padding: 1rem;
          margin-top: 5rem;
          position: relative;
          z-index: 1;
        }
        .categories-list {
          display: flex;
          gap: 0;
          justify-content: center;
          max-width: 800px;
          margin: 0 auto;
        }
        .category-button {
          padding: 0.5rem 1rem;
          border: 1px solid #333333;
          border-right: none;
          background: #000000;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
          font-size: 0.9rem;
          flex: 1;
          white-space: nowrap;
        }
        .category-button:first-child {
          border-top-left-radius: 4px;
          border-bottom-left-radius: 4px;
        }
        .category-button:last-child {
          border-right: 1px solid #333333;
          border-top-right-radius: 4px;
          border-bottom-right-radius: 4px;
        }
        .category-button:hover {
          background: #333333;
          color: #ffffff;
        }
        .category-button.selected {
          background: #ffffff;
          color: #000000;
          border-color: #ffffff;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem 1.5rem 4rem;
          position: relative;
          z-index: 1;
        }

        .card {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          background: #111;
          cursor: pointer;
          transition: transform 0.3s ease;
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
        }
        .card img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 12px 12px 0 0;
          display: block;
        }
        .card:hover {
          transform: scale(1.05);
        }

        .card-content {
          padding: 1rem;
          color: #fff;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .card-content h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.2rem;
          color: #fff;
        }
        .card-content p {
          margin: 0;
          font-size: 0.9rem;
          color: #ccc;
          line-height: 1.4;
        }

        .back-button {
          position: fixed;
          top: 1.5rem;
          left: 1.5rem;
          z-index: 50;
          width: 3rem;
          height: 3rem;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 50%;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }
        .back-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }
      `}</style>

      <div className="background">
        <div className="mist"></div>
        <div className="embers"></div>
      </div>

      {/* Floating Back Button */}
      <button 
        className="back-button"
        onClick={() => navigate('/')}
        title="Back to Home"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Category Navigation - Only show if there are categories with stories */}
      {getAvailableCategories().length > 0 && (
        <div className="categories-bar">
          <div className="categories-list">
            {getAvailableCategories().map((category, index) => (
              <button
                key={category.value}
                className={`category-button ${selectedCategory === category.value ? 'selected' : ''}`}
                onClick={() => setSelectedCategory(selectedCategory === category.value ? null : category.value)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <main>
        <div className="grid">
          {filteredStories.map((story) => (
            <Link key={story.id} to={`/story/${story.slug}`} className="card">
              <img
                src={story.hero_image_url || 'https://placehold.co/400x250'}
                alt={story.title}
              />
              <div className="card-content">
                <h3>{story.title}</h3>
                <p>{story.teaser_text}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}

export default StoryScreen
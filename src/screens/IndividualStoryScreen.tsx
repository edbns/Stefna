import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Share2 } from 'lucide-react'
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

const IndividualStoryScreen: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [story, setStory] = useState<Story | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allStories, setAllStories] = useState<Story[]>([])
  const [loadingNav, setLoadingNav] = useState(false)

  useEffect(() => {
    const fetchStory = async () => {
      if (!slug) {
        setError('Invalid story ID')
        setIsLoading(false)
        return
      }

      try {
        // Fetch current story and all stories for navigation
        const [storyResponse, allStoriesResponse] = await Promise.all([
          fetch(`/.netlify/functions/story-api?slug=${slug}`),
          fetch('/.netlify/functions/story-api')
        ])
        
        if (!storyResponse.ok) {
          throw new Error(`HTTP error! status: ${storyResponse.status}`)
        }
        
        const data = await storyResponse.json()
        const allStoriesData = await allStoriesResponse.json()
        const publishedStories = allStoriesData.filter((s: Story) => s.status === 'published')
        
        setStory(data)
        setAllStories(publishedStories)
      } catch (err) {
        console.error('Failed to fetch story:', err)
        setError('Failed to load story')
      } finally {
        setIsLoading(false)
      }
    }
    fetchStory()
  }, [slug])

  // Navigation functions
  const getNavigationStories = () => {
    if (!story || allStories.length === 0) return { previous: null, next: null }
    
    const currentIndex = allStories.findIndex(s => s.id === story.id)
    const previous = currentIndex > 0 ? allStories[currentIndex - 1] : null
    const next = currentIndex < allStories.length - 1 ? allStories[currentIndex + 1] : null
    
    return { previous, next }
  }

  const navigateToStory = async (targetStory: Story) => {
    setLoadingNav(true)
    navigate(`/story/${targetStory.slug}`)
  }

  const handleShare = async () => {
    const shareData = {
      title: story.title,
      text: story.teaser_text,
      url: `https://stefna.xyz/story/${story.slug}`
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url)
        alert('Story link copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url)
        alert('Story link copied to clipboard!')
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError)
      }
    }
  }

  const { previous, next } = getNavigationStories()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner text="Loading Story..." />
      </div>
    )
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-500 text-lg">
        <div className="text-center">
          <p className="mb-4">Story not found</p>
          <button
            onClick={() => navigate('/story')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Back to Stories
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="individual-story-screen">
      <Helmet>
        <title>{story.title} | Stefna Stories</title>
        <meta name="description" content={story.teaser_text} />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content={story.title} />
        <meta property="og:description" content={story.teaser_text} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://stefna.xyz/story/${story.slug}`} />
        <meta property="og:image" content={story.hero_image_url} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Stefna" />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={story.title} />
        <meta name="twitter:description" content={story.teaser_text} />
        <meta name="twitter:image" content={story.hero_image_url} />
        
        {/* Additional Meta Tags */}
        <meta name="author" content="Stefna" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://stefna.xyz/story/${story.slug}`} />
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

        .container {
          max-width: 800px;
          margin: 5rem auto 0;
          padding: 2rem 1.5rem;
          position: relative;
          z-index: 1;
        }

        /* Mobile responsive container */
        @media (max-width: 768px) {
          .container {
            margin: 4rem auto 0;
            padding: 1rem;
          }
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

        .share-button {
          position: fixed;
          top: 1.5rem;
          right: 1.5rem;
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
        .share-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }

        .hero-section {
          position: relative;
          margin-bottom: 4rem;
          border-radius: 16px;
          overflow: hidden;
        }

        .hero-image {
          width: 100%;
          height: 500px;
          object-fit: cover;
          display: block;
        }

        /* Mobile responsive hero section */
        @media (max-width: 768px) {
          .hero-section {
            margin-bottom: 2rem;
            border-radius: 12px;
          }

          .hero-image {
            height: 300px;
          }

          .story-title {
            font-size: 1.8rem !important;
            margin-bottom: 0.5rem !important;
          }

          .story-teaser {
            font-size: 1rem !important;
            line-height: 1.4 !important;
          }
        }

        .hero-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.9) 0%,
            rgba(0, 0, 0, 0.7) 30%,
            rgba(0, 0, 0, 0.3) 70%,
            transparent 100%
          );
          padding: 4rem 2rem 3rem;
          text-align: center;
        }

        .story-title {
          font-size: 2.5rem;
          margin: 0 0 1rem 0;
          color: #fff;
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.8);
          font-weight: 600;
        }

        .story-teaser {
          font-size: 1.3rem;
          color: #e6e6e6;
          line-height: 1.5;
          font-style: italic;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        }

        .story-card {
          display: flex;
          margin-bottom: 3rem;
          min-height: 300px;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
        }

        .story-card.reverse {
          flex-direction: row-reverse;
        }

        .story-card-image {
          flex: 1;
          position: relative;
        }

        .story-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .story-card-content {
          flex: 1;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        /* Mobile responsive - stack cards vertically */
        @media (max-width: 768px) {
          .story-card {
            flex-direction: column !important;
            min-height: auto;
          }

          .story-card-image {
            height: 250px;
          }

          .story-card-content {
            padding: 1.5rem;
          }

          .story-card-text {
            font-size: 1rem;
            line-height: 1.6;
          }
        }

        .story-card-text {
          color: #fff;
          font-size: 1.1rem;
          line-height: 1.8;
          margin: 0;
        }

        .card-number {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: bold;
        }

        .navigation-section {
          margin-top: 4rem;
          padding-top: 3rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
        }

        .nav-button {
          flex: 1;
          max-width: 300px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          text-decoration: none;
          color: white;
          transition: all 0.3s ease;
          opacity: 0.7;
          backdrop-filter: blur(10px);
        }

        .nav-button:hover {
          opacity: 1;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .nav-button.disabled {
          opacity: 0.3;
          cursor: not-allowed;
          pointer-events: none;
        }

        .nav-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .nav-content.next {
          flex-direction: row-reverse;
          text-align: right;
        }

        .nav-thumbnail {
          width: 60px;
          height: 40px;
          border-radius: 8px;
          object-fit: cover;
          background: rgba(255, 255, 255, 0.1);
        }

        .nav-info h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
        }

        .nav-info p {
          margin: 0.25rem 0 0;
          font-size: 0.8rem;
          color: #ccc;
        }

        .nav-label {
          font-size: 0.85rem;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.5rem;
          display: block;
        }

        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className="background">
        <div className="mist"></div>
        <div className="embers"></div>
      </div>

      {/* Floating Back Button */}
      <button 
        className="back-button"
        onClick={() => navigate('/story')}
        title="Back to Stories"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Floating Share Button */}
      <button 
        className="share-button"
        onClick={handleShare}
        title="Share Story"
      >
        <Share2 size={20} />
      </button>

        <div className="container">
          {/* Hero Section with Title/Teaser Overlay */}
          <div className="hero-section">
            {story.hero_image_url && (
              <img
                src={story.hero_image_url}
                alt={story.title}
                className="hero-image"
              />
            )}
            <div className="hero-overlay">
              <h1 className="story-title">{story.title}</h1>
              <p className="story-teaser">{story.teaser_text}</p>
            </div>
          </div>

          {/* Story Cards */}
          {story.story_images && story.story_images.map((imageCard, index) => (
            <div key={index} className={`story-card ${index % 2 === 1 ? 'reverse' : ''}`}>
              <div className="story-card-image">
                <img
                  src={imageCard.url}
                  alt={imageCard.caption || `Story card ${index + 1}`}
                />
                <div className="card-number">{index + 1}</div>
              </div>
              <div className="story-card-content">
                <p className="story-card-text">{imageCard.caption}</p>
              </div>
            </div>
          ))}

          {/* Navigation Section */}
          <div className="navigation-section">
            {/* Previous Story */}
            <div 
              className={`nav-button ${!previous ? 'disabled' : ''}`}
              onClick={() => previous && navigateToStory(previous)}
              style={{ cursor: previous ? 'pointer' : 'default' }}
            >
              {loadingNav ? (
                <div className="loading-overlay">
                  <div className="loading-spinner"></div>
                </div>
              ) : (
                <>
                  <span className="nav-label">Previous</span>
                  <div className="nav-content">
                    {previous && (
                      <>
                        <img 
                          src={previous.hero_image_url} 
                          alt={previous.title}
                          className="nav-thumbnail"
                        />
                        <div className="nav-info">
                          <h4>{previous.title}</h4>
                          <p>{previous.teaser_text}</p>
                        </div>
                        <ChevronLeft size={20} className="text-gray-400" />
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Next Story */}
            <div 
              className={`nav-button ${!next ? 'disabled' : ''}`}
              onClick={() => next && navigateToStory(next)}
              style={{ cursor: next ? 'pointer' : 'default' }}
            >
              {loadingNav ? (
                <div className="loading-overlay">
                  <div className="loading-spinner"></div>
                </div>
              ) : (
                <>
                  <span className="nav-label">Next</span>
                  <div className="nav-content next">
                    {next && (
                      <>
                        <ChevronRight size={20} className="text-gray-400" />
                        <div className="nav-info">
                          <h4>{next.title}</h4>
                          <p>{next.teaser_text}</p>
                        </div>
                        <img 
                          src={next.hero_image_url} 
                          alt={next.title}
                          className="nav-thumbnail"
                        />
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
    </div>
  )
}

export default IndividualStoryScreen

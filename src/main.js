import './style.css';

class SpyDash {
    constructor() {
        this.app = document.getElementById('app');
        this.isAuthenticated = false;
        this.currentUser = null;
        this.currentPlatform = 'youtube';
        this.trendingContent = [];
        this.trendingNextPageToken = null;
        this.trendingLoading = false;
        this.analyticsData = {
            engagement: {
                likes: 0,
                comments: 0,
                shares: 0,
                views: 0,
                subscribers: 0
            },
            platformDistribution: {
                youtube: 45,
                tiktok: 30,
                instagram: 15,
                twitter: 10
            },
            performance: {
                growthRate: 12.5,
                engagementRate: 8.3,
                reachRate: 15.2,
                conversionRate: 3.8
            },
            trends: [
                { month: 'Jan', views: 1200, engagement: 8.2, growth: 5.1 },
                { month: 'Feb', views: 1800, engagement: 9.1, growth: 8.3 },
                { month: 'Mar', views: 2200, engagement: 10.5, growth: 12.1 },
                { month: 'Apr', views: 2800, engagement: 11.2, growth: 15.8 },
                { month: 'May', views: 3200, engagement: 12.8, growth: 18.9 },
                { month: 'Jun', views: 3800, engagement: 13.5, growth: 22.4 }
            ]
        };
        this.aiInsights = {
            trends: [
                { topic: 'AI Development', sentiment: 'positive', growth: '+45%', prediction: 'High growth expected' },
                { topic: 'Web3 Technology', sentiment: 'positive', growth: '+32%', prediction: 'Steady increase' },
                { topic: 'Sustainable Living', sentiment: 'positive', growth: '+28%', prediction: 'Growing interest' },
                { topic: 'Remote Work', sentiment: 'neutral', growth: '+15%', prediction: 'Stable trend' },
                { topic: 'Cryptocurrency', sentiment: 'negative', growth: '-8%', prediction: 'Declining interest' }
            ],
            sentiment: {
                positive: 65,
                neutral: 25,
                negative: 10
            },
            predictions: [
                { metric: 'Views', prediction: '+25%', confidence: 85, timeframe: 'Next 30 days' },
                { metric: 'Engagement', prediction: '+18%', confidence: 78, timeframe: 'Next 30 days' },
                { metric: 'Subscribers', prediction: '+12%', confidence: 82, timeframe: 'Next 30 days' },
                { metric: 'Revenue', prediction: '+30%', confidence: 75, timeframe: 'Next 30 days' }
            ],
            recommendations: [
                { type: 'Content', suggestion: 'Focus on AI tutorials and guides', impact: 'High', effort: 'Medium' },
                { type: 'Timing', suggestion: 'Post content between 2-4 PM for maximum engagement', impact: 'Medium', effort: 'Low' },
                { type: 'Format', suggestion: 'Increase short-form video content by 40%', impact: 'High', effort: 'Medium' },
                { type: 'Collaboration', suggestion: 'Partner with tech influencers for cross-promotion', impact: 'High', effort: 'High' }
            ]
        };
        this.analyticsNextPageToken = null;
        this.analyticsLoading = false;
        this.insightsNextPageToken = null;
        this.insightsLoading = false;
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.loadTrendingContent();
        this.loadAnalyticsData();
        this.loadInsightsData();
        this.render();
        // Attach event listeners
        setTimeout(() => {
            this.attachEventListeners();
        }, 100);
        console.log('SpyDash running');
    }

    checkAuthStatus() {
        const token = localStorage.getItem('sessionToken');
        const user = localStorage.getItem('user');
        if (token && user) {
            this.isAuthenticated = true;
            this.currentUser = JSON.parse(user);
        }
    }

    async loadTrendingContent(pageToken = null) {
        if (this.trendingLoading) return;
        this.trendingLoading = true;
        try {
            let url = '/.netlify/functions/fetchYouTube?query=trending technology';
            if (pageToken) url += `&pageToken=${pageToken}`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                console.log('YouTube API response:', data);
                const newItems = data.items ? data.items.map((item, index) => ({
                    id: (this.trendingContent.length + index + 1),
                    platform: 'youtube',
                    title: item.snippet?.title || 'Untitled',
                    creator: item.snippet?.channelTitle || 'Unknown',
                    views: 'N/A',
                    thumbnail: 'icon-video',
                    trending: true,
                    videoId: item.id?.videoId || item.id,
                    category: 'technology'
                })) : [];
                if (pageToken) {
                    this.trendingContent = this.trendingContent.concat(newItems);
                } else {
                    this.trendingContent = newItems;
                }
                this.trendingNextPageToken = data.nextPageToken || null;
            } else {
                console.error('Failed to fetch YouTube data:', response.status);
                if (!pageToken) this.loadMockTrendingContent();
            }
        } catch (error) {
            console.error('Error fetching trending content:', error);
            if (!pageToken) this.loadMockTrendingContent();
        }
        this.trendingLoading = false;
        this.renderTrendingContent();
    }

    loadMockTrendingContent() {
        // Mock trending content as fallback
        this.trendingContent = [
            {
                id: 1,
                platform: 'youtube',
                title: 'How to Build a Modern Dashboard',
                creator: 'TechGuru',
                views: '2.1M',
                thumbnail: 'icon-video',
                trending: true,
                category: 'technology'
            },
            {
                id: 2,
                platform: 'tiktok',
                title: 'Quick Programming Tips',
                creator: 'CodeMaster',
                views: '1.8M',
                thumbnail: 'icon-mobile',
                trending: true,
                category: 'programming'
            },
            {
                id: 3,
                platform: 'youtube',
                title: 'AI Development Guide',
                creator: 'AIExpert',
                views: '1.5M',
                thumbnail: 'icon-ai',
                trending: true,
                category: 'ai'
            },
            {
                id: 4,
                platform: 'instagram',
                title: 'Design Trends 2024',
                creator: 'DesignPro',
                views: '950K',
                thumbnail: 'icon-camera',
                trending: true,
                category: 'design'
            }
        ];
    }

    async loadAnalyticsData(pageToken = null) {
        if (this.analyticsLoading) return;
        this.analyticsLoading = true;
        try {
            let url = '/.netlify/functions/fetchYouTube?query=analytics dashboard';
            if (pageToken) url += `&pageToken=${pageToken}`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                console.log('Analytics API response:', data);
                if (data.items && data.items.length > 0) {
                    // Append or set analytics trends
                    const newTrends = data.items.map((item, index) => ({
                        month: `Month ${(this.analyticsData.trends.length + index + 1)}`,
                        views: Math.floor(Math.random() * 5000) + 1000,
                        engagement: parseFloat((Math.random() * 10 + 5).toFixed(1)),
                        growth: parseFloat((Math.random() * 20 + 5).toFixed(1))
                    }));
                    if (pageToken) {
                        this.analyticsData.trends = this.analyticsData.trends.concat(newTrends);
                    } else {
                        this.analyticsData.trends = newTrends;
                    }
                    this.analyticsNextPageToken = data.nextPageToken || null;
                }
            } else {
                console.error('Failed to fetch analytics data:', response.status);
            }
        } catch (error) {
            console.error('Error fetching analytics data:', error);
        }
        this.analyticsLoading = false;
        this.renderAnalyticsContent();
    }

    async loadInsightsData(pageToken = null) {
        if (this.insightsLoading) return;
        this.insightsLoading = true;
        try {
            let url = '/.netlify/functions/fetchYouTube?query=ai insights trends';
            if (pageToken) url += `&pageToken=${pageToken}`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                console.log('AI Insights API response:', data);
                if (data.items && data.items.length > 0) {
                    // Append or set new insights data
                    const newTrends = data.items.map((item, index) => ({
                        topic: item.snippet?.title || `Trend ${this.aiInsights.trends.length + index + 1}`,
                        growth: `${Math.random() > 0.5 ? '+' : '-'}${Math.floor(Math.random() * 50) + 10}%`,
                        sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)],
                        prediction: `Predicted to ${Math.random() > 0.5 ? 'increase' : 'decrease'} in engagement`
                    }));
                    const newPredictions = data.items.map((item, index) => ({
                        metric: `Metric ${this.aiInsights.predictions.length + index + 1}`,
                        prediction: `${Math.random() > 0.5 ? '+' : '-'}${Math.floor(Math.random() * 30) + 5}%`,
                        confidence: Math.floor(Math.random() * 30) + 70,
                        timeframe: `${Math.floor(Math.random() * 12) + 1} months`
                    }));
                    const newRecommendations = data.items.map((item, index) => ({
                        type: `Strategy ${this.aiInsights.recommendations.length + index + 1}`,
                        impact: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
                        effort: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
                        suggestion: `Consider ${item.snippet?.title || 'this strategy'} for better performance`
                    }));
                    if (pageToken) {
                        this.aiInsights.trends = this.aiInsights.trends.concat(newTrends);
                        this.aiInsights.predictions = this.aiInsights.predictions.concat(newPredictions);
                        this.aiInsights.recommendations = this.aiInsights.recommendations.concat(newRecommendations);
                    } else {
                        this.aiInsights.trends = newTrends;
                        this.aiInsights.predictions = newPredictions;
                        this.aiInsights.recommendations = newRecommendations;
                    }
                    this.insightsNextPageToken = data.nextPageToken || null;
                }
            } else {
                console.error('Failed to fetch insights data:', response.status);
            }
        } catch (error) {
            console.error('Error fetching insights data:', error);
        }
        this.insightsLoading = false;
        this.renderInsightsContent();
    }

    render() {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = this.renderDashboard();
            this.renderAiChatModal();
            this.renderAuthModal();
        }
        // Ensure the floating AI chat button is always present
        setTimeout(() => {
            let chatBtn = document.querySelector('.concierge-chat');
            if (!chatBtn) {
                chatBtn = document.createElement('div');
                chatBtn.className = 'concierge-chat';
                chatBtn.innerHTML = `<button class="concierge-btn" id="conciergeBtn"><i class="icon-chat"></i></button>`;
                document.body.appendChild(chatBtn);
            }
            // Attach event listener
            const btn = document.getElementById('conciergeBtn');
            if (btn) {
                btn.onclick = () => this.toggleAiChat();
            }
        }, 100);
    }

    renderDashboard() {
        return `
            <div class="main-layout">
                <!-- Sidebar -->
                <div class="sidebar">
                    <div class="sidebar-header">
                        <div class="logo">
                            <img src="/logo.svg" alt="Logo" class="logo-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="logo-fallback">A</div>
                        </div>
                    </div>
                    <div class="sidebar-content">
                        <!-- User Section -->
                        <div class="user-section">
                            ${this.isAuthenticated ? `
                                <div class="user-info">
                                    <div class="user-avatar">
                                        <i class="icon-user"></i>
                                    </div>
                                    <div class="user-details">
                                        <span class="user-name">${this.currentUser?.name || this.currentUser?.email}</span>
                                        <span class="user-status">Signed In</span>
                                    </div>
                                </div>
                                <button class="logout-btn" id="logoutBtn">
                                    <i class="icon-sign-out"></i>
                                    <span>Sign Out</span>
                                </button>
                            ` : `
                                <div class="auth-section">
                                    <button class="auth-btn" id="showAuthModal">
                                        <i class="icon-sign-in"></i>
                                        <span>Login/Signup</span>
                                    </button>
                                </div>
                            `}
                        </div>
                        <!-- Main Navigation -->
                        <div class="nav-menu">
                            <button class="nav-item active" data-section="trending">
                                <i class="icon-fire"></i>
                                <span>Trending</span>
                            </button>
                            <button class="nav-item" data-section="analytics">
                                <i class="icon-chart-bar"></i>
                                <span>Analytics</span>
                            </button>
                            <button class="nav-item" data-section="insights">
                                <i class="icon-lightbulb"></i>
                                <span>AI Insights</span>
                            </button>
                            <button class="nav-item" data-section="data-collection">
                                <i class="icon-database"></i>
                                <span>Data Collection</span>
                            </button>
                            ${this.isAuthenticated ? `
                                <button class="nav-item" data-section="settings">
                                    <i class="icon-cog"></i>
                                    <span>Settings</span>
                                </button>
                            ` : ''}
                        </div>
                        <!-- Platform Filters -->
                        <div class="platform-filters">
                            <button class="platform-btn active" data-platform="all">
                                <i class="icon-globe"></i>
                                <span>All Platforms</span>
                            </button>
                            <button class="platform-btn" data-platform="youtube">
                                <i class="icon-youtube"></i>
                                <span>YouTube</span>
                            </button>
                            <button class="platform-btn" data-platform="tiktok">
                                <i class="icon-tiktok"></i>
                                <span>TikTok</span>
                            </button>
                            <button class="platform-btn" data-platform="instagram">
                                <i class="icon-instagram"></i>
                                <span>Instagram</span>
                            </button>
                            <button class="platform-btn" data-platform="twitter">
                                <i class="icon-twitter"></i>
                                <span>Twitter</span>
                            </button>
                        </div>
                        <!-- Category Filters -->
                        <div class="category-filters">
                            <button class="category-btn active" data-category="all">
                                <i class="icon-tag"></i>
                                <span>All Categories</span>
                            </button>
                            <button class="category-btn" data-category="technology">
                                <i class="icon-microchip"></i>
                                <span>Technology</span>
                            </button>
                            <button class="category-btn" data-category="entertainment">
                                <i class="icon-film"></i>
                                <span>Entertainment</span>
                            </button>
                            <button class="category-btn" data-category="education">
                                <i class="icon-graduation-cap"></i>
                                <span>Education</span>
                            </button>
                            <button class="category-btn" data-category="gaming">
                                <i class="icon-gamepad"></i>
                                <span>Gaming</span>
                            </button>
                        </div>
                    </div>
                </div>
                <!-- Main Content Area -->
                <div class="main" id="mainContent">
                    <div class="content-header">
                        <div class="search-box">
                            <input type="text" placeholder="Search content, creators, or topics..." id="searchInput">
                            <button type="button" id="searchBtn">
                                <i class="icon-search"></i>
                            </button>
                        </div>
                    </div>
                    <div class="container">
                        <div id="contentArea">
                            ${this.renderTrendingSection ? this.renderTrendingSection() : '<div>Loading...</div>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAiChatModal() {
        // Inject nuclear CSS for chat modal
        if (!document.getElementById('aiChatNuclearStyles')) {
            const style = document.createElement('style');
            style.id = 'aiChatNuclearStyles';
            style.innerHTML = `
                .ai-chat-content .ai-message, .ai-chat-content .user-message {
                    display: flex !important;
                    flex-direction: row !important;
                    align-items: flex-start !important;
                    margin-bottom: 0.5rem !important;
                    padding: 0 !important;
                    background: none !important;
                    border: none !important;
                }
                .ai-chat-content .user-message {
                    flex-direction: row-reverse !important;
                }
                .ai-chat-content .ai-avatar, .ai-chat-content .user-avatar {
                    width: 28px !important;
                    height: 28px !important;
                    min-width: 28px !important;
                    min-height: 28px !important;
                    border-radius: 50% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    margin: 0 0.4rem !important;
                    background: #2e392e !important;
                    color: #f8f6f4 !important;
                    box-shadow: none !important;
                    font-size: 1.1rem !important;
                    padding: 0 !important;
                }
                .ai-chat-content .user-avatar {
                    background: rgba(46, 57, 46, 0.1) !important;
                    color: #2e392e !important;
                }
                .ai-chat-content .ai-text, .ai-chat-content .user-text {
                    background: rgba(46, 57, 46, 0.05) !important;
                    color: #2e392e !important;
                    padding: 0.5rem 0.75rem !important;
                    border-radius: 15px !important;
                    max-width: 70% !important;
                    min-width: 50px !important;
                    word-break: break-word !important;
                    white-space: pre-wrap !important;
                    line-height: 1.3 !important;
                    font-size: 0.9rem !important;
                    margin: 0 !important;
                    box-shadow: none !important;
                }
                .ai-chat-content .user-text {
                    background: #2e392e !important;
                    color: #f8f6f4 !important;
                }
                .ai-chat-content .ai-text p, .ai-chat-content .user-text p {
                    margin: 0 !important;
                    padding: 0 !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Create modal element if it doesn't exist
        let modal = document.getElementById('aiChatModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'aiChatModal';
            modal.className = 'ai-chat-modal';
            modal.style.display = 'none';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="ai-chat-content">
                <div class="ai-chat-header">
                    <h3><i class="icon-concierge"></i> AI Concierge</h3>
                    <button class="close-btn" id="closeAiChat" title="Close chat">
                        <i class="icon-close"></i>
                    </button>
                </div>
                <div class="ai-chat-body">
                    <div class="ai-chat-messages" id="aiChatMessages">
                        <div class="ai-message">
                            <div class="ai-avatar">
                                <i class="icon-concierge"></i>
                            </div>
                            <div class="ai-text">
                                Hello! I'm your AI Concierge. How can I help you today?
                            </div>
                        </div>
                    </div>
                    <div class="ai-chat-input">
                        <input type="text" id="aiChatInput" placeholder="Ask me anything...">
                        <button id="aiChatSend" title="Send message">
                            <i class="icon-send"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Attach event listeners immediately after creating the modal
        this.attachAiChatEventListeners();
    }

    renderAuthModal() {
        const existingModal = document.getElementById('authModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'authModal';
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-modal-header">
                    <h2>Authentication</h2>
                    <button class="close-btn" id="closeAuthModal">
                        <i class="icon-close"></i>
                    </button>
                </div>
                <div class="auth-modal-body">
                    <div class="auth-tabs">
                        <button class="auth-tab active" data-tab="login">Sign In</button>
                        <button class="auth-tab" data-tab="signup">Sign Up</button>
                    </div>
                    
                    <div class="auth-form" id="loginForm">
                        <div class="form-group">
                            <label for="loginEmail">Email</label>
                            <input type="email" id="loginEmail" placeholder="Enter your email" required>
                        </div>
                        <button class="auth-btn" id="sendOTP">Send OTP</button>
                        <div class="form-group" id="otpGroup" style="display: none;">
                            <label for="otpInput">OTP</label>
                            <input type="text" id="otpInput" placeholder="Enter OTP" maxlength="6">
                            <small>Enter the 6-digit code sent to your email</small>
                        </div>
                        <button class="auth-btn" id="verifyOTP" style="display: none;">Verify OTP</button>
                    </div>
                    
                    <div class="auth-form" id="signupForm" style="display: none;">
                        <div class="form-group">
                            <label for="signupName">Full Name</label>
                            <input type="text" id="signupName" placeholder="Enter your full name" required>
                        </div>
                        <div class="form-group">
                            <label for="signupEmail">Email</label>
                            <input type="email" id="signupEmail" placeholder="Enter your email" required>
                        </div>
                        <button class="auth-btn" id="signupBtn">Create Account</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.attachAuthEventListeners();
    }

    renderTrendingContent() {
        const grid = document.getElementById('contentGrid');
        if (!grid) return;
        grid.innerHTML = (this.trendingContent && this.trendingContent.length > 0)
            ? this.trendingContent.map(item => this.renderContentCard(item)).join('')
            : '<div class="no-results"><p>No trending content found.</p></div>';
        // Add loading spinner if loading
        if (this.trendingLoading) {
            const spinner = document.createElement('div');
            spinner.className = 'loading';
            spinner.innerHTML = '<div class="spinner"></div><span>Loading more...</span>';
            grid.appendChild(spinner);
        }
    }

    getPlatformIcon(platform) {
        const icons = {
            'youtube': '<i class="icon-youtube"></i>',
            'tiktok': '<i class="icon-tiktok"></i>',
            'instagram': '<i class="icon-instagram"></i>',
            'twitter': '<i class="icon-twitter"></i>'
        };
        return icons[platform.toLowerCase()] || '<i class="icon-globe"></i>';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    renderPieChart() {
        const { youtube, tiktok, instagram, twitter } = this.analyticsData.platformDistribution;
        return `
            <svg width="200" height="200" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#2e392e" stroke-width="40" 
                    stroke-dasharray="${youtube * 5.02} ${(100 - youtube) * 5.02}" 
                    stroke-dashoffset="0" transform="rotate(-90 100 100)"/>
                <circle cx="100" cy="100" r="80" fill="none" stroke="#f8f6f4" stroke-width="40" 
                    stroke-dasharray="${tiktok * 5.02} ${(100 - tiktok) * 5.02}" 
                    stroke-dashoffset="${-youtube * 5.02}" transform="rotate(-90 100 100)"/>
                <circle cx="100" cy="100" r="80" fill="none" stroke="#e74c3c" stroke-width="40" 
                    stroke-dasharray="${instagram * 5.02} ${(100 - instagram) * 5.02}" 
                    stroke-dashoffset="${-(youtube + tiktok) * 5.02}" transform="rotate(-90 100 100)"/>
                <circle cx="100" cy="100" r="80" fill="none" stroke="#3498db" stroke-width="40" 
                    stroke-dasharray="${twitter * 5.02} ${(100 - twitter) * 5.02}" 
                    stroke-dashoffset="${-(youtube + tiktok + instagram) * 5.02}" transform="rotate(-90 100 100)"/>
            </svg>
        `;
    }

    renderPlatformLegend() {
        return `
            <div class="legend-item">
                <span class="legend-color" style="background: #2e392e;"></span>
                <span>YouTube</span>
            </div>
            <div class="legend-item">
                <span class="legend-color" style="background: #f8f6f4;"></span>
                <span>TikTok</span>
            </div>
            <div class="legend-item">
                <span class="legend-color" style="background: #e74c3c;"></span>
                <span>Instagram</span>
            </div>
            <div class="legend-item">
                <span class="legend-color" style="background: #3498db;"></span>
                <span>Twitter</span>
            </div>
        `;
    }

    renderLineChart(type) {
        const data = this.analyticsData.trends;
        const maxValue = Math.max(...data.map(d => d[type]));
        const minValue = Math.min(...data.map(d => d[type]));
        const range = maxValue - minValue;
        
        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((d[type] - minValue) / range) * 80;
            return `${x},${y}`;
        }).join(' ');

        return `
            <svg width="100%" height="150" viewBox="0 0 100 100">
                <polyline fill="none" stroke="#2e392e" stroke-width="2" points="${points}"/>
                ${data.map((d, i) => {
                    const x = (i / (data.length - 1)) * 100;
                    const y = 100 - ((d[type] - minValue) / range) * 80;
                    return `<circle cx="${x}" cy="${y}" r="3" fill="#2e392e"/>`;
                }).join('')}
            </svg>
        `;
    }

    renderTopContentTable() {
        const topContent = [
            { title: 'How to Build a Modern Dashboard', platform: 'YouTube', views: '2.1M', engagement: '8.5%', growth: '+15%' },
            { title: 'Quick Programming Tips', platform: 'TikTok', views: '1.8M', engagement: '12.3%', growth: '+22%' },
            { title: 'AI Development Guide', platform: 'YouTube', views: '1.5M', engagement: '9.8%', growth: '+18%' },
            { title: 'Design Trends 2024', platform: 'Instagram', views: '950K', engagement: '14.2%', growth: '+25%' }
        ];

        return topContent.map(item => `
            <div class="table-row">
                <div class="table-cell">
                    <div class="content-info-cell">
                        <div class="content-title">${item.title}</div>
                        <div class="content-platform">${this.getPlatformIcon(item.platform.toLowerCase())} ${item.platform}</div>
                    </div>
                </div>
                <div class="table-cell">${item.platform}</div>
                <div class="table-cell">${item.views}</div>
                <div class="table-cell">${item.engagement}</div>
                <div class="table-cell positive">${item.growth}</div>
            </div>
        `).join('');
    }

    renderTrendAnalysis() {
        return this.aiInsights.trends.map(trend => `
            <div class="trend-card ${trend.sentiment}">
                <div class="trend-header">
                    <h4>${trend.topic}</h4>
                    <span class="trend-growth ${trend.growth.startsWith('+') ? 'positive' : 'negative'}">${trend.growth}</span>
                </div>
                <div class="trend-sentiment">
                    <span class="sentiment-indicator ${trend.sentiment}">
                        <i class="icon-${trend.sentiment === 'positive' ? 'trending-up' : trend.sentiment === 'negative' ? 'trending-down' : 'trending-neutral'}"></i>
                    </span>
                    <span class="sentiment-text">${trend.sentiment.charAt(0).toUpperCase() + trend.sentiment.slice(1)}</span>
                </div>
                <div class="trend-prediction">
                    <p>${trend.prediction}</p>
                </div>
            </div>
        `).join('');
    }

    renderSentimentChart() {
        const { positive, neutral, negative } = this.aiInsights.sentiment;
        const total = positive + neutral + negative;
        
        return `
            <svg width="200" height="200" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#4CAF50" stroke-width="40" 
                    stroke-dasharray="${(positive / total) * 502.4} ${(1 - positive / total) * 502.4}" 
                    stroke-dashoffset="0" transform="rotate(-90 100 100)"/>
                <circle cx="100" cy="100" r="80" fill="none" stroke="#FF9800" stroke-width="40" 
                    stroke-dasharray="${(neutral / total) * 502.4} ${(1 - neutral / total) * 502.4}" 
                    stroke-dashoffset="${-this.aiInsights.sentiment.positive * 5.02}" transform="rotate(-90 100 100)"/>
                <circle cx="100" cy="100" r="80" fill="none" stroke="#F44336" stroke-width="40" 
                    stroke-dasharray="${(negative / total) * 502.4} ${(1 - negative / total) * 502.4}" 
                    stroke-dashoffset="${-((this.aiInsights.sentiment.positive + this.aiInsights.sentiment.neutral) / total) * 502.4}" transform="rotate(-90 100 100)"/>
            </svg>
        `;
    }

    renderPredictions() {
        return this.aiInsights.predictions.map(prediction => `
            <div class="prediction-card">
                <div class="prediction-header">
                    <h4>${prediction.metric}</h4>
                    <span class="prediction-value ${prediction.prediction.startsWith('+') ? 'positive' : 'negative'}">${prediction.prediction}</span>
                </div>
                <div class="prediction-confidence">
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${prediction.confidence}%"></div>
                    </div>
                    <span class="confidence-text">${prediction.confidence}% confidence</span>
                </div>
                <div class="prediction-timeframe">
                    <span>${prediction.timeframe}</span>
                </div>
            </div>
        `).join('');
    }

    renderRecommendations() {
        return this.aiInsights.recommendations.map(rec => `
            <div class="recommendation-card">
                <div class="recommendation-header">
                    <span class="recommendation-type">${rec.type}</span>
                    <div class="impact-effort">
                        <span class="impact ${rec.impact.toLowerCase()}">${rec.impact} Impact</span>
                        <span class="effort ${rec.effort.toLowerCase()}">${rec.effort} Effort</span>
                    </div>
                </div>
                <div class="recommendation-content">
                    <p>${rec.suggestion}</p>
                </div>
                <button class="apply-recommendation-btn">Apply Recommendation</button>
            </div>
        `).join('');
    }

    showSection(sectionName) {
        const contentArea = document.getElementById('contentArea');
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');
        
        switch(sectionName) {
            case 'trending':
                contentArea.innerHTML = this.renderTrendingSection();
                break;
            case 'analytics':
                contentArea.innerHTML = this.renderAnalyticsSection();
                break;
            case 'insights':
                contentArea.innerHTML = this.renderInsightsSection();
                break;
            case 'data-collection':
                contentArea.innerHTML = this.renderDataCollectionSection();
                break;
            case 'settings':
                if (this.isAuthenticated) {
                    contentArea.innerHTML = this.renderSettingsSection();
                } else {
                    this.showNotification('Please sign in to access settings', 'error');
                }
                break;
            default:
                contentArea.innerHTML = this.renderTrendingSection();
        }
    }

    renderTrendingSection() {
        return `
            <div class="trending-section">
                <div class="section-header">
                    <h2>Trending Content</h2>
                    <p>Discover what's trending across all platforms</p>
                </div>
                
                <div class="trending-container">
                    <div class="content-grid" id="contentGrid">
                        ${this.renderTrendingContent()}
                    </div>
                </div>
            </div>
        `;
    }

    renderAnalyticsSection() {
        return `
            <div class="analytics-section">
                <div class="analytics-header">
                    <h2>Analytics Dashboard</h2>
                    <p>Comprehensive insights into content performance and audience engagement</p>
                </div>

                <!-- Channel Analysis -->
                <div class="channel-analysis-section">
                    <div class="search-box">
                        <input type="text" id="channelInput" placeholder="Enter YouTube channel URL or username">
                        <button id="analyzeBtn">Analyze Channel</button>
                    </div>
                </div>

                <!-- Metrics Section -->
                <div class="metrics-section">
                    <h3>Engagement Metrics</h3>
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <div class="metric-icon">
                                <i class="icon-chart-bar"></i>
                            </div>
                            <div class="metric-content">
                                <h4>Total Views</h4>
                                <div class="metric-value">${this.formatNumber(this.analyticsData.engagement.views)}</div>
                                <div class="metric-change positive">+12.5%</div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon">
                                <i class="icon-heart"></i>
                            </div>
                            <div class="metric-content">
                                <h4>Likes</h4>
                                <div class="metric-value">${this.formatNumber(this.analyticsData.engagement.likes)}</div>
                                <div class="metric-change positive">+8.3%</div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon">
                                <i class="icon-comment"></i>
                            </div>
                            <div class="metric-content">
                                <h4>Comments</h4>
                                <div class="metric-value">${this.formatNumber(this.analyticsData.engagement.comments)}</div>
                                <div class="metric-change positive">+15.2%</div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon">
                                <i class="icon-user"></i>
                            </div>
                            <div class="metric-content">
                                <h4>Subscribers</h4>
                                <div class="metric-value">${this.formatNumber(this.analyticsData.engagement.subscribers)}</div>
                                <div class="metric-change positive">+3.8%</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Platform Distribution -->
                <div class="platform-distribution-section">
                    <h3>Platform Distribution</h3>
                    <div class="distribution-container">
                        <div class="distribution-chart">
                            <div class="pie-chart">
                                ${this.renderPieChart()}
                            </div>
                            <div class="platform-legend">
                                ${this.renderPlatformLegend()}
                            </div>
                        </div>
                        <div class="distribution-stats">
                            <div class="platform-stat">
                                <div class="platform-name">YouTube</div>
                                <div class="platform-percentage">${this.analyticsData.platformDistribution.youtube}%</div>
                            </div>
                            <div class="platform-stat">
                                <div class="platform-name">TikTok</div>
                                <div class="platform-percentage">${this.analyticsData.platformDistribution.tiktok}%</div>
                            </div>
                            <div class="platform-stat">
                                <div class="platform-name">Instagram</div>
                                <div class="platform-percentage">${this.analyticsData.platformDistribution.instagram}%</div>
                            </div>
                            <div class="platform-stat">
                                <div class="platform-name">Twitter</div>
                                <div class="platform-percentage">${this.analyticsData.platformDistribution.twitter}%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderInsightsSection() {
        return `
            <div class="ai-insights-section">
                <div class="ai-insights-header">
                    <h2>AI-Powered Insights</h2>
                    <p>Advanced analytics and machine learning insights for content strategy optimization</p>
                </div>

                <!-- Trend Analysis -->
                <div class="trend-analysis-section">
                    <h3>Trend Analysis</h3>
                    <div class="trends-grid">
                        ${this.renderTrendAnalysis()}
                    </div>
                </div>

                <!-- Sentiment Analysis -->
                <div class="sentiment-analysis-section">
                    <h3>Sentiment Analysis</h3>
                    <div class="sentiment-container">
                        <div class="sentiment-chart">
                            <svg width="200" height="200" viewBox="0 0 200 200">
                                <circle cx="100" cy="100" r="80" fill="none" stroke="#4CAF50" stroke-width="40" 
                                    stroke-dasharray="${this.aiInsights.sentiment.positive * 5.02} ${(100 - this.aiInsights.sentiment.positive) * 5.02}" 
                                    stroke-dashoffset="0" transform="rotate(-90 100 100)"/>
                                <circle cx="100" cy="100" r="80" fill="none" stroke="#FF9800" stroke-width="40" 
                                    stroke-dasharray="${this.aiInsights.sentiment.neutral * 5.02} ${(100 - this.aiInsights.sentiment.neutral) * 5.02}" 
                                    stroke-dashoffset="${-this.aiInsights.sentiment.positive * 5.02}" transform="rotate(-90 100 100)"/>
                                <circle cx="100" cy="100" r="80" fill="none" stroke="#F44336" stroke-width="40" 
                                    stroke-dasharray="${this.aiInsights.sentiment.negative * 5.02} ${(100 - this.aiInsights.sentiment.negative) * 5.02}" 
                                    stroke-dashoffset="${-((this.aiInsights.sentiment.positive + this.aiInsights.sentiment.neutral) / (this.aiInsights.sentiment.positive + this.aiInsights.sentiment.neutral + this.aiInsights.sentiment.negative)) * 502.4}" transform="rotate(-90 100 100)"/>
                            </svg>
                        </div>
                        <div class="sentiment-breakdown">
                            ${this.renderSentimentChart()}
                        </div>
                    </div>
                </div>

                <!-- AI Predictions -->
                <div class="predictions-section">
                    <h3>AI Predictions</h3>
                    <div class="predictions-grid">
                        ${this.renderPredictions()}
                    </div>
                </div>

                <!-- AI Recommendations -->
                <div class="recommendations-section">
                    <h3>AI Recommendations</h3>
                    <div class="recommendations-grid">
                        ${this.renderRecommendations()}
                    </div>
                </div>
            </div>
        `;
    }

    renderDataCollectionSection() {
        return `
            <div class="data-collection-section">
                <div class="data-collection-header">
                    <h2>Data Collection & Analytics</h2>
                    <p>Comprehensive data collection and analysis across all platforms</p>
                </div>

                <div class="data-collection-grid">
                    <div class="data-card">
                        <div class="data-card-header">
                            <i class="icon-user"></i>
                            <h3>Public Profile Data</h3>
                        </div>
                        <div class="data-card-content">
                            <p>Collect and analyze public profile information from social media platforms</p>
                            <div class="data-stats">
                                <div class="stat-item">
                                    <span class="stat-label">Profiles Analyzed</span>
                                    <span class="stat-value">1,247</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Data Points</span>
                                    <span class="stat-value">15,892</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="data-card">
                        <div class="data-card-header">
                            <i class="icon-chart-bar"></i>
                            <h3>Follower Analytics</h3>
                        </div>
                        <div class="data-card-content">
                            <p>Track follower growth patterns and engagement metrics over time</p>
                            <div class="data-stats">
                                <div class="stat-item">
                                    <span class="stat-label">Growth Rate</span>
                                    <span class="stat-value">+12.5%</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Engagement Rate</span>
                                    <span class="stat-value">8.3%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="data-card">
                        <div class="data-card-header">
                            <i class="icon-heart"></i>
                            <h3>Like & Engagement Metrics</h3>
                        </div>
                        <div class="data-card-content">
                            <p>Monitor likes, comments, shares, and other engagement indicators</p>
                            <div class="data-stats">
                                <div class="stat-item">
                                    <span class="stat-label">Total Likes</span>
                                    <span class="stat-value">2.4M</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Comments</span>
                                    <span class="stat-value">156K</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="data-card">
                        <div class="data-card-header">
                            <i class="icon-fire"></i>
                            <h3>Trend Analysis</h3>
                        </div>
                        <div class="data-card-content">
                            <p>Analyze trending topics, hashtags, and viral content patterns</p>
                            <div class="data-stats">
                                <div class="stat-item">
                                    <span class="stat-label">Trending Topics</span>
                                    <span class="stat-value">89</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Viral Content</span>
                                    <span class="stat-value">234</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="data-card">
                        <div class="data-card-header">
                            <i class="icon-video"></i>
                            <h3>Shorts/Short-form Content</h3>
                        </div>
                        <div class="data-card-content">
                            <p>Track performance of short-form video content across platforms</p>
                            <div class="data-stats">
                                <div class="stat-item">
                                    <span class="stat-label">Shorts Created</span>
                                    <span class="stat-value">567</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Avg. Views</span>
                                    <span class="stat-value">45.2K</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="data-card">
                        <div class="data-card-header">
                            <i class="icon-user"></i>
                            <h3>Demographics</h3>
                        </div>
                        <div class="data-card-content">
                            <p>Audience demographic analysis and segmentation</p>
                            <div class="data-stats">
                                <div class="stat-item">
                                    <span class="stat-label">Age Groups</span>
                                    <span class="stat-value">5</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Countries</span>
                                    <span class="stat-value">23</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="data-card">
                        <div class="data-card-header">
                            <i class="icon-lightbulb"></i>
                            <h3>Sentiment Analysis</h3>
                        </div>
                        <div class="data-card-content">
                            <p>AI-powered sentiment analysis of comments and reactions</p>
                            <div class="data-stats">
                                <div class="stat-item">
                                    <span class="stat-label">Positive</span>
                                    <span class="stat-value">78%</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Negative</span>
                                    <span class="stat-value">12%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="data-card">
                        <div class="data-card-header">
                            <i class="icon-globe"></i>
                            <h3>Geographic Data</h3>
                        </div>
                        <div class="data-card-content">
                            <p>Location-based trending content and audience distribution</p>
                            <div class="data-stats">
                                <div class="stat-item">
                                    <span class="stat-label">Top Location</span>
                                    <span class="stat-value">USA</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Regions</span>
                                    <span class="stat-value">12</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSettingsSection() {
        return `
            <div class="settings-section">
                <div class="settings-header">
                    <h2>Settings & Configuration</h2>
                    <p>Manage your account, data sources, privacy settings, and API configurations</p>
                </div>

                <!-- Account Management -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <h3>Account Management</h3>
                        <div class="settings-status">Active</div>
                    </div>
                    <div class="settings-content">
                        <div class="account-info">
                            <div class="account-avatar">
                                <i class="icon-user"></i>
                            </div>
                            <div class="account-details">
                                <h4>${this.currentUser?.name || 'User'}</h4>
                                <p>${this.currentUser?.email || 'user@example.com'}</p>
                            </div>
                            <div class="account-status">
                                <span class="status-indicator connected"></span>
                                Premium
                            </div>
                        </div>
                        <div class="account-actions">
                            <button class="settings-btn">Edit Profile</button>
                            <button class="settings-btn">Change Password</button>
                            <button class="settings-btn danger">Delete Account</button>
                        </div>
                    </div>
                </div>

                <!-- Data Source Configuration -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <h3>Data Source Configuration</h3>
                        <div class="settings-status">Connected</div>
                    </div>
                    <div class="settings-content">
                        <div class="data-sources-grid">
                            <div class="data-source-item">
                                <div class="data-source-info">
                                    <div class="data-source-icon">
                                        <i class="icon-youtube"></i>
                                    </div>
                                    <div>
                                        <h4>YouTube API</h4>
                                        <p>Connected for channel analytics and content insights</p>
                                    </div>
                                </div>
                                <div class="data-source-status">
                                    <span class="status-indicator connected"></span>
                                    Active
                                </div>
                                <div class="data-source-actions">
                                    <button class="settings-btn small">Configure</button>
                                    <button class="settings-btn small">Test</button>
                                </div>
                            </div>
                            <div class="data-source-item">
                                <div class="data-source-info">
                                    <div class="data-source-icon">
                                        <i class="icon-ai"></i>
                                    </div>
                                    <div>
                                        <h4>OpenAI API</h4>
                                        <p>Connected for AI-powered insights and recommendations</p>
                                    </div>
                                </div>
                                <div class="data-source-status">
                                    <span class="status-indicator connected"></span>
                                    Active
                                </div>
                                <div class="data-source-actions">
                                    <button class="settings-btn small">Configure</button>
                                    <button class="settings-btn small">Test</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Privacy Settings -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <h3>Privacy Settings</h3>
                        <div class="settings-status">Protected</div>
                    </div>
                    <div class="settings-content">
                        <div class="privacy-options">
                            <div class="privacy-option">
                                <div class="privacy-option-info">
                                    <h4>Data Collection</h4>
                                    <p>Allow us to collect usage data for analytics and improvements</p>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            <div class="privacy-option">
                                <div class="privacy-option-info">
                                    <h4>Personalized Recommendations</h4>
                                    <p>Receive personalized content and strategy recommendations</p>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                this.showSection(item.dataset.section);
            });
        });

        // Platform filters
        const platformBtns = document.querySelectorAll('.platform-btn');
        platformBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                platformBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterByPlatform(btn.dataset.platform);
            });
        });

        // Category filters
        const categoryBtns = document.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterByCategory(btn.dataset.category);
            });
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchInput && searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch(searchInput.value);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(searchInput.value);
                }
            });
        }

        // Authentication
        const showAuthModal = document.getElementById('showAuthModal');
        if (showAuthModal) {
            showAuthModal.addEventListener('click', () => {
                this.showAuthModal();
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // AI Chat functionality is now handled in attachAiChatEventListeners()

        // Floating AI Chat Button
        const conciergeBtn = document.querySelector('.concierge-btn');
        if (conciergeBtn) {
            conciergeBtn.addEventListener('click', () => {
                const aiChatModal = document.getElementById('aiChatModal');
                if (aiChatModal) {
                    aiChatModal.style.display = 'flex';
                    setTimeout(() => {
                        const input = document.getElementById('aiChatInput');
                        if (input) input.focus();
                    }, 100);
                }
            });
        }

        // Analyze Channel button
        const analyzeBtn = document.getElementById('analyzeBtn');
        const channelInput = document.getElementById('channelInput');
        if (analyzeBtn && channelInput) {
            analyzeBtn.addEventListener('click', async () => {
                const channelUrl = channelInput.value.trim();
                if (!channelUrl) {
                    this.showError('Please enter a YouTube channel URL or username.');
                    return;
                }
                this.showLoading(true);
                try {
                    const response = await fetch('/.netlify/functions/fetchYouTube?query=' + encodeURIComponent(channelUrl));
                    if (response.ok) {
                        const data = await response.json();
                        this.analyticsData = this.transformAnalyticsData(data);
                        this.showSuccess('Channel analytics loaded!');
                        this.showSection('analytics');
                    } else {
                        this.showError('Failed to fetch channel analytics.');
                    }
                } catch (err) {
                    this.showError('Error fetching channel analytics.');
                }
                this.showLoading(false);
            });
        }

        // Infinite scroll for trending content
        const grid = document.getElementById('contentGrid');
        if (grid) {
            grid.onscroll = () => {
                if (this.trendingNextPageToken && !this.trendingLoading) {
                    const nearBottom = grid.scrollTop + grid.clientHeight >= grid.scrollHeight - 200;
                    if (nearBottom) {
                        this.loadTrendingContent(this.trendingNextPageToken);
                    }
                }
            };
        }

        // Infinite scroll for analytics content
        const analyticsGrid = document.getElementById('analyticsGrid');
        if (analyticsGrid) {
            analyticsGrid.onscroll = () => {
                if (this.analyticsNextPageToken && !this.analyticsLoading) {
                    const nearBottom = analyticsGrid.scrollTop + analyticsGrid.clientHeight >= analyticsGrid.scrollHeight - 200;
                    if (nearBottom) {
                        this.loadAnalyticsData(this.analyticsNextPageToken);
                    }
                }
            };
        }

        // Infinite scroll for AI Insights content
        const trendsGrid = document.querySelector('.trends-grid');
        if (trendsGrid) {
            trendsGrid.onscroll = () => {
                if (this.insightsNextPageToken && !this.insightsLoading) {
                    const nearBottom = trendsGrid.scrollTop + trendsGrid.clientHeight >= trendsGrid.scrollHeight - 200;
                    if (nearBottom) {
                        this.loadInsightsData(this.insightsNextPageToken);
                    }
                }
            };
        }
        const predictionsGrid = document.querySelector('.predictions-grid');
        if (predictionsGrid) {
            predictionsGrid.onscroll = () => {
                if (this.insightsNextPageToken && !this.insightsLoading) {
                    const nearBottom = predictionsGrid.scrollTop + predictionsGrid.clientHeight >= predictionsGrid.scrollHeight - 200;
                    if (nearBottom) {
                        this.loadInsightsData(this.insightsNextPageToken);
                    }
                }
            };
        }
        const recommendationsGrid = document.querySelector('.recommendations-grid');
        if (recommendationsGrid) {
            recommendationsGrid.onscroll = () => {
                if (this.insightsNextPageToken && !this.insightsLoading) {
                    const nearBottom = recommendationsGrid.scrollTop + recommendationsGrid.clientHeight >= recommendationsGrid.scrollHeight - 200;
                    if (nearBottom) {
                        this.loadInsightsData(this.insightsNextPageToken);
                    }
                }
            };
        }
    }

    switchTab(tab) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Show/hide sections
        const trendingSection = document.querySelector('.trending-section');
        const analyticsSection = document.getElementById('analyticsSection');
        const aiInsightsSection = document.getElementById('aiInsightsSection');
        const settingsSection = document.getElementById('settingsSection');

        if (tab === 'trending') {
            trendingSection.style.display = 'block';
            analyticsSection.style.display = 'none';
            aiInsightsSection.style.display = 'none';
            settingsSection.style.display = 'none';
        } else if (tab === 'analytics') {
            trendingSection.style.display = 'none';
            analyticsSection.style.display = 'block';
            aiInsightsSection.style.display = 'none';
            settingsSection.style.display = 'none';
        } else if (tab === 'insights') {
            trendingSection.style.display = 'none';
            analyticsSection.style.display = 'none';
            aiInsightsSection.style.display = 'block';
            settingsSection.style.display = 'none';
        } else if (tab === 'settings') {
            trendingSection.style.display = 'none';
            analyticsSection.style.display = 'none';
            aiInsightsSection.style.display = 'none';
            settingsSection.style.display = 'block';
        }
    }

    async performSearch(query) {
        if (!query.trim()) return;
        
        if (!this.trendingContent) {
            this.trendingContent = [];
        }
        
        // Filter content based on search query
        const filteredContent = this.trendingContent.filter(item => 
            item.title && item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.creator && item.creator.toLowerCase().includes(query.toLowerCase()) ||
            item.platform && item.platform.toLowerCase().includes(query.toLowerCase())
        );
        
        // Try to get AI insights for the search query
        try {
            const response = await fetch('/.netlify/functions/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: `Search query: ${query}. Found ${filteredContent.length} results.`,
                    maxLength: 150
                })
            });

            if (response.ok) {
                const aiData = await response.json();
                console.log('AI search insights:', aiData);
                // You can use the AI insights to enhance search results
            }
        } catch (error) {
            console.error('Error getting AI search insights:', error);
        }
        
        this.renderSearchResults(filteredContent, query);
    }

    renderSearchResults(results, query) {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="search-results-section">
                <div class="section-header">
                    <h2>Search Results for "${query}"</h2>
                    <p>Found ${results.length} results</p>
                </div>
                
                <div class="content-grid">
                    ${results.length > 0 ? 
                        results.map(item => this.renderContentCard(item)).join('') :
                        '<div class="no-results"><p>No results found. Try a different search term.</p></div>'
                    }
                </div>
            </div>
        `;
    }

    filterByPlatform(platform) {
        if (platform === 'all') {
            this.showSection('trending');
            return;
        }
        
        if (!this.trendingContent) {
            this.trendingContent = [];
        }
        
        const filteredContent = this.trendingContent.filter(item => 
            item.platform && item.platform.toLowerCase() === platform.toLowerCase()
        );
        
        this.renderFilteredContent(filteredContent, platform);
    }

    filterByCategory(category) {
        if (category === 'all') {
            this.showSection('trending');
            return;
        }
        
        if (!this.trendingContent) {
            this.trendingContent = [];
        }
        
        const filteredContent = this.trendingContent.filter(item => 
            item.category && item.category.toLowerCase() === category.toLowerCase()
        );
        
        this.renderFilteredContent(filteredContent, category);
    }

    renderFilteredContent(content, filter) {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="filtered-content-section">
                <div class="section-header">
                    <h2>${filter.charAt(0).toUpperCase() + filter.slice(1)} Content</h2>
                    <p>Showing ${content.length} items</p>
                </div>
                
                <div class="content-grid">
                    ${content.length > 0 ? 
                        content.map(item => this.renderContentCard(item)).join('') :
                        '<div class="no-results"><p>No content found for this filter.</p></div>'
                    }
                </div>
            </div>
        `;
    }

    showAuthModal() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.style.display = 'flex';
        }
    }

    async sendOTP() {
        const email = document.getElementById('loginEmail').value;
        if (!email) {
            this.showNotification('Please enter your email', 'error');
            return;
        }

        try {
            const response = await fetch('/.netlify/functions/verifyOTP', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, action: 'send' })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('OTP sent to your email', 'success');
                document.getElementById('otpGroup').style.display = 'block';
                document.getElementById('verifyOTP').style.display = 'block';
                document.getElementById('sendOTP').style.display = 'none';
            } else {
                this.showNotification(result.message || 'Failed to send OTP', 'error');
            }
        } catch (error) {
            this.showNotification('Network error. Please try again.', 'error');
        }
    }

    async verifyOTP() {
        const email = document.getElementById('loginEmail').value;
        const otp = document.getElementById('otpInput').value;
        
        if (!otp) {
            this.showNotification('Please enter the OTP', 'error');
            return;
        }

        try {
            const response = await fetch('/.netlify/functions/verifyOTP', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp, action: 'verify' })
            });

            const result = await response.json();
            
            if (result.success) {
                this.isAuthenticated = true;
                this.currentUser = { email, name: email.split('@')[0] };
                localStorage.setItem('user', JSON.stringify(this.currentUser));
                this.showNotification('Successfully signed in!', 'success');
                document.getElementById('authModal').style.display = 'none';
                this.render();
            } else {
                this.showNotification(result.message || 'Invalid OTP', 'error');
            }
        } catch (error) {
            this.showNotification('Network error. Please try again.', 'error');
        }
    }

    async signup() {
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        
        if (!name || !email) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        try {
            // Simulate signup - in real app, this would call your backend
            this.isAuthenticated = true;
            this.currentUser = { name, email };
            localStorage.setItem('user', JSON.stringify(this.currentUser));
            this.showNotification('Account created successfully!', 'success');
            document.getElementById('authModal').style.display = 'none';
            this.render();
        } catch (error) {
            this.showNotification('Failed to create account', 'error');
        }
    }

    logout() {
        this.isAuthenticated = false;
        this.currentUser = null;
        localStorage.removeItem('user');
        this.showNotification('Successfully signed out', 'success');
        this.render();
    }

    toggleAiChat() {
        const modal = document.getElementById('aiChatModal');
        if (modal) {
            modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
        }
    }

    renderContentCard(item) {
        // Embed YouTube video if videoId exists
        const videoEmbed = item.videoId ? `
            <div class="content-video">
                <iframe width="100%" height="220" src="https://www.youtube.com/embed/${item.videoId}" frameborder="0" allowfullscreen></iframe>
            </div>
        ` : `<div class="content-thumbnail"><i class="${item.thumbnail}"></i></div>`;
        return `
            <div class="content-card" data-platform="${item.platform}">
                ${videoEmbed}
                <div class="content-info">
                    <h4>${item.title}</h4>
                    <p class="creator">by ${item.creator}</p>
                    <p class="views">${item.views} views</p>
                    <div class="content-actions">
                        <button class="action-btn" onclick="this.parentElement.parentElement.parentElement.classList.toggle('favorited')">
                            <i class="icon-heart"></i>
                        </button>
                        <button class="action-btn">
                            <i class="icon-chart-bar"></i>
                        </button>
                        <button class="action-btn">
                            <i class="icon-comment"></i>
                        </button>
                    </div>
                    <div class="ai-summary" id="ai-summary-${item.videoId || item.id}">Loading AI summary...</div>
                </div>
                <div class="content-badges">
                    ${item.trending ? '<div class="trending-text">Trending</div>' : ''}
                    <div class="platform-icon ${item.platform}">${this.getPlatformIcon(item.platform)}</div>
                </div>
            </div>
        `;
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-notification';
        successDiv.textContent = message;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    applyRecommendation(suggestion) {
        this.showSuccess(`Recommendation applied: ${suggestion}`);
        // In a real app, this would trigger specific actions based on the recommendation
    }

    // Settings Methods
    editProfile() {
        this.showSuccess('Edit profile functionality would open a modal here');
    }

    changePassword() {
        this.showSuccess('Change password functionality would open a modal here');
    }

    deleteAccount() {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            this.showSuccess('Account deletion initiated');
        }
    }

    configureAPIs() {
        this.showSuccess('API configuration modal would open here');
    }

    testConnections() {
        this.showLoading(true);
        setTimeout(() => {
            this.showLoading(false);
            this.showSuccess('All API connections tested successfully');
        }, 2000);
    }

    updatePrivacySetting(setting, value) {
        this.showSuccess(`${setting} setting updated to ${value}`);
        // In a real app, this would save to backend
    }

    exportData() {
        this.showSuccess('Data export initiated. You will receive an email with your data.');
    }

    deleteData() {
        if (confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
            this.showSuccess('Data deletion initiated');
        }
    }

    regenerateAPIKey(service) {
        if (confirm(`Are you sure you want to regenerate your ${service} API key?`)) {
            this.showSuccess(`${service} API key regenerated successfully`);
        }
    }

    copyAPIKey(service) {
        // Mock API key for demonstration
        const mockKey = 'sk-' + Math.random().toString(36).substring(2, 15);
        navigator.clipboard.writeText(mockKey).then(() => {
            this.showSuccess(`${service} API key copied to clipboard`);
        });
    }

    addAPIKey(service) {
        this.showSuccess(`Add ${service} API key modal would open here`);
    }

    addNewAPIKey() {
        this.showSuccess('Add new API key modal would open here');
    }

    testAllKeys() {
        this.showLoading(true);
        setTimeout(() => {
            this.showLoading(false);
            this.showSuccess('All API keys tested successfully');
        }, 2000);
    }

    toggleAPIKeyVisibility(button) {
        const keyPreview = button.parentElement.querySelector('span');
        const isHidden = keyPreview.textContent.includes('••••');
        
        if (isHidden) {
            keyPreview.textContent = 'sk-' + Math.random().toString(36).substring(2, 15);
            button.textContent = 'Hide';
        } else {
            keyPreview.textContent = '••••••••••••••••••••••••••••••••';
            button.textContent = 'Show';
        }
    }

    updateNotificationSetting(setting, value) {
        this.showSuccess(`${setting} notifications ${value ? 'enabled' : 'disabled'}`);
        // In a real app, this would save to backend
    }

    attachSettingsEventListeners() {
        // Account Management
        const editProfileBtn = document.getElementById('editProfileBtn');
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        const deleteAccountBtn = document.getElementById('deleteAccountBtn');

        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => this.editProfile());
        }
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => this.changePassword());
        }
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', () => this.deleteAccount());
        }

        // Data Source Configuration
        const configureAPIsBtn = document.getElementById('configureAPIsBtn');
        const testConnectionsBtn = document.getElementById('testConnectionsBtn');

        if (configureAPIsBtn) {
            configureAPIsBtn.addEventListener('click', () => this.configureAPIs());
        }
        if (testConnectionsBtn) {
            testConnectionsBtn.addEventListener('click', () => this.testConnections());
        }

        // Privacy Settings
        const dataCollectionToggle = document.getElementById('dataCollectionToggle');
        const personalizedToggle = document.getElementById('personalizedToggle');
        const emailNotificationsToggle = document.getElementById('emailNotificationsToggle');
        const thirdPartyToggle = document.getElementById('thirdPartyToggle');

        if (dataCollectionToggle) {
            dataCollectionToggle.addEventListener('change', (e) => this.updatePrivacySetting('dataCollection', e.target.checked));
        }
        if (personalizedToggle) {
            personalizedToggle.addEventListener('change', (e) => this.updatePrivacySetting('personalizedRecommendations', e.target.checked));
        }
        if (emailNotificationsToggle) {
            emailNotificationsToggle.addEventListener('change', (e) => this.updatePrivacySetting('emailNotifications', e.target.checked));
        }
        if (thirdPartyToggle) {
            thirdPartyToggle.addEventListener('change', (e) => this.updatePrivacySetting('thirdPartyAnalytics', e.target.checked));
        }

        // Privacy Actions
        const exportDataBtn = document.getElementById('exportDataBtn');
        const deleteDataBtn = document.getElementById('deleteDataBtn');

        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => this.exportData());
        }
        if (deleteDataBtn) {
            deleteDataBtn.addEventListener('click', () => this.deleteData());
        }

        // API Key Management
        const regenerateYouTubeBtn = document.getElementById('regenerateYouTubeBtn');
        const copyYouTubeBtn = document.getElementById('copyYouTubeBtn');
        const regenerateOpenAIBtn = document.getElementById('regenerateOpenAIBtn');
        const copyOpenAIBtn = document.getElementById('copyOpenAIBtn');
        const addTikTokBtn = document.getElementById('addTikTokBtn');
        const addNewAPIKeyBtn = document.getElementById('addNewAPIKeyBtn');
        const testAllKeysBtn = document.getElementById('testAllKeysBtn');

        if (regenerateYouTubeBtn) {
            regenerateYouTubeBtn.addEventListener('click', () => this.regenerateAPIKey('youtube'));
        }
        if (copyYouTubeBtn) {
            copyYouTubeBtn.addEventListener('click', () => this.copyAPIKey('youtube'));
        }
        if (regenerateOpenAIBtn) {
            regenerateOpenAIBtn.addEventListener('click', () => this.regenerateAPIKey('openai'));
        }
        if (copyOpenAIBtn) {
            copyOpenAIBtn.addEventListener('click', () => this.copyAPIKey('openai'));
        }
        if (addTikTokBtn) {
            addTikTokBtn.addEventListener('click', () => this.addAPIKey('tiktok'));
        }
        if (addNewAPIKeyBtn) {
            addNewAPIKeyBtn.addEventListener('click', () => this.addNewAPIKey());
        }
        if (testAllKeysBtn) {
            testAllKeysBtn.addEventListener('click', () => this.testAllKeys());
        }

        // Show/Hide API Keys
        const showHideBtns = document.querySelectorAll('.show-hide-btn');
        showHideBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleAPIKeyVisibility(e.target));
        });

        // Notification Settings
        const trendAlertsToggle = document.getElementById('trendAlertsToggle');
        const performanceUpdatesToggle = document.getElementById('performanceUpdatesToggle');
        const aiInsightsToggle = document.getElementById('aiInsightsToggle');

        if (trendAlertsToggle) {
            trendAlertsToggle.addEventListener('change', (e) => this.updateNotificationSetting('trendAlerts', e.target.checked));
        }
        if (performanceUpdatesToggle) {
            performanceUpdatesToggle.addEventListener('change', (e) => this.updateNotificationSetting('performanceUpdates', e.target.checked));
        }
        if (aiInsightsToggle) {
            aiInsightsToggle.addEventListener('change', (e) => this.updateNotificationSetting('aiInsights', e.target.checked));
        }
    }

    async sendAiMessage() {
        const input = document.getElementById('aiChatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        const messagesContainer = document.getElementById('aiChatMessages');
        
        // Add user message
        const userMessage = document.createElement('div');
        userMessage.className = 'ai-chat-content user-message';
        userMessage.innerHTML = `
            <div class="ai-chat-content user-avatar">
                <i class="icon-user"></i>
            </div>
            <div class="ai-chat-content user-text">${message}</div>
        `;
        messagesContainer.appendChild(userMessage);
        
        // Clear input
        input.value = '';
        
        // Scroll to bottom
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 10);
        
        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'ai-chat-content ai-message typing';
        typingIndicator.innerHTML = `
            <div class="ai-chat-content ai-avatar">
                <i class="icon-concierge"></i>
            </div>
            <div class="ai-chat-content ai-text">Typing...</div>
        `;
        messagesContainer.appendChild(typingIndicator);
        
        // Scroll to bottom again
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 10);
        
        // Get AI response using the summarization function
        try {
            const response = await fetch('/.netlify/functions/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: `User message: ${message}. Context: This is a conversation with an AI assistant for a social media analytics dashboard. The user is asking about trends, analytics, or insights.`,
                    maxLength: 200
                })
            });

            if (response.ok) {
                const aiData = await response.json();
                console.log('AI chat response:', aiData);
                
                // Remove typing indicator
                typingIndicator.remove();
                
                // Add AI response
                const aiMessage = document.createElement('div');
                aiMessage.className = 'ai-chat-content ai-message';
                aiMessage.innerHTML = `
                    <div class="ai-chat-content ai-avatar">
                        <i class="icon-concierge"></i>
                    </div>
                    <div class="ai-chat-content ai-text">${aiData.summary || 'Thank you for your message! I\'m here to help you with analytics insights and trends. How can I assist you today?'}</div>
                `;
                messagesContainer.appendChild(aiMessage);
            } else {
                // Fallback response
                typingIndicator.remove();
                const aiMessage = document.createElement('div');
                aiMessage.className = 'ai-chat-content ai-message';
                aiMessage.innerHTML = `
                    <div class="ai-chat-content ai-avatar">
                        <i class="icon-concierge"></i>
                    </div>
                    <div class="ai-chat-content ai-text">Thank you for your message! I'm here to help you with analytics insights and trends. How can I assist you today?</div>
                `;
                messagesContainer.appendChild(aiMessage);
            }
        } catch (error) {
            console.error('Error getting AI response:', error);
            
            // Fallback response
            typingIndicator.remove();
            const aiMessage = document.createElement('div');
            aiMessage.className = 'ai-chat-content ai-message';
            aiMessage.innerHTML = `
                <div class="ai-chat-content ai-avatar">
                    <i class="icon-concierge"></i>
                </div>
                <div class="ai-chat-content ai-text">Thank you for your message! I'm here to help you with analytics insights and trends. How can I assist you today?</div>
            `;
            messagesContainer.appendChild(aiMessage);
        }
        
        // Scroll to bottom
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 10);
    }

    attachAuthEventListeners() {
        // Tab switching
        const authTabs = document.querySelectorAll('.auth-tab');
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');

        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                authTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                if (tab.dataset.tab === 'login') {
                    loginForm.style.display = 'flex';
                    signupForm.style.display = 'none';
                } else {
                    loginForm.style.display = 'none';
                    signupForm.style.display = 'flex';
                }
            });
        });

        // Close modal
        const closeBtn = document.getElementById('closeAuthModal');
        const authModal = document.getElementById('authModal');
        
        if (closeBtn && authModal) {
            closeBtn.addEventListener('click', () => {
                authModal.style.display = 'none';
            });
            
            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) {
                    authModal.style.display = 'none';
                }
            });
        }

        // Send OTP
        const sendOTPBtn = document.getElementById('sendOTP');
        if (sendOTPBtn) {
            sendOTPBtn.addEventListener('click', () => {
                this.sendOTP();
            });
        }

        // Verify OTP
        const verifyOTPBtn = document.getElementById('verifyOTP');
        if (verifyOTPBtn) {
            verifyOTPBtn.addEventListener('click', () => {
                this.verifyOTP();
            });
        }

        // Signup
        const signupBtn = document.getElementById('signupBtn');
        if (signupBtn) {
            signupBtn.addEventListener('click', () => {
                this.signup();
            });
        }
    }

    // Add a transformAnalyticsData method if not present
    transformAnalyticsData(data) {
        // Transform the YouTube API response to match this.analyticsData structure
        // (This is a placeholder, real implementation should map API fields)
        return {
            engagement: {
                likes: data.items?.[0]?.statistics?.likeCount || 0,
                comments: data.items?.[0]?.statistics?.commentCount || 0,
                shares: 0,
                views: data.items?.[0]?.statistics?.viewCount || 0,
                subscribers: data.items?.[0]?.statistics?.subscriberCount || 0
            },
            platformDistribution: {
                youtube: 100,
                tiktok: 0,
                instagram: 0,
                twitter: 0
            },
            performance: {
                growthRate: 0,
                engagementRate: 0,
                reachRate: 0,
                conversionRate: 0
            },
            trends: []
        };
    }

    attachAiChatEventListeners() {
        const aiChatModal = document.getElementById('aiChatModal');
        const aiChatInput = document.getElementById('aiChatInput');
        const aiChatSendBtn = document.getElementById('aiChatSend');
        const aiChatCloseBtn = document.getElementById('closeAiChat');
        
        if (aiChatModal && aiChatInput && aiChatSendBtn) {
            // Send message on button click
            aiChatSendBtn.addEventListener('click', () => {
                this.sendAiMessage();
            });
            
            // Send message on Enter key
            aiChatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendAiMessage();
                }
            });
            
            // Close modal with close button
            if (aiChatCloseBtn) {
                aiChatCloseBtn.addEventListener('click', () => {
                    aiChatModal.style.display = 'none';
                });
            }
            
            // Close modal when clicking outside
            aiChatModal.addEventListener('click', (e) => {
                if (e.target === aiChatModal) {
                    aiChatModal.style.display = 'none';
                }
            });
            
            // Close modal with Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && aiChatModal.style.display === 'flex') {
                    aiChatModal.style.display = 'none';
                }
            });
        }
    }

    renderAnalyticsContent() {
        const grid = document.getElementById('analyticsGrid');
        if (!grid) return;
        grid.innerHTML = (this.analyticsData.trends && this.analyticsData.trends.length > 0)
            ? this.analyticsData.trends.map(trend => `<div class="metric-card"><div class="metric-content"><h4>${trend.month}</h4><div class="metric-value">${trend.views}</div><div class="metric-change">${trend.growth}%</div></div></div>`).join('')
            : '<div class="no-results"><p>No analytics data found.</p></div>';
        if (this.analyticsLoading) {
            const spinner = document.createElement('div');
            spinner.className = 'loading';
            spinner.innerHTML = '<div class="spinner"></div><span>Loading more...</span>';
            grid.appendChild(spinner);
        }
    }

    renderInsightsContent() {
        // Render trends grid
        const trendsGrid = document.querySelector('.trends-grid');
        if (trendsGrid) {
            trendsGrid.innerHTML = this.renderTrendAnalysis();
            if (this.insightsLoading) {
                const spinner = document.createElement('div');
                spinner.className = 'loading';
                spinner.innerHTML = '<div class="spinner"></div><span>Loading more trends...</span>';
                trendsGrid.appendChild(spinner);
            }
        }
        // Render predictions grid
        const predictionsGrid = document.querySelector('.predictions-grid');
        if (predictionsGrid) {
            predictionsGrid.innerHTML = this.renderPredictions();
            if (this.insightsLoading) {
                const spinner = document.createElement('div');
                spinner.className = 'loading';
                spinner.innerHTML = '<div class="spinner"></div><span>Loading more predictions...</span>';
                predictionsGrid.appendChild(spinner);
            }
        }
        // Render recommendations grid
        const recommendationsGrid = document.querySelector('.recommendations-grid');
        if (recommendationsGrid) {
            recommendationsGrid.innerHTML = this.renderRecommendations();
            if (this.insightsLoading) {
                const spinner = document.createElement('div');
                spinner.className = 'loading';
                spinner.innerHTML = '<div class="spinner"></div><span>Loading more recommendations...</span>';
                recommendationsGrid.appendChild(spinner);
            }
        }
    }
}

// Initialize the application
new SpyDash();
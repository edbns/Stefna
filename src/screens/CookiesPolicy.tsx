import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const CookiesPolicy: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-black/95 backdrop-blur-md border-b border-white/10 z-40">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-semibold">Cookies Policy</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 px-6 pb-20 max-w-4xl mx-auto">
        <div className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-8">Cookies Policy</h1>
          
          <div className="space-y-6 text-white/90">
            <section>
              <h2 className="text-xl font-semibold mb-4">Interpretation and Definitions</h2>
              <p className="mb-4">
                The words of which the initial letter is capitalized have meanings defined under the following conditions. 
                The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
              </p>
              
              <h3 className="text-lg font-medium mb-3">Definitions</h3>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li><strong>Platform</strong> (referred to as either "the Platform", "We", "Us" or "Our" in this Cookies Policy) refers to Stefna.</li>
                <li><strong>Cookies</strong> means small files that are placed on Your computer, mobile device or any other device by a website, containing details of your browsing history on that website among its many uses.</li>
                <li><strong>Website</strong> refers to Stefna, accessible from stefna.xyz</li>
                <li><strong>You</strong> means the individual accessing or using the Website, or a Platform, or any legal entity on behalf of which such individual is accessing or using the Website, as applicable.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">The use of the Cookies</h2>
              
              <h3 className="text-lg font-medium mb-3">Type of Cookies We Use</h3>
              <p className="mb-4">
                Cookies can be "Persistent" or "Session" Cookies. Persistent Cookies remain on your personal computer or mobile device when You go offline, while Session Cookies are deleted as soon as You close your web browser. We use both session and persistent Cookies for the purposes set out below:
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-medium mb-2">Necessary / Essential Cookies</h4>
                  <p className="mb-2 text-sm">
                    <strong>Type:</strong> Session Cookies<br/>
                    <strong>Administered by:</strong> Us<br/>
                    <strong>Purpose:</strong> These Cookies are essential to provide You with services available through the Website and to enable You to use some of its features. They help to authenticate users and prevent fraudulent use of user accounts. Without these Cookies, the services that You have asked for cannot be provided, and We only use these Cookies to provide You with those services.
                  </p>
                </div>

                <div>
                  <h4 className="text-md font-medium mb-2">Functionality Cookies</h4>
                  <p className="mb-2 text-sm">
                    <strong>Type:</strong> Persistent Cookies<br/>
                    <strong>Administered by:</strong> Us<br/>
                    <strong>Purpose:</strong> These Cookies allow us to remember choices You make when You use the Website, such as remembering your login details or language preference. The purpose of these Cookies is to provide You with a more personal experience and to avoid You having to re-enter your preferences every time You use the Website.
                  </p>
                </div>

                <div>
                  <h4 className="text-md font-medium mb-2">Analytics Cookies</h4>
                  <p className="mb-2 text-sm">
                    <strong>Type:</strong> Persistent Cookies<br/>
                    <strong>Administered by:</strong> Google Analytics<br/>
                    <strong>Purpose:</strong> These Cookies are used to collect information about how You use the Service, such as which pages You visit, the time spent on those pages, and user engagement. This data helps Us understand website traffic and improve the Service.
                  </p>
                </div>

                <div>
                  <h4 className="text-md font-medium mb-2">Advertising Cookies</h4>
                  <p className="mb-2 text-sm">
                    <strong>Type:</strong> Persistent Cookies<br/>
                    <strong>Administered by:</strong> Social Media Platforms<br/>
                    <strong>Purpose:</strong> These Cookies are used by social media pixels/trackers to promote Stefna via various social media platforms for outreach and growth, and to measure the effectiveness of Our advertising campaigns.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Your Choices Regarding Cookies</h2>
              <p className="mb-4">
                If You prefer to avoid the use of Cookies on the Website, first You must disable the use of Cookies in your browser and then delete the Cookies saved in your browser associated with this website. You may use this option for preventing the use of Cookies at any time.
              </p>
              <p className="mb-4">
                If You do not accept Our Cookies, You may experience some inconvenience in your use of the Website and some features may not function properly.
              </p>
              <p className="mb-4">
                If You'd like to delete Cookies or instruct your web browser to delete or refuse Cookies, please visit the help pages of your web browser:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>For the Chrome web browser, please visit this page from Google: <a href="https://support.google.com/accounts/answer/32050" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">https://support.google.com/accounts/answer/32050</a></li>
                <li>For the Internet Explorer web browser, please visit this page from Microsoft: <a href="http://support.microsoft.com/kb/278835" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">http://support.microsoft.com/kb/278835</a></li>
                <li>For the Firefox web browser, please visit this page from Mozilla: <a href="https://support.mozilla.org/en-US/kb/delete-cookies-remove-info-websites-stored" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">https://support.mozilla.org/en-US/kb/delete-cookies-remove-info-websites-stored</a></li>
                <li>For the Safari web browser, please visit this page from Apple: <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
              <p>
                If you have any questions about this Cookies Policy, You can contact us:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>By email: <a href="mailto:hello@stefna.xyz" className="text-blue-400 hover:text-blue-300">hello@stefna.xyz</a></li>
              </ul>
            </section>

            <div className="mt-8 pt-6 border-t border-white/20">
              <p className="text-sm text-white/60">
                Last updated: August 4, 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CookiesPolicy 
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CookiesPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Cookies Policy</h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Last updated: July 29, 2025
              </p>
            </div>

            <div className="space-y-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This Cookies Policy explains what Cookies are and how We use them. You should read this policy so You can understand what type of cookies We use, or the information We collect using Cookies and how that information is used. This Cookies Policy has been created with the help of the <a href="https://www.freeprivacypolicy.com/free-cookies-policy-generator/" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Free Privacy Policy Cookies Policy Generator</a>.
              </p>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Cookies do not typically contain any information that personally identifies a user, but personal information that we store about You may be linked to the information stored in and obtained from Cookies. For further information on how We use, store and keep your personal data secure, see our Privacy Policy.
              </p>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We do not store sensitive personal information, such as mailing addresses, account passwords, etc. in the Cookies We use.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Interpretation and Definitions</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Interpretation</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Definitions</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                For the purposes of this Cookies Policy:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-6 ml-4 space-y-2">
                <li><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Cookies Policy) refers to Stefna.</li>
                <li><strong>Cookies</strong> means small files that are placed on Your computer, mobile device or any other device by a website, containing details of your browsing history on that website among its many uses.</li>
                <li><strong>Website</strong> refers to Stefna, accessible from <a href="https://stefna.xyz" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">stefna.xyz</a></li>
                <li><strong>You</strong> means the individual accessing or using the Website, or a company, or any legal entity on behalf of which such individual is accessing or using the Website, as applicable.</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">The use of the Cookies</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Type of Cookies We Use</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Cookies can be "Persistent" or "Session" Cookies. Persistent Cookies remain on your personal computer or mobile device when You go offline, while Session Cookies are deleted as soon as You close your web browser.
              </p>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We use both session and persistent Cookies for the purposes set out below:
              </p>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Necessary / Essential Cookies</h4>
                <div className="space-y-2 text-gray-600 dark:text-gray-400">
                  <p><strong>Type:</strong> Session Cookies</p>
                  <p><strong>Administered by:</strong> Us</p>
                  <p><strong>Purpose:</strong> These Cookies are essential to provide You with services available through the Website and to enable You to use some of its features. They help to authenticate users and prevent fraudulent use of user accounts. Without these Cookies, the services that You have asked for cannot be provided, and We only use these Cookies to provide You with those services.</p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Functionality Cookies</h4>
                <div className="space-y-2 text-gray-600 dark:text-gray-400">
                  <p><strong>Type:</strong> Persistent Cookies</p>
                  <p><strong>Administered by:</strong> Us</p>
                  <p><strong>Purpose:</strong> These Cookies allow us to remember choices You make when You use the Website, such as remembering your login details or language preference. The purpose of these Cookies is to provide You with a more personal experience and to avoid You having to re-enter your preferences every time You use the Website.</p>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Your Choices Regarding Cookies</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                If You prefer to avoid the use of Cookies on the Website, first You must disable the use of Cookies in your browser and then delete the Cookies saved in your browser associated with this website. You may use this option for preventing the use of Cookies at any time.
              </p>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                If You do not accept Our Cookies, You may experience some inconvenience in your use of the Website and some features may not function properly.
              </p>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                If You'd like to delete Cookies or instruct your web browser to delete or refuse Cookies, please visit the help pages of your web browser.
              </p>

              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-6 ml-4 space-y-2">
                <li>For the Chrome web browser, please visit this page from Google: <a href="https://support.google.com/accounts/answer/32050" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">https://support.google.com/accounts/answer/32050</a></li>
                <li>For the Internet Explorer web browser, please visit this page from Microsoft: <a href="http://support.microsoft.com/kb/278835" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">http://support.microsoft.com/kb/278835</a></li>
                <li>For the Firefox web browser, please visit this page from Mozilla: <a href="https://support.mozilla.org/en-US/kb/delete-cookies-remove-info-websites-stored" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">https://support.mozilla.org/en-US/kb/delete-cookies-remove-info-websites-stored</a></li>
                <li>For the Safari web browser, please visit this page from Apple: <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac</a></li>
              </ul>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                For any other web browser, please visit your web browser's official web pages.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">More Information about Cookies</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You can learn more about cookies: <a href="https://www.freeprivacypolicy.com/blog/cookies/" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">https://www.freeprivacypolicy.com/blog/cookies/</a>.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Contact Us</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                If you have any questions about this Cookies Policy, You can contact us:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 ml-4">
                <li>By email: hello@stefna.xyz</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiesPolicy;
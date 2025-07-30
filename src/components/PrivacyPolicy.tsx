import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 font-['Figtree']">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: July 29, 2025</p>
          
          {/* Content */}
          <div className="prose max-w-none space-y-6">
            <div className="text-gray-700 leading-relaxed">
              <p className="mb-6">
                This Privacy Policy describes Our policies and procedures on the collection, 
                use and disclosure of Your information when You use the Service and tells You 
                about Your privacy rights and how the law protects You.
              </p>
              
              <p className="mb-8">
                We use Your Personal data to provide and improve the Service. By using the 
                Service, You agree to the collection and use of information in accordance with 
                this Privacy Policy.
              </p>
            </div>

            {/* Interpretation and Definitions */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 font-['Figtree']">Interpretation and Definitions</h2>
              
              {/* Interpretation */}
              <div className="mb-8">
                <h3 className="text-xl font-medium text-gray-900 mb-4 font-['Figtree']">Interpretation</h3>
                <p className="text-gray-700 leading-relaxed">
                  The words of which the initial letter is capitalized have meanings defined 
                  under the following conditions. The following definitions shall have the same 
                  meaning regardless of whether they appear in singular or in plural.
                </p>
              </div>

              {/* Definitions */}
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-4 font-['Figtree']">Definitions</h3>
                <p className="text-gray-700 mb-4">For the purposes of this Privacy Policy:</p>
                
                <ul className="space-y-4 text-gray-700">
                  <li className="flex flex-col">
                    <strong className="font-medium text-gray-900">Account</strong>
                    <span className="mt-1">means a unique account created for You to access our Service or parts of our Service.</span>
                  </li>
                  
                  <li className="flex flex-col">
                    <strong className="font-medium text-gray-900">Affiliate</strong>
                    <span className="mt-1">means an entity that controls, is controlled by or is under common control with a party, where "control" means ownership of 50% or more of the shares, equity interest or other securities entitled to vote for election of directors or other managing authority.</span>
                  </li>
                  
                  <li className="flex flex-col">
                    <strong className="font-medium text-gray-900">Company</strong>
                    <span className="mt-1">(referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Stefna.</span>
                  </li>
                  
                  <li className="flex flex-col">
                    <strong className="font-medium text-gray-900">Cookies</strong>
                    <span className="mt-1">are small files that are placed on Your computer, mobile device or any other device by a website, containing the details of Your browsing history on that website among its many uses.</span>
                  </li>
                  
                  <li className="flex flex-col">
                    <strong className="font-medium text-gray-900">Device</strong>
                    <span className="mt-1">means any device that can access the Service such as a computer, a cellphone or a digital tablet.</span>
                  </li>
                  
                  <li className="flex flex-col">
                    <strong className="font-medium text-gray-900">Personal Data</strong>
                    <span className="mt-1">is any information that relates to an identified or identifiable individual.</span>
                  </li>
                  
                  <li className="flex flex-col">
                    <strong className="font-medium text-gray-900">Service</strong>
                    <span className="mt-1">refers to the Website.</span>
                  </li>
                  
                  <li className="flex flex-col">
                    <strong className="font-medium text-gray-900">Service Provider</strong>
                    <span className="mt-1">means any natural or legal person who processes the data on behalf of the Company. It refers to third-party companies or individuals employed by the Company to facilitate the Service, to provide the Service on behalf of the Company, to perform services related to the Service or to assist the Company in analyzing how the Service is used.</span>
                  </li>
                  
                  <li className="flex flex-col">
                    <strong className="font-medium text-gray-900">Usage Data</strong>
                    <span className="mt-1">refers to data collected automatically, either generated by the use of the Service or from the Service infrastructure itself (for example, the duration of a page visit).</span>
                  </li>
                  
                  <li className="flex flex-col">
                    <strong className="font-medium text-gray-900">Website</strong>
                    <span className="mt-1">refers to Stefna, accessible from <a href="https://stefna.xyz" className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">stefna.xyz</a></span>
                  </li>
                  
                  <li className="flex flex-col">
                    <strong className="font-medium text-gray-900">You</strong>
                    <span className="mt-1">means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="text-gray-700 mt-4">
              <p className="text-gray-700 mb-4">
                For more information about the cookies we use and your choices regarding cookies, please visit our Cookies Policy or the Cookies section of our Privacy Policy.
              </p>
              <p className="text-gray-700">
                Please note, however, that We may need to retain certain information when we have a legal obligation or lawful basis to do so.
              </p>
            </div>

            {/* Disclosure of Your Personal Data Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Disclosure of Your Personal Data</h3>
              
              {/* Business Transactions */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Business Transactions</h4>
                <p className="text-gray-700">
                  If the Company is involved in a merger, acquisition or asset sale, Your Personal Data may be transferred. We will provide notice before Your Personal Data is transferred and becomes subject to a different Privacy Policy.
                </p>
              </div>

              {/* Law enforcement */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Law Enforcement</h4>
                <p className="text-gray-700">
                  Under certain circumstances, the Company may be required to disclose Your Personal Data if required to do so by law or in response to valid requests by public authorities (e.g. a court or a government agency).
                </p>
              </div>

              {/* Other legal requirements */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Other Legal Requirements</h4>
                <p className="text-gray-700 mb-3">
                  The Company may disclose Your Personal Data in the good faith belief that such action is necessary to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Comply with a legal obligation</li>
                  <li>Protect and defend the rights or property of the Company</li>
                  <li>Prevent or investigate possible wrongdoing in connection with the Service</li>
                  <li>Protect the personal safety of Users of the Service or the public</li>
                  <li>Protect against legal liability</li>
                </ul>
              </div>
            </div>

            {/* Security of Your Personal Data Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Security of Your Personal Data</h3>
              <p className="text-gray-700">
                The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While We strive to use commercially acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.
              </p>
            </div>

            {/* Children's Privacy Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Children's Privacy</h3>
              <p className="text-gray-700 mb-3">
                Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13. If You are a parent or guardian and You are aware that Your child has provided Us with Personal Data, please contact Us. If We become aware that We have collected Personal Data from anyone under the age of 13 without verification of parental consent, We take steps to remove that information from Our servers.
              </p>
              <p className="text-gray-700">
                If We need to rely on consent as a legal basis for processing Your information and Your country requires consent from a parent, We may require Your parent's consent before We collect and use that information.
              </p>
            </div>

            {/* Links to Other Websites Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Links to Other Websites</h3>
              <p className="text-gray-700 mb-3">
                Our Service may contain links to other websites that are not operated by Us. If You click on a third party link, You will be directed to that third party's site. We strongly advise You to review the Privacy Policy of every site You visit.
              </p>
              <p className="text-gray-700">
                We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services.
              </p>
            </div>

            {/* Changes to this Privacy Policy Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Changes to this Privacy Policy</h3>
              <p className="text-gray-700 mb-3">
                We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page.
              </p>
              <p className="text-gray-700 mb-3">
                We will let You know via email and/or a prominent notice on Our Service, prior to the change becoming effective and update the "Last updated" date at the top of this Privacy Policy.
              </p>
              <p className="text-gray-700">
                You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
            </div>

            {/* Contact Us Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h3>
              <p className="text-gray-700 mb-3">
                If you have any questions about this Privacy Policy, You can contact us:
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>By email:</strong> <a href="mailto:hello@stefna.xyz" className="text-blue-600 hover:text-blue-800 underline">hello@stefna.xyz</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
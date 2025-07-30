import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsAndConditions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms and Conditions</h1>
              <p className="text-gray-600 text-lg">
                Last updated: July 29, 2025
              </p>
              <p className="text-gray-700 mt-4">
                Please read these terms and conditions carefully before using Our Service.
              </p>
            </div>

            {/* Interpretation and Definitions Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Interpretation and Definitions</h2>
              
              {/* Interpretation */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Interpretation</h3>
                <p className="text-gray-700">
                  The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
                </p>
              </div>

              {/* Definitions */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Definitions</h3>
                <p className="text-gray-700 mb-4">
                  For the purposes of these Terms and Conditions:
                </p>
                <ul className="space-y-4 text-gray-700">
                  <li className="flex flex-col">
                    <strong className="font-medium text-gray-900">Affiliate</strong>
                    <span className="mt-1">means an entity that controls, is controlled by or is under common control with a party, where "control" means ownership of 50% or more of the shares, equity interest or other securities entitled to vote for election of directors or other managing authority.</span>
                  </li>
                  
                  <li className="flex flex-col">
                    <strong className="font-medium text-gray-900">Company</strong>
                    <span className="mt-1">(referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Stefna.</span>
                  </li>
                  
                  <li className="flex flex-col">
                    <strong className="font-medium text-gray-900">Device</strong>
                    <span className="mt-1">means any device that can access the Service such as a computer, a cellphone or a digital tablet.</span>
                  </li>
                  
                  <li className="flex flex-col">
                    <strong className="font-medium text-gray-900">Service</strong>
                    <span className="mt-1">refers to the Website.</span>
                  </li>
                  
                  <li className="flex flex-col">
                    <strong className="font-medium text-gray-900">Terms and Conditions</strong>
                    <span className="mt-1">(also referred as "Terms") mean these Terms and Conditions that form the entire agreement between You and the Company regarding the use of the Service.</span>
                  </li>
                  
                  <li className="flex flex-col">
                    <strong className="font-medium text-gray-900">Third-party Social Media Service</strong>
                    <span className="mt-1">means any services or content (including data, information, products or services) provided by a third-party that may be displayed, included or made available by the Service.</span>
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

            {/* Acknowledgment Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Acknowledgment</h2>
              <p className="text-gray-700 mb-3">
                These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.
              </p>
              <p className="text-gray-700 mb-3">
                Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms and Conditions apply to all visitors, users and others who access or use the Service.
              </p>
              <p className="text-gray-700 mb-3">
                By accessing or using the Service You agree to be bound by these Terms and Conditions. If You disagree with any part of these Terms and Conditions then You may not access the Service.
              </p>
              <p className="text-gray-700 mb-3">
                You represent that you are over the age of 18. The Company does not permit those under 18 to use the Service.
              </p>
              <p className="text-gray-700">
                Your access to and use of the Service is also conditioned on Your acceptance of and compliance with the Privacy Policy of the Company. Our Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your personal information when You use the Application or the Website and tells You about Your privacy rights and how the law protects You. Please read Our Privacy Policy carefully before using Our Service.
              </p>
            </div>

            {/* Links to Other Websites Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Links to Other Websites</h2>
              <p className="text-gray-700 mb-3">
                Our Service may contain links to third-party web sites or services that are not owned or controlled by the Company.
              </p>
              <p className="text-gray-700 mb-3">
                The Company has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services. You further acknowledge and agree that the Company shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, goods or services available on or through any such web sites or services.
              </p>
              <p className="text-gray-700">
                We strongly advise You to read the terms and conditions and privacy policies of any third-party web sites or services that You visit.
              </p>
            </div>

            {/* Termination Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Termination</h2>
              <p className="text-gray-700 mb-3">
                We may terminate or suspend Your access immediately, without prior notice or liability, for any reason whatsoever, including without limitation if You breach these Terms and Conditions.
              </p>
              <p className="text-gray-700">
                Upon termination, Your right to use the Service will cease immediately.
              </p>
            </div>

            {/* Limitation of Liability Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
              <p className="text-gray-700 mb-3">
                Notwithstanding any damages that You might incur, the entire liability of the Company and any of its suppliers under any provision of this Terms and Your exclusive remedy for all of the foregoing shall be limited to the amount actually paid by You through the Service or 100 USD if You haven't purchased anything through the Service.
              </p>
              <p className="text-gray-700 mb-3">
                To the maximum extent permitted by applicable law, in no event shall the Company or its suppliers be liable for any special, incidental, indirect, or consequential damages whatsoever (including, but not limited to, damages for loss of profits, loss of data or other information, for business interruption, for personal injury, loss of privacy arising out of or in any way related to the use of or inability to use the Service, third-party software and/or third-party hardware used with the Service, or otherwise in connection with any provision of this Terms), even if the Company or any supplier has been advised of the possibility of such damages and even if the remedy fails of its essential purpose.
              </p>
              <p className="text-gray-700">
                Some states do not allow the exclusion of implied warranties or limitation of liability for incidental or consequential damages, which means that some of the above limitations may not apply. In these states, each party's liability will be limited to the greatest extent permitted by law.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
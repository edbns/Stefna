import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const TermsOfService: React.FC = () => {
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
          <h1 className="text-lg font-semibold">Terms of Service</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 px-6 pb-20 max-w-4xl mx-auto">
        <div className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
          
          <div className="space-y-6 text-white/90">
            <section>
              <h2 className="text-xl font-semibold mb-4">Interpretation and Definitions</h2>
              <p className="mb-4">
                The words of which the initial letter is capitalized have meanings defined under the following conditions. 
                The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
              </p>
              
              <h3 className="text-lg font-medium mb-3">Definitions</h3>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li><strong>Affiliate</strong> means an entity that controls, is controlled by or is under common control with a party, where "control" means ownership of 50% or more of the shares, equity interest or other securities entitled to vote for election of directors or other managing authority.</li>
                <li><strong>Platform</strong> (referred to as either "the Platform", "We", "Us" or "Our" in this Agreement) refers to Stefna, an AI-powered photo and video editing platform.</li>
                <li><strong>Device</strong> means any device that can access the Service such as a computer, a cellphone or a digital tablet.</li>
                <li><strong>Service</strong> refers to the Website, Stefna, which provides AI-powered photo and video editing tools through an easy-to-use web interface, with mobile applications launching soon.</li>
                <li><strong>Terms and Conditions</strong> (also referred as "Terms") mean these Terms and Conditions that form the entire agreement between You and the Platform regarding the use of the Service.</li>
                <li><strong>Third-party Social Media Service</strong> means any services or content provided by a third-party that may be displayed, included or made available by the Service.</li>
                <li><strong>Website</strong> refers to Stefna, accessible from stefna.xyz</li>
                <li><strong>You</strong> means the individual accessing or using the Service, or the Platform, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Acknowledgment</h2>
              <p className="mb-4">
                These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Platform. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.
              </p>
              <p className="mb-4">
                Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms and Conditions apply to all visitors, users and others who access or use the Service.
              </p>
              <p className="mb-4">
                By accessing or using the Service You agree to be bound by these Terms and Conditions. If You disagree with any part of these Terms and Conditions then You may not access the Service.
              </p>
              <p className="mb-4">
                You must be at least 13 years old to create an account and use Stefna. If you are under the age required by the laws of your country to consent to data processing (e.g., 16 in some jurisdictions), you may only use Stefna with parental consent.
              </p>
              <p>
                Your access to and use of the Service is also conditioned on Your acceptance of and compliance with the Privacy Policy of the Platform. Our Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your personal information when You use the Application or the Website and tells You about Your privacy rights and how the law protects You. Please read Our Privacy Policy carefully before using Our Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">User Content</h2>
              <p>
                By uploading, submitting, or generating content (including photos, videos, and AI-generated images/videos) on Stefna, you grant Stefna a non-exclusive, worldwide, royalty-free license to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, and display such content solely for the purpose of providing, securing, and improving Stefna's services, including enabling features like editing and remixing. You represent and warrant that you own or have the necessary licenses, rights, consents, and permissions to use and authorize Stefna to use all intellectual property rights in and to any User Content you upload or generate.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Links to Other Websites</h2>
              <p className="mb-4">
                Our Service may contain links to third-party web sites or services that are not owned or controlled by the Platform. The Platform has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services.
              </p>
              <p>
                You further acknowledge and agree that the Platform shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, goods or services available on or through any such web sites or services. We strongly advise You to read the terms and conditions and privacy policies of any third-party web sites or services that You visit.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Termination</h2>
              <p>
                We may terminate or suspend Your access immediately, without prior notice or liability, for any reason whatsoever, including without limitation if You breach these Terms and Conditions. Upon termination, Your right to use the Service will cease immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Limitation of Liability</h2>
              <p className="mb-4">
                Notwithstanding any damages that You might incur, the entire liability of the Platform and any of its suppliers under any provision of this Terms and Your exclusive remedy for all of the foregoing shall be limited to the amount actually paid by You through the Service or 100 USD if You haven't purchased anything through the Service.
              </p>
              <p>
                To the maximum extent permitted by applicable law, in no event shall the Platform or its suppliers be liable for any special, incidental, indirect, or consequential damages whatsoever (including, but not limited to, damages for loss of profits, loss of data or other information, for business interruption, for personal injury, loss of privacy arising out of or in any way related to the use of or inability to use the Service, third-party software and/or third-party hardware used with the Service, or otherwise in connection with any provision of this Terms), even if the Platform or any supplier has been advised of the possibility of such damages and even if the remedy fails of its essential purpose.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">"AS IS" and "AS AVAILABLE" Disclaimer</h2>
              <p>
                The Service is provided to You "AS IS" and "AS AVAILABLE" and with all faults and defects without warranty of any kind. To the maximum extent permitted under applicable law, the Platform, on its own behalf and on behalf of its Affiliates and its and their respective licensors and service providers, expressly disclaims all warranties, whether express, implied, statutory or otherwise, with respect to the Service, including all implied warranties of merchantability, fitness for a particular purpose, title and non-infringement, and warranties that may arise out of course of dealing, course of performance, usage or trade practice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Governing Law</h2>
              <p>
                The laws of the Country, excluding its conflicts of law rules, shall govern this Terms and Your use of the Service. Your use of the Application may also be subject to other local, state, national, or international laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Disputes Resolution</h2>
              <p>
                If You have any concern or dispute about the Service, You agree to first try to resolve the dispute informally by contacting the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">For European Union (EU) Users</h2>
              <p>
                If You are a European Union consumer, you will benefit from any mandatory provisions of the law of the country in which You are resident.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">United States Legal Compliance</h2>
              <p>
                You represent and warrant that (i) You are not located in a country that is subject to the United States government embargo, or that has been designated by the United States government as a "terrorist supporting" country, and (ii) You are not listed on any United States government list of prohibited or restricted parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Severability and Waiver</h2>
              <p className="mb-4">
                If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law and the remaining provisions will continue in full force and effect.
              </p>
              <p>
                Except as provided herein, the failure to exercise a right or to require performance of an obligation under these Terms shall not affect a party's ability to exercise such right or require such performance at any time thereafter nor shall the waiver of a breach constitute a waiver of any subsequent breach.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Translation Interpretation</h2>
              <p>
                These Terms and Conditions may have been translated if We have made them available to You on our Service. You agree that the original English text shall prevail in the case of a dispute.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Changes to These Terms and Conditions</h2>
              <p className="mb-4">
                We reserve the right, at Our sole discretion, to modify or replace these Terms at any time. If a revision is material We will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at Our sole discretion.
              </p>
              <p>
                By continuing to access or use Our Service after those revisions become effective, You agree to be bound by the revised terms. If You do not agree to the new terms, in whole or in part, please stop using the website and the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
              <p>
                If you have any questions about these Terms and Conditions, You can contact us:
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

export default TermsOfService 
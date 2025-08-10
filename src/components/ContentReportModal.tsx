import React, { useState } from 'react'
import { X, AlertTriangle, Flag, Shield, CheckCircle, XCircle } from 'lucide-react'
import contentModerationService, { ContentReport, InappropriateCategories } from '../services/contentModerationService'

interface ContentReportModalProps {
  isOpen: boolean
  onClose: () => void
  contentId: string
  contentType: 'prompt' | 'image' | 'video'
  reporterId: string
  contentUrl?: string
  contentCaption?: string
}

const ContentReportModal: React.FC<ContentReportModalProps> = ({
  isOpen,
  onClose,
  contentId,
  contentType,
  reporterId,
  contentUrl,
  contentCaption
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [customReason, setCustomReason] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const reportReasons = [
    { id: InappropriateCategories.VIOLENCE, label: 'Violence or Harmful Content', icon: AlertTriangle },
    { id: InappropriateCategories.HATE_SPEECH, label: 'Hate Speech or Discrimination', icon: Flag },
    { id: InappropriateCategories.SEXUAL_CONTENT, label: 'Inappropriate Sexual Content', icon: Shield },
    { id: InappropriateCategories.DRUGS, label: 'Drugs or Illegal Substances', icon: AlertTriangle },
    { id: InappropriateCategories.SELF_HARM, label: 'Self-Harm or Suicide', icon: AlertTriangle },
    { id: InappropriateCategories.HARASSMENT, label: 'Harassment or Bullying', icon: Flag },
    { id: InappropriateCategories.COPYRIGHT, label: 'Copyright Violation', icon: Shield },
    { id: InappropriateCategories.SPAM, label: 'Spam or Misleading Content', icon: AlertTriangle },
    { id: 'other', label: 'Other (Please specify)', icon: Flag }
  ]

  const handleSubmit = async () => {
    if (!selectedReason) {
      alert('Please select a reason for reporting')
      return
    }

    if (selectedReason === 'other' && !customReason.trim()) {
      alert('Please provide a reason for reporting')
      return
    }

    setIsSubmitting(true)

    try {
      const report: Omit<ContentReport, 'id' | 'timestamp' | 'status'> = {
        reporterId,
        contentId,
        contentType,
        reason: selectedReason === 'other' ? customReason : selectedReason
      }

      const result = await contentModerationService.reportContent(report)

      if (result.success) {
        setSubmitSuccess(true)
        setTimeout(() => {
          onClose()
          setSubmitSuccess(false)
          setSelectedReason('')
          setCustomReason('')
        }, 2000)
      } else {
        alert('Failed to submit report. Please try again.')
      }
    } catch (error) {
      console.error('Report submission error:', error)
      alert('Failed to submit report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason('')
      setCustomReason('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
      
      {/* Modal */}
      <div className="relative bg-black border border-white/20 rounded-2xl max-w-4xl w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-white text-lg font-semibold">Report Content</h2>
          <p className="text-white/60 text-sm">Help us improve the community</p>
        </div>

        {submitSuccess ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={20} className="text-green-400" />
            </div>
            <h4 className="text-white font-semibold text-base mb-2">Thank You!</h4>
            <p className="text-white/60 text-sm">
              Your feedback helps us improve the community.
            </p>
          </div>
        ) : (
          <div className="flex space-x-6 h-96">
            {/* Left Side - Content */}
            <div className="flex-1">
              {contentUrl ? (
                <div className="h-full">
                  {contentType === 'image' ? (
                    <img
                      src={contentUrl}
                      alt="Reported content"
                      className="w-full h-full object-cover rounded border border-white/20"
                    />
                  ) : (
                    <video
                      src={contentUrl}
                      className="w-full h-full object-cover rounded border border-white/20"
                      muted
                    />
                  )}
                  {contentCaption && (
                    <p className="text-white/80 text-xs mt-2">{contentCaption}</p>
                  )}
                </div>
              ) : (
                <div className="h-full bg-white/5 rounded border border-white/20 flex items-center justify-center">
                  <p className="text-white/40 text-xs">No preview available</p>
                </div>
              )}
            </div>

            {/* Right Side - Report Options */}
            <div className="flex-1 flex flex-col">
              <div className="grid grid-cols-1 gap-1 flex-1">
                {reportReasons.map((reason) => {
                  const Icon = reason.icon
                  return (
                    <button
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      className={`w-full p-2 rounded-lg border transition-all duration-300 text-left flex items-center space-x-2 ${
                        selectedReason === reason.id
                          ? 'border-white/40 bg-white/20 text-white'
                          : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon size={14} />
                      <span className="text-xs">{reason.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Custom Reason Input */}
              {selectedReason === 'other' && (
                <div className="mt-3">
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Describe why this content should be reviewed..."
                    className="w-full h-20 p-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 resize-none focus:outline-none focus:border-white/40 focus:bg-white/10 text-xs"
                    maxLength={300}
                  />
                  <p className="text-white/40 text-xs mt-1">
                    {customReason.length}/300 characters
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-3 mt-auto">
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-white/5 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors border border-white/20 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !selectedReason || (selectedReason === 'other' && !customReason.trim())}
                  className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${
                    selectedReason && (selectedReason !== 'other' || customReason.trim()) && !isSubmitting
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-white/10 text-white/40 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3 h-3 border border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Report</span>
                  )}
                </button>
              </div>

              {/* Privacy Notice */}
              <p className="text-white/40 text-xs text-center mt-3">
                Your report will be reviewed by our moderation team.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContentReportModal 
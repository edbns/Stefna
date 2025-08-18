import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { AlertTriangle, Flag, Shield, CheckCircle } from 'lucide-react';
import contentModerationService, { InappropriateCategories } from '../services/contentModerationService';
const ContentReportModal = ({ isOpen, onClose, contentId, contentType, reporterId, contentUrl, contentCaption }) => {
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
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
    ];
    const handleSubmit = async () => {
        if (!selectedReason) {
            alert('Please select a reason for reporting');
            return;
        }
        if (selectedReason === 'other' && !customReason.trim()) {
            alert('Please provide a reason for reporting');
            return;
        }
        setIsSubmitting(true);
        try {
            const report = {
                reporterId,
                contentId,
                contentType,
                reason: selectedReason === 'other' ? customReason : selectedReason
            };
            const result = await contentModerationService.reportContent(report);
            if (result.success) {
                setSubmitSuccess(true);
                setTimeout(() => {
                    onClose();
                    setSubmitSuccess(false);
                    setSelectedReason('');
                    setCustomReason('');
                }, 2000);
            }
            else {
                alert('Failed to submit report. Please try again.');
            }
        }
        catch (error) {
            console.error('Report submission error:', error);
            alert('Failed to submit report. Please try again.');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleClose = () => {
        if (!isSubmitting) {
            setSelectedReason('');
            setCustomReason('');
            onClose();
        }
    };
    if (!isOpen)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx("div", { className: "absolute inset-0 bg-black/80 backdrop-blur-sm", onClick: handleClose }), _jsxs("div", { className: "relative bg-[#222222] border border-white/20 rounded-2xl max-w-4xl w-full p-6 shadow-2xl", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("h2", { className: "text-white text-lg font-semibold", children: "Report Content" }), _jsx("p", { className: "text-white/60 text-sm", children: "Help us improve the community" })] }), submitSuccess ? (_jsxs("div", { className: "text-center py-6", children: [_jsx("div", { className: "w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3", children: _jsx(CheckCircle, { size: 20, className: "text-green-400" }) }), _jsx("h4", { className: "text-white font-semibold text-base mb-2", children: "Thank You!" }), _jsx("p", { className: "text-white/60 text-sm", children: "Your feedback helps us improve the community." })] })) : (_jsxs("div", { className: "flex space-x-6 h-96", children: [_jsx("div", { className: "flex-1", children: contentUrl ? (_jsxs("div", { className: "h-full", children: [contentType === 'image' ? (_jsx("img", { src: contentUrl, alt: "Reported content", className: "w-full h-full object-cover rounded border border-white/20" })) : (_jsx("video", { src: contentUrl, className: "w-full h-full object-cover rounded border border-white/20", muted: true })), contentCaption && (_jsx("p", { className: "text-white/80 text-xs mt-2", children: contentCaption }))] })) : (_jsx("div", { className: "h-full bg-white/5 rounded border border-white/20 flex items-center justify-center", children: _jsx("p", { className: "text-white/40 text-xs", children: "No preview available" }) })) }), _jsxs("div", { className: "flex-1 flex flex-col", children: [_jsx("div", { className: "grid grid-cols-1 gap-1 flex-1", children: reportReasons.map((reason) => {
                                            const Icon = reason.icon;
                                            return (_jsxs("button", { onClick: () => setSelectedReason(reason.id), className: `w-full p-2 rounded-lg border transition-all duration-300 text-left flex items-center space-x-2 ${selectedReason === reason.id
                                                    ? 'border-white/40 bg-white/20 text-white'
                                                    : 'border-white/20 bg-white/5 text-white hover:bg-white/10'}`, children: [_jsx(Icon, { size: 14 }), _jsx("span", { className: "text-xs", children: reason.label })] }, reason.id));
                                        }) }), selectedReason === 'other' && (_jsxs("div", { className: "mt-3", children: [_jsx("textarea", { value: customReason, onChange: (e) => setCustomReason(e.target.value), placeholder: "Describe why this content should be reviewed...", className: "w-full h-20 p-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 resize-none focus:outline-none focus:border-white/40 focus:bg-white/10 text-xs", maxLength: 300 }), _jsxs("p", { className: "text-white/40 text-xs mt-1", children: [customReason.length, "/300 characters"] })] })), _jsxs("div", { className: "flex space-x-3 pt-3 mt-auto", children: [_jsx("button", { onClick: handleClose, disabled: isSubmitting, className: "flex-1 py-2 bg-white/5 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors border border-white/20 text-sm", children: "Cancel" }), _jsx("button", { onClick: handleSubmit, disabled: isSubmitting || !selectedReason || (selectedReason === 'other' && !customReason.trim()), className: `flex-1 py-2 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${selectedReason && (selectedReason !== 'other' || customReason.trim()) && !isSubmitting
                                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                                    : 'bg-white/10 text-white/40 cursor-not-allowed'}`, children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-3 h-3 border border-white/20 border-t-white rounded-full animate-spin" }), _jsx("span", { children: "Submitting..." })] })) : (_jsx("span", { children: "Submit Report" })) })] }), _jsx("p", { className: "text-white/40 text-xs text-center mt-3", children: "Your report will be reviewed by our moderation team." })] })] }))] })] }));
};
export default ContentReportModal;

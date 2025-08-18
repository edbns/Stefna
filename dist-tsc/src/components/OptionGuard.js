import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
// Option Guard Component
// Conditionally renders option buttons only when they are configured
import React from 'react';
import { isConfigured, OPTION_GROUPS } from '../utils/presets';
const OptionGuard = ({ group, optionKey, children, fallback = null }) => {
    const configured = isConfigured(group, optionKey);
    if (!configured) {
        return _jsx(_Fragment, { children: fallback });
    }
    return _jsx(_Fragment, { children: children });
};
export default OptionGuard;
export const ConfiguredOptions = ({ group, renderOption, emptyMessage = 'No options configured' }) => {
    const groupOptions = OPTION_GROUPS[group];
    if (!groupOptions) {
        return _jsx("div", { className: "text-white/60 text-sm", children: emptyMessage });
    }
    const entries = Object.entries(groupOptions);
    if (entries.length === 0) {
        return _jsx("div", { className: "text-white/60 text-sm", children: emptyMessage });
    }
    return (_jsx(_Fragment, { children: entries.map(([optionKey, option]) => (_jsx(React.Fragment, { children: renderOption(optionKey, option) }, optionKey))) }));
};
// Helper hook for checking if options are configured
export function useOptionConfiguration(group) {
    const groupOptions = OPTION_GROUPS[group];
    const configuredCount = groupOptions ? Object.keys(groupOptions).length : 0;
    return {
        hasOptions: configuredCount > 0,
        optionCount: configuredCount,
        isConfigured: (optionKey) => isConfigured(group, optionKey),
        getConfiguredKeys: () => groupOptions ? Object.keys(groupOptions) : []
    };
}


import { t } from '../i18n.js';

/**
 * Helper to get localized name from an item/weapon object.
 * Checks for nameKey+nameParams, nameKey, or falls back to name.
 */
export function getLocName(obj) {
    if (!obj) return '';
    if (obj.nameKey) {
        // If there are params (like for recipes), resolve them recursively if needed?
        // Current simple implementation:
        const params = {};
        if (obj.nameParams) {
            Object.keys(obj.nameParams).forEach(k => {
                const val = obj.nameParams[k];
                // If the param value looks like a key (e.g. 'items.w_sword.name'), translate it
                if (typeof val === 'string' && (val.startsWith('items.') || val.startsWith('ui.'))) {
                    params[k] = t(val);
                } else {
                    params[k] = val;
                }
            });
        }
        return t(obj.nameKey, params);
    }
    return obj.name || 'Unknown';
}

/**
 * Helper to get localized desc.
 */
export function getLocDesc(obj) {
    if (!obj) return '';
    if (obj.descKey) return t(obj.descKey);
    return obj.desc || '';
}

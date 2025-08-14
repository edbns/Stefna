// Safety guard for constructor calls that might fail
// Prevents "X is not a constructor" crashes

export function isClass(fn: any): boolean {
  return typeof fn === 'function' && /^class\s/.test(Function.prototype.toString.call(fn));
}

export function initMaybeClass(Thing: any, ...args: any[]): any {
  try {
    if (isClass(Thing)) {
      return new Thing(...args);
    }
    return Thing(...args);
  } catch (e) {
    console.error('Init failed (neither class nor function behaved):', e);
    return null;
  }
}

// Safe wrapper for any potentially problematic constructor
export function safeConstruct<T = any>(Thing: any, ...args: any[]): T | null {
  try {
    // Try as constructor first
    if (typeof Thing === 'function') {
      return new Thing(...args);
    }
    // Try as function call
    if (typeof Thing === 'function') {
      return Thing(...args);
    }
    console.warn('safeConstruct: Thing is not a function', typeof Thing);
    return null;
  } catch (e: any) {
    console.error('safeConstruct failed:', {
      thingType: typeof Thing,
      thingName: Thing?.name || 'unknown',
      error: e.message,
      args: args.length
    });
    return null;
  }
}

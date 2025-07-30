export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isRequired = (value: any): boolean => {
  return value !== null && value !== undefined && value !== '';
};

export const minLength = (value: string, min: number): boolean => {
  return value.length >= min;
};

export const maxLength = (value: string, max: number): boolean => {
  return value.length <= max;
};

export const isNumber = (value: any): boolean => {
  return !isNaN(value) && typeof value === 'number';
};

export const isPositiveNumber = (value: number): boolean => {
  return isNumber(value) && value > 0;
}; 
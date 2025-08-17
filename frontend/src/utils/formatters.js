/**
 * Formats a role string from database format (e.g., "service_provider") 
 * to display format (e.g., "Service Provider")
 * 
 * @param {string} role - The role string from the database
 * @returns {string} Formatted role string for display
 */
export const formatRoleName = (role) => {
  if (!role) return '';
  
  // Split by underscore and capitalize first letter of each word
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formats currency values for display
 * 
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};
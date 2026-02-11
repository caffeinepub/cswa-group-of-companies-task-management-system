/**
 * Utility functions for formatting data in the public search results
 */

/**
 * Converts a backend Time (bigint nanoseconds) to a readable date string
 * @param time - Optional Time value in nanoseconds
 * @returns Formatted date string or placeholder
 */
export function formatDate(time: bigint | undefined): string {
  if (!time) return '—';
  
  try {
    const milliseconds = Number(time) / 1_000_000;
    const date = new Date(milliseconds);
    
    // Format as "MMM DD, YYYY"
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    return '—';
  }
}

/**
 * Returns a placeholder for missing values
 */
export function placeholder(): string {
  return '—';
}

/**
 * Formats optional text values with placeholder for null/undefined
 */
export function formatOptionalText(text: string | undefined): string {
  return text || '—';
}

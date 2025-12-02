/**
 * Utility functions for the Blog Frontend application
 */

/**
 * Format ISO 8601 date string to human-readable format
 * 
 * @param isoString - ISO 8601 date string (e.g., "2025-11-27T10:30:00Z")
 * @returns Formatted date string (e.g., "November 27, 2025")
 */
export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoString; // Fallback to original string if parsing fails
  }
}

/**
 * Format ISO 8601 date string to relative time
 * 
 * @param isoString - ISO 8601 date string
 * @returns Relative time string (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return formatDate(isoString);
    }
  } catch {
    return isoString;
  }
}

/**
 * Generate slug from title (client-side preview only)
 * Note: Server generates authoritative slug
 * 
 * @param title - Post title
 * @returns URL-friendly slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens from start/end
}

/**
 * Truncate text to specified length with ellipsis
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Extract plain text excerpt from Markdown content
 * Removes Markdown formatting for preview display
 * 
 * @param markdown - Markdown content
 * @param maxLength - Maximum excerpt length
 * @returns Plain text excerpt
 */
export function extractExcerpt(markdown: string, maxLength: number = 150): string {
  // Remove Markdown formatting (basic implementation)
  const plainText = markdown
    .replace(/^#+\s+/gm, '') // Remove headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links
    .replace(/`(.+?)`/g, '$1') // Remove code
    .replace(/^\s*[-*]\s+/gm, '') // Remove list markers
    .trim();

  return truncate(plainText, maxLength);
}

/**
 * Get character count for textarea/input
 * Useful for displaying "X/200 characters" feedback
 * 
 * @param text - Input text
 * @param max - Maximum allowed characters
 * @returns Object with current count and remaining
 */
export function getCharacterCount(
  text: string,
  max: number
): { current: number; remaining: number; isOver: boolean } {
  const current = text.length;
  const remaining = max - current;
  const isOver = remaining < 0;
  
  return { current, remaining, isOver };
}

/**
 * Debounce function for performance optimization
 * Delays execution until after specified wait period
 * 
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

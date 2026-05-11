/**
 * Chat utility functions
 */

// Format message date headers
export function getDateLabel(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Check if attachment is an image
export function isImageFile(url) {
  if (!url) return false;
  const ext = url.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
}

// Check if attachment is a video
export function isVideoFile(url) {
  if (!url) return false;
  const ext = url.split('.').pop()?.toLowerCase();
  return ['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext);
}

// Check if attachment is audio
export function isAudioFile(url) {
  if (!url) return false;
  const ext = url.split('.').pop()?.toLowerCase();
  return ['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(ext);
}

// Check if attachment is a PDF
export function isPdfFile(url) {
  if (!url) return false;
  return url.toLowerCase().endsWith('.pdf');
}

// Get file icon based on type
export function getFileIcon(mimeType, fileName) {
  if (!mimeType && !fileName) return 'FileText';
  
  const mime = (mimeType || '').toLowerCase();
  const name = (fileName || '').toLowerCase();
  
  if (mime.startsWith('image/') || isImageFile(name)) return 'Image';
  if (mime.startsWith('video/') || isVideoFile(name)) return 'Video';
  if (mime.startsWith('audio/') || isAudioFile(name)) return 'Music';
  if (mime === 'application/pdf' || isPdfFile(name)) return 'FileText';
  if (mime.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) return 'FileText';
  if (mime.includes('excel') || mime.includes('spreadsheet') || name.endsWith('.xls') || name.endsWith('.xlsx')) return 'Table';
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('compressed')) return 'Archive';
  
  return 'File';
}

// Format file size
export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Extract URLs from text
export function extractUrls(text) {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

// Detect if text contains code block
export function hasCodeBlock(text) {
  if (!text) return false;
  return text.includes('```') || text.includes('`');
}

// Parse code blocks from text
export function parseCodeBlocks(text) {
  if (!text) return [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks = [];
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  
  return blocks;
}

// Play notification sound
export function playNotificationSound() {
  try {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Ignore errors (e.g., user hasn't interacted with page yet)
    });
  } catch (error) {
    // Ignore
  }
}

// Request notification permission
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Show desktop notification
export function showDesktopNotification(title, body, icon) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: icon || '/logo.png',
        badge: '/logo.png',
        tag: 'chat-notification',
        renotify: true,
      });
    } catch (error) {
      // Ignore
    }
  }
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Generate avatar URL
export function getAvatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&size=64&background=1A2B3C&color=fff&bold=true&font-size=0.45`;
}

// Validate file before upload
export function validateFile(file) {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    'application/zip', 'application/x-rar-compressed',
  ];

  if (file.size > maxSize) {
    return { valid: false, error: `File size cannot exceed 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB` };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type '${file.type}' is not allowed.` };
  }

  return { valid: true };
}

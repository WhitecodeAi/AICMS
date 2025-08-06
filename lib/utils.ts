import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getTenantFromHost(host: string): { subdomain: string; domain: string } {
  const parts = host.split('.')
  
  if (parts.length >= 3) {
    // subdomain.domain.com
    const subdomain = parts[0]
    const domain = parts.slice(1).join('.')
    return { subdomain, domain }
  } else if (parts.length === 2) {
    // domain.com (main domain)
    return { subdomain: 'www', domain: host }
  }
  
  // localhost or single word domain
  return { subdomain: 'www', domain: host }
}

import { IBanner } from '@/models/Banner';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function getBanners(type?: 'all'): Promise<IBanner[]> {
  try {
    // If server-side, we should probably use absolute URL or db directly if preferred.
    // For simplicity & consistency with other libs (categories, products):
    // If it's server component, we can call DB directly if we wanted to avoid HTTP overhead,
    // but fetching from API keeps logic centralized.
    // However, during build time or server rendering, relative URLs might fail without base.
    // Let's use absolute URL if environment variable is set, otherwise assume localhost or handle error.
    
    // Better: Helper function to call DB directly if on server, OR use fetch.
    // Let's stick to fetch for now, assuming standard Next.js setup.
    
    // NOTE: 'type=all' requires admin auth which we can't easily pass from server function 
    // unless we have the token.
    // So 'getBanners' generally fetches public active banners.
    
    const url = type ? `${BASE_URL}/api/banners?type=${type}` : `${BASE_URL}/api/banners`;
    
    // Note: Calling internal API from server component requires absolute URL.
    // If BASE_URL is not set, this might fail on server.
    // Fallback?
    
    const res = await fetch(url.startsWith('http') ? url : `http://localhost:3000${url}`, {
      cache: 'no-store' 
    });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    return data.banners || [];
  } catch (error) {
    console.error("Error fetching banners:", error);
    return [];
  }
}

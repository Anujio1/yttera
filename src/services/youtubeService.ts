// Based on Piped OpenAPI Spec
export interface PipedStreamItem {
  url: string; // Relative URL like /watch?v=VIDEO_ID
  type: string; // 'stream'
  title: string;
  thumbnail: string;
  uploaderName?: string;
  uploaderUrl?: string;
  uploaderAvatar?: string;
  uploadedDate?: string;
  shortDescription?: string | null;
  duration: number;
  views?: number;
  uploaded?: number;
  uploaderVerified?: boolean;
  isShort?: boolean;
  // Custom added property
  videoId?: string;
}

export interface PipedAudioStream {
  url: string;
  format: string; // e.g., "M4A", "WEBMA"
  quality: string; // e.g., "128 kbps"
  mimeType: string; // e.g., "audio/mp4"
  codec?: string;
  bitrate?: number;
  initStart?: number;
  initEnd?: number;
  indexStart?: number;
  indexEnd?: number;
  videoOnly: boolean;
}

export interface PipedVideoInfo {
  audioStreams: PipedAudioStream[];
  title: string;
  thumbnailUrl: string;
  uploader: string;
  uploaderUrl?: string;
  uploaderAvatar?: string;
  uploaderVerified?: boolean;
  description?: string;
  duration: number;
  views?: number;
  likes?: number;
  dislikes?: number;
  livestream?: boolean;
  hls?: string | null; // HLS manifest URL
  relatedStreams?: PipedStreamItem[];
}

interface PipedSearchPage {
  items: PipedStreamItem[];
  nextpage: string | null;
  corrected?: boolean;
  suggestion?: string | null;
}

const API_BASE_URL = 'https://pipedapi.kavin.rocks';

/**
 * Searches for videos on Piped.
 * @param query The search query.
 * @param filter The search filter (e.g., 'videos', 'music_songs'). Defaults to 'videos'.
 * @returns A promise that resolves to an array of search results (StreamItem).
 */
export async function searchVideos(query: string, filter: string = 'videos'): Promise<PipedStreamItem[]> {
  if (!query.trim()) {
    return [];
  }
  try {
    const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}&filter=${encodeURIComponent(filter)}`);
    if (!response.ok) {
      console.error('Search API request failed:', response.status, await response.text());
      throw new Error(`Failed to search videos: ${response.status}`);
    }
    const data: PipedSearchPage = await response.json();
    // Extract videoId from the relative URL for easier use later
    return data.items.map(item => {
      let videoId = '';
      if (item.url && item.url.includes('/watch?v=')) {
        videoId = item.url.split('/watch?v=')[1];
      } else if (item.url && item.url.includes('/shorts/')) {
        videoId = item.url.split('/shorts/')[1];
      }
      // It's good practice to ensure essential fields are present
      return {
        ...item,
        videoId: videoId, // Add videoId directly to the item
      };
    }).filter(item => item.type === 'stream' && item.videoId); // Ensure it's a stream and has a videoId
  } catch (error) {
    console.error('Error during searchVideos:', error);
    return []; // Return empty array on error
  }
}

/**
 * Fetches detailed information for a specific video, including audio streams.
 * @param videoId The ID of the video.
 * @returns A promise that resolves to the video information (VideoInfo).
 */
export async function getVideoInfo(videoId: string): Promise<PipedVideoInfo | null> {
  if (!videoId.trim()) {
    return null;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/streams/${videoId}`);
    if (!response.ok) {
      console.error('GetVideoInfo API request failed:', response.status, await response.text());
      throw new Error(`Failed to get video info: ${response.status}`);
    }
    const data: PipedVideoInfo = await response.json();
    return data;
  } catch (error) {
    console.error('Error during getVideoInfo:', error);
    return null; // Return null on error
  }
}

// src/components/AudioPlayer.ts
import { PipedAudioStream, PipedVideoInfo } from '../services/youtubeService';
import { playNext as playNextFromQueue } from './PlaylistManager'; // Add this import and alias

const playerContainer = document.getElementById('player-container') as HTMLDivElement;
let audioPlayer: HTMLAudioElement | null = null;
let trackInfoDiv: HTMLDivElement | null = null;

export function setupAudioPlayer() {
  if (!playerContainer) {
    console.error('Player container not found');
    return;
  }

  trackInfoDiv = document.createElement('div');
  trackInfoDiv.id = 'track-info';
  playerContainer.appendChild(trackInfoDiv);

  audioPlayer = document.createElement('audio');
  audioPlayer.controls = true; // Show default audio controls
  playerContainer.appendChild(audioPlayer);

  audioPlayer.onended = () => {
    console.log('Track ended, playing next from queue.');
    playNextFromQueue();
  };

  // Initial state: player hidden or placeholder
  trackInfoDiv.innerHTML = '<p>Select a track to play.</p>';
}

export function playAudio(videoInfo: PipedVideoInfo, audioStream: PipedAudioStream) {
  if (!audioPlayer || !trackInfoDiv) {
    console.error('Audio player or track info div not initialized.');
    return;
  }

  trackInfoDiv.innerHTML = `
    <h4>Now Playing:</h4>
    <img src="${videoInfo.thumbnailUrl}" alt="${videoInfo.title}" style="width: 80px; height: 80px; object-fit: cover;"/>
    <p><strong>${videoInfo.title}</strong></p>
    <p><small>Uploader: ${videoInfo.uploader}</small></p>
    <p><small>Quality: ${audioStream.quality} (${audioStream.format})</small></p>
  `;

  audioPlayer.src = audioStream.url;
  audioPlayer.load(); // Important to load the new source
  audioPlayer.play().catch(error => console.error('Error playing audio:', error));
}

// Helper to select a preferred audio stream (e.g., M4A, medium quality)
export function selectPreferredAudioStream(streams: PipedAudioStream[]): PipedAudioStream | null {
    if (!streams || streams.length === 0) return null;

    // Prefer M4A, then WEBMA, non-video only
    const m4aStreams = streams.filter(s => s.mimeType === 'audio/mp4' && !s.videoOnly);
    if (m4aStreams.length > 0) {
        // Simple: pick the first one. Could be smarter (e.g. by bitrate)
        return m4aStreams[0];
    }

    const webmaStreams = streams.filter(s => s.mimeType === 'audio/webm' && !s.videoOnly);
    if (webmaStreams.length > 0) {
        return webmaStreams[0];
    }

    // Fallback to any audio stream if specific formats are not found
    const anyAudio = streams.find(s => s.mimeType?.startsWith('audio/') && !s.videoOnly);
    return anyAudio || streams.find(s => !s.videoOnly) || streams[0] || null;
}

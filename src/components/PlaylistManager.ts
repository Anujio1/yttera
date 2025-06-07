// src/components/PlaylistManager.ts
import { PipedStreamItem, PipedVideoInfo, getVideoInfo } from '../services/youtubeService'; // Added PipedVideoInfo
import { playAudio, selectPreferredAudioStream } from './AudioPlayer';

let queue: PipedStreamItem[] = [];
let currentIndex = -1; // Index of currently playing track in the queue

const playlistQueueElement = document.getElementById('playlist-queue') as HTMLUListElement;
const nextButton = document.getElementById('next-button') as HTMLButtonElement;
const prevButton = document.getElementById('prev-button') as HTMLButtonElement;
const clearQueueButton = document.getElementById('clear-queue-button') as HTMLButtonElement;


export function setupPlaylistManager() {
  if (!playlistQueueElement || !nextButton || !prevButton || !clearQueueButton) {
    console.error('Playlist UI elements not found');
    // Attempt to query them again, in case of timing issues with DOMContentLoaded
    // This is a fallback, ideally elements are present when main.ts calls this.
    const recheckPlaylistQueueElement = document.getElementById('playlist-queue') as HTMLUListElement;
    const recheckNextButton = document.getElementById('next-button') as HTMLButtonElement;
    const recheckPrevButton = document.getElementById('prev-button') as HTMLButtonElement;
    const recheckClearQueueButton = document.getElementById('clear-queue-button') as HTMLButtonElement;

    if (!recheckPlaylistQueueElement || !recheckNextButton || !recheckPrevButton || !recheckClearQueueButton) {
        console.error('Critical: Playlist UI elements still not found after recheck.');
        return;
    }
    // If recheck found them, assign to the module-scoped variables
    (playlistQueueElement as any) = recheckPlaylistQueueElement;
    (nextButton as any) = recheckNextButton;
    (prevButton as any) = recheckPrevButton;
    (clearQueueButton as any) = recheckClearQueueButton;
  }

  nextButton.addEventListener('click', playNext);
  prevButton.addEventListener('click', playPrevious);
  clearQueueButton.addEventListener('click', clearQueue);

  renderQueue(); // Initial render (empty)
  if (clearQueueButton) clearQueueButton.style.display = queue.length > 0 ? 'block' : 'none'; // Initial state
}

export function addToQueue(item: PipedStreamItem) {
  // Avoid duplicates by videoId
  if (!queue.find(queuedItem => queuedItem.videoId === item.videoId)) {
    queue.push(item);
    renderQueue();
    if (clearQueueButton) clearQueueButton.style.display = queue.length > 0 ? 'block' : 'none';

    // If nothing is playing and queue was empty, play the first added item
    if (currentIndex === -1 && queue.length === 1) {
        playFromQueue(0);
    }
  } else {
    console.log("Item already in queue:", item.title);
  }
}

function removeFromQueue(videoId: string) {
    const itemIndex = queue.findIndex(item => item.videoId === videoId);
    if (itemIndex === -1) return;

    const isPlayingThisItem = itemIndex === currentIndex;
    queue.splice(itemIndex, 1);

    if (isPlayingThisItem) {
        const audioElement = document.querySelector('#player-container audio') as HTMLAudioElement;
        if (audioElement) {
            audioElement.pause();
            audioElement.src = '';
        }
        const trackInfoDiv = document.getElementById('track-info');
        if (trackInfoDiv) trackInfoDiv.innerHTML = '<p>Select a track to play.</p>';

        if (queue.length > 0) {
            // If the removed item was the current one, try to play the item that is now at the same index,
            // or the last item if the removed item was the last one.
            const nextIndexToPlay = Math.min(itemIndex, queue.length - 1);
            currentIndex = -1; // Force playFromQueue to set it correctly based on new queue
            playFromQueue(nextIndexToPlay);
        } else {
            currentIndex = -1; // No items left
        }
    } else if (itemIndex < currentIndex) {
        // If an item before the current one was removed, adjust current index
        currentIndex--;
    }

    renderQueue();
    if (clearQueueButton) clearQueueButton.style.display = queue.length > 0 ? 'block' : 'none';
}


async function playFromQueue(index: number) {
  if (index < 0 || index >= queue.length) {
    console.log('End of queue or invalid index.');
    // Optionally stop player or give feedback
    const audioElement = document.querySelector('#player-container audio') as HTMLAudioElement;
    if (audioElement) {
        audioElement.pause();
        // Do not clear src here, user might want to replay the last song of the queue
    }
    // Clear current track info if queue ends
    const trackInfoDiv = document.getElementById('track-info');
    if (trackInfoDiv && queue.length === 0) trackInfoDiv.innerHTML = '<p>Queue finished. Select a track to play.</p>';

    currentIndex = -1; // Reset index if we are truly at the end or invalid state
    renderQueue(); // Update UI to show nothing is playing
    return;
  }
  currentIndex = index;
  const item = queue[currentIndex];
  if (!item || !item.videoId) {
    console.error('Invalid item in queue or missing videoId', item);
    playNext();
    return;
  }

  console.log(`Playing from queue: ${item.title}`);
  const trackInfoDiv = document.getElementById('track-info');
  if (trackInfoDiv) trackInfoDiv.innerHTML = `<p>Loading ${item.title}...</p>`;


  const videoInfo = await getVideoInfo(item.videoId);
  if (videoInfo && videoInfo.audioStreams) {
    const preferredStream = selectPreferredAudioStream(videoInfo.audioStreams);
    if (preferredStream) {
      playAudio(videoInfo, preferredStream);
    } else {
      alert('No suitable audio stream found for this queued video.');
      if (trackInfoDiv) trackInfoDiv.innerHTML = `<p>Error loading ${item.title}. No stream.</p>`;
      playNext();
    }
  } else {
    alert('Could not fetch video details for queued item.');
    if (trackInfoDiv) trackInfoDiv.innerHTML = `<p>Error loading ${item.title}. No details.</p>`;
    playNext();
  }
  renderQueue();
}

export function playNext() {
  if (queue.length === 0) {
    console.log("PlayNext called but queue is empty.");
    return;
  }
  let nextIndex = currentIndex + 1;
  if (nextIndex >= queue.length) {
    console.log("Reached end of queue.");
    // Optional: Stop here, or loop. Task implies looping.
    nextIndex = 0;
    if (queue.length === 0) { // Double check if queue emptied somehow
        currentIndex = -1;
        renderQueue();
        return;
    }
  }
  playFromQueue(nextIndex);
}

export function playPrevious() {
  if (queue.length === 0) return;
  let prevIndex = currentIndex - 1;
  if (prevIndex < 0) {
    prevIndex = queue.length - 1; // Loop to the end
  }
  playFromQueue(prevIndex);
}

function clearQueue() {
    queue = [];
    currentIndex = -1;
    const audioElement = document.querySelector('#player-container audio') as HTMLAudioElement;
    if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
    }
    const trackInfoDiv = document.getElementById('track-info');
    if (trackInfoDiv) trackInfoDiv.innerHTML = '<p>Queue cleared. Select a track to play.</p>';
    renderQueue();
    if (clearQueueButton) clearQueueButton.style.display = 'none';
}

function renderQueue() {
  if (!playlistQueueElement) {
      // Attempt to re-query, might be an issue if called before DOM fully ready
      const recheckPlaylistQueueElement = document.getElementById('playlist-queue') as HTMLUListElement;
      if (!recheckPlaylistQueueElement) {
          console.error("Cannot render queue: playlistQueueElement is null.");
          return;
      }
      (playlistQueueElement as any) = recheckPlaylistQueueElement;
  }
  playlistQueueElement.innerHTML = '';

  if (queue.length === 0) {
    playlistQueueElement.innerHTML = '<li>Queue is empty.</li>';
    return;
  }

  queue.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = (index === currentIndex) ? 'playing' : '';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'item-title';
    titleSpan.textContent = item.title || 'Unknown Title';
    titleSpan.title = item.title || 'Unknown Title';

    li.appendChild(titleSpan);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-from-queue';
    removeBtn.textContent = 'X';
    removeBtn.title = 'Remove from queue';
    removeBtn.onclick = (e) => {
        e.stopPropagation();
        if (item.videoId) { // Ensure videoId exists before trying to remove
            removeFromQueue(item.videoId);
        } else {
            console.error("Cannot remove item without videoId:", item);
        }
    };
    li.appendChild(removeBtn);

    li.addEventListener('click', () => playFromQueue(index));
    playlistQueueElement.appendChild(li);
  });
}

// src/components/SearchUI.ts
import { searchVideos, getVideoInfo, PipedStreamItem } from '../services/youtubeService';
import { playAudio, selectPreferredAudioStream } from './AudioPlayer';
import { addToQueue } from './PlaylistManager'; // Add this import

const searchContainer = document.getElementById('search-container') as HTMLDivElement;
const resultsContainer = document.getElementById('search-results') as HTMLDivElement;

export function setupSearchUI() {
  if (!searchContainer || !resultsContainer) {
    console.error('Search or results container not found');
    return;
  }

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search for music...';

  const searchButton = document.createElement('button');
  searchButton.textContent = 'Search';

  searchContainer.appendChild(searchInput);
  searchContainer.appendChild(searchButton);

  searchButton.addEventListener('click', async () => {
    const query = searchInput.value;
    if (!query) return;

    resultsContainer.innerHTML = '<p>Searching...</p>'; // Feedback
    const results = await searchVideos(query, 'music_songs'); // Prioritize songs
    displayResults(results);
  });

  searchInput.addEventListener('keypress', async (event) => {
    if (event.key === 'Enter') {
      const query = searchInput.value;
      if (!query) return;

      resultsContainer.innerHTML = '<p>Searching...</p>';
      const results = await searchVideos(query, 'music_songs');
      displayResults(results);
    }
  });
}

function displayResults(results: PipedStreamItem[]) {
  if (!resultsContainer) return;
  resultsContainer.innerHTML = ''; // Clear previous results

  if (results.length === 0) {
    resultsContainer.innerHTML = '<p>No results found.</p>';
    return;
  }

  const ul = document.createElement('ul');
  results.forEach(item => {
    if (!item.videoId) return; // Skip if no videoId (already filtered in service, but good check)

    const li = document.createElement('li');
    li.dataset.videoId = item.videoId; // Store videoId on the element (optional, as item is in scope)

    const imgElement = document.createElement('img');
    imgElement.src = item.thumbnail;
    imgElement.alt = item.title || 'Thumbnail';

    const itemContentDiv = document.createElement('div');
    itemContentDiv.style.flexGrow = '1'; // Allow text to take space
    itemContentDiv.innerHTML = `
      <strong>${item.title}</strong>
      ${item.uploaderName ? `<br/><small>By: ${item.uploaderName}</small>` : ''}
      <br/><small>Duration: ${formatDuration(item.duration)}</small>
    `;

    const playNowButton = document.createElement('button');
    playNowButton.textContent = 'Play';
    playNowButton.style.marginLeft = '10px';
    playNowButton.style.padding = '5px 10px'; // Basic styling for buttons
    playNowButton.style.fontSize = '12px';
    playNowButton.onclick = async (e) => {
        e.stopPropagation();
        const videoId = item.videoId;
        if (!videoId) return;

        console.log(`Fetching info for ${videoId} to play now...`);
        const videoInfo = await getVideoInfo(videoId);
        if (videoInfo && videoInfo.audioStreams) {
          const preferredStream = selectPreferredAudioStream(videoInfo.audioStreams);
          if (preferredStream) {
            playAudio(videoInfo, preferredStream);
          } else {
            alert('No suitable audio stream found for this video.');
            console.warn('No suitable audio stream found:', videoInfo.audioStreams);
          }
        } else {
          alert('Could not fetch video details.');
        }
    };

    const addToQueueButton = document.createElement('button');
    addToQueueButton.textContent = 'Add to Queue';
    addToQueueButton.style.marginLeft = '10px'; // Space from Play button
    addToQueueButton.style.padding = '5px 10px'; // Basic styling
    addToQueueButton.style.fontSize = '12px';
    addToQueueButton.onclick = (e) => {
      e.stopPropagation();
      addToQueue(item);
    };

    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.style.marginLeft = 'auto';
    buttonsWrapper.style.display = 'flex';
    buttonsWrapper.style.alignItems = 'center';
    buttonsWrapper.style.flexShrink = '0'; // Prevent buttons from shrinking

    buttonsWrapper.appendChild(playNowButton);
    buttonsWrapper.appendChild(addToQueueButton);

    li.appendChild(imgElement);
    li.appendChild(itemContentDiv);
    li.appendChild(buttonsWrapper);

    ul.appendChild(li);
  });
  resultsContainer.appendChild(ul);
}

function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

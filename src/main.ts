// src/main.ts
import { setupAudioPlayer } from './components/AudioPlayer';
import { setupSearchUI } from './components/SearchUI';
import { setupPlaylistManager } from './components/PlaylistManager'; // Add this
import './styles/main.css'; // Ensure styles are imported if not already via HTML

document.addEventListener('DOMContentLoaded', () => {
  const appDiv = document.querySelector<HTMLDivElement>('#app');
  if (!appDiv) {
    console.error('App container not found!');
    return;
  }

  // Clear initial "Hello Music App!"
  // The rest of the UI is built by components.
  // Ensure the basic structure from index.html is respected and available for components
  let header = appDiv.querySelector('header');
  if (!header) {
    // If header is missing, create it (though index.html should have it)
    header = document.createElement('header');
    appDiv.prepend(header); // Add to the top
    const h1 = document.createElement('h1');
    h1.textContent = 'Music App';
    header.appendChild(h1);
  }

  let searchContainer = header.querySelector('#search-container');
  if (!searchContainer) {
    searchContainer = document.createElement('div');
    searchContainer.id = 'search-container';
    header.appendChild(searchContainer);
  }

  let mainContent = appDiv.querySelector('main');
  if (!mainContent) {
    // If main is missing, create it
    mainContent = document.createElement('main');
    appDiv.appendChild(mainContent); // Append after header
  }

  let searchResults = mainContent.querySelector('#search-results');
  if (!searchResults) {
    searchResults = document.createElement('div');
    searchResults.id = 'search-results';
    mainContent.appendChild(searchResults);
  }

  let playerContainer = mainContent.querySelector('#player-container');
  if (!playerContainer) {
    playerContainer = document.createElement('div');
    playerContainer.id = 'player-container';
    mainContent.appendChild(playerContainer);
  }

  // Setup UI components
  setupSearchUI();
  setupAudioPlayer();
  setupPlaylistManager(); // Initialize playlist manager

  console.log('Music app initialized.');
});

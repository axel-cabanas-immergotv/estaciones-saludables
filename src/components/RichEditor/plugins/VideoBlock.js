import Quill from 'quill';

const Block = Quill.import('blots/block');
const Inline = Quill.import('blots/inline');

// Custom video blot that renders as an iframe
class VideoBlot extends Block {
  static create(value) {
    const node = super.create();
    node.setAttribute('data-video-url', value.url);
    node.setAttribute('data-video-title', value.title);
    
    const iframe = document.createElement('iframe');
    iframe.src = `snippet.univtec.com/player-mobile.html?stream=${encodeURIComponent(value.url)}`;
    iframe.width = '100%';
    iframe.height = '400';
    iframe.frameBorder = '0';
    iframe.allowFullscreen = true;
    iframe.style.borderRadius = '8px';
    iframe.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    
    const title = document.createElement('p');
    title.textContent = value.title;
    title.style.margin = '8px 0';
    title.style.fontWeight = '500';
    title.style.color = '#333';
    
    node.appendChild(iframe);
    node.appendChild(title);
    
    return node;
  }

  static value(node) {
    return {
      url: node.getAttribute('data-video-url'),
      title: node.getAttribute('data-video-title')
    };
  }
}

VideoBlot.blotName = 'video';
VideoBlot.tagName = 'div';
VideoBlot.className = 'ql-video-block';

// Register the custom blot
Quill.register(VideoBlot);

// Video insertion handler
class VideoBlock {
  constructor(quill, options = {}) {
    this.quill = quill;
    this.options = {
      apiEndpoint: '/api/video/',
      accountID: options.accountID || '',
      affiliate_id: options.affiliate_id || '',
      ...options
    };
    
    this.videos = [];
    this.init();
  }

  init() {
    // Add toolbar button
    const toolbar = this.quill.getModule('toolbar');
    if (toolbar) {
      toolbar.addHandler('video', this.showVideoSelector.bind(this));
    }
    
    // Add custom button to toolbar
    this.addVideoButton();
  }

  addVideoButton() {
    const toolbar = this.quill.container.querySelector('.ql-toolbar');
    if (toolbar) {
      const videoButton = document.createElement('button');
      videoButton.type = 'button';
      videoButton.className = 'ql-video-custom';
      videoButton.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>';
      videoButton.title = 'Insert Video';
      videoButton.addEventListener('click', this.showVideoSelector.bind(this));
      
      // Insert after existing video button or at the end
      const existingVideoBtn = toolbar.querySelector('.ql-video');
      if (existingVideoBtn) {
        existingVideoBtn.parentNode.insertBefore(videoButton, existingVideoBtn.nextSibling);
      } else {
        toolbar.appendChild(videoButton);
      }
    }
  }

  async fetchVideos(searchTerm = '') {
    try {
      const params = new URLSearchParams({
        accountID: this.options.accountID,
        search: searchTerm
      });
      
      if (this.options.affiliate_id) {
        params.append('affiliate_id', this.options.affiliate_id);
      }
      
      const response = await fetch(`${this.options.apiEndpoint}?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.videos = data.slice(0, 10); // Limit to 10 videos
      return this.videos;
    } catch (error) {
      console.error('Error fetching videos:', error);
      return [];
    }
  }

  showVideoSelector() {
    this.createVideoModal();
    this.fetchVideos().then(() => {
      this.populateVideoList();
    });
  }

  createVideoModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById('video-insert-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'video-insert-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      width: 500px;
      max-width: 90vw;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid #eee;
      padding-bottom: 16px;
    `;

    const title = document.createElement('h3');
    title.textContent = 'Insert Video';
    title.style.margin = '0';
    title.style.color = '#333';

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    closeBtn.addEventListener('click', () => modal.remove());

    header.appendChild(title);
    header.appendChild(closeBtn);

    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = `
      margin-bottom: 20px;
    `;

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search videos...';
    searchInput.style.cssText = `
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
    `;
    searchInput.addEventListener('input', (e) => {
      this.fetchVideos(e.target.value).then(() => {
        this.populateVideoList();
      });
    });

    searchContainer.appendChild(searchInput);

    const videoList = document.createElement('div');
    videoList.id = 'video-list';
    videoList.style.cssText = `
      max-height: 300px;
      overflow-y: auto;
    `;

    modalContent.appendChild(header);
    modalContent.appendChild(searchContainer);
    modalContent.appendChild(videoList);
    modal.appendChild(modalContent);

    document.body.appendChild(modal);

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  populateVideoList() {
    const videoList = document.getElementById('video-list');
    if (!videoList) return;

    videoList.innerHTML = '';

    if (this.videos.length === 0) {
      const noVideos = document.createElement('p');
      noVideos.textContent = 'No videos found';
      noVideos.style.cssText = `
        text-align: center;
        color: #666;
        padding: 20px;
      `;
      videoList.appendChild(noVideos);
      return;
    }

    this.videos.forEach((video, index) => {
      const videoItem = document.createElement('div');
      videoItem.style.cssText = `
        display: flex;
        align-items: center;
        padding: 12px;
        border: 1px solid #eee;
        border-radius: 6px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: background-color 0.2s;
      `;

      videoItem.addEventListener('mouseenter', () => {
        videoItem.style.backgroundColor = '#f5f5f5';
      });

      videoItem.addEventListener('mouseleave', () => {
        videoItem.style.backgroundColor = 'transparent';
      });

      const poster = document.createElement('img');
      poster.src = video.poster;
      poster.alt = video.title;
      poster.style.cssText = `
        width: 60px;
        height: 40px;
        object-fit: cover;
        border-radius: 4px;
        margin-right: 12px;
      `;
      poster.onerror = () => {
        poster.style.display = 'none';
      };

      const videoInfo = document.createElement('div');
      videoInfo.style.cssText = `
        flex: 1;
        min-width: 0;
      `;

      const videoTitle = document.createElement('div');
      videoTitle.textContent = video.title;
      videoTitle.style.cssText = `
        font-weight: 500;
        color: #333;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `;

      const videoUrl = document.createElement('div');
      videoUrl.textContent = video.url;
      videoUrl.style.cssText = `
        font-size: 12px;
        color: #666;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `;

      videoInfo.appendChild(videoTitle);
      videoInfo.appendChild(videoUrl);

      videoItem.appendChild(poster);
      videoItem.appendChild(videoInfo);

      videoItem.addEventListener('click', () => {
        this.insertVideo(video);
        document.getElementById('video-insert-modal')?.remove();
      });

      videoList.appendChild(videoItem);
    });
  }

  insertVideo(video) {
    const range = this.quill.getSelection();
    if (range) {
      this.quill.insertEmbed(range.index, 'video', video);
      this.quill.setSelection(range.index + 1);
    } else {
      // Insert at the end if no selection
      const length = this.quill.getLength();
      this.quill.insertEmbed(length - 1, 'video', video);
      this.quill.setSelection(length);
    }
  }
}

export default VideoBlock;

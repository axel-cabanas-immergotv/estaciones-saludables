import React, { useRef, useEffect, useCallback, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import VideoBlock from './plugins/VideoBlock';
import './RichEditor.css';

const RichEditor = ({
  value = '',
  onChange,
  placeholder = 'Start writing...',
  readOnly = false,
  accountID = '',
  affiliate_id = '',
  height = '400px',
  className = '',
  ...props
}) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const [isVideoPluginLoaded, setIsVideoPluginLoaded] = useState(false);

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }, { 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    },
    history: {
      delay: 2000,
      maxStack: 500,
      userOnly: true
    }
  };

  // Quill formats configuration
  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'blockquote', 'code-block',
    'list', 'bullet',
    'indent',
    'direction', 'align',
    'link', 'image', 'video',
    'clean'
  ];

  // Initialize Quill editor
  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      // Create Quill instance
      const quill = new Quill(editorRef.current, {
        modules,
        formats,
        placeholder,
        readOnly,
        theme: 'snow'
      });

      quillRef.current = quill;

      // Set initial content
      if (value) {
        quill.root.innerHTML = value;
      }

      // Add change handler
      quill.on('text-change', (delta, oldDelta, source) => {
        if (source === 'user' && onChange) {
          const html = quill.root.innerHTML;
          onChange(html, delta, source, quill);
        }
      });

      // Initialize video plugin
      initializeVideoPlugin(quill);
      
      // Initialize block system
      initializeBlockSystem(quill);
    }
  }, []);

  // Initialize block system directly
  const initializeBlockSystem = useCallback((quill) => {
    if (!quill) return;
    
    const editor = quill.root;
    
    // Add drop event listeners
    editor.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    
    editor.addEventListener('drop', (e) => {
      e.preventDefault();
      
      const blockType = e.dataTransfer.getData('text/block-type');
      const blockContent = e.dataTransfer.getData('text/block-content');
      
      if (blockType) {
        insertBlock(quill, blockType, blockContent);
      }
    });
    
    editor.addEventListener('dragenter', (e) => {
      e.preventDefault();
      editor.classList.add('ql-drop-zone-active');
    });
    
    editor.addEventListener('dragleave', (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) {
        editor.classList.remove('ql-drop-zone-active');
      }
    });
  }, []);
  
  // Insert block function
  const insertBlock = (quill, blockType, blockContent = null) => {
    // Get drop position
    const range = quill.getSelection();
    const index = range ? range.index : quill.getLength();
    
    // Handle different block types
    switch (blockType) {
      case 'heading1':
        quill.insertText(index, '\n', { header: 1 });
        quill.insertText(index + 1, blockContent || 'Heading 1');
        quill.setSelection(index + 1, blockContent ? blockContent.length : 9);
        break;
        
      case 'heading2':
        quill.insertText(index, '\n', { header: 2 });
        quill.insertText(index + 1, blockContent || 'Heading 2');
        quill.setSelection(index + 1, blockContent ? blockContent.length : 9);
        break;
        
      case 'heading3':
        quill.insertText(index, '\n', { header: 3 });
        quill.insertText(index + 1, blockContent || 'Heading 3');
        quill.setSelection(index + 1, blockContent ? blockContent.length : 9);
        break;
        
      case 'paragraph':
        quill.insertText(index, '\n', {});
        quill.insertText(index + 1, blockContent || 'New paragraph');
        quill.setSelection(index + 1, blockContent ? blockContent.length : 13);
        break;
        
      case 'quote':
        quill.insertText(index, '\n', { blockquote: true });
        quill.insertText(index + 1, blockContent || 'Quote text');
        quill.setSelection(index + 1, blockContent ? blockContent.length : 11);
        break;
        
      case 'code':
        quill.insertText(index, '\n', { 'code-block': true });
        quill.insertText(index + 1, blockContent || 'Code here');
        quill.setSelection(index + 1, blockContent ? blockContent.length : 9);
        break;
        
      default:
        break;
    }
  };

  // Initialize video plugin
  const initializeVideoPlugin = useCallback((quill) => {
    if (quill && !isVideoPluginLoaded) {
      try {
        // Register custom video blot
        const VideoBlot = Quill.import('blots/block');
        const CustomVideoBlot = class extends VideoBlot {
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
        };

        CustomVideoBlot.blotName = 'video';
        CustomVideoBlot.tagName = 'div';
        CustomVideoBlot.className = 'ql-video-block';

        Quill.register(CustomVideoBlot);

        // Initialize video plugin
        new VideoBlock(quill, {
          accountID,
          affiliate_id
        });

        setIsVideoPluginLoaded(true);
      } catch (error) {
        console.error('Error initializing video plugin:', error);
      }
    }
  }, [accountID, affiliate_id, isVideoPluginLoaded]);



  // Update content when value prop changes
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      quillRef.current.root.innerHTML = value;
    }
  }, [value]);

  // Update readOnly when prop changes
  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!readOnly);
    }
  }, [readOnly]);

  // Update placeholder when prop changes
  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.root.setAttribute('data-placeholder', placeholder);
    }
  }, [placeholder]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`rich-editor-container ${className}`} style={{ height }}>
      <div ref={editorRef} style={{ height: '100%' }} />

    </div>
  );
};

export default RichEditor;

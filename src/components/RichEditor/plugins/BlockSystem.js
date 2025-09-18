/**
 * Block System Plugin for Quill Editor
 * Provides drag and drop functionality for predefined content blocks
 */
class BlockSystem {
  constructor(quill, options = {}) {
    this.quill = quill;
    this.options = {
      blocks: options.blocks || this.getDefaultBlocks(),
      ...options
    };
    
    this.init();
  }

  init() {
    // Register custom blots for each block type
    this.registerBlockBlots();
    
    // Add drop zone detection
    this.addDropZoneDetection();
  }

  getDefaultBlocks() {
    return [
      {
        type: 'heading1',
        label: 'Heading 1',
        icon: 'H1',
        html: '<h1>Heading 1</h1>',
        quillFormat: { header: 1 }
      },
      {
        type: 'heading2',
        label: 'Heading 2',
        icon: 'H2',
        html: '<h2>Heading 2</h2>',
        quillFormat: { header: 2 }
      },
      {
        type: 'heading3',
        label: 'Heading 3',
        icon: 'H3',
        html: '<h3>Heading 3</h3>',
        quillFormat: { header: 3 }
      },
      {
        type: 'paragraph',
        label: 'Paragraph',
        icon: '¶',
        html: '<p>New paragraph</p>',
        quillFormat: {}
      },
      {
        type: 'quote',
        label: 'Quote',
        icon: '"',
        html: '<blockquote>Quote text</blockquote>',
        quillFormat: { blockquote: true }
      },
      {
        type: 'code',
        label: 'Code Block',
        icon: '</>',
        html: '<pre><code>Code here</code></pre>',
        quillFormat: { 'code-block': true }
      }
    ];
  }

  registerBlockBlots() {
    // Register custom blots for each block type
    this.options.blocks.forEach(block => {
      this.registerBlockBlot(block);
    });
  }

  registerBlockBlot(block) {
    const Quill = this.quill.constructor;
    
    // Create custom blot for this block type
    const BlockBlot = class extends Quill.import('blots/block') {
      static create(value) {
        const node = super.create();
        node.setAttribute('data-block-type', block.type);
        node.setAttribute('data-block-label', block.label);
        node.className = `ql-block-${block.type}`;
        
        // Set the content
        if (block.html) {
          node.innerHTML = block.html;
        }
        
        return node;
      }

      static value(node) {
        return {
          type: node.getAttribute('data-block-type'),
          label: node.getAttribute('data-block-label'),
          content: node.innerHTML
        };
      }
    };

    BlockBlot.blotName = `block-${block.type}`;
    BlockBlot.tagName = block.html ? this.getTagName(block.html) : 'div';
    
    Quill.register(BlockBlot);
  }

  getTagName(html) {
    // Extract tag name from HTML string
    const match = html.match(/<(\w+)/);
    return match ? match[1] : 'div';
  }

  addDropZoneDetection() {
    const editor = this.quill.root;
    
    // Simple and direct event handling
    editor.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    
    editor.addEventListener('drop', (e) => {
      e.preventDefault();
      this.handleDrop(e);
    });
    
    editor.addEventListener('dragenter', (e) => {
      e.preventDefault();
      this.showDropZone();
    });
    
    editor.addEventListener('dragleave', (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) {
        this.hideDropZone();
      }
    });
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    console.log('BlockSystem: Drag over detected');
  }

  handleDragEnter(e) {
    e.preventDefault();
    console.log('BlockSystem: Drag enter detected');
    this.showDropZone();
  }

  handleDragLeave(e) {
    // Only hide drop zone if leaving the editor completely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      this.hideDropZone();
    }
  }

  handleDrop(e) {
    e.preventDefault();
    this.hideDropZone();
    
    const blockType = e.dataTransfer.getData('text/block-type');
    const blockContent = e.dataTransfer.getData('text/block-content');
    
    console.log('BlockSystem: Drop detected!', { blockType, blockContent });
    
    if (blockType) {
      this.insertBlock(blockType, e, blockContent);
    }
  }

  showDropZone() {
    const editor = this.quill.root;
    editor.classList.add('ql-drop-zone-active');
  }

  hideDropZone() {
    const editor = this.quill.root;
    editor.classList.remove('ql-drop-zone-active');
  }

  insertBlock(blockType, dropEvent, blockContent = null) {
    // Get drop position
    const range = this.quill.getSelection();
    const index = range ? range.index : this.quill.getLength();

    // Handle different block types
    switch (blockType) {
      case 'heading1':
        this.quill.insertText(index, '\n', { header: 1 });
        this.quill.insertText(index + 1, blockContent || 'Heading 1');
        this.quill.setSelection(index + 1, blockContent ? blockContent.length : 9);
        break;
        
      case 'heading2':
        this.quill.insertText(index, '\n', { header: 2 });
        this.quill.insertText(index + 1, blockContent || 'Heading 2');
        this.quill.setSelection(index + 1, blockContent ? blockContent.length : 9);
        break;
        
      case 'heading3':
        this.quill.insertText(index, '\n', { header: 3 });
        this.quill.insertText(index + 1, blockContent || 'Heading 3');
        this.quill.setSelection(index + 1, blockContent ? blockContent.length : 9);
        break;
        
      case 'paragraph':
        this.quill.insertText(index, '\n', {});
        this.quill.insertText(index + 1, blockContent || 'New paragraph');
        this.quill.setSelection(index + 1, blockContent ? blockContent.length : 13);
        break;
        
      case 'quote':
        this.quill.insertText(index, '\n', { blockquote: true });
        this.quill.insertText(index + 1, blockContent || 'Quote text');
        this.quill.setSelection(index + 1, blockContent ? blockContent.length : 11);
        break;
        
      case 'code':
        this.quill.insertText(index, '\n', { 'code-block': true });
        this.quill.insertText(index + 1, blockContent || 'Code here');
        this.quill.setSelection(index + 1, blockContent ? blockContent.length : 9);
        break;
        
      default:
        // Try to find in configured blocks
        const block = this.options.blocks.find(b => b.type === blockType);
        if (block) {
          if (block.quillFormat && Object.keys(block.quillFormat).length > 0) {
            this.quill.insertText(index, '\n', block.quillFormat);
            this.quill.setSelection(index + 1, 0);
            
            if (block.html) {
              const content = this.extractTextContent(block.html);
              this.quill.insertText(index + 1, content);
            }
          } else {
            this.quill.clipboard.dangerouslyPasteHTML(index, block.html);
          }
        }
        break;
    }
  }

  extractTextContent(html) {
    // Extract text content from HTML string
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  // Public method to get available blocks
  getBlocks() {
    return this.options.blocks;
  }

  // Public method to add custom blocks
  addBlock(block) {
    this.options.blocks.push(block);
    this.registerBlockBlot(block);
  }
}

export default BlockSystem;

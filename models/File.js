const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const File = sequelize.define('File', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    original_name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Original filename as uploaded by user'
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Generated filename (usually UUID + extension)'
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'S3 key/path (e.g., images/stories/uuid.jpg)'
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Full S3 URL'
    },
    cdn_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'CDN URL generated from S3_CDN environment variable'
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'File size in bytes'
    },
    mimetype: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'MIME type (e.g., image/jpeg, image/png)'
    },
    extension: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'File extension (e.g., jpg, png, pdf)'
    },
    folder: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'images/general',
      comment: 'Folder/directory where file is stored'
    },
    hash: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: 'File hash for duplicate detection'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who uploaded the file'
    },
    usage_context: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Context where file is used (story_summary, story_featured, page_content, etc.)'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional metadata (dimensions, EXIF data, etc.)'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether the file is still active/available'
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Soft delete timestamp'
    }
  }, {
    tableName: 'files',
    timestamps: true,
    paranoid: true, // Enables soft deletes
    indexes: [
      {
        fields: ['key']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['folder']
      },
      {
        fields: ['mimetype']
      },
      {
        fields: ['hash']
      },
      {
        fields: ['usage_context']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  // Instance method to generate CDN URL
  File.prototype.getCdnUrl = function() {
    if (!process.env.S3_CDN) {
      return this.url;
    }
    
    // Replace S3 endpoint with CDN endpoint
    const s3Pattern = new RegExp(`https://${process.env.S3_REGION}\\.digitaloceanspaces\\.com/${process.env.S3_BUCKET_NAME}/`, 'g');
    return this.url.replace(s3Pattern, `${process.env.S3_CDN}/`);
  };

  // Static method to build CDN URL from S3 URL
  File.buildCdnUrl = function(s3Url) {
    if (!process.env.S3_CDN || !s3Url) {
      return s3Url;
    }
    
    const s3Pattern = new RegExp(`https://${process.env.S3_REGION}\\.digitaloceanspaces\\.com/${process.env.S3_BUCKET_NAME}/`, 'g');
    return s3Url.replace(s3Pattern, `${process.env.S3_CDN}/`);
  };

  // Hook to automatically set CDN URL before saving
  File.addHook('beforeSave', (file) => {
    if (file.url && process.env.S3_CDN) {
      file.cdn_url = File.buildCdnUrl(file.url);
    }
    
    // Extract extension from filename
    if (file.filename && !file.extension) {
      const lastDot = file.filename.lastIndexOf('.');
      if (lastDot > -1) {
        file.extension = file.filename.substring(lastDot + 1).toLowerCase();
      }
    }
  });

  return File;
}; 
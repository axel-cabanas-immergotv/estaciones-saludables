const express = require('express');
const { Story, User, Category } = require('../models');

const router = express.Router();

// Server-side rendered story for SEO
router.get('/:slug/meta', async (req, res) => {
  try {
    const story = await Story.findOne({
      where: { 
        slug: req.params.slug,
        status: 'published'
      },
      include: [
        { 
          model: User, 
          as: 'author', 
          attributes: ['first_name', 'last_name'] 
        },
        { 
          model: Category, 
          as: 'category', 
          attributes: ['name', 'slug'] 
        }
      ]
    });

    if (!story) {
      return res.status(404).json({ 
        success: false, 
        message: 'Story not found' 
      });
    }

    // Generate meta tags for SEO
    const metaTags = {
      title: story.meta_title || story.title,
      description: story.meta_description || story.excerpt || story.subtitle,
      keywords: story.tags || '',
      author: story.author.getFullName(),
      publishedTime: story.published_at,
      modifiedTime: story.updated_at,
      section: story.category ? story.category.name : '',
      url: `${req.protocol}://${req.get('host')}/story/${story.slug}`,
      image: story.featured_image || '',
      type: 'article'
    };

    res.json({
      success: true,
      meta: metaTags,
      story: {
        id: story.id,
        title: story.title,
        subtitle: story.subtitle,
        slug: story.slug,
        excerpt: story.excerpt,
        featured_image: story.featured_image,
        published_at: story.published_at,
        author: story.author,
        category: story.category
      }
    });
  } catch (error) {
    console.error('Get story meta error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get story content for client-side rendering
router.get('/:slug/content', async (req, res) => {
  try {
    const story = await Story.findOne({
      where: { 
        slug: req.params.slug,
        status: 'published'
      },
      include: [
        { 
          model: User, 
          as: 'author', 
          attributes: ['first_name', 'last_name'] 
        },
        { 
          model: Category, 
          as: 'category' 
        }
      ]
    });

    if (!story) {
      return res.status(404).json({ 
        success: false, 
        message: 'Story not found' 
      });
    }

    // Increment views count
    await story.increment('views_count');

    res.json({
      success: true,
      data: story
    });
  } catch (error) {
    console.error('Get story content error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Check if slug is available
router.get('/check-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { exclude_id } = req.query;

    const where = { slug };
    if (exclude_id) {
      where.id = { [require('sequelize').Op.ne]: exclude_id };
    }

    const existingStory = await Story.findOne({ where });

    res.json({
      success: true,
      available: !existingStory,
      suggested: existingStory ? `${slug}-${Date.now()}` : null
    });
  } catch (error) {
    console.error('Check slug error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router; 
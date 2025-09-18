const express = require('express');
const { Op } = require('sequelize');
const { 
  Story, 
  Page, 
  Category, 
  Module, 
  User
} = require('../models');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Apply optional auth to all public routes
router.use(optionalAuth);

// Get published stories with pagination
router.get('/stories', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category_id, 
      search,
      exclude_id 
    } = req.query;
    
    const offset = (page - 1) * limit;

    const where = { 
      status: 'published',
      published_at: { [Op.lte]: new Date() }
    };
    
    if (category_id) where.category_id = category_id;
    if (exclude_id) where.id = { [Op.ne]: exclude_id };
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { subtitle: { [Op.like]: `%${search}%` } },
        { excerpt: { [Op.like]: `%${search}%` } }
      ];
    }

    const stories = await Story.findAndCountAll({
      where,
      include: [
        { 
          model: User, 
          as: 'author', 
          attributes: ['first_name', 'last_name'] 
        },
        { 
          model: Category, 
          as: 'category', 
          attributes: ['name', 'slug', 'color'] 
        }
      ],
      attributes: [
        'id', 'title', 'subtitle', 'slug', 'excerpt', 
        'featured_image', 'summary_image', 'published_at', 'views_count'
      ],
      order: [['published_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: stories.rows,
      pagination: {
        total: stories.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(stories.count / limit)
      }
    });
  } catch (error) {
    console.error('Get public stories error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get story by slug
router.get('/stories/:slug', async (req, res) => {
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
          attributes: ['name', 'slug', 'color'] 
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

    // Get related stories
    const relatedStories = await Story.findAll({
      where: {
        status: 'published',
        category_id: story.category_id,
        id: { [Op.ne]: story.id }
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
          attributes: ['name', 'slug', 'color'] 
        }
      ],
      attributes: [
        'id', 'title', 'subtitle', 'slug', 'excerpt', 
        'featured_image', 'summary_image', 'published_at'
      ],
      limit: 4,
      order: [['published_at', 'DESC']]
    });

    res.json({
      success: true,
      data: story,
      related: relatedStories
    });
  } catch (error) {
    console.error('Get story by slug error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get published pages
router.get('/pages', async (req, res) => {
  try {
    const pages = await Page.findAll({
      where: { 
        status: 'published',
        show_in_menu: true
      },
      attributes: [
        'id', 'title', 'slug', 'menu_title', 
        'parent_id', 'sort_order'
      ],
      order: [['sort_order', 'ASC'], ['title', 'ASC']]
    });

    res.json({
      success: true,
      data: pages
    });
  } catch (error) {
    console.error('Get public pages error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get page by slug
router.get('/pages/:slug', async (req, res) => {
  try {
    const page = await Page.findOne({
      where: { 
        slug: req.params.slug,
        status: 'published'
      }
    });

    if (!page) {
      return res.status(404).json({ 
        success: false, 
        message: 'Page not found' 
      });
    }

    res.json({
      success: true,
      data: page
    });
  } catch (error) {
    console.error('Get page by slug error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get active modules by type
router.get('/modules/:type', async (req, res) => {
  try {
    const modules = await Module.findAll({
      where: { 
        type: req.params.type,
        status: 'active'
      },
      order: [['sort_order', 'ASC']]
    });

    res.json({
      success: true,
      data: modules
    });
  } catch (error) {
    console.error('Get public modules error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get all active modules
router.get('/modules', async (req, res) => {
  try {
    const modules = await Module.findAll({
      where: { status: 'active' },
      order: [['type', 'ASC'], ['sort_order', 'ASC']]
    });

    // Group modules by type
    const groupedModules = modules.reduce((acc, module) => {
      if (!acc[module.type]) {
        acc[module.type] = [];
      }
      acc[module.type].push(module);
      return acc;
    }, {});

    res.json({
      success: true,
      data: groupedModules
    });
  } catch (error) {
    console.error('Get all modules error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get stories (for widgets like StoriesReel)
router.get('/stories', async (req, res) => {
  try {
    const {
      limit = 10,
      offset = 0,
      category,
      status = 'published'
    } = req.query;

    // Build where conditions
    const whereConditions = {
      status: status
    };

    // Add category filter if specified
    if (category) {
      if (isNaN(category)) {
        // Category is a slug, need to find by slug
        const categoryRecord = await Category.findOne({
          where: { slug: category },
          attributes: ['id']
        });
        if (categoryRecord) {
          whereConditions.category_id = categoryRecord.id;
        }
      } else {
        // Category is an ID
        whereConditions.category_id = parseInt(category);
      }
    }

    const stories = await Story.findAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['first_name', 'last_name']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'color']
        }
      ],
      attributes: [
        'id', 'title', 'subtitle', 'slug', 'excerpt', 
        'featured_image', 'published_at', 'views_count', 'tags'
      ],
      order: [['published_at', 'DESC']],
      limit: Math.min(parseInt(limit), 50), // Cap at 50 stories
      offset: parseInt(offset)
    });

    res.json({ success: true, data: stories });
  } catch (error) {
    console.error('Get public stories error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { status: 'active' },
      include: [
        { 
          model: Category, 
          as: 'children', 
          where: { status: 'active' },
          required: false,
          attributes: ['id', 'name', 'slug', 'color', 'icon']
        }
      ],
      attributes: ['id', 'name', 'slug', 'color', 'icon', 'parent_id'],
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get public categories error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get stories by category
router.get('/categories/:slug/stories', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Find category
    const category = await Category.findOne({
      where: { slug: req.params.slug, status: 'active' }
    });

    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    const stories = await Story.findAndCountAll({
      where: { 
        category_id: category.id,
        status: 'published',
        published_at: { [Op.lte]: new Date() }
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
          attributes: ['name', 'slug', 'color'] 
        }
      ],
      attributes: [
        'id', 'title', 'subtitle', 'slug', 'excerpt', 
        'featured_image', 'published_at', 'views_count'
      ],
      order: [['published_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: stories.rows,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description
      },
      pagination: {
        total: stories.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(stories.count / limit)
      }
    });
  } catch (error) {
    console.error('Get stories by category error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router; 
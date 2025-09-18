const express = require('express');
const { Op } = require('sequelize');
const { hasPermission } = require('../../middleware/auth');
const { affiliateMiddleware } = require('../../middleware/affiliate');
const { Affiliate, UserAffiliate, AffiliateMember } = require('../../models');
const { createSearchCondition } = require('../../utils/searchUtils');

const router = express.Router();

// GET /api/admin/affiliates - List user's affiliates with pagination
router.get('/', affiliateMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, ids } = req.query;
    
    // Handle specific IDs request (for multiselect component)
    if (ids) {
      const idArray = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      const affiliates = await Affiliate.findAll({
        where: {
          id: {
            [Op.in]: idArray
          }
        },
        order: [['sort_order', 'ASC'], ['name', 'ASC']]
      });
      
      return res.json({
        success: true,
        data: affiliates
      });
    }
    
    // Get user's affiliates through UserAffiliate junction
    const userAffiliates = await UserAffiliate.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Affiliate,
        as: 'affiliate',
        where: search ? createSearchCondition(search, ['name', 'slug', 'description']) : undefined
      }],
      order: [['affiliate', 'sort_order', 'ASC'], ['affiliate', 'name', 'ASC']]
    });

    // Extract affiliates from the junction table
    const affiliates = userAffiliates.map(ua => ua.affiliate);
    const total = affiliates.length;
    const offset = (page - 1) * limit;
    const paginatedAffiliates = affiliates.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: paginatedAffiliates,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get affiliates error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/affiliates/current-user - Get current user info
router.get('/current-user', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { User } = require('../../models');
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'first_name', 'last_name', 'email', 'role_id']
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/affiliates/:id - Get single affiliate
router.get('/:id', async (req, res) => {
  try {
    const affiliate = await Affiliate.findByPk(req.params.id);

    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Affiliate not found' });
    }

    res.json({ success: true, data: affiliate });
  } catch (error) {
    console.error('Get affiliate error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/affiliates - Create new affiliate
router.post('/', hasPermission('affiliates.create'), async (req, res) => {
  try {
    const affiliate = await Affiliate.create(req.body);
    
    // Automatically create relationship with the user who created the affiliate
    await affiliate.addUser(req.user.id);
    
    // Import required models for creating default items
    const { Module, Page, Menu } = require('../../models');
    
    // Create default modules: Header and Footer
    const defaultModules = [
      {
        name: `header-${affiliate.id}`,
        display_name: 'Header',
        description: 'Default header module',
        type: 'header',
        position: 'top',
        status: 'active',
        is_system: true,
        author_id: req.user.id,
        affiliate_id: affiliate.id,
        sort_order: 1,
        content: JSON.stringify({
          time: Date.now(),
          blocks: [
            {
              type: 'header',
              data: {
                text: 'Welcome to ' + affiliate.name,
                level: 1
              }
            }
          ]
        })
      },
      {
        name: `footer-${affiliate.id}`,
        display_name: 'Footer',
        description: 'Default footer module',
        type: 'footer',
        position: 'bottom',
        status: 'active',
        is_system: true,
        author_id: req.user.id,
        affiliate_id: affiliate.id,
        sort_order: 2,
        content: JSON.stringify({
          time: Date.now(),
          blocks: [
            {
              type: 'paragraph',
              data: {
                text: '© 2024 ' + affiliate.name + '. All rights reserved.'
              }
            }
          ]
        })
      }
    ];
    
    await Module.bulkCreate(defaultModules);
    
    // Create default pages: Home, Stories, and Story
    const defaultPages = [
      {
        title: 'Home',
        slug: 'home',
        template: 'default',
        status: 'published',
        is_system: true,
        author_id: req.user.id,
        affiliate_id: affiliate.id,
        sort_order: 1,
        meta_title: 'Home - ' + affiliate.name,
        meta_description: 'Welcome to ' + affiliate.name,
        show_in_menu: true,
        menu_title: 'Home',
        content: JSON.stringify({
          time: Date.now(),
          blocks: [
            {
              type: 'header',
              data: {
                text: 'Welcome to ' + affiliate.name,
                level: 1
              }
            },
            {
              type: 'paragraph',
              data: {
                text: 'This is your homepage. Start creating amazing content!'
              }
            }
          ]
        })
      },
      {
        title: 'Stories',
        slug: 'stories',
        template: 'stories-list',
        status: 'published',
        is_system: true,
        author_id: req.user.id,
        affiliate_id: affiliate.id,
        sort_order: 2,
        meta_title: 'Stories - ' + affiliate.name,
        meta_description: 'Browse all stories from ' + affiliate.name,
        show_in_menu: true,
        menu_title: 'Stories',
        content: JSON.stringify({
          time: Date.now(),
          blocks: [
            {
              type: 'header',
              data: {
                text: 'Stories',
                level: 1
              }
            },
            {
              type: 'paragraph',
              data: {
                text: 'Browse all stories from our collection.'
              }
            }
          ]
        })
      },
      {
        title: 'Story',
        slug: 'story',
        template: 'story-detail',
        status: 'published',
        is_system: true,
        author_id: req.user.id,
        affiliate_id: affiliate.id,
        sort_order: 3,
        meta_title: 'Story - ' + affiliate.name,
        meta_description: 'Read stories from ' + affiliate.name,
        show_in_menu: false, // Hidden from menu as it's a template page
        content: JSON.stringify({
          time: Date.now(),
          blocks: [
            {
              type: 'header',
              data: {
                text: 'Story Detail',
                level: 1
              }
            },
            {
              type: 'paragraph',
              data: {
                text: 'This is the story detail template page.'
              }
            }
          ]
        })
      }
    ];
    
    await Page.bulkCreate(defaultPages);
    
    // Create default menu: Main menu (empty)
    const defaultMenu = {
      title: 'Main Menu',
      platform: 'Web',
      status: 'active',
      sort_order: 1,
      affiliate_id: affiliate.id,
      links: [] // Empty menu to start with
    };
    
    await Menu.create(defaultMenu);
    
    res.status(201).json({ 
      success: true, 
      data: affiliate,
      message: 'Affiliate created successfully with default modules, pages, and menu'
    });
  } catch (error) {
    console.error('Create affiliate error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Slug already exists. Please choose a different name.' 
      });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/affiliates/:id - Update affiliate
router.put('/:id', hasPermission('affiliates.update'), async (req, res) => {
  try {
    const affiliate = await Affiliate.findByPk(req.params.id);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Affiliate not found' });
    }

    await affiliate.update(req.body);
    res.json({ success: true, data: affiliate });
  } catch (error) {
    console.error('Update affiliate error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Slug already exists. Please choose a different name.' 
      });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/affiliates/:id - Delete affiliate
router.delete('/:id', hasPermission('affiliates.delete'), async (req, res) => {
  try {
    const affiliate = await Affiliate.findByPk(req.params.id);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Affiliate not found' });
    }

    await affiliate.destroy();
    res.json({ success: true, message: 'Affiliate deleted successfully' });
  } catch (error) {
    console.error('Delete affiliate error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/affiliates/:id/users - Get users associated with affiliate
router.get('/:id/users', hasPermission('affiliates.read'), async (req, res) => {
  try {
    const affiliate = await Affiliate.findByPk(req.params.id);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Affiliate not found' });
    }

    const users = await affiliate.getUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get affiliate users error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/affiliates/:id/users - Add users to affiliate
router.post('/:id/users', hasPermission('affiliates.update'), async (req, res) => {
  try {
    const { user_ids } = req.body;
    
    if (!user_ids || !Array.isArray(user_ids)) {
      return res.status(400).json({ 
        success: false, 
        message: 'user_ids array is required' 
      });
    }

    const affiliate = await Affiliate.findByPk(req.params.id);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Affiliate not found' });
    }

    // Add users to affiliate
    await affiliate.addUsers(user_ids);
    
    res.json({ success: true, message: 'Users added to affiliate successfully' });
  } catch (error) {
    console.error('Add users to affiliate error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/affiliates/:id/users - Update affiliate users (replace all)
router.put('/:id/users', hasPermission('affiliates.update'), async (req, res) => {
  try {
    const { user_ids } = req.body;
    
    if (!user_ids || !Array.isArray(user_ids)) {
      return res.status(400).json({ 
        success: false, 
        message: 'user_ids array is required' 
      });
    }

    const affiliate = await Affiliate.findByPk(req.params.id);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Affiliate not found' });
    }

    // Replace all users for this affiliate
    await affiliate.setUsers(user_ids);
    
    res.json({ success: true, message: 'Affiliate users updated successfully' });
  } catch (error) {
    console.error('Update affiliate users error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/affiliates/:id/users - Remove users from affiliate
router.delete('/:id/users', hasPermission('affiliates.update'), async (req, res) => {
  try {
    const { user_ids } = req.body;
    
    if (!user_ids || !Array.isArray(user_ids)) {
      return res.status(400).json({ 
        success: false, 
        message: 'user_ids array is required' 
      });
    }

    const affiliate = await Affiliate.findByPk(req.params.id);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Affiliate not found' });
    }

    // Remove users from affiliate
    await affiliate.removeUsers(user_ids);
    
    res.json({ success: true, message: 'Users removed from affiliate successfully' });
  } catch (error) {
    console.error('Remove users from affiliate error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/affiliates/:id/members - Get affiliate members
router.get('/:id/members', hasPermission('affiliates.read'), async (req, res) => {
  try {
    const affiliate = await Affiliate.findByPk(req.params.id);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Affiliate not found' });
    }

    const members = await affiliate.getMembers();
    res.json({ success: true, data: members });
  } catch (error) {
    console.error('Get affiliate members error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/affiliates/:id/available-members - Get available affiliates that can be added as members
router.get('/:id/available-members', hasPermission('affiliates.read'), async (req, res) => {
  try {
    const affiliate = await Affiliate.findByPk(req.params.id);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Affiliate not found' });
    }

    // Get all affiliates that the current user has access to
    const userAffiliates = await UserAffiliate.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Affiliate,
        as: 'affiliate'
      }]
    });

    const availableAffiliates = userAffiliates
      .map(ua => ua.affiliate)
      .filter(aff => aff.id !== parseInt(req.params.id)); // Exclude current affiliate

    res.json({ success: true, data: availableAffiliates });
  } catch (error) {
    console.error('Get available members error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/affiliates/:id/members - Add member to affiliate
router.post('/:id/members', hasPermission('affiliates.update'), async (req, res) => {
  try {
    const { to_affiliate_id, permissions } = req.body;
    
    if (!to_affiliate_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'to_affiliate_id is required' 
      });
    }

    const affiliate = await Affiliate.findByPk(req.params.id);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Affiliate not found' });
    }

    // Check if relationship already exists
    const existingMember = await AffiliateMember.findOne({
      where: {
        from_affiliate_id: req.params.id,
        to_affiliate_id: to_affiliate_id
      }
    });

    if (existingMember) {
      return res.status(400).json({ 
        success: false, 
        message: 'This affiliate is already a member' 
      });
    }

    // Add member with permissions
    await affiliate.addMember(to_affiliate_id, permissions || {});
    
    res.json({ success: true, message: 'Member added successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/affiliates/:id/members/:member_id - Update member permissions
router.put('/:id/members/:member_id', hasPermission('affiliates.update'), async (req, res) => {
  try {
    const { permissions } = req.body;
    
    if (!permissions) {
      return res.status(400).json({ 
        success: false, 
        message: 'permissions object is required' 
      });
    }

    const affiliate = await Affiliate.findByPk(req.params.id);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Affiliate not found' });
    }

    // Update member permissions
    await affiliate.updateMemberPermissions(req.params.member_id, permissions);
    
    res.json({ success: true, message: 'Member permissions updated successfully' });
  } catch (error) {
    console.error('Update member permissions error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/affiliates/:id/members/:member_id - Remove member from affiliate
router.delete('/:id/members/:member_id', hasPermission('affiliates.update'), async (req, res) => {
  try {
    const affiliate = await Affiliate.findByPk(req.params.id);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Affiliate not found' });
    }

    // Remove member
    await affiliate.removeMember(req.params.member_id);
    
    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router; 
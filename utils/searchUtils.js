/**
 * Utility functions for search operations
 */

const { Op } = require('sequelize');

/**
 * Normalizes text by removing accents and converting to lowercase
 * @param {string} text - The text to normalize
 * @returns {string} - Normalized text
 */
function normalizeText(text) {
  if (!text) return '';
  
  return text
    .normalize('NFD') // Decompose characters with accents
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (accents)
    .toLowerCase(); // Convert to lowercase
}

/**
 * Creates a case-insensitive and accent-insensitive search condition
 * @param {string} searchTerm - The search term
 * @param {Array} fields - Array of field names to search in
 * @param {Object} options - Optional configuration
 * @param {Array} options.integerFields - Array of field names that are integers
 * @returns {Object} - Sequelize where clause with Op.or
 */
function createSearchCondition(searchTerm, fields, options = {}) {
  if (!searchTerm || !fields || fields.length === 0) {
    return {};
  }
  
  const { integerFields = [] } = options;
  
  const searchConditions = fields.map(field => {
    // Check if this field is an integer field
    if (integerFields.includes(field)) {
      // For integer fields, we can either:
      // 1. Use exact match if searchTerm is numeric
      // 2. Convert to string for partial matching
      
      if (/^\d+$/.test(searchTerm.trim())) {
        // If search term is purely numeric, use exact match
        return {
          [field]: parseInt(searchTerm.trim())
        };
      } else {
        // Convert integer field to string for partial matching
        return require('sequelize').where(
          require('sequelize').cast(require('sequelize').col(field), 'TEXT'),
          {
            [Op.iLike]: `%${searchTerm}%`
          }
        );
      }
    } else {
      // String fields use the original logic
      return {
        [field]: {
          [Op.iLike]: `%${searchTerm}%`
        }
      };
    }
  });

  console.log("searchConditions", searchConditions)

  return {
    [Op.or]: searchConditions
  };
}

/**
 * Creates a case-insensitive and accent-insensitive search condition using LIKE
 * (for databases that don't support iLike)
 * @param {string} searchTerm - The search term
 * @param {Array} fields - Array of field names to search in
 * @returns {Object} - Sequelize where clause with Op.or
 */
function createSearchConditionLike(searchTerm, fields) {
  if (!searchTerm || !fields || fields.length === 0) {
    return {};
  }

  const normalizedSearch = normalizeText(searchTerm);
  
  const searchConditions = fields.map(field => ({
    [field]: {
      [Op.like]: `%${normalizedSearch}%`
    }
  }));

  return {
    [Op.or]: searchConditions
  };
}

/**
 * Creates a case-insensitive and accent-insensitive search condition using PostgreSQL unaccent
 * This is the most robust solution for handling accents in PostgreSQL
 * @param {string} searchTerm - The search term
 * @param {Array} fields - Array of field names to search in
 * @returns {Object} - Sequelize where clause with Op.or
 */
function createSearchConditionUnaccent(searchTerm, fields) {
  if (!searchTerm || !fields || fields.length === 0) {
    return {};
  }

  // Use unaccent function for accent-insensitive search
  const searchConditions = fields.map(field => ({
    [field]: {
      [Op.iLike]: require('sequelize').literal(`unaccent('${searchTerm}')`)
    }
  }));

  return {
    [Op.or]: searchConditions
  };
}

module.exports = {
  normalizeText,
  createSearchCondition,
  createSearchConditionLike,
  createSearchConditionUnaccent
};

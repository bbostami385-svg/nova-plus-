import express from 'express';
import CreatorToolsService from '../services/CreatorToolsService.js';
import { verifyFirebaseAuth, isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Apply filter
router.post('/filter', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const { imageUrl, filterType, intensity } = req.body;
    
    if (!imageUrl || !filterType) {
      return res.status(400).json({
        success: false,
        message: 'Image URL and filter type are required',
      });
    }
    
    const result = await CreatorToolsService.applyFilter(imageUrl, filterType, intensity);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Add text overlay
router.post('/text-overlay', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const { imageUrl, textData } = req.body;
    
    if (!imageUrl || !textData) {
      return res.status(400).json({
        success: false,
        message: 'Image URL and text data are required',
      });
    }
    
    const result = await CreatorToolsService.addTextOverlay(imageUrl, textData);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Add sticker
router.post('/sticker', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const { imageUrl, stickerData } = req.body;
    
    if (!imageUrl || !stickerData) {
      return res.status(400).json({
        success: false,
        message: 'Image URL and sticker data are required',
      });
    }
    
    const result = await CreatorToolsService.addSticker(imageUrl, stickerData);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get available stickers
router.get('/stickers', async (req, res) => {
  try {
    const stickers = await CreatorToolsService.getAvailableStickers();
    
    res.status(200).json({
      success: true,
      data: stickers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get available filters
router.get('/filters', async (req, res) => {
  try {
    const filters = await CreatorToolsService.getAvailableFilters();
    
    res.status(200).json({
      success: true,
      data: filters,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get available templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await CreatorToolsService.getAvailableTemplates();
    
    res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get font options
router.get('/fonts', async (req, res) => {
  try {
    const fonts = await CreatorToolsService.getFontOptions();
    
    res.status(200).json({
      success: true,
      data: fonts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Schedule post
router.post('/schedule-post', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const { postData, scheduledTime } = req.body;
    
    if (!postData || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'Post data and scheduled time are required',
      });
    }
    
    const result = await CreatorToolsService.schedulePost(req.user._id, postData, scheduledTime);
    
    res.status(201).json({
      success: true,
      message: result.message,
      data: result.post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get scheduled posts
router.get('/scheduled-posts', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const posts = await CreatorToolsService.getScheduledPosts(req.user._id);
    
    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Cancel scheduled post
router.delete('/scheduled-posts/:postId', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const result = await CreatorToolsService.cancelScheduledPost(req.params.postId, req.user._id);
    
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Batch upload
router.post('/batch-upload', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const { files } = req.body;
    
    if (!files) {
      return res.status(400).json({
        success: false,
        message: 'Files are required',
      });
    }
    
    const result = await CreatorToolsService.batchUpload(req.user._id, files);
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.files,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get editing history
router.get('/history', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const history = await CreatorToolsService.getEditingHistory(req.user._id);
    
    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Export content
router.post('/export', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const { contentId, format } = req.body;
    
    if (!contentId) {
      return res.status(400).json({
        success: false,
        message: 'Content ID is required',
      });
    }
    
    const result = await CreatorToolsService.exportContent(req.user._id, contentId, format);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;

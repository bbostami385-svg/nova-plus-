import express from 'express';
import MusicService from '../services/MusicService.js';
import { verifyFirebaseAuth, isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Upload music
router.post('/upload', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const { title, artist, album, genre, duration, fileUrl, coverImage, description, tags } = req.body;
    
    if (!title || !artist || !duration || !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }
    
    const music = await MusicService.uploadMusic(req.user._id, {
      title,
      artist,
      album,
      genre,
      duration,
      fileUrl,
      coverImage,
      description,
      tags,
    });
    
    res.status(201).json({
      success: true,
      message: 'Music uploaded successfully',
      data: music,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get music by ID
router.get('/:musicId', async (req, res) => {
  try {
    const music = await MusicService.getMusicById(req.params.musicId);
    
    res.status(200).json({
      success: true,
      data: music,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
});

// Get music feed
router.get('/', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    
    const result = await MusicService.getMusicFeed(null, page, limit);
    
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

// Like music
router.post('/:musicId/like', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const music = await MusicService.likeMusic(req.params.musicId, req.user._id);
    
    res.status(200).json({
      success: true,
      message: 'Music liked successfully',
      data: music,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Share music
router.post('/:musicId/share', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const music = await MusicService.shareMusic(req.params.musicId, req.user._id);
    
    res.status(200).json({
      success: true,
      message: 'Music shared successfully',
      data: music,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get trending music
router.get('/trending/all', async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const music = await MusicService.getTrendingMusic(limit);
    
    res.status(200).json({
      success: true,
      data: music,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Search music
router.get('/search/:query', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    
    const result = await MusicService.searchMusic(req.params.query, page, limit);
    
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

// Get user music
router.get('/user/:userId', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    
    const result = await MusicService.getUserMusic(req.params.userId, page, limit);
    
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

// Update music
router.put('/:musicId', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const music = await MusicService.updateMusic(req.params.musicId, req.user._id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Music updated successfully',
      data: music,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete music
router.delete('/:musicId', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const result = await MusicService.deleteMusic(req.params.musicId, req.user._id);
    
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

// Playlist routes
router.post('/playlists', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const { name, description, coverImage } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Playlist name is required',
      });
    }
    
    const playlist = await MusicService.createPlaylist(req.user._id, {
      name,
      description,
      coverImage,
    });
    
    res.status(201).json({
      success: true,
      message: 'Playlist created successfully',
      data: playlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get user playlists
router.get('/playlists/user/:userId', async (req, res) => {
  try {
    const playlists = await MusicService.getUserPlaylists(req.params.userId);
    
    res.status(200).json({
      success: true,
      data: playlists,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Add song to playlist
router.post('/playlists/:playlistId/add', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const { musicId } = req.body;
    
    if (!musicId) {
      return res.status(400).json({
        success: false,
        message: 'Music ID is required',
      });
    }
    
    const playlist = await MusicService.addSongToPlaylist(
      req.params.playlistId,
      musicId,
      req.user._id
    );
    
    res.status(200).json({
      success: true,
      message: 'Song added to playlist',
      data: playlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Remove song from playlist
router.post('/playlists/:playlistId/remove', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const { musicId } = req.body;
    
    if (!musicId) {
      return res.status(400).json({
        success: false,
        message: 'Music ID is required',
      });
    }
    
    const playlist = await MusicService.removeSongFromPlaylist(
      req.params.playlistId,
      musicId,
      req.user._id
    );
    
    res.status(200).json({
      success: true,
      message: 'Song removed from playlist',
      data: playlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Follow playlist
router.post('/playlists/:playlistId/follow', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const playlist = await MusicService.followPlaylist(req.params.playlistId, req.user._id);
    
    res.status(200).json({
      success: true,
      message: 'Playlist followed successfully',
      data: playlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;

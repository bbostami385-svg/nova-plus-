import Music from '../models/Music.js';
import Playlist from '../models/Playlist.js';
import User from '../models/User.js';

class MusicService {
  // Upload new music
  static async uploadMusic(userId, musicData) {
    try {
      const music = new Music({
        userId,
        ...musicData,
      });
      await music.save();
      return music;
    } catch (error) {
      throw new Error(`Failed to upload music: ${error.message}`);
    }
  }

  // Get music by ID
  static async getMusicById(musicId) {
    try {
      const music = await Music.findById(musicId)
        .populate('userId', 'username profilePicture')
        .populate('likes', 'username')
        .populate('comments');
      
      if (!music) throw new Error('Music not found');
      
      // Increment play count
      music.plays += 1;
      await music.save();
      
      return music;
    } catch (error) {
      throw new Error(`Failed to get music: ${error.message}`);
    }
  }

  // Get music feed
  static async getMusicFeed(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const music = await Music.find({ isPublic: true })
        .populate('userId', 'username profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Music.countDocuments({ isPublic: true });
      
      return {
        music,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    } catch (error) {
      throw new Error(`Failed to get music feed: ${error.message}`);
    }
  }

  // Like music
  static async likeMusic(musicId, userId) {
    try {
      const music = await Music.findById(musicId);
      
      if (!music) throw new Error('Music not found');
      
      const alreadyLiked = music.likes.includes(userId);
      
      if (alreadyLiked) {
        music.likes = music.likes.filter(id => id.toString() !== userId.toString());
      } else {
        music.likes.push(userId);
      }
      
      await music.save();
      return music;
    } catch (error) {
      throw new Error(`Failed to like music: ${error.message}`);
    }
  }

  // Add comment to music
  static async addComment(musicId, userId, comment) {
    try {
      const music = await Music.findById(musicId);
      
      if (!music) throw new Error('Music not found');
      
      // This would typically create a Comment document
      // For now, we'll store it in the music document
      music.comments.push(comment);
      await music.save();
      
      return music;
    } catch (error) {
      throw new Error(`Failed to add comment: ${error.message}`);
    }
  }

  // Share music
  static async shareMusic(musicId, userId) {
    try {
      const music = await Music.findById(musicId);
      
      if (!music) throw new Error('Music not found');
      
      music.shares += 1;
      await music.save();
      
      return music;
    } catch (error) {
      throw new Error(`Failed to share music: ${error.message}`);
    }
  }

  // Create playlist
  static async createPlaylist(userId, playlistData) {
    try {
      const playlist = new Playlist({
        userId,
        ...playlistData,
      });
      await playlist.save();
      return playlist;
    } catch (error) {
      throw new Error(`Failed to create playlist: ${error.message}`);
    }
  }

  // Get user playlists
  static async getUserPlaylists(userId) {
    try {
      const playlists = await Playlist.find({ userId })
        .populate('songs')
        .populate('followers', 'username');
      
      return playlists;
    } catch (error) {
      throw new Error(`Failed to get playlists: ${error.message}`);
    }
  }

  // Add song to playlist
  static async addSongToPlaylist(playlistId, musicId, userId) {
    try {
      const playlist = await Playlist.findById(playlistId);
      
      if (!playlist) throw new Error('Playlist not found');
      if (playlist.userId.toString() !== userId.toString()) {
        throw new Error('Unauthorized');
      }
      
      const music = await Music.findById(musicId);
      if (!music) throw new Error('Music not found');
      
      if (!playlist.songs.includes(musicId)) {
        playlist.songs.push(musicId);
        playlist.totalDuration += music.duration;
        await playlist.save();
      }
      
      return playlist;
    } catch (error) {
      throw new Error(`Failed to add song to playlist: ${error.message}`);
    }
  }

  // Remove song from playlist
  static async removeSongFromPlaylist(playlistId, musicId, userId) {
    try {
      const playlist = await Playlist.findById(playlistId);
      
      if (!playlist) throw new Error('Playlist not found');
      if (playlist.userId.toString() !== userId.toString()) {
        throw new Error('Unauthorized');
      }
      
      const music = await Music.findById(musicId);
      if (music) {
        playlist.totalDuration -= music.duration;
      }
      
      playlist.songs = playlist.songs.filter(id => id.toString() !== musicId.toString());
      await playlist.save();
      
      return playlist;
    } catch (error) {
      throw new Error(`Failed to remove song from playlist: ${error.message}`);
    }
  }

  // Follow playlist
  static async followPlaylist(playlistId, userId) {
    try {
      const playlist = await Playlist.findById(playlistId);
      
      if (!playlist) throw new Error('Playlist not found');
      
      const alreadyFollowing = playlist.followers.includes(userId);
      
      if (alreadyFollowing) {
        playlist.followers = playlist.followers.filter(id => id.toString() !== userId.toString());
      } else {
        playlist.followers.push(userId);
      }
      
      await playlist.save();
      return playlist;
    } catch (error) {
      throw new Error(`Failed to follow playlist: ${error.message}`);
    }
  }

  // Get trending music
  static async getTrendingMusic(limit = 10) {
    try {
      const music = await Music.find({ isPublic: true })
        .populate('userId', 'username profilePicture')
        .sort({ plays: -1, likes: -1 })
        .limit(limit);
      
      return music;
    } catch (error) {
      throw new Error(`Failed to get trending music: ${error.message}`);
    }
  }

  // Search music
  static async searchMusic(query, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const music = await Music.find({
        $and: [
          { isPublic: true },
          {
            $or: [
              { title: { $regex: query, $options: 'i' } },
              { artist: { $regex: query, $options: 'i' } },
              { album: { $regex: query, $options: 'i' } },
              { tags: { $in: [new RegExp(query, 'i')] } },
            ],
          },
        ],
      })
        .populate('userId', 'username profilePicture')
        .skip(skip)
        .limit(limit);
      
      const total = await Music.countDocuments({
        $and: [
          { isPublic: true },
          {
            $or: [
              { title: { $regex: query, $options: 'i' } },
              { artist: { $regex: query, $options: 'i' } },
              { album: { $regex: query, $options: 'i' } },
            ],
          },
        ],
      });
      
      return {
        music,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    } catch (error) {
      throw new Error(`Failed to search music: ${error.message}`);
    }
  }

  // Get user music
  static async getUserMusic(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const music = await Music.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Music.countDocuments({ userId });
      
      return {
        music,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    } catch (error) {
      throw new Error(`Failed to get user music: ${error.message}`);
    }
  }

  // Delete music
  static async deleteMusic(musicId, userId) {
    try {
      const music = await Music.findById(musicId);
      
      if (!music) throw new Error('Music not found');
      if (music.userId.toString() !== userId.toString()) {
        throw new Error('Unauthorized');
      }
      
      await Music.findByIdAndDelete(musicId);
      return { success: true, message: 'Music deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete music: ${error.message}`);
    }
  }

  // Update music
  static async updateMusic(musicId, userId, updateData) {
    try {
      const music = await Music.findById(musicId);
      
      if (!music) throw new Error('Music not found');
      if (music.userId.toString() !== userId.toString()) {
        throw new Error('Unauthorized');
      }
      
      Object.assign(music, updateData);
      await music.save();
      
      return music;
    } catch (error) {
      throw new Error(`Failed to update music: ${error.message}`);
    }
  }
}

export default MusicService;

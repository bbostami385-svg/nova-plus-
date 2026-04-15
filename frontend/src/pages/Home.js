import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import toast from 'react-hot-toast';
import { FaHeart, FaComment, FaShare, FaImage, FaVideo } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

export default function Home({ socket }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [postLoading, setPostLoading] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchPosts(1);
  }, []);

  const fetchPosts = async (pageNum) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/posts/feed?page=${pageNum}&limit=20`);
      
      if (pageNum === 1) {
        setPosts(response.data.posts || []);
      } else {
        setPosts(prev => [...prev, ...(response.data.posts || [])]);
      }
      
      setHasMore(response.data.pagination?.pages > pageNum);
      setPage(pageNum + 1);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    if (!newPostContent.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    try {
      setPostLoading(true);
      const response = await axios.post(`${API_URL}/api/posts`, {
        content: newPostContent,
        visibility: 'public',
      });

      setPosts(prev => [response.data.post, ...prev]);
      setNewPostContent('');
      toast.success('Post created successfully!');

      // Emit socket event for real-time updates
      if (socket) {
        socket.emit('post_created', response.data.post);
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error('Failed to create post');
    } finally {
      setPostLoading(false);
    }
  };

  const handleLikePost = async (postId, isLiked) => {
    try {
      const endpoint = isLiked ? 'unlike' : 'like';
      const response = await axios.post(`${API_URL}/api/posts/${postId}/${endpoint}`);
      
      setPosts(prev =>
        prev.map(post =>
          post._id === postId
            ? { ...post, likes: response.data.likesCount }
            : post
        )
      );
    } catch (error) {
      console.error('Failed to like post:', error);
      toast.error('Failed to update post');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Create Post Section */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
        <div className="flex gap-4">
          <img
            src={user?.profilePicture || 'https://via.placeholder.com/48'}
            alt={user?.username}
            className="w-12 h-12 rounded-full"
          />
          <form onSubmit={handleCreatePost} className="flex-1">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
              rows="3"
            />
            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-2">
                <button type="button" className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                  <FaImage />
                </button>
                <button type="button" className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                  <FaVideo />
                </button>
              </div>
              <button
                type="submit"
                disabled={postLoading || !newPostContent.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                {postLoading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Posts Feed */}
      <InfiniteScroll
        dataLength={posts.length}
        next={() => fetchPosts(page)}
        hasMore={hasMore}
        loader={
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        }
        endMessage={
          <div className="text-center py-8 text-gray-400">
            No more posts to load
          </div>
        }
      >
        {posts.map((post) => (
          <div key={post._id} className="bg-gray-800 rounded-lg p-6 mb-4 border border-gray-700">
            {/* Post Header */}
            <div className="flex items-center gap-3 mb-4">
              <img
                src={post.author?.profilePicture || 'https://via.placeholder.com/48'}
                alt={post.author?.username}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-medium text-white">
                  {post.author?.firstName} {post.author?.lastName}
                </p>
                <p className="text-sm text-gray-400">@{post.author?.username}</p>
              </div>
            </div>

            {/* Post Content */}
            <p className="text-white mb-4">{post.content}</p>

            {/* Post Images */}
            {post.images && post.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {post.images.map((image, idx) => (
                  <img
                    key={idx}
                    src={image}
                    alt={`Post ${idx}`}
                    className="rounded-lg w-full h-48 object-cover"
                  />
                ))}
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700 text-gray-400">
              <button
                onClick={() => handleLikePost(post._id, post.likes?.includes(user?._id))}
                className={`flex items-center gap-2 hover:text-red-500 transition-colors ${
                  post.likes?.includes(user?._id) ? 'text-red-500' : ''
                }`}
              >
                <FaHeart /> {post.likes?.length || 0}
              </button>
              <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                <FaComment /> {post.comments?.length || 0}
              </button>
              <button className="flex items-center gap-2 hover:text-green-500 transition-colors">
                <FaShare /> {post.shares || 0}
              </button>
            </div>
          </div>
        ))}
      </InfiniteScroll>
    </div>
  );
}

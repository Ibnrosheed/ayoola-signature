import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { wishlistAPI } from '../services/api';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);

  const refreshWishlist = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const res = await wishlistAPI.getWishlist();
        if (res.success && res.data) {
          setWishlistItems(res.data.products || []);
          setWishlistCount(res.data.count || 0);
        }
      } catch (err) {
        console.warn('Failed to fetch wishlist:', err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setWishlistItems([]);
      setWishlistCount(0);
    }
  }, [user]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const isInWishlist = useCallback(
    (productId) => {
      if (!productId || !user) return false;
      return wishlistItems.some((item) => (item.id || item._id) === productId);
    },
    [wishlistItems, user]
  );

  const addToWishlist = async (productId) => {
    if (!user) {
      showNotification('Please log in to save products to your wishlist', 'warning');
      return false;
    }

    try {
      const res = await wishlistAPI.addToWishlist(productId);
      if (res.success && res.data) {
        setWishlistItems(res.data.products || []);
        setWishlistCount(res.data.count || 0);
        showNotification(res.message || 'Product added to wishlist', 'success');
        return true;
      }
    } catch (err) {
      showNotification(err.message || 'Failed to add to wishlist', 'error');
      return false;
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!user) return false;

    try {
      const res = await wishlistAPI.removeFromWishlist(productId);
      if (res.success && res.data) {
        setWishlistItems(res.data.products || []);
        setWishlistCount(res.data.count || 0);
        showNotification('Product removed from wishlist', 'info');
        return true;
      }
    } catch (err) {
      showNotification(err.message || 'Failed to remove from wishlist', 'error');
      return false;
    }
  };

  const clearWishlist = async () => {
    if (!user) return false;

    try {
      const res = await wishlistAPI.clearWishlist();
      if (res.success) {
        setWishlistItems([]);
        setWishlistCount(0);
        showNotification('Wishlist cleared', 'info');
        return true;
      }
    } catch (err) {
      showNotification(err.message || 'Failed to clear wishlist', 'error');
      return false;
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount,
        loading,
        notification,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

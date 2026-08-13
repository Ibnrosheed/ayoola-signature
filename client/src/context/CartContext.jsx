import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { cartAPI, productAPI } from '../services/api';

const CartContext = createContext(null);
const GUEST_CART_KEY = 'ayoola_signature_guest_cart';

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    itemCount: 0,
    subtotal: 0,
    discount: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Helper to trigger temporary UI notification toast
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);

  // Recalculate summary for guest local cart items
  const calculateGuestSummary = (items) => {
    let itemCount = 0;
    let subtotal = 0;
    let discount = 0;

    const formattedItems = items.map((item) => {
      const prod = item.product || {};
      const unitPrice = Number(prod.price) || 0;
      const discountPct = Number(prod.discount) || 0;
      const finalPrice = Number(prod.finalPrice) || Math.max(0, Math.round(unitPrice * (1 - discountPct / 100)));
      const qty = Math.min(item.quantity, prod.quantityAvailable ?? prod.quantity ?? 99);

      const itemSubtotal = unitPrice * qty;
      const itemDiscount = (unitPrice - finalPrice) * qty;
      const itemTotal = finalPrice * qty;

      itemCount += qty;
      subtotal += itemSubtotal;
      discount += itemDiscount;

      return {
        ...item,
        quantity: qty,
        itemTotal,
      };
    });

    const total = Math.max(0, subtotal - discount);

    return {
      formattedItems,
      summary: {
        itemCount,
        subtotal: Math.round(subtotal),
        discount: Math.round(discount),
        total: Math.round(total),
      },
    };
  };

  // Helper to load guest cart from localStorage
  const getGuestCartFromStorage = () => {
    try {
      const stored = localStorage.getItem(GUEST_CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Failed to parse guest cart storage', e);
      return [];
    }
  };

  // Helper to save guest cart to localStorage
  const saveGuestCartToStorage = (items) => {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save guest cart storage', e);
    }
  };

  // Fetch or sync cart depending on auth status
  const refreshCart = useCallback(async () => {
    setLoading(true);

    if (user) {
      // Authenticated User: Check for unmerged guest items first
      const guestItems = getGuestCartFromStorage();
      try {
        if (guestItems.length > 0) {
          const mergePayload = guestItems.map((gi) => ({
            productId: gi.product._id || gi.product.id || gi.productId,
            quantity: gi.quantity,
          }));
          const res = await cartAPI.mergeCart(mergePayload);
          if (res.success && res.data) {
            setCartItems(res.data.items || []);
            setCartSummary(res.data.summary || { itemCount: 0, subtotal: 0, discount: 0, total: 0 });
            localStorage.removeItem(GUEST_CART_KEY);
            showNotification('Guest cart items merged into your account', 'info');
          }
        } else {
          const res = await cartAPI.getCart();
          if (res.success && res.data) {
            setCartItems(res.data.items || []);
            setCartSummary(res.data.summary || { itemCount: 0, subtotal: 0, discount: 0, total: 0 });
          }
        }
      } catch (err) {
        console.warn('Failed to sync authenticated cart:', err.message);
      }
    } else {
      // Guest User: Load from localStorage
      const guestItems = getGuestCartFromStorage();
      const { formattedItems, summary } = calculateGuestSummary(guestItems);
      setCartItems(formattedItems);
      setCartSummary(summary);
    }

    setLoading(false);
  }, [user, showNotification]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Add Item to Cart (Handles both Guest & Authenticated)
  const addToCart = async (productData, requestedQuantity = 1) => {
    const qtyToAdd = Math.max(1, parseInt(requestedQuantity, 10) || 1);
    const productId = productData._id || productData.id;

    if (!productId) {
      showNotification('Invalid product', 'error');
      return false;
    }

    // Verify stock availability on passed object
    const availableStock = productData.quantityAvailable ?? productData.quantity ?? 0;
    if (availableStock <= 0 || productData.status === 'inactive') {
      showNotification('This product is currently out of stock', 'error');
      return false;
    }

    if (user) {
      // Authenticated User: Call backend API
      try {
        const res = await cartAPI.addToCart(productId, qtyToAdd);
        if (res.success && res.data) {
          setCartItems(res.data.items || []);
          setCartSummary(res.data.summary || { itemCount: 0, subtotal: 0, discount: 0, total: 0 });
          showNotification(`'${productData.name}' added to your shopping bag`);
          return true;
        }
      } catch (err) {
        showNotification(err.message || 'Failed to add item to cart', 'error');
        return false;
      }
    } else {
      // Guest User: Handle locally
      const currentGuestItems = getGuestCartFromStorage();
      const existingIndex = currentGuestItems.findIndex(
        (item) => (item.product._id || item.product.id) === productId
      );

      let currentQtyInCart = 0;
      if (existingIndex > -1) {
        currentQtyInCart = currentGuestItems[existingIndex].quantity;
      }

      const newQty = currentQtyInCart + qtyToAdd;
      if (newQty > availableStock) {
        showNotification(`Cannot add ${qtyToAdd} units. Available stock is ${availableStock}`, 'error');
        return false;
      }

      let updatedGuestItems = [...currentGuestItems];
      if (existingIndex > -1) {
        updatedGuestItems[existingIndex].quantity = newQty;
      } else {
        const unitPrice = Number(productData.price) || 0;
        const discountPct = Number(productData.discount) || 0;
        const finalPrice = Number(productData.finalPrice) || Math.max(0, Math.round(unitPrice * (1 - discountPct / 100)));

        updatedGuestItems.push({
          product: {
            id: productId,
            _id: productId,
            name: productData.name,
            slug: productData.slug,
            sku: productData.sku,
            images: productData.images || [],
            image: productData.images && productData.images.length > 0 ? productData.images[0] : (productData.image || ''),
            price: unitPrice,
            discount: discountPct,
            finalPrice: finalPrice,
            quantityAvailable: availableStock,
            status: productData.status || 'active',
          },
          quantity: qtyToAdd,
          itemTotal: finalPrice * qtyToAdd,
        });
      }

      saveGuestCartToStorage(updatedGuestItems);
      const { formattedItems, summary } = calculateGuestSummary(updatedGuestItems);
      setCartItems(formattedItems);
      setCartSummary(summary);
      showNotification(`'${productData.name}' added to your shopping bag`);
      return true;
    }
  };

  // Update Cart Item Quantity
  const updateCartItem = async (productId, newQuantity) => {
    const qty = parseInt(newQuantity, 10);

    if (user) {
      try {
        const res = await cartAPI.updateCartItem(productId, qty);
        if (res.success && res.data) {
          setCartItems(res.data.items || []);
          setCartSummary(res.data.summary || { itemCount: 0, subtotal: 0, discount: 0, total: 0 });
          return true;
        }
      } catch (err) {
        showNotification(err.message || 'Failed to update quantity', 'error');
        return false;
      }
    } else {
      let currentGuestItems = getGuestCartFromStorage();
      if (qty <= 0) {
        currentGuestItems = currentGuestItems.filter((i) => (i.product._id || i.product.id) !== productId);
      } else {
        const itemIdx = currentGuestItems.findIndex((i) => (i.product._id || i.product.id) === productId);
        if (itemIdx > -1) {
          const availStock = currentGuestItems[itemIdx].product.quantityAvailable || 99;
          if (qty > availStock) {
            showNotification(`Cannot exceed available stock (${availStock})`, 'error');
            return false;
          }
          currentGuestItems[itemIdx].quantity = qty;
        }
      }

      saveGuestCartToStorage(currentGuestItems);
      const { formattedItems, summary } = calculateGuestSummary(currentGuestItems);
      setCartItems(formattedItems);
      setCartSummary(summary);
      return true;
    }
  };

  // Remove Item from Cart
  const removeFromCart = async (productId) => {
    if (user) {
      try {
        const res = await cartAPI.removeFromCart(productId);
        if (res.success && res.data) {
          setCartItems(res.data.items || []);
          setCartSummary(res.data.summary || { itemCount: 0, subtotal: 0, discount: 0, total: 0 });
          showNotification('Item removed from shopping bag');
          return true;
        }
      } catch (err) {
        showNotification(err.message || 'Failed to remove item', 'error');
        return false;
      }
    } else {
      const currentGuestItems = getGuestCartFromStorage().filter(
        (i) => (i.product._id || i.product.id) !== productId
      );
      saveGuestCartToStorage(currentGuestItems);
      const { formattedItems, summary } = calculateGuestSummary(currentGuestItems);
      setCartItems(formattedItems);
      setCartSummary(summary);
      showNotification('Item removed from shopping bag');
      return true;
    }
  };

  // Clear Entire Cart
  const clearCart = async () => {
    if (user) {
      try {
        const res = await cartAPI.clearCart();
        if (res.success) {
          setCartItems([]);
          setCartSummary({ itemCount: 0, subtotal: 0, discount: 0, total: 0 });
          showNotification('Shopping bag cleared');
          return true;
        }
      } catch (err) {
        showNotification(err.message || 'Failed to clear cart', 'error');
        return false;
      }
    } else {
      localStorage.removeItem(GUEST_CART_KEY);
      setCartItems([]);
      setCartSummary({ itemCount: 0, subtotal: 0, discount: 0, total: 0 });
      showNotification('Shopping bag cleared');
      return true;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartSummary,
        cartItemCount: cartSummary.itemCount || 0,
        loading,
        notification,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        refreshCart,
        showNotification,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

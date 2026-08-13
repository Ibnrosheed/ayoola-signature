/**
 * Shipping Service — Phase 10 Ayoola Signature
 * Handles zone resolution, method availability, fee calculation, tracking number generation.
 */

import ShippingZone from '../models/shippingZone.model.js';
import ShippingMethod from '../models/shippingMethod.model.js';
import ShippingSetting from '../models/shippingSetting.model.js';

/**
 * Normalize a state string for comparison
 */
const normalize = (str) => (str || '').trim().toLowerCase();

/**
 * Resolve the applicable ShippingZone for a given address
 * Backend-authoritative: frontend-supplied zoneId is never trusted.
 * Returns null if no active zone matches.
 */
export const resolveZoneForAddress = async ({ state, city, country = 'Nigeria' }) => {
  if (!state) return null;

  const activeZones = await ShippingZone.find({ isActive: true });
  const normalizedState = normalize(state);
  const normalizedCity = normalize(city || '');

  // Priority 1: City-level match (more specific)
  for (const zone of activeZones) {
    if (zone.cities && zone.cities.length > 0) {
      if (zone.cities.some((c) => normalize(c) === normalizedCity)) {
        return zone;
      }
    }
  }

  // Priority 2: State-level match
  for (const zone of activeZones) {
    if (zone.states && zone.states.length > 0) {
      if (zone.states.some((s) => normalize(s) === normalizedState)) {
        return zone;
      }
    }
  }

  // Fallback: "Other" zone
  const otherZone = activeZones.find((z) => normalize(z.name) === 'other');
  return otherZone || null;
};

/**
 * Get available shipping methods for a resolved zone and cart subtotal
 * Applies free shipping threshold if configured
 */
export const getAvailableMethodsForZone = async (zone, cartSubtotal = 0) => {
  if (!zone) return [];

  const [methods, settings] = await Promise.all([
    ShippingMethod.find({ zone: zone._id, isActive: true }),
    ShippingSetting.findOne({ key: 'global' }),
  ]);

  const freeShippingEnabled = settings?.freeShippingEnabled || false;
  const freeShippingThreshold = settings?.freeShippingThreshold || 100000;

  return methods.map((method) => {
    let fee = method.feeType === 'free' ? 0 : method.baseFee;

    // Apply free shipping threshold if cart meets it
    if (
      freeShippingEnabled &&
      cartSubtotal >= freeShippingThreshold &&
      !method.isPickup
    ) {
      fee = 0;
    }

    return {
      _id: method._id,
      id: method._id.toString(),
      name: method.name,
      description: method.description,
      deliveryEstimate: method.deliveryEstimate,
      baseFee: method.baseFee,
      fee,
      feeType: method.feeType,
      isPickup: method.isPickup,
      freeShippingApplied: fee === 0 && method.feeType !== 'free' && method.baseFee > 0,
    };
  });
};

/**
 * Calculate the verified shipping fee for a specific method ID and zone
 * Used server-side during order creation — never trusts frontend fee
 */
export const calculateShippingFee = async (methodId, zone, cartSubtotal = 0) => {
  const method = await ShippingMethod.findById(methodId);

  if (!method || !method.isActive) {
    return { method: null, fee: 0, error: 'Shipping method not found or inactive' };
  }

  // Validate method belongs to correct zone
  if (method.zone.toString() !== zone._id.toString()) {
    return { method: null, fee: 0, error: 'Shipping method does not apply to this delivery zone' };
  }

  const settings = await ShippingSetting.findOne({ key: 'global' });
  let fee = method.feeType === 'free' ? 0 : method.baseFee;

  if (
    settings?.freeShippingEnabled &&
    cartSubtotal >= (settings.freeShippingThreshold || 100000) &&
    !method.isPickup
  ) {
    fee = 0;
  }

  return { method, fee, error: null };
};

/**
 * Generate a unique internal tracking number
 * Format: AYS-TRK-YYYY-XXXXXX (random 6-char alphanumeric)
 */
export const generateTrackingNumber = () => {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusable chars
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `AYS-TRK-${year}-${randomPart}`;
};

/**
 * Get shipping settings (global singleton)
 */
export const getShippingSettings = async () => {
  let settings = await ShippingSetting.findOne({ key: 'global' });
  if (!settings) {
    settings = await ShippingSetting.create({ key: 'global' });
  }
  return settings;
};

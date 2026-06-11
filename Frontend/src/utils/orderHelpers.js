/** Normalize cart line items to persisted order item shape. */
export function normalizeOrderItems(cartItems) {
  if (!cartItems || !Array.isArray(cartItems)) return [];
  return cartItems.map((item) => {
    if (item.product) {
      return {
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image,
        category: item.product.category,
      };
    }
    return {
      name: item.name || "Item",
      price: item.price || 0,
      quantity: item.quantity || 1,
      image: item.image,
      category: item.category,
    };
  });
}

export function getOrderItemName(item) {
  if (!item) return "Item";
  return item.name || item.product?.name || "Item";
}

export function getOrderItemPrice(item) {
  if (!item) return 0;
  return item.price ?? item.product?.price ?? 0;
}

export function getOrderItemQuantity(item) {
  if (!item) return 0;
  return item.quantity || 0;
}

export function getShopItemCount(order) {
  if (!order?.items?.length) return 0;
  return order.items.reduce((sum, i) => sum + getOrderItemQuantity(i), 0);
}

export function getShopSubtotal(order) {
  if (!order?.items?.length) return 0;
  return order.items.reduce(
    (sum, i) => sum + getOrderItemPrice(i) * getOrderItemQuantity(i),
    0
  );
}

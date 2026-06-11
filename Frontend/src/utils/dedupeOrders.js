/** Remove duplicate orders by id (keeps the latest entry). */
export function dedupeOrders(orders) {
  if (!Array.isArray(orders)) return [];
  const map = new Map();
  orders.forEach((order) => {
    if (order?.id) map.set(String(order.id), order);
  });
  return Array.from(map.values()).sort(
    (a, b) => parseInt(a.id, 10) - parseInt(b.id, 10)
  );
}

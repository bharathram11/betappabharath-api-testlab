export type Product = { id: number; sku: string; name: string; category: string; price: number; currency: string; stock: number; rating: number };
export type CartItem = { productId: number; quantity: number };
export type Order = { id: string; customerId: string; items: CartItem[]; total: number; currency: string; status: string; paymentStatus: string; createdAt: string };
export const products: Product[] = [{ id: 101, sku: "QA-KEY-001", name: "Mechanical Keyboard", category: "electronics", price: 3499, currency: "INR", stock: 18, rating: 4.6 }, { id: 102, sku: "QA-MOU-002", name: "Ergonomic Mouse", category: "electronics", price: 1299, currency: "INR", stock: 41, rating: 4.3 }, { id: 103, sku: "QA-BAG-003", name: "Laptop Backpack", category: "accessories", price: 2199, currency: "INR", stock: 0, rating: 4.5 }];
export const carts = new Map<string, CartItem[]>();
export const orders: Order[] = [];
let nextOrderId = 7001;
export function createOrder(customerId: string, items: CartItem[]) { const total = items.reduce((sum, item) => sum + (products.find((product) => product.id === item.productId)?.price ?? 0) * item.quantity, 0); const order: Order = { id: `ORD-${nextOrderId++}`, customerId, items, total, currency: "INR", status: "confirmed", paymentStatus: "paid", createdAt: new Date().toISOString() }; orders.push(order); return order; }

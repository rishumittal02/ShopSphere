export function getCart() {
  if (typeof window === "undefined") {
    return [];
  }

  const cart = localStorage.getItem("shopsphere_cart");

  return cart ? JSON.parse(cart) : [];
}

export function saveCart(cart) {
  localStorage.setItem(
    "shopsphere_cart",
    JSON.stringify(cart)
  );
}

export function addToCart(product, quantity) {
  const cart = getCart();

  const existingItem = cart.find(
    (item) => item.id === product.id
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      quantity: quantity,
    });
  }

  saveCart(cart);
}
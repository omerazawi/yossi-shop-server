function calcItemFinalPrice(item) {
  const q = item.quantity || 1;

  if (item.onSale && item.promotion?.type) {
    switch (item.promotion.type) {
      case "percentage":
        const disc = (item.price * item.discountPercent) / 100;
        return (item.price - disc) * q;

      case "multiToOne":
        const g = item.promotion.multiToOneQuantity || 1;
        return (Math.floor(q / g) + (q % g)) * item.price;

      case "bundle":
        const bQty   = item.promotion.bundleQuantity || 1;
        const bPrice = item.promotion.bundlePrice || item.price;
        return Math.floor(q / bQty) * bPrice + (q % bQty) * item.price;

      default:
        return item.price * q;
    }
  }

  const effective = item.salePrice || item.price;
  return effective * q;
}

function prepareItemsWithFinalPrice(cart) {
  return cart.map((i) => {
    const q   = i.quantity || 1;
    const tot = calcItemFinalPrice(i);
    return {
      productId: i._id || i.productId,
      name:      i.name,
      quantity:  q,
      finalPrice: Math.round((tot / q) * 100) / 100,
    };
  });
}

function calcTotal(items) {
  return items.reduce((s, i) => s + i.finalPrice * i.quantity, 0);
}

module.exports = { calcItemFinalPrice, prepareItemsWithFinalPrice, calcTotal };
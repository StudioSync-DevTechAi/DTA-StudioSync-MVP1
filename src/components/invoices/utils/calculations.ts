
export const calculateSubtotal = (items: { amount: string }[]) => {
  return items.reduce((sum, item) => {
    // Strip ₹ symbol and commas, then parse as number
    const numericValue = parseFloat(item.amount.replace(/[₹,]/g, "")) || 0;
    return sum + numericValue;
  }, 0);
};

export const calculateGST = (subtotal: number, gstRate: string) => {
  return (subtotal * Number(gstRate)) / 100;
};

export const calculateTotal = (subtotal: number, gst: number) => {
  return subtotal + gst;
};

const ORDER_DB = {
    'ORD-8821': {
        customerId: 'cus_8821',
        customerName: 'Sarah Chen',
        amount: 47.00,
        status: 'delivered',
        refundable: true,
        purchaseDate: '2026-03-20'
    },
    'ORD-4472': {
        customerId: 'cus_4472',
        customerName: 'James Okafor',
        amount: 300.00,
        status: 'delayed',
        refundable: true,
        purchaseDate: '2026-03-15'
    }
};

export async function validateOrder(extracted) {
    const order = ORDER_DB[extracted.order_id];

    if (!order) {
        return { valid: false, reason: 'Order not found' };
    }

    if (order.customerId !== extracted.customer_id) {
        return { valid: false, reason: 'Customer ID does not match order' };
    }

    if (Math.abs(order.amount - extracted.refund_amount) > 0.01) {
        return {
            valid: false,
            reason: `Amount mismatch — order shows $${order.amount}, agent quoted $${extracted.refund_amount}`
        };
    }

    if (!order.refundable) {
        return { valid: false, reason: 'Order is not in a refundable state' };
    }

    return { valid: true, order };
}
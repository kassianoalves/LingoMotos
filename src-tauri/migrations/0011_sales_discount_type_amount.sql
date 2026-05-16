UPDATE sales
SET discount_amount = ROUND(discount_cents / 100.0, 2)
WHERE COALESCE(discount_amount, 0) = 0 AND COALESCE(discount_cents, 0) > 0;

UPDATE public.products
SET stock_quantity = 100,
    in_stock = true
WHERE stock_quantity <= 0;
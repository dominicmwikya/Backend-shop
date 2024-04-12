export class CreateSaleDto {
    customer_name: string;
    cart_items: cart_items[];
    grantTotal: number;
    totalItems: number;
    balance: number;
    amount: number;
}

interface cart_items {
    customer_name: string;
    batchId: number;
    quantity: string;
    total: number;
    price: string;
    userId: number;
    productId: number;
    balance: string;
}
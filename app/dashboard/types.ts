// types.ts
export type InventoryItem = {
    item_id: string
    quantity: number
    item_name?: string
    price: number
    description: string
    category: string
    sku: string
    createdAt: string
}

export type Customer = {
    id: string
    name: string
    email: string
    phone: string
    address: string
    created_at: string
}

export type Order = {
    id: string
    customer_id: string
    customer_name: string
    items: { id: string, name: string, quantity: number, price: number, created_at: string }[]
    total: number
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
    createdAt: string
}

export type Tab = 'inventory' | 'products' | 'customers' | 'orders'
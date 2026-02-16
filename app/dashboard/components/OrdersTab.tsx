'use client'

import { Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Order, Customer, InventoryItem } from '../types'

export default function OrdersTab({ orders, setOrders, customers, items }: {
    orders: Order[]
    setOrders: (orders: Order[]) => void
    customers: Customer[]
    items: InventoryItem[]
}) {
    const [showOrderForm, setShowOrderForm] = useState(false)
    const [orderForm, setOrderForm] = useState({
        customer_id: '', items: [{ item_id: '', quantity: 1 }]
    })

    const getStatusColor = (status: Order['status']) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800'
            case 'processing': return 'bg-blue-100 text-blue-800'
            case 'shipped': return 'bg-purple-100 text-purple-800'
            case 'delivered': return 'bg-green-100 text-green-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const handleCreateOrder = () => {
        if (!orderForm.customer_id || !orderForm.items[0].item_id) {
            alert('Please select customer and at least one product')
            return
        }
        
        const customer = customers.find(c => c.id === orderForm.customer_id)
        if (!customer) return

        const orderItems = orderForm.items.map(item => {
            const product = items.find(p => p.item_id === item.item_id)
            return {
                id: item.item_id,
                name: product?.item_name || 'Unknown',
                quantity: item.quantity,
                price: product?.price || 0,
                created_at: new Date().toISOString().split('T')[0]
            }
        })

        const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

        const newOrder: Order = {
            id: Date.now().toString(),
            customer_id: orderForm.customer_id,
            customer_name: customer.name,
            items: orderItems,
            total,
            status: 'pending',
            createdAt: new Date().toISOString().split('T')[0]
        }

        setOrders([...orders, newOrder])
        setOrderForm({ customer_id: '', items: [{ item_id: '', quantity: 1 }] })
        setShowOrderForm(false)
    }

    const updateOrderStatus = (orderId: string, status: Order['status']) => {
        setOrders(orders.map(order => 
            order.id === orderId ? { ...order, status } : order
        ))
    }

    const deleteOrder = (orderId: string) => {
        setOrders(orders.filter(order => order.id !== orderId))
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Order Management</h2>
                <button
                    onClick={() => setShowOrderForm(true)}
                    className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 flex items-center space-x-2"
                >
                    <Plus size={18} />
                    <span>Create Order</span>
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {orders.map((order) => (
                        <li key={order.id}>
                            <div className="px-4 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-medium text-indigo-600">
                                                Order #{order.id} - {order.customer_name}
                                            </p>
                                            <div className="flex items-center space-x-2">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                                                    className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(order.status)}`}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="processing">Processing</option>
                                                    <option value="shipped">Shipped</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                                <button
                                                    onClick={() => deleteOrder(order.id)}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Items: {order.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                                        </div>
                                        <div className="flex justify-between mt-2">
                                            <span className="text-sm text-gray-500">Date: {order.createdAt}</span>
                                            <span className="text-sm font-medium text-green-600">Total: ${order.total}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Create Order Modal */}
            {showOrderForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Create New Order</h3>
                            <button
                                onClick={() => setShowOrderForm(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <select
                                required
                                value={orderForm.customer_id}
                                onChange={(e) => setOrderForm({...orderForm, customer_id: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="">Select Customer</option>
                                {customers.map(customer => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </option>
                                ))}
                            </select>
                            
                            {orderForm.items.map((item, index) => (
                                <div key={index} className="flex space-x-2">
                                    <select
                                        required
                                        value={item.item_id}
                                        onChange={(e) => {
                                            const newItems = [...orderForm.items]
                                            newItems[index] = {...newItems[index], item_id: e.target.value}
                                            setOrderForm({...orderForm, items: newItems})
                                        }}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="">Select Product</option>
                                        {items.map(product => (
                                            <option key={product.item_id} value={product.item_id}>
                                                {product.item_name} - ${product.price}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => {
                                            const newItems = [...orderForm.items]
                                            newItems[index] = {...newItems[index], quantity: parseInt(e.target.value)}
                                            setOrderForm({...orderForm, items: newItems})
                                        }}
                                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        placeholder="Qty"
                                    />
                                </div>
                            ))}
                            
                            <button
                                type="button"
                                onClick={handleCreateOrder}
                                className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700"
                            >
                                Create Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
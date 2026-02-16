'use client'

import { useState, useEffect } from 'react'
import { Plus, Users, Package, ShoppingCart } from 'lucide-react'
import InventoryTab from './components/InventoryTab'
import ProductsTab from './components/ProductsTab'
import CustomersTab from './components/CustomersTab'
import OrdersTab from './components/OrdersTab'
import { Tab, InventoryItem, Customer, Order } from './types'

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<Tab>('inventory')
    const [items, setItems] = useState<InventoryItem[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingComplete, setLoadingComplete] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Initial data loading
    useEffect(() => {
        const loadData = async () => {
            try {
                setError(null)
                await new Promise(res => setTimeout(res, 500))

                const mockCustomers: Customer[] = [
                    {
                        id: '1',
                        name: 'John Doe',
                        email: 'john@example.com',
                        phone: '123-456-7890',
                        address: '123 Main St',
                        created_at: new Date().toISOString(),
                    },
                    {
                        id: '2',
                        name: 'Jane Smith',
                        email: 'jane@example.com',
                        phone: '987-654-3210',
                        address: '456 Oak Ave',
                        created_at: new Date().toISOString(),
                    },
                ]

                const mockItems: InventoryItem[] = [
                    {
                        item_id: '1',
                        item_name: 'Sample Product',
                        description: 'A sample product for testing',
                        price: 29.99,
                        quantity: 100,
                        category: 'Electronics',
                        sku: 'SP001',
                        createdAt: new Date().toISOString(),
                    },
                ]

                setCustomers(mockCustomers)
                setItems(mockItems)
                setOrders([])
                setLoadingComplete(true)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data')
            }
        }

        loadData()
    }, [])

    if (!loadingComplete && !error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-red-600 mb-4">Error: {error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: 'inventory', label: 'Inventory', icon: Package },
        { id: 'products', label: 'Add Products', icon: Plus },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'orders', label: 'Orders', icon: ShoppingCart },
    ]

    return (
        <div className="p-4 mt-20 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-amber-800">Business Dashboard</h1>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                    {tabs.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === id
                                ? 'border-amber-500 text-amber-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-96">
                {activeTab === 'inventory' && (
                    // ...existing code...
                    <InventoryTab
                        items={items}
                        setItems={setItems}
                        setLoading={setLoading}
                        setError={setError}
                    />
                    // ...existing code...
                )}
                {activeTab === 'products' && (
                    <ProductsTab items={items} setItems={setItems} />
                )}
                {activeTab === 'customers' && (
                    <CustomersTab customers={customers} setCustomers={setCustomers} />
                )}
                {activeTab === 'orders' && (
                    <OrdersTab
                        orders={orders}
                        setOrders={setOrders}
                        customers={customers}
                        items={items}
                    />
                )}
            </div>
        </div>
    )
}

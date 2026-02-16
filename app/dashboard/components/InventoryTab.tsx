'use client'

import { useEffect, useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import { InventoryItem } from '../types'

type InventoryTabProps = {
    items: InventoryItem[]
    setItems: (items: InventoryItem[]) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
}

export default function InventoryTab({ items, setItems, setLoading, setError }: InventoryTabProps) {
    const [editingItem, setEditingItem] = useState<string | null>(null)

    const fetchInventory = async () => {
        try {
            setError(null)
            setLoading(true)
            
            const res = await fetch('https://locdshop.spiritbulb.workers.dev/api/inventory', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!res.ok) {
                const errorText = await res.text()
                console.error('Server error:', errorText)
                setError(`Server error: ${res.status} ${res.statusText}`)
                return
            }

            const data = await res.json()
            console.log('Inventory response:', data)
            
            if (Array.isArray(data)) {
                setItems(data)
            } else if (data.error) {
                setError(data.error)
            } else {
                setError('Unexpected response format')
            }
            
        } catch (error) {
            console.error('Fetch error:', error)
            setError(error instanceof Error ? error.message : 'Unknown error occurred')
        } finally {
            setLoading(false)
        }
    }

    const deleteItem = (itemId: string) => {
        setItems(items.filter(item => item.item_id !== itemId))
    }

    useEffect(() => {
        fetchInventory()
    }, [])

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Inventory Management</h2>
                <div className="text-sm text-gray-500">
                    Total Items: {items.length} | Total Value: ${items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                </div>
            </div>
            
            {items.length === 0 ? (
                <p className="text-yellow-600 text-center py-8">No items found. Add some products to get started!</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                        <div
                            key={item.item_id}
                            className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-lg font-semibold text-amber-700">
                                    {item.item_name || 'Unknown Product'}
                                </div>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => setEditingItem(editingItem === item.item_id ? null : item.item_id)}
                                        className="p-1 text-gray-400 hover:text-blue-500"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => deleteItem(item.item_id)}
                                        className="p-1 text-gray-400 hover:text-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">ID: {item.item_id}</div>
                            <div className="flex justify-between items-center">
                                <div className="text-gray-700">
                                    Qty: <span className={item.quantity < 10 ? 'text-red-600 font-medium' : ''}>{item.quantity}</span>
                                </div>
                                <div className="text-green-700 font-medium">${item.price}</div>
                            </div>
                            {item.quantity < 10 && (
                                <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                    Low Stock Alert
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}


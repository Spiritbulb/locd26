'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { InventoryItem } from '../types'

type ProductsTabProps = {
    items: InventoryItem[]
    setItems: (items: InventoryItem[]) => void
}

export default function ProductsTab({ items, setItems }: ProductsTabProps) {
    const [productForm, setProductForm] = useState({
        name: '', price: '', quantity: '', description: '', category: '', sku: '', createdAt: ''
    })

    const handleAddProduct = async () => {
        if (!productForm.name || !productForm.price || !productForm.quantity) {
            alert('Please fill in all fields')
            return
        }
        
        const newProduct: InventoryItem = {
            item_id: Date.now().toString(),
            item_name: productForm.name,
            price: parseFloat(productForm.price),
            quantity: parseInt(productForm.quantity),
            description: productForm.description,
            category: productForm.category,
            sku: productForm.sku,
            createdAt: productForm.createdAt

        }

        setItems([...items, newProduct])
        setProductForm({ name: '', price: '', quantity: '', description: '', category: '', sku: '', createdAt: '' })
    }

    return (
        <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Add New Product</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <input
                        type="text"
                        required
                        value={productForm.name}
                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Enter product name"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        value={productForm.price}
                        onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="0.00"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity</label>
                    <input
                        type="number"
                        required
                        value={productForm.quantity}
                        onChange={(e) => setProductForm({...productForm, quantity: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="0"
                    />
                </div>
                <button
                    type="button"
                    onClick={handleAddProduct}
                    className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 flex items-center justify-center space-x-2"
                >
                    <Plus size={18} />
                    <span>Add Product</span>
                </button>
            </div>
        </div>
    )
}
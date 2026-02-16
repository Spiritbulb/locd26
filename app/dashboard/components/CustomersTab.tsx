'use client'

import { Plus, Edit, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Customer } from '../types'

export default function CustomersTab({ customers, setCustomers }: { customers: Customer[], setCustomers: (customers: Customer[]) => void }) {
    const [showCustomerForm, setShowCustomerForm] = useState(false)
    const [customerForm, setCustomerForm] = useState({
        name: '', email: '', phone: '', address: ''
    })
    const [editingCustomer, setEditingCustomer] = useState<string | null>(null)

    const handleAddCustomer = () => {
        if (!customerForm.name || !customerForm.email) {
            alert('Please fill in required fields')
            return
        }
        
        const newCustomer: Customer = {
            id: Date.now().toString(),
            name: customerForm.name,
            email: customerForm.email,
            phone: customerForm.phone,
            address: customerForm.address,
            created_at: new Date().toISOString().split('T')[0]
        }

        setCustomers([...customers, newCustomer])
        setCustomerForm({ name: '', email: '', phone: '', address: '' })
        setShowCustomerForm(false)
    }

    const deleteCustomer = (customerId: string) => {
        setCustomers(customers.filter(customer => customer.id !== customerId))
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Customer Management</h2>
                <button
                    onClick={() => setShowCustomerForm(true)}
                    className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 flex items-center space-x-2"
                >
                    <Plus size={18} />
                    <span>Add Customer</span>
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {customers.map((customer) => (
                        <li key={customer.id}>
                            <div className="px-4 py-4 flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-indigo-600">{customer.name}</p>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => setEditingCustomer(editingCustomer === customer.id ? null : customer.id)}
                                                className="text-gray-400 hover:text-blue-500"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => deleteCustomer(customer.id)}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600">{customer.email}</p>
                                    <p className="text-sm text-gray-600">{customer.phone}</p>
                                    <p className="text-sm text-gray-500">{customer.address}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Add Customer Modal */}
            {showCustomerForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Add New Customer</h3>
                            <button
                                onClick={() => setShowCustomerForm(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <input
                                type="text"
                                required
                                placeholder="Full Name"
                                value={customerForm.name}
                                onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                            <input
                                type="email"
                                required
                                placeholder="Email Address"
                                value={customerForm.email}
                                onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                value={customerForm.phone}
                                onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                            <textarea
                                placeholder="Address"
                                value={customerForm.address}
                                onChange={(e) => setCustomerForm({...customerForm, address: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                                rows={3}
                            />
                            <button
                                type="button"
                                onClick={handleAddCustomer}
                                className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700"
                            >
                                Add Customer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
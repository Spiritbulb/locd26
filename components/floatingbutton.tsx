import { useState } from 'react';
import { ShoppingCart, Lightbulb, Plus } from 'lucide-react';
import Link from 'next/link';


export default function FloatingMenu() {
    const [isOpen, setIsOpen] = useState(false);



    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isOpen && (
                <div className="flex flex-col gap-3 mb-3">
                    <Link href="/cart" className="flex items-center justify-center w-12 h-12 bg-amber-600 rounded-full shadow-lg text-white">
                        <ShoppingCart className="w-5 h-5" />
                    </Link>
                    <Link href="/hair-tips" className="flex items-center justify-center w-12 h-12 bg-pink-500 rounded-full shadow-lg text-white">
                        <Lightbulb className="w-5 h-5" />
                    </Link>
                </div>
            )}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-600 to-pink-500 rounded-full shadow-lg text-white"
            >
                <Plus className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
            </button>
        </div>
    );
}
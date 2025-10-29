'use client'

import { X } from "lucide-react"
import { useEffect } from "react"

interface FornecedorModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export function FornecedorModal({
    isOpen,
    onClose,
    title,
    children,
}: FornecedorModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }

        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="p-6">{children}</div>
                </div>
            </div>
        </div>
    );
}

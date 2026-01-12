'use client'

import { X } from "lucide-react"
import { useEffect } from "react"

interface mdrModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export function MdrModal({
    isOpen,
    onClose,
    title,
    children,
}: mdrModalProps) {
   
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
            <div className="fixed inset-0 bg-black/80 transition-opacity" onClick={onClose} />
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="relative bg-[#1a1a1a] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#2a2a2a]">
                    <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#2a2a2a] px-6 py-4 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-white">{title}</h2>
                        <button onClick={onClose} className="text-[#808080] hover:text-white transition cursor-pointer">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="p-6">{children}</div>
                </div>
            </div>
        </div>
    );
}

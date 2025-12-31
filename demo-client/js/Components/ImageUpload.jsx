import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function ImageUpload({ label, value, onChange, error, className = '' }) {
    const fileInputRef = useRef(null);
    const [preview, setPreview] = useState(value || null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        setPreview(value || null);
    }, [value]);

    const handleFileSelect = (file) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
            onChange(file);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleRemove = (e) => {
        e.stopPropagation();
        setPreview(null);
        onChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={`mb-5 ${className}`}>
            {label && (
                <label className="block text-sm font-bold text-gray-700 mb-3">
                    {label}
                </label>
            )}
            
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                    relative w-full h-48 rounded-xl border-2 border-dashed
                    flex flex-col items-center justify-center
                    cursor-pointer transition-all duration-200
                    ${isDragging 
                        ? 'border-red-600 bg-gray-700 scale-105' 
                        : error
                            ? 'border-red-400 bg-red-900/30 hover:border-red-500'
                            : 'border-red-900/50 bg-gray-800/50 hover:border-red-800 hover:bg-gray-700'
                    }
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
                
                {preview ? (
                    <div className="relative w-full h-full">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-xl"
                        />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-2 left-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <div className="text-center p-6">
                        <motion.div
                            animate={{ scale: isDragging ? 1.1 : 1 }}
                            className="text-5xl mb-3"
                        >
                            📷
                        </motion.div>
                        <p className="text-gray-600 font-medium mb-1">
                            کلیک کنید یا تصویر را بکشید
                        </p>
                        <p className="text-sm text-gray-500">
                            PNG, JPG تا 5MB
                        </p>
                    </div>
                )}
            </div>

            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600 flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </motion.p>
            )}
        </div>
    );
}

export default ImageUpload;


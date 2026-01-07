import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { orderService, invoiceService } from '../services/api';
import Loading from '../Components/Loading';
import { WarningIcon, InvoiceIcon as InvoiceIconComponent } from '../Components/Icons';

function Invoices() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user) {
            fetchInvoices();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            setError(null);
            const orders = await orderService.getOrders();
            
            // Fetch invoices for each order
            const invoicePromises = orders
                .filter(order => order.invoice_id)
                .map(order => 
                    invoiceService.getInvoiceByOrder(order.id)
                        .catch(() => null)
                );
            
            const invoiceResults = await Promise.all(invoicePromises);
            const validInvoices = invoiceResults.filter(inv => inv !== null);
            setInvoices(validInvoices);
        } catch (err) {
            setError('خطا در بارگذاری فاکتورها. لطفا دوباره تلاش کنید.');
            console.error('Error fetching invoices:', err);
        } finally {
            setLoading(false);
        }
    };

    const filters = [
        { id: 'all', name: 'همه' },
        { id: 'paid', name: 'پرداخت شده' },
        { id: 'pending', name: 'در انتظار پرداخت' },
    ];

    const getStatusText = (status) => {
        const statusMap = {
            'paid': 'پرداخت شده',
            'pending': 'در انتظار پرداخت',
            'failed': 'ناموفق',
        };
        return statusMap[status] || status;
    };

    const filteredInvoices = selectedFilter === 'all'
        ? invoices
        : invoices.filter(invoice => invoice.status === selectedFilter);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(date);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fa-IR').format(price);
    };

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="flex justify-center mb-4 text-red-500">
                    <WarningIcon className="w-16 h-16" />
                </div>
                <p className="text-gray-300 mb-4">{error}</p>
                <button
                    onClick={fetchInvoices}
                    className="cafe-button px-6 py-2 rounded-lg"
                >
                    تلاش مجدد
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {filters.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => setSelectedFilter(filter.id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                            selectedFilter === filter.id
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg scale-105'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-red-900/50'
                        }`}
                    >
                        {filter.name}
                    </button>
                ))}
            </div>

            {/* Invoices List */}
            <div className="space-y-4">
                {filteredInvoices.map((invoice) => (
                    <div
                        key={invoice.id}
                        className="cafe-card rounded-xl p-5 hover:scale-[1.01] transition-all duration-200"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    فاکتور #{invoice.invoice_number || invoice.id}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {formatDate(invoice.created_at)}
                                </p>
                            </div>
                            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                                invoice.status === 'paid'
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                    : 'bg-gradient-to-r from-yellow-500 to-red-500 text-white'
                            }`}>
                                {getStatusText(invoice.status)}
                            </div>
                        </div>

                        {invoice.order && invoice.order.order_items && (
                            <div className="mb-4">
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {invoice.order.order_items.map((orderItem, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-gray-700 text-red-400 rounded-full text-sm border border-red-900/50"
                                        >
                                            {orderItem.menu_item?.name || 'آیتم'} × {orderItem.quantity}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-red-900/50">
                            <div>
                                <span className="text-sm text-gray-300">مبلغ:</span>
                                <span className="text-xl font-bold text-red-400 ml-2">
                                    {formatPrice(invoice.total_amount || 0)} تومان
                                </span>
                            </div>
                            {invoice.status === 'pending' && (
                                <button
                                    onClick={() => {
                                        // Navigate to payment or show payment modal
                                        showToast('در حال انتقال به صفحه پرداخت...', 'info');
                                    }}
                                    className="px-6 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all duration-200"
                                >
                                    پرداخت
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredInvoices.length === 0 && (
                <div className="text-center py-12">
                    <div className="flex justify-center mb-4 text-red-500">
                        <InvoiceIconComponent className="w-16 h-16" />
                    </div>
                    <p className="text-gray-300">فاکتوری یافت نشد</p>
                </div>
            )}
        </div>
    );
}

export default Invoices;


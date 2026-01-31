import axios from 'axios';
import { navigateTo } from '../helpers/navigation';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle token refresh/logout on 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            navigateTo('/login');
        }
        return Promise.reject(error);
    }
);

// Menu Service
export const menuService = {
    getMenu: () => api.get('/menu').then(res => res.data),
    getCategories: (branchId = null, params = {}) => {
        const queryParams = { ...params };
        if (branchId) queryParams.branch_id = branchId;
        if (!queryParams.per_page) queryParams.per_page = 15;
        return api.get('/categories', { params: queryParams }).then(res => {
            // Handle paginated response
            if (res.data && res.data.data) {
                return res.data;
            }
            return res.data;
        });
    },
    getMenuItems: (branchId = null, params = {}) => {
        const queryParams = { ...params };
        if (branchId) queryParams.branch_id = branchId;
        if (!queryParams.per_page) queryParams.per_page = 15;
        return api.get('/menu-items', { params: queryParams }).then(res => {
            // Handle paginated response
            if (res.data && res.data.data) {
                return res.data;
            }
            return res.data;
        });
    },
    // Use admin endpoints for now (they should be public, but if not, we'll use admin)
    getCategoriesPublic: (branchId = null, params = {}) => {
        const queryParams = { ...params };
        if (branchId) queryParams.branch_id = branchId;
        if (!queryParams.per_page) queryParams.per_page = 15;
        return api.get('/admin/categories', { params: queryParams }).then(res => {
            if (res.data && res.data.data) return res.data;
            return Array.isArray(res.data) ? res.data : [];
        });
    },
    getMenuItemsPublic: (branchId = null, params = {}) => {
        const queryParams = { ...params };
        if (branchId) queryParams.branch_id = branchId;
        if (!queryParams.per_page) queryParams.per_page = 15;
        return api.get('/admin/menu-items', { params: queryParams }).then(res => {
            if (res.data && res.data.data) return res.data;
            return Array.isArray(res.data) ? res.data : [];
        });
    },
};

// Order Service (original - for general food orders)
export const orderService = {
    getOrders: () => api.get('/orders').then(res => res.data),
    getOrder: (id) => api.get(`/orders/${id}`).then(res => res.data),
    createOrder: (data) => api.post('/orders', data).then(res => res.data),
};

// Reservation Order Service (for reservation food orders)
export const reservationOrderService = {
    getOrders: (reservationId) => api.get(`/reservations/${reservationId}/orders`).then(res => res.data),
    createOrder: (reservationId, data) => api.post(`/reservations/${reservationId}/orders`, data).then(res => res.data),
    updateOrder: (orderId, data) => api.put(`/orders/${orderId}`, data).then(res => res.data),
    deleteOrder: (orderId) => api.delete(`/orders/${orderId}`).then(res => res.data),
};

// Invoice Service
export const invoiceService = {
    getInvoice: (id) => api.get(`/invoices/${id}`).then(res => res.data),
    getInvoiceByOrder: (orderId) => api.get(`/invoices/by-order/${orderId}`).then(res => res.data),
    payInvoice: (invoiceId) => api.post(`/invoices/${invoiceId}/pay`).then(res => res.data),
};

// Payment Service
export const paymentService = {
    initiate: (paymentTransactionId, gatewayId) => api.post(`/payments/${paymentTransactionId}/initiate`, { gateway_id: gatewayId }).then(res => res.data),
    status: (paymentTransactionId) => api.get(`/payments/${paymentTransactionId}/status`).then(res => res.data),
    getGateways: () => api.get('/payment/gateways').then(res => res.data),
};

// Transaction Service
export const transactionService = {
    getTransactions: (invoiceId) => api.get(`/invoices/${invoiceId}/transactions`).then(res => res.data),
};

// Discount Service
export const discountService = {
    validate: (code, orderAmount) => api.post('/discounts/validate', {
        code,
        order_amount: orderAmount,
    }).then(res => res.data),
    getCampaigns: () => api.get('/campaigns').then(res => res.data),
};

// Admin Service
export const adminService = {
    getOrders: (status = null) => {
        const params = status ? { status } : {};
        return api.get('/admin/orders', { params }).then(res => res.data);
    },
    getOrder: (id) => api.get(`/admin/orders/${id}`).then(res => res.data),
    updateOrderStatus: (id, status) => api.patch(`/admin/orders/${id}/status`, { status }).then(res => res.data),
    
    // Menu Items
    getMenuItems: () => api.get('/admin/menu-items').then(res => res.data),
    getMenuItem: (id) => api.get(`/admin/menu-items/${id}`).then(res => res.data),
    createMenuItem: (data, imageFile = null) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        if (imageFile) {
            formData.append('image', imageFile);
        }
        return api.post('/admin/menu-items', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(res => res.data);
    },
    updateMenuItem: (id, data, imageFile = null, deleteImage = false) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        if (imageFile) {
            formData.append('image', imageFile);
        }
        if (deleteImage) {
            formData.append('delete_image', '1');
        }
        return api.post(`/admin/menu-items/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(res => res.data);
    },
    deleteMenuItem: (id) => api.delete(`/admin/menu-items/${id}`).then(res => res.data),
    
    // Categories
    getCategories: () => api.get('/admin/categories').then(res => res.data),
    getCategory: (id) => api.get(`/admin/categories/${id}`).then(res => res.data),
    createCategory: (data) => api.post('/admin/categories', data).then(res => res.data),
    updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data).then(res => res.data),
    deleteCategory: (id) => api.delete(`/admin/categories/${id}`).then(res => res.data),
};

// Device ID helper
const getDeviceId = () => {
    // Check localStorage first
    let deviceId = localStorage.getItem('device_id');
    
    // Check cookie (browser will send it automatically, but we can also read it here)
    if (!deviceId) {
        // Try to get from cookie
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'device_id') {
                deviceId = value;
                break;
            }
        }
    }
    
    // If still no device_id, generate one (will be set by middleware on next request)
    if (!deviceId) {
        deviceId = 'device_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('device_id', deviceId);
    }
    
    return deviceId;
};

// Store device_id in request headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add device_id to all requests
        const deviceId = getDeviceId();
        if (deviceId) {
            config.headers['X-Device-ID'] = deviceId;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Store device_id from response headers
api.interceptors.response.use(
    (response) => {
        const deviceId = response.headers['x-device-id'];
        if (deviceId) {
            localStorage.setItem('device_id', deviceId);
        }
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            navigateTo('/login');
        }
        return Promise.reject(error);
    }
);

// Branch Service
export const branchService = {
    getBranches: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.per_page) queryParams.append('per_page', params.per_page);
        const queryString = queryParams.toString();
        return api.get(`/branches${queryString ? '?' + queryString : ''}`).then(res => {
            // Handle paginated response
            if (res.data && res.data.data) {
                return res.data;
            }
            return res.data;
        });
    },
    getBranch: (id) => api.get(`/branches/${id}`).then(res => {
        // Handle single resource response
        if (res.data && res.data.data) {
            return res.data.data;
        }
        return res.data;
    }),
};

// Session Service
export const sessionService = {
    getSessions: (params = {}) => {
        const queryParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                queryParams.append(key, params[key]);
            }
        });
        const queryString = queryParams.toString();
        return api.get(`/sessions${queryString ? '?' + queryString : ''}`).then(res => {
            // Handle paginated response
            if (res.data && res.data.data) {
                return res.data;
            }
            return res.data;
        });
    },
    getBranchSessions: (branchId, params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.date) queryParams.append('date', params.date);
        if (params.per_page) queryParams.append('per_page', params.per_page);
        const queryString = queryParams.toString();
        return api.get(`/branches/${branchId}/sessions${queryString ? '?' + queryString : ''}`).then(res => {
            // Handle paginated response
            if (res.data && res.data.data) {
                return res.data;
            }
            return res.data;
        });
    },
    getSession: (id) => api.get(`/sessions/${id}`).then(res => {
        // Handle single resource response
        if (res.data && res.data.data) {
            return res.data.data;
        }
        return res.data;
    }),
};

// Reservation Service
export const reservationService = {
    getReservations: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.per_page) queryParams.append('per_page', params.per_page);
        const queryString = queryParams.toString();
        return api.get(`/reservations${queryString ? '?' + queryString : ''}`).then(res => {
            // Handle paginated response
            if (res.data && res.data.data) {
                return res.data;
            }
            return res.data;
        });
    },
    getReservation: (id) => api.get(`/reservations/${id}`).then(res => {
        // Handle single resource response
        if (res.data && res.data.data) {
            return res.data.data;
        }
        return res.data;
    }),
    getUnpaidReservations: () => api.get('/reservations/unpaid').then(res => {
        // Handle collection response
        if (res.data && res.data.data) {
            return res.data.data;
        }
        return res.data;
    }),
    createReservation: (sessionId, numberOfPeople, orderItems = null, orderNotes = null) => {
        const data = {
            number_of_people: numberOfPeople,
        };
        
        if (orderItems && orderItems.length > 0) {
            data.order_items = orderItems;
        }
        
        if (orderNotes) {
            data.order_notes = orderNotes;
        }
        
        return api.post(`/sessions/${sessionId}/reservations`, data).then(res => {
            // Handle single resource response
            if (res.data && res.data.data) {
                return res.data.data;
            }
            return res.data;
        });
    },
    cancelReservation: (id) => api.delete(`/reservations/${id}`).then(res => res.data),
};

// Auth Service (update profile)
export const authService = {
    updateProfile: (data) => api.put('/user', data).then(res => {
        // Handle Laravel Resource wrapping - if response.data has a data property, use it
        return res.data?.data || res.data;
    }),
};

// Feed Service
export const feedService = {
    getFeed: (params = {}) => {
        const queryParams = { ...params };
        if (!queryParams.per_page) queryParams.per_page = 15;
        return api.get('/feed', { params: queryParams }).then(res => {
            // Handle paginated response
            if (res.data && res.data.data) {
                return res.data;
            }
            return res.data;
        });
    },
    getFeedItem: (type, id) => {
        return api.get(`/feed/${type}/${id}`).then(res => res.data);
    },
    checkQuizResponse: async (quizId) => {
        try {
            const response = await api.get(`/quizzes/${quizId}/responses`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },
    submitQuizResponse: async (quizId, answers, score) => {
        const response = await api.post(`/quizzes/${quizId}/responses`, {
            answers,
            score
        });
        return response.data;
    },
    checkFormResponse: async (formId) => {
        try {
            const response = await api.get(`/forms/${formId}/responses`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },
    submitFormResponse: async (formId, data) => {
        const response = await api.post(`/forms/${formId}/responses`, {
            data
        });
        return response.data;
    },
};

// Coin Service
export const coinService = {
    getBalance: () => api.get('/coins/balance').then(res => res.data),
    getHistory: (params = {}) => {
        const queryParams = { ...params };
        if (!queryParams.per_page) queryParams.per_page = 20;
        return api.get('/coins/history', { params: queryParams }).then(res => {
            if (res.data && res.data.data) {
                return res.data;
            }
            return res.data;
        });
    },
};

// Discount Code Service
export const discountCodeService = {
    getAvailable: () => api.get('/discount-codes').then(res => {
        if (res.data && res.data.data) {
            return res.data.data;
        }
        return Array.isArray(res.data) ? res.data : [];
    }),
    purchase: (discountCodeId) => api.post(`/discount-codes/${discountCodeId}/purchase`).then(res => res.data),
    getMyCodes: () => api.get('/discount-codes/my-codes').then(res => {
        if (res.data && res.data.data) {
            return res.data.data;
        }
        return Array.isArray(res.data) ? res.data : [];
    }),
    validate: (code, orderAmount) => api.post('/discount-codes/validate', {
        code,
        order_amount: orderAmount,
    }).then(res => res.data),
};

// Free Ticket Service
export const freeTicketService = {
    getTickets: (unusedOnly = false) => {
        const params = unusedOnly ? { unused_only: true } : {};
        return api.get('/free-tickets', { params }).then(res => {
            if (res.data && res.data.data) {
                return res.data.data;
            }
            return Array.isArray(res.data) ? res.data : [];
        });
    },
    purchase: (coinsCost) => api.post('/free-tickets/purchase', {
        coins_cost: coinsCost,
    }).then(res => res.data),
    useTicket: (ticketId, sessionId) => api.post(`/free-tickets/${ticketId}/use`, {
        session_id: sessionId,
    }).then(res => res.data),
};

// Feed Service - add trackView
feedService.trackView = async (type, id) => {
    const response = await api.post(`/feed/${type}/${id}/view`);
    return response.data;
};

// Cashier Service
export const cashierService = {
    getReservations: (params = {}) => {
        const queryParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                queryParams.append(key, params[key]);
            }
        });
        const queryString = queryParams.toString();
        return api.get(`/cashier/reservations${queryString ? '?' + queryString : ''}`).then(res => {
            if (res.data && res.data.data) {
                return res.data;
            }
            return res.data;
        });
    },
    getReservation: (id) => api.get(`/cashier/reservations/${id}`).then(res => {
        if (res.data && res.data.data) {
            return res.data.data;
        }
        return res.data;
    }),
    processPayment: (reservationId, note = null) => {
        const data = {};
        if (note) {
            data.note = note;
        }
        return api.post(`/cashier/reservations/${reservationId}/process-payment`, data).then(res => {
            if (res.data && res.data.data) {
                return res.data.data;
            }
            return res.data;
        });
    },
    getOrders: (reservationId) => api.get(`/cashier/reservations/${reservationId}/orders`).then(res => {
        if (res.data && res.data.data) {
            return res.data.data;
        }
        return Array.isArray(res.data) ? res.data : [];
    }),
    getTransactions: (params = {}) => {
        const queryParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                queryParams.append(key, params[key]);
            }
        });
        const queryString = queryParams.toString();
        return api.get(`/cashier/transactions${queryString ? '?' + queryString : ''}`).then(res => {
            if (res.data && res.data.data) {
                return res.data;
            }
            return res.data;
        });
    },
    getStats: () => api.get('/cashier/stats').then(res => res.data),
};

export default api;


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
    getCategories: () => api.get('/categories').then(res => res.data),
    getMenuItems: () => api.get('/menu-items').then(res => res.data),
};

// Order Service
export const orderService = {
    getOrders: () => api.get('/orders').then(res => res.data),
    getOrder: (id) => api.get(`/orders/${id}`).then(res => res.data),
    createOrder: (data) => api.post('/orders', data).then(res => res.data),
};

// Invoice Service
export const invoiceService = {
    getInvoice: (id) => api.get(`/invoices/${id}`).then(res => res.data),
    getInvoiceByOrder: (orderId) => api.get(`/invoices/by-order/${orderId}`).then(res => res.data),
    payInvoice: (invoiceId) => api.post(`/invoices/${invoiceId}/pay`).then(res => res.data),
};

// Payment Service
export const paymentService = {
    initiate: (invoiceId) => api.post(`/payments/${invoiceId}/initiate`).then(res => res.data),
    verify: (invoiceId) => api.post(`/payments/${invoiceId}/verify`).then(res => res.data),
    uploadReceipt: (data) => api.post('/payments/upload-receipt', data).then(res => res.data),
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
            // Also add as param for cart endpoints
            if (config.url?.includes('/cart')) {
                config.params = { ...config.params, device_id: deviceId };
            }
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
    createReservation: (sessionId, numberOfPeople) => {
        return api.post(`/sessions/${sessionId}/reservations`, {
            number_of_people: numberOfPeople,
        }).then(res => {
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
    updateProfile: (data) => api.put('/user', data).then(res => res.data),
};

// Cart Service
export const cartService = {
    getCart: () => {
        const deviceId = getDeviceId();
        return api.get('/cart', { params: { device_id: deviceId } }).then(res => res.data.cart);
    },
    addItem: (menuItemId, quantity = 1) => {
        const deviceId = getDeviceId();
        return api.post('/cart/items', {
            menu_item_id: menuItemId,
            quantity: quantity,
        }, {
            params: { device_id: deviceId }
        }).then(res => res.data.cart);
    },
    updateItem: (menuItemId, quantity) => {
        const deviceId = getDeviceId();
        return api.put(`/cart/items/${menuItemId}`, {
            quantity: quantity,
        }, {
            params: { device_id: deviceId }
        }).then(res => res.data.cart);
    },
    removeItem: (menuItemId) => {
        const deviceId = getDeviceId();
        return api.delete(`/cart/items/${menuItemId}`, {
            params: { device_id: deviceId }
        }).then(res => res.data.cart);
    },
    clearCart: () => {
        const deviceId = getDeviceId();
        return api.delete('/cart', {
            params: { device_id: deviceId }
        }).then(res => res.data.cart);
    },
    mergeCart: () => {
        const deviceId = getDeviceId();
        return api.post('/cart/merge', {}, {
            params: { device_id: deviceId }
        }).then(res => res.data.cart);
    },
};

export default api;


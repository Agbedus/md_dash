import { toast as hotToast, ToastOptions } from 'react-hot-toast';
import { FiCheckCircle, FiInfo, FiAlertCircle, FiXCircle } from 'react-icons/fi';
import React from 'react';

const toastFunction = (message: string, options?: ToastOptions) => 
    hotToast(message, {
        icon: <FiInfo size={22} className="text-blue-400" />,
        ...options,
    });

export const toast = Object.assign(toastFunction, {
    success: (message: string, options?: ToastOptions) => 
        hotToast.success(message, {
            icon: <FiCheckCircle size={22} className="text-emerald-400" />,
            ...options,
        }),
    error: (message: string, options?: ToastOptions) => 
        hotToast.error(message, {
            icon: <FiXCircle size={22} className="text-rose-400" />,
            ...options,
        }),
    info: (message: string, options?: ToastOptions) => 
        hotToast(message, {
            icon: <FiInfo size={22} className="text-blue-400" />,
            ...options,
        }),
    warning: (message: string, options?: ToastOptions) => 
        hotToast.error(message, {
            icon: <FiAlertCircle size={22} className="text-amber-400" />,
            ...options,
        }),
    custom: hotToast.custom,
    loading: hotToast.loading,
    dismiss: hotToast.dismiss,
    remove: hotToast.remove,
    promise: hotToast.promise,
});

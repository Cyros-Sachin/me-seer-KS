// components/CustomToast.tsx
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, RotateCw, AlertTriangle, X } from 'lucide-react';

export const triggerToast = {
  success: (message: string) => toast.custom((t) => (
    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
      max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black/5`}>
      <div className="flex-1 p-4">
        <div className="flex items-start">
          <CheckCircle className="h-6 w-6 text-green-500" />
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">{message}</p>
          </div>
        </div>
      </div>
      <button onClick={() => toast.dismiss(t.id)} className="p-2 text-gray-400 hover:text-gray-500">
        <X className="h-5 w-5" />
      </button>
    </div>
  )),
  error: (message: string) => toast.error(message, {
    icon: <XCircle className="h-5 w-5 text-red-500" />,
    style: {
      background: '#fef2f2',
      color: '#b91c1c',
      border: '1px solid #fecaca',
    },
  }),
  loading: (message: string) => toast.loading(message, {
    icon: <RotateCw className="h-5 w-5 text-blue-500 animate-spin" />,
  }),
  promise: (promise: Promise<any>, messages: { loading: string; success: string; error: string }) => {
    return toast.promise(promise, messages, {
      style: { minWidth: '250px' },
      success: { icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
      error: { icon: <AlertTriangle className="h-5 w-5 text-red-500" /> },
    });
  },
};
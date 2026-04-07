import { AlertCircle, X } from "lucide-react";
import { useState } from "react";

interface ErrorAlertProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
  retry?: () => void;
}

/**
 * 错误提示组件
 */
export function ErrorAlert({ title = "Error", message, onDismiss, retry }: ErrorAlertProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-semibold text-red-900">{title}</h3>
        <p className="text-sm text-red-700 mt-1">{message}</p>
        <div className="flex gap-2 mt-3">
          {retry && (
            <button
              onClick={retry}
              className="text-sm font-medium text-red-600 hover:text-red-700 underline"
            >
              Retry
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="text-sm font-medium text-red-600 hover:text-red-700 underline"
          >
            Dismiss
          </button>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="text-red-400 hover:text-red-600 flex-shrink-0"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

/**
 * 成功提示组件
 */
export function SuccessAlert({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center justify-between">
      <p className="text-sm text-green-700">{message}</p>
      <button
        onClick={handleDismiss}
        className="text-green-400 hover:text-green-600"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

/**
 * 警告提示组件
 */
export function WarningAlert({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex items-center justify-between">
      <p className="text-sm text-yellow-700">{message}</p>
      <button
        onClick={handleDismiss}
        className="text-yellow-400 hover:text-yellow-600"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

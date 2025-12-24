import { AlertCircle, X } from "lucide-react";
import { useState } from "react";

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div className="glass border border-destructive/50 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
      <div className="p-2 rounded-lg bg-destructive/20">
        <AlertCircle className="h-5 w-5 text-destructive" />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-destructive">Erreur</h4>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg hover:bg-secondary transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

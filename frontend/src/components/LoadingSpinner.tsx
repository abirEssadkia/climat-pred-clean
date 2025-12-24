import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "Chargement des données..." }: LoadingSpinnerProps) {
  return (
    <div className="glass rounded-2xl p-8 h-[400px] flex items-center justify-center animate-fade-in">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
          <Loader2 className="w-16 h-16 text-primary animate-spin absolute top-0 left-0" />
        </div>
        <p className="text-lg text-muted-foreground">{message}</p>
        <div className="flex justify-center gap-1 mt-4">
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
        </div>
      </div>
    </div>
  );
}

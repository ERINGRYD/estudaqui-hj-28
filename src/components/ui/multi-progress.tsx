import * as React from "react";
import { cn } from "@/lib/utils";

export interface MultiProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  timeValue: number; // 0-100
  topicValue: number; // 0-100
}

export const MultiProgress = React.forwardRef<HTMLDivElement, MultiProgressProps>(
  ({ className, timeValue, topicValue, ...props }, ref) => {
    const safeTime = Math.max(0, Math.min(100, timeValue ?? 0));
    const safeTopic = Math.max(0, Math.min(100, topicValue ?? 0));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={Math.round(safeTopic)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso unificado: preenchimento de tópicos e marcador de tempo (tomate)"
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        {...props}
      >
        {/* Preenchimento por tópicos */}
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${safeTopic}%` }}
        />

        {/* Marcador de tempo (tomate) */}
        <div
          className="absolute inset-y-0"
          style={{ left: `${safeTime}%` }}
          aria-hidden="true"
        >
          <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2">
            <div className="relative w-3 h-3 rounded-full bg-destructive shadow">
              {/* Cabinho/folhas */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-1 rounded-b-sm bg-primary" />
              {/* Brilho sutil */}
              <div className="absolute right-0.5 top-0.5 w-1 h-1 rounded-full bg-destructive-foreground/30" />
              {/* Anel leve para contraste */}
              <div className="absolute inset-0 rounded-full ring-1 ring-destructive/30" />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

MultiProgress.displayName = "MultiProgress";

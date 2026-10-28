import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/shared/form-message";
import { cn } from "@/lib/utils";

/**
 * Label + control + error, for react-hook-form fields.
 * Pass the control as children with `id` matching `htmlFor`.
 */
export function Field({ label, htmlFor, error, hint, required, className, children }) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      <FormMessage>{error}</FormMessage>
    </div>
  );
}

import { AlertTriangle } from 'lucide-react';

type PanelMessageProps = {
  message?: string;
};

export const PanelMessage = ({ message }: PanelMessageProps): React.JSX.Element | null => {
  if (!message) {
    return null;
  }

  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-muted/60 p-3 text-sm text-muted-foreground">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
};

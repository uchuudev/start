import { Badge } from '@/components/ui/badge';
import type { SectionStatus } from '@/types/dashboard';

type StatusPillProps = {
  status: SectionStatus;
  label?: string;
};

export const StatusPill = ({ status, label }: StatusPillProps): React.JSX.Element => {
  const variant = status === 'ready' ? 'ok' : status === 'missing-config' ? 'warn' : 'destructive';
  const text = label ?? (status === 'ready' ? 'live' : status === 'missing-config' ? 'setup' : 'error');

  return <Badge variant={variant}>{text}</Badge>;
};

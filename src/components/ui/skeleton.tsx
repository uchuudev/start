import { cn } from '@/lib/utils';

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

const Skeleton = ({ className, ...props }: SkeletonProps): React.JSX.Element => (
  <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />
);

export { Skeleton };

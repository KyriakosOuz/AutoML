
import React from 'react';
import { cn } from '@/lib/utils';
import { Table } from '@/components/ui/table';

interface ResponsiveTableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

const ResponsiveTable = React.forwardRef<HTMLTableElement, ResponsiveTableProps>(
  ({ className, children, ...props }, ref) => (
    <div className="w-full overflow-auto">
      <Table ref={ref} className={cn("min-w-full", className)} {...props}>
        {children}
      </Table>
    </div>
  )
);

ResponsiveTable.displayName = "ResponsiveTable";

export { ResponsiveTable };

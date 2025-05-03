
import React from 'react';
import { cn } from '@/lib/utils';
import { Table } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ResponsiveTableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  minWidth?: string;
}

const ResponsiveTable = React.forwardRef<HTMLTableElement, ResponsiveTableProps>(
  ({ className, children, minWidth = "650px", ...props }, ref) => (
    <div className="relative w-full overflow-hidden">
      <ScrollArea className="w-full" type="always">
        <div className={cn("min-w-full", minWidth && `min-w-[${minWidth}]`)}>
          <Table ref={ref} className={cn("min-w-full", className)} {...props}>
            {children}
          </Table>
        </div>
      </ScrollArea>
    </div>
  )
);

ResponsiveTable.displayName = "ResponsiveTable";

export { ResponsiveTable };

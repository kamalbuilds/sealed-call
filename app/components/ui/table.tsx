// Adapted from shadcn/ui Table (uicraft code shadcn/table, https://ui.shadcn.com/docs/components/table).
// Kept: the forwardRef primitives and the overflow wrapper. Changed: Tailwind tokens -> the .ledger
// classes in globals.css (uppercase muted head on a surface tier, hairline rows, hover row tint).
import * as React from "react";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(({ className, ...p }, ref) => (
  <div className="relative w-full overflow-x-auto">
    <table ref={ref} className={cx("ledger", className)} {...p} />
  </div>
));
Table.displayName = "Table";
export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>((p, ref) => <thead ref={ref} {...p} />);
TableHeader.displayName = "TableHeader";
export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>((p, ref) => <tbody ref={ref} {...p} />);
TableBody.displayName = "TableBody";
export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>((p, ref) => <tr ref={ref} {...p} />);
TableRow.displayName = "TableRow";
export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>((p, ref) => <th ref={ref} scope="col" {...p} />);
TableHead.displayName = "TableHead";
export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>((p, ref) => <td ref={ref} {...p} />);
TableCell.displayName = "TableCell";

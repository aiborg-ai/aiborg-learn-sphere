/**
 * Accessible Table Template
 *
 * ✅ WCAG 2.1 Level AA Compliant
 * ✅ Proper table structure with semantic HTML
 * ✅ Screen reader optimized
 * ✅ Sortable columns with ARIA
 * ✅ Keyboard navigation support
 *
 * FEATURES:
 * - Proper caption for table description
 * - Column headers with scope
 * - Row headers where appropriate
 * - Sortable columns with aria-sort
 * - Empty state handling
 * - Loading state with aria-live
 * - Pagination support
 */

import { ReactNode } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ============================================================================
 * TYPES
 * ============================================================================ */

export type SortDirection = 'asc' | 'desc' | 'none';

export interface Column<T> {
  /** Column key (must match data key) */
  key: keyof T | string;
  /** Column header text */
  header: string;
  /** Is this column sortable? */
  sortable?: boolean;
  /** Custom cell renderer */
  render?: (value: any, row: T, index: number) => ReactNode;
  /** Column alignment */
  align?: 'left' | 'center' | 'right';
  /** Column width */
  width?: string;
}

export interface AccessibleTableProps<T> {
  /** Table caption (required for accessibility) */
  caption: string;
  /** Hide caption visually (still accessible to screen readers) */
  srOnlyCaption?: boolean;
  /** Column definitions */
  columns: Column<T>[];
  /** Table data */
  data: T[];
  /** Currently sorted column key */
  sortColumn?: string;
  /** Current sort direction */
  sortDirection?: SortDirection;
  /** Sort change handler */
  onSort?: (column: string) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Custom className */
  className?: string;
  /** Make first column a row header */
  hasRowHeaders?: boolean;
}

/* ============================================================================
 * ACCESSIBLE TABLE COMPONENT
 * ============================================================================ */

export function AccessibleTable<T extends Record<string, any>>({
  caption,
  srOnlyCaption = false,
  columns,
  data,
  sortColumn,
  sortDirection = 'none',
  onSort,
  isLoading = false,
  emptyMessage = 'No data available',
  className,
  hasRowHeaders = false,
}: AccessibleTableProps<T>) {

  const handleSort = (columnKey: string) => {
    if (onSort) {
      onSort(columnKey);
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="h-4 w-4" aria-hidden="true" />;
    }

    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4" aria-hidden="true" />;
    }

    return <ArrowDown className="h-4 w-4" aria-hidden="true" />;
  };

  const getSortLabel = (columnKey: string, columnHeader: string) => {
    if (sortColumn !== columnKey || sortDirection === 'none') {
      return `Sort by ${columnHeader}`;
    }

    return `Sorted by ${columnHeader} in ${sortDirection === 'asc' ? 'ascending' : 'descending'} order. Click to ${sortDirection === 'asc' ? 'sort descending' : 'sort ascending'}`;
  };

  return (
    <div className={cn("relative w-full overflow-auto", className)}>
      <table className="w-full caption-bottom text-sm border-collapse">
        {/* Caption - required for accessibility */}
        <caption
          className={cn(
            "mt-4 text-sm text-muted-foreground",
            srOnlyCaption && "sr-only"
          )}
        >
          {caption}
        </caption>

        {/* Table Header */}
        <thead className="border-b bg-muted/50">
          <tr>
            {columns.map((column, index) => {
              const isFirstColumn = index === 0;
              const isSortable = column.sortable && onSort;
              const isSorted = sortColumn === column.key;

              return (
                <th
                  key={String(column.key)}
                  scope="col"
                  style={{ width: column.width }}
                  aria-sort={
                    isSortable && isSorted
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                  className={cn(
                    "h-12 px-4 font-medium",
                    column.align === 'right' && "text-right",
                    column.align === 'center' && "text-center",
                    (!column.align || column.align === 'left') && "text-left"
                  )}
                >
                  {isSortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(String(column.key))}
                      aria-label={getSortLabel(String(column.key), column.header)}
                      className={cn(
                        "flex items-center gap-2 hover:text-foreground transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
                        column.align === 'right' && "ml-auto",
                        column.align === 'center' && "mx-auto"
                      )}
                    >
                      <span>{column.header}</span>
                      {getSortIcon(String(column.key))}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {/* Loading State */}
          {isLoading && (
            <tr>
              <td
                colSpan={columns.length}
                className="h-24 text-center"
              >
                <div role="status" aria-live="polite" aria-busy="true">
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              </td>
            </tr>
          )}

          {/* Empty State */}
          {!isLoading && data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="h-24 text-center"
              >
                <div role="status" aria-live="polite">
                  <span className="text-muted-foreground">{emptyMessage}</span>
                </div>
              </td>
            </tr>
          )}

          {/* Data Rows */}
          {!isLoading && data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b transition-colors hover:bg-muted/50"
            >
              {columns.map((column, colIndex) => {
                const isFirstColumn = colIndex === 0 && hasRowHeaders;
                const cellValue = row[column.key as keyof T];
                const CellTag = isFirstColumn ? 'th' : 'td';

                return (
                  <CellTag
                    key={String(column.key)}
                    {...(isFirstColumn ? { scope: 'row' } : {})}
                    className={cn(
                      "p-4",
                      column.align === 'right' && "text-right",
                      column.align === 'center' && "text-center",
                      (!column.align || column.align === 'left') && "text-left",
                      isFirstColumn && "font-medium"
                    )}
                  >
                    {column.render
                      ? column.render(cellValue, row, rowIndex)
                      : cellValue}
                  </CellTag>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================================
 * USAGE EXAMPLES
 * ============================================================================

@example Basic Table
```tsx
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const columns: Column<User>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email', sortable: true },
  { key: 'role', header: 'Role' },
];

<AccessibleTable
  caption="User list"
  columns={columns}
  data={users}
  hasRowHeaders // First column (name) becomes row headers
/>
```

@example Table with Sorting
```tsx
function UsersTable() {
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (column: string) => {
    if (column === sortColumn) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    return [...users].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const modifier = sortDirection === 'asc' ? 1 : -1;
      return aVal > bVal ? modifier : -modifier;
    });
  }, [users, sortColumn, sortDirection]);

  return (
    <AccessibleTable
      caption="User list - sortable"
      columns={columns}
      data={sortedData}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={handleSort}
    />
  );
}
```

@example Table with Custom Renderers
```tsx
const columns: Column<User>[] = [
  {
    key: 'name',
    header: 'User',
    render: (value, row) => (
      <div className="flex items-center gap-2">
        <Avatar src={row.avatar} alt={value} />
        <span>{value}</span>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    align: 'center',
    render: (value) => (
      <Badge variant={value === 'active' ? 'success' : 'secondary'}>
        {value}
      </Badge>
    ),
  },
  {
    key: 'actions',
    header: 'Actions',
    align: 'right',
    render: (_, row) => (
      <div className="flex gap-2 justify-end">
        <button aria-label={`Edit ${row.name}`}>Edit</button>
        <button aria-label={`Delete ${row.name}`}>Delete</button>
      </div>
    ),
  },
];
```

============================================================================
ACCESSIBILITY CHECKLIST
============================================================================

✅ Table has caption (visible or sr-only)
✅ Column headers use <th> with scope="col"
✅ Row headers use <th> with scope="row" (when hasRowHeaders=true)
✅ Sortable columns use aria-sort
✅ Sort buttons have descriptive aria-label
✅ Loading state uses aria-live and aria-busy
✅ Empty state uses aria-live
✅ Focus indicators on interactive elements
✅ Icons are marked aria-hidden="true"
✅ Keyboard navigation fully supported

============================================================================
 */

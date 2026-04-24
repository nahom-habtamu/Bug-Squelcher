import { useState } from 'react';
import {
  makeStyles, tokens, Button, Text,
  Table, TableHeader, TableRow, TableHeaderCell,
  TableBody, TableCell, TableCellLayout,
} from '@fluentui/react-components';
import { EditRegular, DeleteRegular, ChevronLeftRegular, ChevronRightRegular } from '@fluentui/react-icons';
import type { Bug } from '../bug.types';
import { SEVERITY_LABEL, SEVERITY_COLOR } from '../bug.types';

const PAGE_SIZE = 10;

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'flex-end',
    marginTop: tokens.spacingVerticalS,
  },
  badge: {
    display: 'inline-block',
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorNeutralForegroundOnBrand,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
  },
});

interface ListViewProps {
  bugs: Bug[];
  onEdit: (bug: Bug) => void;
  onDelete: (id: string) => void;
}

export function ListView({ bugs, onEdit, onDelete }: ListViewProps) {
  const styles = useStyles();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(bugs.length / PAGE_SIZE));
  const paginated = bugs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className={styles.container}>
      <Table aria-label="Bug list">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Title</TableHeaderCell>
            <TableHeaderCell>Severity</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Created</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.map((bug) => (
            <TableRow key={bug.id}>
              <TableCell>
                <TableCellLayout>{bug.title}</TableCellLayout>
              </TableCell>
              <TableCell>
                {/* Inline style approved exception for dynamic severity color */}
                <span
                  className={styles.badge}
                  style={{ backgroundColor: SEVERITY_COLOR[bug.severity] }}
                >
                  {SEVERITY_LABEL[bug.severity]}
                </span>
              </TableCell>
              <TableCell>
                <TableCellLayout>{bug.status}</TableCellLayout>
              </TableCell>
              <TableCell>
                <TableCellLayout>
                  {new Date(bug.createdAt).toLocaleDateString()}
                </TableCellLayout>
              </TableCell>
              <TableCell>
                <div className={styles.actions}>
                  <Button
                    size="small"
                    icon={<EditRegular />}
                    appearance="subtle"
                    onClick={() => onEdit(bug)}
                    data-testid={`list-edit-bug-${bug.id}`}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    icon={<DeleteRegular />}
                    appearance="subtle"
                    onClick={() => onDelete(bug.id)}
                    data-testid={`list-delete-bug-${bug.id}`}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {paginated.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <TableCellLayout>
                  <Text>No bugs found.</Text>
                </TableCellLayout>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className={styles.pagination}>
        <Button
          size="small"
          icon={<ChevronLeftRegular />}
          appearance="subtle"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          data-testid="list-prev-page"
        />
        <Text>Page {page} of {totalPages}</Text>
        <Button
          size="small"
          icon={<ChevronRightRegular />}
          appearance="subtle"
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          data-testid="list-next-page"
        />
      </div>
    </div>
  );
}

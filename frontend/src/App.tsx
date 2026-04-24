import { useState } from 'react';
import {
  FluentProvider, webLightTheme, makeStyles, tokens,
  Button, Spinner, MessageBar, Text,
  Dialog, DialogSurface, DialogTitle, DialogBody, DialogContent, DialogActions,
  TabList, Tab,
} from '@fluentui/react-components';
import { QueryClientProvider } from '@tanstack/react-query';
import { AddRegular } from '@fluentui/react-icons';
import { queryClient } from './lib/queryClient';
import { useBugs } from './bugs/hooks/useBugs';
import { useDeleteBug } from './bugs/hooks/useDeleteBug';
import { KanbanBoard } from './bugs/components/KanbanBoard';
import { ListView } from './bugs/components/ListView';
import { BugFormModal } from './bugs/components/BugFormModal';
import type { Bug } from './bugs/bug.types';

const useStyles = makeStyles({
  root: {
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  header: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalXL}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  main: {
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalXL}`,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
  },
  centered: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: tokens.spacingVerticalXXL,
  },
});

type ViewMode = 'kanban' | 'list';

function AppContent() {
  const styles = useStyles();
  const [view, setView] = useState<ViewMode>('kanban');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBug, setSelectedBug] = useState<Bug | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Bug | null>(null);

  const { data: bugs = [], isLoading, isError } = useBugs();
  const deleteMutation = useDeleteBug();

  const handleNewBug = () => { setSelectedBug(undefined); setModalOpen(true); };
  const handleEdit = (bug: Bug) => { setSelectedBug(bug); setModalOpen(true); };
  const handleDelete = (id: string) => {
    const bug = bugs.find((b) => b.id === id);
    if (bug) setDeleteTarget(bug);
  };
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) });
  };

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Text size={600} weight="semibold">🐛 Bug Squelcher</Text>
        <Button
          appearance="primary"
          icon={<AddRegular />}
          onClick={handleNewBug}
          data-testid="new-bug-button"
        >
          Report Bug
        </Button>
      </header>

      <main className={styles.main}>
        <div className={styles.toolbar}>
          <TabList
            selectedValue={view}
            onTabSelect={(_, d) => setView(d.value as ViewMode)}
          >
            <Tab value="kanban" data-testid="view-toggle-kanban">Kanban</Tab>
            <Tab value="list" data-testid="view-toggle-list">List</Tab>
          </TabList>
        </div>

        {isLoading && (
          <div className={styles.centered}>
            <Spinner label="Loading bugs…" />
          </div>
        )}

        {isError && (
          <MessageBar intent="error">
            Failed to load bugs. Is the backend running?
          </MessageBar>
        )}

        {!isLoading && !isError && view === 'kanban' && (
          <KanbanBoard bugs={bugs} onEdit={handleEdit} onDelete={handleDelete} />
        )}

        {!isLoading && !isError && view === 'list' && (
          <ListView bugs={bugs} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      </main>

      <BugFormModal
        open={modalOpen}
        bug={selectedBug}
        onDismiss={() => setModalOpen(false)}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(_, d) => { if (!d.open) setDeleteTarget(null); }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Delete Bug?</DialogTitle>
            <DialogContent>
              <Text>
                Are you sure you want to delete{' '}
                <Text weight="semibold">"{deleteTarget?.title}"</Text>?
                This action cannot be undone.
              </Text>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setDeleteTarget(null)}
                data-testid="delete-confirm-cancel"
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                data-testid="delete-confirm-submit"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FluentProvider theme={webLightTheme}>
        <AppContent />
      </FluentProvider>
    </QueryClientProvider>
  );
}

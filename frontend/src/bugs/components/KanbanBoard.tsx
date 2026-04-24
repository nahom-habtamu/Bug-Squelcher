import { makeStyles, tokens } from '@fluentui/react-components';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import type { Bug, BugStatus } from '../bug.types';
import { STATUS_COLUMNS } from '../bug.types';
import { KanbanColumn } from './KanbanColumn';
import { useUpdateBug } from '../hooks/useUpdateBug';

const useStyles = makeStyles({
  board: {
    display: 'flex',
    gap: tokens.spacingHorizontalL,
    alignItems: 'flex-start',
    overflowX: 'auto',
    paddingBottom: tokens.spacingVerticalM,
  },
});

interface KanbanBoardProps {
  bugs: Bug[];
  onEdit: (bug: Bug) => void;
  onDelete: (id: string) => void;
}

export function KanbanBoard({ bugs, onEdit, onDelete }: KanbanBoardProps) {
  const styles = useStyles();
  const updateMutation = useUpdateBug();

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    if (result.destination.droppableId === result.source.droppableId) return;

    updateMutation.mutate({
      id: result.draggableId,
      data: { status: result.destination.droppableId as BugStatus },
    });
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className={styles.board}>
        {STATUS_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            bugs={bugs.filter((b) => b.status === status)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </DragDropContext>
  );
}

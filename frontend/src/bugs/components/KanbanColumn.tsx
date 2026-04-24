import { makeStyles, tokens, Text, Badge } from '@fluentui/react-components';
import { Droppable } from '@hello-pangea/dnd';
import type { Bug, BugStatus } from '../bug.types';
import { BugCard } from './BugCard';

const useStyles = makeStyles({
  column: {
    flex: '1 1 0',
    minWidth: '16rem',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
  },
  dropZone: {
    flexGrow: 1,
    minHeight: '4rem',
  },
});

interface KanbanColumnProps {
  status: BugStatus;
  bugs: Bug[];
  onEdit: (bug: Bug) => void;
  onDelete: (id: string) => void;
}

export function KanbanColumn({ status, bugs, onEdit, onDelete }: KanbanColumnProps) {
  const styles = useStyles();

  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <Text weight="semibold" size={400}>{status}</Text>
        <Badge appearance="filled" color="informative">{bugs.length}</Badge>
      </div>
      <Droppable droppableId={status}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={styles.dropZone}
          >
            {bugs.map((bug, index) => (
              <BugCard
                key={bug.id}
                bug={bug}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

import { makeStyles, tokens, Button, Text, Card, CardHeader } from '@fluentui/react-components';
import { EditRegular, DeleteRegular } from '@fluentui/react-icons';
import { Draggable } from '@hello-pangea/dnd';
import type { Bug } from '../bug.types';
import { SEVERITY_LABEL, SEVERITY_COLOR } from '../bug.types';

const useStyles = makeStyles({
  card: {
    marginBottom: tokens.spacingVerticalS,
    cursor: 'grab',
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXS,
  },
  badge: {
    display: 'inline-block',
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorNeutralForegroundOnBrand,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalXS,
  },
});

interface BugCardProps {
  bug: Bug;
  index: number;
  onEdit: (bug: Bug) => void;
  onDelete: (id: string) => void;
}

export function BugCard({ bug, index, onEdit, onDelete }: BugCardProps) {
  const styles = useStyles();

  return (
    <Draggable draggableId={bug.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <Card className={styles.card}>
            <CardHeader
              header={<Text weight="semibold">{bug.title}</Text>}
              description={
                // Inline style approved exception for dynamic severity color
                <span
                  className={styles.badge}
                  style={{ backgroundColor: SEVERITY_COLOR[bug.severity] }}
                >
                  {SEVERITY_LABEL[bug.severity]}
                </span>
              }
            />
            <div className={styles.actions}>
              <Button
                size="small"
                icon={<EditRegular />}
                appearance="subtle"
                onClick={() => onEdit(bug)}
                data-testid={`edit-bug-${bug.id}`}
              >
                Edit
              </Button>
              <Button
                size="small"
                icon={<DeleteRegular />}
                appearance="subtle"
                onClick={() => onDelete(bug.id)}
                data-testid={`delete-bug-${bug.id}`}
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Draggable>
  );
}

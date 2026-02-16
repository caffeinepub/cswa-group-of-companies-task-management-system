import { Type__2 } from '../backend';

/**
 * Canonical ordered list of task statuses for display and sorting.
 * Order: Pending < In Progress < Docs Pending < Hold < Completed
 */
export const TASK_STATUS_ORDER: Type__2[] = [
  Type__2.pending,
  Type__2.inProgress,
  Type__2.docsPending,
  Type__2.hold,
  Type__2.completed,
];

/**
 * Human-readable labels for task statuses
 */
export const TASK_STATUS_LABELS: Record<Type__2, string> = {
  pending: 'Pending',
  inProgress: 'In Progress',
  docsPending: 'Docs Pending',
  hold: 'Hold',
  completed: 'Completed',
};

/**
 * Get the display label for a task status
 */
export function getTaskStatusLabel(status: Type__2): string {
  return TASK_STATUS_LABELS[status];
}

/**
 * Get ordered status options for dropdowns
 */
export function getTaskStatusOptions(): Array<{ value: Type__2; label: string }> {
  return TASK_STATUS_ORDER.map(status => ({
    value: status,
    label: TASK_STATUS_LABELS[status],
  }));
}

/**
 * Compare two task statuses for sorting.
 * Returns a number suitable for Array.sort():
 * - negative if a < b
 * - positive if a > b
 * - 0 if equal
 * 
 * Unknown statuses sort after all known statuses in ascending order,
 * and before all known statuses in descending order.
 */
export function compareTaskStatus(a: Type__2, b: Type__2, direction: 'asc' | 'desc' = 'asc'): number {
  const indexA = TASK_STATUS_ORDER.indexOf(a);
  const indexB = TASK_STATUS_ORDER.indexOf(b);
  
  // Handle unknown statuses
  const unknownA = indexA === -1;
  const unknownB = indexB === -1;
  
  if (unknownA && unknownB) return 0;
  if (unknownA) return direction === 'asc' ? 1 : -1;
  if (unknownB) return direction === 'asc' ? -1 : 1;
  
  // Compare known statuses by their position in the order array
  const diff = indexA - indexB;
  return direction === 'asc' ? diff : -diff;
}

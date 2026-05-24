export type ButtonVariant = 'primary' | 'ghost' | 'muted';

export interface ActionButton {
  id: string;
  label: string;
  iconNode?: any; // Lucide component
  onClick: () => void | Promise<void>;
  variant?: ButtonVariant;
  disabled?: boolean;
}

export function getLeadingActions(
  actions: ActionButton[] | undefined,
  maxItems = 2
): ActionButton[] {
  return (actions ?? []).filter(Boolean).slice(0, maxItems);
}

export function getTrailingActions(
  actions: ActionButton[] | undefined,
  leadingCount = 2
): ActionButton[] {
  return (actions ?? []).filter(Boolean).slice(leadingCount);
}

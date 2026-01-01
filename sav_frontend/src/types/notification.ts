export type NotificationItem = {
  id: string;
  type?: string;
  recipient?: string;
  subject?: string;
  message?: string;
  createdAt?: string;
  read?: boolean;
  // Optionnel: lien direct fourni par le backend
  link?: string;
  // Optionnels: permettent de router côté front
  entityType?: string;
  entityId?: string | number;
};

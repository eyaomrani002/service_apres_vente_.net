export type NotificationItem = {
  id: string;
  type?: string;
  recipient?: string;
  subject?: string;
  message?: string;
  createdAt?: string;
  read?: boolean;
};

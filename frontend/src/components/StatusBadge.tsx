import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let badgeClass = 'badge-primary';

  switch (status) {
    case 'Active':
    case 'Confirmed':
    case 'In Stock':
      badgeClass = 'badge-success';
      break;
    case 'Lead':
    case 'Draft':
    case 'Low Stock':
      badgeClass = 'badge-warning';
      break;
    case 'Inactive':
    case 'Cancelled':
    case 'Out of Stock':
      badgeClass = 'badge-danger';
      break;
    default:
      badgeClass = 'badge-primary';
  }

  return <span className={`badge ${badgeClass}`}>{status}</span>;
};

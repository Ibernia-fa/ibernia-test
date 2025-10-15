// src/app/layouts/full/sidebar/settings-nav.config.ts
import { NavItem } from './nav-item/nav-item';

export const settingsNavItems: NavItem[] = [
  {
    displayName: 'Account Preferences',
    iconName: '/assets/images/shapes/account-preference-active.svg',
    iconOutline: '/assets/images/shapes/account.svg',
    route: '/settings/account-preferences',
  },
    {
    displayName: 'Notifications',
    iconName: '/assets/images/shapes/Notification-active.svg',
    iconOutline: '/assets/images/shapes/Notification.svg',
    route: '/settings/notifications',
  },
      {
    displayName: 'Help & Contact',
    iconName: '/assets/images/shapes/Help-active.svg',
    iconOutline: '/assets/images/shapes/Help.svg',
    route: '/settings/help',
  },
//   {
//     displayName: 'Plan & Billing',
//     iconName: '/assets/images/svgs/wallet-icon-filled.svg',
//     iconOutline: '/assets/images/svgs/wallet-icon.svg',
//     route: '/settings/plan-billing',
//   },
//   {
//     displayName: 'Security',
//     iconName: '/assets/images/svgs/lock-filled.svg',
//     iconOutline: '/assets/images/svgs/lock.svg',
//     route: '/settings/security',
//   },
//   {
//     displayName: 'Notifications',
//     iconName: '/assets/images/svgs/bell-filled.svg',
//     iconOutline: '/assets/images/svgs/bell.svg',
//     route: '/settings/notifications',
//   },

];

export const settingsLowerNavItems: NavItem[] = [
  {
    displayName: 'Branding',
    iconName: '/assets/images/shapes/branding-active.svg',
    iconOutline: '/assets/images/shapes/branding.svg',
    route: '/settings/branding',
  },
];

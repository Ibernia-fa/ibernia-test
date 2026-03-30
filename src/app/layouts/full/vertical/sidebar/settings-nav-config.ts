// src/app/layouts/full/sidebar/settings-nav.config.ts
import { NavItem } from './nav-item/nav-item';
import { environment } from 'src/environments/environment';

export const settingsNavItems: NavItem[] = [
  {
    displayName: 'Account Preferences',
    iconName: '/assets/images/shapes/user-account-preference-active.svg',
    iconOutline: '/assets/images/shapes/user-account-preference.svg',
    route: '/settings/account-preferences',
  },
  {
    displayName: 'Default Assumptions',
    iconName: '/assets/images/shapes/user-default-assumptions-active.svg',
    iconOutline: '/assets/images/shapes/user-default-assumptions.svg',
    route: '/settings/default-assumptions',
  },
  {
    displayName: 'Security',
    iconName: '/assets/images/shapes/user-securities-active.svg',
    iconOutline: '/assets/images/shapes/user-securities.svg',
    route: `${environment.authority}/Manage/ChangePassword`,
    external: true,
  },
  {
    displayName: 'Privacy & Data',
    iconName: '/assets/images/shapes/user-data-privacy-active.svg',
    iconOutline: '/assets/images/shapes/user-data-privacy.svg',
    route: '/settings/privacy-data',
  },
  {
    displayName: 'Plans & Billing',
    iconName: '/assets/images/shapes/user-plan-and-billing-active.svg',
    iconOutline: '/assets/images/shapes/user-plan-and-billing.svg',
    route: '/settings/plan-billing',
  },
  {
    displayName: 'Help & Contact',
    iconName: '/assets/images/shapes/user-help-circle-active.svg',
    iconOutline: '/assets/images/shapes/user-help-circle.svg',
    route: '/settings/help',
  },
  {
    displayName: 'Notifications',
    iconName: '/assets/images/shapes/user-bell-icon-active.svg',
    iconOutline: '/assets/images/shapes/user-bell-icon.svg',
    route: '/settings/notifications',
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
    displayName: 'AI Recommendations',
    iconName: '/assets/images/shapes/user-stars-icon-active.svg',
    iconOutline: '/assets/images/shapes/user-stars-icon.svg',
    route: '/settings/ai-reccomendations',
  },
  {
    displayName: 'Branding',
    iconName: '/assets/images/shapes/user-branding-icon-active.svg',
    iconOutline: '/assets/images/shapes/user-branding-icon.svg',
    route: '/settings/branding',
  },
  {
    displayName: 'Admin Notifications',
    iconName: '/assets/images/shapes/Notification-active.svg',
    iconOutline: '/assets/images/shapes/Notification.svg',
    route: '/settings/admin-notifications',
  },
  {
    displayName: 'Identity Admin',
    iconName: '/assets/images/shapes/user-identity-icon-active.svg',
    iconOutline: '/assets/images/shapes/user-identity-icon.svg',
    route: environment.adminUrl,
    external: true,
  },
];

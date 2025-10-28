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
    displayName: 'Plans & Billing',
    iconName: '/assets/images/shapes/plan-billing-active.svg',
    iconOutline: '/assets/images/shapes/plan-billing.svg',
    route: '/settings/plan-billing',
  },{
    displayName: 'Help & Contact',
    iconName: '/assets/images/shapes/help-active.svg',
    iconOutline: '/assets/images/shapes/help.svg',
    route: '/settings/help',
  },{
    displayName: 'Notifications',
    iconName: '/assets/images/shapes/Notification-active.svg',
    iconOutline: '/assets/images/shapes/Notification.svg',
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
    iconName: '/assets/images/shapes/ai-rec-act.png',
    iconOutline: '/assets/images/shapes/ai-rec.png',
    route: '/settings/ai-reccomendations',
  },  {
    displayName: 'Branding',
    iconName: '/assets/images/shapes/branding-active.svg',
    iconOutline: '/assets/images/shapes/branding.svg',
    route: '/settings/branding',
  },

];

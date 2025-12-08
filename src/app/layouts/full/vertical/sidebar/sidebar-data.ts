import { NavItem } from './nav-item/nav-item';

export const navItemslower: NavItem[] = [
  // {
  //   displayName: 'Goals',
  //   iconName: '/assets/images/svgs/goals-nav-icon.svg',
  //   iconOutline: '/assets/images/svgs/goals-nav-icon.svg',
  //   route: '#',
  // },
  {
    displayName: 'Risk & Insurance',
    iconName: '/assets/images/svgs/danger-square-icon-active.svg',
    iconOutline: '/assets/images/svgs/danger-square-icon-active.svg',
    route: '/cashflows/{cashflowId}/emergencies',
  },
  {
    displayName: 'AI Recommendations',
    iconName: '/assets/images/shapes/ai-filled.svg',
    iconOutline: '/assets/images/shapes/ai-filled.svg',
    route: '/cashflows/{cashflowId}/ai-recommendations',
  },
];
export const navItems: NavItem[] = [
  // {
  //   navCap: 'Home',
  // },
  {
    displayName: 'Goals & Events',
    // iconName: 'clock',
    iconName: '/assets/images/svgs/clock-icon-filled.svg',
    iconOutline: '/assets/images/svgs/clock-icon.svg',
    route: '/cashflows/{cashflowId}/timeline',
  },
  {
    displayName: 'Saving Pots',
    // iconName: 'folder',
    iconName: '/assets/images/svgs/file-icon-filled.svg',
    iconOutline: '/assets/images/svgs/file-icon.svg',
    route: '/cashflows/{cashflowId}/finances',
  },
  {
    displayName: 'Incomes & Expenses',
    // iconName: 'wallet',
    iconName: '/assets/images/svgs/ticket-icon-filled.svg',
    iconOutline: '/assets/images/svgs/ticket-icon.svg',
    route: '/cashflows/{cashflowId}/income',
  },
  {
    displayName: 'Contributions & Withdrawals',
    // iconName: 'circle-percentage',
    iconName: '/assets/images/svgs/discount-icon-filled.svg',
    iconOutline: '/assets/images/svgs/discount-icon.svg',
    route: '/cashflows/{cashflowId}/withdrawal',
  },
  // {
  //   displayName: 'Charges & Fees',
  //   // iconName: 'trending-up',
  //   iconName: '/assets/images/svgs/wallet-icon.svg',
  //   iconOutline: '/assets/images/svgs/wallet-icon.svg',
  //   route: '',
  // },
  {
    navCap: 'Lifetime Plan',
    displayName: 'Lifetime Plan',
    route: '/cashflows/{cashflowId}/reports'
  },
];

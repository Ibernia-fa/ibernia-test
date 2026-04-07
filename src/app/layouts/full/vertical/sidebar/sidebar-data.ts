import { NavItem } from './nav-item/nav-item';

/** Lower sidebar items excluding any marked `hidden`. */
export function visibleNavItemsLower(items: NavItem[]): NavItem[] {
  return items.filter((item) => !item.hidden);
}

export const navItemslower: NavItem[] = [
  // {
  //   displayName: 'Goals',
  //   iconName: '/assets/images/svgs/goals-nav-icon.svg',
  //   iconOutline: '/assets/images/svgs/goals-nav-icon.svg',
  //   route: '#',
  // },
  {
    displayName: 'Protection',
    iconName: '/assets/images/svgs/danger-square-icon-active.svg',
    iconOutline: '/assets/images/svgs/danger-square-icon-active.svg',
    route: '/cashflows/{cashflowId}/emergencies',
  },
  {
    displayName: 'Wealth',
    iconName: '/assets/images/svgs/money-square-blue.svg',
    iconOutline: '/assets/images/svgs/money-square-blue.svg',
    route: '/cashflows/{cashflowId}/wealth',
  },
  {
    displayName: 'School',
    iconName: '/assets/images/svgs/book-solid.svg',
    iconOutline: '/assets/images/svgs/book-solid.svg',
    route: '/cashflows/{cashflowId}/school',
    hidden: true,
  },
  {
    displayName: 'AI Chat',
    iconName: '/assets/images/shapes/ai-filled.svg',
    iconOutline: '/assets/images/shapes/ai-filled.svg',
    route: '/cashflows/{cashflowId}/agent-chat',
    hidden: true,
  },
];
export const navItems: NavItem[] = [
  {
    navCap: 'Lifetime Plan',
    displayName: 'Lifetime Plan',
    route: '/cashflows/{cashflowId}/reports',
  },
];

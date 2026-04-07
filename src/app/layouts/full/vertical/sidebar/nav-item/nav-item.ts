export interface NavItem {
  displayName?: string;
  /** Sidebar only: click does not navigate (module routes may still exist for direct URLs). */
  nonNavigable?: boolean;
  disabled?: boolean;
  external?: boolean;
  /** When true with external, open Identity Manage/ChangePassword with portal language (Security menu). */
  identitySecurityUrl?: boolean;
  twoLines?: boolean;
  chip?: boolean;
  iconName?: string;
  iconOutline?: string;
  navCap?: string;
  chipContent?: string;
  chipClass?: string;
  subtext?: string;
  route?: string;
  children?: NavItem[];
  ddType?: string;
}

export interface NavItem {
  displayName?: string;
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

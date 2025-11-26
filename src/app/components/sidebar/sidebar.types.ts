import {TemplateRef} from '@angular/core';

export interface SidebarTool {
  id: string;
  icon: string;
  label: string;
  tooltip?: string;
  position?: 'top' | 'bottom';
  contentTemplate?: TemplateRef<any>;
}

export interface SidebarConfig {
  width?: number;
  iconBarWidth?: number;
  animationDuration?: number;
}

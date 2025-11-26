import {Component, Input, Output, EventEmitter, signal, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatTooltipModule} from '@angular/material/tooltip';
import {trigger, transition, style, animate} from '@angular/animations';
import {SidebarTool, SidebarConfig} from './sidebar.types';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({width: 0, opacity: 0}),
        animate('{{duration}}ms ease-out', style({width: '{{width}}px', opacity: 1}))
      ], {params: {duration: 200, width: 300}}),
      transition(':leave', [
        animate('{{duration}}ms ease-in', style({width: 0, opacity: 0}))
      ], {params: {duration: 200}})
    ])
  ]
})
export class SidebarComponent {
  @Input() tools: SidebarTool[] = [];
  @Input() config: SidebarConfig = {
    width: 300,
    iconBarWidth: 48,
    animationDuration: 200
  };
  @Input() defaultOpenTool?: string;

  @Output() toolChanged = new EventEmitter<string | null>();

  selectedToolSignal = signal<string | null>(null);
  selectedTool = computed(() => this.selectedToolSignal());

  ngOnInit(): void {
    if (this.defaultOpenTool) {
      this.selectedToolSignal.set(this.defaultOpenTool);
    }
  }

  getTopTools(): SidebarTool[] {
    return this.tools.filter(tool => !tool.position || tool.position === 'top');
  }

  getBottomTools(): SidebarTool[] {
    return this.tools.filter(tool => tool.position === 'bottom');
  }

  toggleTool(toolId: string): void {
    const newValue = this.selectedToolSignal() === toolId ? null : toolId;
    this.selectedToolSignal.set(newValue);
    this.toolChanged.emit(newValue);
  }

  closeTool(): void {
    this.selectedToolSignal.set(null);
    this.toolChanged.emit(null);
  }

  getSelectedTool(): SidebarTool | undefined {
    const selectedId = this.selectedTool();
    return this.tools.find(tool => tool.id === selectedId);
  }

  getAnimationParams() {
    return {
      value: this.selectedTool(),
      params: {
        duration: this.config.animationDuration || 200,
        width: this.config.width || 300
      }
    };
  }
}

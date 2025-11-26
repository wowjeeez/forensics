import {Component, ViewChild, TemplateRef, AfterViewInit} from "@angular/core";
import {RouterOutlet} from "@angular/router";
import {invoke} from "@tauri-apps/api/core";
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatListModule} from '@angular/material/list';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {CommonModule} from '@angular/common';
import {SidebarComponent, SidebarTool, SidebarConfig} from './components/sidebar';

@Component({
  selector: "app-root",
  imports: [
    RouterOutlet,
    CommonModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    SidebarComponent
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent implements AfterViewInit {
  @ViewChild('projectContent') projectContentTemplate!: TemplateRef<any>;
  @ViewChild('timelineContent') timelineContentTemplate!: TemplateRef<any>;
  @ViewChild('evidenceContent') evidenceContentTemplate!: TemplateRef<any>;
  @ViewChild('analysisContent') analysisContentTemplate!: TemplateRef<any>;
  @ViewChild('searchContent') searchContentTemplate!: TemplateRef<any>;

  greetingMessage = "";

  sidebarTools: SidebarTool[] = [];

  sidebarConfig: SidebarConfig = {
    width: 300,
    iconBarWidth: 48,
    animationDuration: 200
  };

  ngAfterViewInit(): void {
    this.sidebarTools = [
      {
        id: 'project',
        icon: 'folder',
        label: 'Project',
        tooltip: 'Project Explorer',
        position: 'top',
        contentTemplate: this.projectContentTemplate
      },
      {
        id: 'timeline',
        icon: 'timeline',
        label: 'Timeline',
        tooltip: 'Event Timeline',
        position: 'top',
        contentTemplate: this.timelineContentTemplate
      },
      {
        id: 'evidence',
        icon: 'description',
        label: 'Evidence',
        tooltip: 'Evidence Files',
        position: 'top',
        contentTemplate: this.evidenceContentTemplate
      },
      {
        id: 'analysis',
        icon: 'analytics',
        label: 'Analysis',
        tooltip: 'Analysis Tools',
        position: 'top',
        contentTemplate: this.analysisContentTemplate
      },
      {
        id: 'search',
        icon: 'search',
        label: 'Search',
        tooltip: 'Search Everything',
        position: 'bottom',
        contentTemplate: this.searchContentTemplate
      }
    ];
  }

  onToolChanged(toolId: string | null): void {
    console.log('Tool changed:', toolId);
  }

  greet(event: SubmitEvent, name: string): void {
    event.preventDefault();

    invoke<string>("greet", { name }).then((text) => {
      this.greetingMessage = text;
    });
  }
}

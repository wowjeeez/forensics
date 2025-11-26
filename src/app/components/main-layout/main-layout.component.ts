import {AfterViewInit, Component, signal, TemplateRef, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatTabsModule} from '@angular/material/tabs';
import {MatTooltipModule} from '@angular/material/tooltip';
import {Dialog} from '@angular/cdk/dialog';
import {Subject} from 'rxjs';
import {SidebarComponent, SidebarConfig, SidebarTool} from '../sidebar';
import {SplitPaneComponent} from '../split-pane/split-pane.component';
import {FileTreeNode, Tab} from '../../models/layout.models';
import {
    DirectoryScanDialogComponent,
    DirectoryScanDialogData
} from '../../dialogs/directory-scan-dialog/directory-scan-dialog.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatTooltipModule,
    SidebarComponent,
    SplitPaneComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements AfterViewInit {
  @ViewChild('projectContent') projectContentTemplate!: TemplateRef<any>;
  @ViewChild('timelineContent') timelineContentTemplate!: TemplateRef<any>;
  @ViewChild('evidenceContent') evidenceContentTemplate!: TemplateRef<any>;
  @ViewChild('searchContent') searchContentTemplate!: TemplateRef<any>;
  @ViewChild('groupsContent') groupsContentTemplate!: TemplateRef<any>;

  tabs = signal<Tab[]>([
    {
      id: 'welcome',
      title: 'Welcome',
      icon: 'home',
      viewerType: 'welcome',
      isActive: true
    }
  ]);

  selectedTabIndex = signal(0);
  showSidebar = signal(true);
  sidebarWidth = signal(300);

  sidebarTools: SidebarTool[] = [];

  sidebarConfig: SidebarConfig = {
    width: 300,
    iconBarWidth: 48,
    animationDuration: 200
  };

  constructor(private dialog: Dialog) {}

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
        id: 'groups',
        icon: 'workspaces',
        label: 'Groups',
        tooltip: 'Manage Groups',
        position: 'top',
        contentTemplate: this.groupsContentTemplate
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

  addTab(tab: Tab) {
    const newTabs = [...this.tabs()];
    newTabs.forEach(t => t.isActive = false);
    tab.isActive = true;
    newTabs.push(tab);
    this.tabs.set(newTabs);
    this.selectedTabIndex.set(newTabs.length - 1);
  }

  closeTab(tabId: string) {
    const currentTabs = this.tabs();
    const tabIndex = currentTabs.findIndex(t => t.id === tabId);

    if (currentTabs.length === 1) return; // Keep at least one tab

    const newTabs = currentTabs.filter(t => t.id !== tabId);
    this.tabs.set(newTabs);

    // Adjust selected index
    if (tabIndex <= this.selectedTabIndex()) {
      this.selectedTabIndex.set(Math.max(0, this.selectedTabIndex() - 1));
    }
  }

  onTabChange(index: number) {
    const newTabs = this.tabs().map((t, i) => ({
      ...t,
      isActive: i === index
    }));
    this.tabs.set(newTabs);
    this.selectedTabIndex.set(index);
  }

  toggleSidebar() {
    this.showSidebar.set(!this.showSidebar());
  }

  onToolChanged(toolId: string | null) {
    console.log('Tool changed:', toolId);
  }

  openFolder() {
    // Create a Subject for streaming file tree data
    const fileStream$ = new Subject<FileTreeNode>();

    // Open the dialog with the stream
    const dialogRef = this.dialog.open(DirectoryScanDialogComponent, {
      width: '80vw',
      maxHeight: '90vh',
      data: {
        fileStream$
      } as DirectoryScanDialogData,
      panelClass: 'forensic-dialog',
      disableClose: true
    });

    // Simulate streaming data from backend (replace with Tauri invoke)
    setTimeout(() => {
      const mockTree: FileTreeNode = {
        id: '1',
        name: 'project',
        path: '/Users/test/project',
        isDirectory: true,
        children: [
          {
            id: '2',
            name: 'src',
            path: '/Users/test/project/src',
            isDirectory: true,
            children: [
              {
                id: '3',
                name: 'components',
                path: '/Users/test/project/src/components',
                isDirectory: true,
                children: []
              },
              {
                id: '4',
                name: 'services',
                path: '/Users/test/project/src/services',
                isDirectory: true,
                children: []
              }
            ]
          },
          {
            id: '5',
            name: 'node_modules',
            path: '/Users/test/project/node_modules',
            isDirectory: true,
            children: []
          },
          {
            id: '6',
            name: 'dist',
            path: '/Users/test/project/dist',
            isDirectory: true,
            children: []
          }
        ]
      };

      fileStream$.next(mockTree);
      fileStream$.complete();
    }, 1500); // Simulate 1.5s scan time

    dialogRef.closed.subscribe(result => {

    });
  }

  startSearch() {
    console.log('Start search');
  }
}

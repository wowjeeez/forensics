import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {FileTreeNode} from '../../models/layout.models';

@Component({
  selector: 'app-directory-tree-node',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div *ngIf="node.isDirectory" [class.excluded]="isExcluded">
      <div class="tree-node" [style.padding-left.px]="depth * 16 + 8">
        <div class="node-content" (click)="toggleExpanded()">
          <button mat-icon-button class="expand-button">
            <mat-icon>{{ expanded ? 'expand_more' : 'chevron_right' }}</mat-icon>
          </button>

          <mat-icon class="folder-icon">folder</mat-icon>

          <span class="node-name">{{ node.name }}</span>

          <span class="file-count">{{ fileCount }} files</span>
        </div>

        <button
          mat-button
          (click)="onToggle(); $event.stopPropagation()"
          [class]="isExcluded ? 'exclude-button excluded' : 'exclude-button included'">
          {{ isExcluded ? 'Excluded' : 'Included' }}
        </button>
      </div>

      <div *ngIf="expanded && node.children" class="children">
        <app-directory-tree-node
          *ngFor="let child of directoryChildren"
          [node]="child"
          [excludedPaths]="excludedPaths"
          (togglePath)="togglePath.emit($event)"
          [depth]="depth + 1">
        </app-directory-tree-node>
      </div>
    </div>
  `,
  styles: [`
    .tree-node {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: #313335;
      }
    }

    .excluded {
      opacity: 0.5;
    }

    .node-content {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      cursor: pointer;
    }

    .expand-button {
      width: 28px !important;
      height: 28px !important;
      padding: 0 !important;
      color: #bbbbbb;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &:hover {
        background-color: #3c3f41;
      }
    }

    .folder-icon {
      color: #4b6eaf;
      font-size: 16px;
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .node-name {
      color: #e0e0e0;
      font-size: 14px;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-count {
      color: #787878;
      font-size: 12px;
      white-space: nowrap;
    }

    .exclude-button {
      font-size: 12px;
      padding: 4px 8px !important;
      min-width: 80px !important;
      height: 28px !important;
      border-radius: 4px;
      transition: all 0.2s;

      &.included {
        background-color: rgba(76, 175, 80, 0.2);
        color: #4caf50;

        &:hover {
          background-color: rgba(76, 175, 80, 0.3);
        }
      }

      &.excluded {
        background-color: rgba(244, 67, 54, 0.2);
        color: #f44336;

        &:hover {
          background-color: rgba(244, 67, 54, 0.3);
        }
      }
    }

    .children {
      margin-left: 0;
    }
  `]
})
export class DirectoryTreeNodeComponent {
  @Input() node!: FileTreeNode;
  @Input() excludedPaths!: Set<string>;
  @Input() depth = 0;
  @Output() togglePath = new EventEmitter<string>();

  expanded = this.depth < 2; // Auto-expand first 2 levels

  get isExcluded(): boolean {
    return this.excludedPaths.has(this.node.path);
  }

  get fileCount(): number {
    return this.countFiles(this.node);
  }

  get directoryChildren(): FileTreeNode[] {
    return this.node.children?.filter(child => child.isDirectory) || [];
  }

  toggleExpanded() {
    this.expanded = !this.expanded;
  }

  onToggle() {
    this.togglePath.emit(this.node.path);
  }

  private countFiles(node: FileTreeNode): number {
    if (!node.isDirectory) return 1;
    if (!node.children) return 0;
    return node.children.reduce((acc, child) => acc + this.countFiles(child), 0);
  }

}

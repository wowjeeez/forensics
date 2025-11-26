import {Component, HostListener, Inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {DIALOG_DATA, DialogModule, DialogRef} from '@angular/cdk/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {Subject, takeUntil} from 'rxjs';
import {FileTreeNode} from '../../models/layout.models';
import {DirectoryTreeNodeComponent} from './directory-tree-node.component';
import {MatTab, MatTabGroup} from "@angular/material/tabs";
import {MatCheckbox} from "@angular/material/checkbox";
import {MatFormField, MatInput, MatLabel} from "@angular/material/input";

export interface DirectoryScanDialogData {
  fileStream$?: Subject<FileTreeNode>;
}

export interface DirectoryScanDialogResult {
  confirmed: boolean;
  excludedPaths: Set<string>;
}

@Component({
  selector: 'app-directory-scan-dialog',
  standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DialogModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        DirectoryTreeNodeComponent,
        MatTabGroup,
        MatTab,
        MatCheckbox,
        MatLabel,
        MatInput,
        MatFormField
    ],
  templateUrl: './directory-scan-dialog.component.html',
  styleUrls: ['./directory-scan-dialog.component.scss']
})
export class DirectoryScanDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  scanning = true;
  scannedTree: FileTreeNode | null = null;
  excludedPaths = new Set<string>();
  patternExcludedPaths = new Set<string>();
  excludedEntries: string[] = [];
  currentExclusion = '';

  totalFiles = 0;
  excludedCount = 0;

  constructor(
    public dialogRef: DialogRef<DirectoryScanDialogResult>,
    @Inject(DIALOG_DATA) public data: DirectoryScanDialogData
  ) {}


    public preventDefault(event: KeyboardEvent) {
      event.preventDefault();
      event.stopPropagation()
    }
  ngOnInit() {
    if (this.data.fileStream$) {
      this.data.fileStream$
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (node) => {
            this.scannedTree = node;
            this.totalFiles = this.countFiles(node);
            this.scanning = false;
          },
          error: (err) => {
            console.error('Error scanning directory:', err);
            this.scanning = false;
          },
          complete: () => {
            this.scanning = false;
          }
        });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    // Disable Enter and Escape keyboard shortcuts for dialog
    if (event.key === 'Escape' || event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  togglePath(path: string) {
    if (this.excludedPaths.has(path)) {
      this.excludedPaths.delete(path);
    } else {
      this.excludedPaths.add(path);
    }
    this.updateExcludedCount();
  }

  addNewExclusion() {
    if (this.currentExclusion.trim().length === 0) return;
    this.excludedEntries.push(this.currentExclusion.trim());
    this.currentExclusion = '';
  }

  removeExclusion(text: string) {
    this.excludedEntries = this.excludedEntries.filter(ex => ex !== text);
  }

  clearAllExclusions() {
    this.excludedEntries = [];
    this.currentExclusion = '';
  }

  calculateGlobbedExclusions() {
    const allExcluded = new Set(this.excludedPaths);

    // Remove previous pattern exclusions
    this.patternExcludedPaths.forEach(excluded => allExcluded.delete(excluded));

    // Get all paths from tree
    const allPaths = this.scannedTree ? this.flattenPaths(this.scannedTree) : [];

    // Apply each pattern
    const newPatternExclusions = new Set<string>();
    this.excludedEntries.forEach(pattern => {
      allPaths.forEach(path => {
        if (this.matchPattern(path, pattern)) {
          allExcluded.add(path);
          newPatternExclusions.add(path);
        }
      });
    });

    this.patternExcludedPaths = newPatternExclusions;
    this.excludedPaths = allExcluded;
    this.updateExcludedCount();
  }

  private matchPattern(path: string, pattern: string): boolean {
    // Enhanced glob matching
    const normalizedPath = path.toLowerCase();
    const normalizedPattern = pattern.toLowerCase();

    // Support wildcards and common patterns
    if (pattern.includes('*')) {
      const regex = normalizedPattern
        .replace(/\./g, '\\.')
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '.');
      return new RegExp(`^${regex}$`).test(normalizedPath);
    }

    // Simple contains match for patterns without wildcards
    return normalizedPath.includes(normalizedPattern);
  }

  private flattenPaths(node: FileTreeNode): string[] {
    const paths: string[] = [node.path];
    if (node.children) {
      node.children.forEach(child => {
        paths.push(...this.flattenPaths(child));
      });
    }
    return paths;
  }

  private updateExcludedCount() {
    this.excludedCount = Array.from(this.excludedPaths).reduce((acc, path) => {
      const node = this.findNodeByPath(this.scannedTree, path);
      return acc + (node ? this.countFiles(node) : 0);
    }, 0);
  }

  private findNodeByPath(node: FileTreeNode | null, path: string): FileTreeNode | null {
    if (!node) return null;
    if (node.path === path) return node;
    if (!node.children) return null;

    for (const child of node.children) {
      const found = this.findNodeByPath(child, path);
      if (found) return found;
    }
    return null;
  }

  countFiles(node: FileTreeNode): number {
    if (!node.isDirectory) return 1;
    if (!node.children) return 0;
    return node.children.reduce((acc, child) => acc + this.countFiles(child), 0);
  }

  onConfirm() {
    this.dialogRef.close({
      confirmed: true,
      excludedPaths: this.excludedPaths
    } as DirectoryScanDialogResult);
  }

  onCancel() {
    this.dialogRef.close({
      confirmed: false,
      excludedPaths: new Set<string>()
    } as DirectoryScanDialogResult);
  }
    public setScanSetting(key: string, value: any) {

    }
}

import {Component, Input, Output, EventEmitter, HostListener} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PaneOrientation, SplitPaneConfig} from '../../models/layout.models';

@Component({
  selector: 'app-split-pane',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './split-pane.component.html',
  styleUrls: ['./split-pane.component.scss']
})
export class SplitPaneComponent {
  @Input() orientation: PaneOrientation = 'vertical';
  @Input() initialSize: number = 50; // percentage
  @Input() minSize: number = 100; // pixels
  @Output() sizeChanged = new EventEmitter<number>();

  isDragging = false;
  currentSize = this.initialSize;

  ngOnInit() {
    this.currentSize = this.initialSize;
  }

  onDragStart(event: MouseEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  @HostListener('document:mousemove', ['$event'])
  onDragMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const container = (event.target as HTMLElement).closest('.split-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();

    if (this.orientation === 'vertical') {
      const newSize = ((event.clientX - rect.left) / rect.width) * 100;
      this.currentSize = Math.max(10, Math.min(90, newSize));
    } else {
      const newSize = ((event.clientY - rect.top) / rect.height) * 100;
      this.currentSize = Math.max(10, Math.min(90, newSize));
    }

    this.sizeChanged.emit(this.currentSize);
  }

  @HostListener('document:mouseup')
  onDragEnd() {
    this.isDragging = false;
  }
}

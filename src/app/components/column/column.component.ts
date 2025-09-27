import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Column, Card } from '../../models/board.model';
import { CardComponent } from '../card/card.component';
import {
  CdkDropList,
  CdkDrag,
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-column',
  standalone: true,
  imports: [CommonModule, CardComponent, CdkDropList, CdkDrag],
  templateUrl: './column.component.html',
  styleUrls: ['./column.component.css'],
})
export class ColumnComponent {
  @Input({ required: true }) column!: Column;
  /** IDs de todas las listas con las que se conecta esta columna (ej: ['col-1','col-2',...]) */
  @Input() connectedDropLists: string[] = [];
  /** Emite cuando cambia el orden o la columna de una card */
  @Output() cardsChanged = new EventEmitter<void>();

  drop(event: CdkDragDrop<Card[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    this.cardsChanged.emit();
  }

  trackById = (_: number, c: Card) => c.id;
}



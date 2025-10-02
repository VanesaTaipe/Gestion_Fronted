// src/app/components/board/board.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColumnComponent } from '../column/column.component';
import { HeaderComponent } from '../header/header.component';
import { BoardService } from '../../services/board.service';
import { Board, Column } from '../../models/board.model';
import { CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { from } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, ColumnComponent, HeaderComponent, CdkDropList, CdkDrag, ReactiveFormsModule],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css'],
})
export class BoardComponent {
  board?: Board;
  dropListIds: string[] = [];
  private snapshotCols: Column[] = [];

  // ===== modal para crear columna =====
  colModalOpen = false;
  colForm!: FormGroup;
  colorPalette = [
    'bg-teal-200','bg-blue-200','bg-amber-200','bg-lime-200','bg-rose-200',
    'bg-cyan-200','bg-purple-200','bg-orange-200','bg-emerald-200','bg-pink-200'
  ];

  constructor(private boardService: BoardService, private fb: FormBuilder) {
    this.colForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(120)]],
      color: [this.colorPalette[0], Validators.required],
    });
  }

  ngOnInit() {
    this.boardService.getBoard(1).subscribe({
      next: (data) => {
        this.board = data;
        this.board.columns
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .forEach((c, i) => (c.order = i + 1));
        this.dropListIds = this.board.columns.map(c => 'col-' + c.id);
      },
      error: (e) => {
        console.error('No se pudo cargar el tablero:', e);
      }
    });
  }

  private defaultBoard(): Board {
    return {
      id: 1,
      name: 'Nombre de Tablero',
      columns: [
        { id: 1, title: 'Backlog',       color: 'bg-teal-200',   cards: [], order: 1 },
        { id: 2, title: 'Por Hacer',     color: 'bg-blue-200',   cards: [], order: 2 },
        { id: 3, title: 'En Desarrollo', color: 'bg-yellow-200', cards: [], order: 3 },
        { id: 4, title: 'Hecho',         color: 'bg-green-200',  cards: [], order: 4 },
      ]
    };
  }

  // ===== DnD columnas =====
  dropColumn(event: CdkDragDrop<Column[]>) {
    if (!this.board?.columns) return;

    this.snapshotCols = this.board.columns.map(c => ({ ...c })); // rollback snapshot

    const arr = [...event.container.data];
    moveItemInArray(arr, event.previousIndex, event.currentIndex);

    arr.forEach((c, i) => (c.order = i + 1));
    this.board.columns = arr; // optimistic UI

    from(arr)
      .pipe(concatMap(c => this.boardService.updateColumnPosition(c.id, c.order!)))
      .subscribe({
        next: () => {},
        error: () => { this.board!.columns = this.snapshotCols; } // rollback
      });
  }

  trackByColId = (_: number, c: Column) => c.id;

  persistReorder() {
    // hook opcional para futuras persistencias
  }

  // ===== modal: nueva columna =====
  openAddColumn() {
    this.colForm.reset({ nombre: '', color: this.colorPalette[0] });
    this.colModalOpen = true;
  }
  closeAddColumn() { this.colModalOpen = false; }

  // crear columna
  submitAddColumn() {
    if (!this.board) return;
    if (this.colForm.invalid) { this.colForm.markAllAsTouched(); return; }

    const nombre = (this.colForm.value.nombre as string).trim();
    const color  = this.colForm.value.color as string;
    const nextPos = (this.board.columns?.length ?? 0) + 1;

    this.boardService.createColumn(this.board.id, nombre, nextPos).subscribe({
      next: (newCol) => {
        // aplicar color elegido (solo visual)
        newCol.color = color;
        this.board!.columns.push(newCol);
        this.dropListIds = this.board!.columns.map(x => 'col-' + x.id);
        this.closeAddColumn();
      },
      error: (e) => {
        alert(e?.error?.error ?? 'No se pudo crear la columna');
      }
    });
  }

  // ===== eliminar columna =====
  onDeleteColumn(col: Column) {
    if (!this.board) return;
    if (!confirm(`¿Eliminar la columna "${col.title}"?`)) return;

    this.boardService.deleteColumn(col.id).subscribe({
      next: () => {
        this.board!.columns = this.board!.columns
          .filter(c => c.id !== col.id)
          .map((c, i) => ({ ...c, order: i + 1 }));
        this.dropListIds = this.board!.columns.map(x => 'col-' + x.id);

        from(this.board!.columns)
          .pipe(concatMap(c => this.boardService.updateColumnPosition(c.id, c.order!)))
          .subscribe();
      },
      error: (e) => alert(e?.error?.error ?? 'No se pudo eliminar la columna')
    });
  }
}

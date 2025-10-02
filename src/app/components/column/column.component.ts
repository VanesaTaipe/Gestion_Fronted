import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Column, Card } from '../../models/board.model';
import { CardComponent } from '../card/card.component';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-column',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardComponent, CdkDropList, CdkDrag],
  templateUrl: './column.component.html',
  styleUrls: ['./column.component.css'],
})
export class ColumnComponent {
  @Input({ required: true }) column!: Column;
  @Input() proyectoId!: number | string;
  @Input() connectedDropLists: string[] = [];
  @Output() cardsChanged = new EventEmitter<Card[]>();

  showModal = false;
  form!: FormGroup;
  creating = false;

  constructor(private fb: FormBuilder, private taskSvc: TaskService) {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(120)]],
      descripcion: [''],
      assignee: [''],            // solo visual (nombre)
      assigneeId: [null],        // <-- id numérico real
      fecha_vencimiento: [''],   // yyyy-MM-dd
    });
  }

  AbrirTarea() {
    this.form.reset({
      titulo: '',
      descripcion: '',
      assignee: '',
      assigneeId: null,
      fecha_vencimiento: '',
    });
    this.showModal = true;
  }

  cerrarTarea() { this.showModal = false; }

  crearTareaBD() {
    if (this.creating) return;

    const v = this.form.value;
    const titulo = (v.titulo ?? '').trim();
    if (!this.proyectoId || !titulo) {
      this.form.get('titulo')?.setErrors({ required: true });
      this.form.markAllAsTouched();
      return;
    }

    this.creating = true;

    const dueISO = v.fecha_vencimiento
      ? new Date(v.fecha_vencimiento as string).toISOString()
      : undefined;

    this.taskSvc.createCard({
      id_proyecto: this.proyectoId,
      id_columna : this.column.id,
      title      : titulo,
      descripcion: (v.descripcion ?? '').trim(),
      due_at     : dueISO,
      id_asignado: v.assigneeId ? Number(v.assigneeId) : undefined,
    })
    .subscribe({
      next: (created) => {
        // Decoración visual
        created.asignado_a = (v.assignee ?? '') as string;
        if (!created.fecha_vencimiento) created.fecha_vencimiento = dueISO;

        // Empuja en esta columna (la designada)
        this.column.cards.push(created);
        this.cardsChanged.emit(this.column.cards);

        this.creating = false;
        this.cerrarTarea();
      },
      error: (e) => {
        console.error('Error creando tarea:', e);
        this.creating = false;
        alert(`No se pudo crear la tarea (HTTP ${e?.status ?? 0})`);
      },
    });
  }

  drop(event: CdkDragDrop<Card[]>) {
    const mismaLista = event.previousContainer === event.container;

    if (mismaLista) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      const items = event.container.data.map((c, i) => ({ id: c.id, position: i + 1 }));
      this.taskSvc.reorderCard(this.column.id, items).subscribe({
        next: () => this.cardsChanged.emit(this.column.cards),
        error: (e) => console.error('No se pudo reordenar', e),
      });
    } else {
      const previo = event.previousContainer.data;
      const actual = event.container.data;

      transferArrayItem(previo, actual, event.previousIndex, event.currentIndex);

      const movido = actual[event.currentIndex];
      const posicionNueva = event.currentIndex + 1;
      const columnaDestino = this.column.id;

      this.taskSvc.moveCard(movido.id, columnaDestino, posicionNueva).subscribe({
        next: () => {
          const actualItems = actual.map((c, i) => ({ id: c.id, position: i + 1 }));
          this.taskSvc.reorderCard(columnaDestino, actualItems).subscribe();

          const prevItems = previo.map((c, i) => ({ id: c.id, position: i + 1 }));
          if (prevItems.length) {
            const prevColIdAttr = (event.previousContainer.id || '').replace('col-', '');
            const prevColId = Number(prevColIdAttr) || prevColIdAttr || this.column.id;
            this.taskSvc.reorderCard(prevColId, prevItems).subscribe();
          }

          this.cardsChanged.emit(this.column.cards);
        },
        error: (e) => {
          console.error('No se pudo mover:', e);
          transferArrayItem(actual, previo, event.currentIndex, event.previousIndex);
        },
      });
    }
  }

  trackById = (_: number, c: Card) => c.id;
}

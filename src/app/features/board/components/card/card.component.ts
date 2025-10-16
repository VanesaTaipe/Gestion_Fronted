import { CommonModule } from '@angular/common';
import { Card,TareaResumen,ColumnaResumen } from '../../models/board.model';
import { Subscription } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { Column } from '../../models/board.model';
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { ColumnComponent } from '../column/column.component';
@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: `./card.component.html`,
  styles: [`
    .line-clamp-1 {
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class CardComponent {
  @Input() card!: Card;
   @Input() proyectoId!: number; 
  totalComentarios:number=0;

  private subscription?: Subscription;
  @Output() cardClicked = new EventEmitter<Card>();
  @Output() deleteCard = new EventEmitter<Card>();
  constructor(private taskSvc: TaskService) {}
  formatDateShort(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const monthShort = months[date.getMonth()];
      return `${day} ${monthShort}`;
    } catch {
      return dateStr;
    }
  }
  ngOnInit() {
    this.loadTotalComentarios();
  }
  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }


  getUserInitial(): string {
    const name = this.card.asignado_a || 'U';
    return name.charAt(0).toUpperCase();
  }

  getDescriptionPreview(): string {
    if (!this.card.descripcion) return '';
    const plainText = this.card.descripcion
      .replace(/[#*_\[\]]/g, '')
      .replace(/- \[[ x]\]/g, '')
      .split('\n')
      .filter(line => line.trim().length > 0)[0] || '';
    
    return plainText.length > 60 ? plainText.substring(0, 60) + '...' : plainText;
  }
  getCommentCount(): number {
    return this.card.comentarios?.length || 0;
  }
  onCardClick(event: Event) {
    event.stopPropagation();
    this.cardClicked.emit(this.card);
  }
  onDelete(event: Event) {
    event.stopPropagation();
    if (confirm(`¿Eliminar la tarjeta "${this.card.title}"?`)) {
      this.deleteCard.emit(this.card);
    }
  }
loadTotalComentarios() {
  if (!this.proyectoId) {
    console.warn('No se ha definido proyectoId para cargar comentarios');
    return;
  }

  this.taskSvc.getResumenTareas(this.proyectoId).subscribe(
    (resumen: ColumnaResumen[]) => {
      let total = 0;
      resumen.forEach((columna) => {
        columna.tareas.forEach((tarea) => {
          total += tarea.comentarios_count;
        });
      });
      this.totalComentarios = total;
    },
    error => {
      console.error('Error cargando resumen de tareas:', error);
    }
  );
}



}
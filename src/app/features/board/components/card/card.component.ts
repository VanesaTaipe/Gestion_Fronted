import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card, CartaPrioridad, Comentario } from '../../models/board.model';
import { TaskService } from '../../services/task.service';
@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent implements OnInit, OnChanges {
  @Input() card!: Card;
  @Input() proyectoId!: number;
  @Output() cardClicked = new EventEmitter<Card>();
  @Output() deleteCard = new EventEmitter<Card>();
  @Input() isLeader: boolean = false;

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    if (this.card?.id) {
      this.loadComments();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['card'] && !changes['card'].firstChange) {
      this.loadComments();
    }
  }

  loadComments() {
    if (!this.card?.id) return;

    this.taskService.getComments(this.card.id).subscribe({
      next: (comentarios: any[]) => {
        console.log(`Comentarios cargados para tarjeta ${this.card.id}:`, comentarios);
                this.card.comentarios = comentarios.map((c: any) => ({
          id: c.id_comentario || c.id,
          id_comentario: c.id_comentario || c.id,
          id_usuario: c.id_usuario,
          usuario: c.nombre_usuario || c.usuario || 'Usuario',
          nombre_usuario: c.nombre_usuario || c.usuario,
          contenido: c.contenido,
          texto: c.contenido,
          fecha: c.created_at || c.fecha,
          created_at: c.created_at || c.fecha,
          minutos_desde_creacion: c.minutos_desde_creacion,
          status: c.status || '0'
        }));

        this.card.comentarios_count = this.getActiveComments().length;
        
        console.log(`Total comentarios activos: ${this.card.comentarios_count}`);
      },
      error: (e) => {
        console.error(`Error cargando comentarios para tarjeta ${this.card.id}:`, e);
        this.card.comentarios = [];
        this.card.comentarios_count = 0;
      }
    });
  }

  getActiveComments(): Comentario[] {
    return (this.card.comentarios || []).filter(c => c.status !== '1');
  }
  getCommentCount(): number {
    return this.getActiveComments().length;
  }

  onCardClick(event: Event): void {
    event.stopPropagation();
    this.cardClicked.emit(this.card);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    if (!this.isLeader) {
      alert('Solo los líderes pueden eliminar tarjetas');
      return;
    }
    // Eliminar directamente sin confirmación
    this.deleteCard.emit(this.card);
  }
   getFormattedDate(): string {
    if (!this.card.due_at && !this.card.fecha_vencimiento) {
      return '';
    }

    const dateStr = this.card.due_at || this.card.fecha_vencimiento;

    try {
      if (!dateStr) return '';
      const formatted = dateStr.split('T')[0];
      return formatted;
    } catch (e) {
      console.error(' Error formateando fecha:', e);
      return '';
    }
  }
  formatDateShort(dateStr: string): string {    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${day} ${months[date.getMonth()]}`;
    } catch {
      return dateStr;
    }
  }

  getUserInitial(): string {
    const name = this.card.asignado_a || 'U';
    return name.charAt(0).toUpperCase();
  }
  

  hasDescription(): boolean {
    return !!this.card.descripcion?.trim();
  }

  hasAttachments(): boolean {
    return !!(this.card.archivos?.length);
  }

  hasActiveComments(): boolean {
    return this.getCommentCount() > 0;
  }

  isNearCommentLimit(): boolean {
    return this.getCommentCount() >= 8;
  }

  isAtCommentLimit(): boolean {
    return this.getCommentCount() >= 10;
  }

  getPriorityClass(): string {
    const priorities: Record<CartaPrioridad, string> = {
      'alta': 'bg-red-500 text-white',
      'media': 'bg-orange-400 text-white',
      'baja': 'bg-yellow-400 text-gray-800',
      'No asignada': 'bg-gray-400 text-white'
    };
    return priorities[this.card.prioridad || 'No asignada'];
  }

  getPriorityLabel(): string {
    if (!this.card.prioridad || this.card.prioridad === 'No asignada') {
      return 'No asignada';
    }
    return this.card.prioridad.charAt(0).toUpperCase() + this.card.prioridad.slice(1);
  }
 
  
}
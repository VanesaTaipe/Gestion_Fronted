import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '../../models/board.model';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent {
  @Input({ required: true }) card!: Card;

  @Output() open   = new EventEmitter<Card>();
  @Output() edit   = new EventEmitter<Card>();
  @Output() remove = new EventEmitter<Card>();

  showDetail = false

  get firstLine(): string {
    const line = (this.card.descripcion || '').split('\n')[0] || '';
    return line.length > 120 ? line.slice(0, 120) + '…' : line;
  }


  get descPreview(): string {
    const raw = (this.card?.descripcion || '').split('\n')[0].trim();
    if (!raw) return '';
    return raw.length > 120 ? raw.slice(0, 120) + '…' : raw;
  }


  // Abrir modal de detalle
  openDetail() {
    this.showDetail = true;
    this.open.emit(this.card);
  }

  // Cerrar modal de detalle
  closeDetail(ev?: MouseEvent) {
    ev?.stopPropagation();
    this.showDetail = false;
  }

  // Click en el ícono editar (el lapiz xd)
  onEdit(ev: MouseEvent) {
    ev.stopPropagation();
    this.edit.emit(this.card);
  }

  // Click en ícono eliminar (el tachito xd)
  onRemove(ev: MouseEvent) {
    ev.stopPropagation();
    this.remove.emit(this.card);
  }

  // Clases utilitarias para badge de prioridad
  priorityClass(): string {
    switch (this.card?.prioridad) {
      case 'alta':  return 'badge badge-red';
      case 'baja':  return 'badge badge-green';
      case 'media':
      default:      return 'badge badge-yellow';
    }
  }


  // badge css por prioridad
  get prioClass(): string {
    switch (this.card.prioridad) {
      case 'alta':  return 'bg-red-100 text-red-700';
      case 'baja':  return 'bg-emerald-100 text-emerald-700';
      default:      return 'bg-amber-100 text-amber-700'; // media
    }
  }

}

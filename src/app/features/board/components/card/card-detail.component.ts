import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { Card } from '../../models/board.model';
import { BoardService } from '../../services/board.service';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-card-detail-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MarkdownModule],
  styleUrls: ['./card-detail.component.css'],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" 
         (click)="onBackdropClick($event)">
      <div class="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex relative"
           (click)="$event.stopPropagation()">
        
        <!-- Botón cerrar -->
        <button (click)="close()" 
                class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 bg-white rounded-full p-1">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <!-- Panel Izquierdo: Contenido Principal -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Header con título -->
          <div class="p-6 pb-4">
            <input 
              *ngIf="editingTitle; else titleDisplay"
              [(ngModel)]="card.title"
              (blur)="saveTitle()"
              (keyup.enter)="saveTitle()"
              class="text-xl font-bold w-full border-b-2 border-cyan-500 outline-none"
              autofocus />
            <ng-template #titleDisplay>
              <h2 class="text-xl font-bold text-gray-900 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded -ml-2"
                  (click)="editingTitle = true">
                {{ card.title }}
              </h2>
            </ng-template>
          </div>

          <!-- Contenido con scroll -->
          <div class="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
            
            <!-- Descripción -->
            <div>
              <div *ngIf="!editingDescription" 
                   class="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                   (click)="toggleDescriptionEdit()">
                <p class="text-sm text-gray-700 leading-relaxed">
                  {{ card.descripcion || 'Haz clic para agregar descripción' }}
                </p>
              </div>

              <div *ngIf="editingDescription" class="space-y-2">
                <textarea
                  [(ngModel)]="card.descripcion"
                  (blur)="saveDescription()"
                  class="w-full min-h-[120px] p-3 border rounded-lg text-sm resize-y focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Escribe la descripción de la tarea..."></textarea>
              </div>
            </div>

            <!-- Checklist Section -->
            <div *ngIf="card.descripcion && hasChecklist()">
              <h3 class="text-base font-semibold text-gray-900 mb-3">Checklist</h3>
              <div class="space-y-2 bg-white">
                <div *ngFor="let item of getChecklistItems(); let i = index" 
                     class="flex items-start gap-2 py-1">
                  <input 
                    type="checkbox" 
                    [checked]="item.checked"
                    (change)="toggleChecklistItem(i)"
                    class="mt-1 w-4 h-4 text-cyan-500 border-gray-300 rounded focus:ring-cyan-500">
                  <label 
                    [class.line-through]="item.checked"
                    [class.text-gray-400]="item.checked"
                    class="text-sm text-gray-700 flex-1">
                    {{ item.text }}
                  </label>
                </div>
              </div>
            </div>

            <!-- Sección de Comentarios -->
            <div>
              <h3 class="text-base font-semibold text-gray-900 mb-4">Comentarios</h3>

              <!-- Input para agregar comentario -->
              <form [formGroup]="commentForm" (ngSubmit)="addComment()" class="mb-4">
                <textarea
                  formControlName="texto"
                  class="w-full p-3 border rounded-lg resize-none text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  rows="2"
                  placeholder="Escribir un comentario..."></textarea>
              </form>

              <!-- Lista de comentarios -->
              <div class="space-y-4">
                <div *ngFor="let comment of card.comentarios" 
                     class="flex gap-3">
                  <div class="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {{ getCommentInitial(comment.usuario) }}
                  </div>
                  <div class="flex-1">
                    <div class="flex items-baseline gap-2 mb-1">
                      <p class="font-semibold text-sm text-gray-900">{{ comment.usuario || 'Usuario' }}</p>
                      <p class="text-xs text-gray-500">{{ formatCommentTime(comment.created_at || comment.fecha) }}</p>
                    </div>
                    <p class="text-sm text-gray-700">{{ comment.texto }}</p>
                  </div>
                </div>

                <p *ngIf="!card.comentarios || card.comentarios.length === 0" 
                   class="text-gray-400 text-center text-sm py-6">
                  No hay comentarios aún
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel Derecho: Información y acciones -->
        <div class="w-72 bg-gray-50 border-l flex flex-col overflow-y-auto">
          <div class="p-5 space-y-4">
            
            <!-- Prioridad -->
            <div>
              <label class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Prioridad</label>
              <select 
                [(ngModel)]="card.prioridad"
                (change)="saveCard()"
                class="w-full px-3 py-2.5 border rounded-lg text-sm font-semibold cursor-pointer"
                [ngClass]="{
                  'text-red-700 bg-red-50 border-red-300': card.prioridad === 'alta',
                  'text-orange-700 bg-orange-50 border-orange-300': card.prioridad === 'media',
                  'text-yellow-700 bg-yellow-50 border-yellow-300': card.prioridad === 'baja',
                  'text-gray-700 bg-white border-gray-300': card.prioridad === 'No asignada'
                }">
                <option value="No asignada">No asignada</option>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <!-- Fecha límite -->
            <div>
              <label class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Fecha límite</label>
              <input 
                type="date"
                [(ngModel)]="card.fecha_vencimiento"
                (change)="saveCard()"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
              <p *ngIf="card.fecha_vencimiento" class="text-xs text-gray-500 mt-1.5">
                {{ formatFullDate(card.fecha_vencimiento) }}
              </p>
            </div>

            <!-- Asignado -->
            <div>
              <label class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Asignado</label>
              <div class="flex items-center gap-3 p-2.5 border border-gray-300 rounded-lg bg-white">
                <div class="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {{ getUserInitial() }}
                </div>
                <input 
                  [(ngModel)]="card.asignado_a"
                  (blur)="saveCard()"
                  class="flex-1 text-sm outline-none bg-transparent font-medium"
                  placeholder="Sin asignar">
              </div>
            </div>

            <!-- Adjuntos -->
            <div>
              <label class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Adjuntos</label>
              <div class="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white">
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                  </svg>
                  <span class="text-sm font-medium text-gray-700">{{ card.images?.length || 0 }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Botones de acción al final -->
          <div class="mt-auto p-5 space-y-2.5 border-t bg-gray-50">
            <button 
              class="w-full px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              Duplicar
            </button>
            
            <button 
              (click)="deleteCard()"
              class="w-full px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CardDetailModalComponent implements OnInit {
  @Input() card!: Card;
  @Input() columnName: string = '';
  @Output() closeModal = new EventEmitter<void>();
  @Output() cardUpdated = new EventEmitter<Card>();
  @Output() cardDeleted = new EventEmitter<number>();

  editingTitle = false;
  editingDescription = false;
  commentForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private boardService: BoardService
  ) {
    this.commentForm = this.fb.group({
      texto: ['', Validators.required]
    });
  }

  ngOnInit() {
    if (!this.card.comentarios) {
      this.card.comentarios = [];
    }
  }

  close() {
    this.closeModal.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  toggleDescriptionEdit() {
    this.editingDescription = !this.editingDescription;
  }

  saveTitle() {
    this.editingTitle = false;
    this.saveCard();
  }

  saveDescription() {
    this.editingDescription = false;
    this.saveCard();
  }

  saveCard() {
    this.cardUpdated.emit(this.card);
  }

  hasChecklist(): boolean {
    return this.card.descripcion?.includes('- [ ]') || this.card.descripcion?.includes('- [x]') || false;
  }

  getChecklistItems(): Array<{text: string, checked: boolean}> {
    if (!this.card.descripcion) return [];
    
    const lines = this.card.descripcion.split('\n');
    const items: Array<{text: string, checked: boolean}> = [];
    
    lines.forEach(line => {
      if (line.includes('- [ ]')) {
        items.push({ text: line.replace('- [ ]', '').trim(), checked: false });
      } else if (line.includes('- [x]')) {
        items.push({ text: line.replace('- [x]', '').trim(), checked: true });
      }
    });
    
    return items;
  }

  toggleChecklistItem(index: number) {
    const items = this.getChecklistItems();
    items[index].checked = !items[index].checked;
    
    // Reconstruir descripción
    let newDescription = '';
    const lines = this.card.descripcion!.split('\n');
    let checklistIndex = 0;
    
    lines.forEach(line => {
      if (line.includes('- [ ]') || line.includes('- [x]')) {
        const item = items[checklistIndex];
        newDescription += `- [${item.checked ? 'x' : ' '}] ${item.text}\n`;
        checklistIndex++;
      } else {
        newDescription += line + '\n';
      }
    });
    
    this.card.descripcion = newDescription.trim();
    this.saveCard();
  }

  addComment() {
    if (this.commentForm.valid) {
      const newComment: any = {
        id: Date.now(),
        texto: this.commentForm.value.texto,
        usuario: this.card.asignado_a || 'Usuario Actual',
        created_at: new Date().toISOString(),
        fecha: new Date().toISOString()
      };
      
      this.card.comentarios = [...(this.card.comentarios || []), newComment];
      this.commentForm.reset();
      this.saveCard();
    }
  }

  deleteCard() {
    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
      this.cardDeleted.emit(this.card.id);
      this.close();
    }
  }

  getUserInitial(): string {
    const name = this.card.asignado_a || 'U';
    return name.charAt(0).toUpperCase();
  }

  getCommentInitial(usuario?: string): string {
    if (!usuario) return 'U';
    return usuario.charAt(0).toUpperCase();
  }

  formatCommentTime(date?: string): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'hace menos de 1 hora';
    if (diffInHours === 1) return 'hace 1 hora';
    if (diffInHours < 24) return `hace ${diffInHours} horas`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'hace 1 día';
    return `hace ${diffInDays} días`;
  }

  formatFullDate(date?: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  }

  openImage(url: string) {
    window.open(url, '_blank');
  }
}
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { Card, Comentario } from '../../models/board.model';
import { BoardService } from '../../services/board.service';
import { TaskService } from '../../services/task.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { UserService as AuthService } from '../../../../core/auth/services/use.service';

@Component({
  selector: 'app-card-detail-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  styleUrls: ['./card-detail.component.css'],
  template: `
   <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" 
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
              <h3 class="text-base font-semibold text-gray-900 mb-3">Descripción</h3>
              <div *ngIf="!editingDescription" 
                   class="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors min-h-[60px]"
                   (click)="toggleDescriptionEdit()">
                <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {{ card.descripcion || 'Haz clic para agregar descripción' }}
                </p>
              </div>

              <div *ngIf="editingDescription" class="space-y-2">
                <textarea
                  [(ngModel)]="card.descripcion"
                  class="w-full min-h-[120px] p-3 border rounded-lg text-sm resize-y focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Escribe la descripción de la tarea..."></textarea>
                <div class="flex gap-2 justify-end">
                  <button
                    (click)="cancelDescriptionEdit()"
                    class="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg">
                    Cancelar
                  </button>
                  <button
                    (click)="saveDescription()"
                    class="px-3 py-1.5 text-sm bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg">
                    Guardar
                  </button>
                </div>
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
                <div class="flex gap-2">
                  <textarea
                    formControlName="contenido"
                    class="flex-1 p-3 border rounded-lg resize-none text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    rows="2"
                    placeholder="Escribir un comentario..."></textarea>
                  <button
                    type="submit"
                    [disabled]="commentForm.invalid || isSubmittingComment"
                    class="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed h-fit">
                    {{ isSubmittingComment ? 'Enviando...' : 'Enviar' }}
                  </button>
                </div>
              </form>

              <!-- Lista de comentarios -->
              <div class="space-y-4">
                <div *ngFor="let comment of card.comentarios" 
                     class="flex gap-3">
                  <div class="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {{ getCommentInitial(comment.usuario || comment.nombre_usuario) }}
                  </div>
                  <div class="flex-1">
                    <div class="flex items-baseline gap-2 mb-1">
                      <p class="font-semibold text-sm text-gray-900">
                        {{ comment.usuario || comment.nombre_usuario || 'Usuario' }}
                      </p>
                      <p class="text-xs text-gray-500">
                        {{ formatCommentTime(comment.created_at || comment.fecha) }}
                      </p>
                    </div>
                    <p class="text-sm text-gray-700">
                      {{ comment.contenido || comment.texto }}
                    </p>
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
        <div class="w-80 bg-gray-50 border-l flex flex-col overflow-y-auto">
          <div class="p-5 space-y-4">
            
            <!-- Prioridad -->
            <div>
              <label class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Prioridad</label>
              <select 
                [(ngModel)]="card.prioridad"
                (change)="saveCard()"
                class="w-full px-3 py-2.5 border rounded-lg text-sm font-semibold cursor-pointer transition-colors"
                [ngClass]="{
                  'text-red-700 bg-red-100 border-red-300 hover:bg-red-200': card.prioridad === 'alta',
                  'text-orange-700 bg-orange-100 border-orange-300 hover:bg-orange-200': card.prioridad === 'media',
                  'text-yellow-700 bg-yellow-100 border-yellow-300 hover:bg-yellow-200': card.prioridad === 'baja',
                  'text-gray-700 bg-gray-100 border-gray-300 hover:bg-gray-200': card.prioridad === 'No asignada'
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
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500">
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
                <span class="flex-1 text-sm font-medium text-gray-700">
                  {{ card.asignado_a || 'Sin asignar' }}
                </span>
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
              
              <!-- Preview de imágenes si existen -->
              <div *ngIf="card.images && card.images.length > 0" class="mt-2 grid grid-cols-3 gap-2">
                <div *ngFor="let img of card.images" 
                     class="relative group cursor-pointer"
                     (click)="openImage(img)">
                  <img [src]="img" 
                       alt="Adjunto" 
                       class="w-full h-20 object-cover rounded-lg border hover:opacity-75 transition">
                </div>
              </div>
            </div>
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
  originalDescription = '';
  commentForm: FormGroup;
  isSubmittingComment = false;
  private api = environment.apiBase;

  constructor(
    private fb: FormBuilder,
    private boardService: BoardService,
    private taskService: TaskService,
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.commentForm = this.fb.group({
      contenido: ['', Validators.required]
    });
  }

  ngOnInit() {
    if (!this.card.comentarios) {
      this.card.comentarios = [];
    }
    this.loadComments();
  }

  loadComments() {
    this.taskService.getComments(this.card.id).subscribe({
      next: (comentarios: any[]) => {
        console.log('Comentarios cargados:', comentarios);
        
        this.card.comentarios = comentarios.map((c: any) => ({
          id: c.id_comentario || c.id,
          id_comentario: c.id_comentario || c.id,
          id_usuario: c.id_usuario,
          usuario: c.nombre_usuario || c.usuario || 'Usuario',
          nombre_usuario: c.nombre_usuario || c.usuario,
          contenido: c.contenido,
          texto: c.contenido, // Alias para compatibilidad
          fecha: c.created_at || c.fecha,
          created_at: c.created_at || c.fecha,
          minutos_desde_creacion: c.minutos_desde_creacion
        }));
      },
      error: (e) => {
        console.error('❌ Error cargando comentarios:', e);
        this.card.comentarios = [];
      }
    });
  }

  addComment() {
    if (this.commentForm.invalid || this.isSubmittingComment) {
      return;
    }

    // Obtener el ID del usuario actual
    const currentUserId = this.authService.getCurrentUserId();
    
    if (!currentUserId) {
      alert('Error: Usuario no autenticado');
      return;
    }

    this.isSubmittingComment = true;
    const contenido = this.commentForm.value.contenido.trim();
    
    const comentarioData = {
      id_tarea: this.card.id,
      id_usuario: currentUserId,
      contenido: contenido
    };
    
    console.log('Enviando comentario:', comentarioData);

    this.taskService.addComment(comentarioData).subscribe({
      next: (res) => {
        console.log('Comentario agregado:', res);
        
        // Recargar los comentarios para obtener el comentario completo con el nombre del usuario
        this.loadComments();
        
        // Limpiar el formulario
        this.commentForm.reset();
        this.isSubmittingComment = false;
      },
      error: (e) => {
        console.error('Error agregando comentario:', e);
        console.error('Detalles del error:', e.error);
        
        let errorMsg = 'No se pudo agregar el comentario';
        
        if (e.error?.error) {
          errorMsg = e.error.error;
        } else if (e.status === 400) {
          errorMsg = 'Datos inválidos. Verifica el contenido del comentario.';
        } else if (e.status === 401) {
          errorMsg = 'No estás autenticado. Por favor, inicia sesión nuevamente.';
        }
        
        alert(errorMsg);
        this.isSubmittingComment = false;
      }
    });
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
    this.originalDescription = this.card.descripcion || '';
    this.editingDescription = true;
  }

  cancelDescriptionEdit() {
    this.card.descripcion = this.originalDescription;
    this.editingDescription = false;
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
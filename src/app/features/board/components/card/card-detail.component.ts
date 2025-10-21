import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { Card, Comentario, ArchivoAdjunto } from '../../models/board.model';
import { BoardService } from '../../services/board.service';
import { TaskService } from '../../services/task.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { UserService as AuthService } from '../../../../core/auth/services/use.service';
import { User } from '../../../profile/models/user.interface';
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
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-semibold text-gray-900">
                  Comentarios ({{ getActiveComments().length }}/10)
                </h3>
                <span *ngIf="getActiveComments().length >= 10" class="text-xs text-red-600 font-medium">
                  Límite alcanzado
                </span>
              </div>

              <!-- Input para agregar comentario -->
              <form [formGroup]="commentForm" (ngSubmit)="addComment()" class="mb-4">
                <div class="flex gap-2">
                  <textarea
                    formControlName="contenido"
                    class="flex-1 p-3 border rounded-lg resize-none text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    rows="2"
                    [placeholder]="getActiveComments().length >= 10 ? 'Límite de comentarios alcanzado' : 'Escribir un comentario...'"
                    [disabled]="getActiveComments().length >= 10"></textarea>
                  <button
                    type="submit"
                    [disabled]="commentForm.invalid || isSubmittingComment || getActiveComments().length >= 10"
                    class="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed h-fit">
                    {{ isSubmittingComment ? 'Enviando...' : 'Enviar' }}
                  </button>
                </div>
              </form>

              <!-- Lista de comentarios -->
              <div class="space-y-4">
                <div *ngFor="let comment of getActiveComments()" 
                     class="flex gap-3 group relative bg-white hover:bg-gray-50 p-3 rounded-lg transition-colors">
                  
                  <!-- Avatar -->
                  <div class="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {{ getCommentInitial(comment.usuario || comment.nombre_usuario) }}
                  </div>
                  
                  <!-- Contenido del comentario -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-baseline gap-2 mb-1">
                      <p class="font-semibold text-sm text-gray-900">
                        {{ comment.usuario || comment.nombre_usuario || 'Usuario' }}
                      </p>
                      <p class="text-xs text-gray-500">
                        {{ formatCommentTime(comment.created_at || comment.fecha) }}
                      </p>
                    </div>
                    <p class="text-sm text-gray-700 break-words">
                      {{ comment.contenido || comment.texto }}
                    </p>
                  </div>

                  <!-- Botón eliminar comentario -->
                  <button
                    *ngIf="canDeleteComment(comment)"
                    (click)="deleteComment(comment)"
                    class="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                    [title]="isLeader ? 'Eliminar comentario (líder)' : 'Eliminar mi comentario'">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>

                <p *ngIf="getActiveComments().length === 0" 
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
                
                <!-- Mostrar usuario actual o botón para cambiar -->
                <div *ngIf="!editingAssignee" 
                    class="flex items-center gap-3 p-2.5 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-cyan-400 transition-colors"
                    (click)="startEditingAssignee()">
                  <div class="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {{ getUserInitial() }}
                  </div>
                  <span class="flex-1 text-sm font-medium text-gray-700">
                    {{ card.asignado_a || 'Sin asignar' }}
                  </span>
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>

                <!-- Selector de usuario -->
                <div *ngIf="editingAssignee" class="relative">
                  <div class="flex items-center gap-2 p-2 border-2 border-cyan-500 rounded-lg bg-white shadow-lg">
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    <input 
                      type="text"
                      [(ngModel)]="searchUserTerm"
                      (input)="onSearchUser()"
                      class="flex-1 outline-none text-sm"
                      placeholder="Buscar miembro..."
                      autofocus>
                    <button 
                      type="button"
                      (click)="cancelEditingAssignee()"
                      class="p-1 text-gray-400 hover:text-gray-600">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>

                  <!-- Dropdown con resultados -->
                  <div class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                    <!-- Opción: Sin asignar -->
                    <div (click)="assignUser(null)"
                        class="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b">
                      <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </div>
                      <span class="text-sm text-gray-600">Sin asignar</span>
                    </div>

                    <!-- Loading -->
                    <div *ngIf="loadingUsers" class="flex items-center justify-center py-6">
                      <svg class="animate-spin h-5 w-5 text-cyan-500" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                    </div>

                    <!-- Lista de miembros del proyecto -->
                    <div *ngFor="let member of filteredProjectMembers"
                        (click)="assignUser(member)"
                        class="flex items-center gap-3 px-3 py-2.5 hover:bg-cyan-50 cursor-pointer transition-colors"
                        [class.bg-cyan-100]="card.id_asignado === member.id_usuario">
                      <div class="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {{ getMemberInitial(member) }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">
                          {{ member.nombre || member.username || member.email }}
                        </p>
                        <p class="text-xs text-gray-500 truncate">{{ member.email }}</p>
                      </div>
                      <svg *ngIf="card.id_asignado === member.id_usuario" 
                          class="w-5 h-5 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                    </div>

                    <!-- Sin resultados -->
                    <div *ngIf="!loadingUsers && filteredProjectMembers.length === 0"
                        class="py-8 text-center">
                      <svg class="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
                      <p class="text-sm text-gray-500">No se encontraron miembros</p>
                    </div>
                  </div>
                </div>

              <!-- Adjuntos -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label class="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Adjuntos ({{ getActiveFiles().length }}/3)
                    </label>
                    <span *ngIf="getActiveFiles().length >= 3" class="text-xs text-red-600 font-medium">
                      Límite alcanzado
                    </span>
                  </div>

                  <!-- Botón agregar archivo - Solo si < 3 archivos -->
                  <div class="mb-3" *ngIf="getActiveFiles().length < 3">
                    <label class="w-full cursor-pointer">
                      <div class="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                        <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        <span class="text-sm font-medium text-gray-700">Agregar archivo</span>
                      </div>
                      <input 
                        type="file"
                        (change)="onFileSelected($event)"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                        class="hidden">
                    </label>
                  </div>
                  
                  <!-- Lista de archivos -->
                  <div *ngIf="getActiveFiles().length > 0" class="space-y-2">
                    <div *ngFor="let archivo of getActiveFiles()" 
                        class="group relative bg-white border border-gray-200 rounded-lg p-3 hover:border-cyan-300 transition-all">
                      
                      <div class="flex items-center gap-3">
                          <!-- Imagen -->
                          <img *ngIf="isImageFile(archivo)" 
                              [src]="archivo.archivo_ruta" 
                              [alt]="archivo.archivo_nombre"
                              class="w-full h-full object-cover cursor-pointer hover:opacity-75 transition"
                              (click)="openFile(archivo.archivo_ruta)"
                              (error)="$event.target.style.display='none'">
                          
                          <!-- Icono de archivo -->
                          <div *ngIf="!isImageFile(archivo)" 
                              class="w-full h-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition"
                              (click)="openFile(archivo.archivo_ruta)">
                            <svg class="w-7 h-7 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                            </svg>
                        </div>

                        <!-- Info del archivo -->
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-semibold text-gray-900 truncate cursor-pointer hover:text-cyan-600 transition"
                            (click)="openFile(archivo.archivo_ruta)"
                            [title]="archivo.archivo_nombre">
                            {{ archivo.archivo_nombre }}
                          </p>
                        </div>

                        <!-- Botón eliminar -->
                        <button
                          (click)="deleteFile(archivo)"
                          class="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Eliminar archivo">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Mensaje cuando no hay archivos -->
                  <div *ngIf="getActiveFiles().length === 0" 
                      class="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <svg class="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                    <p class="text-sm text-gray-400 font-medium">No hay archivos adjuntos</p>
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
  @Input() isLeader: boolean = false;
  @Input() currentUserId!: number;
  @Input() proyectoId!: number; 
  @Output() closeModal = new EventEmitter<void>();
  @Output() cardUpdated = new EventEmitter<Card>();
  @Output() cardDeleted = new EventEmitter<number>();

  editingTitle = false;
  editingDescription = false;
  originalDescription = '';
  commentForm: FormGroup;
  isSubmittingComment = false;
  searchUserTerm = '';
  editingAssignee = false;

  projectMembers: any[] = [];
  filteredProjectMembers: any[] = [];
  loadingUsers = false;
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

    if (!this.card.archivos) {
      this.card.archivos = [];
    }
    
    if (!this.currentUserId) {
      this.currentUserId = this.authService.getCurrentUserId() || 0;
    }
    
    console.log('Usuario actual:', this.currentUserId);
    console.log('Es líder:', this.isLeader);
    
    this.loadComments();
    this.loadFiles();
    this.loadProjectMembers();
  }
   loadProjectMembers() {
    if (!this.proyectoId) {
      console.warn('No hay proyectoId para cargar miembros');
      return;
    }

    this.loadingUsers = true;
    this.http.get(`${this.api}/proyectos/${this.proyectoId}/miembros`).subscribe({
      next: (res: any) => {
        this.projectMembers = res?.miembros || res?.data || [];
        this.filteredProjectMembers = this.projectMembers;
        this.loadingUsers = false;
        console.log('Miembros del proyecto cargados:', this.projectMembers);
      },
      error: (e) => {
        console.error('Error cargando miembros:', e);
        this.projectMembers = [];
        this.filteredProjectMembers = [];
        this.loadingUsers = false;
      }
    });
  }

  startEditingAssignee() {
    this.editingAssignee = true;
    this.searchUserTerm = '';
    this.filteredProjectMembers = this.projectMembers;
  }

  cancelEditingAssignee() {
    this.editingAssignee = false;
    this.searchUserTerm = '';
  }

  onSearchUser() {
    const term = this.searchUserTerm.toLowerCase();
    
    if (!term) {
      this.filteredProjectMembers = this.projectMembers;
      return;
    }

    this.filteredProjectMembers = this.projectMembers.filter(m =>
      m.nombre?.toLowerCase().includes(term) ||
      m.email?.toLowerCase().includes(term) ||
      m.username?.toLowerCase().includes(term)
    );
  }

  assignUser(member: any | null) {
    const previousAssignee = this.card.asignado_a;
    const previousId = this.card.id_asignado;

    if (member) {
      this.card.id_asignado = member.id_usuario;
      this.card.asignado_a = member.nombre || member.username || member.email;
      console.log('Asignando tarea a:', this.card.asignado_a);
    } else {
      this.card.id_asignado = undefined; 
      this.card.asignado_a = 'Sin asignar';
      console.log('Desasignando tarea');
    }

    this.editingAssignee = false;
    this.searchUserTerm = '';
    this.taskService.updateCard(this.card).subscribe({
      next: () => {
        console.log('Asignación actualizada correctamente');
        this.cardUpdated.emit(this.card);
      },
      error: (e) => {
        console.error('Error actualizando asignación:', e);
        this.card.asignado_a = previousAssignee;
        this.card.id_asignado = previousId;
        
        alert('Error al actualizar la asignación. Por favor, intenta nuevamente.');
      }
    });
  }

  getMemberInitial(member: any): string {
    const name = member.nombre || member.username || member.email || 'U';
    return name.charAt(0).toUpperCase();
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
          texto: c.contenido,
          fecha: c.created_at || c.fecha,
          created_at: c.created_at || c.fecha,
          minutos_desde_creacion: c.minutos_desde_creacion,
          status: c.status || '0'
        }));
        
        this.card.comentarios?.forEach(c => {
          console.log(`Comentario ${c.id}: Usuario ${c.id_usuario}, Puede eliminar: ${this.canDeleteComment(c)}`);
        });
      },
      error: (e) => {
        console.error('Error cargando comentarios:', e);
        this.card.comentarios = [];
      }
    });
  }

loadFiles() {
  this.taskService.getTaskFilesComplete(this.card.id).subscribe({
    next: (archivos: ArchivoAdjunto[]) => {
      console.log('Archivos recibidos en componente:', archivos);
      this.card.archivos = archivos;
    },
    error: (e) => {
      console.error('Error cargando archivos:', e);
      this.card.archivos = [];
    }
  });
}

  getActiveComments(): Comentario[] {
    return (this.card.comentarios || []).filter(c => c.status !== '1');
  }

 getActiveFiles(): ArchivoAdjunto[] {
  if (!this.card.archivos) {
    return [];
  }
  
  const activos = this.card.archivos.filter(a => {
    const isActive = a.status !== '1' && a.status !== '1';
    console.log(`Archivo ${a.id} (${a.archivo_nombre}): status=${a.status}, activo=${isActive}`);
    return isActive;
  });
  
  console.log(`Total archivos activos: ${activos.length}/${this.card.archivos.length}`);
  return activos;
}

  canDeleteComment(comment: Comentario): boolean {
    if (this.isLeader) {
      console.log(`Líder puede eliminar comentario ${comment.id}`);
      return true;
    }
    
    const canDelete = comment.id_usuario === this.currentUserId;
    console.log(`${canDelete ? '' : ''} Usuario ${this.currentUserId} ${canDelete ? 'puede' : 'NO puede'} eliminar comentario ${comment.id} (autor: ${comment.id_usuario})`);
    
    return canDelete;
  }

  deleteComment(comment: Comentario) {
    const userName = comment.usuario || comment.nombre_usuario || 'este usuario';
    const confirmMsg = this.isLeader 
      ? `¿Eliminar el comentario de ${userName}?`
      : '¿Eliminar tu comentario?';
    
    if (!confirm(confirmMsg)) {
      return;
    }

    const commentId = comment.id_comentario || comment.id;
    
    if (!commentId) {
      alert('Error: ID de comentario no válido');
      return;
    }

    console.log(`Eliminando comentario ${commentId}...`);

    this.http.delete(`${this.api}/comentarios/${commentId}`).subscribe({
      next: () => {
        console.log('Comentario eliminado exitosamente');
        this.loadComments();
        
        if (this.card.comentarios_count !== undefined) {
          this.card.comentarios_count = Math.max(0, this.card.comentarios_count - 1);
        }
      },
      error: (e) => {
        console.error('Error eliminando comentario:', e);
        
        let errorMsg = 'No se pudo eliminar el comentario';
        
        if (e.status === 403) {
          errorMsg = 'No tienes permisos para eliminar este comentario';
        } else if (e.status === 404) {
          errorMsg = 'Comentario no encontrado';
        } else if (e.error?.error) {
          errorMsg = e.error.error;
        }
        
        alert(errorMsg);
      }
    });
  }

  addComment() {
    if (this.commentForm.invalid || this.isSubmittingComment) {
      return;
    }

    if (this.getActiveComments().length >= 10) {
      alert('Esta tarea ya tiene 10 comentarios (límite máximo)');
      return;
    }

    const currentUserId = this.currentUserId || this.authService.getCurrentUserId();
    
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
        this.loadComments();
        this.commentForm.reset();
        this.isSubmittingComment = false;
        
        if (this.card.comentarios_count !== undefined) {
          this.card.comentarios_count += 1;
        }
      },
      error: (e) => {
        console.error('Error agregando comentario:', e);
        
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

  onFileSelected(event: any) {
  const file: File = event.target.files[0];
  
  if (!file) {
    return;
  }

  if (this.getActiveFiles().length >= 3) {
    alert('Límite de 3 archivos alcanzado');
    event.target.value = '';
    return;
  }

  console.log('Archivo seleccionado:', file.name);
  this.taskService.uploadFileToTask(this.card.id, file).subscribe({
    next: (archivo) => {
      console.log('Archivo subido:', archivo);
      this.loadFiles(); 
      event.target.value = '';
    },
    error: (e) => {
      console.error('Error subiendo archivo:', e);
      alert(e.message || 'Error al subir el archivo');
      event.target.value = '';
    }
  });
}

  deleteFile(archivo: ArchivoAdjunto) {
    if (!confirm(`¿Eliminar "${archivo.archivo_nombre}"?`)) {
      return;
    }

    console.log(`Eliminando archivo ${archivo.id}...`);

    this.taskService.deleteFile(archivo.id).subscribe({
      next: () => {
        console.log('Archivo eliminado exitosamente');
        this.loadFiles();
      },
      error: (e) => {
        console.error('Error eliminando archivo:', e);
        alert(e.message || 'No se pudo eliminar el archivo');
      }
    });
  }

  isImageFile(archivo: ArchivoAdjunto): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => archivo.archivo_nombre.toLowerCase().endsWith(ext));
  }

  openFile(url: string) {
    window.open(url, '_blank');
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
    const diffInMs = now.getTime() - d.getTime();
    
    const diffInSeconds = Math.floor(diffInMs / 1000);
    if (diffInSeconds < 60) {
        if (diffInSeconds < 5) return 'hace un momento';
        return `hace ${diffInSeconds} segundos`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        if (diffInMinutes === 1) return 'hace 1 minuto';
        return `hace ${diffInMinutes} minutos`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        if (diffInHours === 1) return 'hace 1 hora';
        return `hace ${diffInHours} horas`;
    }
    
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
  formatFileDate(date?: string): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'short'
  });
}


}
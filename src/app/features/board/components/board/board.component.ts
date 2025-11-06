import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray
} from '@angular/cdk/drag-drop';

import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, from, Observable, of } from 'rxjs';
import { catchError, concatMap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { UserService as AuthService } from '../../../../core/auth/services/use.service';
import { Board, Card, Column } from '../../models/board.model';
import { BoardService } from '../../services/board.service';
import { ProjectPermissionService } from '../../services/project-permission.service';
import { TaskService } from '../../services/task.service';
import { BoardDashboardComponent } from '../board/dashboard/dashboard.component';
import { BoardSettingsComponent } from '../board/settings/board-settings.component';
import { CardDetailModalComponent } from '../card/card-detail.component';
import { ColumnComponent } from '../column/column.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    CommonModule, 
    ColumnComponent, 
    HeaderComponent,  
    ReactiveFormsModule,
    CardDetailModalComponent,
    DragDropModule,
    BoardDashboardComponent,
    BoardSettingsComponent,
   
  ],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css'],
})
export class BoardComponent {
  board?: Board;
  columns: Column[] = []; 
  allColumns: Column[] = [];
  columnIds: string[] = []; 
  proyectoId: number = 0;
  proyectoNombre: string = ''; 
  private authService = inject(AuthService);
private destroyRef = inject(DestroyRef);
currentUserName = '';
  selectedCard: Card | null = null;
  selectedColumnName: string = '';
  showCardDetail = false;
  colModalOpen = false;
  currentUserId: number = 0;
  editMode = false;
  editingColumn?: Column;
  colForm!: FormGroup;
  colorPalette = [
     '#72DED3', '#48B2FF', '#FFC27C','#F6EC7D', '#FB89D9',
      '#7BFAAA', '#CF8AD5', '#F58686', '#A4A4A4', '#AAAAFF'
  ];

  isLeader = false;
  isMember = false;
  userRole: 'lider' | 'miembro' | null = null;
  activeView: 'board' | 'dashboard' | 'settings' = 'board';
  projectDescription: string = '';
  projectMembers: any[] = [];
  
  // Para gestionar columnas fijas
  columnaConStatusEnProgreso?: Column;
  columnaConStatusFinalizado?: Column;

  private location = inject(Location);
  private route = inject(ActivatedRoute);
  workspaceId?: number;
  lastDeletedMemberId?: number; 

  
  

  constructor(
    private boardService: BoardService, 
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private http: HttpClient,
    private permissionService: ProjectPermissionService,
    private taskService: TaskService,
  ) {
    this.colForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(120)]],
      color: [this.colorPalette[0], Validators.required],
      status_fijas: [null],
    });
  }

  ngOnInit() {
     this.currentUserId = this.authService.getCurrentUserId()!;

    this.route.params.subscribe(params => {
      this.proyectoId = +params['projectId']; 
      this.workspaceId = +params['workspaceId'];

      console.log('Cargando tablero para proyecto:', this.proyectoId);
      this.loadUserPermissions();
    });

    this.route.queryParams.subscribe(params => {
      if (params['projectName']) {
        this.proyectoNombre = params['projectName'];
      }
    });
    this.authService.currentUser
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(user => {
      if (user) {
        this.currentUserName = user.username || 'Usuario';

      }
    });
 
  }

  private loadUserPermissions() {
  const currentUserId = this.authService.getCurrentUserId();
  
  if (!currentUserId) {
    console.error('Usuario no autenticado');
    this.router.navigate(['/login']);
    return;
  }

  this.permissionService.getUserRoleInProject(this.proyectoId, currentUserId).subscribe({
    next: (role) => {
      this.userRole = role;
      this.isLeader = this.permissionService.isLeader();
      this.isMember = this.permissionService.isMember();
      
      // ✅ AGREGAR ESTO
      console.log('🔐 === PERMISOS CARGADOS EN BOARD ===');
      console.log('userRole:', role);
      console.log('isLeader:', this.isLeader);
      console.log('typeof isLeader:', typeof this.isLeader);
      console.log('isMember:', this.isMember);
      
      this.loadBoard();
    },
    error: (e) => {
      console.error('Error cargando permisos:', e);
      alert('No tienes acceso a este proyecto');
      this.router.navigate(['/workspace', this.workspaceId]);
    }
  });
}

  private identificarColumnasFijas() {
    this.columnaConStatusEnProgreso = this.allColumns.find(c => c.status_fijas === '1');
    this.columnaConStatusFinalizado = this.allColumns.find(c => c.status_fijas === '2');
    
    console.log('📌 Columnas fijas identificadas:', {
      enProgreso: this.columnaConStatusEnProgreso?.nombre,
      finalizado: this.columnaConStatusFinalizado?.nombre
    });
  }

  private loadBoard() {
    if (!this.proyectoId) {
      console.error('No hay projectId');
      return;
    }

    console.log('Cargando datos del proyecto ID:', this.proyectoId);

    this.http.get<any>(`${environment.apiBase}/proyectos/${this.proyectoId}`).subscribe({
      next: (resProyecto) => {
        console.log('Respuesta RAW del backend:', resProyecto);
        const proyecto = resProyecto?.proyecto;
        
        if (!proyecto) {
          console.error('No se encontró el objeto "proyecto" en la respuesta');
          this.proyectoNombre = `Proyecto ${this.proyectoId}`;
        } else {
          this.proyectoNombre = proyecto.nombre || proyecto.name || `Proyecto ${this.proyectoId}`;
          this.projectDescription = proyecto.descripcion || proyecto.description || '';
          
          console.log('Nombre del proyecto:', this.proyectoNombre);
          console.log('Descripción:', this.projectDescription);
        }
        

        this.loadColumns();
      },
      error: (e) => {
        console.error('Error cargando proyecto:', e);
  
        if (!this.proyectoNombre) {
          this.proyectoNombre = `Proyecto ${this.proyectoId}`;
        }
        
        this.loadColumns();
      }
    });
  }

  private loadColumns() {
    console.log('🔍 === INICIANDO CARGA DE COLUMNAS ===');
    console.log('URL:', `${environment.apiBase}/proyectos/${this.proyectoId}/columnas`);
    
    this.http.get<any>(`${environment.apiBase}/proyectos/${this.proyectoId}/columnas`).subscribe({
      next: (resColumnas) => {
        console.log('📥 RESPUESTA COMPLETA del backend:', JSON.stringify(resColumnas, null, 2));
        
        const todasLasColumnas = resColumnas?.columnas?.data || resColumnas?.columnas || resColumnas?.data || [];
        console.log('📊 Columnas extraídas:', todasLasColumnas);
        
         this.allColumns = todasLasColumnas.map((c: any, index: number) => {
          let colorFinal: string;
  
          if (c.color && c.color.trim() !== '') {
            colorFinal = c.color;
          } else {
            const posIndex = index % this.colorPalette.length;
            colorFinal = this.colorPalette[posIndex];
            
            this.guardarColorColumna(c.id_columna ?? c.id, colorFinal);
  }

          console.log(`📝 Columna "${c.nombre}" (ID: ${c.id_columna ?? c.id}):`, {
            posicion: c.posicion,
            color_bd: c.color,
            color_asignado: colorFinal,
            tipo_columna: c.tipo_columna,
            status_fijas: c.status_fijas,  // 👈 ESTO ES LO MÁS IMPORTANTE
            cantidad_tareas: c.tareas_count || c.cantidad_tareas || 0
          });
          
          return {
            id: c.id_columna ?? c.id,
            nombre: c.nombre,
            color: colorFinal, 
            status: c.status,
            posicion: c.posicion,
            tipo_columna: c.tipo_columna,
            status_fijas: c.status_fijas,
            cantidad_tareas: c.tareas_count || c.cantidad_tareas || 0,
            cards: []
          };
        });
        
        console.log('✅ Columnas procesadas:', this.allColumns);
        console.log('🔍 Verificando status_fijas de cada columna:');
        this.allColumns.forEach(col => {
          console.log(`  - ${col.nombre}: status_fijas = ${col.status_fijas}`);
        });
        
        this.identificarColumnasFijas();
        this.loadBoardData();
      },
      error: (e) => {
        console.error('Error cargando columnas:', e);
        this.allColumns = [];
        this.loadBoardData();
      }
    });
  }
/**
 * Guarda el color de una columna en la base de datos
 */
private guardarColorColumna(columnaId: number, color: string): void {
  this.boardService.updateColumn(columnaId, { color }).subscribe({
    next: () => {
      console.log(`✅ Color guardado para columna ${columnaId}: ${color}`);
    },
    error: (e) => {
      console.error(`❌ Error guardando color para columna ${columnaId}:`, e);
    }
  });
}
  private loadBoardData() {
 
    const columnasActivas = this.allColumns.filter(col => String(col.status) === '0');
    columnasActivas.sort((a, b) => (a.posicion ?? 0) - (b.posicion ?? 0));

    this.columns = columnasActivas.map(col => ({
      ...col,
      cards: []
    }));
    
    console.log('Columnas activas:', this.columns);
    
    if (this.columns.length === 0) {
      console.log('Sin columnas, creando por defecto...');
      this.createDefaultColumns();
      return;
    }
    
    this.loadTasksFromResumen();
  }

  private loadTasksFromResumen() {
    this.http.get<any>(`${environment.apiBase}/proyectos/${this.proyectoId}/tareas/resumen`).subscribe({
      next: (resumen) => {
        resumen.forEach((columnaResumen: any) => {
          const columna = this.columns.find(c => c.id === columnaResumen.id_columna);
          if (!columna) return;
          
          columna.cards = columnaResumen.tareas.map((tarea: any) => ({
            id: tarea.id_tarea,
            id_columna: columnaResumen.id_columna,
            title: tarea.titulo,
            prioridad: this.normalizePriority(tarea.prioridad),
            comentarios_count: tarea.comentarios_count,
            position: tarea.position,
            fecha_vencimiento: tarea.ultima_actualizacion,
            id_asignado: tarea.id_asignado,                
            asignado_a: tarea.asignado?.nombre || 'Sin asignar', 
            descripcion: '',
            comentarios: [],
            archivos: []
          }));
        });
        
        this.board = {
          id: this.proyectoId,
          nombre: this.proyectoNombre,
          columns: this.columns
        };
        
        this.columnIds = this.columns.map(c => 'col-' + c.id);
      
        this.cdr.detectChanges();
      },
      error: (e) => {
        console.error('Error cargando tareas:', e);
        
        this.board = {
          id: this.proyectoId,
          nombre: this.proyectoNombre,
          columns: this.columns
        };
        
        this.cdr.detectChanges();
      }
    });
  }

  private normalizePriority(prioridad: string): 'baja' | 'media' | 'alta' | 'No asignada' {
    const p = prioridad?.toLowerCase();
    if (p === 'alta' || p === 'media' || p === 'baja') {
      return p as 'baja' | 'media' | 'alta';
    }
    return 'No asignada';
  }

private createDefaultColumns() {
  if (!this.proyectoId) return;

  const defaultColumns = [
    { title: 'Backlog', color: this.colorPalette[0], position: 1 },
    { title: 'Por Hacer', color: this.colorPalette[1], position: 2 },
    { title: 'En Desarrollo', color: this.colorPalette[2], position: 3 },
    { title: 'Hecho', color: this.colorPalette[4], position: 4 }
  ];


  from(defaultColumns).pipe(
    concatMap((col) => {
      console.log(`Creando: ${col.title} - Color: ${col.color}`);
      
      return this.boardService.createColumn(this.proyectoId!, col.title, col.position, col.color).pipe(
        catchError((err) => {
          console.error(`Error creando ${col.title}:`, err);
          return of(null);
        })
      );
    })
  ).subscribe({
    complete: () => {
      console.log('Columnas creadas. Recargando...');

      this.loadBoard();
    }
  });
}

  dropColumn(event: CdkDragDrop<Column[]>) {
    if (event.previousIndex === event.currentIndex) return;
    moveItemInArray(this.columns, event.previousIndex, event.currentIndex);
    if (this.board) this.board.columns = [...this.columns];
    this.updateColumnPositions;
  }
  getCurrentUserName(): string {
  return this.currentUserName;
}

 updateColumnPositions() {
  const updates = this.columns.map((col, index) => {
    const nuevaPosicion = index + 1;
    return this.boardService.updateColumnPosition(col.id, nuevaPosicion).pipe(
      catchError(err => {
        console.error(`Error actualizando columna ${col.id}:`, err);
        return of(null);
      })
    );
  });

  forkJoin(updates).subscribe({
    next: () => console.log('Posiciones actualizadas en backend'),
    error: (e) => console.error('Error general al actualizar posiciones:', e)
  });
}


  trackByColumnId = (_: number, column: Column) => column.id;

  onCardsChanged() {
    console.log('Tarjetas actualizadas');
  }
openCardDetail(card: Card) {
  if (!card?.id) return;

  // ✅ AGREGAR ESTO
  console.log('🔓 === ABRIENDO MODAL DESDE BOARD ===');
  console.log('currentUserId:', this.currentUserId);
  console.log('isLeader:', this.isLeader);
  console.log('typeof isLeader:', typeof this.isLeader);
  console.log('proyectoId:', this.proyectoId);

  this.taskService.getTaskById(card.id).subscribe({
    next: (tareaCompleta: any) => {
      this.selectedCard = {
        ...card,
        ...tareaCompleta,
        due_at: tareaCompleta.due_at || card.due_at || null
      };
      
      this.selectedColumnName = this.columns.find(c => c.id === card.id_columna)?.nombre || '';
      this.showCardDetail = true;
      console.log('Tarea completa cargada:', this.selectedCard);
    },
  });
}
  closeCardDetail() {
    this.showCardDetail = false;
    this.selectedCard = null;
    this.selectedColumnName = '';
  }

  onCardUpdated(updatedCard: Card) {
    if (!this.columns) return;
    for (const col of this.columns) {
      const cardIndex = col.cards.findIndex(c => c.id === updatedCard.id);
      if (cardIndex !== -1) {
        col.cards[cardIndex] = { ...updatedCard };
        break;
      }
    }
  }

  onCardDeleted(cardId: number) {
    if (!this.columns) return;
    for (const col of this.columns) {
      const cardIndex = col.cards.findIndex(c => c.id === cardId);
      if (cardIndex !== -1) {
        col.cards.splice(cardIndex, 1);
        break;
      }
    }
    this.closeCardDetail();
  }
  
  openAddColumn() {
    if (!this.isLeader) {
      alert('Solo el líder puede crear columnas');
      return;
    }
    this.editMode = false;
    this.editingColumn = undefined;
    this.colForm.reset({ nombre: '', color: this.colorPalette[0], status_fijas: null });
    this.colModalOpen = true;
  }

  submitAddColumn() {
    if (!this.board || this.colForm.invalid) {
      this.colForm.markAllAsTouched();
      return;
    }

    const nombre = (this.colForm.value.nombre as string).trim();
    const color = this.colForm.value.color as string; 
    const status_fijas = this.colForm.value.status_fijas;
    
    console.log('💾 Guardando cambios de columna:', { nombre, color, status_fijas });
    
    if (this.editMode && this.editingColumn) {
      // Primero guardar nombre y color
      this.boardService.updateColumn(this.editingColumn.id, { nombre, color }).subscribe({
        next: () => {
          console.log('✅ Nombre y color actualizados');
          
          // Ahora guardar status_fijas si cambió
          if (this.editingColumn!.status_fijas !== status_fijas) {
            console.log('📝 Status_fijas cambió, guardando...');
            this.guardarStatusFijas(status_fijas);
          } else {
            console.log('ℹ️ Status_fijas sin cambios');
            const tipo_columna = status_fijas ? 'fija' : 'normal';
            this.actualizarColumnaLocal(nombre, color, tipo_columna, status_fijas);
            this.identificarColumnasFijas();
          }
        },
        error: (e) => {
          console.error('❌ Error actualizando columna:', e);
          alert(e?.error?.error ?? 'No se pudo actualizar');
        }
      });
    } else {

      let nextPos = 1;
      
      if (this.columns && this.columns.length > 0) {
        const posiciones = this.columns.map(col => col.posicion || col.order || 0);
        const maxPos = Math.max(...posiciones);
        nextPos = maxPos + 1;
      }
      
      console.log('Creando columna - Pos:', nextPos, 'Color:', color);
      
      this.boardService.createColumn(this.board.id, nombre, nextPos, color).subscribe({
        next: (newCol) => {
          console.log('Columna creada:', newCol);
          const columnaConColor = {
            ...newCol,
            color: color, 
            cards: []
          };
          
          this.columns.push(columnaConColor);
          this.board!.columns = [...this.columns];
          this.columnIds = this.columns.map(x => 'col-' + x.id);
          
          this.allColumns.push({
            id: newCol.id,
            nombre: newCol.nombre,
            color: color, 
            status: '0',
            posicion: newCol.posicion,
            cards: []
          });
          
          this.cdr.detectChanges();
          this.closeAddColumn();
        },
        error: (e) => {
          console.error('Error creando columna:', e);
          alert(e?.error?.error || 'No se pudo crear');
        }
      });
    }
  }

  actualizarColumnaLocal(nombre: string, color: string, tipo_columna: 'normal' | 'fija', status_fijas: '1' | '2' | null) {
    const colIndex = this.columns.findIndex(c => c.id === this.editingColumn!.id);
    if (colIndex !== -1) {
      this.columns[colIndex].nombre = nombre;
      this.columns[colIndex].color = color;
      this.columns[colIndex].tipo_columna = tipo_columna;
      this.columns[colIndex].status_fijas = status_fijas;
    }
    
    const allColIndex = this.allColumns.findIndex(c => c.id === this.editingColumn!.id);
    if (allColIndex !== -1) {
      this.allColumns[allColIndex].nombre = nombre;
      this.allColumns[allColIndex].color = color;
      this.allColumns[allColIndex].tipo_columna = tipo_columna;
      this.allColumns[allColIndex].status_fijas = status_fijas;
    }
    
    console.log('✅ Columna actualizada localmente:', { nombre, tipo_columna, status_fijas });
    this.cdr.detectChanges();
    this.closeAddColumn();
  }

  isStatusFijasDisabled(status: '1' | '2'): boolean {
    if (!this.editingColumn) return false;
    
    const tieneTareas = (this.editingColumn.cantidad_tareas || this.editingColumn.cards?.length || 0) > 0;
    const esColumnaFija = this.editingColumn.tipo_columna === 'fija' && this.editingColumn.status_fijas !== null;
    const tieneEsteStatus = this.editingColumn.status_fijas === status;
    
    // Caso 1: Hacer clic en el botón que YA está seleccionado (quitar status_fijas, convertir a Normal)
    if (tieneEsteStatus) {
      // Solo permitir quitar status_fijas si NO tiene tareas
      if (esColumnaFija && tieneTareas) {
        return true; // Bloqueado: columna fija con tareas no se puede convertir a normal
      }
      return false; // Permitido: se puede quitar status_fijas
    }
    
    // Caso 2: Cambiar de un status_fijas a otro (ej: de '1' a '2' o viceversa)
    // REGLA DEL BACKEND: Solo bloquear si la columna YA ES FIJA y tiene tareas
    // Columna Normal → Fija: ✅ Permitido aunque tenga tareas
    // Columna Fija → Cambiar status_fijas: ❌ Bloqueado si tiene tareas
    if (esColumnaFija && tieneTareas) {
      return true; // Bloquear cambio en columnas fijas con tareas
    }
    
    // Caso 3: Si otra columna ya tiene este status, está deshabilitado
    if (status === '1') {
      return !!this.columnaConStatusEnProgreso && this.columnaConStatusEnProgreso.id !== this.editingColumn.id;
    }
    if (status === '2') {
      return !!this.columnaConStatusFinalizado && this.columnaConStatusFinalizado.id !== this.editingColumn.id;
    }
    
    return false;
  }

  toggleStatusFijas(status: '1' | '2') {
    if (!this.editingColumn) return;
    
    // Verificar si está deshabilitado
    if (this.isStatusFijasDisabled(status)) {
      return;
    }
    
    const currentValue = this.colForm.get('status_fijas')?.value;
    const newValue = currentValue === status ? null : status;
    
    console.log('🔄 Toggle status_fijas (solo visual):', {
      columna: this.editingColumn.nombre,
      currentValue,
      newValue,
      status
    });
    
    // Solo actualizar el formulario (cambio visual)
    this.colForm.patchValue({ status_fijas: newValue });
  }

  guardarStatusFijas(newStatusFijas: '1' | '2' | null) {
    if (!this.editingColumn) return;
    
    console.log('💾 Guardando status_fijas al hacer clic en Actualizar:', {
      columna_id: this.editingColumn.id,
      columna_nombre: this.editingColumn.nombre,
      status_fijas_anterior: this.editingColumn.status_fijas,
      status_fijas_nuevo: newStatusFijas
    });
    
    const tipo_columna = newStatusFijas ? 'fija' : 'normal';
    const columnasActualizar = [{
      id_columna: Number(this.editingColumn.id),
      status_fijas: newStatusFijas
    }];
    
    this.boardService.gestionarTiposColumnas(this.proyectoId, columnasActualizar).subscribe({
      next: (response) => {
        console.log('✅ Status_fijas guardado exitosamente:', response);
        
        // Actualizar estado local
        const nombre = this.editingColumn!.nombre || '';
        const color = this.editingColumn!.color || this.colorPalette[0];
        this.actualizarColumnaLocal(nombre, color, tipo_columna, newStatusFijas);
        this.identificarColumnasFijas();
        
        // Mensaje de éxito
        const mensaje = newStatusFijas === '1' ? 'Establecida como "En progreso"' :
                       newStatusFijas === '2' ? 'Establecida como "Finalizado"' :
                       'Convertida a columna normal';
        console.log(`✅ ${mensaje}`);
      },
      error: (e) => {
        console.error('❌ Error guardando status_fijas:', e);
        console.error('📋 Detalles del error:', {
          status: e?.status,
          statusText: e?.statusText,
          error: e?.error,
          message: e?.message
        });
        
        // Revertir el cambio en el formulario
        this.colForm.patchValue({ status_fijas: this.editingColumn!.status_fijas });
        
        const errorMsg = e?.error?.error || e?.error?.message || e?.message || 'No se pudo actualizar el tipo de columna';
        alert(`Error: ${errorMsg}\n\nRevisa la consola para más detalles.`);
      }
    });
  }

  onEditColumn(column: Column) {
    if (!this.isLeader) {
      alert('Solo el líder puede editar columnas');
      return;
    }
    this.editMode = true;
    this.editingColumn = column;
    this.colForm.reset({ 
      nombre: column.nombre, 
      color: column.color || this.colorPalette[0],
      status_fijas: column.status_fijas || null
    });
    this.colModalOpen = true;
  }

  onDeleteColumn(col: Column) {
    if (!this.board) return;
    if (!this.isLeader) {
      alert('Solo el líder puede eliminar columnas');
      return;
    }
    if (this.columns.length <= 1) {
      alert('No se puede eliminar la última columna');
      return;
    }
    if (col.cards && col.cards.length > 0) {
      alert(`La columna tiene ${col.cards.length} tarjeta(s). Muévelas primero.`);
      return;
    }
    if (!confirm(`¿Eliminar "${col.nombre}"?`)) return;

    this.boardService.deleteColumn(col.id).subscribe({
      next: () => {
        this.columns = this.columns.filter(c => c.id !== col.id);
        this.board!.columns = [...this.columns];
        this.columnIds = this.columns.map(x => 'col-' + x.id);
      },
      error: (e) => alert(e?.error?.error ?? 'No se pudo eliminar')
    });
  }

  closeAddColumn() { 
    this.colModalOpen = false;
    this.editMode = false;
    this.editingColumn = undefined;
    this.colForm.reset({ 
      nombre: '', 
      color: this.colorPalette[0],
      status_fijas: null
    });
  }

  isDuplicateColumnName(nombre: string): boolean {
    if (!nombre || typeof nombre !== 'string') return false;
    const nombreNormalizado = nombre.trim().toLowerCase();
    if (!nombreNormalizado) return false;
    const columnasParaValidar = this.allColumns.length > 0 ? this.allColumns : this.columns;

    if (this.editMode && this.editingColumn) {
      return columnasParaValidar.some(col => {
        const status = String(col.status ?? '0');
        return status === '0' && col.id !== this.editingColumn!.id && col.nombre?.toLowerCase() === nombreNormalizado;
      });
    }

    return columnasParaValidar.some(col => {
      const status = String(col.status ?? '0');
      return status === '0' && col.nombre?.toLowerCase() === nombreNormalizado;
    });
  }

  private loadProjectMembers() {
    if (!this.proyectoId) return;
    this.http.get<any>(`${environment.apiBase}/proyectos/${this.proyectoId}/miembros`).subscribe({
      next: (res) => {
        this.projectMembers = res?.miembros || res?.data || [];
        console.log('Miembros cargados:', this.projectMembers);
      },
      error: (e) => {
        console.error('Error cargando miembros:', e);
        this.projectMembers = [];
      }
    });
  }

  deleteProject() {
    if (!this.isLeader) {
      alert('Solo el líder puede eliminar el proyecto');
      return;
    }

    const confirmation = confirm(
      `¿ELIMINAR "${this.proyectoNombre}"?\n\n` +
      `Se eliminará:\n` +
      `• ${this.columns.length} columnas\n` +
      `• Todas las tarjetas\n` +
      `• Todos los comentarios\n\n` +
      `Escribe "ELIMINAR" para confirmar.`
    );

    if (!confirmation) return;

    const confirmText = prompt('Escribe "ELIMINAR":');
    if (confirmText !== 'ELIMINAR') {
      alert('Cancelado');
      return;
    }

    this.http.delete(`${environment.apiBase}/proyectos/${this.proyectoId}`).subscribe({
      next: () => {
        alert('Proyecto eliminado');
        this.router.navigate(['/workspace', this.workspaceId]);
      },
      error: (e) => {
        console.error('Error:', e);
        alert('Error al eliminar');
      }
    });
  }

  setActiveView(view: 'board' | 'dashboard' | 'settings') {
  
    this.activeView = view;
  }

  onProjectDeleted() {
    this.router.navigate(['/workspace', this.workspaceId]);
  }

  goBackToWorkspace(): void {
    if (this.workspaceId) {
      this.router.navigate(['/workspace', this.workspaceId]);
    } else {
      this.location.back();
    }
  }
  
  onColumnDrop(event: CdkDragDrop<Column[]>): void {
  console.log('🔵 DROP EJECUTADO');
  
  // Validar permisos
  if (!this.isLeader) {
    console.warn('❌ Sin permisos para reordenar columnas');
    alert('Solo el líder puede reordenar columnas');
    return;
  }
  
  const prevIndex = event.previousIndex;
  const currIndex = event.currentIndex;

  // Si no cambió de posición, no hacer nada
  if (prevIndex === currIndex) {
    console.log('⚠️ Misma posición, no se actualiza');
    return;
  }

  if (!this.columns || this.columns.length === 0) {
    console.warn('⚠️ No hay columnas para reordenar');
    return;
  }

  console.log(`📦 Moviendo columna: posición ${prevIndex} → ${currIndex}`);

  // Mover en el array
  moveItemInArray(this.columns, prevIndex, currIndex);

  // ✅ CRÍTICO: Actualizar el campo 'posicion' de TODAS las columnas
  this.columns.forEach((col, index) => {
    col.posicion = index;
    console.log(`  ${col.nombre}: nueva posición = ${index}`);
  });

  // Crear array de updates
  const updates = this.columns.map((col, index) => ({
    id: col.id,
    posicion: index
  }));

  console.log('📤 Actualizando posiciones en backend...', updates);

  // Actualizar de forma secuencial para evitar conflictos
  from(updates).pipe(
    concatMap(update => 
      this.boardService.updateColumnPosition(update.id, update.posicion)
    ),
    takeUntilDestroyed(this.destroyRef)
  ).subscribe({
    next: () => {
      // Progreso
    },
    error: (err) => {
      console.error('❌ Error actualizando posiciones:', err);
      alert('Error al reordenar columnas. Recargando...');
      this.loadBoard();
    },
    complete: () => {
      console.log('✅ Todas las posiciones actualizadas correctamente');
      
      // Actualizar también en allColumns
      if (this.allColumns && this.allColumns.length > 0) {
        this.columns.forEach(col => {
          const allColIndex = this.allColumns.findIndex(c => c.id === col.id);
          if (allColIndex !== -1) {
            this.allColumns[allColIndex].posicion = col.posicion;
          }
        });
      }
      
      this.cdr.detectChanges();
      console.log('✅ Orden final:', this.columns.map(c => `${c.nombre}:${c.posicion}`));
    }
  });
}
onProjectLeft() {
  console.log('[BoardComponent] Usuario salió del proyecto');
  this.router.navigate(['/workspace', this.workspaceId]);
}
onRoleChanged(newRoleId: number) {
  console.log('[BoardComponent] Rol actualizado:', newRoleId);
  
  this.isLeader = newRoleId === 1;
  this.isMember = newRoleId === 2;
  this.userRole = newRoleId === 1 ? 'lider' : 'miembro';
  
  alert(`Tu rol ha sido actualizado a ${this.userRole === 'lider' ? 'Líder' : 'Miembro'}`);
  
  this.cdr.detectChanges();
  
  if (this.activeView === 'dashboard' && !this.isLeader) {
    this.activeView = 'board';
  }
}
/**
 * 🔄 Actualizar tareas cuando se elimina un miembro
 */
onMemberDeleted(usuarioId: number) {
  console.log('🔄 Actualizando UI: miembro eliminado', usuarioId);
  
  // Actualizar todas las tarjetas que estaban asignadas al usuario
  this.columns.forEach(col => {
    col.cards.forEach(card => {
      if (card.id_asignado === usuarioId) {
        card.id_asignado = undefined;
        card.asignado_a = 'Sin asignar';
        console.log(`✅ Tarea ${card.id} actualizada en UI`);
      }
    });
  });
  
  // ✅ Guardar el ID para pasarlo a las columnas
  this.lastDeletedMemberId = usuarioId;
  
  // ✅ Resetear después de un momento para que el binding funcione
  setTimeout(() => {
    this.lastDeletedMemberId = undefined;
  }, 100);
  
  // Forzar detección de cambios
  this.cdr.detectChanges();
}
}
import { 
  CdkDragDrop, 
  moveItemInArray,
  DragDropModule 
} from '@angular/cdk/drag-drop';
import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { from, of } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { Board, Card, Column } from '../../models/board.model';
import { BoardService } from '../../services/board.service';
import { ProjectPermissionService } from '../../services/project-permission.service';
import { UserService as AuthService } from '../../../../core/auth/services/use.service';
import { ColumnComponent } from '../column/column.component';
import { HeaderComponent } from '../header/header.component';
import { CardDetailModalComponent } from '../card/card-detail.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    CommonModule, 
    ColumnComponent, 
    HeaderComponent,  
    ReactiveFormsModule,
    CardDetailModalComponent,
    DragDropModule
  ],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css'],
})
export class BoardComponent {
  board?: Board;
  columns: Column[] = []; 
  allColumns: Column[] = []; // ✅ Todas las columnas (incluidas eliminadas)
  columnIds: string[] = []; 
  proyectoId: number = 0;
  
  selectedCard: Card | null = null;
  selectedColumnName: string = '';
  showCardDetail = false;

  colModalOpen = false;
  editMode = false;
  editingColumn?: Column;
  colForm!: FormGroup;
  colorPalette = [
    '#F58686', '#72DED3', '#FFC27C', '#FB89D9', '#7BFAAA',
    '#F6EC7D', '#CF8AD5', '#48B2FF', '#A4A4A4', '#AAAAFF'
  ];

  // ✅ Permisos
  isLeader = false;
  isMember = false;
  userRole: 'lider' | 'miembro' | null = null;

  // ✅ Vista activa
  activeView: 'board' | 'dashboard' | 'settings' = 'board';

  // ✅ Datos del proyecto
  projectDescription: string = '';
  projectMembers: any[] = [];

  private location = inject(Location);
  private route = inject(ActivatedRoute);
  workspaceId?: number;

  constructor(
    private boardService: BoardService, 
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private http: HttpClient,
    private permissionService: ProjectPermissionService,
    private authService: AuthService
  ) {
    this.colForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(120)]],
      color: [this.colorPalette[0], Validators.required],
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.proyectoId = +params['projectId']; 
      this.workspaceId = +params['workspaceId'];
      
      console.log('Cargando tablero para proyecto:', this.proyectoId);
      this.loadUserPermissions();
    });
  }

  // ✅ Cargar permisos del usuario
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
        
        console.log('Permisos cargados:', { role, isLeader: this.isLeader, isMember: this.isMember });
        
        // Después de cargar permisos, cargar el board
        this.loadBoard();
      },
      error: (e) => {
        console.error('Error cargando permisos:', e);
        alert('No tienes acceso a este proyecto');
        this.router.navigate(['/workspace', this.workspaceId]);
      }
    });
  }

  // ✅ Cargar board y todas las columnas
  private loadBoard() {
    if (!this.proyectoId) {
      console.error('No hay projectId');
      return;
    }

    console.log('Intentando cargar board para proyecto:', this.proyectoId);

    // Primero cargar TODAS las columnas (para validación de duplicados)
    this.http.get<any>(`${environment.apiBase}/proyectos/${this.proyectoId}/columnas`).subscribe({
      next: (resColumnas) => {
        const todasLasColumnas = resColumnas?.columnas || resColumnas?.data || [];
        this.allColumns = todasLasColumnas.map((c: any) => ({
          id: c.id_columna ?? c.id,
          nombre: c.nombre,
          color: c.color,
          status: c.status,
          posicion: c.posicion,
          cards: []
        }));
        
        console.log('✅ Todas las columnas cargadas:', this.allColumns);
        
        // Ahora cargar el board con las columnas activas
        this.loadBoardData();
      },
      error: (e) => {
        console.error('Error cargando columnas:', e);
        this.loadBoardData();
      }
    });
  }

  private loadBoardData() {
    this.boardService.getBoard(this.proyectoId).subscribe({
      next: (data) => {
        console.log('Datos recibidos del board:', data);
        this.board = data;
        
        if (!this.board.columns || this.board.columns.length === 0) {
          console.log('Sin columnas, creando por defecto...');
          this.createDefaultColumns();
        } else {
          const columnasActivas = this.board.columns.filter(col => {
            const status = String(col.status);
            return status === '0';
          });
          
          columnasActivas.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          this.columns = [...columnasActivas]; 
          this.columnIds = this.columns.map(c => 'col-' + c.id);
          this.board.columns = columnasActivas;
        }
      },
      error: (e) => {
        console.error('Error completo:', e);
        if (e.status === 404) {
          this.board = this.defaultBoard();
          this.createDefaultColumns();
        } else {
          alert('Error al cargar el tablero');
        }
      }
    });
  }

  private createDefaultColumns() {
    if (!this.board || !this.proyectoId) return;
    
    if (!this.board.columns) {
      this.board.columns = [];
    }

    const defaultColumns = [
      { title: 'Backlog', color: '#72DED3', position: 1 },
      { title: 'Por Hacer', color: '#48B2FF', position: 2 },
      { title: 'En Desarrollo', color: '#FFC27C', position: 3 },
      { title: 'Hecho', color: '#F6EC7D', position: 4 }
    ];

    from(defaultColumns).pipe(
      concatMap((col) => 
        this.boardService.createColumn(this.proyectoId!, col.title, col.position, col.color).pipe(
          map(newCol => {
            newCol.color = col.color;
            return newCol;
          }),
          catchError(() => of(null))
        )
      )
    ).subscribe({
      complete: () => {
        setTimeout(() => {
          this.boardService.getBoard(this.proyectoId!).subscribe({
            next: (boardData) => {
              if (boardData.columns && boardData.columns.length > 0) {
                this.board!.columns = boardData.columns;
                this.columns = [...boardData.columns];
                this.columnIds = this.columns.map(x => 'col-' + x.id);
                this.cdr.detectChanges();
              }
            },
            error: (err) => console.error('Error recargando:', err)
          });
        }, 1500);
      }
    });
  }

  private defaultBoard(): Board {
    return {
      id: this.proyectoId || 1,
      nombre: `Tablero Proyecto ${this.proyectoId}`,
      columns: []
    };
  }

  dropColumn(event: CdkDragDrop<Column[]>) {
    if (event.previousIndex === event.currentIndex) return;
    moveItemInArray(this.columns, event.previousIndex, event.currentIndex);
    if (this.board) this.board.columns = [...this.columns];
    this.updateColumnPositions();
  }

  updateColumnPositions() {
    const positions = this.columns.map((col, index) => ({
      id: col.id,
      position: index + 1
    }));
    
    this.boardService.updateColumnPositions(this.proyectoId!, positions).subscribe({
      next: () => console.log('Posiciones actualizadas'),
      error: (e) => console.error('Error actualizando posiciones:', e)
    });
  }

  trackByColumnId = (_: number, column: Column) => column.id;

  onCardsChanged() {
    console.log('Tarjetas actualizadas');
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
      alert('❌ Solo el líder puede crear columnas');
      return;
    }
    this.editMode = false;
    this.editingColumn = undefined;
    this.colForm.reset({ nombre: '', color: this.colorPalette[0] });
    this.colModalOpen = true;
  }

 submitAddColumn() {
  if (!this.board || this.colForm.invalid) {
    this.colForm.markAllAsTouched();
    return;
  }

  const nombre = (this.colForm.value.nombre as string).trim();
  const color = this.colForm.value.color as string;
  
  if (this.editMode && this.editingColumn) {
    // ========== MODO EDICIÓN ==========
    this.boardService.updateColumn(this.editingColumn.id, { nombre, color }).subscribe({
      next: () => {
        this.editingColumn!.nombre = nombre;
        this.editingColumn!.color = color;
        
        const colIndex = this.allColumns.findIndex(c => c.id === this.editingColumn!.id);
        if (colIndex !== -1) {
          this.allColumns[colIndex].nombre = nombre;
          this.allColumns[colIndex].color = color;
        }
        
        this.closeAddColumn();
      },
      error: (e) => {
        console.error('Error actualizando columna:', e);
        alert(e?.error?.error ?? 'No se pudo actualizar la columna');
      }
    });
  } else {
    // ========== MODO CREACIÓN ==========
    
    // ✅ Calcular la posición correctamente
    let nextPos = 1;
    
    if (this.columns && this.columns.length > 0) {
      // Obtener la posición máxima de las columnas activas
      const posiciones = this.columns.map(col => col.posicion || col.order || 0);
      const maxPos = Math.max(...posiciones);
      nextPos = maxPos + 1;
    }
    
    console.log('📊 Creando columna en posición:', nextPos);
    console.log('📋 Posiciones actuales:', this.columns.map(c => c.posicion || c.order));
    
    this.boardService.createColumn(this.board.id, nombre, nextPos, color).subscribe({
      next: (newCol) => {
        console.log('✅ Columna creada:', newCol);
        
        newCol.color = color;
        this.columns.push(newCol);
        this.board!.columns = [...this.columns];
        this.columnIds = this.columns.map(x => 'col-' + x.id);
        
        // Actualizar allColumns también
        this.allColumns.push({
          id: newCol.id,
          nombre: newCol.nombre,
          color: newCol.color,
          status: '0',
          posicion: newCol.posicion,
          cards: []
        });
        
        this.closeAddColumn();
      },
      error: (e) => {
        console.error('❌ Error creando columna:', e);
        console.error('📋 Detalles:', e.error);
        
        // Mostrar el error específico del backend
        const errorMsg = e?.error?.error || 'No se pudo crear la columna';
        alert(errorMsg);
      }
    });
  }
}

  onEditColumn(column: Column) {
    if (!this.isLeader) {
      alert('❌ Solo el líder puede editar columnas');
      return;
    }
    this.editMode = true;
    this.editingColumn = column;
    this.colForm.reset({ nombre: column.nombre, color: column.color || this.colorPalette[0] });
    this.colModalOpen = true;
  }

  onDeleteColumn(col: Column) {
    if (!this.board) return;
    if (!this.isLeader) {
      alert('❌ Solo el líder puede eliminar columnas');
      return;
    }
    if (this.columns.length <= 1) {
      alert('❌ No se puede eliminar la última columna');
      return;
    }
    if (col.cards && col.cards.length > 0) {
      alert(`❌ La columna tiene ${col.cards.length} tarjeta(s). Muévelas primero.`);
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

  // ✅ Cambiar vista
  setActiveView(view: 'board' | 'dashboard' | 'settings') {
    this.activeView = view;
    if (view === 'settings' && this.isLeader) {
      this.loadProjectMembers();
    }
  }

  // ✅ Cargar miembros
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

  // ✅ Eliminar proyecto
  deleteProject() {
    if (!this.isLeader) {
      alert('❌ Solo el líder puede eliminar el proyecto');
      return;
    }

    const confirmation = confirm(
      `⚠️ ¿ELIMINAR "${this.board?.nombre}"?\n\n` +
      `Se eliminará:\n` +
      `• ${this.columns.length} columnas\n` +
      `• Todas las tarjetas\n` +
      `• Todos los comentarios\n\n` +
      `Escribe "ELIMINAR" para confirmar.`
    );

    if (!confirmation) return;

    const confirmText = prompt('Escribe "ELIMINAR":');
    if (confirmText !== 'ELIMINAR') {
      alert('❌ Cancelado');
      return;
    }

    this.http.delete(`${environment.apiBase}/proyectos/${this.proyectoId}`).subscribe({
      next: () => {
        alert('✅ Proyecto eliminado');
        this.router.navigate(['/workspace', this.workspaceId]);
      },
      error: (e) => {
        console.error('Error:', e);
        alert('❌ Error al eliminar');
      }
    });
  }

  goBackToWorkspace(): void {
    if (this.workspaceId) {
      this.router.navigate(['/workspace', this.workspaceId]);
    } else {
      this.location.back();
    }
  }
}
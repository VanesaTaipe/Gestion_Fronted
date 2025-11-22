import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule, FormControl } from '@angular/forms';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Column, Card } from '../../models/board.model';
import { TaskService } from '../../services/task.service';
import { CardDetailModalComponent } from '../card/card-detail.component';
import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, map, Observable, startWith } from 'rxjs';
import { CardComponent } from '../card/card.component';
import { DescriptionEditorComponent } from './descripction-editor.component';
@Component({
  selector: 'app-column',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CdkDropList, CdkDrag, CardComponent, CardDetailModalComponent,DescriptionEditorComponent],
  templateUrl: './column.component.html',
  styleUrls: ['./column.component.css']
})
export class ColumnComponent {
  @Input() column!: Column;
  @Input() proyectoId!: number;
  @Input() connectedDropLists: string[] = [];
   @Input() isLeader: boolean = false;
  @Input() isMember: boolean = false;
  @Input() currentUserId!: number;
  @Input() allColumns: Column[] = []; 
  @Output() cardsChanged = new EventEmitter<void>();
  @Output() editColumn = new EventEmitter<Column>();
  @Output() deleteColumn = new EventEmitter<Column>();
  @HostListener('document:click', ['$event'])

  showModal = false;
  menuOpen = false;
  creating = false;
  form!: FormGroup;
   showCardDetail = false;
  selectedCard: Card | null = null;
  selectedFiles: File[] = [];
  imageUrls: string[] = [];
  imageUrlInput = '';
  previewUrls: string[] = [];
   projectMembers: any[] = [];
  filteredMembers$!: Observable<any[]>;
  searchControl = new FormControl('');
  isSearchingUsers = false;
  selectedMember: any = null;
  private api = environment.apiBase;
  totalComentarios: number = 0;
  dropdownOpen = false;
  


  constructor(
    private fb: FormBuilder,
    private taskSvc: TaskService,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(200)]],
      descripcion: [''], 
      prioridad: ['', Validators.required],
      fecha_vencimiento: [''],
      assignee: [''],
      assigneeName: ['']
    });
  }

@Input() set deletedMemberId(id: number | undefined) {
  if (id) {
    console.log(' Column: miembro eliminado', id);
    
    // Actualizar todas las tarjetas de esta columna
    this.column.cards.forEach(card => {
      if (card.id_asignado === id) {
        card.id_asignado = undefined;
        card.asignado_a = 'Sin asignar';
        console.log(`Card ${card.id} actualizada en columna`);
      }
    });
    
    // Actualizar modal si está abierto
    this.updateSelectedCard(id);
  }
}
  ngOnInit() {
    this.loadProjectMembers();
    this.setupMemberSearch();
    this.searchControl.valueChanges.subscribe(value => {
    if (typeof value === 'string') {
      this.dropdownOpen = true;
    }
  });
  }
  loadProjectMembers() {
    this.http.get(`${this.api}/proyectos/${this.proyectoId}/miembros`)
      .subscribe({
        next: (res: any) => {
          console.log('Miembros del proyecto:', res);
          this.projectMembers = res.miembros || res.data || [];
          if (this.projectMembers.length > 0) {
          this.searchControl.setValue(''); 
        }
        },
        error: (err) => {
          console.error('Error cargando miembros:', err);
          this.projectMembers = [];
        }
      });
  }
getUserInitial(card: Card): string {
  const name = card.asignado_a || 'U';
  return name.charAt(0).toUpperCase();
}
getPriorityLabel(priority?: string): string {
  switch(priority) {
    case 'alta': return 'Alta';
    case 'media': return 'Media';
    case 'baja': return 'Baja';
    default: return 'No asignada';
  }
}
getCommentCount(card: Card): number {
  return card.comentarios?.length || 0;
}
   setupMemberSearch() {
    this.filteredMembers$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      map(searchTerm => {
        if (typeof searchTerm !== 'string') {
          return [];
        }
        if (!searchTerm) {
          return this.projectMembers.slice(0, 5); 
        }
        
        const filtered = this.projectMembers.filter(member =>
          member.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.nombre.localeCompare(b.nombre)); ;
        
        return filtered.slice(0, 5); 
      })
    );
  }
    selectMember(member: any) {
      this.selectedMember = member;
      this.searchControl.setValue(member.nombre);
      this.form.patchValue({
        assignee: member.id_usuario,
        assigneeName: member.nombre
      });
    }

    clearMember() {
      this.selectedMember = null;
      this.searchControl.setValue('');
      this.form.patchValue({
        assignee: '',
        assigneeName: ''
      });
    }
  toggleMenu(event: Event) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  @HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (this.dropdownOpen) {
    const clickedInsideDropdown = target.closest('.dropdown-container');
    if (!clickedInsideDropdown) {
      this.dropdownOpen = false;
    }
  }
}

  editColumnAction() {
    this.menuOpen = false;
    this.editColumn.emit(this.column);
  }

  deleteColumnAction() {
    this.menuOpen = false;
    this.deleteColumn.emit(this.column);
  }
  getTotalImages(): number {
    return this.selectedFiles.length + this.imageUrls.length;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);

      const availableSlots = 3 - this.getTotalImages();
      const filesToAdd = files.slice(0, availableSlots);
      
      filesToAdd.forEach(file => {
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} no es una imagen válida`);
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} es muy grande (máximo 5MB)`);
          return;
        }      
        this.selectedFiles.push(file);
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrls.push(e.target.result);
        };
        reader.readAsDataURL(file);
      });

      input.value = '';
    }
  }

  removeImage(index: number) {

    if (index < this.selectedFiles.length) {
      this.selectedFiles.splice(index, 1);
    } else {
      const urlIndex = index - this.selectedFiles.length;
      this.imageUrls.splice(urlIndex, 1);
    }
    this.previewUrls.splice(index, 1);
  }

  drop(event: CdkDragDrop<Card[]>) {

  if (!event.container.data || !Array.isArray(event.container.data)) {
    console.warn('Drop event no contiene datos de tarjetas');
    return;
  }

  // IMPORTANTE: Este evento se ejecuta solo en la columna DESTINO (donde se suelta)
  // Por lo tanto, this.column es la columna DESTINO
  const mismaLista = event.previousContainer === event.container;
  
  // Obtener la columna de ORIGEN (desde donde se está moviendo la tarjeta)
  const previousContainerId = event.previousContainer.id;
  const previousColumnId = this.getColumnIdFromContainer(event.previousContainer);
  const previousColumn = this.allColumns.find(col => col.id === previousColumnId);
  
  console.log('🔍 Debug drop:', {
    columnaActual: this.column.nombre,
    columnaActualId: this.column.id,
    allColumnsLength: this.allColumns.length,
    previousColumnId: previousColumnId,
    previousColumn: previousColumn ? {
      id: previousColumn.id,
      nombre: previousColumn.nombre,
      status_fijas: previousColumn.status_fijas
    } : null,
    esMismaLista: mismaLista,
    allColumns: this.allColumns.map(c => ({ id: c.id, nombre: c.nombre, status_fijas: c.status_fijas }))
  });
  
  // REGLAS DE MOVIMIENTO (Flujo Kanban Estricto - Sincronizado con Backend):
  // Normal → Normal ✅ | Normal → En Progreso ✅ | Normal → Finalizado ❌
  // En Progreso → Normal ❌ | En Progreso → Finalizado ✅
  // Finalizado → Todo bloqueado ❌
  if (!mismaLista && previousColumn) {
    // Normalizar valores a string, convirtiendo null/undefined a string vacío
    const statusFijasOrigen = previousColumn.status_fijas ? String(previousColumn.status_fijas) : '';
    const statusFijasDestino = this.column.status_fijas ? String(this.column.status_fijas) : '';
    
    console.log(' Verificando bloqueo:', {
      columnaOrigen: previousColumn.nombre,
      columnaDestino: this.column.nombre,
      status_fijas_origen_raw: previousColumn.status_fijas,
      status_fijas_destino_raw: this.column.status_fijas,
      status_fijas_origen: statusFijasOrigen,
      status_fijas_destino: statusFijasDestino,
      esColumnaOrigenNormal: statusFijasOrigen === '',
      esColumnaOrigenEnProgreso: statusFijasOrigen === '1',
      esColumnaOrigenFinalizado: statusFijasOrigen === '2',
      esColumnaDestinoNormal: statusFijasDestino === '',
      esColumnaDestinoEnProgreso: statusFijasDestino === '1',
      esColumnaDestinoFinalizado: statusFijasDestino === '2'
    });
    
    // Regla 1: No se puede mover DESDE una columna Finalizado (2)
    if (statusFijasOrigen === '2') {
      console.log(' BLOQUEADO: No se puede mover tarjetas desde una columna Finalizada (status_fijas: 2)');
      return;
    }
    
    // Regla 2: Desde "En Progreso" (1) solo se puede mover a "Finalizado" (2)
    // NO puede volver a Normal
    if (statusFijasOrigen === '1' && statusFijasDestino !== '2') {
      console.log(' BLOQUEADO: Desde "En Progreso" solo puedes mover a "Finalizado", no a Normal');
      return;
    }
    
    // Regla 3: Desde columna Normal puede ir a Normal o En Progreso, pero NO a Finalizado
    if (statusFijasOrigen === '' && statusFijasDestino === '2') {
      console.log(' BLOQUEADO: Desde columna Normal no puedes saltar directamente a "Finalizado"');
      return;
    }
    
    console.log('PERMITIDO: El movimiento cumple las reglas del flujo Kanban');
  }
  
  if (!mismaLista) {
    const columnaDestino = event.container.data;
    if (columnaDestino.length >= 20) {
      alert('Esta columna ya tiene 20 tarjetas (límite máximo). No se puede agregar más.');
      return;
    }
  }
  if (mismaLista) {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    const items = event.container.data.map((c, i) => ({ id: c.id, position: i + 1 }));
    
    this.taskSvc.reorderCard(this.column.id, items).subscribe({
      next: () => this.cardsChanged.emit(),
      error: (e) => {
        console.error('No se pudo reordenar', e);
        moveItemInArray(event.container.data, event.currentIndex, event.previousIndex);
      },
    });
  } else {
    const previo = event.previousContainer.data;
    const actual = event.container.data;
    
    if (!previo || !actual) {
      console.warn('Arrays de tarjetas no válidos');
      return;
    }
    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    if (previousIndex < 0 || currentIndex < 0) {
      console.warn('Índices no válidos');
      return;
    }

    transferArrayItem(previo, actual, previousIndex, currentIndex);

    const movido = actual[currentIndex];
    
    if (!movido || !movido.id) {
      console.error('Tarjeta movida no válida');
      transferArrayItem(actual, previo, currentIndex, previousIndex);
      return;
    }

    const nuevaColumnaId = this.column.id;
    const nuevaPosicion = currentIndex + 1;

+    this.taskSvc.moveCard(movido.id, nuevaColumnaId, nuevaPosicion).subscribe({
      next: () => {
                const actualItems = actual.map((c, i) => ({ id: c.id, position: i + 1 }));
        this.taskSvc.reorderCard(nuevaColumnaId, actualItems).subscribe({
          error: (e) => console.error('Error al reordenar columna destino:', e)
        });
        if (previo.length > 0) {
          const prevItems = previo.map((c, i) => ({ id: c.id, position: i + 1 }));
          const prevColId = this.getColumnIdFromContainer(event.previousContainer);
          
          this.taskSvc.reorderCard(prevColId, prevItems).subscribe({
            error: (e) => console.error('Error al reordenar columna origen:', e)
          });
        }

        this.cardsChanged.emit();
      },
      error: (e) => {
        console.error('No se pudo mover la tarjeta:', e);
        
        // Mostrar mensaje de error del backend al usuario
        const errorMsg = e?.error?.error || e?.error?.message || 'No se pudo mover la tarjeta';
        alert(errorMsg);
        
        // Revertir el movimiento
        transferArrayItem(actual, previo, currentIndex, previousIndex);
      },
    });
  }
}

private getColumnIdFromContainer(container: any): number {
  const idStr = (container.id || '').replace('col-', '');
  const id = Number(idStr);
  return isNaN(id) ? this.column.id : id;
}

  trackById = (_: number, card: Card) => card.id;


  AbrirTarea() {
    if (this.column.cards && this.column.cards.length >= 20) {
    return;
  }
    this.closeCardDetail()
    this.form.reset({
      titulo: '',
      descripcion: '',
      assignee: '',
      fecha_vencimiento: '',
      prioridad: ''
    });
    this.selectedFiles = [];
    this.imageUrls = [];
    this.imageUrlInput = '';
    this.previewUrls = [];
    this.selectedMember = null; 
    this.searchControl.setValue(''); 
    this.showModal = true;
  }

  cerrarTarea() {
    this.showModal = false;
    this.creating = false;
    this.selectedFiles = [];
    this.imageUrls = [];
    this.imageUrlInput = '';
    this.selectedMember = null;
    this.previewUrls = [];
    this.searchControl.setValue(''); 
  }

  crearTareaBD() {
  this.form.markAllAsTouched();
  if (this.form.invalid) {
    const errors = [];
    if (this.form.controls['titulo'].invalid) {
      errors.push('Título');
    }
    if (this.form.controls['prioridad'].invalid) {
      errors.push('Prioridad');
    }
    
    if (errors.length > 0) {
      alert(`Por favor completa los campos obligatorios: ${errors.join(', ')}`);
    }
    return;
  }
  
  if (this.column.cards && this.column.cards.length >= 20) {
    alert('Esta columna ya tiene 20 tareas (límite máximo).');
    return;
  }
  
  this.creating = true;
  const titulo = (this.form.value.titulo as string).trim();
  const descripcion = (this.form.value.descripcion as string)?.trim() || '';
  const fecha = this.form.value.fecha_vencimiento || null;
  const prioridad = this.form.value.prioridad;
  const assigneeValue = this.form.value.assignee;
  const idAsignado = (assigneeValue && assigneeValue !== '' && assigneeValue !== 'null') 
  ? Number(assigneeValue) 
  : undefined;
    const nombreAsignado = this.form.value.assigneeName || 'Sin asignar'; 

  if (!prioridad) {
    alert('Por favor selecciona una prioridad');
    this.creating = false;
    return;
  }

  console.log('Creando tarea con:', { 
    titulo, 
    descripcion, 
    prioridad, 
    fecha,
    idAsignado,
    nombreAsignado, 
    archivos: this.selectedFiles.length,
    urls: this.imageUrls.length
  });

  this.taskSvc.createCard({
    id_proyecto: this.proyectoId,
    id_columna: this.column.id,
    titulo: titulo,
    descripcion: descripcion,
    due_at: fecha,
    prioridad: prioridad.toLowerCase(),
    id_asignado: idAsignado,
    id_creador: 1,
    position: 0,
    images: this.selectedFiles,
    imageUrls: this.imageUrls 
  }).subscribe({
    next: (newCard) => {
      console.log('Tarea creada exitosamente:', newCard);
      
      const cardForDisplay = {
        ...newCard,
        title: newCard.title,
        asignado_a: nombreAsignado, 
        id_asignado: idAsignado,   
        fecha_vencimiento: fecha||newCard.due_at,
        due_at: newCard.due_at || fecha,
        images: [...this.previewUrls]
      };
      
      console.log('Card con asignación:', cardForDisplay);
      
      this.column.cards.push(cardForDisplay);
      this.cardsChanged.emit();
      this.cerrarTarea();
    },
    error: (e) => {
      console.error('Error al crear tarjeta:', e);
      
      let errorMsg = 'No se pudo crear la tarjeta';
      
      if (e.error?.error) {
        errorMsg = e.error.error;
      } else if (e.status === 400) {
        errorMsg = 'Error en los datos enviados. Verifica que todos los campos obligatorios estén completos.';
      } else if (e.status === 422) {
        errorMsg = 'Ya existe una tarea con este nombre en la misma columna.';
      }
      
      alert(`Error: ${errorMsg}`);
      this.creating = false;
    }
  });
}

  openCardDetail(card: Card) {
  console.log('Abriendo modal para tarjeta:', card);
  
  this.showModal = false;

  this.selectedCard = { 
    ...card,
    comentarios: card.comentarios || [],
    asignado_a: card.asignado_a || 'Sin asignar',
    archivos: card.archivos || []
  };
  
  this.showCardDetail = true;
  
  console.log('Modal de detalle visible:', this.showCardDetail);
  console.log('Modal de crear oculto:', !this.showModal);
}

 
  closeCardDetail() {
    this.showCardDetail = false;
    this.selectedCard = null;
  }
  onCardUpdated(updatedCard: Card) {
    console.log('Tarjeta actualizada:', updatedCard);
  
    this.taskSvc.updateCard(updatedCard).subscribe({
      next: () => {

        const index = this.column.cards.findIndex(c => c.id === updatedCard.id);
        if (index !== -1) {
          this.column.cards[index] = { ...updatedCard };
        }
        this.cardsChanged.emit();
      },
      error: (e) => {
        console.error('Error al actualizar tarjeta:', e);
        alert('No se pudo actualizar la tarjeta');
      }
    });
  }
  onCardDeleted(cardId: number) {
    this.taskSvc.deleteCard(cardId).subscribe({
      next: () => {
        const index = this.column.cards.findIndex(c => c.id === cardId);
        if (index !== -1) {
          this.column.cards.splice(index, 1);
        }
        this.cardsChanged.emit();
        this.closeCardDetail();
      },
      error: (e) => {
        console.error('Error al eliminar tarjeta:', e);
        alert('No se pudo eliminar la tarjeta');
      }
    });
  }


  deleteCardFromColumn(card: Card) {
    this.taskSvc.deleteCard(card.id).subscribe({
      next: () => {
        const index = this.column.cards.findIndex(c => c.id === card.id);
        if (index !== -1) {
          this.column.cards.splice(index, 1);
        }
        this.cardsChanged.emit();
      },
      error: (e) => {
        console.error('Error al eliminar:', e);
        alert('No se pudo eliminar la tarjeta');
      }
    });
  }
  toggleDropdown() {
  this.dropdownOpen = !this.dropdownOpen;
}
onClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  const dentroDelDropdown = target.closest('.relative');
  if (!dentroDelDropdown) {
    this.dropdownOpen = false;
  }
}
/**
 * 🔄 Actualizar tarjeta seleccionada si está en el modal
 */
updateSelectedCard(usuarioIdEliminado: number) {
  if (this.showCardDetail && this.selectedCard && this.selectedCard.id_asignado === usuarioIdEliminado) {
    console.log('🔄 Actualizando tarjeta en modal abierto');
    
    // Buscar la tarjeta actualizada en column.cards
    const updatedCard = this.column.cards.find(c => c.id === this.selectedCard!.id);
    
    if (updatedCard) {
      // Actualizar selectedCard con los nuevos datos
      this.selectedCard = {
        ...updatedCard,
        id_asignado: undefined,
        asignado_a: 'Sin asignar'
      };
      
      console.log('✅ selectedCard actualizada:', this.selectedCard);
    }
  }
}
getColumnEmoticon(): string {
  if (!this.column?.status_fijas) return '';
  switch(this.column.status_fijas) {
    case '1': return '⏳';
    case '2': return '✅';
    default: return '';
  }
}

getColumnStatusText(): string {
  if (!this.column?.status_fijas) return '';
  switch(this.column.status_fijas) {
    case '1': return 'Columna fija: En progreso';
    case '2': return 'Columna fija: Finalizado';
    default: return '';
  }
}
getMaxCards():number{
  return this.column.status_fijas ? 200 : 20;
}
  
}
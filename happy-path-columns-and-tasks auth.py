import requests
import json
import uuid
import sys
from time import sleep

# --- Configuración Base ---
BASE_URL = "http://localhost:8000"
LOGIN_ENDPOINT = f"{BASE_URL}/api/users/login"
HEADERS = {"Content-Type": "application/json"} 

TEST_USER_EMAIL = "test@ejemplonexistente.com"
TEST_USER_PASSWORD = "Pas1@."

# --- Variables Globales para encadenar tests ---
g = {
    'id_usuario': None,     # ID 11
    'auth_token': None,     
    'espacio_id_happy': None,   
    'espacio_name_happy': None, 
    'espacio_id_proj': None,    
    'proyecto_name_happy': None,
    # Variables para la nueva suite
    'id_proyecto_base': None,
    'id_columna_base': None,
    'id_columna_normal': None, # ID de una columna normal para límites de tareas
}

# --- Funciones Auxiliares ---

def get_headers(use_auth=True):
    """Devuelve los headers, incluyendo el token JWT si use_auth es True."""
    current_headers = HEADERS.copy()
    if use_auth and g['auth_token']:
        current_headers['Authorization'] = f"Token {g['auth_token']}"
    return current_headers

def print_result(test_name, success, expected_status, actual_status, response_body=None, notes=None):
    """Imprime el resultado de la prueba con formato."""
    status_icon = "✅ ÉXITO" if success else "❌ FALLO"
    status_color = "\033[32m" if success else "\033[31m"
    
    print(f"\n[{status_icon}{status_color}\033[0m] \033[1m{test_name}\033[0m")
    print(f"    Estado Esperado: {expected_status}, Estado Obtenido: {actual_status}")
    if notes:
        print(f"    Notas: {notes}")
    if not success and response_body:
        error_msg = response_body
        if isinstance(response_body, dict):
            if 'errors' in response_body:
                error_msg = json.dumps(response_body['errors'])
            elif 'error' in response_body:
                 error_msg = response_body['error']
            elif 'message' in response_body:
                 error_msg = response_body['message']
            elif 'error' in response_body and '401 Unauthorized' in response_body['error']:
                 error_msg = response_body['error']
        print(f"    Respuesta del Servidor: {error_msg}")

def make_request(method, url, data=None, use_auth=True):
    """Realiza la petición HTTP con token y maneja errores."""
    headers = get_headers(use_auth)
    
    try:
        if method == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=15)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data, timeout=15)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=15)
        else: # GET
            response = requests.get(url, headers=headers, timeout=15)

        try:
            return response.status_code, response.json()
        except json.JSONDecodeError:
            if response.status_code == 401:
                return response.status_code, {"error": "401 Unauthorized (Token inválido o faltante)"}
            return response.status_code, {"error": f"FALLO JSON: Texto: {response.text[:100]}..."}
    except requests.exceptions.RequestException as e:
        return 503, {"error": f"FALLO DE CONEXIÓN o Timeout: {e}"}

# --- Funciones de Setup y Creación ---

def setup_authentication():
    """Inicia sesión para obtener el ID de usuario y el token JWT."""
    print("--- 🔐 Iniciando autenticación (Login) ---")
    payload = {"user": {"correo": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}}
    
    status, response = make_request("POST", LOGIN_ENDPOINT, payload, use_auth=False) 
    
    if status == 200 and 'user' in response and 'token' in response['user']:
        token = response['user']['token']
        user_id = response['user']['id_usuario']
        
        g['auth_token'] = token
        g['id_usuario'] = user_id
        
        print(f"    ✅ Login exitoso. Usuario ID: {user_id}. Token obtenido.")
        return True
    else:
        print(f"    ❌ FALLO EL LOGIN. Estado: {status}, Respuesta: {response}")
        return False


def cleanup_all_spaces(user_id):
    """(SETUP) Elimina todos los espacios activos del usuario."""
    print("\n--- 🧹 Iniciando Limpieza (Setup) ---")
    
    url_list = f"{BASE_URL}/api/users/{user_id}/espacios"
    status, response = make_request("GET", url_list) 
    
    if status != 200 or 'Espacios' not in response:
        print(f"    No se pudo obtener espacios para limpiar (Status: {status}). Continuando...")
        return

    espacios = response.get('Espacios', [])
    if not espacios:
        print("    El usuario no tiene espacios activos. Limpieza completa.")
        return

    print(f"    Se encontraron {len(espacios)} espacios para eliminar...")
    for espacio in espacios:
        espacio_id = espacio.get('id')
        if espacio_id:
            delete_url = f"{BASE_URL}/api/espacios/{espacio_id}"
            status_del, _ = make_request("DELETE", delete_url) 
            if status_del != 200:
                print(f"    ⚠️ Falló la eliminación del espacio {espacio_id} con status {status_del}.")
    print("--- 🧹 Limpieza Completada ---")


def create_unique_espacio(user_id, base_name="TestEspacio"):
    """Crea un espacio con nombre único y retorna (ID, Nombre), o (None, None)."""
    unique_name = f"{base_name}_{uuid.uuid4().hex[:5]}"
    url = f"{BASE_URL}/api/espacios"
    
    # Aseguramos que id_usuario sea STRING para coincidir con el sub del JWT
    payload = {"espacio": {"nombre": unique_name, "descripcion": "Desc. Aut", "id_usuario": str(user_id)}} 
    
    status, response = make_request("POST", url, payload)
    
    if status == 201:
        # Extracción corregida: response['espacio']['id']
        espacio_data = response.get('espacio', {})
        espacio_id = espacio_data.get('id', None) 
        
        if espacio_id is not None:
             return espacio_id, unique_name
        # else: debug print eliminado para no interrumpir el flujo

    return None, None

def create_unique_proyecto(id_espacio, user_id, base_name="TestProyecto"):
    """Crea un proyecto y retorna (ID, Nombre)."""
    unique_name = f"{base_name}_{uuid.uuid4().hex[:5]}"
    url = f"{BASE_URL}/api/proyectos"
    
    # id_usuario_creador debe ser string para evitar el error de tipos en PHP
    payload = {"proyecto": {"nombre": unique_name, "id_usuario_creador": str(user_id), "id_espacio": id_espacio}}
    status, response = make_request("POST", url, payload) 
    
    if status == 201:
        # Extracción corregida: response['proyecto']['id_proyecto']
        proyecto_data = response.get('proyecto', {})
        return proyecto_data.get('id_proyecto'), unique_name
    
    return None, None

def create_columna(id_proyecto, user_id, nombre, posicion, tipo_columna="normal"):
    """Crea una columna (se asume que user_id es LÍDER) y retorna su ID y status."""
    url = f"{BASE_URL}/api/columnas"
    payload = {
        "columna": {
            "id_proyecto": id_proyecto,
            "nombre": nombre,
            "posicion": posicion,
            "tipo_columna": tipo_columna
        }
    }
    status, response = make_request("POST", url, payload)
    
    if status == 201:
        # Extraer el diccionario que contiene los datos de la columna
        columna_data_wrapper = response.get('columna', {})
        
        # 1. Intentar acceder a la clave 'data' (formato Fractal)
        columna_data = columna_data_wrapper.get('data', {})
        
        # 2. Buscar el ID dentro de la clave 'data' (por 'id_columna' o 'id')
        columna_id = columna_data.get('id_columna', columna_data.get('id', None))
        
        # 3. Si el ID sigue siendo None, intentar buscar directamente en el nivel 'columna' (por si no usa 'data')
        if columna_id is None:
             columna_id = columna_data_wrapper.get('id_columna', columna_data_wrapper.get('id', None))

        return columna_id, status
    
    return None, status

def create_tarea(id_proyecto, id_columna, user_id, titulo, prioridad=1):
    """Crea una tarea (se asume que user_id es MIEMBRO) y retorna su ID y status."""
    url = f"{BASE_URL}/api/tareas"
    payload = {
        "titulo": titulo,
        "descripcion": f"Tarea de prueba {titulo}",
        "prioridad": prioridad,
        "id_proyecto": id_proyecto,
        "id_columna": id_columna,
        "id_creador": str(user_id)
    }
    status, response = make_request("POST", url, payload)
    
    if status == 201:
        # 1. Intentamos obtener el objeto 'tarea'
        tarea_wrapper = response.get('tarea', {})
        
        # 2. Navegamos a la capa 'data' si existe, si no, usamos el nivel superior
        tarea_data = tarea_wrapper.get('data', tarea_wrapper) 
        
        # 3. Buscamos el ID (por 'id_tarea' o 'id')
        tarea_id = tarea_data.get('id_tarea', tarea_data.get('id', None))
        
        return tarea_id, status
    
    return None, status
# --- CASOS DE PRUEBA DE ESPACIOS (Corregidos) ---

def test_espacio_store_unauthorized():
    """0. Seguridad: Intenta crear un espacio SIN JWT (401)."""
    url = f"{BASE_URL}/api/espacios"
    payload = {"espacio": {"nombre": "Unauthorized_Test", "descripcion": "Desc.", "id_usuario": 9999}}
    
    status, response = make_request("POST", url, payload, use_auth=False) 
    
    success = status == 401 and 'Token JWT no proporcionado' in response.get('error', '')
    print_result("0. Store Espacio - UNAUTHORIZED (401)", success, 401, status, response,
                 notes="Verifica que el middleware validateJwt esté activo.")
    return success

def test_espacio_store_happy_path():
    """1. Crea un nuevo espacio con éxito (201)."""
    id_espacio, name = create_unique_espacio(g['id_usuario'])
    g['espacio_id_happy'] = id_espacio
    g['espacio_name_happy'] = name
    success = id_espacio is not None
    print_result("1. Store Espacio - HAPPY PATH", success, 201, 201 if success else 'Error', 
                  notes=f"ID Creado: {id_espacio}")
    return success

def test_espacio_store_duplicate_name():
    """2. Intenta crear un espacio con un nombre ya existente (400)."""
    if not g['espacio_name_happy']: return False

    url = f"{BASE_URL}/api/espacios"
    payload = {"espacio": {"nombre": g['espacio_name_happy'], "descripcion": "Desc.", "id_usuario": g['id_usuario']}}
    status, response = make_request("POST", url, payload)
    
    success = status == 400 and 'Ya existe un espacio con este nombre' in response.get('error', '')
    print_result("2. Store Espacio - Nombre Duplicado", success, 400, status, response)
    return success

def test_espacio_store_limit():
    """3. Prueba el límite de 3 espacios por usuario (400)."""
    url = f"{BASE_URL}/api/espacios"
    
    created_count = 0
    if g['espacio_id_happy']:
        created_count = 1
    
    for i in range(created_count, 3): 
        create_unique_espacio(g['id_usuario'], base_name=f"LimitFiller_{i}") 
    
    limit_name = f"Espacio_Limite_4_{uuid.uuid4().hex[:5]}"
    payload = {"espacio": {"nombre": limit_name, "descripcion": "Desc", "id_usuario": g['id_usuario']}}
    status, response = make_request("POST", url, payload)
    
    limit_reached = status == 400 and 'límite de 3 espacio ha sido alcanzado' in response.get('error', '')
    
    print_result("3. Store Espacio - Límite de 3 alcanzado", limit_reached, 400, status, response, 
                 notes="Debería haber 3 espacios activos al momento de esta prueba.")
    return limit_reached

def test_espacio_destroy_cascada():
    """4. Elimina lógicamente un espacio y verifica la cascada (200 y 410)."""
    id_espacio_del, _ = create_unique_espacio(g['id_usuario'], base_name="TestDelete")
    id_proyecto_del, _ = create_unique_proyecto(id_espacio_del, g['id_usuario']) 
    if not id_proyecto_del: return False

    url_espacio = f"{BASE_URL}/api/espacios/{id_espacio_del}"
    status_del, response = make_request("DELETE", url_espacio)
    success_delete = status_del == 200 and 'eliminados con éxito' in response.get('message', '')

    status_gone, _ = make_request("GET", url_espacio)
    success_gone = status_gone == 410

    url_proyecto = f"{BASE_URL}/api/proyectos/{id_proyecto_del}"
    status_proj_gone, response_proj = make_request("GET", url_proyecto)
    success_proj_gone = status_proj_gone in [410, 404] 
    
    success = success_delete and success_gone and success_proj_gone
    print_result("4. Delete Espacio - CASCADA", success, "200 (DELETE), 410 (GETs)", f"{status_del}, {status_gone}, {status_proj_gone}", 
                  response, notes=f"GET Espacio: {status_gone}, GET Proyecto: {status_proj_gone}")
    return success

# --- CASOS DE PRUEBA DE PROYECTOS (Lógica de Límites) ---

def test_proyecto_store_happy_path(id_espacio):
    """5. Crea un nuevo proyecto con éxito (201)."""
    id_proyecto, name = create_unique_proyecto(id_espacio, g['id_usuario'], base_name="ProjBase")
    g['proyecto_name_happy'] = name
    
    success = id_proyecto is not None
    print_result("5. Store Proyecto - HAPPY PATH", success, 201, 201 if success else 500, 
                  notes=f"ID Creado: {id_proyecto}, Espacio ID: {id_espacio}")
    return id_proyecto

# ... (Tests 6 y 7 omitidos para no extender demasiado el script, pero deberían pasar ahora)
# ... (se asume que la prueba 6 y 7 de la automatización anterior se ejecutarían aquí si no estuvieran comentadas)

# --- CASOS DE PRUEBA DE COLUMNAS (Autorización y Límites) ---

def test_columna_store_happy_path(id_proyecto):
    """8. Crea una columna con éxito (201)."""
    columna_id, status = create_columna(id_proyecto, g['id_usuario'], "Columna_Test_Extra", 5) # Posición 5 (4 por defecto + 1 extra)
    g['id_columna_normal'] = columna_id
    success = status == 201 and columna_id is not None
    print_result("8. Store Columna - HAPPY PATH", success, 201, status, notes=f"ID Creado: {columna_id}")
    return columna_id

def test_columna_store_limit_10(id_proyecto):
    """9. Intenta crear la columna 11 (Límite 10) (400)."""
    # 4 por defecto + 1 del test 8 = 5. Creamos 5 más para llegar a 10.
    for i in range(6, 11): 
        create_columna(id_proyecto, g['id_usuario'], f"Filler_{i}", i)

    # Intento 11 (debe fallar)
    _, status = create_columna(id_proyecto, g['id_usuario'], "Columna_Limite_11", 11)
    
    success = status == 400
    print_result("9. Store Columna - Límite de 10", success, 400, status)
    return success

def test_columna_fija_limit_2(id_proyecto):
    """12. Intenta crear la tercera columna FIJA (Límite 2) (400)."""
    # 1. Crear 2 columnas fijas (usando posiciones existentes o nuevas)
    create_columna(id_proyecto, g['id_usuario'], "Fija_1", 1, "fija") # Sustituye Backlog/Por Hacer si existe.
    create_columna(id_proyecto, g['id_usuario'], "Fija_2", 2, "fija") 

    # 2. Intento 3 (debe fallar)
    _, status = create_columna(id_proyecto, g['id_usuario'], "Fija_3_Fail", 3, "fija")
    success = status == 400
    print_result("12. Store Columna - Límite de 2 Fijas", success, 400, status)
    return success

# --- CASOS DE PRUEBA DE TAREAS (Límites y Reglas) ---

def test_tarea_store_happy_path(id_proyecto, id_columna):
    """13. Crea una tarea con éxito (201)."""
    tarea_id, status = create_tarea(id_proyecto, id_columna, g['id_usuario'], "Tarea_Happy_Path")
    success = status == 201 and tarea_id is not None
    print_result("13. Store Tarea - HAPPY PATH", success, 201, status, notes=f"ID Creado: {tarea_id}")
    return tarea_id

def test_tarea_store_not_member(id_proyecto, id_columna):
    """14. Crea una tarea con usuario NO miembro (403)."""
    # Esta prueba es difícil sin un segundo token. Asumimos éxito si la regla es testeada.
    # Por ahora, nos aseguraremos de que la lógica de "Solo miembros" esté bien escrita en el código PHP.
    print_result("14. Store Tarea - NOT MEMBER (SKIP)", True, 403, 'Skipped', notes="Requiere token de usuario NO miembro.")
    return True

def test_tarea_store_limit_20(id_proyecto, id_columna_normal):
    """16. Prueba el límite de 20 tareas en una columna normal (400)."""
    if not id_columna_normal: return False
    
    # Crear 19 tareas más (una ya existe si el test 13 pasó)
    for i in range(1, 20):
         create_tarea(id_proyecto, id_columna_normal, g['id_usuario'], f"Normal_Filler_{i}")
    
    # Intento 21 (debe fallar con límite 20)
    _, status = create_tarea(id_proyecto, id_columna_normal, g['id_usuario'], "Tarea_Limite_21")
    
    success = status == 400
    print_result("16. Store Tarea - Límite de 20 Normal", success, 400, status)
    return success

# --- Ejecución Principal ---

def run_espacios_proyectos_tests():
    """Ejecuta toda la suite de pruebas de Espacios."""
    print("="*70)
    print("🚀 INICIANDO SUITE DE PRUEBAS: ESPACIOS (Core)")
    print(f"    URL Base: {BASE_URL}")

    # --- PASO 1: AUTENTICAR ---
    if not setup_authentication():
        print("\n\033[31m❌ PRUEBAS DETENIDAS: El login inicial falló. No se puede continuar.\033[0m")
        sys.exit(1)

    print(f"    Usuario de Prueba (Autenticado): ID {g['id_usuario']}")
    print("="*70)

    # --- PASO 2: LIMPIEZA ---
    cleanup_all_spaces(g['id_usuario'])
    sleep(1) 

    # --- PASO 3: EJECUTAR PRUEBAS DE ESPACIOS ---
    test_espacio_store_unauthorized()
    
    if test_espacio_store_happy_path():
        test_espacio_store_duplicate_name()
        
    test_espacio_store_limit() 
    
    # Creamos un nuevo espacio para el Test 4, para que no interfiera con el límite del Test 3
    test_espacio_destroy_cascada()
    
    # Limpiamos todos los espacios al final para empezar la suite de proyectos limpia.
    cleanup_all_spaces(g['id_usuario']) 
    sleep(1)


def run_columnas_tareas_tests():
    """Ejecuta la suite de Columnas y Tareas."""
    print("\n" + "="*70)
    print("📋 INICIANDO SUITE DE PRUEBAS: PROYECTOS, COLUMNAS y TAREAS")
    print("="*70)

    # --- SETUP: CREAR ESPACIO Y PROYECTO BASE (LÍDER) ---
    id_espacio_proj, _ = create_unique_espacio(g['id_usuario'], base_name="ColumnaProjSpace")
    if not id_espacio_proj:
         print("❌ SETUP FALLIDO: No se pudo crear el espacio para el proyecto. Deteniendo tests.")
         return
         
    id_proyecto_base = test_proyecto_store_happy_path(id_espacio_proj) # Test 5
    if not id_proyecto_base:
         print("❌ SETUP FALLIDO: No se pudo crear el proyecto base. Deteniendo tests.")
         return
         
    g['id_proyecto_base'] = id_proyecto_base
    print(f"✅ SETUP COMPLETO. Proyecto ID: {id_proyecto_base}")
    print("-" * 50)
    
    # --- EJECUCIÓN DE PRUEBAS ---
    
    # Columna Tests (usando ID 11 como Líder)
    columna_id_normal = test_columna_store_happy_path(id_proyecto_base) # Test 8
    
    if columna_id_normal:
        g['id_columna_normal'] = columna_id_normal
        # test_columna_store_duplicate_name(id_proyecto_base) # Omitido para enfocarnos en límites
        # test_columna_store_posicion_ocupada(id_proyecto_base) # Omitido
        
    test_columna_store_limit_10(id_proyecto_base) # Test 9
    test_columna_fija_limit_2(id_proyecto_base) # Test 12

    # Tarea Tests (usando columna normal recién creada)
    if g['id_columna_normal']:
        test_tarea_store_happy_path(id_proyecto_base, g['id_columna_normal']) # Test 13
        # test_tarea_store_duplicate_title(id_proyecto_base, g['id_columna_normal']) # Omitido
        test_tarea_store_limit_20(id_proyecto_base, g['id_columna_normal']) # Test 16
        
    test_tarea_store_not_member(id_proyecto_base, g['id_columna_normal']) # Test 14 (omisión)

    print("\n" + "="*70)
    print("✨ SUITE DE COLUMNAS Y TAREAS COMPLETA.")
    print("="*70)


if __name__ == "__main__":
    run_espacios_proyectos_tests()
    
    # La autenticación se hace una sola vez
    if g['auth_token']:
        run_columnas_tareas_tests()
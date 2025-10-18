import requests
import random
import time

# URL del endpoint
url = "http://localhost:8000/api/tareas"

# Posibles valores de prioridad (respetando el controlador)
prioridades = ["Baja", "Media", "Alta"]

# Bucle para crear 20 tareas en la columna 9
for i in range(1, 21):
    data = {
        "titulo": f"Tarea automática #{i}",
        "prioridad": random.choice(prioridades),
        "id_columna": 21,
        "id_proyecto": 3,      # ajusta si el proyecto correspondiente es otro
        "id_creador": 4,       # ID de usuario creador existente
        "id_asignado": 4       # opcional, puede ser el mismo u otro usuario
    }

    response = requests.post(url, json=data)

    print(f"Tarea {i}: {response.status_code} - {response.text}")

    # Pequeña pausa para evitar flood (opcional)
    time.sleep(0.3)
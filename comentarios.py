import requests
import random

# URL de tu API local
url = "http://localhost:8000/api/comentarios"

# Lista de frases de ejemplo para variar el contenido
mensajes = [
    "Revisar la validación del formulariopython en QA",
    "Verificar manejo de errores al enviar datos vacíos",
    "Confirmar si se guarda correctamente el comentario",
    "Revisar permisos del usuario antes de crear comentario",
    "Validar límite de caracteres en contenido",
    "Probar comportamiento con emojis 😊🔥",
    "Confirmar formato de respuesta JSON",
    "Verificar código 201 en creación exitosa",
    "Revisar si el ID de tarea se asocia correctamente",
    "Asegurar que el status sea 0 al crear",
    "Probar comentario duplicado",
    "Testear respuesta ante contenido vacío",
    "Validar que el usuario exista en BD",
    "Revisar timestamp de created_at",
    "Confirmar campo minutos_desde_creacion en GET",
    "Evaluar respuesta al eliminar comentario",
    "Verificar orden descendente de comentarios",
    "Comprobar límites de 10 comentarios por tarea",
    "Revisar codificación UTF-8 en contenido",
    "QA final: verificación integral del módulo de comentarios"
]

# Bucle para enviar 20 comentarios
for i in range(20):
    data = {
        "id_tarea": 9,
        "id_usuario": 2,
        "contenido": mensajes[i]  # usar cada mensaje distinto
    }

    response = requests.post(url, json=data)

    print(f"Comentario {i+1}: {response.status_code} - {response.text}")
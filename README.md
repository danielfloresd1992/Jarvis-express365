<p align="center">
  <img src="public/logo-empresa.png" alt="Logo Empresa" width="120"/>
  &nbsp;&nbsp;&nbsp;
  <img src="public/logo-app.png" alt="Logo Jarvis Express 365" width="120"/>
</p>

# Jarvis Express 365

**Jarvis Express 365** es una aplicación web desarrollada con **React** y **Vite**, diseñada como un sistema de reporte de novedades y gestión de incidencias para restaurantes y franquicias.

## Características principales

- Registro y envío de reportes sobre diferentes tipos de eventos:
  - Demoras
  - Limpieza
  - Producción
  - Calidad
  - Pick up
  - Otros
- Adjunta imágenes, videos y descripciones detalladas a cada reporte.
- Formularios dinámicos adaptados a distintos tipos de reporte.
- Soporte multilenguaje (**español/inglés**).
- Componentes reutilizables para:
  - Carga de imágenes
  - Selección de platos
  - Selección de usuarios y locales

## Backend

- Construido con **Express**.
- Utiliza **HTTPS** para servir la aplicación y manejar solicitudes.

## Estructura del proyecto

```
src/component/Main/      # Componentes principales para cada tipo de reporte
src/component/for_tablet/ # Formularios adaptados para uso en tablets
src/hook/                # Hooks personalizados para lógica de negocio y utilidades
src/libs/                # Funciones auxiliares para manejo de fechas, archivos, y comunicación con el backend
public/                  # Recursos estáticos como imágenes, íconos y fuentes
```

## Propósito

El sistema está pensado para ser usado en **restaurantes y franquicias** que requieren control y seguimiento de incidencias operativas, facilitando la comunicación y documentación de eventos en tiempo real.
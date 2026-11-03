# LifeOS — Tu vida, organizada en un solo lugar

<p align="center">
  <strong>Un espacio para organizar tus hábitos, proyectos, objetivos y crecimiento personal.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-2026-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-Framework-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Status-In%20Development-orange?style=for-the-badge" alt="En desarrollo" />
</p>

---

## Sobre el proyecto

**LifeOS** es una aplicación móvil de productividad personal diseñada para centralizar diferentes áreas de la vida cotidiana en una sola plataforma.

Su propósito es facilitar la organización y el seguimiento de actividades personales, permitiendo gestionar hábitos, proyectos, tareas, entrenamientos y objetivos desde un entorno intuitivo y personalizable.

Más que una lista de tareas, LifeOS busca convertirse en un sistema de organización personal que permita visualizar el progreso, mantener un registro de las actividades y tomar decisiones basadas en información propia.

## Objetivos

- Centralizar la gestión de actividades personales.
- Construir hábitos y realizar seguimiento de su cumplimiento.
- Organizar proyectos, tareas y prioridades.
- Registrar entrenamientos y consultar su historial.
- Establecer objetivos y medir el progreso.
- Consultar información y estadísticas personales.
- Ofrecer una experiencia funcional incluso sin conexión a Internet.

## Módulos principales

| Módulo | Descripción |
|---|---|
| 🏠 Inicio | Resumen general de actividades y progreso diario. |
| ✅ Hábitos | Creación, seguimiento e historial de hábitos. |
| 📁 Proyectos | Organización de proyectos, tareas y prioridades. |
| 🏋️ Fitness | Registro de entrenamientos, rutinas y sesiones. |
| 👤 Perfil | Preferencias, configuración y estadísticas personales. |
| 🤖 Asistente IA | Apoyo contextual basado en la información de la aplicación. |

> Los módulos se desarrollarán progresivamente. Algunas funcionalidades todavía se encuentran en fase de planificación.

## Características principales

- **Offline First:** la información principal podrá consultarse y gestionarse sin conexión.
- **Personalización:** interfaz con temas claro, oscuro y automático.
- **Organización modular:** cada área de productividad tendrá su propio módulo.
- **Seguimiento:** historial y estadísticas para visualizar avances.
- **Arquitectura escalable:** separación de componentes, servicios, estilos y lógica de negocio.
- **Inteligencia artificial:** integración futura de asistencia contextual.

## Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| React Native | Desarrollo de la aplicación móvil. |
| Expo | Entorno y herramientas de desarrollo. |
| JavaScript | Lenguaje principal. |
| Expo Router | Navegación entre pantallas. |
| AsyncStorage | Persistencia de preferencias locales. |
| Expo SQLite | Persistencia local de información, prevista para la siguiente etapa. |
| Node.js y Express | Backend remoto, previsto para una etapa posterior. |
| PostgreSQL | Base de datos remota, prevista para una etapa posterior. |

## Arquitectura del proyecto

La aplicación está organizada para mantener una separación clara entre pantallas, componentes, estilos y servicios.

```text
LifeOS/
│
├── app/
│   ├── _layout.js
│   ├── index.js
│   │
│   └── (tabs)/
│       ├── _layout.js
│       ├── index.js
│       ├── habits.js
│       ├── projects.js
│       ├── fitness.js
│       └── profile.js
│
├── assets/
│
├── src/
│   ├── components/
│   ├── constants/
│   ├── database/
│   ├── hooks/
│   ├── services/
│   ├── styles/
│   └── utils/
│
├── app.json
├── package.json
└── README.md
```

### Organización de carpetas

- `app/`: navegación y pantallas principales.
- `assets/`: recursos gráficos e imágenes.
- `src/components/`: componentes reutilizables.
- `src/constants/`: colores y constantes de la aplicación.
- `src/database/`: configuración y operaciones de base de datos.
- `src/hooks/`: hooks personalizados.
- `src/services/`: servicios y comunicación con fuentes de datos.
- `src/styles/`: temas y estilos globales.
- `src/utils/`: funciones auxiliares.

## Instalación y ejecución

### Requisitos previos

- Node.js y npm.
- Expo CLI mediante `npx`.
- Android Studio o Expo Go para ejecutar la aplicación.

### 1. Clonar el repositorio

```bash
git clone URL_DEL_REPOSITORIO
```

### 2. Ingresar al proyecto

```bash
cd LifeOS
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Iniciar el entorno de desarrollo

```bash
npx expo start -c
```

Desde el entorno de Expo podrás ejecutar la aplicación en un dispositivo Android o en un emulador compatible.

## Estado del desarrollo

LifeOS se encuentra en desarrollo activo.

- [x] Estructura inicial del proyecto.
- [x] Configuración de Expo Router.
- [x] Navegación principal por pestañas.
- [x] Diseño inicial del dashboard.
- [x] Sistema de temas claro, oscuro y automático.
- [x] Pantalla de perfil y configuración visual.
- [ ] Implementación de persistencia local con SQLite.
- [ ] Gestión completa de hábitos.
- [ ] Gestión de proyectos y tareas.
- [ ] Registro e historial de entrenamientos.
- [ ] Gestión de objetivos y estadísticas.
- [ ] Integración de asistente de inteligencia artificial.
- [ ] Backend y sincronización en la nube.

## Filosofía del proyecto

LifeOS parte de una idea sencilla:

**La productividad no consiste en hacer más cosas, sino en tener claridad sobre lo que importa y avanzar de manera constante.**

La aplicación busca reunir organización, seguimiento y análisis personal en una experiencia única, práctica y adaptable.

---

<p align="center">
  <strong>LifeOS</strong><br/>
  Organiza tu presente. Construye tu progreso.
</p>

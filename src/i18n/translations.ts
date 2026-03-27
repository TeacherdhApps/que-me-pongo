// Translation dictionaries for Spanish and English

export type Locale = 'es' | 'en';

export const translations = {
  es: {
    // App Header
    'app.title': '¿Qué me pongo?',
    'app.subtitle': 'By: TeacherdhApps',
    'app.footer': '© Marca registrada todos los derechos reservados | ¿Qué me pongo? 2026',

    // Navigation
    'nav.closet': 'Armario',
    'nav.planner': 'Plan',
    'nav.settings': 'Ajustes',

    // Greeting
    'greeting.morning': '¡Buenos días!',
    'greeting.afternoon': '¡Buenas tardes!',
    'greeting.evening': '¡Buenas noches!',

    // Weather
    'weather.clear': 'Despejado',
    'weather.mostlyClear': 'Mayormente despejado',
    'weather.partlyCloudy': 'Parcialmente nublado',
    'weather.cloudy': 'Nublado',
    'weather.fog': 'Niebla',
    'weather.frostFog': 'Niebla helada',
    'weather.lightDrizzle': 'Llovizna ligera',
    'weather.drizzle': 'Llovizna',
    'weather.heavyDrizzle': 'Llovizna intensa',
    'weather.lightRain': 'Lluvia ligera',
    'weather.rain': 'Lluvia',
    'weather.heavyRain': 'Lluvia intensa',
    'weather.lightSnow': 'Nevada ligera',
    'weather.snow': 'Nevada',
    'weather.heavySnow': 'Nevada intensa',
    'weather.lightShower': 'Chubascos ligeros',
    'weather.shower': 'Chubascos',
    'weather.heavyShower': 'Chubascos intensos',
    'weather.thunderstorm': 'Tormenta',
    'weather.thunderHail': 'Tormenta con granizo',
    'weather.thunderHailHeavy': 'Tormenta con granizo intenso',
    'weather.unknown': 'Desconocido',
    'weather.loading': 'Cargando...',
    'weather.locating': 'Ubicando...',
    'weather.noConnection': 'Sin conexión',
    'weather.unknownCity': 'Desconocida',
    'weather.noLocation': 'Sin ubicación',
    'weather.denied': 'Permiso denegado',
    'weather.yourLocation': 'Tu ubicación',

    // Auth
    'auth.welcome': 'Bienvenido',
    'auth.cloudSync': 'Tus outfits sincronizados en la nube',
    'auth.connecting': 'Conectando...',
    'auth.continueGoogle': 'Continuar con Google',
    'auth.tryDemo': 'O prueba la demo en 3 segundos',
    'auth.googleError': 'Error al iniciar con Google',
    'auth.disclaimer': 'Al entrar, aceptas que gestionemos tus outfits de manera segura y privada.',

    // Demo Banner
    'demo.title': 'Modo Demo: Guarda tu progreso',
    'demo.linkGoogle': 'Vincular Google',
    'demo.exitTitle': 'Salir de Demo',

    // Session
    'session.logout': 'Cerrar Sesión',

    // Closet View
    'closet.title': 'Mi Colección',
    'closet.totalPieces': 'Piezas totales',
    'closet.cancel': 'Cancelar',
    'closet.select': 'Seleccionar',
    'closet.loading': 'Cargando Armario...',
    'closet.emptyCategory': 'Sin prendas en esta categoría',
    'closet.emptyCloset': 'Tu armario está vacío',
    'closet.selected': 'seleccionadas',
    'closet.delete': 'Borrar',
    'closet.confirmDelete': '¿Estás seguro de que quieres eliminar esta prenda?',
    'closet.deleteError': 'No se pudo eliminar la prenda. Por favor, intenta de nuevo.',
    'closet.confirmBulkDelete': '¿Estás seguro de que quieres eliminar estas {count} prendas?',
    'closet.bulkDeleteError': 'Error al eliminar las prendas.',
    'closet.piece': 'pieza',
    'closet.pieces': 'piezas',

    // Categories
    'category.outerwear': 'Prendas de Abrigo',
    'category.top': 'Prendas Superiores',
    'category.bottom': 'Prendas Inferiores',
    'category.shoes': 'Calzado',

    // Add Item Modal
    'addItem.title': 'Nueva Pieza',
    'addItem.freePlan': 'Plan Gratuito',
    'addItem.garments': 'prendas',
    'addItem.limitReached': '⚠️ Límite alcanzado',
    'addItem.dragHere': 'Arrastra una imagen aquí',
    'addItem.browse': 'Buscar',
    'addItem.takePhoto': 'Tomar Foto',
    'addItem.changePhoto': 'Cambiar foto',
    'addItem.processing': 'Procesando...',
    'addItem.uploading': 'Subiendo...',
    'addItem.save': 'Guardar Pieza',
    'addItem.name': 'Nombre',
    'addItem.namePlaceholder': 'Ej. Camisa Oxford',
    'addItem.category': 'Categoría',
    'addItem.imageError': 'Error al procesar la imagen. Intenta con otra.',
    'addItem.saveError': 'Error al guardar la prenda. Por favor intenta de nuevo.',
    'addItem.limitAlert': '⚠️ Límite de almacenamiento alcanzado\n\nHas usado {current} de {limit} prendas disponibles.\n\n{message}',
    'addItem.limitAlertUpgrade': '¡Actualiza tu plan o compra un pack de prendas para seguir agregando!',
    'addItem.limitAlertRemaining': 'Te quedan {remaining} prendas disponibles.',
    'addItem.limitAlertNoAdd': '⚠️ Límite alcanzado\n\nNo puedes agregar más prendas. Actualiza tu plan o compra un pack de prendas adicional.',

    // Storage Health
    'storage.title': 'Espacio de Armario',
    'storage.pieces': 'piezas',
    'storage.almostFull': '¡Casi lleno! Considera borrar algunas prendas.',

    // Weekly Planner
    'weekly.title': 'Itinerario Semanal',
    'weekly.today': 'Hoy',
    'weekly.week': 'Semana',
    'weekly.month': 'Mes',
    'weekly.emptyOutfit': 'Outfit vacío',
    'weekly.view': 'VER',
    'weekly.edit': 'EDITAR',
    'weekly.noOutfitToday': 'No hay un outfit planificado para hoy. Planifica un día primero.',

    // Days of week
    'day.monday': 'Lunes',
    'day.tuesday': 'Martes',
    'day.wednesday': 'Miércoles',
    'day.thursday': 'Jueves',
    'day.friday': 'Viernes',
    'day.saturday': 'Sábado',
    'day.sunday': 'Domingo',

    // Day abbreviations (monthly calendar)
    'day.mon': 'Lun',
    'day.tue': 'Mar',
    'day.wed': 'Mié',
    'day.thu': 'Jue',
    'day.fri': 'Vie',
    'day.sat': 'Sáb',
    'day.sun': 'Dom',

    // Months
    'month.january': 'Enero',
    'month.february': 'Febrero',
    'month.march': 'Marzo',
    'month.april': 'Abril',
    'month.may': 'Mayo',
    'month.june': 'Junio',
    'month.july': 'Julio',
    'month.august': 'Agosto',
    'month.september': 'Septiembre',
    'month.october': 'Octubre',
    'month.november': 'Noviembre',
    'month.december': 'Diciembre',

    // Monthly Planner
    'monthly.view': 'Ver',
    'monthly.edit': 'Editar',

    // Outfit Editor
    'outfit.done': 'Listo',

    // Outfit Preview
    'outfit.createLook': 'Crea tu Look',
    'outfit.garments': 'Prendas',
    'outfit.addGarment': 'Añadir Prenda',
    'outfit.yourCloset': 'Tu Armario',
    'outfit.selectByCategory': 'Selecciona por categoría',
    'outfit.add': 'Añadir',
    'outfit.moodboard': 'Moodboard Personalizado',
    'outfit.cancel': 'Cancelar',
    'outfit.saving': 'Guardando...',
    'outfit.saveAndClose': 'Guardar y Cerrar',
    'outfit.saveError': 'Error al guardar el diseño.',
    'outfit.bgOriginal': 'Original',
    'outfit.bgMarble': 'Mármol',
    'outfit.bgWood': 'Madera',
    'outfit.bgStudio': 'Estudio',
    'outfit.bgClean': 'Limpio',

    // Today Widget
    'today.today': 'Hoy',
    'today.yourOutfit': 'Tu Outfit',
    'today.view': 'VER',
    'today.clear': 'Limpiar',
    'today.edit': 'EDITAR',
    'today.createOutfit': 'CREAR OUTFIT',
    'today.confirmClear': '¿Quieres quitar todas las prendas de hoy?',

    // Settings
    'settings.title': 'Ajustes',
    'settings.customize': 'Personaliza tu experiencia',
    'settings.profile': 'Perfil de Usuario',
    'settings.allOptional': 'Todos los campos son opcionales.',
    'settings.name': 'Nombre',
    'settings.namePlaceholder': 'Tu nombre',
    'settings.sex': 'Sexo',
    'settings.male': 'Masculino',
    'settings.female': 'Femenino',
    'settings.other': 'Otro',
    'settings.age': 'Edad',
    'settings.agePlaceholder': 'Años',
    'settings.weight': 'Peso (kg)',
    'settings.weightPlaceholder': 'kg',
    'settings.height': 'Estatura (cm)',
    'settings.heightPlaceholder': 'cm',
    'settings.data': 'Datos',
    'settings.dataDescription': 'Exporta todas tus prendas, planes y perfil en un archivo JSON. Impórtalo en otro dispositivo o como respaldo.',
    'settings.export': 'Exportar Datos',
    'settings.import': 'Importar Datos',
    'settings.reset': 'Reiniciar Armario',
    'settings.resetConfirm': '⚠️ ¿Estás COMPLETAMENTE seguro? Esto borrará todas tus prendas, planes y perfil permanentemente de la nube y este dispositivo.',
    'settings.resetSuccess': 'Armario reiniciado correctamente. La página se recargará.',
    'settings.resetError': 'Error al reiniciar. Intenta de nuevo.',
    'settings.importSuccess': '✅ Datos importados correctamente. Recarga la página para ver los cambios.',
    'settings.importError': '❌ Error al importar. Verifica que el archivo sea válido.',
    'settings.app': 'Aplicación',
    'settings.appDescription': 'Instala "¿Qué me pongo?" en tu dispositivo para un acceso rápido y una experiencia de pantalla completa.',
    'settings.install': 'Instalar App',
    'settings.alreadyInstalled': 'Ya estás usando la versión instalada',
    'settings.cantInstall': 'Tu navegador ya tiene la app o no soporta instalación automática',

    // Error Boundary
    'error.title': 'Algo salió mal',
    'error.description': 'Ha ocurrido un error inesperado. No te preocupes, puedes intentar recargar la página.',
    'error.details': 'Ver detalles del error',
    'error.reload': 'Recargar página',

    // Loading States
    'loading.aiGenerating': 'IA Generando...',
    'loading.aiError': 'Error de IA',
    'loading.retry': 'Reintentar',
    'loading.aiRecommendation': 'Recomendación IA',
    'loading.uploadingImage': 'Subiendo Imagen',
    'loading.savingToCloud': 'Guardando en la nube...',

    // Language
    'lang.label': 'Spa',
  },
  en: {
    // App Header
    'app.title': 'What should I wear?',
    'app.subtitle': 'By: TeacherdhApps',
    'app.footer': '© All rights reserved | What should I wear? 2026',

    // Navigation
    'nav.closet': 'Closet',
    'nav.planner': 'Plan',
    'nav.settings': 'Settings',

    // Greeting
    'greeting.morning': 'Good morning!',
    'greeting.afternoon': 'Good afternoon!',
    'greeting.evening': 'Good evening!',

    // Weather
    'weather.clear': 'Clear',
    'weather.mostlyClear': 'Mostly clear',
    'weather.partlyCloudy': 'Partly cloudy',
    'weather.cloudy': 'Cloudy',
    'weather.fog': 'Fog',
    'weather.frostFog': 'Frost fog',
    'weather.lightDrizzle': 'Light drizzle',
    'weather.drizzle': 'Drizzle',
    'weather.heavyDrizzle': 'Heavy drizzle',
    'weather.lightRain': 'Light rain',
    'weather.rain': 'Rain',
    'weather.heavyRain': 'Heavy rain',
    'weather.lightSnow': 'Light snow',
    'weather.snow': 'Snow',
    'weather.heavySnow': 'Heavy snow',
    'weather.lightShower': 'Light showers',
    'weather.shower': 'Showers',
    'weather.heavyShower': 'Heavy showers',
    'weather.thunderstorm': 'Thunderstorm',
    'weather.thunderHail': 'Thunderstorm with hail',
    'weather.thunderHailHeavy': 'Heavy thunderstorm with hail',
    'weather.unknown': 'Unknown',
    'weather.loading': 'Loading...',
    'weather.locating': 'Locating...',
    'weather.noConnection': 'No connection',
    'weather.unknownCity': 'Unknown',
    'weather.noLocation': 'No location',
    'weather.denied': 'Permission denied',
    'weather.yourLocation': 'Your location',

    // Auth
    'auth.welcome': 'Welcome',
    'auth.cloudSync': 'Your outfits synced in the cloud',
    'auth.connecting': 'Connecting...',
    'auth.continueGoogle': 'Continue with Google',
    'auth.tryDemo': 'Or try the demo in 3 seconds',
    'auth.googleError': 'Error signing in with Google',
    'auth.disclaimer': 'By entering, you agree that we manage your outfits securely and privately.',

    // Demo Banner
    'demo.title': 'Demo Mode: Save your progress',
    'demo.linkGoogle': 'Link Google',
    'demo.exitTitle': 'Exit Demo',

    // Session
    'session.logout': 'Sign Out',

    // Closet View
    'closet.title': 'My Collection',
    'closet.totalPieces': 'Total pieces',
    'closet.cancel': 'Cancel',
    'closet.select': 'Select',
    'closet.loading': 'Loading Closet...',
    'closet.emptyCategory': 'No items in this category',
    'closet.emptyCloset': 'Your closet is empty',
    'closet.selected': 'selected',
    'closet.delete': 'Delete',
    'closet.confirmDelete': 'Are you sure you want to delete this item?',
    'closet.deleteError': 'Could not delete the item. Please try again.',
    'closet.confirmBulkDelete': 'Are you sure you want to delete these {count} items?',
    'closet.bulkDeleteError': 'Error deleting items.',
    'closet.piece': 'piece',
    'closet.pieces': 'pieces',

    // Categories
    'category.outerwear': 'Outerwear',
    'category.top': 'Tops',
    'category.bottom': 'Bottoms',
    'category.shoes': 'Shoes',

    // Add Item Modal
    'addItem.title': 'New Piece',
    'addItem.freePlan': 'Free Plan',
    'addItem.garments': 'items',
    'addItem.limitReached': '⚠️ Limit reached',
    'addItem.dragHere': 'Drag an image here',
    'addItem.browse': 'Browse',
    'addItem.takePhoto': 'Take Photo',
    'addItem.changePhoto': 'Change photo',
    'addItem.processing': 'Processing...',
    'addItem.uploading': 'Uploading...',
    'addItem.save': 'Save Piece',
    'addItem.name': 'Name',
    'addItem.namePlaceholder': 'E.g. Oxford Shirt',
    'addItem.category': 'Category',
    'addItem.imageError': 'Error processing image. Try another one.',
    'addItem.saveError': 'Error saving item. Please try again.',
    'addItem.limitAlert': '⚠️ Storage limit reached\n\nYou\'ve used {current} of {limit} available items.\n\n{message}',
    'addItem.limitAlertUpgrade': 'Upgrade your plan or buy an extra item pack to keep adding!',
    'addItem.limitAlertRemaining': 'You have {remaining} items remaining.',
    'addItem.limitAlertNoAdd': '⚠️ Limit reached\n\nYou can\'t add more items. Upgrade your plan or buy an extra item pack.',

    // Storage Health
    'storage.title': 'Closet Space',
    'storage.pieces': 'pieces',
    'storage.almostFull': 'Almost full! Consider deleting some items.',

    // Weekly Planner
    'weekly.title': 'Weekly Schedule',
    'weekly.today': 'Today',
    'weekly.week': 'Week',
    'weekly.month': 'Month',
    'weekly.emptyOutfit': 'Empty outfit',
    'weekly.view': 'VIEW',
    'weekly.edit': 'EDIT',
    'weekly.noOutfitToday': 'No outfit planned for today. Plan a day first.',

    // Days of week
    'day.monday': 'Monday',
    'day.tuesday': 'Tuesday',
    'day.wednesday': 'Wednesday',
    'day.thursday': 'Thursday',
    'day.friday': 'Friday',
    'day.saturday': 'Saturday',
    'day.sunday': 'Sunday',

    // Day abbreviations (monthly calendar)
    'day.mon': 'Mon',
    'day.tue': 'Tue',
    'day.wed': 'Wed',
    'day.thu': 'Thu',
    'day.fri': 'Fri',
    'day.sat': 'Sat',
    'day.sun': 'Sun',

    // Months
    'month.january': 'January',
    'month.february': 'February',
    'month.march': 'March',
    'month.april': 'April',
    'month.may': 'May',
    'month.june': 'June',
    'month.july': 'July',
    'month.august': 'August',
    'month.september': 'September',
    'month.october': 'October',
    'month.november': 'November',
    'month.december': 'December',

    // Monthly Planner
    'monthly.view': 'View',
    'monthly.edit': 'Edit',

    // Outfit Editor
    'outfit.done': 'Done',

    // Outfit Preview
    'outfit.createLook': 'Create your Look',
    'outfit.garments': 'Items',
    'outfit.addGarment': 'Add Item',
    'outfit.yourCloset': 'Your Closet',
    'outfit.selectByCategory': 'Select by category',
    'outfit.add': 'Add',
    'outfit.moodboard': 'Custom Moodboard',
    'outfit.cancel': 'Cancel',
    'outfit.saving': 'Saving...',
    'outfit.saveAndClose': 'Save & Close',
    'outfit.saveError': 'Error saving the layout.',
    'outfit.bgOriginal': 'Original',
    'outfit.bgMarble': 'Marble',
    'outfit.bgWood': 'Wood',
    'outfit.bgStudio': 'Studio',
    'outfit.bgClean': 'Clean',

    // Today Widget
    'today.today': 'Today',
    'today.yourOutfit': 'Your Outfit',
    'today.view': 'VIEW',
    'today.clear': 'Clear',
    'today.edit': 'EDIT',
    'today.createOutfit': 'CREATE OUTFIT',
    'today.confirmClear': 'Do you want to remove all items from today?',

    // Settings
    'settings.title': 'Settings',
    'settings.customize': 'Customize your experience',
    'settings.profile': 'User Profile',
    'settings.allOptional': 'All fields are optional.',
    'settings.name': 'Name',
    'settings.namePlaceholder': 'Your name',
    'settings.sex': 'Sex',
    'settings.male': 'Male',
    'settings.female': 'Female',
    'settings.other': 'Other',
    'settings.age': 'Age',
    'settings.agePlaceholder': 'Years',
    'settings.weight': 'Weight (kg)',
    'settings.weightPlaceholder': 'kg',
    'settings.height': 'Height (cm)',
    'settings.heightPlaceholder': 'cm',
    'settings.data': 'Data',
    'settings.dataDescription': 'Export all your clothes, plans, and profile in a JSON file. Import it on another device or as a backup.',
    'settings.export': 'Export Data',
    'settings.import': 'Import Data',
    'settings.reset': 'Reset Closet',
    'settings.resetConfirm': '⚠️ Are you COMPLETELY sure? This will permanently delete all your clothes, plans, and profile from the cloud and this device.',
    'settings.resetSuccess': 'Closet reset successfully. The page will reload.',
    'settings.resetError': 'Error resetting. Try again.',
    'settings.importSuccess': '✅ Data imported successfully. Reload the page to see changes.',
    'settings.importError': '❌ Error importing. Verify the file is valid.',
    'settings.app': 'Application',
    'settings.appDescription': 'Install "What should I wear?" on your device for quick access and fullscreen experience.',
    'settings.install': 'Install App',
    'settings.alreadyInstalled': 'You are already using the installed version',
    'settings.cantInstall': 'Your browser already has the app or doesn\'t support automatic installation',

    // Error Boundary
    'error.title': 'Something went wrong',
    'error.description': 'An unexpected error occurred. Don\'t worry, you can try reloading the page.',
    'error.details': 'View error details',
    'error.reload': 'Reload page',

    // Loading States
    'loading.aiGenerating': 'AI Generating...',
    'loading.aiError': 'AI Error',
    'loading.retry': 'Retry',
    'loading.aiRecommendation': 'AI Recommendation',
    'loading.uploadingImage': 'Uploading Image',
    'loading.savingToCloud': 'Saving to cloud...',

    // Language
    'lang.label': 'Eng',
  },
} as const;

export type TranslationKey = keyof typeof translations.es;

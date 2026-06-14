Actúa como un Ingeniero de Software Senior especializado en videojuegos
educativos con React. Vas a construir una SPA completa, funcional y lista
para producción. NO escribas explicaciones, genera SOLO el código.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STACK TÉCNICO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Pure React 18 con Vite
- Tailwind CSS para todos los estilos
- Framer Motion para animaciones (personaje, transiciones, efectos)
- React Router DOM v6 para navegación entre pantallas
- uuid para generar IDs de perfil
- canvas-confetti para la animación de victoria final
- localStorage para persistencia multi-perfil
- SIN otros frameworks, SIN backend, SIN SSR
- Orientación EXCLUSIVA horizontal (landscape). Si el dispositivo está
  en vertical, mostrar pantalla de aviso: "¡Gira tu dispositivo! 🧙"
- Responsive: mobile landscape (480px+), tablet (768px+), desktop (1024px+)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ARQUITECTURA DE ARCHIVOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/public
  /backgrounds
    floor-01.jpg  →  (placeholder, se reemplaza con imagen real)
    floor-02.jpg
    ... (hasta floor-12.jpg)
    fallback.jpg  →  fondo genérico de castillo

/src
  main.jsx
  App.jsx                      → Router principal + orientación guard
  
  /context
    GameContext.jsx            → Estado global, actions, persistencia
  
  /data
    skins.js                   → Catálogo completo de 60+ ítems
    jokes.js                   → 20+ chistes del Director Mago
    levels.js                  → Config de 12 plantas + fallback CSS
  
  /engine
    mathEngine.js              → Generador procedimental de preguntas
  
  /screens
    ProfilesScreen.jsx         → Selección / creación / borrado perfiles
    CharacterCreateScreen.jsx  → Elección niño/niña + nombre
    CastleScreen.jsx           → Mapa del castillo con 12 plantas
    RoomScreen.jsx             → Habitaciones 1-3 con preguntas
    BossScreen.jsx             → Examen jefe + chiste del Director
    WardrobeScreen.jsx         → Armario de skins interactivo
    VictoryRoomScreen.jsx      → Victoria de habitación (complemento)
    VictoryFloorScreen.jsx     → Victoria de planta (conjunto completo)
    VictoryGameScreen.jsx      → Victoria final (varita encantada)
    DefeatScreen.jsx           → Sin vidas, reinicia planta
  
  /components
    Character.jsx              → SVG cartoon completo con capas de ropa
    QuestionCard.jsx           → Tarjeta de pregunta adaptativa
    AnswerPanel.jsx            → 4 opciones / 6 opciones / teclado virtual
    HeartsBar.jsx              → 3 corazones animados
    TimerBar.jsx               → Barra cuenta atrás 30s
    VisualAid.jsx              → Ayudas visuales frutas/bloques
    FloorBackground.jsx        → Fondo con imagen o fallback CSS
    DirectorMago.jsx           → Personaje SVG del Director animado
    ProgressBar.jsx            → Progreso de preguntas en habitación
    RewardModal.jsx            → Modal animado al desbloquear ítem

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ESTADO GLOBAL (GameContext)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Clave localStorage: "magic_school_profiles"
Un array de perfiles. Perfil activo en "magic_school_active_id".

Estructura de cada perfil:
{
  id: string (uuid v4),
  name: string,
  gender: "boy" | "girl",
  ageMode: "young" | "older",
  currentFloor: number,        // 1-12
  currentRoom: number,         // 1-4
  lives: number,               // 0-3
  score: number,
  unlockedSkins: string[],     // array de skin IDs
  equippedSkins: {
    hair: string | null,
    top: string | null,
    bottom: string | null,
    shoes: string | null,
    hat: string | null,
    glasses: string | null,
    wings: string | null,
    accessory: string | null,
  },
  completedGame: boolean,
  newGamePlus: boolean,
  currentMode: "normal" | "pro" | "super-pro" | "super-chachi",
  unlockedModes: string[],
}

El contexto debe exponer:
- state: { profiles[], activeProfile }
- createProfile(data)
- selectProfile(id)
- deleteProfile(id)
- updateProfile(id, changes)
- loseLife(id)
- resetFloor(id)         → vidas=3, room=1
- advanceRoom(id)        → room+1 o floor+1 si room=4
- unlockSkin(id, skinId)
- equipSkin(id, slot, skinId)
- completeGame(id)       → desbloquea modo Pro

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## NARRATIVA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Título: "Escuela de Magia: En busca de la Varita Encantada"

El jugador es un aprendiz de mago que sube las plantas del castillo
superando exámenes del Director Mago Anciano para ganar poderes.
La Varita Encantada espera en lo más alto de la Torre Mayor (Planta 12).

PLANTAS DEL CASTILLO:
  1  → La Entrada del Castillo
  2  → La Biblioteca Mágica
  3  → El Laboratorio de Pociones
  4  → El Jardín Encantado (terraza nocturna con estrellas)
  5  → La Galería de los Retratos Vivientes
  6  → El Aula de Hechizos (pizarra mágica)
  7  → La Torre del Reloj (engranajes gigantes)
  8  → La Cripta de los Sabios (runas y pergaminos)
  9  → El Observatorio (telescopios y planetas)
  10 → La Sala del Consejo (trono y consejeros mágicos)
  11 → El Puente de las Nubes
  12 → La Torre de la Varita Encantada (jefe final)

DIRECTOR MAGO ANCIANO:
  Apariencia SVG: anciano con barba larga blanca, sombrero de mago
  torcido con estrellas, capa morada estrellada, ojos pequeños y
  pícaros, nariz grande y amigable, bastón con estrella.
  Personalidad: entrañable, gracioso, con humor de abuelo travieso.
  Aparece en la habitación 4 de cada planta (examen del jefe).
  Antes de cada examen cuenta UN chiste aleatorio del array jokes.js.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## FONDOS DE PLANTA (FloorBackground.jsx)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Lógica de prioridad:
  1. Intenta cargar /backgrounds/floor-{nn}.jpg (nn con cero inicial)
  2. Si la imagen falla (onError), usa el fallback CSS de levels.js
  3. La imagen usa object-fit: cover para adaptarse a cualquier ratio

Fallback CSS por planta (definido en levels.js como objeto):
{
  gradient: "from-[#color1] via-[#color2] to-[#color3]",
  decorations: ["emoji1", "emoji2", "emoji3"],  // flotantes animados
  particleColor: "#hexcolor"
}

Ejemplos de fallback:
  Planta 1  (Entrada):       gradient morado oscuro, 🏰⭐🌙
  Planta 2  (Biblioteca):    gradient marrón-dorado, 📚✨🕯️
  Planta 3  (Laboratorio):   gradient verde oscuro-azul, 🧪⚗️🫧
  Planta 4  (Jardín):        gradient azul medianoche, 🌸🌿✨
  Planta 5  (Galería):       gradient rojo oscuro-burdeos, 🖼️👁️✨
  Planta 6  (Aula):          gradient azul pizarra, 📝⭐🪄
  Planta 7  (Torre Reloj):   gradient gris acero-dorado, ⚙️🕰️✨
  Planta 8  (Cripta):        gradient negro-morado, 📜🔮💀
  Planta 9  (Observatorio):  gradient negro-azul eléctrico, 🔭🪐⭐
  Planta 10 (Consejo):       gradient dorado-rojo, 👑🪄✨
  Planta 11 (Nubes):         gradient celeste-blanco, ☁️🌈⭐
  Planta 12 (Torre Varita):  gradient negro-dorado brillante, 🪄⚡👑

Las decoraciones (emojis) flotan con animación CSS keyframes de
movimiento suave aleatorio (translateY + rotate + opacity).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PERSONAJE SVG (Character.jsx)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Renderizado 100% en SVG inline, sin imágenes externas.
Tamaño base del viewBox: 200x350

CAPAS SVG (orden de renderizado, de abajo arriba):
  1. shoes      → zapatillas/zapatos (base del cuerpo)
  2. bottom     → pantalón/falda
  3. top        → camiseta/sudadera/jersey
  4. body       → torso, brazos, manos, cabeza, cara (base fija)
  5. hair       → pelo (diferenciado por género)
  6. hat        → sombrero/gorro (sobre el pelo)
  7. wings      → alas (detrás del cuerpo, renderizar antes del body)
  8. glasses    → gafas (sobre la cara)
  9. accessory  → complemento extra (mochila, varita, bufanda)

DISEÑO BASE por género:
  BOY:
    - Cabeza redonda grande, ojos grandes con brillo, cejas expresivas
    - Pelo corto y algo despeinado (mechones)
    - Cuerpo proporciones cartoon (cabeza 40% del total)
    - Manos con 3 dedos visibles estilo cartoon
    - Expresión: sonrisa amplia y confiada

  GIRL:
    - Cabeza redonda grande, ojos con pestañas marcadas
    - Pelo con coletas o melena con volumen (por defecto coletas)
    - Mismas proporciones cartoon
    - Mismas manos cartoon
    - Expresión: sonrisa amplia y amigable

ROPA POR DEFECTO (antes de desbloquear nada):
  - Top: camiseta simple azul (boy) / rosa (girl)
  - Bottom: pantalón vaquero (boy) / falda vaquera (girl)
  - Shoes: zapatillas blancas con suela gris
  - Hair: pelo castaño por defecto

ANIMACIONES Framer Motion:
  - idle: ligero bobbing vertical continuo (y: [0, -8, 0], loop)
  - correctAnswer: salto + escala rápida (y: -30, scale: 1.1)
  - wrongAnswer: shake horizontal (x: [-10, 10, -10, 10, 0])
  - newSkin: brillo dorado + escala (scale: [1, 1.15, 1], golden glow)
  - entrada a pantalla: fadeIn + slideUp

Cada ítem del catálogo skins.js debe modificar su capa SVG cambiando:
  - color fill principal
  - color fill secundario (detalles)
  - shape variant (número de variante 1-4 según el ítem)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## CATÁLOGO DE SKINS (skins.js)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Define exactamente 60 ítems organizados así:

COMPLEMENTOS (desbloqueados en habitaciones 1, 2 y 3):
  Slot "glasses"   → 5 tipos: gafas redondas, corazón, estrella,
                     de sol, de mago
  Slot "hat"       → 6 tipos: gorro de punto, sombrero de mago pequeño,
                     boina, corona, orejas de gato, diadema de flores
  Slot "wings"     → 4 tipos: alas de hada, alas de murciélago,
                     alas de mariposa, alas de ángel
  Slot "accessory" → 9 tipos: mochila espacial, mochila de estrellas,
                     varita decorativa, libro flotante, escudo mágico,
                     bufanda de rayas, collar de estrellas,
                     pulsera mágica, linterna mágica

CONJUNTOS DE ROPA (desbloqueados en habitación 4 / jefe):
  12 conjuntos, uno por planta. Cada conjunto = top + bottom + shoes
  (3 ítems separados con el mismo unlockedAtFloor).
  Nombres y estética:
    1  → "Aprendiz Clásico": sudadera azul, vaqueros, zapatillas blancas
    2  → "Lector Mágico": jersey de biblioteca, pantalón marrón, mocasines
    3  → "Científico Loco": bata de laboratorio, leggings, botas goma
    4  → "Explorador del Jardín": chaleco verde, shorts, sandalias
    5  → "Artista Misterioso": camiseta negra con marco dorado,
         pantalón elegante, zapatos charol
    6  → "Hechicero del Aula": uniforme escolar mágico estrellado,
         falda/pantalón negro, zapatos con hebilla
    7  → "Mecánico del Tiempo": mono de engranajes dorado,
         botas de hierro, cinturón de herramientas
    8  → "Sabio de la Cripta": túnica oscura con runas, pantalón negro,
         botas puntiagudas
    9  → "Astrónomo": traje azul galaxia con estrellas,
         pantalón oscuro, zapatillas luminosas
    10 → "Consejero Real": capa roja con ribetes dorados,
         pantalón elegante, zapatos de charol dorado
    11 → "Jinete de Nubes": chaqueta blanca vaporosa,
         pantalón celeste, zapatillas con nubes
    12 → "Mago Supremo": túnica dorada con runas, pantalón negro,
         botas mágicas con estrellas

Estructura de cada ítem:
{
  id: string,                    // ej: "glasses_star"
  name: string,                  // nombre en español
  slot: string,
  gender: "boy" | "girl" | "unisex",
  unlockedAtFloor: number,       // 1-12
  unlockedAtRoom: number,        // 1-3 complementos, 4 conjuntos
  emoji: string,                 // representación fallback
  primaryColor: string,          // hex
  secondaryColor: string,        // hex
  shapeVariant: number,          // 1-4 según slot
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## MOTOR MATEMÁTICO (mathEngine.js)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Función principal:
  generateQuestion(ageMode, floor, room, currentMode)
  → devuelve objeto Question

Tipo Question:
{
  questionText: string,
  options: (number|string)[],       // 4 o 6 elementos
  correctAnswer: number | string,
  interfaceType: "4_options" | "6_options" | "keyboard",
  visualAid: {
    type: "fruits" | "blocks" | null,
    count: number
  } | null,
  timeLimit: number | null,         // null o 30
}

Función auxiliar:
  generateWrongOptions(correct, count, min, max)
  → genera [count] distractores plausibles (±1 a ±5 del correcto,
    nunca negativos si min=0, nunca duplicados, nunca igual al correcto)

═══════════════════════════════════════
MODO "young" (5- años)
═══════════════════════════════════════

Normal:
  Plantas 1-2: Sumas 0-10. visualAid: fruits. interfaz: 4_options
  Planta 3:    Restas 0-10. visualAid: fruits. interfaz: 4_options
  Planta 4:    Sumas 0-20. visualAid: blocks. interfaz: 4_options
  Planta 5:    Restas 0-20. visualAid: blocks. interfaz: 4_options
  Planta 6:    Sumas+Restas 0-20. visualAid: null. interfaz: 4_options
  Planta 7:    Mayor/Menor/Igual (0-20). interfaz: 4_options
               (opciones: "Mayor que", "Menor que", "Igual a")
  Planta 8:    Mezcla suma+resta+mayor/menor (0-30). interfaz: 6_options
  Planta 9:    Mezcla todo (0-30). interfaz: 6_options
  Planta 10:   Mezcla todo (0-50). interfaz: 6_options
  Planta 11:   Mezcla todo (0-50). interfaz: keyboard
  Planta 12:   Mezcla todo (0-100). interfaz: keyboard

Pro (New Game+):
  Igual que Normal pero operaciones de 3 términos: a+b+c, a-b+c.
  Adaptar el interfaceType: 6_options plantas 1-8, keyboard plantas 9-12.

Super-Chachi:
  Igual que Pro + timeLimit: 30

═══════════════════════════════════════
MODO "older" (8-9 años)
═══════════════════════════════════════

Normal:
  Planta 1:  × y ÷ tablas 1,2,3.    interfaz: 4_options
  Planta 2:  + tabla 4. Repasa 1-3.  interfaz: 4_options
  Planta 3:  + tabla 5. Repasa 1-4.  interfaz: 4_options
  Planta 4:  + tabla 6. Repasa 1-5.  interfaz: 6_options
  Planta 5:  + tabla 7. Repasa 1-6.  interfaz: 6_options
  Planta 6:  + tabla 8. Repasa 1-7.  interfaz: 6_options
  Planta 7:  + tabla 9. Repasa 1-8.  interfaz: 6_options
  Planta 8:  + tabla 10. Repasa 1-9. interfaz: 6_options
  Planta 9:  + tabla 11. Repasa 1-10. interfaz: keyboard
  Planta 10: + tabla 12. Repasa 1-11. interfaz: keyboard
  Planta 11: Repaso completo 1-12 (×). interfaz: keyboard
  Planta 12: Repaso completo 1-12 (× y ÷). interfaz: keyboard

Pro (New Game+):
  Operaciones combinadas 2 pasos: a×b+c, a×b-c. interfaz: keyboard.

Super-Pro:
  Operaciones combinadas avanzadas: a×b+c×d, a×b+c-d. keyboard.

Super-Chachi:
  Igual que Super-Pro + timeLimit: 30.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## FLUJO COMPLETO DE PANTALLAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ProfilesScreen] /
  - Lista de perfiles guardados (máx 4) con avatar mini y progreso
  - Botón "+ Nuevo Mago"
  - Click en perfil → lo activa → navega a /castle
  - Icono papelera en cada perfil → modal confirmación → deleteProfile()

[CharacterCreateScreen] /create
  - Paso 1: Elige nombre (input de texto)
  - Paso 2: Elige género (dos tarjetas grandes: Niño / Niña con SVG)
  - Paso 3: Elige modo de edad (5- años / 8-9 años)
  - Botón "¡Comenzar la aventura!" → createProfile() → /castle

[CastleScreen] /castle
  - Ilustración del castillo con 12 plantas visibles
  - Plantas bloqueadas: oscuras con candado
  - Planta actual: animada y brillante
  - Plantas superadas: iluminadas con estrella dorada
  - Botón "JUGAR" en la planta actual → /room
  - Botón "ARMARIO 👗" esquina → /wardrobe
  - Muestra: nombre del jugador, vidas actuales, planta actual

[RoomScreen] /room
  - Header: nombre planta + número habitación (ej: "Habitación 2 de 3")
  - HeartsBar (3 corazones)
  - TimerBar (solo si timeLimit !== null)
  - FloorBackground activo
  - ProgressBar (preguntas: 0/5 ó 0/8 en jefe)
  - Character a la izquierda (pequeño, animado idle)
  - QuestionCard + AnswerPanel al centro/derecha
  - Al acertar (5 de 5 preguntas o 8 de 8 en jefe):
      → room 1,2,3: unlockSkin() + RewardModal + advanceRoom()
      → room 4 (jefe): ver BossScreen primero, luego reward
  - Al fallar: loseLife(). Si lives=0 → DefeatScreen

[BossScreen] /boss
  - Animación de entrada del Director Mago (Framer Motion slideIn)
  - Texto: "¡Muy bien, pequeño mago! Antes del examen... 
            ¿A que no sabes este chiste?"
  - Muestra el chiste del array jokes.js (aleatorio, no repetir en 
    sesión)
  - Botón: "¡JA, JA! ¡EMPEZAR EXAMEN!"
  - El examen tiene 8 preguntas, más difíciles que las normales
    (mismo floor pero room=4, el generador sube la dificultad)
  - Al superar: VictoryFloorScreen

[WardrobeScreen] /wardrobe
  - Personaje SVG grande en el centro (animación idle)
  - Panel lateral scrollable con tabs por slot
    (Pelo | Sombrero | Gafas | Top | Bottom | Zapatos | Alas | Extras)
  - Ítems bloqueados: en gris con candado y texto "Planta X"
  - Ítems desbloqueados: click → equipSkin() → se refleja en tiempo real
  - Ítem equipado: borde dorado pulsante
  - Botón "¡LISTO! Subir al siguiente piso" → /castle

[VictoryRoomScreen] /victory-room
  - Animación breve: complemento cae del cielo con brillo
  - "¡HAS GANADO [NOMBRE DEL ÍTEM]!" 
  - Muestra el emoji/ítem grande animado
  - Botón "¡SEGUIR!" → /room (siguiente habitación)

[VictoryFloorScreen] /victory-floor
  - Confeti con canvas-confetti
  - Director Mago aplaude (animación)
  - "¡PLANTA [N] SUPERADA! Nuevo conjunto desbloqueado: [NOMBRE]"
  - Preview del conjunto de ropa (3 ítems)
  - Botón "VER MI ARMARIO" → /wardrobe

[VictoryGameScreen] /victory-game
  - Pantalla épica: confeti masivo + animación de varita brillando
  - Director Mago entrega la varita al personaje (animación)
  - "¡FELICIDADES, MAGO SUPREMO [NOMBRE]!"
  - Texto narrativo de cierre (3-4 líneas)
  - Si currentMode = "normal": desbloquea "pro", muestra botón 
    "NUEVA PARTIDA+ (Modo Pro)"
  - Si currentMode = "pro" y ageMode = "older": desbloquea "super-pro"
  - Si currentMode = "super-pro": desbloquea "super-chachi"
  - Si currentMode = "super-chachi": mensaje "¡Eres el mago definitivo!"
  - Botón "VOLVER AL INICIO" → /

[DefeatScreen] /defeat
  - Personaje triste (animación shake + cara triste)
  - Director Mago con expresión compasiva y mensaje alentador aleatorio
    (array de 5 frases distintas)
  - "¡Has perdido todas las vidas en la Planta [N]!"
  - Botón "¡INTENTARLO DE NUEVO!" → resetFloor() → /room

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## DISEÑO VISUAL (Tailwind CSS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Paleta:
  Fondo base:  gradiente #0f0c29 → #302b63 → #24243e (bg-gradient)
  Primario:    Púrpura #7c3aed  (purple-700)
  Secundario:  Dorado  #f59e0b  (amber-500)
  Acento:      Rosa    #ec4899  (pink-500)
  Éxito:       Verde   #10b981  (emerald-500)
  Error:       Rojo    #ef4444  (red-500)
  Texto:       Blanco  #ffffff

Componentes:
  - Tarjetas: bg-white/10 backdrop-blur rounded-3xl 
              border border-white/20 shadow-lg shadow-purple-500/30
  - Botones primarios: bg-gradient-to-r from-purple-600 to-pink-500
                       rounded-full px-8 py-4 font-bold text-white
                       hover:scale-105 transition-all shadow-lg
  - Botones respuesta: bg-white/20 hover:bg-white/40 rounded-2xl
                       border-2 border-white/30 hover:border-amber-400
                       active:scale-95 min-h-[44px]
  - Fuente: importar "Fredoka One" de Google Fonts para títulos
            y "Nunito" para texto de preguntas
  - Estrellas animadas de fondo: 20 elementos absolutos con
    CSS keyframes twinkle (opacity 0→1→0, scale 0.8→1.2)
  - Partículas en acierto: 8 elementos ✨ que explotan desde el centro

TIPOGRAFÍA ADAPTATIVA:
  - ageMode "young": todo el texto del juego en CSS uppercase,
    QuestionCard mínimo text-3xl, opciones mínimo text-xl
  - ageMode "older": texto normal, QuestionCard mínimo text-2xl

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## REGLAS DE IMPLEMENTACIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Genera el código COMPLETO de cada archivo. NUNCA uses comentarios
   tipo "// ... resto del código" o "// implementar aquí". 
   El código debe ejecutarse sin modificaciones.
2. Componentes funcionales con hooks únicamente. Prohibidas las clases.
3. mathEngine.js debe ser una función pura sin side effects.
4. Nunca repetir la misma pregunta dos veces seguidas en una sesión
   (usar ref o estado local para trackear la última pregunta).
5. Las opciones incorrectas deben ser plausibles: diferencia ≤5 con
   la correcta, nunca negativas si el contexto no lo permite,
   siempre distintas entre sí y distintas de la correcta.
6. El teclado virtual debe tener teclas: 0-9, ⌫ (borrar), ✓ (confirmar).
   Mínimo 44px por tecla para uso táctil.
7. Cada perfil puede tener un máximo de 4 perfiles simultáneos.
8. Al entrar a una planta ya visitada (por derrota), mostrar un mensaje
   motivador distinto cada vez (array de 5 frases).
9. Implementa un guard en App.jsx: si no hay perfil activo,
   redirigir siempre a ProfilesScreen.
10. Todos los textos del juego en español.
11. Vite como bundler. El package.json debe incluir todas las
    dependencias necesarias con versiones exactas.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ANEXO A — CHISTES DEL DIRECTOR MAGO (jokes.js)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Genera exactamente 25 chistes cortos en español, aptos para niños
de 5 a 10 años, sin contenido inapropiado, con humor absurdo e
inocente. Formato:

export const JOKES = [
  "¿Por qué los magos son tan buenos en matemáticas? ¡Porque siempre sacan conejos del sombrero... y los conejos saben contar!",
  // ... 24 más
];

Temática variada: magia, animales, comida, escuela, números.
Formato: pregunta + respuesta o chiste corto de una línea.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ANEXO B — PROMPTS PARA IMÁGENES DE FONDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Usa estos prompts en Midjourney, Ideogram o DALL-E 3 para generar
los fondos. Guardarlos en /public/backgrounds/ con el nombre indicado.
Ratio obligatorio: 16:9. Resolución: 1920×1080px.
Estilo base común a todos: "modern cartoon style, vibrant colors,
no characters, no text, children educational game background,
wide establishing shot, magical atmosphere"

  floor-01.jpg → "grand magical castle entrance hall, stone arches,
    floating candles, purple and gold banners, glowing runes on floor,
    [ESTILO BASE]"
  
  floor-02.jpg → "magical library interior, towering bookshelves to
    ceiling, floating books, warm candlelight, golden dust particles,
    spiral staircases, [ESTILO BASE]"
  
  floor-03.jpg → "wizard potion laboratory, colorful bubbling cauldrons,
    glass tubes with glowing liquids, green and blue steam, shelves of
    ingredients, [ESTILO BASE]"
  
  floor-04.jpg → "enchanted rooftop garden at night, glowing flowers,
    fireflies, stars and moon above, magical plants with lights,
    stone balcony, [ESTILO BASE]"
  
  floor-05.jpg → "magical portrait gallery, animated painting frames
    with glowing edges, red carpet, ornate gold frames, candlelit
    sconces, mysterious atmosphere, [ESTILO BASE]"
  
  floor-06.jpg → "magical classroom, giant blackboard with floating
    glowing equations, wooden desks, floating chalk, star-shaped windows,
    cozy warm light, [ESTILO BASE]"
  
  floor-07.jpg → "interior of giant clock tower, massive golden gears,
    pendulums swinging, rays of light through tall windows, steampunk
    magical style, [ESTILO BASE]"
  
  floor-08.jpg → "ancient magical crypt interior, glowing runes on stone
    walls, floating scrolls and books, purple magical torches, mystical
    symbols, [ESTILO BASE]"
  
  floor-09.jpg → "magical observatory, giant telescope pointing to
    starry sky, planets and moons visible through dome opening,
    star maps on walls, [ESTILO BASE]"
  
  floor-10.jpg → "grand magical council chamber, golden throne,
    magical advisors seats, floating orbs of light, tapestries with
    magical symbols, ceremonial atmosphere, [ESTILO BASE]"
  
  floor-11.jpg → "bridge through clouds, magical rainbow, floating
    islands visible below, soft white clouds, golden sunlight,
    dreamlike atmosphere, [ESTILO BASE]"
  
  floor-12.jpg → "pinnacle of magical tower, ornate chamber with
    floating wand on pedestal, golden magical energy beams,
    stars visible through tall windows, epic atmosphere, [ESTILO BASE]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ORDEN DE GENERACIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Genera los archivos EN ESTE ORDEN para que las dependencias
entre módulos se resuelvan correctamente:

  1. package.json
  2. vite.config.js
  3. tailwind.config.js
  4. index.html
  5. src/data/skins.js
  6. src/data/jokes.js
  7. src/data/levels.js
  8. src/engine/mathEngine.js
  9. src/context/GameContext.jsx
  10. src/components/Character.jsx
  11. src/components/DirectorMago.jsx
  12. src/components/QuestionCard.jsx
  13. src/components/AnswerPanel.jsx
  14. src/components/HeartsBar.jsx
  15. src/components/TimerBar.jsx
  16. src/components/VisualAid.jsx
  17. src/components/FloorBackground.jsx
  18. src/components/ProgressBar.jsx
  19. src/components/RewardModal.jsx
  20. src/screens/ProfilesScreen.jsx
  21. src/screens/CharacterCreateScreen.jsx
  22. src/screens/CastleScreen.jsx
  23. src/screens/RoomScreen.jsx
  24. src/screens/BossScreen.jsx
  25. src/screens/WardrobeScreen.jsx
  26. src/screens/VictoryRoomScreen.jsx
  27. src/screens/VictoryFloorScreen.jsx
  28. src/screens/VictoryGameScreen.jsx
  29. src/screens/DefeatScreen.jsx
  30. src/App.jsx
  31. src/main.jsx
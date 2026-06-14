Vamos a crear un juego, usando pure react para componer una SPA. Vamos a generar el mejor prompt possible para que un agente IA genere la aplicación/juego. El juego debe permitir crear un personaje personalizado, niño o niña. Conforme vayamos pasando de nivel, nos recompensará con nuevos skins que podremos usar con nuestro personaje. Tendrá varios modos. Unos unos fáciles de sumas-restas y mayor/menor para una edad de unos 5- años. Otro más complicado para una niña de 8-9 años, con multiplicaciones/divisiones (el objetivo es aprenderse bien las tablas de multiplicar). Nos puedes ayudar con la historia y también hacernos preguntas primero para que te vayamos diciendo cómo queremos desarrollar la historia y los niveles.
Ya tenemos respuesta a muchas preguntas:

DETALLES

Temática: Escuela de magia. Tienen que conseguir la varita encantada.

Conflicto: superar exámenes para convertirse en magos con un nivel cada vez mayor, con mayor experiencia y poderes. la varita está custodiada por un director mago anciano que les hace un examen amistoso en cada planta. Es un tipo divertido que sabe buenos chistes.

Visualizar niveles: un castillo donde hay que subir plantas. En cada planta pueden haber cosas distintas. Ejemplo: un laboratorio, una librería, una clase, etc. El último nivel es donde está la varita y es en lo más alto de la más alta torre del castillo.

Estética visual de dibujos animados modernos.

Skins de desbloqueo: conjuntos de ropa moderna y complementos. Cada cuanto recompensas: cada nivel corto un complemento y cada jefe o examen un conjunto completo.
Se empieza el juego eligiendo el personaje, pero sólo se puede elegir si es niño o niña. Y conforme van pasando de nivel, pueden elegir más cosas del armario para personalizar su personaje.

Para el nivel sumas/restas/mayor/menor: hay que empezar poco a poco, ayudándonos con imágenes visuales (frutas, NumberBlocks, etc) y poco a poco quitándolos en los niveles superiores.

Para el nivel tablas de multiplicar: empezar progresivo, con las tablas más bajas e ir progresando, pero siempre mezclando con tablas inferiores, para que las vayan repasando. El objetivo es que memoricen todas las tablas, hasta la tabla del 12.

Es necesario que hayan muchos niveles, para que no se lo pasen enseguida y estén mucho tiempo jugando y aprendiendo.
Incluso, cuando se pasen el juego, poder volver a empezar con todas las mejoras conseguidas, pero todos los niveles ya en modo difícil y recomepenado con nuevas cosas.

Interacción en los niveles: primero seleccionar la respuesta correcta entre 4 posibles opciones. Después, cuando sea más difícil, entre 6 posibles opciones. Y en los niveles más difíciles, escribir la respuesta correcta con un teclado en pantalla.

Estructura de las plantas del castillo: cada planta es un "mundo" con varias habitaciones con pruebas antes de llegar al examen. Ejemplo, en la planta 1, hay 3 habitaciones y la cuarta habitación es el jefe con examen. En la planta 2, hay otras 3 habitaciones y la cuarta es el jefe con el examen.

Hay 3 vidas (corazones), y si las pierden, tienen que comenzar la planta de nuevo.

En cada habitación de una planta, consiguen un complemento/objeto directamente. El examen final, la recompensa es el conjunto de ropa que se añade a su armario. Cuando terminan una planta pueden ir al armario a cambiarle el skin a su personaje.

Nueva partida+ (modos difícil. Al pasarse el juego una vez, se desbloquea el modo "pro"). En tablas de multiplicar, hay un modo pro y un modo super-pro. En sumas/restas/mayor/menor, sólo hay un modo más, el pro. En sumas/restas/etc, el modo pro tiene más operaciones (en plan 3+2+2). En tablas de multiplicar, el modo pro tiene también más operaciones (en plan 3x2+5), y el modo super-pro tiene aún más operaciones (en plan 4x5+10-2, o 4x3 + 2x2). Y después, podemos añadir un último modo a ambos (sumas/restas/etc y tablas de multiplicar), el modo super-chachi, que es igual que el último modo, pero con límite de tiempo (30 segundos).

Las preguntas son en texto, por simplificar y no tener que poner voz). Para el nivel de 5 años, el texto está siempre en mayúsculas, para la de 8-9 años, texto normal con mayúsculas y minúsculas.

La arquitectura es pure react con localStorage. Y puede guardar varias partidas a la vez, de diferentes jugadores en el mismo dispositivo. 
Está pensado para jugar sólo en horizontal, pero en distintas resoluciones y tamaños de pantalla (desde un móvil, a una tablet).
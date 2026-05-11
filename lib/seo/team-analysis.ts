/**
 * Análisis editoriales por selección. Se renderizan en la página de detalle
 * del equipo (`/equipos/[code]`) como contenido SEO sustantivo: contexto del
 * equipo, jugador estrella, fortalezas y riesgos, expectativa de recorrido
 * en el Mundial 2026. Cada bloque está en español, ~250-320 palabras por
 * selección, escrito para aportar valor real al lector y posicionar bien en
 * búsquedas tipo "España mundial 2026", "Brasil mundial 2026", etc.
 *
 * Si quieres pulir el copy, edita aquí: la página lo recoge automáticamente.
 * Si una selección no tiene análisis, el bloque editorial simplemente no se
 * renderiza (no crash).
 *
 * El índice usa el código FIFA 3-letter (`teams.code`).
 */

export type TeamSection = { title: string; text: string };

export type TeamAnalysis = {
  intro: string;
  star: TeamSection;
  strengths: TeamSection;
  risks: TeamSection;
  expectation: string;
};

export const TEAM_ANALYSES: Record<string, TeamAnalysis> = {
  // ──────────────────────── Grupo A ────────────────────────
  MEX: {
    intro:
      "México llega al Mundial 2026 como anfitrión y con la presión de inaugurar el torneo en el Estadio Azteca el 11 de junio. La generación liderada por Edson Álvarez, Luis Chávez y Santiago Giménez aterriza en plena madurez tras un 2022 decepcionante.",
    star: {
      title: "Santiago Giménez",
      text: "El delantero del Milan es el referente ofensivo del Tri. Olfato de área puro, finalización con las dos piernas y un perfil de killer que México llevaba años buscando. Tras explotar en el Feyenoord y consolidarse en San Siro, llega al Mundial con la pegada al máximo. Si Giménez convierte los pocos balones de gol que le caigan en la altura del Azteca, México pasa de fase con facilidad.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Tres factores clave: el factor casa (Azteca + Akron + BBVA con público volcado), la altura de Ciudad de México como arma defensiva contra rivales no aclimatados, y un mediocampo físico con Edson Álvarez de eje. La generación está en su mejor momento y la fase de grupos parece asequible.",
    },
    risks: {
      title: "Riesgos",
      text: "La presión nacional es brutal: cualquier punto cedido se vive como crisis. La defensa central sigue sin un líder claro al nivel de los grandes torneos, y México tiene historial de hundirse en KO. El partido contra Corea del Sur es trampa pura: si pinchan ahí, el grupo se complica.",
    },
    expectation:
      "Pase a octavos sin sobresaltos, primero del grupo. Llegar a cuartos sería cumplir; semifinales sería hito histórico (México no ha pasado nunca de cuartos en Mundial fuera de los suyos, y dentro tampoco).",
  },
  KOR: {
    intro:
      "Corea del Sur es la selección asiática más constante de los últimos Mundiales y aterriza al 2026 con Son Heung-min como capitán y referente absoluto. Tras alcanzar octavos en Qatar 2022, llegan con la mentalidad de repetir gesta en territorio americano.",
    star: {
      title: "Son Heung-min",
      text: "El extremo del Tottenham es el jugador más completo en la historia del fútbol coreano. Velocidad, finalización con las dos piernas, jerarquía y un nivel internacional que ningún rival del Grupo A puede igualar individualmente. A sus 33 años va a por su tercer Mundial y carga con la responsabilidad de llevar a Corea hasta donde nadie esperaba.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Bloque ya conocido del 2022: Kim Min-jae como central de élite mundial, Lee Kang-in aportando creatividad por dentro, y un mediocampo trabajador. La pegada al contraataque es difícil de manejar, y la disciplina táctica del staff coreano (heredada de Bento, refinada por Hong Myung-bo) los hace incómodos para cualquiera.",
    },
    risks: {
      title: "Riesgos",
      text: "Profundidad limitada: si Son o Kim Min-jae no llegan al 100%, el nivel cae mucho. Históricamente Corea sufre contra rivales que les imponen físico desde el medio campo, perfil que tienen tanto México como República Checa.",
    },
    expectation:
      "Segunda plaza del grupo y un cruce en R32 a evitar para los grandes. Llegar a cuartos sería repetir el 2002, su techo histórico — ambición real más que objetivo realista.",
  },
  RSA: {
    intro:
      "Sudáfrica vuelve al Mundial dos décadas después de organizar el de 2010. Bafana Bafana llega tras una clasificación CAF en la que mostraron carácter, encuadrados en un grupo asequible donde su techo se mide partido a partido.",
    star: {
      title: "Lyle Foster",
      text: "El delantero del Burnley es la esperanza ofensiva sudafricana. Llegó a Inglaterra muy joven y, tras superar problemas extradeportivos, encuentra al fin la regularidad que necesita. Su perfil físico y de área le permite competir contra defensas europeas, algo que la selección llevaba sin tener desde Benni McCarthy.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Un grupo joven con hambre, sin la pesadez de generaciones pasadas que llegaban al Mundial sintiéndose en deuda con el de 2010. El bloque medio tiene piernas y físico, y el seleccionador Hugo Broos sabe construir defensas. Si encuentran un gol pronto en cada partido, pueden sostener resultados.",
    },
    risks: {
      title: "Riesgos",
      text: "Falta de jerarquía en momentos cumbre y poca experiencia internacional fuera de África. Sudáfrica nunca ha pasado de la fase de grupos en Mundial. La altura del Azteca contra México es un examen físico que pueden sufrir.",
    },
    expectation:
      "Pelear el tercer puesto del grupo con la República Checa. Pasar a R32 como mejor 3º sería un éxito enorme para el fútbol sudafricano y un legado real para esta generación.",
  },
  CZE: {
    intro:
      "República Checa vuelve al Mundial 2026 tras ausentarse de Brasil 2014, Rusia 2018 y Qatar 2022. Una generación interesante encabezada por Patrik Schick y dirigida por Ivan Hašek llega con ganas de demostrar que Chequia sigue siendo una potencia futbolística centroeuropea.",
    star: {
      title: "Patrik Schick",
      text: "El delantero del Leverkusen es uno de los killers más reconocibles del fútbol europeo. Recordado por su gol histórico desde el medio campo contra Escocia en la Euro 2020, Schick combina remate de cabeza, finalización potente y un instinto en el área que cualquier defensa del Grupo A va a sufrir. Si llega sano, es la diferencia.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Físico centroeuropeo en el mediocampo, transiciones rápidas y solvencia a balón parado — el ABC del fútbol checo. La portería de Jindřich Staněk da fiabilidad y los laterales aportan llegada. Es una selección incómoda de jugar para cualquiera que no tenga un partido perfecto.",
    },
    risks: {
      title: "Riesgos",
      text: "Profundidad ofensiva limitada: si Schick no llega bien o se lesiona en el torneo, no hay relevo del mismo nivel. Tampoco hay un mediapunta de élite que conecte líneas. La altura del Azteca puede pasar factura física.",
    },
    expectation:
      "Pelear las plazas 2 y 3 con Corea y Sudáfrica. Pasar a R32 sería igualar la última gran cita checa (2006) y devolver al país al mapa mundialista de forma seria.",
  },

  // ──────────────────────── Grupo B ────────────────────────
  CAN: {
    intro:
      "Canadá vive su Mundial soñado: organiza partidos en Toronto y Vancouver, llega con la mejor generación de su historia y comparte fase de grupos con rivales asequibles. La espina del 2022 (tres derrotas, cero goles entonces — primero contra Croacia se desquitaron en Qatar) sigue clavada.",
    star: {
      title: "Alphonso Davies",
      text: "El lateral-extremo del Bayern es el jugador franquicia del fútbol canadiense. Velocidad espectacular por banda izquierda, capacidad de generar superioridades y experiencia al máximo nivel europeo desde adolescente. Sin él, Canadá pierde la chispa ofensiva que les hace verdaderamente competitivos.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Trío de oro Davies–Jonathan David–Eustáquio: velocidad, gol y orden. El factor casa en BMO Field y BC Place va a generar ambiente brutal. Jesse Marsch ha dado intensidad al bloque y el grupo está más maduro que en 2022. Tienen hambre real de hacer historia.",
    },
    risks: {
      title: "Riesgos",
      text: "Falta de elite a partir del segundo nivel: si Davies o David caen, el techo baja. La defensa central sigue siendo el punto débil, y partidos contra europeos disciplinados (Suiza, Bosnia) pueden complicarse. La presión local puede pesar más que ayudar.",
    },
    expectation:
      "Pase a octavos como segundos del grupo. Si se cruzan bien, cuartos es posible. Sería un hito absoluto: Canadá nunca ha ganado un partido en Mundial fuera de su pase a Qatar... aún.",
  },
  SUI: {
    intro:
      "Suiza es esa selección europea que rara vez gana Mundiales pero rara vez decepciona. Llega al 2026 con un bloque experimentado, defensa de hierro y el hábito de pasar de fase: lo hicieron en los últimos cuatro torneos consecutivos.",
    star: {
      title: "Manuel Akanji",
      text: "El central del Manchester City es uno de los defensas más completos del mundo. Sale jugando, lee anticipos como pocos y aporta jerarquía en una defensa que necesita exactamente eso. Akanji se ha convertido en pieza intocable bajo Pep Guardiola, y eso te dice todo lo que necesitas saber.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Experiencia mundialista a raudales (Xhaka, Akanji, Embolo, Sommer), solidez defensiva por encima de la media, y un cuerpo técnico que sabe exactamente qué hacer en cada fase. La cultura del trabajo helvética se traduce en torneos que rara vez descarrilan.",
    },
    risks: {
      title: "Riesgos",
      text: "Falta de pegada decisiva en momentos cumbre — Suiza siempre se queda corta en cuartos o cae en octavos por penaltis. El recambio en bandas es discreto y el equipo no genera ocasiones a chorro: depende mucho de aciertos puntuales.",
    },
    expectation:
      "Pase a octavos con casi total seguridad, probablemente como primeros del grupo. En R32 vuelven a encontrarse el techo histórico — superarlo sería un hito generacional.",
  },
  QAT: {
    intro:
      "Qatar regresa al Mundial 2026 como invitado deportivo tras la repesca asiática, ya sin el factor casa que tuvieron en 2022. Aquella experiencia (último, tres derrotas, anfitrión más flojo de la historia) marca la mochila con la que llegan a esta cita.",
    star: {
      title: "Akram Afif",
      text: "El extremo del Al-Sadd es el mejor jugador que ha producido el fútbol qatarí. Doble Bota de Oro de la Copa Asiática (incluyendo el récord en 2024), técnica fina, conducción de balón y una calidad por dentro que justifica que sea referente absoluto del equipo. Si Qatar saca algún punto, será gracias a Afif.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Bloque cohesionado tras años de proyecto Aspire, jugadores acostumbrados a la presión internacional desde la Copa Asiática y el Mundial doméstico, y un sistema defensivo trabajado. Saben competir desde el orden, no desde la posesión.",
    },
    risks: {
      title: "Riesgos",
      text: "Falta de nivel individual fuera de Afif para enfrentarse a Suiza y Canadá. El equipo está construido para Asia, no para Europa o Norteamérica. Sin el factor casa, no hay red de seguridad.",
    },
    expectation:
      "Cuarto del grupo es el escenario más probable. Sumar el primer punto en un Mundial fuera de Qatar sería un éxito tangible para empezar a normalizar su presencia mundialista.",
  },
  BIH: {
    intro:
      "Bosnia y Herzegovina vuelve al Mundial 12 años después de Brasil 2014, donde Edin Džeko ya era estrella y siguen apareciendo nombres conocidos. Una mezcla de veteranía dorada (Džeko, Pjanić) y juventud emergente que llega con la espina de aquel torneo.",
    star: {
      title: "Edin Džeko",
      text: "A sus 40 años (cumplirá durante el torneo), el delantero leyenda del fútbol bosnio sigue siendo capitán y referente moral. Goleador histórico de su selección con más de 70 tantos, Džeko es el alma del equipo y todavía aporta presencia en el área. Su despedida mundialista se huele en el ambiente.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Núcleo veterano con jerarquía: Miralem Pjanić y Sead Kolašinac aportan kilómetros internacionales, y la nueva camada (Tahirović, Bajraktarević) empuja desde abajo. Equipo físico, cómodo replegándose y peligroso a balón parado. Saben jugar partidos cerrados.",
    },
    risks: {
      title: "Riesgos",
      text: "Falta de talento en bandas comparado con europeas top, y dependencia muy alta del estado físico de Džeko. Si pinchan el primer partido contra Canadá, el grupo se les puede ir pronto.",
    },
    expectation:
      "Pelear el tercer puesto con Qatar. Llevarse 4 puntos del grupo (uno o dos triunfos cortos) es objetivo realista y aspirar a mejor 3º un sueño.",
  },

  // ──────────────────────── Grupo C ────────────────────────
  BRA: {
    intro:
      "Brasil llega al Mundial 2026 como uno de los principales candidatos al título. Cinco veces campeón del mundo, con la presión de siempre y una generación ofensiva quizás la más completa de la última década: Vinícius, Rodrygo, Endrick, Raphinha, Neymar si llega bien.",
    star: {
      title: "Vinícius Jr",
      text: "El extremo del Real Madrid llega en plena madurez, con dos Champions ganadas y siendo el referente ofensivo absoluto de la Canarinha. Velocidad, regate corto, finalización mejorada y un nivel de élite que justifica que sea el principal candidato individual a brillar en el torneo. Brasil construye su juego alrededor de él.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Profundidad ofensiva sin rival en el mundo: cinco extremos top, dos delanteros referenciales (Endrick y eventualmente Pedro/Richarlison). Mediocampo con Casemiro, Bruno Guimarães, Lucas Paquetá. El factor histórico pesa: 6 mundiales seguidos pasando primero de grupo.",
    },
    risks: {
      title: "Riesgos",
      text: "La defensa central sigue siendo el agujero. Desde Thiago Silva no hay líder claro atrás y la portería tampoco transmite seguridad total. Brasil acumula eliminaciones recientes en cuartos (2018 contra Bélgica, 2022 contra Croacia) que pesan psicológicamente.",
    },
    expectation:
      "Primer puesto del grupo cómodo, semifinales como mínimo. Es candidato real a la sexta estrella — si la defensa aguanta, pueden ganarlo.",
  },
  MAR: {
    intro:
      "Marruecos ya no es sorpresa. Tras alcanzar las semifinales del Mundial de Qatar 2022, los Leones del Atlas son potencia consolidada y aterrizan al 2026 como la mejor selección africana del torneo, con la mochila de haber abierto un techo histórico.",
    star: {
      title: "Achraf Hakimi",
      text: "El lateral del PSG es la cara de esta generación dorada marroquí. Desplazamiento, llegada, capacidad de generar superioridad por la derecha — Hakimi es completo en ambas áreas y, además, el liderazgo emocional del vestuario. En 2022 fue clave; en 2026 carga con la responsabilidad de mantener el listón.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Defensa élite (Hakimi, Saïss, Mazraoui, Aguerd), bloque medio compacto con En-Nesyri arriba y un cuerpo técnico (Walid Regragui) que sabe sacar lo máximo del talento disponible. Sufren controlado, golpean a la contra y a balón parado son temibles. El espíritu del 2022 sigue intacto.",
    },
    risks: {
      title: "Riesgos",
      text: "La generación tiene un año más y eso pesa físicamente. Algunas piezas claves (Ziyech, Saïss) están en final de carrera. El sorteo les emparejó con Brasil, un coco evitable difícilmente.",
    },
    expectation:
      "Segunda plaza del grupo (Brasil casi seguro primero), cuartos como objetivo realista y semifinales como techo. Repetir el podio 2022 sería un milagro doble, pero esta selección ya nos enseñó que no hay milagros, hay generaciones.",
  },
  SCO: {
    intro:
      "Escocia vuelve al Mundial tras 28 años de ausencia (última cita: Francia 1998). Una generación cohesionada liderada por Andy Robertson, Scott McTominay y John McGinn pone fin a una de las sequías más dolorosas del fútbol europeo en cifras y orgullo.",
    star: {
      title: "Scott McTominay",
      text: "El mediocentro del Napoli ha explotado en Italia tras dejar el United, ganando Scudetto. Llegada al área, físico, capacidad de aparecer en momentos clave — McTominay es el motor de Escocia y su mejor finalizador desde el medio. Si llega encendido, Escocia da problemas a cualquiera.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Cohesión extraordinaria, sentido de equipo por encima de individualidades, juego directo eficaz y una afición que va a viajar masivamente. Robertson aporta jerarquía y experiencia en el lateral, Tierney protege la zaga y la pelea cada balón es marca de la casa.",
    },
    risks: {
      title: "Riesgos",
      text: "Falta de profundidad: si caen dos titulares por lesión, el nivel baja drásticamente. Sin un delantero referencia top, dependen mucho de gol del segundo línea. El cruce con Brasil pinta a goleada en contra.",
    },
    expectation:
      "Tercer puesto realista del grupo, con opciones de pelear el 2º contra Marruecos si todo sale perfecto. Pasar a R32 como mejor 3º sería histórico tras décadas de quedarse a las puertas.",
  },
  HAI: {
    intro:
      "Haití regresa al Mundial 40 años después de su única cita en Alemania 1974. Una hazaña colectiva enorme para un país marcado por crisis políticas y económicas que llega al 2026 a celebrar fútbol sin medir techos.",
    star: {
      title: "Duckens Nazon",
      text: "El delantero curtido en ligas modestas europeas es el goleador histórico reciente de Haití. Sin estar en una élite del fútbol mundial, Nazon sabe oler el gol y carga con la responsabilidad ofensiva. Su nivel no es comparable al de las estrellas del grupo, pero su importancia para Haití es absoluta.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Entusiasmo, hambre y la sensación de que cualquier punto sumado es ya éxito. El bloque está formado por jugadores que conocen la dureza del fútbol en condiciones complicadas — eso curte. Físicamente compiten y son rápidos en transiciones.",
    },
    risks: {
      title: "Riesgos",
      text: "Diferencia abrumadora de nivel respecto a Brasil y Marruecos. Falta de jugadores en ligas top, infraestructura federativa muy limitada y la propia situación del país, que dificulta cualquier preparación profesional óptima.",
    },
    expectation:
      "Cuarto del grupo es el escenario probable. Sumar el primer punto en un Mundial sería logro mayúsculo. Marcar un gol, una alegría histórica para una afición que se merece todo.",
  },

  // ──────────────────────── Grupo D ────────────────────────
  USA: {
    intro:
      "Estados Unidos anfitriona el Mundial 2026 con grupo asequible y la mayoría de partidos en casa. La generación de Christian Pulisic, Tyler Adams y Weston McKennie llega en plena madurez y la presión de aprovechar el factor local es máxima.",
    star: {
      title: "Christian Pulisic",
      text: "El extremo del Milan es el jugador franquicia del fútbol estadounidense. Tras una carrera europea sólida (Dortmund, Chelsea, Milan), Pulisic llega al Mundial como capitán y referente ofensivo. Versatilidad, llegada al área y experiencia en grandes torneos — su nivel marca el techo del equipo.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Factor casa total (Inglewood, Seattle, Dallas con público volcado), generación curtida en Europa, MLS proporcionando cantera competitiva y un Mauricio Pochettino al banquillo que conoce el más alto nivel. Mediocampo físico y selecciones contra rivales asiáticos/europeos del grupo favorables.",
    },
    risks: {
      title: "Riesgos",
      text: "Defensa central sin un líder mundial top, portería con dudas recurrentes y un nivel ofensivo que depende demasiado de Pulisic. El cruce con Turquía es el más complicado del grupo. Presión local que puede pesar más que ayudar en KO.",
    },
    expectation:
      "Primer puesto del grupo como objetivo, octavos como mínimo. Llegar a cuartos sería igualar 2002, su techo moderno. Más allá sería tarjeta histórica para el fútbol americano.",
  },
  PAR: {
    intro:
      "Paraguay regresa al Mundial 2026 tras tres ausencias consecutivas (2014, 2018, 2022). Una generación nueva, sin las estrellas mundialistas de Cardozo y Roque Santa Cruz pero con identidad propia, llega a recuperar el espacio histórico de la Albirroja.",
    star: {
      title: "Julio Enciso",
      text: "El mediapunta del Ipswich Town (cedido del Brighton) representa la nueva era guaraní. Técnica fina, conducción, finalización con remates poderosos desde fuera del área. Enciso tiene apenas 21 años y se ha convertido en la cara del proyecto paraguayo, con el peso de dirigir el ataque desde su perfil zurdo.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Físico sudamericano (mediocampo intenso, intensidad en el duelo), tradición defensiva sólida y un Gustavo Alfaro al banquillo que conoce Mundiales (estuvo con Ecuador en Qatar). Paraguay sabe competir partidos cerrados y robar puntos por la mínima.",
    },
    risks: {
      title: "Riesgos",
      text: "Falta de pegada arriba al máximo nivel: Antonio Sanabria es el único delantero europeo top. Defensa joven sin curtir Mundiales. Después de tantos años sin clasificar, la inexperiencia mundialista colectiva pesa.",
    },
    expectation:
      "Pelear el segundo o tercer puesto del grupo. Pasar a octavos sería un éxito real y volver a poner a Paraguay en el mapa mundialista tras la era oscura post-2010.",
  },
  AUS: {
    intro:
      "Australia llega al Mundial 2026 tras una clasificación AFC sufrida con uñas y dientes. Los Socceroos vuelven a una cita mundialista (la sexta consecutiva sumando repescas) con un grupo de transición entre la generación del 2022 y la siguiente camada.",
    star: {
      title: "Aaron Mooy / Mat Ryan",
      text: "Australia carece de un único nombre estrella; Aaron Mooy aporta dirección en el medio y veteranía mundialista, y Mat Ryan sigue siendo de los porteros más fiables de la AFC. Lo realmente identitario del equipo es el bloque, no la individualidad — eso fue su receta del éxito en Qatar 2022.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Carácter colectivo, físico para sostener intensidad 90 minutos y un equipo que sabe lo que es ganar partidos del Mundial (eliminaron a Dinamarca en 2022). Bloque defensivo trabajado y respuesta emocional ante adversidades — los Socceroos son incómodos para cualquiera.",
    },
    risks: {
      title: "Riesgos",
      text: "Calidad individual limitada: pocos jugadores en ligas top y un descenso del nivel medio comparado con 2022. Ofensivamente dependen de errores rivales más que de generar su propio peligro. Edad alta en piezas claves.",
    },
    expectation:
      "Tercer puesto realista, con opción de robar segundo si Paraguay o Turquía fallan. Repetir octavos del 2022 sería igualar techo reciente; quedarse fuera es escenario probable.",
  },
  TUR: {
    intro:
      "Turquía vuelve al Mundial tras 24 años (última cita: Corea-Japón 2002, donde fue tercera). Una generación que en la Eurocopa 2024 mostró carácter y tiene en Hakan Çalhanoğlu un director de orquesta para reencontrar a la mejor Türkiye.",
    star: {
      title: "Hakan Çalhanoğlu",
      text: "El mediocentro del Inter es uno de los pivotes ofensivos más completos del fútbol europeo. Tiro lejano, pase largo de élite, lanzamientos de falta y un nivel de regularidad que ha hecho a su Inter ganar Scudettos. A los 32 años, Çalhanoğlu llega al Mundial en su prime y carga con la creación turca.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Generación talentosa con Arda Güler emergiendo, talento en bandas (Kenan Yıldız, Yunus Akgün) y un físico turco característico en mediocampo. Vincenzo Montella aporta orden táctico italiano. Pueden golpear desde balón parado y robar puntos a las potencias.",
    },
    risks: {
      title: "Riesgos",
      text: "Defensa con baches, portería históricamente inconsistente y una tendencia a hundirse después de errores. La presión por reverdecer 2002 puede ser carga. Físicamente requieren un equilibrio que no siempre encuentran.",
    },
    expectation:
      "Pelear el segundo puesto con Paraguay. Pasar a octavos sería confirmar el regreso al mapa mundialista y poner a esta generación al nivel mediático que merece.",
  },

  // ──────────────────────── Grupo E ────────────────────────
  GER: {
    intro:
      "Alemania llega al Mundial 2026 con la urgencia de borrar dos eliminaciones tempranas consecutivas (2018 y 2022 en fase de grupos). Tras una Euro 2024 en casa que terminó en cuartos contra España y un proceso de reconstrucción con Julian Nagelsmann, la Mannschaft busca volver a ser referencia.",
    star: {
      title: "Florian Wirtz",
      text: "El mediapunta del Bayern (tras dejar el Leverkusen) es la perla de esta generación alemana. Visión de juego, regate corto, finalización y un perfil zurdo que recuerda a los grandes 10 de la historia. A sus 22 años va a por su primer Mundial cargando con la responsabilidad de crear el fútbol de Alemania.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Talento por todos lados: Wirtz, Musiala, Havertz, Sané, Kimmich, Rüdiger. Mediocampo creativo, banquillo con opciones reales y un seleccionador con ideas claras. Tras tocar fondo en Qatar, la Eurocopa 2024 confirmó que el camino es bueno.",
    },
    risks: {
      title: "Riesgos",
      text: "Defensa central sin alternativas claras detrás de Rüdiger y dudas en portería tras la retirada de Neuer. Mentalmente cargan con dos Mundiales fallidos seguidos y eso pesa. El sorteo les emparejó con Ecuador, rival que jugó duro a España en 2022.",
    },
    expectation:
      "Primer puesto cómodo, mínimo cuartos. Semifinales es objetivo realista y la final, la ambición legítima de un país que no levanta el trofeo desde 2014.",
  },
  ECU: {
    intro:
      "Ecuador llega al Mundial 2026 tras una Qatar 2022 prometedora donde quedó muy cerca de pasar a octavos. Una generación joven dirigida por Sebastián Beccacece, con Moisés Caicedo como abanderado, busca ahora dar el paso definitivo.",
    star: {
      title: "Moisés Caicedo",
      text: "El mediocentro del Chelsea es el motor de Ecuador. Físico, recuperación, capacidad de empezar jugadas y un nivel en la Premier League que justifica el récord de fichaje pagado por él. Caicedo da equilibrio al equipo y permite que Ecuador compita contra cualquier mediocampo del mundo.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Generación joven y curtida (Caicedo, Pacho, Estupiñán, Hincapié), físicamente potente y técnicamente solvente. Defensa sudamericana de élite, transición rápida y un Beccacece argentino que aporta orden táctico. Ecuador compite, no especula.",
    },
    risks: {
      title: "Riesgos",
      text: "Falta de un goleador top: Enner Valencia ya no está en su prime y no hay relevo claro. Ofensivamente generan poco peligro a partir del juego asociado. Cargar con la presión de superar Qatar puede pesar.",
    },
    expectation:
      "Segundo puesto del grupo realista, con opciones de cuartos en un cruce favorable. Pasar a R32 después de quedarse a las puertas en Qatar sería confirmación generacional.",
  },
  CIV: {
    intro:
      "Costa de Marfil llega al Mundial 2026 con el aire fresco de haber ganado la Copa Africana 2024 en casa con remontada épica incluida. Los Elefantes vuelven a un Mundial tras 12 años con un proyecto sólido bajo Emerse Faé.",
    star: {
      title: "Sébastien Haller",
      text: "El delantero del Dortmund cargó con la responsabilidad emocional de Costa de Marfil tras superar un cáncer testicular en 2022 y volver a primer plano. Gol decisivo en la final de la CAN 2024, presencia de área y jerarquía moral. Haller es héroe en su país y el referente goleador del equipo.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Generación tetra-ganadora de la CAN con confianza por las nubes, jugadores en ligas top (Kessié, Cornet, Pépé, Singo) y físico africano característico. Faé entiende a este grupo desde el vestuario porque era jugador hace nada. Saben sufrir y golpear cuando importa.",
    },
    risks: {
      title: "Riesgos",
      text: "Inexperiencia mundialista reciente: muchos jugadores van a su primer Mundial. Defensa central con dudas a alto nivel y portería que ha cambiado mucho. El cruce con Alemania pinta complicado.",
    },
    expectation:
      "Pelear el segundo puesto con Ecuador. Pasar a R32 sería un éxito y validar que la generación CAN-2024 sirve también para el escenario global.",
  },
  CUW: {
    intro:
      "Curazao protagoniza una de las clasificaciones más emocionantes de la historia: la isla caribeña de apenas 150.000 habitantes alcanza por primera vez un Mundial. Una hazaña deportiva y un símbolo de lo que el fútbol puede regalar a comunidades pequeñas.",
    star: {
      title: "Leandro Bacuna",
      text: "El veterano centrocampista, hermano del también internacional Juninho Bacuna, es el capitán y referente del proyecto. Carrera larga en Inglaterra y Holanda, experiencia internacional y liderazgo vestuariesco. A sus 34 años se gana el sueño de un Mundial.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Hambre de demostrar y ausencia total de presión: nadie espera nada, todo es regalo. Muchos jugadores con pasaporte neerlandés y formación en la Eredivisie aportan calidad técnica por encima del estándar caribeño. Ambiente de selección familiar.",
    },
    risks: {
      title: "Riesgos",
      text: "Diferencia abismal de nivel respecto a Alemania, Ecuador y CIV. Una sola lesión en el bloque titular y el techo baja drásticamente. Falta de hábito mundialista colectivo (es la primera vez en la historia).",
    },
    expectation:
      "Cuarto del grupo es lo esperado. Sumar un solo punto sería un logro histórico para Curazao. Cualquier gol marcado se celebra en la isla durante décadas.",
  },

  // ──────────────────────── Grupo F ────────────────────────
  NED: {
    intro:
      "Países Bajos llega al Mundial 2026 con la generación post-Van Dijk-Depay aún sin un relevo claro pero con talento joven prometedor. La Oranje arrastra el peso histórico de ser eterno candidato sin levantar la Copa, una sequía que cada Mundial se vuelve más pesada.",
    star: {
      title: "Cody Gakpo",
      text: "El extremo del Liverpool ha consolidado un nivel top tras explotar en Qatar 2022 (cinco goles entonces). Versatilidad (puede jugar por banda o de 9), físico y un disparo zurdo de los buenos. Gakpo carga ahora con el peso de ser referente ofensivo en una selección sin un Robben o Sneijder.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Talento joven a chorro: Xavi Simons, Frenkie de Jong, Jurriën Timber, Bart Verbruggen, Brian Brobbey. Tradición Total Football, escuela de juego asociado, defensa que sigue siendo del nivel europeo. Memphis Depay como veterano aporta jerarquía.",
    },
    risks: {
      title: "Riesgos",
      text: "Falta un goleador top consolidado (Depay ya no rinde como antes), defensa central post-Van Dijk con menos jerarquía y el banquillo, en proceso. Cargar con el peso histórico de ser eterno favorito sin título.",
    },
    expectation:
      "Primer puesto del grupo, cuartos como mínimo realista. Semifinales es objetivo legítimo y la final, la ambición ya histórica de Países Bajos. Sigue siendo, junto a Hungría 50, la mejor selección que nunca ha ganado un Mundial.",
  },
  JPN: {
    intro:
      "Japón llega al Mundial 2026 como la mejor selección asiática de la última década. Tras vencer a Alemania y España en fase de grupos en Qatar 2022 (y caer con Croacia en penaltis en R32), los Samurai Blue son referencia.",
    star: {
      title: "Takefusa Kubo",
      text: "El extremo de la Real Sociedad es la perla nipona. Técnica fina, regate, finalización y un sello de calidad que el fútbol japonés llevaba décadas buscando. Kubo, formado en la Masía hasta los 18, combina escuela europea con paciencia oriental. Es el jugador alrededor del que se construye el ataque japonés.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Generación curtida en Europa (Mitoma, Tomiyasu, Endō, Kamada, Tanaka), físico mejorado, intensidad sostenida y un Hajime Moriyasu en el banquillo que sabe sacar lo mejor del grupo. Defensa organizada y transiciones rápidas. Sin estrellas mediáticas, son un bloque eficaz.",
    },
    risks: {
      title: "Riesgos",
      text: "Falta de un delantero referencia top: Asano y Ueda compiten pero no son del nivel europeo de élite. La estatura promedio en defensa puede sufrir contra Países Bajos y Suecia. Tras eliminaciones en KO tempranos, hay que romper ese muro psicológico.",
    },
    expectation:
      "Pase a R32 prácticamente seguro, segundo del grupo. Llegar a cuartos sería hito histórico (Japón nunca ha pasado de octavos) y romper ese techo, el siguiente paso lógico de esta generación.",
  },
  TUN: {
    intro:
      "Túnez regresa al Mundial 2026 tras su sexta clasificación histórica. Las Águilas de Cartago no han pasado nunca de fase de grupos en un Mundial y aterrizan ahora con una generación menos espectacular que la de 2022 pero con identidad clara bajo Sami Trabelsi.",
    star: {
      title: "Hannibal Mejbri",
      text: "El mediocentro del Burnley (con paso por el Manchester United) es la cara joven del proyecto tunecino. Físico, intensidad y un perfil moderno que liga generaciones. Mejbri aporta calidad europea al mediocampo y la responsabilidad de creación entre líneas.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Bloque defensivo trabajado y disciplinado, físico medio-alto y experiencia mundialista colectiva (varios jugadores de 2022 repiten). Túnez sabe competir partidos cerrados, replegarse y golpear a la contra. Tradición de buenos torneos en CAN.",
    },
    risks: {
      title: "Riesgos",
      text: "Falta de pegada arriba: Yousef Msakni ya en final de carrera y sin un goleador referencial sustitutivo. Diferencia de nivel respecto a Países Bajos y Japón. Históricamente, falta de killer instinct en los partidos decisivos.",
    },
    expectation:
      "Pelear el tercer puesto con Suecia. Sumar 4 puntos del grupo sería realista y pelear el mejor 3º, el sueño. Pasar de la fase de grupos por primera vez en su historia sería el techo absoluto.",
  },
  SWE: {
    intro:
      "Suecia vuelve al Mundial 2026 tras el doloroso fracaso de no clasificar para Qatar 2022. Una generación post-Ibrahimović que se construye alrededor del joven Alexander Isak llega a recuperar el espacio que históricamente ocupó la selección sueca.",
    star: {
      title: "Alexander Isak",
      text: "El delantero del Liverpool (tras dejar el Newcastle) es la nueva cara del fútbol sueco. Altura, técnica fina, finalización a una y dos toques, regate. Isak combina lo mejor de los grandes delanteros nórdicos con un toque latino que le da diferencia. Es el jugador franquicia y su nivel marca el techo del equipo.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Físico nórdico tradicional, juego directo eficaz y un Isak en estado de gracia. Profundidad media en mediocampo (Forsberg sigue siendo útil) y mentalidad colectiva escandinava. Suecia sabe competir cualquier partido si Isak aparece.",
    },
    risks: {
      title: "Riesgos",
      text: "Defensa central post-Lindelöf con poca jerarquía top, portería con dudas y una generación de transición. Dependencia muy alta de Isak: si él no llega o no rinde, el techo baja drásticamente.",
    },
    expectation:
      "Tercer puesto realista, con opción de segundo si Japón pincha. Pasar a octavos sería confirmación de que la generación Isak vale para escenarios grandes; cuartos, el techo ambicioso.",
  },

  // ──────────────────────── Grupo G ────────────────────────
  BEL: {
    intro:
      "Bélgica llega al Mundial 2026 con la generación dorada (Hazard, Lukaku, Vertonghen, De Bruyne) ya casi disuelta y un Domenico Tedesco al banquillo intentando construir la siguiente Diavoli Rossi. El listón histórico del bronce de 2018 sigue ahí como meta y como peso.",
    star: {
      title: "Kevin De Bruyne",
      text: "A sus 34 años, el cerebro del Manchester City (en sus últimos años, eventualmente fuera ya del club) sigue siendo el mejor jugador del fútbol belga y uno de los grandes mediapuntas de su generación. Pase, llegada, balón parado, lectura. Su Mundial número 4 puede ser el de la despedida... o el del milagro.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Mediocampo de élite (De Bruyne, Tielemans, Onana de Aston Villa, Mangala), ataque con Lukaku siendo aún goleador top en Italia y portería con Casteels o Sels. Generación curtida en grandes torneos y experiencia mundialista colectiva enorme.",
    },
    risks: {
      title: "Riesgos",
      text: "Defensa central muy envejecida o joven sin curtir, lo segundo. Dependencia altísima de De Bruyne para crear: si no llega bien, Bélgica genera poquísimo. Las eliminaciones en Qatar (fase de grupos) y Euro 2024 (octavos) muestran descenso real.",
    },
    expectation:
      "Primer puesto del grupo con cierta comodidad, cuartos como mínimo. Semifinales sería objetivo realista para una generación que no se ha de dar por enterrada todavía.",
  },
  IRN: {
    intro:
      "Irán llega al Mundial 2026 con su séptima participación, todas con la espina de no haber pasado nunca de la fase de grupos. Team Melli encuadrado con Bélgica, Egipto y Nueva Zelanda llega con un grupo que cree poder ser el del techo histórico definitivo.",
    star: {
      title: "Mehdi Taremi",
      text: "El delantero del Inter (tras dejar el Porto) es el goleador histórico activo de Irán. Movilidad, finalización con las dos piernas y mucha experiencia europea — Taremi es el referente y carga con la responsabilidad del gol persa en el Mundial.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Bloque defensivo trabajado bajo Amir Ghalenoei (y antes Queiroz, que dejó escuela), físico medio-alto y un par de jugadores en ligas top (Taremi, Azmoun) que pueden marcar diferencia. Saben competir contra europeos disciplinados.",
    },
    risks: {
      title: "Riesgos",
      text: "Falta de creación entre líneas: ofensivamente dependen de aciertos individuales más que de juego elaborado. Defensa central con bajas potenciales. La sombra de no haber pasado nunca de fase de grupos pesa cada vez que se intenta.",
    },
    expectation:
      "Pelear el segundo puesto con Egipto. Pasar a R32 por primera vez en la historia sería el techo absoluto del fútbol iraní y el legado de esta generación.",
  },
  EGY: {
    intro:
      "Egipto vuelve al Mundial tras ausentarse de Qatar 2022 (eliminado por Senegal en repesca). Los Faraones, con Mohamed Salah como faro absoluto, llegan al 2026 buscando reivindicarse y reverdecer la historia mundialista egipcia tras ser potencia africana clara.",
    star: {
      title: "Mohamed Salah",
      text: "El Rey del Liverpool sigue siendo, a sus 33 años, uno de los mejores extremos del mundo. Velocidad, finalización con la zurda, jugadas individuales que cambian partidos. Salah ya jugó el Mundial 2018 con la rodilla recién operada; en 2026 va a por la revancha y por la historia personal que le falta: un gran torneo con su selección.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Salah arriba marcando el techo, Mohamed Elneny aportando experiencia en el medio (aunque ya en final), Trezeguet por la otra banda y un bloque defensivo trabajado. Egipto sabe competir partidos cerrados y ganar al sufrimiento — su receta CAN-Africana histórica.",
    },
    risks: {
      title: "Riesgos",
      text: "Dependencia absoluta de Salah: si él no rinde, el equipo no genera. Generación post-Salah aún sin estrellas claras. Inexperiencia mundialista reciente y descenso del nivel medio respecto a las grandes generaciones africanas.",
    },
    expectation:
      "Pelear con Irán el segundo puesto del grupo. Pasar a R32 sería un éxito y un regalo para el adiós mundialista de Salah, que probablemente sea su último.",
  },
  NZL: {
    intro:
      "Nueva Zelanda vuelve al Mundial 16 años después de Sudáfrica 2010, donde los All Whites no perdieron ningún partido y se fueron eliminados invictos. Una generación nueva, sin las leyendas Ricki Herbert/Mark Paston, llega a renovar la historia mundialista del fútbol oceánico.",
    star: {
      title: "Chris Wood",
      text: "El delantero del Nottingham Forest es el referente neozelandés. Carrera larga en Inglaterra (Leicester, Burnley, Newcastle), físico potente, juego de área y experiencia mundialista de 2010. A sus 34 años, Wood carga con el gol y la jerarquía moral de los All Whites en su tercer Mundial.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Físico anglosajón en el bloque medio, juego directo eficaz y mentalidad colectiva. Saben sufrir partidos cerrados (lo demostraron en 2010 sacando tres empates). El cuerpo técnico conoce la fórmula y Wood arriba siempre genera respeto.",
    },
    risks: {
      title: "Riesgos",
      text: "Nivel técnico medio-bajo respecto al resto del grupo: pocos jugadores en ligas top fuera de Wood. Falta de jugadores creativos entre líneas. La inexperiencia mundialista colectiva post-2010 es real, salvo el propio Wood.",
    },
    expectation:
      "Cuarto del grupo es el escenario más probable. Sumar un punto sería un éxito tangible y repetir el invicto de 2010 (improbable, pero soñable) entraría en leyenda neozelandesa.",
  },

  // ──────────────────────── Grupo H ────────────────────────
  ESP: {
    intro:
      "España llega al Mundial 2026 como una de las grandes favoritas tras conquistar la Eurocopa 2024 con autoridad. La selección dirigida por Luis de la Fuente combina la generación post-2010 (Carvajal, Morata) con una camada explosiva (Lamine Yamal, Nico Williams, Pedri) que es de las mejores del fútbol mundial actual.",
    star: {
      title: "Lamine Yamal",
      text: "El extremo del Barcelona (con apenas 18 años cuando empiece el Mundial) es la mayor sensación del fútbol mundial. Técnica fina, regate corto, finalización a la sombra, asistencia. Lamine ya fue clave en la Euro 2024 y llega al Mundial 2026 como uno de los principales candidatos al Balón de Oro. Es el jugador alrededor del que España construye magia.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Tridente Lamine-Nico-Mikel Oyarzabal con desequilibrio absoluto, mediocampo de élite (Pedri, Rodri, Fabián Ruiz), defensa central con Le Normand, Cubarsí, Laporte. Posesión asociada, intensidad y un De la Fuente que ha refundado el éxito español. Tras 12 años sin grandes torneos, España es referencia absoluta otra vez.",
    },
    risks: {
      title: "Riesgos",
      text: "Falta de un 9 referencia top consolidado (Morata es funcional pero no del nivel de los grandes), defensa central con jugadores muy jóvenes que pueden sufrir en KO contra atacantes top. La presión de revalidar el título europeo y el peso de favoritismo son arma de doble filo.",
    },
    expectation:
      "Primer puesto del grupo cómodo, semifinales como mínimo. España es candidata real a su segunda estrella mundial y la final es objetivo legítimo de esta generación. Si Lamine y Pedri llegan al 100%, casi nadie puede pararles.",
  },
  URU: {
    intro:
      "Uruguay llega al Mundial 2026 tras un proceso de relevo generacional con Marcelo Bielsa que ha sido turbulento pero también revitalizador. La Celeste, tras una decepcionante Copa América 2024 (semis), aterriza con una mezcla de veteranos selectos (Bentancur, Núñez) y juventud explosiva (Pellistri, Araújo).",
    star: {
      title: "Federico Valverde",
      text: "El mediocentro del Real Madrid es el jugador más completo del fútbol uruguayo actual. Físico, llegada al área, disparo lejano, polivalencia táctica. Valverde puede jugar de interior, de pivote, incluso de extremo. Su capacidad para aparecer en momentos cumbre y romper partidos con un golpeo le convierte en el referente absoluto.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Bielsa aporta identidad táctica clara (presión alta, juego asociado, intensidad sostenida), generación talentosa (Núñez, Pellistri, Olivera) y la mística uruguaya histórica que cualquier rival respeta. Defensa con Araújo y Giménez es de las mejores del mundo. Saben competir partidos cerrados.",
    },
    risks: {
      title: "Riesgos",
      text: "Relación de Bielsa con jugadores y federación ha sido tensa: si estalla durante el torneo, todo se complica. Falta de un mediapunta creativo top, dependencia de aciertos individuales y la presión de no haber ganado nada relevante desde la Copa América 2011.",
    },
    expectation:
      "Pelear el primer puesto con España, cuartos como mínimo. Semifinales realista y una posible vuelta a final 76 años después (la última fue Brasil 1950, donde ganaron la Copa). Esta generación tiene techo top.",
  },
  KSA: {
    intro:
      "Arabia Saudí regresa al Mundial 2026 tras su hazaña de Qatar 2022 (la victoria histórica contra Argentina por 2-1 en su primer partido). Una selección que vive el boom del fútbol nacional con la Saudi Pro League en plena explosión y Roberto Mancini al banquillo.",
    star: {
      title: "Salem Al-Dawsari",
      text: "El extremo del Al-Hilal es el héroe de la victoria contra Argentina en 2022 (suyo fue el segundo gol histórico). Velocidad, regate y un disparo zurdo decisivo. A sus 34 años, Al-Dawsari sigue siendo referente ofensivo de los Halcones Verdes y va a por su tercer Mundial buscando otro momento que recordar.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Mancini aporta jerarquía italiana, jugadores curtidos jugando contra estrellas mundiales en la SPL (Ronaldo, Mané, Neymar fueron compañeros suyos), físico mejorado y la confianza del momento Argentina-2022 todavía latente.",
    },
    risks: {
      title: "Riesgos",
      text: "Calidad media muy por debajo de España, Uruguay y Cabo Verde (que sorprende). La SPL ha inflado salarios y nivel local pero el techo individual sigue limitado. Defensa con baches y portería sin un referente top.",
    },
    expectation:
      "Pelear con Cabo Verde el tercer puesto del grupo. Repetir la sorpresa de 2022 contra Argentina (esta vez contra España o Uruguay) sería titular global pero improbable; sumar un punto es objetivo más realista.",
  },
  CPV: {
    intro:
      "Cabo Verde protagoniza una clasificación histórica al ser el país más pequeño en participar en un Mundial (apenas 500.000 habitantes). Los Tubarões Azuis llegan al 2026 con la dignidad de haber sido la sensación de las clasificatorias CAF.",
    star: {
      title: "Ryan Mendes",
      text: "El extremo veterano (en final de carrera) es el goleador histórico activo de Cabo Verde y referente moral del proyecto. Carrera larga en ligas portuguesa, francesa y árabe, técnica fina y la responsabilidad de liderar el primer Mundial de su país.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Hambre absoluta y ausencia total de presión. Muchos jugadores con doble nacionalidad portuguesa, formados en la Liga Portugal y con calidad técnica por encima del estándar caboverdiano original. Equipo cohesionado tras campaña clasificatoria épica.",
    },
    risks: {
      title: "Riesgos",
      text: "Diferencia enorme de nivel respecto a España y Uruguay. Falta de hábito mundialista (es el primer torneo en la historia) y una sola lesión clave puede bajar el nivel mucho. Sin estrella consolidada en élite europea.",
    },
    expectation:
      "Cuarto del grupo es lo esperable. Marcar un gol sería un éxito histórico, sumar un punto sería para los anales del fútbol caboverdiano. Cabo Verde ya hizo historia clasificando — todo lo demás es regalo.",
  },

  // ──────────────────────── Grupo I ────────────────────────
  FRA: {
    intro:
      "Francia llega al Mundial 2026 como una de las dos o tres mayores favoritas al título. Subcampeona en Qatar 2022 (final perdida en penaltis contra Argentina) y campeona en Rusia 2018, la generación de Mbappé está en pleno prime con la espina del trofeo perdido en Doha.",
    star: {
      title: "Kylian Mbappé",
      text: "El delantero del Real Madrid es probablemente el mejor jugador del mundo en 2026. Tras hacer hat-trick en la final de Qatar y aún así perderla, llega al Mundial siguiente con sed absoluta de revancha. Velocidad, finalización, regate y mentalidad ganadora. A sus 27 años, Mbappé puede ser el jugador del torneo y llevar a Francia hasta la tercera estrella.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Plantel de élite por todos lados: Mbappé arriba, Tchouaméni y Camavinga en medio, Theo Hernández y Koundé en defensa, Maignan portero. Profundidad sin rival mundial, experiencia mundialista enorme (varios jugadores con dos finales). Cuerpo técnico (Deschamps) sabe ganar Mundiales.",
    },
    risks: {
      title: "Riesgos",
      text: "Defensa central post-Varane menos jerárquica, mediocampo creativo con Griezmann en final de carrera y dependencia altísima de Mbappé. Tendencia a relajarse en fase de grupos (les pasó en Qatar contra Túnez) y vestuario que puede explotar — históricamente Francia ha sufrido crisis internas.",
    },
    expectation:
      "Primer puesto cómodo, semifinales como mínimo. La final es objetivo natural de esta selección y la tercera estrella, la ambición legítima. Mbappé tiene un Mundial de niño (2018) y otro de adulto perdido (2022) — el tercero puede ser el grande.",
  },
  SEN: {
    intro:
      "Senegal llega al Mundial 2026 como uno de los referentes africanos junto a Marruecos. Campeón de la CAN 2021 y con la generación dorada de Mané, Koulibaly y Sarr todavía en activo, los Leones de Teranga aterrizan con el listón alto y la espina del KO temprano de Qatar.",
    star: {
      title: "Sadio Mané",
      text: "A sus 34 años, el extremo del Al-Nassr (tras pasos por Liverpool, Bayern) sigue siendo el referente absoluto del fútbol senegalés. Velocidad mantenida, finalización, jerarquía moral y leyenda viva. Mané no llegó a Qatar 2022 por lesión y va a por su revancha mundialista personal.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Físico africano élite (mediocampo intenso, transiciones rápidas), defensa central con jerarquía y un Aliou Cissé como seleccionador veterano. Generación curtida en grandes torneos (campeones africanos, octavos en Qatar). Ismaila Sarr aporta velocidad por la otra banda.",
    },
    risks: {
      title: "Riesgos",
      text: "Edad alta de las piezas clave (Mané, Koulibaly), defensa central post-Koulibaly con dudas y la presión de cumplir tras la decepción de cuartos en CAN 2024. Cruce con Francia complicado al máximo.",
    },
    expectation:
      "Pelear el segundo puesto con Noruega. Pasar a R32 es objetivo realista y cuartos sería volver a igualar el techo histórico de 2002. Esta generación tiene una última oportunidad de levantar algo grande.",
  },
  NOR: {
    intro:
      "Noruega regresa al Mundial 28 años después de Francia 1998 con la mejor generación de su historia. Erling Haaland al frente, Martin Ødegaard como capitán y un staff que ha refundado por completo la mentalidad de los noruegos pasa al fin de eternos también-rans.",
    star: {
      title: "Erling Haaland",
      text: "El delantero del Manchester City es el goleador puro más temible del fútbol mundial. Físico apabullante, velocidad para su tamaño, finalización con las dos piernas y mentalidad de killer absoluto. Haaland llega al Mundial 2026 sin haber jugado nunca uno — su debut mundialista a los 25 años se espera mítico.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Haaland+Ødegaard es uno de los binomios más letales del fútbol europeo. Generación curtida (Sørloth, Berg, Aursnes, Strand Larsen), físico nórdico tradicional y un Ståle Solbakken que ha encontrado la fórmula. El proyecto noruego está en plena explosión.",
    },
    risks: {
      title: "Riesgos",
      text: "Dependencia altísima de Haaland: si no le llegan balones limpios, Noruega genera menos de lo esperable. Defensa central sin un líder mundial top y portería con dudas. Inexperiencia mundialista colectiva total (es el primer torneo).",
    },
    expectation:
      "Pelear el primer puesto con Francia (improbable pero soñable) o el segundo con Senegal. Cuartos sería el techo más realista y semis, la sorpresa romántica. Es el Mundial donde Haaland va a marcar época.",
  },
  IRQ: {
    intro:
      "Irak regresa al Mundial 40 años después de México 1986. Los Leones de Mesopotamia, ganadores de la Copa Asiática 2007 (una hazaña histórica en plena guerra civil), llegan al 2026 con un proyecto sin estrellas globales pero con identidad.",
    star: {
      title: "Aymen Hussein",
      text: "El delantero, veterano de la liga doméstica y la Liga Asiática, es el goleador histórico activo iraquí y referente moral del proyecto. Sin pasar por ligas top europeas, Hussein conoce muy bien el sufrimiento competitivo y carga con el gol nacional.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Hambre histórica de un pueblo que ha esperado cuatro décadas por este Mundial, físico medio (mediocampo trabajador) y bloque defensivo bajo Jesús Casas (seleccionador español). Saben competir y sufrir desde el orden — herencia de la generación 2007.",
    },
    risks: {
      title: "Riesgos",
      text: "Calidad técnica claramente por debajo de Francia, Senegal y Noruega. Pocos jugadores en ligas top europeas y muy poca experiencia mundialista colectiva (es el primer Mundial para 100% de la plantilla). Sin un goleador del nivel del grupo.",
    },
    expectation:
      "Cuarto del grupo es el escenario probable. Sumar un punto sería logro histórico tras la sequía de 40 años. Volver a un Mundial ya es éxito para Irak — pelear con dignidad es la meta tangible.",
  },

  // ──────────────────────── Grupo J ────────────────────────
  ARG: {
    intro:
      "Argentina llega al Mundial 2026 como campeona vigente tras conquistar Qatar 2022. La generación dorada de Messi cierra ciclo y la Selección bajo Lionel Scaloni busca defender el título con uno de los planteles más completos del fútbol mundial.",
    star: {
      title: "Lionel Messi",
      text: "A sus 38-39 años, La Pulga afronta su sexto y previsiblemente último Mundial. Tras conseguir al fin la copa en Qatar 2022, Messi llega al 2026 con la presión disuelta y todo por disfrutar. Si está sano, sigue siendo decisivo a cualquier nivel. Pase magistral, asistencia, gol — el último baile mundialista de uno de los mejores de la historia.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Campeón vigente con casi todos los jugadores top en activo: Julián Álvarez goleando en el Atleti, Mac Allister y Enzo Fernández en el medio, Cristian Romero en defensa, Dibu Martínez bajo palos. Mentalidad ganadora, química probada y Scaloni que sabe exactamente qué hacer.",
    },
    risks: {
      title: "Riesgos",
      text: "Edad de Messi y Di María (retirado pero su falta se nota), defensa central con baches y dependencia de la inspiración del 10. El peso de defender el título genera presión añadida y la Albiceleste suele jugarse todo a momentos puntuales.",
    },
    expectation:
      "Primer puesto del grupo cómodo, semifinales como mínimo. La final es objetivo natural y revalidar título sería la coronación absoluta de la era Messi. Es la única selección que ha ganado Mundial seguido (1978-1986 con Maradona casi); repetirlo entraría en otro plano.",
  },
  ALG: {
    intro:
      "Argelia vuelve al Mundial 12 años después de Brasil 2014, donde alcanzó octavos con Vahid Halilhodžić. Los Fennecs, dirigidos ahora por Vladimir Petković, llegan al 2026 con una generación talentosa que combina veteranía y juventud africana.",
    star: {
      title: "Riyad Mahrez",
      text: "El extremo del Al-Ahli (tras dejar el Manchester City) sigue siendo el referente argelino. Técnica fina, regate, golpeo de zurda y experiencia europea de élite. A sus 35 años, Mahrez carga con el peso histórico de devolver a Argelia al mapa mundialista que ya conoció en 2014.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Mediocampo creativo de élite (Mahrez, Bennacer del Milan, Aouar), físico africano y mentalidad competitiva probada. Petković aporta orden táctico balcánico. Generación que ya ganó la CAN 2019 y sabe lo que es levantar copas.",
    },
    risks: {
      title: "Riesgos",
      text: "Defensa central con dudas a alto nivel, portería que ha cambiado mucho y dependencia muy alta de Mahrez. El cruce con Argentina pinta complicado y la inexperiencia mundialista de gran parte del plantel pesa.",
    },
    expectation:
      "Pelear el segundo puesto con Austria. Pasar a R32 sería un éxito y volver a octavos como en 2014 (donde cayeron 2-1 con Alemania campeona) entraría en el legado de la generación.",
  },
  AUT: {
    intro:
      "Austria vuelve al Mundial tras 28 años (la última cita fue Francia 1998). Una generación moderna que en la Eurocopa 2024 jugó muy bien (eliminada por Turquía en octavos) llega al 2026 con Ralf Rangnick al banquillo y un proyecto futbolístico real.",
    star: {
      title: "David Alaba",
      text: "El defensor del Real Madrid (en proceso de recuperación post-rotura del cruzado) es el jugador más completo del fútbol austriaco moderno. Versatilidad (puede jugar de central, lateral o medio), juego con balón de élite y jerarquía mundial. Si llega bien físicamente, marca el techo del equipo.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Rangnick aporta gegenpressing y orden táctico alemán, jugadores físicos en mediocampo (Sabitzer, Seiwald), defensa con jerarquía y un Marko Arnautović aún veterano útil. Buena Eurocopa 2024 ha asentado identidad e ilusión.",
    },
    risks: {
      title: "Riesgos",
      text: "Estado físico de Alaba es la gran incógnita. Falta de un delantero referencia top consolidado. Inexperiencia mundialista colectiva tras tantos años sin clasificar y un grupo con Argentina campeona como coco mayor.",
    },
    expectation:
      "Pelear el segundo puesto con Argelia. Pasar a R32 sería confirmación de que la generación Rangnick-Alaba ha refundado el fútbol austriaco; cuartos, el techo realista ambicioso.",
  },
  JOR: {
    intro:
      "Jordania protagoniza su primera clasificación histórica a un Mundial tras una hazaña deportiva enorme (sorprendieron en la Copa Asiática 2024 alcanzando la final). Los Caballeros llegan al 2026 con la ilusión intacta y la presión cero — todo es regalo.",
    star: {
      title: "Mousa Al-Tamari",
      text: "El extremo del Montpellier (con paso por OH Leuven, donde explotó) es la cara del proyecto jordano. Velocidad, regate, finalización y nivel europeo top medio. Al-Tamari fue clave en la Asian Cup 2024 y carga con el gol jordano en el Mundial.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Ausencia total de presión, hambre máxima y la confianza ganada en la Asian Cup. Bloque cohesionado, físico medio-alto y un cuerpo técnico que conoce a cada jugador. Hussein Ammouta sabe exactamente qué hacer con este grupo.",
    },
    risks: {
      title: "Riesgos",
      text: "Diferencia muy alta de nivel respecto a Argentina, Argelia y Austria. Pocos jugadores en ligas top fuera de Al-Tamari y Yazan Al-Naimat. Inexperiencia mundialista colectiva total.",
    },
    expectation:
      "Cuarto del grupo es lo esperable. Marcar un gol sería celebración nacional, sumar un punto sería para los anales del fútbol jordano. Jordania ya hizo historia llegando — todo lo demás es novela.",
  },

  // ──────────────────────── Grupo K ────────────────────────
  POR: {
    intro:
      "Portugal llega al Mundial 2026 con una generación talentosa y la sombra alargada de Cristiano Ronaldo, que a sus 41 años afronta su sexto Mundial (récord absoluto). Bajo Roberto Martínez, la Seleção busca al fin coronar una década entera siendo subjetivamente el equipo con más calidad sin levantar la Copa.",
    star: {
      title: "Bernardo Silva",
      text: "El mediapunta del Manchester City es el cerebro creativo del fútbol portugués. Técnica fina, visión, llegada y un nivel de regularidad que le ha hecho ganar cuatro Premier Leagues con el City. A sus 31 años, Bernardo está en su prime y carga con la responsabilidad de organizar el juego portugués entre líneas.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Plantel de élite: Bruno Fernandes, Bernardo, João Félix, Rafael Leão, Vitinha, Rúben Dias, Dalot. Profundidad ofensiva enorme, Cristiano arriba pidiendo el último baile y Roberto Martínez ya conoce los Mundiales. Campeones de Euro 2016 y Nations League — saben ganar.",
    },
    risks: {
      title: "Riesgos",
      text: "Estado físico de Cristiano y la duda eterna de si su titularidad limita al equipo. Defensa central sin Pepe y con menos jerarquía. Tendencia histórica a frustrarse en cuartos contra equipos físicos. La presión de la generación dorada sin Mundial pesa cada vez más.",
    },
    expectation:
      "Primer puesto del grupo cómodo, semifinales como mínimo. La final es objetivo realista y la Copa, la ambición legítima del último baile de Cristiano. Esta generación se cansa de ser favorita.",
  },
  COL: {
    intro:
      "Colombia llega al Mundial 2026 tras una racha brillante (final de Copa América 2024, perdida solo contra Argentina) y la generación de James Rodríguez aún en activo. Bajo Néstor Lorenzo, los Cafeteros aterrizan como una de las cuatro favoritas sudamericanas.",
    star: {
      title: "Luis Díaz",
      text: "El extremo del Barcelona (tras dejar el Liverpool) es el jugador más explosivo del fútbol colombiano actual. Velocidad espectacular, regate corto, finalización con la zurda y un nivel de élite que se ha consolidado en la Premier League. Lucho carga con el ataque cafetero.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Dúo Díaz-James en estado de gracia, mediocampo de élite (Lerma, Richard Ríos), defensa con Lucumí, Mina y Cuadrado por banda. Bloque cohesionado bajo Lorenzo, ofensiva creativa y físico sudamericano. Mejor selección colombiana desde 2014.",
    },
    risks: {
      title: "Riesgos",
      text: "Defensa central con baches en alto nivel, portería con dudas tras el ocaso de Ospina y dependencia altísima del estado físico de James y Lucho. Tendencia histórica a colapsar en KO importantes (cuartos 2014 contra Brasil, octavos 2018 con Inglaterra).",
    },
    expectation:
      "Primer puesto del grupo realista, cuartos como mínimo. Semifinales sería igualar techo histórico (1990 con Pacho Maturana llegó hasta octavos solamente, no llegaron a semi). Esta generación tiene capacidad para escribir un capítulo nuevo.",
  },
  UZB: {
    intro:
      "Uzbekistán protagoniza su primera clasificación histórica a un Mundial tras años de quedarse a las puertas. Los Lobos Blancos llegan al 2026 con la euforia intacta y un proyecto que se ha consolidado bajo Timur Kapadze tras Srečko Katanec.",
    star: {
      title: "Eldor Shomurodov",
      text: "El delantero del Roma (cedido por Roma históricamente) es el referente ofensivo uzbeko. Altura, juego de área, finalización con las dos piernas y experiencia en la Serie A. Shomurodov carga con el gol nacional en el primer Mundial de la historia de Uzbekistán.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Hambre máxima, presión cero y la confianza ganada en la clasificación AFC. Bloque cohesionado, físico medio-alto y un cuerpo técnico que ha trabajado años por este momento. Saben competir contra europeos y sudamericanos top — lo hicieron en preparaciones recientes.",
    },
    risks: {
      title: "Riesgos",
      text: "Diferencia significativa de nivel respecto a Portugal y Colombia. Pocos jugadores en ligas top europeas fuera de Shomurodov. Inexperiencia mundialista colectiva absoluta (es el primer Mundial en la historia).",
    },
    expectation:
      "Cuarto del grupo es el escenario probable. Sumar un punto sería un éxito real y marcar un gol, celebración nacional. Uzbekistán ya hizo historia clasificando — el resto es regalo.",
  },
  COD: {
    intro:
      "República Democrática del Congo regresa al Mundial 50 años después de Alemania 1974 (entonces como Zaire, con la famosa falta despejada por Mwepu antes de que sonara el silbato). Los Leopardos vuelven al fin a un escenario que les era esquivo.",
    star: {
      title: "Yoane Wissa",
      text: "El delantero del Brentford es la cara goleadora del proyecto congoleño. Movilidad, finalización, físico africano y experiencia en la Premier League. Wissa explotó en Inglaterra y carga con la responsabilidad ofensiva del fútbol congoleño en su regreso mundialista histórico.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Generación talentosa (Wissa, Cédric Bakambu, Chancel Mbemba), físico africano élite y mentalidad de equipo cohesionado. Pelearon una semifinal de CAN 2023 y eso curte. Sébastien Desabre aporta orden táctico francés.",
    },
    risks: {
      title: "Riesgos",
      text: "Inexperiencia mundialista total (medio siglo sin pisar Mundial), defensa con baches a alto nivel y portería que ha cambiado mucho. El cruce con Portugal y Colombia pinta muy complicado.",
    },
    expectation:
      "Tercer puesto realista, peleando con Uzbekistán por evitar el último puesto. Pasar a R32 como mejor 3º sería el éxito mayúsculo y un legado real para una generación que ha esperado décadas por este Mundial.",
  },

  // ──────────────────────── Grupo L ────────────────────────
  ENG: {
    intro:
      "Inglaterra llega al Mundial 2026 con la generación dorada de Bellingham, Foden y Saka en plena explosión. Bajo Thomas Tuchel (relevo de Southgate tras la final perdida de la Euro 2024), los Three Lions buscan al fin coronar 60 años después la única estrella de su historia.",
    star: {
      title: "Jude Bellingham",
      text: "El mediocampista del Real Madrid es el jugador más completo del fútbol inglés actual. Llegada al área, gol, físico, jerarquía, mentalidad. A sus 22 años, Bellingham puede ser el jugador del torneo y llevar a Inglaterra hasta el trono perdido desde 1966. Es generacional.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Plantel élite por todos lados: Bellingham, Foden, Saka, Palmer, Rice, Stones, Pickford. Tuchel aporta ganas de ganar y experiencia mundialista (Champions con el Chelsea). Profundidad enorme y experiencia colectiva (semifinal 2018, cuartos 2022, final Euro 2020, final Euro 2024).",
    },
    risks: {
      title: "Riesgos",
      text: "Histórica capacidad para frustrarse en finales y partidos cumbre. Defensa central post-Maguire con dudas, portería con Pickford ya en final de carrera. La presión nacional inglesa es brutal cada Mundial — y siempre acaba pesando.",
    },
    expectation:
      "Primer puesto del grupo cómodo, semifinales como mínimo. La final es objetivo natural y la Copa, la ambición que cada generación inglesa promete y nunca cumple. Esta vez podría romperse la maldición.",
  },
  CRO: {
    intro:
      "Croacia llega al Mundial 2026 tras dos sorpresas mayúsculas: subcampeón en Rusia 2018 (final perdida con Francia) y tercero en Qatar 2022. La generación dorada de Modrić se despide del fútbol mundialista en un torneo donde el techo histórico ya está triplemente roto.",
    star: {
      title: "Luka Modrić",
      text: "El mediocampista del Milan (tras la era dorada del Real Madrid) afronta a sus 41 años su sexto Mundial. Balón de Oro 2018, capitán histórico y leyenda absoluta del fútbol croata. Modrić sigue siendo decisivo a su nivel y va a por la despedida soñada en un Mundial.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Mediocampo histórico (Modrić, Brozović, Kovačić), físico balcánico, mentalidad ganadora probada y experiencia mundialista enorme (final 2018, tercer puesto 2022). Una generación que se ha hecho de hierro en partidos cerrados — siempre sabe sufrir.",
    },
    risks: {
      title: "Riesgos",
      text: "Edad alta de las piezas claves (Modrić, Perišić). Falta de un goleador referente top consolidado tras el ocaso de Kramarić y Petković. La generación dorada cierra ciclo y el relevo aún no está claro.",
    },
    expectation:
      "Pelear el primer puesto con Inglaterra. Cuartos como mínimo realista y semifinales, repetición posible. La final entraría en otro plano, pero esta generación nos ha enseñado a no descartar nada.",
  },
  GHA: {
    intro:
      "Ghana vuelve al Mundial 2026 tras la decepción de Qatar 2022 (eliminado en fase de grupos tras un Uruguay-Ghana con sabor a venganza por 2010). Las Estrellas Negras, con Mohammed Kudus como nueva cara, llegan al 2026 a buscar el equilibrio entre la generación dorada antigua y la nueva.",
    star: {
      title: "Mohammed Kudus",
      text: "El mediapunta del Tottenham (tras explotar en el Ajax y consolidarse en el West Ham y luego Spurs) es la cara joven del fútbol ghanés. Técnica fina, regate, llegada y un nivel de élite europea consolidado. Kudus carga con la creación ofensiva ghanesa en su primer Mundial protagonista.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Físico africano élite, mediocampo intenso (Thomas Partey, Mohammed Salisu en defensa), Kudus como diferencial y una afición que viaja masivamente. Otto Addo aporta orden táctico y conoce la idiosincrasia del fútbol ghanés desde dentro.",
    },
    risks: {
      title: "Riesgos",
      text: "Defensa central con dudas a alto nivel, portería que ha cambiado mucho y dependencia altísima de Kudus. La frustración acumulada tras Qatar (donde el sueño se rompió pronto) puede ser carga emocional.",
    },
    expectation:
      "Pelear el segundo puesto con Croacia. Pasar a R32 sería el éxito y reverdecer la mejor era ghanesa (cuartos 2010, eliminados solo por la mano de Suárez). Esta generación tiene capacidad para escribir.",
  },
  PAN: {
    intro:
      "Panamá llega al Mundial 2026 en su segunda participación histórica (la primera fue Rusia 2018, donde cayeron en fase de grupos contra Bélgica, Inglaterra y Túnez). La Marea Roja vuelve a la cita con la espina de aquellas tres derrotas y una generación renovada.",
    star: {
      title: "Adalberto Carrasquilla",
      text: "El mediocentro veterano, con experiencia en la MLS y la Liga MX, es el referente del fútbol panameño actual. Físico, distribución, llegada y jerarquía moral. Sin estrellas mediáticas top, Carrasquilla representa el alma del proyecto centroamericano.",
    },
    strengths: {
      title: "Fortalezas",
      text: "Físico centroamericano (mediocampo intenso, físico anglosajón en defensa), experiencia de muchos jugadores en MLS y Liga MX. Thomas Christiansen aporta orden táctico europeo. Pelearon una final de Copa Oro 2023 y eso curte mucho.",
    },
    risks: {
      title: "Riesgos",
      text: "Diferencia de nivel respecto a Inglaterra y Croacia (Mundial 2018 era escenario muy parecido y acabó con tres derrotas y 11 goles en contra). Pocos jugadores en ligas top europeas y un techo individual limitado.",
    },
    expectation:
      "Cuarto o tercer puesto del grupo. Pelear el tercero con Ghana, sumar el primer punto histórico de Panamá en un Mundial (en 2018 perdieron los tres partidos). Marcar más goles que aquella vez (donde marcaron sólo 2) sería progreso real.",
  },
};

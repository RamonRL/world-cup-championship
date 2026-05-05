/**
 * Análisis editoriales por grupo. Se renderiza en la página de detalle del
 * grupo (`/grupos/[code]`) como contenido SEO sustantivo: contexto, favorito
 * claro, candidato a 2º, dark horse y predicción del paso a R32. Cada bloque
 * está en español, ~250-350 palabras por grupo, escrito para que aporte
 * valor real al lector — no relleno de keywords.
 *
 * Si la FIFA cambia algún equipo o quieres pulir el copy, edita aquí: la
 * página lo recoge automáticamente. Si añades un nuevo grupo, asegúrate de
 * que el code coincide con `groups.code` en la DB.
 */

export type GroupSection = { team: string; text: string };

export type GroupAnalysis = {
  intro: string;
  favorite: GroupSection;
  contender: GroupSection;
  darkHorse: GroupSection;
  prediction: string;
};

export const GROUP_ANALYSES: Record<string, GroupAnalysis> = {
  A: {
    intro:
      "Grupo de los anfitriones mexicanos: el calor del Azteca como ventaja, una Corea del Sur veterana liderada por Son, una Sudáfrica que vuelve al Mundial dos décadas después y una República Checa que no faltaba a la cita desde 2006. Sobre el papel parece un grupo asequible para que México arranque con tres victorias, pero el Mundial siempre tiene trampa y los partidos contra Corea suelen ser un examen físico difícil.",
    favorite: {
      team: "México",
      text: "El Tri parte como favorito por una combinación de tres factores: anfitrión, hambre tras un 2022 decepcionante, y el peso emocional de inaugurar el Mundial en el Estadio Azteca el 11 de junio. La generación de Edson Álvarez, Luis Chávez y Santiago Giménez está en plena madurez, y la altura de Ciudad de México es un arma diferencial contra rivales no acostumbrados. La presión del público va a ser tremenda, pero también su soporte: cualquier punto cedido aquí se vive como crisis nacional.",
    },
    contender: {
      team: "Corea del Sur",
      text: "Korea sigue siendo la selección asiática más constante en Mundiales y aterriza con Son Heung-min como capitán y referente, además de jóvenes como Lee Kang-in y Kim Min-jae aportando jerarquía. El partido clave del grupo es México-Corea: si los asiáticos sacan un punto allí, su pase a R32 está prácticamente sellado. Su pegada al contraataque es difícil de manejar incluso para defensas mejor organizadas.",
    },
    darkHorse: {
      team: "República Checa",
      text: "Checos vuelven al Mundial con una generación interesante encabezada por Patrik Schick, peligrosísimo en el área, y un mediocampo físico que puede romper partidos en transición. Si tienen el día, complican mucho a México. Si no, sumar contra Corea es realista.",
    },
    prediction:
      "Pasan México y Corea del Sur. El primer puesto se decide en la jornada 2: si México gana al Tri se queda con el grupo y un cruce favorable en R32. Sudáfrica probablemente quede tercera con opciones de mejor 3º.",
  },
  B: {
    intro:
      "El otro grupo de anfitrión: Canadá vive su Mundial soñado con la generación de Alphonso Davies y Jonathan David, comparte fase de grupos con una Suiza europea sólida, una Bosnia que regresa tras una década con Edin Džeko de leyenda viva y un Qatar que llega más débil que en 2022. Pinta a un grupo donde Canadá y Suiza pelean los dos cupos sin grandes sobresaltos.",
    favorite: {
      team: "Suiza",
      text: "Sin la presión del local, Suiza juega su mejor fútbol cuando aterriza en Mundiales. Es la selección más experimentada del grupo, con un bloque defensivo que rara vez se descontrola y nombres como Manuel Akanji, Granit Xhaka y Breel Embolo. Suelen pasar de fase: lo han hecho en los últimos cuatro Mundiales seguidos. Su talón de Aquiles es la falta de pegada en momentos cumbre, pero contra rivales por debajo de su nivel cumplen.",
    },
    contender: {
      team: "Canadá",
      text: "Anfitriones con una de las mejores generaciones de su historia: Alphonso Davies como motor por banda, Jonathan David como referencia ofensiva, Stephen Eustáquio dirigiendo. Llegaron al Mundial 2022 sin ganar y vuelven con la espina clavada. La presión por hacer historia delante de su gente puede empujarles… o lastrarles. Los partidos en BMO Field y BC Place van a ser carísimos para sus rivales.",
    },
    darkHorse: {
      team: "Bosnia y Herzegovina",
      text: "Vuelven al Mundial tras 12 años con un equipo más joven que el de Brasil 2014 pero con la veteranía de Edin Džeko (39 años, todavía decisivo) y Miralem Pjanić. No para grandes proezas, pero pueden robar puntos a Qatar y Canadá si juegan replegados.",
    },
    prediction:
      "Pasan Suiza y Canadá. Suiza primera por solidez, Canadá segunda con un partido épico ante Bosnia que decida el cupo. Qatar muy probablemente último.",
  },
  C: {
    intro:
      "El grupo de Brasil. Cinco veces campeón del mundo, llega con la presión de siempre — y este Mundial 2026 lo afronta como uno de los principales candidatos al título. Lo emparejan con un Marruecos que sigue siendo la sensación tras su 4º puesto en Qatar 2022, una Escocia que vuelve al Mundial 28 años después y un Haití histórico que regresa al torneo cuatro décadas después. Grupo desigual en jerarquía pero con el morbo del Brasil-Marruecos como gran cita.",
    favorite: {
      team: "Brasil",
      text: "La Canarinha llega con su delantera más completa de la última década: Vinicius Jr en plena madurez, Rodrygo, Endrick, Raphinha, Neymar si llega bien. La duda es la portería y la defensa central — desde Thiago Silva no han encontrado un líder claro atrás. Aun así, en fase de grupos Brasil rara vez sufre: 6 mundiales seguidos pasando primero. La presión real llega en cuartos.",
    },
    contender: {
      team: "Marruecos",
      text: "Los Leones del Atlas no son ya sorpresa: tras alcanzar las semifinales del Mundial 2022 son una potencia consolidada. La defensa de Achraf Hakimi y Romain Saïss sigue siendo de élite, y el bloque medio aporta ese sufrimiento controlado que les caracteriza. Son favoritos claros al segundo puesto y un cruce R32 contra ellos es un partido a evitar.",
    },
    darkHorse: {
      team: "Escocia",
      text: "Tras 28 años de ausencia, Escocia vuelve con un grupo cohesionado liderado por Andy Robertson, John McGinn y Scott McTominay. No tienen estrellas mediáticas pero compiten cada balón. Robar 4 puntos a Marruecos y Haití puede meterles entre los mejores terceros.",
    },
    prediction:
      "Pasan Brasil y Marruecos. Brasil cómodo primero, Marruecos segundo. Escocia tercera con opción real de mejor 3º si arranca bien.",
  },
  D: {
    intro:
      "El grupo de Estados Unidos. Otro anfitrión, otro grupo con favoritismo claro de local: USA aprovecha el factor casa para un sorteo benévolo y comparte fase con un Paraguay sudamericano físico, una Australia veterana clasificada con uñas y dientes desde la AFC, y una Turquía que vuelve tras décadas con la generación más prometedora de su historia. La pelea por el segundo puesto es la verdadera salsa del grupo.",
    favorite: {
      team: "Estados Unidos",
      text: "USA llega como anfitrión con la mejor generación de su historia: Christian Pulisic en su prime, Weston McKennie, Tyler Adams, Gio Reyna. Han ido madurando en mundiales y olímpicos, y la base MLS+Europa les da fondo. El público en SoFi, MetLife y demás va a empujar mucho. Son favoritos a primero del grupo y candidatos serios a llegar a cuartos por primera vez en su historia.",
    },
    contender: {
      team: "Turquía",
      text: "Vuelven al Mundial tras una clasificación brillante. Hakan Çalhanoğlu en su mejor momento, Arda Güler como joven prodigio, Kenan Yıldız emergente. Ofensivamente son un equipo eléctrico, defensivamente todavía verdes. Si pillan a USA en mal día, pueden plantarse arriba.",
    },
    darkHorse: {
      team: "Paraguay",
      text: "Paraguay vuelve a un Mundial tras 16 años con un equipo físico, defensivo y muy difícil de marcar. Pueden empatar partidos a 0-0 y robar puntos a Australia y Turquía. No son sexy pero son competidores.",
    },
    prediction:
      "Pasan USA y Turquía. USA primero con holgura. Turquía y Paraguay disputan el segundo cupo en una jornada 3 a corazón abierto. Australia probablemente cuarta.",
  },
  E: {
    intro:
      "Alemania regresa con la urgencia de redimirse: dos eliminaciones consecutivas en fase de grupos (Rusia 2018, Qatar 2022) han hundido a la Mannschaft a niveles inéditos en su historia. Llegan a un grupo asumible pero peligroso: una Costa de Marfil campeona de África, un Ecuador físico y rocoso, y un Curazao histórico que debuta en mundiales. Si Alemania falla aquí, la crisis sería terminal.",
    favorite: {
      team: "Alemania",
      text: "Cuatro veces campeona del mundo, Alemania llega con Joshua Kimmich, Kai Havertz, Florian Wirtz y Jamal Musiala, y un Toni Kroos retirado que ya no podrá rescatarles. La defensa sigue siendo el problema histórico de los últimos años. Es favorita por jerarquía pero no por confianza: cualquier tropezón temprano ante Marfil o Ecuador y la Mannschaft entra en pánico.",
    },
    contender: {
      team: "Costa de Marfil",
      text: "Los Elefantes vienen de ganar la Copa Africana 2024 jugando en casa con Sébastien Haller como pichichi. Nicolas Pépé recuperado, Wilfried Zaha disponible y Franck Kessié dirigiendo. Físicamente son top. Si Alemania duda en defensa, Marfil tiene puntería para castigarles.",
    },
    darkHorse: {
      team: "Ecuador",
      text: "Ecuador clasifica gracias a Moisés Caicedo y Pervis Estupiñán, dos titulares en equipos top de Premier. Defensivamente sólidos, físicos en transiciones. Entre ellos pueden empatar partidos imposibles. Curazao queda como cuarta pero con la moral del debut.",
    },
    prediction:
      "Pasan Alemania y Costa de Marfil. Si Alemania reaparece como ganadora del grupo, todo va por su cauce. Si los Elefantes ganan el grupo, sería el shock más grande de la primera fase.",
  },
  F: {
    intro:
      "Países Bajos como cabeza de serie clara, Japón como mejor selección asiática del momento, una Suecia post-Zlatan en transición y una Túnez que aterriza por tercer Mundial consecutivo. Grupo donde la Oranje no debería tener problemas, pero el Japón-Suecia y el cruce de los terceros sí ofrecen interés.",
    favorite: {
      team: "Países Bajos",
      text: "Tras el subcampeonato mundial de 2010 y la final de Qatar 2022 lejana, Holanda llega con Virgil van Dijk como líder, Frenkie de Jong dirigiendo, Cody Gakpo y Memphis Depay arriba. Generación con experiencia. La duda eterna sigue siendo si encuentran al delantero centro de élite — pero en grupo no debería pesar.",
    },
    contender: {
      team: "Japón",
      text: "Japón llega como la mejor selección asiática del momento tras un periplo brillante en Qatar 2022 (donde tumbó a Alemania y España). El bloque actual con Wataru Endo, Kaoru Mitoma, Takefusa Kubo y Daichi Kamada es competente. En esta cita van a ser favoritos al segundo puesto y muy difíciles de batir.",
    },
    darkHorse: {
      team: "Suecia",
      text: "Sin Zlatan Ibrahimović, Suecia se reinventa con Alexander Isak liderando ataque y Anthony Elanga, Dejan Kulusevski y Viktor Gyökeres como nueva generación. Tienen pegada a balón parado y físico. Son tercer favorito por delante de Túnez, pero pueden complicarse.",
    },
    prediction:
      "Pasan Países Bajos y Japón. Holanda primera, Japón segunda en una jornada 3 cardiaca contra Suecia. Túnez probablemente cuarta sin opciones.",
  },
  G: {
    intro:
      "Bélgica en transición, Egipto con la última oportunidad de Mohamed Salah, un Irán sólido y combativo y una Nueva Zelanda que vuelve tras 16 años. Grupo más competido de lo que parece sobre el papel: la generación dorada belga ya no manda en Europa, y eso abre el grupo.",
    favorite: {
      team: "Bélgica",
      text: "La generación de Hazard, De Bruyne y Lukaku ya no es la promesa que prometía título mundial: ahora es un bloque maduro pero con grietas. Kevin De Bruyne sigue siendo de los mejores 10 del mundo, Doku da electricidad por banda, Trossard aporta gol. Defensa el problema. Favoritos por jerarquía.",
    },
    contender: {
      team: "Egipto",
      text: "Mo Salah a sus 33 años (al inicio del Mundial) afronta probablemente su última cita mundial. El Egipto de Salah, Trezeguet y Mohamed Elneny tiene un líder mundial pero un nivel medio justo. Necesitan que Salah esté pletórico para pasar.",
    },
    darkHorse: {
      team: "Irán",
      text: "Irán es una pesadilla defensiva. Sardar Azmoun y Mehdi Taremi arriba, una defensa rocosa y físicos en cada balón. Han clasificado en sus últimos 4 mundiales seguidos. Pueden tumbar a Bélgica si los belgas empiezan despistados.",
    },
    prediction:
      "Pasan Bélgica y Egipto. Bélgica primera por jerarquía, Egipto segunda gracias a Salah. Irán tercera con opciones reales de mejor 3º. Nueva Zelanda probablemente cuarta sumando algún punto.",
  },
  H: {
    intro:
      "El grupo de España. Vigente campeona de la Eurocopa 2024, La Roja afronta el Mundial como la mejor selección del momento en Europa. Le toca un Uruguay reconstruido por Marcelo Bielsa, una Arabia Saudí que volverá a sorprender (como en 2022) y un Cabo Verde histórico debutante. Grupo asequible para España pero con dos rivales sudamericanos peligrosos.",
    favorite: {
      team: "España",
      text: "Tras la Eurocopa 2024 ganada con autoridad, España llega como una de las dos o tres favoritas al título. Lamine Yamal en plena explosión, Pedri y Rodri dirigiendo el medio, Nico Williams por banda, Álvaro Morata como capitán. La defensa con Cubarsí, Le Normand, Cucurella y Carvajal es de las mejores del torneo. Luis de la Fuente tiene el bloque más cohesionado de Europa.",
    },
    contender: {
      team: "Uruguay",
      text: "Bielsa está reconstruyendo a la Celeste con su DNA habitual: presión, físico y vértigo. Darwin Núñez como referencia, Federico Valverde como motor, Maximiliano Araújo en banda. La generación de Suárez y Cavani da paso a una más joven pero igual de combativa. Segundo puesto claro favorito.",
    },
    darkHorse: {
      team: "Cabo Verde",
      text: "Los Tiburones Azules debutan en un Mundial tras una clasificación histórica para un país de medio millón de habitantes. Tienen jugadores en ligas top (Ryan Mendes, Logan Costa, Patrick Andrade). No para meterse, pero sí para empatar algún partido y dejar imagen.",
    },
    prediction:
      "Pasan España y Uruguay. España primera con tres victorias salvo accidente. Uruguay segunda. Arabia Saudí y Cabo Verde pelean por la honra; los caboverdianos pueden dejar mejor sensación.",
  },
  I: {
    intro:
      "Francia campeona de 2018 y subcampeona de 2022 vuelve buscando su tercera estrella, Senegal sigue siendo la potencia africana actual y Noruega por fin lleva a Erling Haaland a un Mundial tras décadas de ausencia escandinava. Iraq cierra el grupo como debutante reciente. Grupo de mucha calidad técnica.",
    favorite: {
      team: "Francia",
      text: "Les Bleus llegan con Kylian Mbappé en plena madurez, Aurélien Tchouaméni y Eduardo Camavinga dirigiendo medio, Antoine Griezmann (si Deschamps sigue contando con él) como segunda punta. Defensa con Saliba, Konaté y Theo Hernández es de élite. Son la favorita conjunta con España al título mundial.",
    },
    contender: {
      team: "Noruega",
      text: "Por primera vez en 28 años Noruega llega a un Mundial. Erling Haaland 25 años, Martin Ødegaard 27, Alexander Sørloth y Antonio Nusa por banda. Si los nórdicos juegan suelto, pueden llegar lejos. Pero falta experiencia mundial y la primera vez asusta.",
    },
    darkHorse: {
      team: "Senegal",
      text: "Sadio Mané, Kalidou Koulibaly y Édouard Mendy lideran a una Senegal que se mantiene en la élite africana desde 2018. Físicos, técnicos, peligrosos en transición. No están al nivel de Marruecos pero pueden complicar a cualquiera.",
    },
    prediction:
      "Pasan Francia y Noruega. Francia primera. Noruega segunda en su debut tras una jornada 3 vibrante. Senegal queda tercera con opciones de mejor 3º. Iraq cuarto sin opciones reales.",
  },
  J: {
    intro:
      "El grupo de Argentina campeona vigente. La Albiceleste llega defendiendo título por primera vez desde 1986 y comparte fase con una Argelia que vuelve al Mundial 12 años después, una Austria sólida con Alaba como referente y una Jordania que debuta en mundiales tras llegar a la final de la Copa Asia 2023. Grupo asequible para Argentina pero la pelea por el segundo cupo está abierta.",
    favorite: {
      team: "Argentina",
      text: "Lionel Messi, a sus 38 años (al kickoff), afronta lo que casi seguro es su última Copa del Mundo, defendiendo título. La generación de Lautaro Martínez, Julián Álvarez, Enzo Fernández, Alexis Mac Allister y Cristian Romero está en madurez. Lionel Scaloni sigue siendo el técnico que les llevó a la gloria. Argentina es favorita clara al pase y candidata firme a defender corona.",
    },
    contender: {
      team: "Austria",
      text: "Austria con David Alaba al frente (si está sano), Marko Arnautović y Konrad Laimer aporta calidad europea. Buen bloque, organización defensiva, algunos jugadores en la Champions habituales. Es el segundo favorito al pase con cierta holgura, pero no es invencible.",
    },
    darkHorse: {
      team: "Argelia",
      text: "Argelia con Riyad Mahrez como capitán y Saïd Benrahma por banda vuelve al Mundial tras la decepción de no clasificar en 2018 y 2022. Si tienen el día, son peligrosos. Si no, sufren. Mahrez sigue marcando diferencias.",
    },
    prediction:
      "Pasan Argentina y Austria. Argentina primera con holgura, Austria segunda peleando hasta el final con Argelia. Jordania probablemente cuarta sin grandes problemas.",
  },
  K: {
    intro:
      "Portugal con Cristiano Ronaldo en su última Copa del Mundo (a sus 41 años cuando arranque el torneo), Colombia con la vuelta de James y Luis Díaz, Uzbekistán como debutante histórico de Asia y una República Democrática del Congo con talento disperso por las grandes ligas europeas. Grupo emocional para los lusos y muy abierto en la pelea por el segundo puesto.",
    favorite: {
      team: "Portugal",
      text: "Portugal llega con la generación de oro consolidada: Cristiano Ronaldo capitán emocional, pero el peso real lo lleva Bruno Fernandes, Bernardo Silva, Bernardo Silva, Rafael Leão y João Félix. Defensa con Rúben Dias y João Cancelo. La duda eterna: ¿pueden traducir tanta calidad en gloria mundial? Esta puede ser la última oportunidad de la generación.",
    },
    contender: {
      team: "Colombia",
      text: "Los Cafeteros con James Rodríguez recuperando nivel, Luis Díaz como referencia ofensiva, Daniel Muñoz, Davinson Sánchez en defensa. Tras hacer una Copa América 2024 brillante (subcampeones), Colombia llega con autoestima alta. Pueden complicar a Portugal si pillan a la generación lusa en mal día.",
    },
    darkHorse: {
      team: "RD del Congo",
      text: "Talento disperso en ligas europeas: Cédric Bakambu, Yoane Wissa, Chancel Mbemba, Théo Bongonda. Si encuentran identidad colectiva, son peligrosos. Si no, irregularidad.",
    },
    prediction:
      "Pasan Portugal y Colombia. Portugal primera por jerarquía y emoción, Colombia segunda en una jornada 3 que decide. Uzbekistán cuarto en un debut digno.",
  },
  L: {
    intro:
      "Inglaterra como una de las grandes favoritas a la corona, Croacia con Luka Modrić en su despedida mundialista (40 años al inicio del torneo), una Ghana que vuelve tras la decepción de 2022 y una Panamá clasificada por segunda vez en su historia. Grupo con dos cabezas claras pero subido de morbo por el factor sentimental de Modrić.",
    favorite: {
      team: "Inglaterra",
      text: "Los Tres Leones llegan con la generación más completa de su historia post-1966: Jude Bellingham, Bukayo Saka, Cole Palmer, Phil Foden, Declan Rice y Harry Kane como capitán y goleador histórico. Defensa con John Stones, Marc Guéhi y Trent Alexander-Arnold. Son una de las dos o tres favoritas al título mundial real.",
    },
    contender: {
      team: "Croacia",
      text: "El último Mundial de Luka Modrić, subcampeón de 2018 y semifinalista de 2022. La generación croata sigue siendo competitiva con Marcelo Brozović, Mateo Kovačić, Andrej Kramarić y Joško Gvardiol. Físicamente más justos que en ediciones anteriores, pero el ADN competitivo sigue ahí.",
    },
    darkHorse: {
      team: "Ghana",
      text: "Las Estrellas Negras vuelven con Mohammed Kudus, Thomas Partey, Iñaki y Jordan Ayew. Tras el ridículo de Qatar (último de grupo), llegan con la espina clavada. Pueden complicar al segundo puesto si tienen el día.",
    },
    prediction:
      "Pasan Inglaterra y Croacia. Inglaterra primera con autoridad, Croacia segunda en el último Mundial de Modrić — emoción garantizada. Ghana tercera con opciones de mejor 3º. Panamá cuarta sin opciones reales.",
  },
};

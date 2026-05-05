/**
 * Datos editoriales de las 16 sedes oficiales del Mundial 2026. Cada entrada
 * incluye:
 *  - slug: URL-safe (la ciudad simplificada). Es el id estable que usa
 *    `/sedes/[slug]` y el sitemap.
 *  - aliases: cualquier nombre del estadio que pueda aparecer en
 *    `matches.venue` (text). Lo usamos para matchear partidos contra esta
 *    sede sin depender de un foreign key.
 *  - description / history / notable: el contenido SEO real (~250 palabras
 *    por sede, español editorial). Si la información oficial cambia (capacidad
 *    tras renovación, partidos asignados, etc.) edita aquí — la página la
 *    recoge automáticamente.
 *
 * Fuentes: FIFA World Cup 2026 Host Cities (fifa.com/worldcup2026/host-cities).
 */

export type Venue = {
  slug: string;
  name: string;
  aliases: string[];
  city: string;
  region?: string;
  country: "USA" | "Canadá" | "México";
  capacity: number;
  inaugurated: number;
  homeTeams: string[];
  description: string;
  history: string;
  notable: string;
};

export const VENUES: Venue[] = [
  // ─── United States (11) ───
  {
    slug: "arlington",
    name: "AT&T Stadium",
    aliases: ["AT&T Stadium", "Dallas Stadium", "AT&T Stadium Arlington"],
    city: "Arlington",
    region: "Texas",
    country: "USA",
    capacity: 80000,
    inaugurated: 2009,
    homeTeams: ["Dallas Cowboys (NFL)"],
    description:
      "El templo del Dallas Cowboys (rebautizado por FIFA como Dallas Stadium durante el torneo) es uno de los recintos más imponentes del Mundial. Cubierta retráctil, climatización integral y una pantalla de vídeo central que durante años fue la más grande del planeta. La cancha es de césped natural específicamente cultivado para el torneo: la NFL juega sobre artificial, pero FIFA exige natural y se realiza un trasplante completo cada Mundial.",
    history:
      "Inaugurado en 2009, costó 1.300 millones de dólares y se ha convertido en sinónimo de espectáculo americano. Ha albergado la Super Bowl XLV, finales de NCAA y conciertos de las giras más grandes del mundo. En el ámbito futbolístico, ya recibió partidos de la Copa América Centenario 2016 y de la Copa Oro CONCACAF.",
    notable:
      "Su pantalla central (LED de 11.500 m²) es uno de los iconos visuales del estadio. La final del Mundial se decidió en MetLife, pero Arlington es candidato a recibir uno de los grandes cruces de fase eliminatoria.",
  },
  {
    slug: "atlanta",
    name: "Mercedes-Benz Stadium",
    aliases: ["Mercedes-Benz Stadium", "Atlanta Stadium"],
    city: "Atlanta",
    region: "Georgia",
    country: "USA",
    capacity: 75000,
    inaugurated: 2017,
    homeTeams: ["Atlanta Falcons (NFL)", "Atlanta United (MLS)"],
    description:
      "El Mercedes-Benz Stadium es la joya arquitectónica del sur de Estados Unidos: techo retráctil con ocho pétalos triangulares que se abren como un diafragma de cámara, un anillo de pantallas LED de 360º que rodea todo el recinto y una pasarela panorámica para fans. Cabe destacar que es el único estadio de la NFL con cubierta abierta total durante el mismo evento.",
    history:
      "Sede de la Super Bowl LIII en 2019 y de finales de la MLS, donde Atlanta United es uno de los clubes con mayor masa social de la liga. Atlanta es además una de las ciudades con afición latinoamericana más grande del país, lo que se notará en partidos con selecciones del Cono Sur.",
    notable:
      "FIFA seleccionó Atlanta como sede de varios partidos de fase de grupos y al menos un cruce de eliminación directa. La capacidad efectiva en modo fútbol baja a unos 71.000.",
  },
  {
    slug: "boston",
    name: "Gillette Stadium",
    aliases: ["Gillette Stadium", "Boston Stadium", "Foxborough Stadium"],
    city: "Foxborough",
    region: "Massachusetts",
    country: "USA",
    capacity: 70000,
    inaugurated: 2002,
    homeTeams: ["New England Patriots (NFL)", "New England Revolution (MLS)"],
    description:
      "Casa de los New England Patriots, equipo legendario de la NFL con seis Super Bowls en la era Brady-Belichick, el Gillette Stadium aporta al Mundial el peso de la tradición deportiva del noreste americano. Está en Foxborough, a medio camino entre Boston y Providence, en un complejo de ocio que incluye centro comercial y restaurantes.",
    history:
      "Construido en 2002 con una inversión privada de Robert Kraft (algo poco común en estadios NFL), es el primer estadio construido completamente con fondos privados desde Dodger Stadium en 1962. La Copa Oro y la Copa América han pasado por aquí.",
    notable:
      "La afición de Boston combina culturas universitarias (Harvard, MIT, BU, BC) y obrera, lo que produce un ambiente único. El nombre comercial puede cambiar durante el torneo: FIFA suele exigir nombres genéricos.",
  },
  {
    slug: "houston",
    name: "NRG Stadium",
    aliases: ["NRG Stadium", "Houston Stadium"],
    city: "Houston",
    region: "Texas",
    country: "USA",
    capacity: 72000,
    inaugurated: 2002,
    homeTeams: ["Houston Texans (NFL)"],
    description:
      "Primer estadio NFL del mundo con techo retráctil cuando se inauguró en 2002, NRG Stadium es un coloso del sur de Texas. Las temperaturas en Houston en junio-julio rondan los 35-38 °C con humedad alta, así que el techo será determinante para los partidos de fase de grupos: con cubierta cerrada y aire acondicionado, el césped queda a unos cómodos 23 °C.",
    history:
      "Sede de la Super Bowl XXXVIII (2004) y LI (2017, la del legendario remontón Patriots-Falcons). En fútbol, ha recibido partidos de la Copa Oro y amistosos de selecciones latinoamericanas.",
    notable:
      "Houston tiene la cuarta comunidad latina más grande de USA. Los partidos con selecciones de México, Colombia o Brasil aquí prácticamente parecerán de local.",
  },
  {
    slug: "kansas-city",
    name: "Arrowhead Stadium",
    aliases: ["Arrowhead Stadium", "Kansas City Stadium", "GEHA Field at Arrowhead Stadium"],
    city: "Kansas City",
    region: "Misuri",
    country: "USA",
    capacity: 76000,
    inaugurated: 1972,
    homeTeams: ["Kansas City Chiefs (NFL)"],
    description:
      "El estadio más ruidoso de la NFL (récord Guinness en 2014 con 142,2 dB) será una de las experiencias más intensas del Mundial. Casa de los tricampeones Chiefs y de Patrick Mahomes, Arrowhead tiene una afición fanática que se traslada al fútbol con la misma energía. Sin techo, abierto a las tormentas del medio oeste.",
    history:
      "Inaugurado en 1972, ha sido reformado varias veces sin perder su personalidad. Una de las inversiones para el Mundial es expandir vestuarios y zonas FIFA. Históricamente sede de partidos clave del USMNT en eliminatorias.",
    notable:
      "El 'Tomahawk Chop' que entonan los aficionados de los Chiefs es polémico desde hace años. FIFA ha solicitado que durante el Mundial no se reproduzca para evitar controversia con los pueblos originarios. Veremos.",
  },
  {
    slug: "los-angeles",
    name: "SoFi Stadium",
    aliases: ["SoFi Stadium", "Los Angeles Stadium", "Inglewood Stadium"],
    city: "Inglewood",
    region: "California",
    country: "USA",
    capacity: 70000,
    inaugurated: 2020,
    homeTeams: ["Los Angeles Rams (NFL)", "Los Angeles Chargers (NFL)"],
    description:
      "El estadio más caro construido en la historia del deporte (5.500 millones de dólares) es un complejo cubierto pero abierto en los costados, con la pantalla circular de doble cara más grande del mundo (Infinity Screen). Inglewood, a 20 minutos del centro de LA y al lado del aeropuerto LAX, alberga el corazón del distrito olímpico de Los Angeles 2028.",
    history:
      "Inaugurado en 2020 ya con la pandemia en marcha, SoFi recibió la Super Bowl LVI en 2022 y eventos de WrestleMania. Será sede de la inauguración de los Juegos Olímpicos 2028.",
    notable:
      "Los Angeles tiene la mayor población mexicana fuera de México. Cualquier partido del Tri aquí va a parecer un partido en el Estadio Azteca. Para España, Argentina o Colombia, también cara local fuerte.",
  },
  {
    slug: "miami",
    name: "Hard Rock Stadium",
    aliases: ["Hard Rock Stadium", "Miami Stadium"],
    city: "Miami Gardens",
    region: "Florida",
    country: "USA",
    capacity: 65000,
    inaugurated: 1987,
    homeTeams: ["Miami Dolphins (NFL)", "Miami Hurricanes (NCAA)"],
    description:
      "El templo del fútbol americano del sur de Florida ha sido reformado integralmente en los últimos años para añadir una cubierta parcial y mejorar la experiencia del aficionado. Es el estadio más al sur del Mundial 2026 y uno de los que más calor va a sufrir — el techo cubre las gradas pero no el campo, así que los partidos de tarde se jugarán a temperaturas altas.",
    history:
      "Sede de cinco Super Bowls (1995, 1999, 2007, 2010 y 2020), un World Series y desde 2022 el Gran Premio de Miami de Fórmula 1. Durante la Copa América 2024 albergó la final Argentina-Colombia.",
    notable:
      "Miami es la ciudad latina por excelencia de USA. Argentinos, colombianos, venezolanos, cubanos: cualquier partido sudamericano aquí es como jugar en casa. La final de la Copa América 2024 fue un mar de camisetas albicelestes.",
  },
  {
    slug: "new-york",
    name: "MetLife Stadium",
    aliases: ["MetLife Stadium", "New York/New Jersey Stadium", "New York Stadium"],
    city: "East Rutherford",
    region: "Nueva Jersey",
    country: "USA",
    capacity: 82500,
    inaugurated: 2010,
    homeTeams: ["New York Giants (NFL)", "New York Jets (NFL)"],
    description:
      "La sede de la final. MetLife Stadium, técnicamente en Nueva Jersey pero a 11 km de Manhattan, es el segundo estadio más grande del Mundial (después del Azteca) y uno de los más modernos. El 19 de julio de 2026 acogerá la final que coronará al campeón mundial — un evento que se verá en directo por más de mil millones de personas.",
    history:
      "Casa compartida de Giants y Jets, ha sido sede de la Super Bowl XLVIII (2014, la del KO Seattle a Denver) y conciertos históricos como la última gira de Bruce Springsteen y los conciertos de Taylor Swift y Coldplay. La Copa América 2024 también pasó por aquí.",
    notable:
      "El estadio es enorme pero no tiene techo, así que la final dependerá del clima de Nueva Jersey en julio (calor y posibles tormentas). FIFA ha confirmado que el partido inaugural NO será aquí (será en el Azteca de México) pero sí la final.",
  },
  {
    slug: "philadelphia",
    name: "Lincoln Financial Field",
    aliases: ["Lincoln Financial Field", "Philadelphia Stadium"],
    city: "Filadelfia",
    region: "Pensilvania",
    country: "USA",
    capacity: 69000,
    inaugurated: 2003,
    homeTeams: ["Philadelphia Eagles (NFL)"],
    description:
      "Casa de los Eagles, ganadores de la Super Bowl LII y LIX, Lincoln Financial Field es uno de los estadios con más ambiente del país. La afición de Filadelfia tiene fama de ser la más implacable del deporte americano (incluso con sus propios equipos). En el Mundial, cualquier rival enfrente va a sentir un muro humano detrás de las porterías.",
    history:
      "Construido en 2003 y renovado varias veces, es la casa de uno de los equipos más históricos de la NFL. Recibe regularmente partidos del USMNT y de la Copa Oro. Filadelfia, además, es una de las ciudades fundacionales de USA, así que los fans del torneo encontrarán historia y cultura más allá del fútbol.",
    notable:
      "Capacidad efectiva en modo fútbol algo menor (~67.000). Filadelfia espera que el Mundial le permita posicionarse como destino turístico junto a Nueva York y Washington DC.",
  },
  {
    slug: "san-francisco",
    name: "Levi's Stadium",
    aliases: ["Levi's Stadium", "Bay Area Stadium", "San Francisco Stadium"],
    city: "Santa Clara",
    region: "California",
    country: "USA",
    capacity: 68500,
    inaugurated: 2014,
    homeTeams: ["San Francisco 49ers (NFL)"],
    description:
      "El estadio más tecnológico de la NFL: WiFi de alta densidad, app dedicada para pedir comida desde el asiento, paneles solares en la cubierta y certificación LEED Gold de sostenibilidad. Está en Santa Clara, en pleno Silicon Valley, no en San Francisco propiamente, así que el viaje desde la ciudad lleva 45-60 minutos. Pero la afición es de toda la Bay Area.",
    history:
      "Inaugurado en 2014, sede de la Super Bowl 50 en 2016 (Broncos vs. Panthers). En fútbol, ha recibido partidos de la Copa América Centenario y la Copa Oro CONCACAF.",
    notable:
      "San Francisco es la cuarta ciudad de USA con mayor proporción de residentes latinoamericanos. Ambiente de hipsters tecnológicos mezclado con afición de barrio: una mezcla rara y única.",
  },
  {
    slug: "seattle",
    name: "Lumen Field",
    aliases: ["Lumen Field", "Seattle Stadium", "CenturyLink Field"],
    city: "Seattle",
    region: "Washington",
    country: "USA",
    capacity: 69000,
    inaugurated: 2002,
    homeTeams: ["Seattle Seahawks (NFL)", "Seattle Sounders (MLS)"],
    description:
      "El estadio más ruidoso de la NFL (compartiendo trono con Arrowhead) es también la mejor casa de la MLS. Los Seattle Sounders son uno de los equipos con mayor masa social de Estados Unidos, con asistencias regulares de 40.000+ y un grupo ultra (ECS) que rivaliza con cualquiera de Sudamérica. La cancha de Lumen Field se siente como un coliseo cuando ruge.",
    history:
      "Inaugurado en 2002 sobre las cenizas del Kingdome, ha sido casa de finales de la MLS Cup y rondas avanzadas de la US Open Cup. Históricamente, Seattle ha sido la ciudad pionera en convertir el fútbol en deporte mayoritario en el noroeste de USA.",
    notable:
      "Los Sounders fans crearon el ambiente más cercano a un estadio europeo o sudamericano que se ve en USA. Cualquier partido del Mundial aquí va a tener un soporte vocal especial.",
  },
  // ─── México (3) ───
  {
    slug: "mexico-city",
    name: "Estadio Azteca",
    aliases: ["Estadio Azteca", "Estadio Banorte", "Mexico City Stadium"],
    city: "Ciudad de México",
    country: "México",
    capacity: 87000,
    inaugurated: 1966,
    homeTeams: ["Club América", "Cruz Azul (eventual)", "Selección de México"],
    description:
      "La catedral del fútbol mundial. Único estadio de la historia que ha albergado dos finales de Mundial (1970 y 1986) y que en 2026 será sede del partido inaugural el 11 de junio. A 2.240 metros de altitud, la altura del Azteca es un factor real: equipos no aclimatados sufren físicamente en los últimos 20 minutos. Capacidad oficial 87.000 pero la atmósfera lo hace sentir el doble.",
    history:
      "Aquí jugaron Pelé en 1970 (Brasil 4-1 Italia, considerada la mejor final mundial), y Maradona en 1986 (la 'mano de Dios' y el 'gol del siglo' contra Inglaterra). El Azteca ha sido escenario de los dos momentos más emblemáticos de la historia del fútbol. Cualquier futbolista que pisa esta cancha lo siente.",
    notable:
      "FIFA renombrará el estadio durante el Mundial al nombre patrocinador (Estadio Banorte). Las gradas inferiores se han renovado en los últimos años. La inauguración del Mundial 2026 aquí es uno de los grandes eventos deportivos del año.",
  },
  {
    slug: "monterrey",
    name: "Estadio BBVA",
    aliases: ["Estadio BBVA", "Estadio BBVA Bancomer", "Monterrey Stadium"],
    city: "Guadalupe",
    region: "Nuevo León",
    country: "México",
    capacity: 53500,
    inaugurated: 2015,
    homeTeams: ["Tigres de la UANL (eventual)", "CF Monterrey"],
    description:
      "El estadio más moderno de México y uno de los mejores de toda Latinoamérica. Diseñado por Populous (autores del Wembley), tiene una cubierta envolvente con vistas al Cerro de la Silla, el icono geográfico de Monterrey. Capacidad 53.500, ideal para partidos de fase de grupos sin perder ambiente.",
    history:
      "Inaugurado en 2015, casa de los Rayados de Monterrey. Ha albergado finales de Liga MX y partidos de la Copa Oro. Antes de su construcción, los Rayados jugaban en el Estadio Tecnológico, demolido en 2019.",
    notable:
      "Monterrey, la capital industrial del norte de México, recibirá fans norteamericanos por su cercanía a la frontera (a 2 horas en coche de Texas). El clima en junio puede pasar de los 40 °C, así que los partidos de tarde van a ser exigentes.",
  },
  {
    slug: "guadalajara",
    name: "Estadio Akron",
    aliases: ["Estadio Akron", "Estadio Chivas", "Estadio Omnilife", "Guadalajara Stadium"],
    city: "Zapopan",
    region: "Jalisco",
    country: "México",
    capacity: 46500,
    inaugurated: 2010,
    homeTeams: ["Chivas de Guadalajara"],
    description:
      "Casa del Club Deportivo Guadalajara (Chivas), uno de los equipos más populares de México junto al América. Es el estadio de fútbol más nuevo de los tres mexicanos del Mundial: una estructura cubierta de césped artificial verde en el exterior que la hace icónica desde el aire. Capacidad 46.500, es el más pequeño del Mundial 2026.",
    history:
      "Inaugurado en 2010 como Estadio Omnilife (después renombrado Akron), reemplazó al histórico Estadio Jalisco como casa de Chivas. El Estadio Jalisco albergó partidos del Mundial 1970 y 1986; Akron es el sucesor moderno.",
    notable:
      "Guadalajara es la cuna del Tequila, el Mariachi y la cultura mexicana clásica. Para muchos aficionados extranjeros, será la ciudad donde más auténtico se sentirá el viaje al Mundial.",
  },
  // ─── Canadá (2) ───
  {
    slug: "toronto",
    name: "BMO Field",
    aliases: ["BMO Field", "Toronto Stadium"],
    city: "Toronto",
    region: "Ontario",
    country: "Canadá",
    capacity: 45500,
    inaugurated: 2007,
    homeTeams: ["Toronto FC (MLS)", "Selección de Canadá"],
    description:
      "BMO Field, casa del Toronto FC, fue ampliado específicamente para el Mundial 2026 desde su capacidad anterior de 30.000 hasta los actuales 45.500. La obra incluye nuevas gradas, un nuevo techo parcial sobre la grada lateral y mejoras en vestuarios. Es un estadio puramente futbolístico (sin pista atletismo) lo que mejora muchísimo la experiencia.",
    history:
      "Inaugurado en 2007 como el primer estadio de Canadá pensado exclusivamente para el fútbol. Hogar del Toronto FC, equipo que ganó la MLS Cup en 2017 con Sebastian Giovinco. La selección canadiense juega aquí muchas eliminatorias.",
    notable:
      "Toronto es la ciudad más diversa del mundo: el 51% de su población nació fuera de Canadá. Cualquier selección que juegue aquí encontrará una afición local — para Italia, Portugal, India, Filipinas, Polonia, etc. Hay comunidades grandes de cada país.",
  },
  {
    slug: "vancouver",
    name: "BC Place",
    aliases: ["BC Place", "BC Place Stadium", "Vancouver Stadium"],
    city: "Vancouver",
    region: "Columbia Británica",
    country: "Canadá",
    capacity: 54500,
    inaugurated: 1983,
    homeTeams: ["Vancouver Whitecaps FC (MLS)", "BC Lions (CFL)"],
    description:
      "El único estadio del Mundial con techo retráctil de membrana — un sistema único en el mundo que combina cubierta total para clima invernal con apertura completa para verano. Renovado en 2011 con una inversión de 563 millones de dólares canadienses, BC Place es la sede oeste del torneo en Canadá, con vistas a las montañas y al puerto de Vancouver.",
    history:
      "Inaugurado en 1983 como sede de la Expo 86 mundial, ha albergado dos veces los Juegos Olímpicos de Invierno (Vancouver 2010, ceremonias) y la final de la MLS Cup en varias ocasiones. Es la casa de los Whitecaps de la MLS desde 2011.",
    notable:
      "Vancouver es la puerta del Mundial al Pacífico: los aficionados que viajan desde Asia (Japón, Corea, Australia, Nueva Zelanda) van a aterrizar aquí antes que en cualquier otra sede del torneo. La ciudad es de las mejor valoradas del mundo en calidad de vida.",
  },
];

export function findVenueBySlug(slug: string): Venue | undefined {
  return VENUES.find((v) => v.slug === slug);
}

export function findVenueByMatchVenue(text: string): Venue | undefined {
  const norm = text.trim().toLowerCase();
  return VENUES.find((v) =>
    v.aliases.some((a) => a.toLowerCase() === norm),
  );
}

/**
 * frontend/src/data/library-network.ts
 *
 * Directorio de la red bibliotecaria del estado Mérida.
 *
 * FUENTE ÚNICA DE VERDAD: los mapas institucionales de cada eje
 * (`src/assets/eje-*.png`). Cada entrada se transcribe del rótulo impreso en
 * el mapa correspondiente: nombre oficial de la biblioteca, la localidad
 * junto a la que aparece y el municipio en cuya región está dibujada.
 *
 * Reglas al editar este archivo:
 * - No inventar direcciones postales. Los mapas NO registran calle, avenida
 *   ni sector: sólo localidad y municipio. Si algún día se dispone de la
 *   dirección formal, se agrega como campo nuevo (`address`), y nunca se
 *   rellena `locality` a ojo.
 * - `locality` es opcional porque hay bibliotecas cuyo rótulo en el mapa no
 *   trae localidad separada (el nombre ya la contiene, o sólo se indica el
 *   municipio).
 * - `B.P.` = Biblioteca Pública, `S.L.` = Sala de Lectura (nomenclatura del
 *   propio mapa; se conserva tal cual).
 */

export type Library = {
  /** Nombre oficial tal como aparece impreso en el mapa del eje. */
  readonly name: string;
  /** Localidad impresa junto a la biblioteca, cuando el mapa la rotula. */
  readonly locality?: string;
  /** Municipio en cuya región está dibujada la biblioteca. */
  readonly municipality: string;
};

export type Axis = {
  readonly id: number;
  readonly name: string;
  /** Municipios que el mapa delimita dentro del eje. */
  readonly municipalities: readonly string[];
  readonly libraries: readonly Library[];
  /** Puntos de lectura: sólo se declaran donde el mapa los rotula. */
  readonly readingPoints?: number;
};

/** Eje Metropolitano — el mapa rotula "17 BIBLIOTECAS / 1 PUNTO DE LECTURA". */
const metropolitano: readonly Library[] = [
  { name: 'B.P. Simón Bolívar', locality: 'Mérida', municipality: 'Libertador' },
  { name: 'B.P. Alí Uzcátegui', locality: 'Mérida', municipality: 'Libertador' },
  { name: 'B.P. Bicentenario', locality: 'Los Curos', municipality: 'Libertador' },
  { name: 'B.P. Clara Vivas Briceño', locality: 'Campo de Oro', municipality: 'Libertador' },
  { name: 'B.P. Carabobo', locality: 'Urb. Carabobo', municipality: 'Libertador' },
  { name: 'B.P. Hercilia Rivas de Contreras', locality: 'El Morro', municipality: 'Libertador' },
  { name: 'B.P. Magdiel Páez', locality: 'Los Nevados', municipality: 'Libertador' },
  { name: 'B.P. Generalísimo Francisco de Miranda', locality: 'El Arenal', municipality: 'Libertador' },
  { name: 'B.P. San Antonio', locality: 'San Antonio', municipality: 'Libertador' },
  { name: 'B.P. Presbítero José Ramón Gallegos', locality: 'Tabay', municipality: 'Santos Marquina' },
  { name: 'B.P. Padre Duque', locality: 'El Boticario', municipality: 'Campo Elías' },
  { name: 'B.P. Ignacio Fernández Peña', locality: 'Mesa de Ejido', municipality: 'Campo Elías' },
  { name: 'B.P. Rafael Corredor Rojas', locality: 'Ejido', municipality: 'Campo Elías' },
  { name: 'B.P. Antonio Ramón Molina', locality: 'Chiguará', municipality: 'Sucre' },
  { name: 'B.P. Teresa de la Parra', locality: 'San Juan', municipality: 'Sucre' },
  { name: 'B.P. Antonio Pinto Salinas', locality: 'Lagunillas', municipality: 'Sucre' },
  { name: 'B.P. Merley Mejías', locality: 'Pueblo Nuevo del Sur', municipality: 'Sucre' },
];

/** Eje Mocotíes — el mapa no imprime total; se transcriben 11 bibliotecas. */
const mocoties: readonly Library[] = [
  { name: 'B.P. Emiro Duque S.', locality: 'Zea', municipality: 'Zea' },
  { name: 'B.P. Dr. Marcos V. Salas', locality: 'Zea', municipality: 'Zea' },
  { name: 'B.P. Julia Ruiz', locality: 'Tovar', municipality: 'Tovar' },
  { name: 'B.P. Las Acacias', locality: 'Las Acacias', municipality: 'Tovar' },
  { name: 'B.P. Mesa de las Palmas', locality: 'Mesa de las Palmas', municipality: 'Antonio P. Salinas' },
  { name: 'B.P. José H. Paparoni', locality: 'Santa Cruz de Mora', municipality: 'Antonio P. Salinas' },
  { name: 'B.P. Nectario H. Barillas', locality: 'Mesa Bolívar', municipality: 'Antonio P. Salinas' },
  { name: 'B.P. José V. Escalante', locality: 'La Playa', municipality: 'Rivas Dávila' },
  { name: 'B.P. Rivas Dávila', locality: 'Bailadores', municipality: 'Rivas Dávila' },
  { name: 'B.P. Mesa Quintero', locality: 'Mesa Quintero', municipality: 'Guaraque' },
  { name: 'B.P. Balmore Carrero', locality: 'Guaraque', municipality: 'Guaraque' },
];

/** Eje Panamericano — el mapa rotula "12 BIBLIOTECAS". */
const panamericano: readonly Library[] = [
  { name: 'B.P. Independencia', locality: 'Palmarito', municipality: 'Tulio F. Cordero' },
  { name: 'B.P. Tomás Castelao', locality: 'Nueva Bolivia', municipality: 'Tulio F. Cordero' },
  { name: 'B.P. Don Simón Rodríguez', locality: 'San Cristóbal de Torondoy', municipality: 'Justo Briceño' },
  { name: 'B.P. Bachiller Mario Bonilla', locality: 'Torondoy', municipality: 'Justo Briceño' },
  { name: 'B.P. San José de Palmira', locality: 'San José de Palmira', municipality: 'Julio C. Salas' },
  { name: 'B.P. Julio César Salas', municipality: 'Julio C. Salas' },
  { name: 'B.P. Amador González', locality: 'Alcázar', municipality: 'Obispo Ramos de Lora' },
  { name: 'B.P. Santa Elena de Arenales', locality: 'Santa Elena de Arenales', municipality: 'Obispo Ramos de Lora' },
  { name: 'B.P. Carmen Valverde', locality: 'Tucaní', municipality: 'Caracciolo Parra y Olmedo' },
  { name: 'B.P. Héctor Roviro Ruiz', locality: 'La Azulita', municipality: 'Andrés Bello' },
  { name: 'B.P. Eutimio Rivas', locality: 'El Vigía', municipality: 'Alberto Adriani' },
  { name: 'B.P. Prof. Linis Guerrero', locality: 'La Palmita', municipality: 'Alberto Adriani' },
];

/** Eje Páramo — el mapa rotula "11 BIBLIOTECAS". */
const paramo: readonly Library[] = [
  { name: 'B.P. Consuelo Navas', locality: 'Timotes', municipality: 'Miranda' },
  { name: 'B.P. Andrés Eloy Blanco', locality: 'Chachopo', municipality: 'Miranda' },
  { name: 'B.P. Manuel Molina', locality: 'Pueblo Llano', municipality: 'Pueblo Llano' },
  { name: 'B.P. Carlos Muñoz Obráa', locality: 'Sto. Domingo', municipality: 'Cardenal Quintero' },
  { name: 'B.P. Pedro José Paredes', locality: 'Las Piedras', municipality: 'Cardenal Quintero' },
  { name: 'B.P. Juan Félix Sánchez y Epifania Gil', locality: 'San Rafael', municipality: 'Rangel' },
  { name: 'B.P. Raúl Ramos Giménez', locality: 'Mucuchíes', municipality: 'Rangel' },
  { name: 'B.P. Lcdo. Alexander Quintero', locality: 'Mucurubá', municipality: 'Rangel' },
  { name: 'B.P. La Toma', locality: 'La Toma', municipality: 'Rangel' },
  { name: 'B.P. Luis Alberto Lobo', locality: 'Llano El Hato', municipality: 'Rangel' },
  { name: 'B.P. Ramón Palomares', locality: 'Gavidia', municipality: 'Rangel' },
];

/** Eje Pueblo del Sur — el mapa rotula "07 BIBLIOTECAS". */
const puebloDelSur: readonly Library[] = [
  { name: 'B.P. Rodolfo Mora', locality: 'Canagua', municipality: 'Arzobispo Chacón' },
  { name: 'B.P. El Molino II', municipality: 'Arzobispo Chacón' },
  { name: 'B.P. Libertador', locality: 'Mucutuy', municipality: 'Arzobispo Chacón' },
  { name: 'S.L. Carmen Rosa Vega', locality: 'Mucúchachí', municipality: 'Arzobispo Chacón' },
  { name: 'B.P. Blanca Julia de Dugarte', locality: 'Aricagua', municipality: 'Aricagua' },
  { name: 'B.P. Ramón Sosa Pérez', locality: 'San José de Campo Elías', municipality: 'Aricagua' },
  { name: 'B.P. José Vicente Nucete', municipality: 'Padre Noguera' },
];

export const AXES: readonly Axis[] = [
  {
    id: 1,
    name: 'Eje Metropolitano',
    municipalities: ['Libertador', 'Campo Elías', 'Sucre', 'Santos Marquina'],
    libraries: metropolitano,
    // Glorias Patrias — Sede Administrativa IBIME, único punto rotulado.
    readingPoints: 1,
  },
  {
    id: 2,
    name: 'Eje Mocotíes',
    municipalities: ['Tovar', 'Zea', 'Antonio P. Salinas', 'Rivas Dávila', 'Guaraque'],
    libraries: mocoties,
  },
  {
    id: 3,
    name: 'Eje Panamericano',
    municipalities: [
      'Alberto Adriani',
      'Andrés Bello',
      'Caracciolo Parra y Olmedo',
      'Justo Briceño',
      'Julio C. Salas',
      'Obispo Ramos de Lora',
      'Tulio F. Cordero',
    ],
    libraries: panamericano,
  },
  {
    id: 4,
    name: 'Eje Páramo',
    municipalities: ['Rangel', 'Miranda', 'Cardenal Quintero', 'Pueblo Llano'],
    libraries: paramo,
  },
  {
    id: 5,
    name: 'Eje Pueblo del Sur',
    municipalities: ['Arzobispo Chacón', 'Aricagua', 'Padre Noguera'],
    libraries: puebloDelSur,
  },
];

/** Total de bibliotecas registradas en los mapas de los cinco ejes. */
export const TOTAL_LIBRARIES = AXES.reduce((sum, axis) => sum + axis.libraries.length, 0);

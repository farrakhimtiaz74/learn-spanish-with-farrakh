

var PRON=['yo','tú','él / ella','nosotros','vosotros','ellos'];
var PRONEN=['I','you (friend)','he / she','we','you all (Spain)','they'];
var VERBS=[
{id:'ser',inf:'ser',en:'to be (who/what you are)',ur:'hona (pehchan ke liye)',forms:['soy','eres','es','somos','sois','son'],ex:'Yo soy de Pakistán. — I am from Pakistan.'},
{id:'estar',inf:'estar',en:'to be (how/where, temporary)',ur:'hona (halat / jagah ke liye)',forms:['estoy','estás','está','estamos','estáis','están'],ex:'Estoy cansado. — I am tired.'},
{id:'tener',inf:'tener',en:'to have',ur:'rakhna / hona (umar, bhook)',forms:['tengo','tienes','tiene','tenemos','tenéis','tienen'],ex:'Tengo hambre. — I am hungry.'},
{id:'ir',inf:'ir',en:'to go',ur:'jana',forms:['voy','vas','va','vamos','vais','van'],ex:'Voy al mercado. — I go to the market.'},
{id:'hacer',inf:'hacer',en:'to do / to make',ur:'karna / banana',forms:['hago','haces','hace','hacemos','hacéis','hacen'],ex:'Hago mi trabajo. — I do my work.'},
{id:'poder',inf:'poder',en:'to be able to / can',ur:'sakna',forms:['puedo','puedes','puede','podemos','podéis','pueden'],ex:'Puedo ayudar. — I can help.'},
{id:'querer',inf:'querer',en:'to want / to love',ur:'chahna',forms:['quiero','quieres','quiere','queremos','queréis','quieren'],ex:'Quiero agua. — I want water.'},
{id:'saber',inf:'saber',en:'to know (facts)',ur:'jaanna (maloomat)',forms:['sé','sabes','sabe','sabemos','sabéis','saben'],ex:'Sé la respuesta. — I know the answer.'},
{id:'decir',inf:'decir',en:'to say / to tell',ur:'kehna',forms:['digo','dices','dice','decimos','decís','dicen'],ex:'Dice la verdad. — He/She tells the truth.'},
{id:'ver',inf:'ver',en:'to see / to watch',ur:'dekhna',forms:['veo','ves','ve','vemos','veis','ven'],ex:'Veo la tele. — I watch TV.'},
{id:'comer',inf:'comer',en:'to eat',ur:'khana',forms:['como','comes','come','comemos','coméis','comen'],ex:'Comemos arroz. — We eat rice.'},
{id:'hablar',inf:'hablar',en:'to speak / to talk',ur:'bolna / baat karna',forms:['hablo','hablas','habla','hablamos','habláis','hablan'],ex:'Hablo español. — I speak Spanish.'},
{id:'vivir',inf:'vivir',en:'to live',ur:'rehna / zinda hona',forms:['vivo','vives','vive','vivimos','vivís','viven'],ex:'Vivo en Punjab. — I live in Punjab.'},
{id:'trabajar',inf:'trabajar',en:'to work',ur:'kaam karna',forms:['trabajo','trabajas','trabaja','trabajamos','trabajáis','trabajan'],ex:'Trabajo hoy. — I work today.'},
{id:'estudiar',inf:'estudiar',en:'to study',ur:'parhna / study karna',forms:['estudio','estudias','estudia','estudiamos','estudiáis','estudian'],ex:'Estudio español. — I study Spanish.'},
{id:'necesitar',inf:'necesitar',en:'to need',ur:'zaroorat hona',forms:['necesito','necesitas','necesita','necesitamos','necesitáis','necesitan'],ex:'Necesito ayuda. — I need help.'},
{id:'gustar',inf:'gustar',en:'to like (pleases me)',ur:'pasand aana',forms:['me gusta','te gusta','le gusta','nos gusta','os gusta','les gusta'],ex:'Me gusta el té. — I like tea.',note:'Gustar works backwards: "me gusta" = "it pleases me". Use "me gustan" for plural things.'},
{id:'llegar',inf:'llegar',en:'to arrive',ur:'pohanchna',forms:['llego','llegas','llega','llegamos','llegáis','llegan'],ex:'Llego a las ocho. — I arrive at eight.'},
{id:'salir',inf:'salir',en:'to leave / to go out',ur:'nikalna / bahar jana',forms:['salgo','sales','sale','salimos','salís','salen'],ex:'Salgo de casa. — I leave home.'},
{id:'poner',inf:'poner',en:'to put / to place',ur:'rakhna',forms:['pongo','pones','pone','ponemos','ponéis','ponen'],ex:'Pongo el libro aquí. — I put the book here.'}
];
/* Past (preterite) + "voy a" future for the top 10 verbs */
var TOP10=['ser','estar','tener','ir','hacer','poder','querer','saber','decir','ver'];
var PAST={
ser:['fui','fuiste','fue','fuimos','fuisteis','fueron'],
estar:['estuve','estuviste','estuvo','estuvimos','estuvisteis','estuvieron'],
tener:['tuve','tuviste','tuvo','tuvimos','tuvisteis','tuvieron'],
ir:['fui','fuiste','fue','fuimos','fuisteis','fueron'],
hacer:['hice','hiciste','hizo','hicimos','hicisteis','hicieron'],
poder:['pude','pudiste','pudo','pudimos','pudisteis','pudieron'],
querer:['quise','quisiste','quiso','quisimos','quisisteis','quisieron'],
saber:['supe','supiste','supo','supimos','supisteis','supieron'],
decir:['dije','dijiste','dijo','dijimos','dijisteis','dijeron'],
ver:['vi','viste','vio','vimos','visteis','vieron']};
var IRFORMS=['voy','vas','va','vamos','vais','van'];
/* ============ FLASHCARDS 300+ ============ */

export { PRON, PRONEN, VERBS, TOP10, PAST, IRFORMS };

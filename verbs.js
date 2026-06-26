// ── Verb conjugation data ──────────────────────────────────────────────────
const PRONOUNS = ['io', 'tu', 'lui/lei', 'noi', 'voi', 'loro'];

const TENSE_LABELS = {
  presente:         'Presente',
  passato_prossimo: 'Passato Prossimo',
  imperfetto:       'Imperfetto',
  futuro:           'Futuro',
};

const VERBS = [
  {
    infinitive: 'essere', meaning: 'to be', type: 'irregular', auxiliary: 'essere',
    tenses: {
      presente:         ['sono','sei','è','siamo','siete','sono'],
      passato_prossimo: ['sono stato/a','sei stato/a','è stato/a','siamo stati/e','siete stati/e','sono stati/e'],
      imperfetto:       ['ero','eri','era','eravamo','eravate','erano'],
      futuro:           ['sarò','sarai','sarà','saremo','sarete','saranno'],
    }
  },
  {
    infinitive: 'avere', meaning: 'to have', type: 'irregular', auxiliary: 'avere',
    tenses: {
      presente:         ['ho','hai','ha','abbiamo','avete','hanno'],
      passato_prossimo: ['ho avuto','hai avuto','ha avuto','abbiamo avuto','avete avuto','hanno avuto'],
      imperfetto:       ['avevo','avevi','aveva','avevamo','avevate','avevano'],
      futuro:           ['avrò','avrai','avrà','avremo','avrete','avranno'],
    }
  },
  {
    infinitive: 'andare', meaning: 'to go', type: 'irregular', auxiliary: 'essere',
    tenses: {
      presente:         ['vado','vai','va','andiamo','andate','vanno'],
      passato_prossimo: ['sono andato/a','sei andato/a','è andato/a','siamo andati/e','siete andati/e','sono andati/e'],
      imperfetto:       ['andavo','andavi','andava','andavamo','andavate','andavano'],
      futuro:           ['andrò','andrai','andrà','andremo','andrete','andranno'],
    }
  },
  {
    infinitive: 'fare', meaning: 'to do / make', type: 'irregular', auxiliary: 'avere',
    tenses: {
      presente:         ['faccio','fai','fa','facciamo','fate','fanno'],
      passato_prossimo: ['ho fatto','hai fatto','ha fatto','abbiamo fatto','avete fatto','hanno fatto'],
      imperfetto:       ['facevo','facevi','faceva','facevamo','facevate','facevano'],
      futuro:           ['farò','farai','farà','faremo','farete','faranno'],
    }
  },
  {
    infinitive: 'dire', meaning: 'to say / tell', type: 'irregular', auxiliary: 'avere',
    tenses: {
      presente:         ['dico','dici','dice','diciamo','dite','dicono'],
      passato_prossimo: ['ho detto','hai detto','ha detto','abbiamo detto','avete detto','hanno detto'],
      imperfetto:       ['dicevo','dicevi','diceva','dicevamo','dicevate','dicevano'],
      futuro:           ['dirò','dirai','dirà','diremo','direte','diranno'],
    }
  },
  {
    infinitive: 'venire', meaning: 'to come', type: 'irregular', auxiliary: 'essere',
    tenses: {
      presente:         ['vengo','vieni','viene','veniamo','venite','vengono'],
      passato_prossimo: ['sono venuto/a','sei venuto/a','è venuto/a','siamo venuti/e','siete venuti/e','sono venuti/e'],
      imperfetto:       ['venivo','venivi','veniva','venivamo','venivate','venivano'],
      futuro:           ['verrò','verrai','verrà','verremo','verrete','verranno'],
    }
  },
  {
    infinitive: 'potere', meaning: 'can / to be able to', type: 'modal', auxiliary: 'avere',
    tenses: {
      presente:         ['posso','puoi','può','possiamo','potete','possono'],
      passato_prossimo: ['ho potuto','hai potuto','ha potuto','abbiamo potuto','avete potuto','hanno potuto'],
      imperfetto:       ['potevo','potevi','poteva','potevamo','potevate','potevano'],
      futuro:           ['potrò','potrai','potrà','potremo','potrete','potranno'],
    }
  },
  {
    infinitive: 'volere', meaning: 'to want', type: 'modal', auxiliary: 'avere',
    tenses: {
      presente:         ['voglio','vuoi','vuole','vogliamo','volete','vogliono'],
      passato_prossimo: ['ho voluto','hai voluto','ha voluto','abbiamo voluto','avete voluto','hanno voluto'],
      imperfetto:       ['volevo','volevi','voleva','volevamo','volevate','volevano'],
      futuro:           ['vorrò','vorrai','vorrà','vorremo','vorrete','vorranno'],
    }
  },
  {
    infinitive: 'dovere', meaning: 'must / to have to', type: 'modal', auxiliary: 'avere',
    tenses: {
      presente:         ['devo','devi','deve','dobbiamo','dovete','devono'],
      passato_prossimo: ['ho dovuto','hai dovuto','ha dovuto','abbiamo dovuto','avete dovuto','hanno dovuto'],
      imperfetto:       ['dovevo','dovevi','doveva','dovevamo','dovevate','dovevano'],
      futuro:           ['dovrò','dovrai','dovrà','dovremo','dovrete','dovranno'],
    }
  },
  {
    infinitive: 'stare', meaning: 'to stay / to be (health)', type: 'irregular', auxiliary: 'essere',
    tenses: {
      presente:         ['sto','stai','sta','stiamo','state','stanno'],
      passato_prossimo: ['sono stato/a','sei stato/a','è stato/a','siamo stati/e','siete stati/e','sono stati/e'],
      imperfetto:       ['stavo','stavi','stava','stavamo','stavate','stavano'],
      futuro:           ['starò','starai','starà','staremo','starete','staranno'],
    }
  },
  {
    infinitive: 'parlare', meaning: 'to speak', type: 'regular', auxiliary: 'avere',
    tenses: {
      presente:         ['parlo','parli','parla','parliamo','parlate','parlano'],
      passato_prossimo: ['ho parlato','hai parlato','ha parlato','abbiamo parlato','avete parlato','hanno parlato'],
      imperfetto:       ['parlavo','parlavi','parlava','parlavamo','parlavate','parlavano'],
      futuro:           ['parlerò','parlerai','parlerà','parleremo','parlerete','parleranno'],
    }
  },
  {
    infinitive: 'mangiare', meaning: 'to eat', type: 'regular', auxiliary: 'avere',
    tenses: {
      presente:         ['mangio','mangi','mangia','mangiamo','mangiate','mangiano'],
      passato_prossimo: ['ho mangiato','hai mangiato','ha mangiato','abbiamo mangiato','avete mangiato','hanno mangiato'],
      imperfetto:       ['mangiavo','mangiavi','mangiava','mangiavamo','mangiavate','mangiavano'],
      futuro:           ['mangerò','mangerai','mangerà','mangeremo','mangerete','mangeranno'],
    }
  },
  {
    infinitive: 'capire', meaning: 'to understand', type: 'regular', auxiliary: 'avere',
    tenses: {
      presente:         ['capisco','capisci','capisce','capiamo','capite','capiscono'],
      passato_prossimo: ['ho capito','hai capito','ha capito','abbiamo capito','avete capito','hanno capito'],
      imperfetto:       ['capivo','capivi','capiva','capivamo','capivate','capivano'],
      futuro:           ['capirò','capirai','capirà','capiremo','capirete','capiranno'],
    }
  },
  {
    infinitive: 'leggere', meaning: 'to read', type: 'regular', auxiliary: 'avere',
    tenses: {
      presente:         ['leggo','leggi','legge','leggiamo','leggete','leggono'],
      passato_prossimo: ['ho letto','hai letto','ha letto','abbiamo letto','avete letto','hanno letto'],
      imperfetto:       ['leggevo','leggevi','leggeva','leggevamo','leggevate','leggevano'],
      futuro:           ['leggerò','leggerai','leggerà','leggeremo','leggerete','leggeranno'],
    }
  },
  {
    infinitive: 'vedere', meaning: 'to see', type: 'irregular', auxiliary: 'avere',
    tenses: {
      presente:         ['vedo','vedi','vede','vediamo','vedete','vedono'],
      passato_prossimo: ['ho visto','hai visto','ha visto','abbiamo visto','avete visto','hanno visto'],
      imperfetto:       ['vedevo','vedevi','vedeva','vedevamo','vedevate','vedevano'],
      futuro:           ['vedrò','vedrai','vedrà','vedremo','vedrete','vedranno'],
    }
  },
];

// ── Reading texts ──────────────────────────────────────────────────────────
const READING_TEXTS = [
  {
    id: 1, level: 'A1', title: 'Mi presento',
    intro: 'A young Italian introduces herself.',
    text: `Mi chiamo Giulia. Ho ventidue anni. Sono italiana. Abito a Milano con la mia famiglia. Ho una sorella e un fratello. Mio fratello si chiama Marco e ha diciannove anni. Mia sorella si chiama Sofia e ha sedici anni. Studio lingue all'università. Mi piace leggere e ascoltare musica. Il mio colore preferito è il blu. Ho un gatto. Si chiama Micio.`,
    questions: [
      { q: 'How old is Giulia?', opts: ['19', '22', '16', '25'], a: 1 },
      { q: 'Where does Giulia live?', opts: ['Rome', 'Florence', 'Milan', 'Naples'], a: 2 },
      { q: 'What does Giulia study?', opts: ['Medicine', 'Languages', 'Law', 'Art'], a: 1 },
      { q: 'What is Giulia\'s brother called?', opts: ['Micio', 'Sofia', 'Marco', 'Luca'], a: 2 },
      { q: 'What pet does Giulia have?', opts: ['A dog', 'A fish', 'A cat', 'A bird'], a: 2 },
    ]
  },
  {
    id: 2, level: 'A2', title: 'La mia giornata',
    intro: 'An Italian describes their typical working day.',
    text: `Mi sveglio alle sette di mattina. Faccio la doccia e poi faccio colazione. Di solito mangio una brioche e bevo un caffè. Vado al lavoro in autobus. Lavoro in un ufficio nel centro della città. A mezzogiorno mangio con i miei colleghi in un ristorante vicino all'ufficio. Il pomeriggio lavoro fino alle sei. La sera ceno a casa con mia moglie. Dopo cena guardiamo la televisione o leggiamo. Vado a letto alle undici di sera.`,
    questions: [
      { q: 'What time does he wake up?', opts: ['6am', '7am', '8am', '9am'], a: 1 },
      { q: 'How does he get to work?', opts: ['By car', 'By train', 'By bus', 'On foot'], a: 2 },
      { q: 'Where does he eat lunch?', opts: ['At home', 'At his desk', 'In a restaurant nearby', 'In a park'], a: 2 },
      { q: 'What does he do after dinner?', opts: ['Goes to the gym', 'Watches TV or reads', 'Goes out with friends', 'Works more'], a: 1 },
      { q: 'What time does he go to bed?', opts: ['9pm', '10pm', '11pm', 'Midnight'], a: 2 },
    ]
  },
  {
    id: 3, level: 'B1', title: 'Un weekend a Firenze',
    intro: 'A couple describes their weekend trip to Florence.',
    text: `Il mese scorso sono andato a Firenze per il weekend con la mia ragazza. Siamo partiti da Roma venerdì pomeriggio in treno. Il viaggio è durato circa un'ora e mezza. Abbiamo preso un piccolo hotel nel centro storico, a pochi passi dal Duomo. Sabato mattina abbiamo visitato gli Uffizi, uno dei musei più famosi del mondo. Le opere d'arte erano incredibili, soprattutto i dipinti di Botticelli. Nel pomeriggio abbiamo passeggiato per le strade medievali e abbiamo comprato qualche souvenir. La sera abbiamo cenato in una trattoria tipica toscana e ho mangiato la bistecca fiorentina per la prima volta. Era deliziosa! Domenica abbiamo visitato Piazzale Michelangelo per ammirare il panorama della città. È stato un weekend perfetto.`,
    questions: [
      { q: 'How did they travel to Florence?', opts: ['By car', 'By plane', 'By train', 'By bus'], a: 2 },
      { q: 'How long did the journey take?', opts: ['30 minutes', 'About 1.5 hours', '3 hours', '4 hours'], a: 1 },
      { q: 'Which museum did they visit on Saturday morning?', opts: ['The Vatican', 'The Uffizi', 'The Accademia', 'The Bargello'], a: 1 },
      { q: 'What did he eat for dinner on Saturday?', opts: ['Pizza', 'Pasta', 'Florentine steak', 'Fish'], a: 2 },
      { q: 'Where did they go on Sunday?', opts: ['Piazzale Michelangelo', 'The Duomo', 'Piazza della Signoria', 'Ponte Vecchio'], a: 0 },
    ]
  },
  {
    id: 4, level: 'B2', title: "L'importanza delle lingue straniere",
    intro: 'An essay on the value of learning foreign languages.',
    text: `Nel mondo globalizzato di oggi, conoscere almeno una lingua straniera è diventato quasi indispensabile. Non si tratta soltanto di una competenza professionale, ma di un arricchimento personale e culturale che apre porte impensabili. Chi studia una lingua straniera non impara solo parole e grammatica: scopre un nuovo modo di pensare, una nuova cultura, nuove prospettive sul mondo.\n\nGli studi scientifici dimostrano inoltre che il bilinguismo ha effetti positivi sul cervello, migliorando la memoria e ritardando l'insorgenza di malattie come l'Alzheimer. In Italia, nonostante i progressi degli ultimi anni, il livello medio di inglese rimane ancora piuttosto basso rispetto ad altri paesi europei. Molti giovani italiani, tuttavia, sono sempre più consapevoli dell'importanza delle lingue e investono tempo ed energie nell'apprendimento.\n\nL'errore più comune è quello di aspettare la perfezione prima di parlare. La lingua si impara parlandola, sbagliando, e imparando dagli errori.`,
    questions: [
      { q: 'According to the text, what does bilingualism improve?', opts: ['Physical fitness', 'Memory and brain health', 'Social skills only', 'Income'], a: 1 },
      { q: 'How does Italy\'s English level compare to other European countries?', opts: ['Above average', 'The best in Europe', 'Still relatively low', 'Average'], a: 2 },
      { q: 'What attitude do many young Italians now show?', opts: ['Indifference to languages', 'Awareness and investment in learning', 'Preference for Spanish over English', 'Resistance to globalisation'], a: 1 },
      { q: 'What is described as the most common mistake in language learning?', opts: ['Studying grammar too much', 'Waiting for perfection before speaking', 'Learning too many languages at once', 'Avoiding native speakers'], a: 1 },
      { q: 'Beyond professional skills, what does learning a language offer?', opts: ['A guaranteed job', 'Personal and cultural enrichment', 'Free travel', 'Academic qualifications'], a: 1 },
    ]
  },
];

// ── Speaking questions ─────────────────────────────────────────────────────
const SPEAKING_QUESTIONS = [
  { id: 1,  en: "What's your name?",                          prompt: "E.g. My name is Owen" },
  { id: 2,  en: "How old are you?",                           prompt: "E.g. I'm 28 years old" },
  { id: 3,  en: "Where are you from originally?",             prompt: "E.g. I'm from London, England" },
  { id: 4,  en: "Where do you live now?",                     prompt: "E.g. I live in Manchester" },
  { id: 5,  en: "What do you do for work?",                   prompt: "E.g. I work in marketing" },
  { id: 6,  en: "Do you have any brothers or sisters?",       prompt: "E.g. I have one brother" },
  { id: 7,  en: "Are you in a relationship?",                 prompt: "E.g. I have a girlfriend / I'm single" },
  { id: 8,  en: "What do you like to do in your free time?",  prompt: "E.g. I love football and cooking" },
  { id: 9,  en: "What's your favourite food?",                prompt: "E.g. My favourite food is pasta" },
  { id: 10, en: "What type of music do you like?",            prompt: "E.g. I like hip-hop and rock" },
  { id: 11, en: "Do you have any pets?",                      prompt: "E.g. I have a dog called Max" },
  { id: 12, en: "What's your favourite film or TV show?",     prompt: "E.g. My favourite show is Breaking Bad" },
  { id: 13, en: "What sports or exercise do you do?",         prompt: "E.g. I play football and go to the gym" },
  { id: 14, en: "What are you passionate about?",             prompt: "E.g. I'm passionate about travel and music" },
  { id: 15, en: "Why are you learning Italian?",              prompt: "E.g. I want to speak to people when I visit Italy" },
];

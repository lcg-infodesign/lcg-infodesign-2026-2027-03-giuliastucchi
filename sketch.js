
let tabella = null;
let libroMouse = -1;
let anniOrdinati = [];
let posizioniLibri = [];
let erroreCSV = "";

// fasce utilizzate per suddividere il grafico in cinque colonne
let fasceVendite = [
  "10-15 mln",
  "15-25 mln",
  "25-50 mln",
  "50-100 mln",
  "100+ mln"
];

let generi = [
  "Narrativa realistica",
  "Narrativa storica e d'avventura",
  "Fantasy",
  "Fantascienza e distopia",
  "Horror, giallo e thriller",
  "Poesia e teatro",
  "Saggistica e narrativa illustrata"
];

// a ogni numero pagine corrisponde un colore
let coloriPagine = [
  "#d8e5d8",
  "#a7c7c0",
  "#7a9cb6",
  "#77658e",
  "#4b365f"
];

let etichettePagine = [
  "Fino a 200",
  "201–350",
  "351–500",
  "501–700",
  "Oltre 700"
];

// disposizione delle colonne e la grandezza dei simboli
let margine = 125;
let spazio = 9;
let altoGrafico = 230;
let bassoGrafico = 780;
let dimensione = 18;
let bordo = 1.2;
let distanzaTraLibri = 23;
let limiteLarghezza = 1250;
let larghezzaMinima = 850;

function setup() {
  // creo il canvas in base alle dimensioni della finestra
  createCanvas(larghezzaCanvas(), altezzaCanvas());

  // carico il CSV con le virgole e la prima riga come intestazione
  loadTable(
    "assets/dataset_170_bestseller_vendite_revisionate_per_p5.csv",
    ",",
    "header",

    function(dati) {
      tabella = dati;
      anniOrdinati = [];

      // leggo tutti gli anni
      for (let i = 0; i < tabella.getRowCount(); i++) {
        let anno = tabella.getNum(i, "anno");

        if (
          Number.isFinite(anno) &&
          !anniOrdinati.includes(anno)
        ) {
          anniOrdinati.push(anno);
        }
      }

      // ordino gli anni dal più antico al più recente
      anniOrdinati.sort(function(a, b) {
        return a - b;
      });

      // dopo il caricamento calcolo le coordinate dei libri
      calcolaPosizioni();
    },

    function() {
      erroreCSV =
        "Impossibile caricare il CSV. Controlla il nome e la cartella assets.";
    }
  );
}

// adatto la posizione della legenda alla larghezza della finestra
function legendaADestra() {
  return windowWidth >= limiteLarghezza;
}

// imposto una larghezza minima per lasciare spazio ai simboli
function larghezzaCanvas() {
  return max(windowWidth, larghezzaMinima);
}

// la pagina diventa più alta quando la legenda è sotto al grafico
function altezzaCanvas() {
  if (legendaADestra()) {
    return max(windowHeight, 830);
  }

  return max(windowHeight, 1200);
}

// se la legenda è a destra, le riservo una parte della larghezza
function fineGrafico() {
  if (legendaADestra()) {
    return width - 334;
  }

  return width - 50;
}

// calcolo la larghezza di ciascuna delle cinque colonne
function larghezzaColonna() {
  return (
    fineGrafico() -
    margine -
    25 -
    4 * spazio
  ) / 5;
}

// disegno ogni volta il grafico e aggiorno le interazioni con il mouse
function draw() {
  // scelgo il colore dello sfondo della pagina
  background("#f6f3ef");

  noStroke();
  fill("#38353D");
  textFont("Baskerville Italic");
  textAlign(LEFT, BASELINE);
  textStyle(BOLD);
  textSize(70);

  text("Bestselling books", 50, 70);

  fill("#77727C");
  textStyle(ITALIC);
  textSize(25);

  text("Bestseller a confronto!", 50, 100);

  // titolo orizzontale sopra le colonne delle vendite
  noStroke();
  fill("#38353D");
  textFont("Georgia");
  textStyle(BOLD);
  textSize(11);
  textAlign(CENTER, CENTER);
  text("VENDITE", (margine + fineGrafico()) / 2, 130);

  noStroke();
  fill("#ffffff");

  // disegno il riquadro bianco che contiene le colonne
  rect(
    50,
    142,
    fineGrafico() - 50,
    665,
    12
  );

  let larghezza = larghezzaColonna();

  // disegno le cinque colonne delle vendite
  for (let i = 0; i < fasceVendite.length; i++) {
    let posX = margine + i * (larghezza + spazio);

    noStroke();
    fill("#faf8f9");

    rect(
      posX,
      150,
      larghezza,
      650,
      9
    );

    noStroke();
    fill("#38353D");
    textFont("Georgia");
    textAlign(CENTER, BASELINE);
    textStyle(BOLD);
    textSize(11);

    text(
      fasceVendite[i],
      posX + larghezza / 2,
      180
    );

    stroke("#77727C");
    strokeWeight(1.5);

    line(
      posX + 6,
      200,
      posX + larghezza - 6,
      200
    );
  }

  push();

  noStroke();
  fill("#38353D");
  textFont("Georgia");
  textStyle(BOLD);
  textSize(11);

  // ruoto la scritta VALUTAZIONE per metterla in verticale
  translate(75, 500);
  rotate(-HALF_PI);

  textAlign(CENTER, CENTER);
  text("VALUTAZIONE", 0, 0);

  pop();

  // disegno le linee della scala da 1 a 5 e i relativi numeri
  for (let voto = 1; voto <= 5; voto++) {
    let yScala = posizioneValutazione(voto);

    stroke("#E7E3E7");
    strokeWeight(1);

    for (let i = 0; i < fasceVendite.length; i++) {
      let posX = margine + i * (larghezza + spazio);

      line(
        posX + 6,
        yScala,
        posX + larghezza - 6,
        yScala
      );
    }

    noStroke();
    fill("#77727C");
    textFont("Georgia");
    textAlign(RIGHT, CENTER);
    textStyle(NORMAL);
    textSize(12);

    text(
      voto,
      margine - 22,
      yScala
    );
  }

  disegnaLegenda();

  libroMouse = -1;

  // disegno un glifo per ogni libro del dataset
  for (let i = 0; i < tabella.getRowCount(); i++) {
    // salto i libri per cui non è stata trovata una posizione
    if (!posizioniLibri[i]) {
      continue;
    }

    let x = posizioniLibri[i].x;
    let y = posizioniLibri[i].y;

    // leggo dal CSV genere, pagine, lingua e anno di ogni libro
    let genere = tabella.getString(i, "genere");
    let pagine = tabella.getNum(i, "pagine");
    let lingua = tabella.getString(i, "lingua_originale");
    let anno = tabella.getNum(i, "anno");

    // il numero di pagine determina il colore del glifo
    let coloreLibro;

    if (pagine <= 200) {
      coloreLibro = coloriPagine[0];

    } else if (pagine <= 350) {
      coloreLibro = coloriPagine[1];

    } else if (pagine <= 500) {
      coloreLibro = coloriPagine[2];

    } else if (pagine <= 700) {
      coloreLibro = coloriPagine[3];

    } else {
      coloreLibro = coloriPagine[4];
    }

    let linguaMinuscola =
      lingua.trim().toLowerCase();

    // riconosco sia la parola English sia la parola inglese
    let nonInglese =
      linguaMinuscola != "english" &&
      linguaMinuscola != "inglese";

    // il contorno terracotta indica una lingua diversa dall’inglese
    if (nonInglese) {
      noFill();
      stroke("#C96D65");
      strokeWeight(3);
      strokeJoin(ROUND);

      disegnaForma(genere, x, y);
    }

    noStroke();
    fill(coloreLibro);

    disegnaForma(genere, x, y);

    noStroke();
    fill("#C96D65");

    // il puntino centrale cambia dimensione in base all’anno
    let grandezzaPunto = grandezzaPuntoAnno(anno);

    if (genere == "Fantasy") { // per l forma triangolare sposto il puntino verso il basso
      circle(x, y + 2, grandezzaPunto);
    } else {
      circle(x, y, grandezzaPunto);
    }

    // definisco l’area in cui il mouse può selezionare un libro
    let areaMouse =
      dimensione / 2 +
      bordo +
      2;

    if (
      mouseX > x - areaMouse &&
      mouseX < x + areaMouse &&
      mouseY > y - areaMouse &&
      mouseY < y + areaMouse
    ) {
      libroMouse = i;
    }
  }

  if (libroMouse != -1) {
    disegnaInfoLibro(libroMouse);
  }
}

// mostro le informazioni del libro quando ci passo sopra con il mouse
function disegnaInfoLibro(i) {
  push();

  // recupero le informazioni del libro su cui si trova il mouse
  let titolo = tabella.getString(i, "titolo");
  let autore = tabella.getString(i, "autore");
  let anno = tabella.getString(i, "anno");

  let vendite = tabella.getNum(
    i,
    "copie_vendute_milioni"
  );

  let valutazione = tabella.getNum(
    i,
    "valutazione_media"
  );

  let lingua = tabella.getString(
    i,
    "lingua_originale"
  );

  // imposto larghezza, altezza minima e margini del riquadro informativo
  let boxLarghezza = 300;
  let boxAltezzaMinima = 150;
  let arrotondamento = 6;

  let margineSinistro = 12;
  let margineSuperiore = 10;
  let margineInferiore = 12;

  let altezzaRigaTitolo = 18;
  let margineSottoTitolo = 5;
  let distanzaRighe = 18;

  let larghezzaTesto =
    boxLarghezza - margineSinistro * 2;

  textFont("Georgia");
  textStyle(BOLD);
  textSize(13);
  textAlign(LEFT, TOP);

  // divido il titolo in più righe se è troppo lungo
  let righeTitolo = dividiTesto(
    titolo + " (" + anno + ")",
    larghezzaTesto
  );

  textStyle(NORMAL);
  textSize(11);

  let righeAutore = dividiTesto(
    autore,
    larghezzaTesto
  );

  // calcolo dove scrivere autore e dettagli in base allo spazio occupato dal titolo
  let inizioAutore =
    margineSuperiore +
    righeTitolo.length * altezzaRigaTitolo +
    margineSottoTitolo;

  let inizioDettagli =
    inizioAutore +
    righeAutore.length * distanzaRighe;

  // il riquadro cresce in altezza quando servono più righe
  let altezzaNecessaria =
    inizioDettagli +
    2 * distanzaRighe +
    14 +
    margineInferiore;

  let boxAltezza = max(
    boxAltezzaMinima,
    altezzaNecessaria
  );

  // posiziono il riquadro poco distante dal cursore
  let boxX = mouseX + 15;
  let boxY = mouseY + 15;

  // impedisco che il riquadro esca dai bordi della finestra
  boxX = constrain(
    boxX,
    5,
    max(5, width - boxLarghezza - 5)
  );

  boxY = constrain(
    boxY,
    5,
    max(5, height - boxAltezza - 5)
  );

  noStroke();
  fill("#ffffff");

  rect(
    boxX,
    boxY,
    boxLarghezza,
    boxAltezza,
    arrotondamento
  );

  fill("#38353D");
  textFont("Georgia");
  textAlign(LEFT, TOP);
  textSize(13);
  textStyle(BOLD);

  // scrivo tutte le righe del titolo una sotto l’altra
  for (let j = 0; j < righeTitolo.length; j++) {
    text(
      righeTitolo[j],
      boxX + margineSinistro,
      boxY + margineSuperiore +
      j * altezzaRigaTitolo
    );
  }

  textSize(11);
  textStyle(NORMAL);

  let xInfo = boxX + margineSinistro;
  let yInfo = boxY + inizioAutore;

  // scrivo il nome dell’autore sotto al titolo
  for (let j = 0; j < righeAutore.length; j++) {
    text(
      righeAutore[j],
      xInfo,
      yInfo + j * distanzaRighe
    );
  }

  // sotto l’autore mostro valutazione, vendite e lingua originale
  yInfo = boxY + inizioDettagli;

  text(
    "Valutazione: " +
    valutazione.toFixed(2) +
    " / 5",
    xInfo,
    yInfo
  );

  yInfo += distanzaRighe;

  text(
    "Vendite stimate: " +
    vendite +
    " milioni",
    xInfo,
    yInfo
  );

  yInfo += distanzaRighe;

  text(
    "Lingua originale: " + lingua,
    xInfo,
    yInfo
  );

  pop();
}

// disegno la legenda a lato o sott il grafico, in base allo schermo
function disegnaLegenda() {
  push();

  // su uno schermo largo la legenda si trova nel riquadro a destra
  if (legendaADestra()) {

    let x = width - 318;
    let y = 142;
    let w = 268;
    let h = 665;

    noStroke();
    fill("#ffffff");
    rect(x, y, w, h, 12);

    fill("#38353D");
    textFont("Georgia");
    textStyle(BOLD);
    textSize(15);
    textAlign(LEFT, TOP);

    text("LEGENDA", x + 22, y + 23);

    disegnaTitoloSezione(
      "GENERE LETTERARIO",
      x + 22,
      y + 70
    );

    for (let i = 0; i < generi.length; i++) {
      let yy = y + 105 + i * 25;

      disegnaSimboloLegenda(
        generi[i],
        x + 34,
        yy
      );

      noStroke();
      fill("#38353D");
      textFont("Georgia");
      textStyle(NORMAL);
      textSize(10.5);
      textAlign(LEFT, CENTER);

      text(
        generi[i],
        x + 52,
        yy
      );
    }

    disegnaSeparatore(
      x + 22,
      y + 290,
      w - 44
    );

    disegnaTitoloSezione(
      "NUMERO DI PAGINE",
      x + 22,
      y + 310
    );

    for (let i = 0; i < 5; i++) {
      let yy = y + 343 + i * 25;

      noStroke();
      fill(coloriPagine[i]);

      rect(
        x + 25,
        yy - 7,
        14,
        14,
        2
      );

      fill("#38353D");
      textFont("Georgia");
      textStyle(NORMAL);
      textSize(11);
      textAlign(LEFT, CENTER);

      text(
        etichettePagine[i] + " pagine",
        x + 52,
        yy
      );
    }

    disegnaSeparatore(
      x + 22,
      y + 482,
      w - 44
    );

    disegnaTitoloSezione(
      "ANNO DI PUBBLICAZIONE",
      x + 22,
      y + 499
    );

    for (let i = 0; i < 5; i++) {
      let xx = x + 39 + i * 44;
      let yy = y + 544;

      noStroke();
      fill("#B6B1B8");
      circle(xx, yy, 18);

      fill("#C96D65");
      circle(
        xx,
        yy,
        map(i, 0, 4, 1.5, 6.5)
      );
    }

    fill("#77727C");
    textFont("Georgia");
    textSize(10);
    textStyle(NORMAL);

    textAlign(LEFT, TOP);
    text("Più antico", x + 24, y + 560);

    textAlign(RIGHT, TOP);
    text(
      "Più recente",
      x + w - 24,
      y + 560
    );

    disegnaSeparatore(
      x + 22,
      y + 590,
      w - 44
    );

    disegnaTitoloSezione(
      "LINGUA ORIGINALE",
      x + 22,
      y + 605
    );

    disegnaLinguaLegenda(
      x + 34,
      y + 640,
      false
    );

    fill("#38353D");
    noStroke();
    textFont("Georgia");
    textStyle(NORMAL);
    textSize(11);
    textAlign(LEFT, CENTER);

    text(
      "Inglese",
      x + 52,
      y + 640
    );

    disegnaLinguaLegenda(
      x + 145,
      y + 640,
      true
    );

    fill("#38353D");
    text(
      "Altre lingue",
      x + 162,
      y + 640
    );

  // su uno schermo stretto la legenda si sposta sotto il grafico
  } else {

    let x = 50;
    let y = 830;
    let w = width - 100;
    let h = 340;

    noStroke();
    fill("#ffffff");
    rect(x, y, w, h, 12);

    fill("#38353D");
    textFont("Georgia");
    textStyle(BOLD);
    textSize(15);
    textAlign(LEFT, TOP);

    text(
      "LEGENDA",
      x + 25,
      y + 22
    );

    let xSinistra = x + 25;
    let xDestra = x + w / 2 + 10;

    disegnaTitoloSezione(
      "GENERE LETTERARIO",
      xSinistra,
      y + 65
    );

    for (let i = 0; i < generi.length; i++) {
      let yy = y + 105 + i * 28;

      disegnaSimboloLegenda(
        generi[i],
        xSinistra + 12,
        yy
      );

      fill("#38353D");
      noStroke();
      textFont("Georgia");
      textStyle(NORMAL);
      textSize(11);
      textAlign(LEFT, CENTER);

      text(
        generi[i],
        xSinistra + 32,
        yy
      );
    }

    disegnaTitoloSezione(
      "NUMERO DI PAGINE",
      xDestra,
      y + 65
    );

    for (let i = 0; i < 5; i++) {
      let yy = y + 104 + i * 27;

      noStroke();
      fill(coloriPagine[i]);

      rect(
        xDestra + 3,
        yy - 7,
        14,
        14,
        2
      );

      fill("#38353D");
      textFont("Georgia");
      textStyle(NORMAL);
      textSize(11);
      textAlign(LEFT, CENTER);

      text(
        etichettePagine[i] + " pagine",
        xDestra + 29,
        yy
      );
    }

    disegnaTitoloSezione(
      "ANNO DI PUBBLICAZIONE",
      xDestra,
      y + 240
    );

    for (let i = 0; i < 5; i++) {
      let xx = xDestra + 15 + i * 43;
      let yy = y + 282;

      noStroke();
      fill("#B6B1B8");
      circle(xx, yy, 18);

      fill("#C96D65");
      circle(
        xx,
        yy,
        map(i, 0, 4, 1.5, 6.5)
      );
    }

    fill("#77727C");
    textFont("Georgia");
    textSize(10);
    textStyle(NORMAL);

    textAlign(LEFT, TOP);
    text(
      "Antico",
      xDestra + 2,
      y + 300
    );

    textAlign(RIGHT, TOP);
    text(
      "Recente",
      xDestra + 200,
      y + 300
    );

    disegnaTitoloSezione(
      "LINGUA ORIGINALE",
      xSinistra,
      y + 280
    );

    disegnaLinguaLegenda(
      xSinistra + 12,
      y + 318,
      false
    );

    fill("#38353D");
    noStroke();
    textFont("Georgia");
    textStyle(NORMAL);
    textSize(11);
    textAlign(LEFT, CENTER);

    text(
      "Inglese",
      xSinistra + 30,
      y + 318
    );

    disegnaLinguaLegenda(
      xSinistra + 140,
      y + 318,
      true
    );

    fill("#38353D");
    text(
      "Altre lingue",
      xSinistra + 158,
      y + 318
    );
  }

  pop();
}


function disegnaTitoloSezione(testo, x, y) {
  push();

  noStroke();
  fill("#77727C");
  textFont("Georgia");
  textStyle(BOLD);
  textSize(10);
  textAlign(LEFT, TOP);

  text(testo, x, y);

  pop();
}

// separo le parti della legenda con una linea sottile
function disegnaSeparatore(x, y, lunghezza) {
  push();

  stroke("#E7E3E7");
  strokeWeight(1);

  line(
    x,
    y,
    x + lunghezza,
    y
  );

  pop();
}

function disegnaSimboloLegenda(genere, x, y) {
  push();

  translate(x, y);
  scale(0.82);

  noStroke();
  fill("#B6B1B8");

  disegnaForma(genere, 0, -3);

  pop();
}

// aggiungo il contono per indicare le altre lingue
function disegnaLinguaLegenda(x, y, nonInglese) {
  push();

  noStroke();
  fill("#B6B1B8");
  circle(x, y, 18);

  if (nonInglese) {
    noFill();
    stroke("#C96D65");
    strokeWeight(3);

    circle(x, y, 18);
  }

  pop();
}

// mando a capo i testi troppo lunghi per il riquadro
function dividiTesto(testo, larghezzaMassima) {
  let parole = testo.split(" ");
  let righe = [];
  let riga = "";

  // controllo una parola alla volta per vedere se entra nella riga
  for (let i = 0; i < parole.length; i++) {
    let nuovaRiga = riga;

    if (riga == "") {
      nuovaRiga = parole[i];
    } else {
      nuovaRiga = riga + " " + parole[i];
    }

    // aggiungo una parola solo se entra nel riquadro
    if (textWidth(nuovaRiga) <= larghezzaMassima) {
      riga = nuovaRiga;
    // se non c’è spazio, salvo la riga e ne inizio una nuova
    } else {
      if (riga != "") {
        righe.push(riga);
      }
      riga = parole[i];
    }
  }

  if (riga != "") {
    righe.push(riga);
  }

  return righe;
}

// map trasforma l’ordine cronologico in una dimensione da 1.5 a 6.5
function grandezzaPuntoAnno(anno) {
  // trovo la posizione dell’anno nella lista ordinata
  let posizioneAnno = anniOrdinati.indexOf(anno);

  if (
    posizioneAnno < 0 ||
    anniOrdinati.length <= 1
  ) {
    return 2;
  }

  return map(
    posizioneAnno,
    0,
    anniOrdinati.length - 1,
    1.5,
    6.5
  );
}

// a ogni genere letterario associo una forma geometrica
function disegnaForma(genere, x, y) {

  // scelgo una delle sette forme geometriche in base al genere
  if (genere == "Narrativa realistica") {
    circle(x, y, dimensione);

  } else if (
    genere == "Narrativa storica e d'avventura"
  ) {
    rectMode(CENTER);

    rect(
      x,
      y,
      dimensione,
      dimensione,
      2
    );

    rectMode(CORNER);

  } else if (genere == "Fantasy") {
    triangle(
      x,
      y - dimensione / 2,
      x - dimensione / 2,
      y + dimensione / 2,
      x + dimensione / 2,
      y + dimensione / 2
    );

  } else if (
    genere == "Fantascienza e distopia"
  ) {
    quad(
      x,
      y - dimensione / 2,
      x + dimensione / 2,
      y,
      x,
      y + dimensione / 2,
      x - dimensione / 2,
      y
    );

  // disegno l’esagono calcolando sei vertici intorno al centro
  } else if (
    genere == "Horror, giallo e thriller"
  ) {
    beginShape();

    for (let a = 0; a < 6; a++) {
      let angolo = TWO_PI * a / 6;

      vertex(
        x + cos(angolo) * dimensione / 2,
        y + sin(angolo) * dimensione / 2
      );
    }

    endShape(CLOSE);

  // alterno due raggi per costruire la forma a stella
  } else if (genere == "Poesia e teatro") {
    beginShape();

    for (let a = 0; a < 10; a++) {
      let angolo = -HALF_PI + a * TWO_PI / 10;
      let raggio;

      if (a % 2 == 0) {
        raggio = dimensione / 2;
      } else {
        raggio = dimensione / 4;
      }

      vertex(
        x + cos(angolo) * raggio,
        y + sin(angolo) * raggio
      );
    }

    endShape(CLOSE);

  } else if (genere == "Saggistica e narrativa illustrata") {
    // disegno la croce con due rettangoli
    rectMode(CENTER);
    rect(x, y, dimensione / 3, dimensione);
    rect(x, y, dimensione, dimensione / 3);
    rectMode(CORNER);
  }
}

// distribuisco i libri per vendite e valutazione evitando sovrapposizioni
function calcolaPosizioni() {

  posizioniLibri = [];

  let larghezza = larghezzaColonna();

  // divido i libri nelle cinque fasce di vendite
  for (let i = 0; i < fasceVendite.length; i++) {
    let libriColonna = [];

    for (let r = 0; r < tabella.getRowCount(); r++) {
      let fascia = tabella.getString(
        r,
        "fascia_vendite"
      );

      if (fascia == fasceVendite[i]) {
        libriColonna.push(r);
      }
    }

    // ordino i libri della colonna per valutazione media
    libriColonna.sort(function(a, b) {
      return (
        tabella.getNum(b, "valutazione_media") -
        tabella.getNum(a, "valutazione_media")
      );
    });

    let posX = margine + i * (larghezza + spazio);

    // lascio un margine interno per non tagliare i simboli ai bordi
    let margineInterno =
      dimensione / 2 +
      bordo +
      3;

    let spazioDisponibile =
      larghezza - 2 * margineInterno;

    // calcolo quanti posti orizzontali ci sono in ogni colonna
    let numeroSpazi = max(
      1,
      floor(spazioDisponibile / distanzaTraLibri) + 1
    );

    let libriInseriti = [];

    // per ogni libro della colonna leggo valutazione e lingua
    for (let k = 0; k < libriColonna.length; k++) {
      let numRiga = libriColonna[k];

      let voto = tabella.getNum(
        numRiga,
        "valutazione_media"
      );

      let lingua = tabella.getString(
        numRiga,
        "lingua_originale"
      );

      let linguaMinuscola =
        lingua.trim().toLowerCase();

      let nonInglese =
        linguaMinuscola != "english" &&
        linguaMinuscola != "inglese";

      // aggiungo lo spessore del contorno se il libro non è in inglese
      let raggioLibro = dimensione / 2;

      if (nonInglese) {
        raggioLibro += bordo;
      }

      let yOriginale = posizioneValutazione(voto);
      let trovato = false;

      // provo posizioni sopra e sotto finché trovo spazio
      for (let prova = 0; prova < 300 && !trovato; prova++) {
        // provo prima il voto esatto, poi 4 pixel sotto, 4 sopra, 8 sotto e così via
        let spostamento = ceil(prova / 2) * 4;

        if (prova % 2 == 0) {
          spostamento = -spostamento;
        }

        let y = yOriginale + spostamento;

        // scarto le posizioni che escono dai limiti verticali del grafico
        if (
          y - raggioLibro < altoGrafico ||
          y + raggioLibro > bassoGrafico
        ) {
          continue;
        }

        // controllo uno alla volta i possibili posti nella colonna
        for (
          let c = 0;
          c < numeroSpazi && !trovato;
          c++
        ) {
          let corsia = (c + k) % numeroSpazi;
          let x;

          // calcolo la posizione orizzontale del simbolo nella colonna
          if (numeroSpazi == 1) {
            x = posX + larghezza / 2;

          } else {
            x =
              posX +
              margineInterno +
              corsia * spazioDisponibile /
              (numeroSpazi - 1);
          }

          // all’inizio considero libera la posizione che sto controllando
          let libero = true;

          // verifico che il glifo non si sovrapponga agli altri
          for (let j = 0; j < libriInseriti.length; j++) {
            let altro = libriInseriti[j];

            let distanza = dist(
              x,
              y,
              altro.x,
              altro.y
            );

            // se due simboli sono troppo vicini, devo provare un altro posto
            if (
              distanza <
              raggioLibro +
              altro.raggioLibro +
              3
            ) {
              libero = false;
              break;
            }
          }

          // quando trovo spazio salvo le coordinate del libro
          if (libero) {
            posizioniLibri[numRiga] = {
              x: x,
              y: y
            };

            libriInseriti.push({
              x: x,
              y: y,
              raggioLibro: raggioLibro
            });

            trovato = true;
          }
        }
      }
    }
  }
}

// converto la valutazione numerica nella coordinata verticale
function posizioneValutazione(voto) {
  // trasformo il voto in una coordinata y: i voti più alti vanno in alto
  if (voto <= 3) {
    return map(
      voto,
      1,
      3,
      bassoGrafico,
      710
    );
  }

  return map(
    voto,
    3,
    5,
    710,
    altoGrafico
  );
}

// ricalcolo canvas e posizioni quando cambia la finestra
function windowResized() {
  resizeCanvas(
    larghezzaCanvas(),
    altezzaCanvas()
  );

  if (tabella) {
    calcolaPosizioni();
  }
}

//#region /-----Datas-------/

/* CONSTANTES */

/**
 * Couleurs
 */
const COLOR = {
    //Points
    point_color: "#0049bd",
    random: false,
}

/**
 * Values
 */
const VALUES = {
    //Calcul
    PI_TWO: Math.PI * 2,           //(PI * 2) est utilisé pour calculer la surface du cercle

    //Points
    POINTS_NB: 2048,   			//Nombre de points (doit être inférieur ou égual à 'FFTSIZE')
    POINTS_RADIUS: 4, 		    //Taille des points (rayon)

    //Données
    SPHERE_SPEED: 0.010,    //Vitesse de la rotation

    //Global
    AUDIO_CONTEXT: (AudioContext || window.AudioContext || window.webkitAudioContext),              //On récupére l'audioContext (dépends du navigateur)
    FREQUENCY_HIGHT_POINT: 100,    //Point où l'on concidère que la fréquence est haute
    FFTSIZE: 2048,                 //Influe sur le nombre de donnéese reçues. Doit être une puissance de 2 non nulle située dans l'intervalle compris entre 32 et 32768. Valeur par défaut est [2048] (https://developer.mozilla.org/fr/docs/Web/API/AnalyserNode/fftSize)
}

//1
const ctx = document.getElementById('canvas').getContext('2d');
const actx = new VALUES.AUDIO_CONTEXT();

//2
const DEBUG = false;
const MUSIC_URL = "http://185.216.25.178:4367/mp3/-T9i9dtLKKM";

//3
const analyser = actx.createAnalyser();           //Element pour l'analyse
const gainNode = actx.createGain();               //Element pour le volume

//4
const VOLUME = 0.5;

/* VARIABLES */

//1
let w = 0;          //Largeur du canvas
let h = 0;          //Hauteur du canvas
let dx = 0;         //Largeur / 2 du canvas
let dy = 0;         //Hauteur / 2 du canvas

//2
let playing = false;                //Si on est entrain de jouer de la musique

//3
let frequencyData = null;           //Tableau des fréquence de la musique
let bufferSource = null;            //Ce qui va nous permettre de jouer de la musique
let audioBuffer = null;             //Tableau qui contient notre musique
let avg = null;                     //On récupére la moyenne de la fréquence

//4
let startedAt = null;               //Temps quand on a commencé
let pausedAt = null;                //Temps quand on a fait une pause

//#endregion

//#region /-----Events------/

//1
window.onresize = onResizeEvent;          //Event quand on redimensionne la fenêtre

//2
window.onload = onLoadEvent;              //Event quand on charge la page

/**
 * Quand on redimensionne la fenêtre
 */
function onResizeEvent() {
    //On change les valeurs (widht, height, moitié de width et moitié de height)
    w = window.innerWidth;
    h = window.innerHeight;
    dx = w / 2;
    dy = h / 2;

    //On redimensionne le canvas
    ctx.canvas.width = w;
    ctx.canvas.height = h;

    //On clear le canvas
    clearCanvas();

    //On redimensionne la sphère
    sphere.resize();
}

/**
 * Event quand on charge la page
 * @returns void
 */
function onLoadEvent() {
    //Si l'audio context n'est pas supporté
    if (!VALUES.AUDIO_CONTEXT) return;

    //On resize
    onResizeEvent();
}
//#endregion

//#region /-----Utils-------/

/**
* On log le text
* @param {*} text text
*/
function log(text) {
    //Si on est en mode debug
    if (DEBUG) {
        //On log le text
        console.log(text);
    }
}

/**
* On log un temps
* @param {*} text text
* @param {*} end Si on est à la fin du temps
*/
function logTime(text, end = false) {
    //Si on est en mode debug
    if (DEBUG) {
        //On log le temps
        !end ? console.time(text) : console.timeEnd(text);
    }
}

/**
* On récupére la moyenne d'un array
* @param {*} array array
* @returns Retourne la moyenne d'un array
*/
function average(array) {
    //On instancie le total
    let total = 0;

    //On boucle l'array
    for (let i = 0; i < array.length; i++) {
        //On ajoute l'element
        total += array[i];
    }

    //On calcul et retourne la moyenne
    return total / array.length;
}
//#endregion

//#region /-----Function----/

/**
 * Animate
 * @returns
 */
function animate() {
    //Si on n'est pas entrain de jouer de la musique
    if (!playing) return;

    //RequestAnimation
    window.requestAnimationFrame(animate);

    //On récupére les fréquences de la musique au tick actuel
    analyser.getByteFrequencyData(frequencyData);

    //On récupére la moyenne de la fréquence
    avg = average([].slice.call(frequencyData)) * gainNode.gain.value;

    //On clear le canvas
    clearCanvas();

    //On redessine la sphere
    sphere.draw();
}

/**
 * On clear le canvas
 */
function clearCanvas() {
    //On clear le rectangle
    ctx.clearRect(0, 0, w, h);
}

/**
* On toggle l'audio
*/
function toggleAudio() {
    //On change le playing
    playing = !playing;

    //On affiche le statut
    document.title = playing ? "Playing..." : "Pause...";

    //On toggle l'audio
    playing ? playAudio() : pauseAudio()
}

/**
* On joue l'audio
*/
function playAudio() {
    //On récupére le temps du démarrage
    startedAt = pausedAt ? Date.now() - pausedAt : Date.now();

    //On crée le bufferSource et on le configure
    bufferSource = actx.createBufferSource();
    bufferSource.buffer = audioBuffer;
    bufferSource.loop = true;
    bufferSource.connect(gainNode);

    //Event quand on a fini la musique
    bufferSource.onended = function () {
        //Si on était entreint de jouer de la musique
        if (playing) {
            //On passe le playing en false
            playing = false;
            pausedAt = null;
        }
    }

    //Si pausAt existe on redémarre par rapport au temps passé sinon on relance
    pausedAt ? bufferSource.start(0, pausedAt / 1000) : bufferSource.start();

    //On lance l'annimation
    animate();
}

/**
* On mets l'audio en pause
*/
function pauseAudio() {
    //Si le bufferSource n'est pas égual à null
    if (bufferSource != null) {
        //On calcul la pausee
        pausedAt = Date.now() - startedAt;

        //On stop la musique
        bufferSource.stop();
    }
}

/**
 * On initialise l'audio
 */
function initAudio(buffer) {
    //On enregistre l'audio buffer (les données de la musique)
    audioBuffer = buffer;

    //Settings de l'analyser
    analyser.fftSize = VALUES.FFTSIZE;
    analyser.minDecibels = -100;
    analyser.maxDecibels = -30;
    analyser.smoothingTimeConstant = 0.8;

    //On change le volume et on connecte les machines
    gainNode.gain.value = VOLUME;
    gainNode.connect(analyser);
    analyser.connect(actx.destination);

    //On enregistre le tableau de données
    frequencyData = new Uint8Array(analyser.frequencyBinCount);

    //On génére les elements
    sphere.generate();

    //On lance l'audio
    toggleAudio();

    //On ajoute un envent click sur le canvas
    ctx.canvas.onclick = toggleAudio;
}
//#endregion

//#region /-----Class-------/

/**
 * Class Vertex3D
 */
class Vertex3D {
    /**
     * Constructeur renseigné
     * @param {*} x Position en x
     * @param {*} y Position en y
     * @param {*} z Position en z
     */
    constructor(x, y, z) {
        //On enregistre
        this.x = parseFloat(x);
        this.y = parseFloat(y);
        this.z = parseFloat(z);
    }
}

/**
 * Sphere
 */
const sphere = {
    /* Variable de classe */
    position: new Vertex3D(),       //Position de la sphere
    rotation: 0,                    //Rotation de la sphere
    points: [],                     //Points que contient la sphere
    /**
     * On génére les points sur la sphere
     */
    generate: function () {
        //On boucle le nombre de points voulu pour les créer
        for (let i = 0; i < VALUES.POINTS_NB; i++) {
            //On ajoute le point
            this.points.push(new Point(i));
        }
    },
    /**
     * On redimentione la sphere
     */
    resize: function () {
        //On calcul le radius
        this.radius = (Math.min(w, h) / 2);

        //On calcul la différence de taille entre les points de devant et de derrière
        this.scaleDiff = w / (w / 300);

        //On dessine
        this.draw();
    },
    /**
     * On dessine
     */
    draw: function () {
        //On modifie la rotation
        this.rotation += VALUES.SPHERE_SPEED;

        //Si on a fait un tour complet
        if (this.rotation > VALUES.PI_TWO) {
            //On reset la rotation
            this.rotation = VALUES.SPHERE_SPEED;
        }

        //On calcul le sinus et le cosinus de la rotation
        const sin = Math.sin(this.rotation);
        const cos = Math.cos(this.rotation);

        //On boucle les points pour les dessiner
        this.points.forEach(el => {
            el.draw(sin, cos);
        });
    }
}

/**
 * Class Point
 */
class Point {
    /**
     * Constructeur default
     * @param {*} pos Position du point
     */
    constructor(index) {
        //On enregistre l'index du point
        this.index = index;

        //On génére une position (radian) random dans la sphère (azimuthal angle) (sortie [0°, 360°])
        const p = Math.random() * VALUES.PI_TWO;

        //On génére une position (radian) random dans la sphère (l'angle polar) (acos entré [-1, 1] sortie [0, π] soit [0°, 180°])
        const o = Math.acos((Math.random() * 2) - 1);

        //On crée la position du point sur la sphere (sans le rayon donc actuellement les points sont collés au centre) (https://en.wikipedia.org/wiki/Spherical_coordinate_system#Coordinate_system_conversions)
        const pos = new Vertex3D(
            Math.cos(p) * Math.sin(o),    //x
            Math.sin(p) * Math.sin(o),    //y
            Math.cos(o)                   //z
        );

        //On enregistre la position
        this.position = pos;
    }
    /**
     * On dessine le point sur le canvas
     * @param {*} sin Sinus de l'angle (rotation)
     * @param {*} cos Cosinus de l'angle (rotation)
     */
    draw(sin, cos) {
        //On calcul le rayon avec la fréquence
        const radius = sphere.radius + frequencyData[this.index] / 5;

        //On ajoute le rayon aux points pour les "décoler" du centre
        const x = this.position.x * radius;
        const y = this.position.y * radius;
        const z = this.position.z * radius;

        //On calcul la 3d
        const rotX = x * cos + z * sin;
        const rotZ = x * -sin + z * cos - sphere.radius;

        //On calcul le scale
        const scale = sphere.scaleDiff / (sphere.scaleDiff - rotZ);

        //On calcul la position en x
        const posX = rotX * scale + dx;

        //On calcul la position en y
        const posY = y * scale + dy;

        //On dessine le point sur la canvas
        ctx.beginPath();
        ctx.arc(posX, posY, VALUES.POINTS_RADIUS * scale, 0, VALUES.PI_TWO);
        ctx.closePath();
        ctx.fillStyle = COLOR.random ? `#${Math.floor(Math.random()*16777215).toString(16)}` : COLOR.point_color;
        ctx.fill();
    }
}
//#endregion
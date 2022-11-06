/* CONSTANTES */

//1
const inputAudio = document.getElementById("inputAudio");

/**
 * Event quand on ajoute un fichier à l'inputAudio
 */
inputAudio.addEventListener('change', function() {
    //On récupére le buffer
    const reader = new FileReader();
    reader.onload = function() {
        //On décode l'audio
        actx.decodeAudioData(this.result, function(buffer) {
            //On enlève le truc moche
            inputAudio.parentElement.removeChild(inputAudio);

            //On initialise l'audio
            initAudio(buffer);
        });
    };

    //On lis le fichier
    reader.readAsArrayBuffer(this.files[0]);
});
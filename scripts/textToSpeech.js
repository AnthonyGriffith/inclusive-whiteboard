import { newFormData, postJSON } from './helpers.js';
import { workflowCb } from './main.js';

let utter = new SpeechSynthesisUtterance();
let synth = window.speechSynthesis;
let paused = true;
let event;
let string;
let firstLoad = true;



string = window.localStorage.getItem('savedString') || '';

export async function readWorkflow() {
    if (string) {
        speak(string);
    } else {
        string = await getString();
        speak(string);
    }
}

function pause() {
    synth.pause();
}

function resume() {
    if (firstLoad) {
        readWorkflow();
        firstLoad = false;
    } else {
        synth.resume();
    }
}

function cancel() {
    synth.cancel();
}

function speak(text) {
    utter.lang = "en-En";
    utter.volume = 0.5;
    utter.onboundary = function (e) {
        event = e;
    }
    utter.onend = function () {
        window.localStorage.removeItem('savedString');
    };
    utter.text = text;
    synth.speak(utter);
}

//Get final string for speak function.
async function getString() {
    let finalString = '';

    const states = {};

    const id_workflow = workflowCb.options[workflowCb.selectedIndex]?.dataset.id;

    //Search the current workflow information.
    const formData = newFormData({ id_workflow });
    const data = await postJSON(
        '../phps/read/tts.php',
        formData
    );

    //search the current workflow name
    finalString += `For the workflow named ${data[0].workflow_name}, you have the following information. `;

    //for each state, search each cards text
    data.forEach(({ state_name, card_text }) => {
        if (!states[state_name]) {
            states[state_name] = [card_text];
        } else {
            states[state_name] = [card_text, ...states[state_name]];
        }
    });

    //We iterate the states object to get cards of each state.
    Object.entries(states).forEach(entrie => {
        finalString += `for the state ${entrie[0]}, ${entrie[1][0] ? 'we got the following cards: ' : 'you have no cards.'}`;
        entrie[1].forEach(card => {
            if (card) finalString += `${card}. `;
        })
    });

    //Return the final string.
    return finalString;
}



// const btnTalk = document.querySelector('.btn-talk');
// btnTalk.addEventListener('click', function () {
//     readWorkflow();
// });

const btnPauseResume = document.querySelector('.btn-pause_resume');
btnPauseResume.addEventListener('click', function () {
    paused = !paused;

    //Este lo pausa y guarda en local storage
    if (paused) {
        pause();
        const savedString = string.slice(event.charIndex, -1);
        window.localStorage.setItem('savedString', savedString);
    }

    //ESTE REANUDA
    if (!paused) {
        resume();
    }
});

window.addEventListener('unload', function () {
    cancel();
})

let tracks = document.getElementById('tracks');
let controls = document.getElementById('controls');
let defaultStep = document.querySelector('.step').cloneNode(true);

tracks.addEventListener('click', trackClick);
controls.addEventListener('click', controlClick);

function controlClick(evt)
{
    if (evt.srcElement.nodeName == 'BUTTON') {
        controlButtonClick(evt.srcElement.value);
    }
}

function controlButtonClick(action) 
{
    switch(action) {
        case 'play':
            controlTogglePlay();
            break;
    }
}

function controlTogglePlay() {

}

function trackClick(evt)
{
    if (evt.srcElement.nodeName == 'BUTTON') {
        trackButtonClick(evt.srcElement.value, evt.srcElement, evt);
    }
}

function trackButtonClick(action, target, evt)
{
    let targetStep = target.closest('.step');
    let newStep = evt.getModifierState('Alt') == true ? targetStep : defaultStep; 
    switch(action) {
        case 'insert before':
            insertStepBefore(targetStep, newStep);
            break;
        case 'remove':
            stepRemove(targetStep);
            break;
        case 'insert after':
            insertStepAfter(targetStep, newStep);
            break;
    }
}

function stepRemove(targetStep)
{
    let sequence = targetStep.closest('.steps');
    let steps = sequence.querySelectorAll('.step');
    console.log(steps);
    if (sequence.querySelectorAll('.step').length <= 1) {
        return;
    }
   sequence.removeChild(targetStep);
}

function insertStepBefore(targetStep, step) {
    targetStep.before(step.cloneNode(true));
}

function insertStepAfter(targetStep, step) {
    targetStep.after(step.cloneNode(true));
}
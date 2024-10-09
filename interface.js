
let tracks = document.getElementById('tracks');
let step = document.querySelector('.step').cloneNode(true);

tracks.addEventListener('click', trackClick);

function trackClick(evt)
{
    console.log(evt.srcElement.nodeName);
    if (evt.srcElement.nodeName == 'BUTTON') {
        buttonClick(evt.srcElement.value, evt.srcElement);
    }
}

function buttonClick(action, target)
{
    let targetStep = target.closest('.step');
    switch(action) {
        case 'insert before':
            insertStepBefore(targetStep);
            break;
        case 'remove':
            stepRemove(targetStep);
            break;
        case 'insert after':
            insertStepAfter(targetStep);
            break;
    }
}

function stepRemove(targetStep)
{
    let sequence = targetStep.closest('.sequence');
    let steps = sequence.querySelectorAll('.step');
    console.log(steps);
    if (sequence.querySelectorAll('.step').length <= 1) {
        return;
    }
   sequence.removeChild(targetStep);
}

function insertStepBefore(targetStep) {
    targetStep.before(step.cloneNode(true));
}

function insertStepAfter(targetStep) {
    targetStep.after(step.cloneNode(true));
}
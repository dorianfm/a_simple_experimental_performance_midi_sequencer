
let tracks = document.getElementById('tracks');
let controls = document.getElementById('controls');
let defaultTrack = document.querySelector('.track').cloneNode(true);
let defaultPattern = document.querySelector('.pattern').cloneNode(true);
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
        buttonClick(evt.srcElement.value, evt.srcElement, evt);
    }
}

function buttonClick(action, button, evt)
{
    let target = button.closest('.step, .pattern, .track');
    let targetClass = elementClass(target);
    let newElement = evt.getModifierState('Alt') == true ? target : defaultFor(target); 
    switch(action) {
        case 'insert before':
            insertBefore(target, newElement);
            break;
        case 'remove':
            remove(target);
            break;
        case 'insert after':
            insertAfter(target, newElement);
            break;
    }
}

function defaultFor(target) {
    if (target.matches('.step')) return defaultStep;
    if (target.matches('.pattern')) return defaultPattern; 
    if (target.matches('.track')) return defaultTrack;
}

function elementClass(target) {
    if (target.matches('.step')) return '.step';
    if (target.matches('.pattern')) return '.pattern'; 
    if (target.matches('.track')) return '.track';
}

function remove(target)
{
    let targetClass = elementClass(target);
    console.log(target, targetClass);
    let containerClass = targetClass+'s';
    let container = target.closest(containerClass);
    let elements = container.querySelectorAll(targetClass);
    if (elements.length <= 1) {
        return;
    }
    container.removeChild(target);
}

function insertBefore(target, element) {
    target.before(element.cloneNode(true));
}

function insertAfter(target, element) {
    target.after(element.cloneNode(true));
}
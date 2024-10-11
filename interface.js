
let tracks = document.getElementById('tracks');
let controls = document.getElementById('controls');
let defaultTrack = document.querySelector('.track').cloneNode(true);
let defaultPattern = document.querySelector('.pattern').cloneNode(true);
let defaultStep = document.querySelector('.step').cloneNode(true);
let dragSource, dragElement, dragModifierKey;

if (navigator.appVersion.indexOf('Mac') != -1) {
    dragModifierKey = 'Alt';
} else {
    dragModifierKey = 'Control';
}
tracks.addEventListener('mousedown', trackMouseDown);
tracks.addEventListener('mouseup', trackMouseUp);
tracks.addEventListener('click', trackClick);
tracks.addEventListener('dragstart', trackDragStart);
tracks.addEventListener('drag', trackDrag);
tracks.addEventListener('dragend', trackDragEnd);
tracks.addEventListener('dragenter', trackDragEnter);
tracks.addEventListener('dragover', trackDragOver);
tracks.addEventListener('dragleave', trackDragLeave);
tracks.addEventListener('drop', trackDrop);

controls.addEventListener('click', controlClick);

function controlClick(evt)
{
    if (evt.target.nodeName == 'BUTTON') {
        controlButtonClick(evt.target.value);
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
    if (evt.target.nodeName == 'BUTTON') {
        buttonClick(evt.target.value, evt.target, evt);
    }
}

function trackMouseDown(evt)
{
    if (evt.target.matches('.handle')) {
        evt.target.parentNode.setAttribute("draggable", "true");
    }
}

function trackMouseUp(evt)
{
    clearDraggable();
}

function trackDragStart(evt)
{
    dragElement = evt.target;
    evt.target.classList.add('dragging');
}

function trackDrag(evt)
{
    // placeholder
}


function trackDragEnd(evt)
{
    evt.target.classList.remove('dragging');
    dragElement = false;
    clearDraggable();
}

function trackDragEnter(evt)
{
    evt.preventDefault();
    let target = evt.target.closest(elementClass(dragElement));
    if (target) target.classList.add('dragTarget');
}

function trackDragOver(evt)
{
    evt.preventDefault();
    let target = evt.target.closest(elementClass(dragElement));
    if (target) target.classList.add('dragTarget');
}

function trackDragLeave(evt)
{
    let target = evt.target.closest(elementClass(dragElement));
    if (target) target.classList.remove('dragTarget');
}

function trackDrop(evt)
{
    let target = evt.target.closest(elementClass(dragElement));
    if (target) {
        dragElement.classList.remove('dragging');
        if (evt.getModifierState(dragModifierKey) === true) {
            target.after(dragElement.cloneNode(true));
        } else {
            target.after(dragElement);
        }
    }
    tracks.querySelectorAll('.dragTarget').forEach((element) => element.classList.remove('dragTarget'));
}

function clearDraggable()
{
    tracks.querySelectorAll("[draggable]").forEach((element) => {
        element.setAttribute("draggable",'');
    });
}

function buttonClick(action, button, evt)
{
    let target = button.closest('.step, .pattern, .track');
    let targetClass = elementClass(target);
    let newElement = evt.getModifierState(dragModifierKey) == true ? target : defaultFor(target); 
    switch(action) {
        case 'remove':
            remove(target);
            break;
        case 'insert':
            if (evt.getModifierState('Shift')) {
                insertBefore(target, newElement);
            } else {
                insertAfter(target, newElement);
            }
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
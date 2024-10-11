
let project = document.querySelector('#project');
let tracks = project.querySelector('#tracks');
let controls = project.querySelector('#controls');

let undoButton = controls.querySelector('button[value="undo"]');
let redoButton = controls.querySelector('button[value="redo"]');

let defaultTrack = document.querySelector('.track').cloneNode(true);
let defaultPattern = document.querySelector('.pattern').cloneNode(true);
let defaultStep = document.querySelector('.step').cloneNode(true);

let states = [], stateOffset = 0;

let dragSource, dragElement, dragModifierKey;

if (navigator.appVersion.indexOf('Mac') != -1) {
    dragModifierKey = 'Alt';
} else {
    dragModifierKey = 'Control';
}

const debounceDrag = debounce(trackDrag, 20);
const debounceDragLeave = debounce(trackDragLeave, 20);

project.addEventListener('change', projectChange);
tracks.addEventListener('mousedown', trackMouseDown);
tracks.addEventListener('mouseup', trackMouseUp);
tracks.addEventListener('click', trackClick);

tracks.addEventListener('dragstart', trackDragStart);
tracks.addEventListener('dragend', trackDragEnd);
tracks.addEventListener('dragenter', trackDrag);
tracks.addEventListener('dragover', trackDrag);
tracks.addEventListener('dragleave', trackDragLeave);
tracks.addEventListener('drop', trackDrop);

controls.addEventListener('click', controlClick);

projectChange(); // sets inital state

function projectChange()
{
    updateState();
}

function controlClick(evt)
{
    if (evt.target.nodeName == 'BUTTON') {
        controlButtonClick(evt.target.value);
        evt.preventDefault();
    }  
}

function controlButtonClick(action) 
{
    switch(action) {
        case 'play':
            controlTogglePlay();
            break;
        case 'undo':
            controlUndo();
            break;
        case 'redo':
            controlRedo();
            break;
    }
}

function controlTogglePlay() {

}

function controlUndo() {
    if (stateOffset < states.length-1) {
        stateOffset++;
        setState(states[stateOffset]);
    }
    updateStateButtons();
}

function controlRedo() {
    if (stateOffset > 0) {
        stateOffset--;
        setState(states[stateOffset]);
    }
    updateStateButtons();
}

function trackClick(evt)
{
    if (evt.target.nodeName == 'BUTTON') {
        trackButtonClick(evt.target.value, evt.target, evt);
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

function trackDragEnd(evt)
{
    evt.target.classList.remove('dragging');
    dragElement = false;
    clearDraggable();
}


function trackDrag(evt)
{
    evt.preventDefault();
    let target = evt.target.closest(elementClass(dragElement));
    if (target) {
        if (isAbove(evt.clientY, target)) {
            target.classList.add('dragTargetAbove');
        } else {
            target.classList.add('dragTargetBelow');
        }
    }
}

function trackDragLeave(evt)
{
    let target = evt.target.closest(elementClass(dragElement));
    if (target) { 
        target.classList.remove('dragTargetAbove', 'dragTargetBelow');
    }
}

function trackDrop(evt)
{
    let target = evt.target.closest(elementClass(dragElement));
    if (target) {
        dragElement.classList.remove('dragging');
        if (evt.getModifierState(dragModifierKey) === true) {
            dragElement = dragElement.cloneNode(true);
        } 
        if (isAbove(evt.clientY, target)) {
            target.before(dragElement);
        } else {
            target.after(dragElement);
        }
        projectChange();
    }
    tracks.querySelectorAll('.dragTargetAbove,.dragTargetBelow').forEach((element) => element.classList.remove('dragTargetAbove', 'dragTargetBelow'));
}


function isAbove(y, target) 
{
    let bounds = target.getBoundingClientRect();
    let targetMidY = bounds.top + ((bounds.bottom-bounds.top)/2);
    if (y < targetMidY) {
        return true;
    } 
    return false;
}

function isLeft(x, target)
{
    let bounds = target.getBoundingClientRect();
    let targetMidX = bounds.left + ((bounds.right-bounds.left)/2);
    if (x < targetMidX) {
        return true;
    }
    return false;
}


function clearDraggable()
{
    tracks.querySelectorAll("[draggable]").forEach((element) => {
        element.setAttribute("draggable",'');
    });
}

function trackButtonClick(action, button, evt)
{
    let target = button.closest('.step, .pattern, .track');
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
    evt.preventDefault();
    projectChange();
}

function defaultFor(target) {
    if (!target) { return };
    if (target.matches('.step')) return defaultStep;
    if (target.matches('.pattern')) return defaultPattern; 
    if (target.matches('.track')) return defaultTrack;
}

function elementClass(target) {
    if (!target) { return };
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


function debounce(func, delay) {
    let timerId;
  
    return function (...args) {
      clearTimeout(timerId);
      timerId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
}

function updateState()
{
    let state = currentState();
    if (stateOffset > 0) {
        states = states.slice(stateOffset);
        stateOffset = 0;
    }
    states.unshift(state);
    updateStateButtons();
    
}

function updateStateButtons()
{
    if (states.length < 2 || stateOffset >= states.length - 1) {
        undoButton.disabled = true;
    } else {
        undoButton.disabled = false;
    }

    if (stateOffset != 0) {
        redoButton.disabled = false;
    } else {
        redoButton.disabled = true;
    }
}

function setState(state)
{
    if (!state) { return; }
    for (var name in state.controls) {
        let selector = `[name="${name}"]`;
        let elm = controls.querySelector(selector);
        if (elm) elm.value = state.controls[name];
    };
    state.tracks.forEach(setTrackState);
}

function setTrackState(track, idx)
{
   // console.log(track, idx);
}

function currentState()
{

    let state = {
        controls: {},
        tracks: []
    };
    controls.querySelectorAll('input,select').forEach(
        (elm) => { 
            state.controls[elm.getAttribute('name')] = elm.value;
        }
    );
    tracks.querySelectorAll('.track').forEach((elm, idx) => {
        state.tracks[idx] = trackState(elm);
    })
    return state;
}

function trackState(track)
{
    let state = { 
        config: {},
        patterns: [] 
    };
    track.querySelectorAll('.functions input,select').forEach(
        (elm) => { 
            state.config[elm.getAttribute('name')] = elm.value;
        }
    );
    track.querySelectorAll('.pattern').forEach(
        (elm, idx) => {
            state.patterns[idx] = patternState(elm);
        }
    );
    return state;
}

function patternState(pattern)
{
    let state = [];
    pattern.querySelectorAll('.step').forEach(
        (elm, idx) => {
            state[idx] = stepState(elm);
        }
    );
    return state;
}

function stepState(step)
{
    let state = {};
    step.querySelectorAll('input,select').forEach(
        (elm) => { 
            state[elm.getAttribute('name')] = elm.value;
        }
    );
    return state;
}
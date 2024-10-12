
let project = document.querySelector('#project');
let tracks = project.querySelector('#tracks');
let controls = project.querySelector('#controls');

let undoButton = controls.querySelector('button[value="undo"]');
let redoButton = controls.querySelector('button[value="redo"]');

let archetypes = {
    track: tracks.querySelector('.track').cloneNode(true),
    pattern: tracks.querySelector('.pattern').cloneNode(true),
    step: tracks.querySelector('.step').cloneNode(true)
};

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
        evt.preventDefault();
        controlButtonClick(evt.target.value);
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
        case 'load':
            controlLoad();
            break;
        case 'save':
            controlSave();
            break;
    
    }
}

function controlTogglePlay() {

}

function controlUndo() {
    if (stateOffset < states.length-1) {
        stateOffset++;
        setState(project, states[stateOffset]);
    }
    updateStateButtons();
}

function controlRedo() {
    if (stateOffset > 0) {
        stateOffset--;
        setState(project, states[stateOffset]);
    }
    updateStateButtons();
}

function controlSave() {
    let state = getState(project);
    let title = state.config.title 
    let data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    var elm = document.createElement('a');
    elm.classList.add('hidden');
    elm.setAttribute("href", data);
    elm.setAttribute("download", title + ".json");
    document.body.appendChild(elm);
    elm.click();
    elm.remove();
}

function controlLoad() {

    var elm = document.createElement('input');
    elm.setAttribute("type", "file");
    elm.classList.add('hidden');
    document.body.appendChild(elm);
    elm.addEventListener('change',(evt) => { loadData(elm.files); elm.remove(); });
    elm.click();
}

function loadData(files) {
    if (files.length <= 0) {
        return;
    }

    var fr = new FileReader();
  
    fr.onload = function(e) { 
        var state = JSON.parse(e.target.result);
        setState(project, state);
    }
    
    fr.readAsText(files.item(0));
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
    evt.preventDefault();
    let target = button.closest('.step, .pattern, .track');
    let newElement = evt.getModifierState(dragModifierKey) == true ? target : archetypeFor(target); 
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
    projectChange();
}

function archetypeFor(target) {
    if (!target) { return };
    if (target.matches('.step')) return archetypes['step'];
    if (target.matches('.pattern')) return archetypes['pattern']; 
    if (target.matches('.track')) return archetypes['track'];
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
    let state = getState(project);
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

function getState(parent)
{
    let state = {
        config: getConfigState(parent),
    };
    let {child, children } = parent.dataset;
    if (child && children) {
        state[children] = [];
        parent.querySelector('.'+children).querySelectorAll('.'+child).forEach((elm, idx) => {
            state[children][idx] = getState(elm);
        });
    }
    return state;
}

function setState(parent, state)
{
    if (!state) { return; }
    setConfigState(parent, state.config);
    let {child, children } = parent.dataset;
    if (child && children && state[children] && archetypes[child]){
        setChildrenState(parent.querySelector('.'+children).querySelectorAll('.'+child), state[children], archetypes[child]);

    }
}

function setChildrenState(children, state, archetype)
{
    for (var idx in state) {
        if (idx > children.length - 1) {
            child = archetype.cloneNode(true);
            children[children.length-1].after(child);
        } else {
            child = children[idx];
        }
        setState(child, state[idx]);
    }
    trimNodes(children, state.length); 
}


function getConfigState(container)
{
    let config = {};
    container.querySelector('.config').querySelectorAll('input, select').forEach(
        (elm) => { 
            config[elm.getAttribute('name')] = elm.value;
        }
    );
    return config;
}

function setConfigState(container, config)
{
    for (var name in config) {
        let elm = container.querySelector(`.config [name="${name}"]`);
        if (elm.getAttribute('type') == 'checkobox') {
            if (elm.value == config[name]) {
                elm.checked = 'checked';
            } else {
                elm.checked = false;
            }
        } else {
            elm.value = config[name];
        }
    }
}

function trimNodes(nodes, length)
{
    if (nodes.length < length) {
        return;
    }
    for (var i = length; i < nodes.length; i++) {
        let node = nodes.item(i-1);
        node.remove();
    }
}

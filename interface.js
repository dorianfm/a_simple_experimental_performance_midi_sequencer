let project = document.querySelector('#project');
let tracks = project.querySelector('#tracks');
let controls = project.querySelector('#controls');
let updated = controls.querySelector(['[name="updated"]']);

let undoButton = controls.querySelector('button[value="undo"]');
let redoButton = controls.querySelector('button[value="redo"]');

let archetypes = {
    track: tracks.querySelector('.track').cloneNode(true),
    pattern: tracks.querySelector('.pattern').cloneNode(true),
    step: tracks.querySelector('.step').cloneNode(true)
};

let states = [];

var mdconverter = new showdown.Converter();

let dragSource, dragElement, dragModifierKey;

if (navigator.userAgent.includes('Mac')) {
    dragModifierKey = 'Alt';
} else {
    dragModifierKey = 'Control';
}

const debounceDrag = debounce(trackDrag, 20);
const debounceDragLeave = debounce(trackDragLeave, 20);

document.addEventListener('keydown', keydown);
document.addEventListener('keyup', keyup);

project.addEventListener('change', projectChange);
tracks.addEventListener('change', tracksChange);
tracks.addEventListener('input', tracksChange);
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

projectInit();

function projectInit()
{
    states = JSON.parse(window.localStorage.getItem('states')) ?? [];
    changeState(getStateOffset());
    updateStateButtons();
	setRangeValues();
    WebMidi.addListener('portschanged', function() { midiAssignOutputs(project); });
    WebMidi.enable().then(midiEnabled).catch(err => console.log(err));
}

function projectChange()
{
    updateState();
    updateStateButtons();
}

function midiChange(evt)
{

}

function getStateOffset()
{
    let stateOffset = Number(window.localStorage.getItem('stateOffset'));
    return stateOffset;
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
        case 'pause':
            controlPause();
            break;
        case 'rewind':
            controlRewind();
            break;
        case 'panic':
            controlPanic();
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
        case 'new':
            controlNew();
			break;
		case 'information':
			controlInformation();
			break;
		case 'settings':
			controlSettings();
			break;
    
    }
}

function controlTogglePlay() {
    if (project.classList.contains('playing')) {
        controlPause();
    } else {
        controlPlay();
    }
}

function controlPause() {
    project.querySelectorAll('.track').forEach(pauseTrack);
    project.classList.remove('playing'); 
}

function controlPlay() {
    project.querySelectorAll('.track').forEach(playTrack);
    project.classList.add('playing');
}

function controlRewind() {
    project.querySelectorAll('.track').forEach(rewindTrack);
}

function controlPanic() {
    for (var i = 0 ; i < WebMidi.outputs.length; i++) {
        WebMidi.outputs[i].sendAllNotesOff();
        WebMidi.outputs[i].sendAllSoundOff();
    }
}

function playTrack(track)
{
    track.dataset.playing = true;
    playStep(track);
}

function pauseTrack(track) {
    if (!track.dataset.playing) {
        return;
    }
    track.dataset.playing = false;
    clearTimeout(track.dataset.stepTimeout);
}

function rewindTrack(track) {
    track.querySelectorAll('.playing').forEach( (playing) => { 
        playing.classList.remove('playing'); 
    });
}

function playStep(track) {
    
    let interval = controls.querySelector('[name="interval"]').value;
	if (interval < 10) {
		interval = 10;
		controls.querySelector('[name="interval"]').value = 10;
	}
    let output = track.querySelector('.config select[name="output"]').value;
    let channel = track.querySelector('.config select[name="channel"]').value;
	let [sign, multiplier] = track.querySelector('.config select[name="multiplier"]').value.split(' ');
	let stepInterval = interval;

	let step = nextStep(track);
	if (isActive(track) && step) {
		let config = getStepConfig(step);
		let pattern = step.closest('.pattern');
		if (config.active && isActive(pattern)) {
			stepInterval = config.duration * interval;
			if (sign == '/') {
				stepInterval = stepInterval * multiplier;
			} else if (sign == '×') {
				stepInterval = stepInterval / multiplier;
			} 

			step.classList.add('playing');
			if (config.trigger && WebMidi.outputs[output]) {
				WebMidi.outputs[output].channels[channel].playNote(config.note);
				if (config.gate_length > 0) {
					WebMidi.outputs[output].channels[channel].stopNote(config.note, {time: "+"+(stepInterval * (config.gate_length/100)) });
				}
			}
			track.lastStep = step;
		} 
	} 
    track.dataset.stepTimeout = setTimeout(() => { playStep(track); }, stepInterval);
}

function nextStep(track) 
{
	let currentStep = track.querySelector('.step.playing'); // ?? track.lastStep;
	if (!currentStep) {
		currentStep = track.querySelectorAll('.step')[0];
		return currentStep;
	}
	currentStep.classList.remove('playing');
    let nextStep, pattern;
	while (nextStep = currentStep.nextElementSibling) {
		if (hasClass(nextStep,'step') && isActive(nextStep)) {
			return nextStep;
		}
		currentStep = nextStep;
	}
	let currentPattern = currentStep.closest('.pattern');
	while (pattern = nextPattern(track, currentStep)) {
		nextStep = patternNextStep(pattern);
		if (nextStep) {
			return nextStep;
		}
		if (pattern == currentPattern) {
			return;
		}
	}
	return;
}

function nextPattern(track, step)
{
	let pattern, currentPattern = step.closest('.pattern');
	while (pattern = currentPattern.nextElementSibling) {
		if (hasClass(pattern, 'pattern') && isActive(pattern)) {
			return pattern;
		} else {
			currentPattern = pattern;
		}
	}
	let patterns = track.querySelectorAll('.pattern')
	for (var i = 0; i < patterns.length; i++) {
		if (isActive(patterns[i])) {
			return patterns[i];
		}
	}
	return patterns[0];
}


function patternNextStep(pattern) {
	steps = pattern.querySelectorAll('.step');
	for (var i = 0; i < steps.length; i++) {
		if (isActive(steps[i])) {
			return steps[i];
		}
	}
}


function isActive(element)
{
	let active = element.querySelector('input[name="active"]');
	if (active && active.checked) {
		return true;
	} 
	return false;
}

function getStepConfig(step)
{
    return {
        note: step.querySelector('[name="note"]').value,
        duration: step.querySelector('[name="duration"]').value,
		trigger: step.querySelector('[name="trigger"]').checked,
        gate_length: step.querySelector('[name="gate_length"]').value,
        active: step.querySelector('[name="active"]').checked,
    }
}

function hasClass(element, cssClass) {
    if (!element) {
        return false;
    }
    if (typeof(element) != 'object') {
        return false;
    }
    if (typeof(element.classList) != 'object') {
        return false;
    }
    if (element.classList.contains(cssClass)) {
        return true;
    }
    return false;
}

function controlUndo() {
    let stateOffset = getStateOffset();
    if (stateOffset < states.length - 1) {
        changeState(stateOffset+1);
    }
}

function controlRedo() {
    let stateOffset = getStateOffset();
    if (stateOffset > 0) {
        changeState(stateOffset-1);
    }
}

function controlNew()
{
    states = [];
    project.querySelectorAll('.track').forEach((elm) => { elm.remove(); });
	let track = archetypes.track.cloneNode(true);
	setupElement(track);
    tracks.appendChild(archetypes.track.cloneNode(true));
    midiAssignOutputs(project);
    window.localStorage.setItem('stateOffset', 0);
    updateState();
    updateStateButtons();
}

function controlInformation()
{
	let overlay = document.querySelector('#information');
	if (!overlay.classList.contains('visible')) {
		hideOverlays();
		fetch('./README.md').then(response => response.text()).then(data => {
			let body = overlay.querySelector('.body');
			body.innerHTML = mdconverter.makeHtml(data);
		});
		showOverlay(overlay);
	} else {
		hideOverlays();
	}
}

function controlSettings() 
{
	let overlay = document.querySelector('#settings');
	if (!overlay.classList.contains('visible')) {
		hideOverlays();
		showOverlay(overlay);
	} else {
		hideOverlays();
	}
}

function showOverlay(overlay)
{
	overlay.classList.add('visible');
}

function hideOverlays()
{
	let overlays = document.querySelectorAll('.overlay.visible');
	overlays.forEach((overlay) => {
		overlay.classList.remove('visible');
	})
}

function changeState(offset)
{
    if (!states[offset]) {
        offset = 0;
    }
    setState(project, states[offset]);
    window.localStorage.setItem('stateOffset', offset);
    controls.querySelector('[name="stateOffset"]').value = (states.length - offset);
    updateStateButtons();
}

function controlSave() {
    let state = getState(project);
	state.stateOffset = 1;
    let title = state.config.title+' '+state.config.updated;
    let data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    var elm = document.createElement('a');
    elm.classList.add('hidden');
    elm.setAttribute("href", data);
    elm.setAttribute("download", title + ".json");
    document.body.appendChild(elm);
    elm.click();
    elm.remove();
}

function timeStamp() {
    let date = new Date();
    let string = date.getFullYear()+'-';
    string += (date.getMonth()+1+'-').padStart(3,0);
    string += (date.getDate()+' ').padStart(3,0);
    string += (date.getHours()+'-').padStart(3,0);
    string += (date.getMinutes()+'-').padStart(3,0);
    string += (date.getSeconds()+'').padStart(2,0);
    return string;
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
		state.stateOffset = 1;
        setState(project, state);
		midiAssignOutputs();
    }
    
    fr.readAsText(files.item(0));
}

function tracksChange(evt)
{
	let target = evt.target;
	if (target.nodeName == 'INPUT') {
		trackInputChange(target);
	}
}

function trackInputChange(target)
{
	if (target.getAttribute('type') == 'range') {
		setRangeValue(target);
	} else if (target.getAttribute('type') == 'number' && target.classList.contains('range-value')) {
		setRangeValue(target);
	}
}

function setRangeValues()
{
	var ranges = tracks.querySelectorAll('input[type="range"]');
	ranges.forEach( (range) => { setRangeValue(range); });
}

function setRangeValue(source)
{
	if (source.previousElementSibling) {
		source.previousElementSibling.value = source.value;
	} 
	if (source.nextElementSibling) {
		source.nextElementSibling.value = source.value;
	}
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
    evt.target.closest('.drag-item').setAttribute("draggable", "false");
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
        cleanElement(dragElement);
        if (evt.getModifierState(dragModifierKey) === true) {
            dragElement = cloneElement(dragElement)
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
    switch(action) {
        case 'remove':
            remove(target);
            break;
        case 'insert':
			let newElement = evt.getModifierState(dragModifierKey) == true ? target : archetypeFor(target); 
            setupElement(newElement);
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
	let type = elementType(target)
	if (type && archetypes[type]) {
		return archetypes[type].cloneNode(true);
	}
}

function setupElement(element)
{
	let type = elementType(element);
	if (type == 'track') {
		setupTrack(element);
	} else if (type == 'pattern') {

	} else if (type == 'step') {

	}
}

function setupTrack(track)
{
	midiAssignOutputs(track);
}

function elementType(target) {
    if (!target) { return };
    if (target.matches('.step')) return 'step';
    if (target.matches('.pattern')) return 'pattern'; 
    if (target.matches('.track')) return 'track';
}

function elementClass(target) {
	let type = elementType(target);
	if (type) {
		return '.'+type;
	}
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
    target.before(cloneElement(element));
}

function insertAfter(target, element) {
    target.after(cloneElement(element));
}

function cloneElement(element) {
    return cleanElement(element.cloneNode(true));  
}

function cleanElement(element) {
    element.classList.remove('dragging');
    element.classList.remove('playing');
    element.querySelectorAll('.playing').forEach((child) => {
       child.classList.remove('playing'); 
    });
    return element;
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
    updated.value = timeStamp();
    let stateOffset = getStateOffset();
    if (stateOffset > 0) {
        states = states.slice(stateOffset);
        stateOffset = 0;
    } 
    states.unshift(getState(project));
    window.localStorage.setItem('states', JSON.stringify(states));
    window.localStorage.setItem('stateOffset', stateOffset);
    let undoOffset = (states.length - stateOffset);
    controls.querySelector('[name="stateOffset"]').value = undoOffset;
}

function updateStateButtons()
{
    let stateOffset = getStateOffset();
    undoButton.disabled = ((states.length < 2) || (stateOffset >= (states.length - 1)));
    redoButton.disabled = (stateOffset == 0);
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

function getConfigState(container)
{
    let config = {};
    container.querySelector(':not(.components) .config').querySelectorAll('input, select').forEach(
        (elm) => { 
			if (elm.getAttribute('type') == 'checkbox') {
				if (elm.checked) {
					config[elm.getAttribute('name')] = elm.value;
				} else {
					config[elm.getAttribute('name')] = 0;
				}
			} else {
				config[elm.getAttribute('name')] = elm.value;
			}
        }
    );
    return config;
}


function setState(element, state)
{
    if (!state) { return; }
    setConfigState(element, state.config);
    let {child, children } = element.dataset;
    if (child && children && state[children] && archetypes[child]){
        setChildrenState(element.querySelector('.'+children).querySelectorAll('.'+child), state[children], archetypes[child]);
    }
}

function setChildrenState(children, state, archetype)
{
    for (var idx in state) {
        if (idx > children.length - 1) {
            child = archetype.cloneNode(true);
            children[0].parentNode.appendChild(child);
        } else {
            child = children[idx];
        }
        setState(child, state[idx]);
    }
    trimNodes(children, state.length); 
}

function setConfigState(container, config)
{
    for (var name in config) {
        let elm = container.querySelector(`:not(.components) .config [name="${name}"]`);
		if (!elm) {
			continue;	
		}
        if (elm.getAttribute('type') == 'checkbox') {
            if (elm.value == config[name]) {
                elm.checked = true;
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

function keydown(evt)
{

	// determine focused element
	let element = document.activeElement;
	if (hasClass(element, 'handle')) {
		keydownOnHandle(element, evt);
	} else if (element.nodeName !== 'INPUT' && element.nodeName != 'SELECT' && element.nodeName !== 'BUTTON') {
		if (evt.code == 'Space') {
			controlTogglePlay();
		} else if (evt.code == 'Backspace') {
			controlRewind();
		} else {
			console.log(evt.code, element.nodeName);
		}
	}
	

}

function keydownOnHandle(element, evt)
{
	container = element.closest('.step, .pattern');
	if (container) {
		if (evt.code == 'ArrowUp') {
			moveUp(container, evt.getModifierState(dragModifierKey));
		} else if (evt.code == 'ArrowDown') {
			moveDown(container, evt.getModifierState(dragModifierKey));
		} else if (evt.code == 'Backspace') {
			container.remove();
			updateState();
		} else {
			console.log(evt.code);
		}
	}
}	

function moveUp(element, copy)
{
	let previous = element.previousElementSibling;
	if (copy) {
		let newElement = element.cloneNode(true);
		element.before(newElement);
		newElement.querySelector('.handle').focus();
	} else if (previous && hasClass(previous, elementType(previous))) {
		element.parentNode.removeChild(element);
		previous.before(element);
		element.querySelector('.handle').focus();
	} else {
		let pattern = element.closest('.pattern');
		let previousPattern = pattern.previousElementSibling;
		if (previousPattern) {
			let previousStep = previousPattern.querySelector('.step:last-of-type');
			if (!previousStep) {
				return;
			}
			element.parentNode.removeChild(element);
			previousStep.after(element);
			element.querySelector('.handle').focus();
		}
	}
	updateState();

}

function moveDown(element, copy) 
{
	let next = element.nextElementSibling;
	if (copy) {
		let newElement = element.cloneNode(true);
		element.after(newElement);
		newElement.querySelector('.handle').focus();
	} else if (next && hasClass(next, elementType(next))) {
		element.parentNode.removeChild(element);
		next.after(element);
		element.querySelector('.handle').focus();
	} else {
		let pattern = element.closest('.pattern');
		let nextPattern = pattern.nextElementSibling;
		if (nextPattern) {
			let nextStep = nextPattern.querySelector('.step:first-of-type');
			if (!nextStep) {
				return;
			}
			element.parentNode.removeChild(element);
			nextStep.before(element);
			element.querySelector('.handle').focus();
		}
	}
	updateState();
}

function keyup(evt)
{
}

function midiEnabled()
{
    midiAssignOutputs(project);
}

function midiAssignOutputs(element)
{
    element.querySelectorAll('select[name="output"]').forEach((elm) => {
        WebMidi.outputs.forEach((device,idx) => {
            let option = elm.querySelector('option[value="'+idx+'"]');
            if (!option) {
                option = document.createElement('option');
                option.setAttribute('value',idx);
                elm.appendChild(option);
            }
            option.textContent = device.name;
        });
    });
}

# A Simple? Experimental Performance (MIDI) Sequencer

This is inspired by sequencing in [Eurorack](https://en.wikipedia.org/wiki/Eurorack), and my fondness of the [Becafaco Muxlicer](https://www.befaco.org/muxlicer-2/) for creating quick and simple sequences. I wanted to create something which was similar, but allowed for more complexity of both rhythm and experssion, as well as beign quite playable in it's own right, and being able to add complexity in the length of sequnces, as well as being easily playable and adaptable in real time. 

I've tried to take parts of eurorack sequencers, trackers and more traditional sequencers and munged them together into a javascript bastardisation of a sequencer. It doesn't even do timing properly at this point as it uses the notoriously unreliable setTimeout to set the times between notes, so the measures are imprecise. Howevert this imprecision is partially what I'm lookinf for, something a bit looser - it feels 'close enough for jazz' for my liking at this time, balancing trying out the experiment vs over-enginering a solution.

I'm trying to avoid modality and menu diving in the interface, immediacy and simplicity. Visually it's a nod to early Apple Macintosh and Atari ST design. 

This is very much a work in progress and I'm adapting it and changing it and pushing changes as and when I feel fit and have the energy to experiment. This may not be forward compatible, so if you want or rely on using something created with this I suggest you take a snapshot of the github repo for that version.

It's a MIDI sequencer, it doesn't make noises. If you don't know what this is, go and do research.

## Running

You can play with what ever version of it I currently feel like deploying in a browser at https://onymous.in/sequencer/ - In theory it should work in any Browser that supports Web Midi, but at the moment I've only been able to succesfully user it in Chrome compatible browers (Vivaldi, Chromium)

You can also run it by checking out / cloning this github repo and opening index.html in a Chrome compatible browser.

Or you can run it as a stand-alone Electron app by running

```
npm install
npm start
```

From within the checked out source.

If you don't know how to do this - go do research.

## Usage

Each project can have one or more tracks

Each track can have one or more pattern

Each pattern can have one or more step, each step has a number of properties. Defaults are step duration, relative gate/note length, note value (pitch)

There muse be at least one track / one pattern / one step. 

You should be able to derive what is a track / pattern / step from the visual hiearchy. If you don't understand it then it's probably not for you.

You can get to that state by clicking 'New'

To add a track click the + on the track header. You can also set the track type (currently only note tracks are implemented), the output device (currently midi devices) and channel (1-16)

To add a pattern click the + on the right of the pattern block

To add a step click the + on the right of the step

You can use a modifier key to copy instead of adding. The modifier key is Crtl on Linux/Windows and Option(Alt) on MacOs (in line with how you duplicate when dragging an icon in your window manager...usually)

When you have multiple items (eg steps in a pattern) you can change the order by dragging the 'handle' on the left of the step (or pattern). If you hold down the modifier you can duplicate the step or pattern

You can enable / disable a step or pattern with the checkbox for that pattern / step

Once you have a little sequence you can press the play button at the top of the screen to play the sequence. Press again to pause it.

Rewind moves all tracks back to the begining

the `!` button send an all note off (panic) to all midi devices. Though I've not tested this much, it's theoretical at this time.

The number at the top left if the number of milliseconds for the shortest time interval in the sequencer. The step duration is a multiple of this (between 1 and 20). There's no BPM.

There are undo/redo buttons at the top right, at the moment the number of stored states is limited by when the software crashes. The number between the 

You can save the file to a local JSON file. And load it back in. If you want the JSON file to have a name there is a title field at the middle top fo the screen to name your project. JSON files are always timestamped so you don't need to enter `FINAL version 2 FINAL FINAL
` in here, just a description project name, and you'll ende up with lots of versioned JSON files as you save. 

## Known issues / Thoughts

* Drag and drop of elements is a bit clunky
* It's hard to set a specific value on the range sliders (or know what value you have set)
* Not enough keyboard control 
* When you add a track the outputs are not set up
* Timing can be wonky, this is kind of intentional, but I could maybe make it more accurate.
* The note range could maybe be configured as most synths don't support the full 127 notes range
* Would like to have some modifier tracks, but that maybe starts to move away from the simplicity factor.
* Maybe look at a way of synchronsing tracks somehow


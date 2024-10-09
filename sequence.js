const midi = require('midi');
const easymidi = require('easymidi');

let output = new easymidi.Output(getPortName());
let lastnotetime = Date.now();

let sequence = [
    {
        note: 35,
        duration: 500,
    },
    {
        note: 40,
        duration: 500,
    },
    {
        note: 45,
        duration: 500,
    },
    {
        note: 50,
        duration: 500,
    }
]

let sequence2 = [
    { 
        note: 45,
        duration:750 
    },
    {
        note: 55,
        duration: 750,
    },
]


playStep(sequence, 0, 2);
playStep(sequence2, 0, 3);


function playStep(seq, index, channel)
{
    if (index >= seq.length) {
        index = 0;
    }
    var step = seq[index];
    console.log(step);
    output.send('noteon', {
        note: step.note,
        velocity: 127,
        channel: channel
    });
    setTimeout(() => {
        output.send('noteoff', {
            note: step.note,
            channel: channel
        });
    }, step.duration/2);
    setTimeout(() => {
        playStep(seq, index+1, channel);
    }, step.duration);
}

function processWSSData(data) 
{
    data = JSON.parse(data);
    let note, velocity, channel, other;
    if ((Date.now() - lastnotetime > 50) && (data.ct.indexOf('.') > 0)) {
         [other , channel, note , velocity ] = data.ct.split('.');  
          note = 32 + Math.round(note/4);
          velocity = 64 + Math.round(velocity/4);
          pan = 20 + Math.round(other/3);
          if (data.pf == 'desktop') {
                channel = 2;
          } else {
                channel = 3;
          }
         if (data.st >=300 && data.st < 400) {
            output.send('cc', {
                controller: 2,
                value: 127,
                channel: channel,
            });
         } else {
             output.send('cc', {
                controller: 2,
                value: 0,
                 channel: channel,
            });
         }
         if (data.st >= 400) {
            channel = 4;
            note = note - 16;
         } else if (data.md == 'POST') {
            channel = 7;
         }
         // panning
         output.send('cc', {
             controller: 15,
             value: pan,
             channel: channel
         });
          console.log([channel, note, velocity, pan, data.st],data);
          output.send('noteon', {
               note: note,
               velocity: velocity,
              channel: channel
          });
          setTimeout(() => {
               output.send('noteoff', {
                  note: note,
                  channel: channel
               });
           }, 45);
           lastnotetime = Date.now();
    }
}

function getPortName()
{
    // Set up a new output.
    let midiOutput = new midi.Output();
    // Count the available output ports.
    let portCount = midiOutput.getPortCount();
    let port, portName;
    for (var i =0 ; i < portCount; i++) {
        // Get the name of a specified output port.
		// console.log(midiOutput.getPortName(i));
        if (midiOutput.getPortName(i).match('CVpal')) {
            portName = midiOutput.getPortName(i);
            port = i;
        }
    }
    console.log(portName);
    return portName;
}

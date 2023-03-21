// this implementation is a simplification of the essentia.js demo at
// https://github.com/MTG/essentia.js/tree/master/examples/demos/onsets

import {
  Essentia,
  EssentiaWASM
} from 'essentia.js';
import { PolarFFTWASM } from './polarFFT.module.js';
import { OnsetsWASM } from './onsets.module.js';

const sampleRate = 44100;
const frameSize = 1024;
const hopSize = 512;
const odfs = ["hfc","complex"];
const odfsWeights =  [0.5,0.5];
const sensitivity = 0.65;

console.log("Imports went OK");

self.essentia = null;

self.allowedParams = ['sampleRate', 'frameSize', 'hopSize', 'odfs', 'odfsWeights', 'sensitivity'];
self.params = {}; // changing odfs should require changing odfsWeights (at least length), and viceversa

// global storage for slicing
self.signal = null;
self.polarFrames = null;
self.onsetPositions = null;

try {
    self.essentia = new Essentia(EssentiaWASM.EssentiaWASM);
    console.log('Backend - essentia:' + self.essentia.version + '- http://essentia.upf.edu');
} catch (err) { error(err) }

function computeFFT() {
  console.log("FFS!!FFT");
  self.polarFrames = []; // clear frames from previous computation
  // algo instantiation
  let PolarFFT = new PolarFFTWASM.PolarFFT(frameSize);
  // frame cutting, windowing
  let frames = self.essentia.FrameGenerator(self.signal, frameSize, hopSize);

  for (let i = 0; i < frames.size(); i++) {
    let currentFrame = frames.get(i);
    let windowed = self.essentia.Windowing(currentFrame).frame;
    // PolarFFT
    const polar = PolarFFT.compute(self.essentia.vectorToArray(windowed)); // default: normalized true, size 1024, type 'hann'
    // save polar frames for reuse
    self.polarFrames.push(polar);
  }

  frames.delete();
  PolarFFT.shutdown();
}

function computeOnsets () {
    const alpha = 1 - 0.65;
    const Onsets = new OnsetsWASM.Onsets(alpha, 5, sampleRate / hopSize, 0.02);

    // create ODF matrix to be input to the Onsets algorithm
    const odfMatrix = [];
    for (const func of odfs) {
        const odfArray = self.polarFrames.map( (frame) => {
            return self.essentia.OnsetDetection(
                self.essentia.arrayToVector(self.essentia.vectorToArray(frame.magnitude)),
                self.essentia.arrayToVector(self.essentia.vectorToArray(frame.phase)),
                func, self.params.sampleRate).onsetDetection;
        });
        odfMatrix.push(Float32Array.from(odfArray));
    }

    // console.table(odfMatrix);
    const onsetPositions = Onsets.compute(odfMatrix, odfsWeights).positions;
    Onsets.shutdown();
    // check possibly all zeros onsetPositions
    if (onsetPositions.size() == 0) { return new Float32Array(0) }
    else { return self.essentia.vectorToArray(onsetPositions); }
}

function calculateOnsets(data) {
  self.signal = data.samples;
  console.log("YO, GOT DATA", data);
  const length_of_audio = 1. / data.sampleRate * data.samples.length;
  console.log("LENGTH OF AUDIO!" + length_of_audio);
  computeFFT();
  //computeOnsets()
  let onsetPositions = computeOnsets();
  console.log("YO, ONSETS:" + onsetPositions);
  // const slices = sliceAudio();
  return {audio_len: length_of_audio, onsets: onsetPositions};
}

addEventListener('message', event => {
  postMessage(calculateOnsets(event.data));
});

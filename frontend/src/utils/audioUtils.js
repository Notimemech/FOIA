/**
 * audioUtils.js
 * Helpers for audio recording, format conversion, and multi-blob concatenation.
 */

/**
 * Converts an AudioBuffer to a standard 16-bit PCM WAV Blob.
 */
export function audioBufferToWav(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);  // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16);         // length = 16
  setUint16(1);          // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2);              // block-align
  setUint16(16);                         // 16-bit precision

  setUint32(0x61746164); // "data" chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: 'audio/wav' });
}

/**
 * Concatenates multiple audio Blobs into a single seamless WAV Blob.
 */
export async function mergeAudioBlobs(blobs) {
  const validBlobs = blobs.filter(Boolean);
  if (validBlobs.length === 0) return null;
  if (validBlobs.length === 1) return validBlobs[0];

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    // Fallback: simple Blob concatenation
    return new Blob(validBlobs, { type: 'audio/wav' });
  }

  const audioCtx = new AudioCtx();
  try {
    const audioBuffers = await Promise.all(
      validBlobs.map(async (blob) => {
        const arrayBuffer = await blob.arrayBuffer();
        return await audioCtx.decodeAudioData(arrayBuffer);
      })
    );

    const totalLength = audioBuffers.reduce((acc, b) => acc + b.length, 0);
    const numberOfChannels = audioBuffers[0].numberOfChannels || 1;
    const sampleRate = audioBuffers[0].sampleRate || 44100;

    const mergedBuffer = audioCtx.createBuffer(numberOfChannels, totalLength, sampleRate);

    let currentOffset = 0;
    for (const buffer of audioBuffers) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        mergedBuffer.getChannelData(channel).set(buffer.getChannelData(channel), currentOffset);
      }
      currentOffset += buffer.length;
    }

    return audioBufferToWav(mergedBuffer);
  } catch (err) {
    console.warn('[AudioUtils] AudioContext decode failed, fallback to sequential Blob:', err.message);
    return new Blob(validBlobs, { type: 'audio/wav' });
  } finally {
    if (audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
    }
  }
}

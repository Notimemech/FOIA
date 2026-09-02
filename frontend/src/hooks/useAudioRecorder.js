import { useState, useRef, useEffect } from 'react';

/**
 * Inspects audio file duration asynchronously.
 */
function getAudioFileDuration(file) {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(audio.duration);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(0);
    };
  });
}

/**
 * useAudioRecorder — manages mic recording, timers, and file upload.
 * Encapsulates all stateful audio logic from SpeakingQuestionModal.
 */
export function useAudioRecorder({
  partType,
  mode,
  existingAudioBlob,
  isOpen,
  questionTitle,
  questionText,
  onSpeakQuestion,
}) {
  const [inputMethod, setInputMethod] = useState('record');
  const [examStep, setExamStep] = useState('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(existingAudioBlob);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [reviewSecondsLeft, setReviewSecondsLeft] = useState(30);
  const [prepSecondsLeft, setPrepSecondsLeft] = useState(60);
  const [speakingSecondsLeft, setSpeakingSecondsLeft] = useState(130);
  const [prepNotes, setPrepNotes] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const reviewTimerRef = useRef(null);
  const prepTimerRef = useRef(null);
  const speakingTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setInputMethod('record');
      setUploadedFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setAudioBlob(existingAudioBlob);
      if (existingAudioBlob) {
        setAudioUrl(URL.createObjectURL(existingAudioBlob));
        setExamStep('completed');
      } else {
        setAudioUrl(null);
        setExamStep('idle');
      }
      setIsRecording(false);
      setRecordingDuration(0);
      setReviewSecondsLeft(30);
      setPrepSecondsLeft(60);
      setSpeakingSecondsLeft(130);
      if (mode === 'practice') {
        const timer = setTimeout(() => onSpeakQuestion?.(), 300);
        return () => clearTimeout(timer);
      }
    } else {
      window.speechSynthesis?.cancel();
      stopRecording();
      clearInterval(reviewTimerRef.current);
      clearInterval(prepTimerRef.current);
      clearInterval(speakingTimerRef.current);
      clearInterval(recordingTimerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, questionTitle, questionText, existingAudioBlob]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(reviewTimerRef.current);
      clearInterval(prepTimerRef.current);
      clearInterval(speakingTimerRef.current);
      clearInterval(recordingTimerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      window.speechSynthesis?.cancel();
      clearInterval(reviewTimerRef.current);
      clearInterval(prepTimerRef.current);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
        setUploadedFileName('');
        audioChunksRef.current = [];
        setExamStep('completed');
      };

      mediaRecorderRef.current.start(250);
      setIsRecording(true);
      setExamStep('recording');
      setRecordingDuration(0);

      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      if (partType === 'part2') {
        setSpeakingSecondsLeft(130);
        clearInterval(speakingTimerRef.current);
        speakingTimerRef.current = setInterval(() => {
          setSpeakingSecondsLeft((prev) => {
            if (prev <= 1) {
              clearInterval(speakingTimerRef.current);
              stopRecording();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Unable to access microphone. Please allow microphone permissions in your browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      clearInterval(speakingTimerRef.current);
      mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
    }
  };

  const startPart1Exam = () => {
    setExamStep('reviewing');
    setReviewSecondsLeft(30);
    onSpeakQuestion?.();
    clearInterval(reviewTimerRef.current);
    reviewTimerRef.current = setInterval(() => {
      setReviewSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(reviewTimerRef.current);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startPart2Prep = () => {
    setExamStep('prepping');
    setPrepSecondsLeft(60);
    onSpeakQuestion?.();
    clearInterval(prepTimerRef.current);
    prepTimerRef.current = setInterval(() => {
      setPrepSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(prepTimerRef.current);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleImmediateSpeak = () => {
    clearInterval(reviewTimerRef.current);
    clearInterval(prepTimerRef.current);
    startRecording();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|webm|ogg|aac)$/i)) {
      alert('Please select a valid audio file (MP3, WAV, M4A, WEBM, OGG).');
      return;
    }
    if (partType === 'part2') {
      const duration = await getAudioFileDuration(file);
      if (duration > 135) {
        const m = Math.floor(duration / 60);
        const s = Math.floor(duration % 60);
        alert(`Part 2 audio file exceeds the maximum limit of 2 minutes 15 seconds (Current file: ${m}m ${s}s). Please upload a shorter audio file.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }
    setUploadedFileName(file.name);
    setAudioBlob(file);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setExamStep('completed');
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return {
    inputMethod, setInputMethod,
    examStep,
    isRecording,
    recordingDuration,
    audioBlob, setAudioBlob,
    audioUrl, setAudioUrl,
    uploadedFileName,
    reviewSecondsLeft,
    prepSecondsLeft,
    speakingSecondsLeft,
    prepNotes, setPrepNotes,
    fileInputRef,
    startRecording,
    stopRecording,
    startPart1Exam,
    startPart2Prep,
    handleImmediateSpeak,
    handleFileUpload,
    formatTimer,
  };
}

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Voice {
  id: string;
  name: string;
  gender: 'male' | 'female';
  language: 'ru' | 'en';
  description: string;
}

interface Project {
  id: string;
  name: string;
  text: string;
  voice: string;
  timestamp: string;
}

const russianVoices: Voice[] = [
  { id: 'ru-1', name: 'Александр', gender: 'male', language: 'ru', description: 'Уверенный мужской голос' },
  { id: 'ru-2', name: 'Дмитрий', gender: 'male', language: 'ru', description: 'Глубокий бархатный тембр' },
  { id: 'ru-3', name: 'Михаил', gender: 'male', language: 'ru', description: 'Энергичный и динамичный' },
  { id: 'ru-4', name: 'Николай', gender: 'male', language: 'ru', description: 'Спокойный и размеренный' },
  { id: 'ru-5', name: 'Сергей', gender: 'male', language: 'ru', description: 'Теплый дружелюбный голос' },
  { id: 'ru-6', name: 'Анастасия', gender: 'female', language: 'ru', description: 'Мягкий женский голос' },
  { id: 'ru-7', name: 'Екатерина', gender: 'female', language: 'ru', description: 'Профессиональный и четкий' },
  { id: 'ru-8', name: 'Мария', gender: 'female', language: 'ru', description: 'Нежный и приятный' },
  { id: 'ru-9', name: 'Ольга', gender: 'female', language: 'ru', description: 'Выразительный и яркий' },
  { id: 'ru-10', name: 'Юлия', gender: 'female', language: 'ru', description: 'Молодой живой голос' },
];

const englishVoices: Voice[] = [
  { id: 'en-1', name: 'James', gender: 'male', language: 'en', description: 'Authoritative British voice' },
  { id: 'en-2', name: 'Michael', gender: 'male', language: 'en', description: 'Warm American voice' },
  { id: 'en-3', name: 'William', gender: 'male', language: 'en', description: 'Professional narrator' },
  { id: 'en-4', name: 'David', gender: 'male', language: 'en', description: 'Deep resonant tone' },
  { id: 'en-5', name: 'Robert', gender: 'male', language: 'en', description: 'Friendly conversational' },
  { id: 'en-6', name: 'Emma', gender: 'female', language: 'en', description: 'Clear British accent' },
  { id: 'en-7', name: 'Olivia', gender: 'female', language: 'en', description: 'Soft American voice' },
  { id: 'en-8', name: 'Sophia', gender: 'female', language: 'en', description: 'Professional presenter' },
  { id: 'en-9', name: 'Charlotte', gender: 'female', language: 'en', description: 'Energetic and bright' },
  { id: 'en-10', name: 'Isabella', gender: 'female', language: 'en', description: 'Elegant and refined' },
];

const emotions = [
  { id: 'neutral', label: 'Нейтрально', icon: 'Minus' },
  { id: 'joy', label: 'Радость', icon: 'Smile' },
  { id: 'sadness', label: 'Грусть', icon: 'Frown' },
  { id: 'laughter', label: 'Смех', icon: 'Laugh' },
  { id: 'humor', label: 'Юмор', icon: 'PartyPopper' },
  { id: 'anger', label: 'Гнев', icon: 'Angry' },
  { id: 'fear', label: 'Страх', icon: 'Ghost' },
  { id: 'surprise', label: 'Удивление', icon: 'Sparkles' },
];

export default function Index() {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<string>('ru-1');
  const [speed, setSpeed] = useState([1.0]);
  const [pitch, setPitch] = useState([1.0]);
  const [intonation, setIntonation] = useState([1.0]);
  const [volume, setVolume] = useState([0.8]);
  const [selectedEmotion, setSelectedEmotion] = useState('neutral');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'Демо озвучка',
      text: 'Привет! Это демонстрация синтезатора речи.',
      voice: 'ru-1',
      timestamp: new Date().toLocaleString('ru-RU'),
    },
  ]);

  const allVoices = [...russianVoices, ...englishVoices];
  const currentVoice = allVoices.find((v) => v.id === selectedVoice);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 2048;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!isPlaying) return;
        
        analyser.getByteTimeDomainData(dataArray);
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;

        canvasCtx.fillStyle = 'rgb(26, 31, 44)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(155, 135, 245)';
        canvasCtx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            canvasCtx.moveTo(x, y);
          } else {
            canvasCtx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();

        requestAnimationFrame(draw);
      };

      draw();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };

      mediaRecorder.start();
    } catch (error) {
      console.error('Recording error:', error);
    }
  };

  const handleSynthesis = () => {
    if (!text.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите текст для озвучки',
        variant: 'destructive',
      });
      return;
    }

    if (!window.speechSynthesis) {
      toast({
        title: 'Ошибка',
        description: 'Ваш браузер не поддерживает синтез речи',
        variant: 'destructive',
      });
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsPlaying(false);
      setProgress(0);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    const voices = window.speechSynthesis.getVoices();
    const selectedLang = currentVoice?.language === 'ru' ? 'ru-RU' : 'en-US';
    const voice = voices.find((v) => v.lang.startsWith(selectedLang));
    
    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = selectedLang;
    utterance.rate = speed[0];
    utterance.pitch = pitch[0];
    utterance.volume = volume[0];

    const estimatedDuration = (text.length / 10) * (1 / speed[0]);
    setDuration(estimatedDuration);
    setProgress(0);

    utterance.onstart = () => {
      setIsPlaying(true);
      startRecording();
      toast({
        title: 'Воспроизведение',
        description: `Озвучиваю голосом ${currentVoice?.name}`,
      });
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setProgress(100);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setProgress(0);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      toast({
        title: 'Ошибка',
        description: 'Не удалось воспроизвести озвучку',
        variant: 'destructive',
      });
    };

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + (100 / (estimatedDuration * 10));
      });
    }, 100);

    window.speechSynthesis.speak(utterance);
  };

  const handleSaveProject = () => {
    if (!text.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Нет текста для сохранения',
        variant: 'destructive',
      });
      return;
    }

    const newProject: Project = {
      id: Date.now().toString(),
      name: `Проект ${projects.length + 1}`,
      text: text,
      voice: selectedVoice,
      timestamp: new Date().toLocaleString('ru-RU'),
    };

    setProjects([newProject, ...projects]);
    toast({
      title: 'Сохранено',
      description: 'Проект успешно сохранен',
    });
  };

  const handleLoadProject = (project: Project) => {
    setText(project.text);
    setSelectedVoice(project.voice);
    toast({
      title: 'Загружено',
      description: `Проект "${project.name}" загружен`,
    });
  };

  const handleDownload = async () => {
    if (!audioBlob) {
      toast({
        title: 'Ошибка',
        description: 'Сначала воспроизведите озвучку для создания аудио',
        variant: 'destructive',
      });
      return;
    }

    let blobToDownload = audioBlob;

    if (isEditMode && (trimStart > 0 || trimEnd < 100)) {
      try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const startTime = (trimStart / 100) * audioBuffer.duration;
        const endTime = (trimEnd / 100) * audioBuffer.duration;
        const newLength = Math.floor((endTime - startTime) * audioBuffer.sampleRate);
        
        const newBuffer = audioContext.createBuffer(
          audioBuffer.numberOfChannels,
          newLength,
          audioBuffer.sampleRate
        );
        
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          const oldData = audioBuffer.getChannelData(channel);
          const newData = newBuffer.getChannelData(channel);
          const startSample = Math.floor(startTime * audioBuffer.sampleRate);
          
          for (let i = 0; i < newLength; i++) {
            newData[i] = oldData[startSample + i];
          }
        }
        
        const offlineContext = new OfflineAudioContext(
          newBuffer.numberOfChannels,
          newBuffer.length,
          newBuffer.sampleRate
        );
        
        const source = offlineContext.createBufferSource();
        source.buffer = newBuffer;
        source.connect(offlineContext.destination);
        source.start();
        
        const renderedBuffer = await offlineContext.startRendering();
        
        const wav = audioBufferToWav(renderedBuffer);
        blobToDownload = new Blob([wav], { type: 'audio/wav' });
        
        toast({
          title: 'Обработка завершена',
          description: 'Аудио обрезано согласно настройкам',
        });
      } catch (error) {
        console.error('Trim error:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось обрезать аудио, скачивается оригинал',
          variant: 'destructive',
        });
      }
    }

    const url = URL.createObjectURL(blobToDownload);
    const a = document.createElement('a');
    a.href = url;
    a.download = `озвучка-${currentVoice?.name}-${Date.now()}.${isEditMode ? 'wav' : 'webm'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Скачано',
      description: 'Аудио файл успешно загружен',
    });
  };

  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;

    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };

    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(buffer.numberOfChannels);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels);
    setUint16(buffer.numberOfChannels * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(length - pos - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return arrayBuffer;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">🎙️ Синтезатор Речи</h1>
            <p className="text-muted-foreground">Профессиональная озвучка текста с эмоциями</p>
          </div>
          <Button onClick={handleSaveProject} variant="outline" size="lg">
            <Icon name="Save" className="mr-2 h-5 w-5" />
            Сохранить проект
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 bg-card border-border">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Редактор текста</h2>
                  <Badge variant="secondary">{text.length} символов</Badge>
                </div>
                <Textarea
                  placeholder="Введите текст для озвучки..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[200px] resize-none bg-background border-border text-foreground text-lg font-['Roboto']"
                />
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <h2 className="text-xl font-semibold mb-4">Настройки голоса</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Icon name="Gauge" className="h-4 w-4 text-primary" />
                      Скорость
                    </label>
                    <span className="text-sm text-muted-foreground">{speed[0].toFixed(1)}x</span>
                  </div>
                  <Slider
                    value={speed}
                    onValueChange={setSpeed}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Icon name="Music" className="h-4 w-4 text-primary" />
                      Тон
                    </label>
                    <span className="text-sm text-muted-foreground">{pitch[0].toFixed(1)}x</span>
                  </div>
                  <Slider
                    value={pitch}
                    onValueChange={setPitch}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Icon name="Activity" className="h-4 w-4 text-primary" />
                      Интонация
                    </label>
                    <span className="text-sm text-muted-foreground">{intonation[0].toFixed(1)}x</span>
                  </div>
                  <Slider
                    value={intonation}
                    onValueChange={setIntonation}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Icon name="Volume2" className="h-4 w-4 text-primary" />
                      Громкость
                    </label>
                    <span className="text-sm text-muted-foreground">{Math.round(volume[0] * 100)}%</span>
                  </div>
                  <Slider
                    value={volume}
                    onValueChange={setVolume}
                    min={0}
                    max={1}
                    step={0.1}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <h2 className="text-xl font-semibold mb-4">Эмоциональная окраска</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {emotions.map((emotion) => (
                  <Button
                    key={emotion.id}
                    variant={selectedEmotion === emotion.id ? 'default' : 'outline'}
                    className="h-auto py-4 flex flex-col gap-2"
                    onClick={() => setSelectedEmotion(emotion.id)}
                  >
                    <Icon name={emotion.icon as any} className="h-6 w-6" />
                    <span className="text-sm">{emotion.label}</span>
                  </Button>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Аудиоплеер</h2>
                  <div className="flex gap-2">
                    {audioBlob && (
                      <Button onClick={() => setAudioBlob(null)} variant="outline" size="sm">
                        <Icon name="Trash2" className="mr-2 h-4 w-4" />
                        Очистить
                      </Button>
                    )}
                    <Button onClick={handleDownload} variant="outline" size="sm">
                      <Icon name="Download" className="mr-2 h-4 w-4" />
                      Скачать
                    </Button>
                  </div>
                </div>

                <div className="bg-background rounded-lg p-6 border border-border space-y-4">
                  <div className="flex items-center gap-4">
                    <Button
                      size="lg"
                      onClick={handleSynthesis}
                      className="rounded-full w-16 h-16"
                    >
                      <Icon name={isPlaying ? 'Square' : 'Play'} className="h-6 w-6" />
                    </Button>
                    <div className="flex-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-primary transition-all duration-300 ${
                            isPlaying ? 'animate-pulse' : ''
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>{Math.floor((progress / 100) * duration)}с</span>
                        <span>{Math.floor(duration)}с</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative w-full h-24 bg-card rounded-lg overflow-hidden border border-border">
                    <canvas
                      ref={canvasRef}
                      width={800}
                      height={96}
                      className="w-full h-full"
                    />
                    {!isPlaying && !audioBlob && (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                        <Icon name="AudioWaveform" className="mr-2 h-5 w-5" />
                        Волновая форма появится при воспроизведении
                      </div>
                    )}
                  </div>

                  {currentVoice && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon name="Mic" className="h-4 w-4" />
                      <span>
                        {currentVoice.name} • {currentVoice.language.toUpperCase()} • {currentVoice.description}
                      </span>
                    </div>
                  )}

                  {audioBlob && (
                    <div className="pt-4 border-t border-border space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Редактирование аудио</h3>
                        <Button
                          variant={isEditMode ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setIsEditMode(!isEditMode);
                            if (!isEditMode) {
                              setTrimStart(0);
                              setTrimEnd(100);
                            }
                          }}
                        >
                          <Icon name={isEditMode ? 'Check' : 'Scissors'} className="mr-2 h-4 w-4" />
                          {isEditMode ? 'Применить' : 'Обрезать'}
                        </Button>
                      </div>

                      {isEditMode && (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-muted-foreground">
                                Начало обрезки
                              </label>
                              <span className="text-xs text-muted-foreground">{trimStart}%</span>
                            </div>
                            <Slider
                              value={[trimStart]}
                              onValueChange={(val) => setTrimStart(Math.min(val[0], trimEnd - 1))}
                              min={0}
                              max={99}
                              step={1}
                              className="cursor-pointer"
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-muted-foreground">
                                Конец обрезки
                              </label>
                              <span className="text-xs text-muted-foreground">{trimEnd}%</span>
                            </div>
                            <Slider
                              value={[trimEnd]}
                              onValueChange={(val) => setTrimEnd(Math.max(val[0], trimStart + 1))}
                              min={1}
                              max={100}
                              step={1}
                              className="cursor-pointer"
                            />
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Icon name="Info" className="h-3 w-3" />
                            <span>
                              Длительность после обрезки: {Math.floor(duration * (trimEnd - trimStart) / 100)}с
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-card border-border">
              <h2 className="text-xl font-semibold mb-4">Выбор голоса</h2>
              <Tabs defaultValue="ru" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="ru">Русские</TabsTrigger>
                  <TabsTrigger value="en">Английские</TabsTrigger>
                </TabsList>

                <TabsContent value="ru">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                      {russianVoices.map((voice) => (
                        <button
                          key={voice.id}
                          onClick={() => setSelectedVoice(voice.id)}
                          className={`w-full text-left p-4 rounded-lg border transition-all ${
                            selectedVoice === voice.id
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background hover:bg-muted border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">{voice.name}</span>
                            <Badge variant={voice.gender === 'male' ? 'secondary' : 'outline'}>
                              {voice.gender === 'male' ? '♂' : '♀'}
                            </Badge>
                          </div>
                          <p className={`text-sm ${selectedVoice === voice.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                            {voice.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="en">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                      {englishVoices.map((voice) => (
                        <button
                          key={voice.id}
                          onClick={() => setSelectedVoice(voice.id)}
                          className={`w-full text-left p-4 rounded-lg border transition-all ${
                            selectedVoice === voice.id
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background hover:bg-muted border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">{voice.name}</span>
                            <Badge variant={voice.gender === 'male' ? 'secondary' : 'outline'}>
                              {voice.gender === 'male' ? '♂' : '♀'}
                            </Badge>
                          </div>
                          <p className={`text-sm ${selectedVoice === voice.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                            {voice.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </Card>

            <Card className="p-6 bg-card border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">История проектов</h2>
                <Badge variant="secondary">{projects.length}</Badge>
              </div>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleLoadProject(project)}
                      className="w-full text-left p-4 rounded-lg bg-background hover:bg-muted border border-border transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-semibold text-foreground">{project.name}</span>
                        <Icon name="FolderOpen" className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{project.text}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Icon name="Clock" className="h-3 w-3" />
                        <span>{project.timestamp}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
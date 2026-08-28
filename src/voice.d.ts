declare module 'react-native-voice' {
  export interface SpeechResults {
    value?: string[];
    error?: string;
  }
  export interface SpeechError {
    message: string;
  }
  export function start(language: string): Promise<void>;
  export function stop(): Promise<void>;
  export function destroy(): Promise<void>;
  export function isSpeechRecognitionAvailable(): Promise<boolean>;
  export function removeListener(eventName: string, callback: Function): void;
  export function onSpeechResults(callback: (e: SpeechResults) => void): void;
  export function onSpeechError(callback: (e: SpeechError) => void): void;
  export function onSpeechStart(callback: () => void): void;
  export function onSpeechEnd(callback: () => void): void;
}
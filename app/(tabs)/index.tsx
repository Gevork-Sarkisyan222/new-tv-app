// src/screens/PlayerScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Video, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

type PlayerStatus = 'idle' | 'playing' | 'paused' | 'stopped';

const MEDIA_DIR = FileSystem.documentDirectory + 'media/';
const isImageFile = (name: string) => /\.(png|jpe?g|gif)$/i.test(name);

const formatUptime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const PlayerScreen: React.FC = () => {
  const videoRef = useRef<Video | null>(null);

  const [videoUri, setVideoUri] = useState<string | null>(null);

  // дефолтная картинка, чтобы экран не был пустым
  // const [imageUri, setImageUri] = useState<string | null>(
  //   'https://images.pexels.com/photos/4774774/pexels-photo-4774774.jpeg', // null
  // );
  const [imageUri, setImageUri] = useState<string | null>(
    null, // null
  );
  const [isImageMode, setIsImageMode] = useState(false); // false or false lave false

  const [nowPlaying, setNowPlaying] = useState<string | null>(null);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>('idle');
  const [volume, setVolumeState] = useState<number>(50);
  const [lastCommand, setLastCommand] = useState<string>('—');
  const [uptime, setUptime] = useState<number>(0);

  // uptime (может пригодиться для MQTT, даже если не показываем)
  useEffect(() => {
    const timer = setInterval(() => setUptime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // ================= МЕТОДЫ ПЛЕЕРА =================

  const playMedia = async (media: string) => {
    setLastCommand(`play:${media}`);
    const uri = MEDIA_DIR + media;

    if (isImageFile(media)) {
      // показываем картинку, видео гасим
      setIsImageMode(true);
      setImageUri(uri);
      setVideoUri(null);
      setNowPlaying(media);
      setPlayerStatus('playing');

      if (videoRef.current) {
        try {
          await videoRef.current.stopAsync();
        } catch (e) {
          console.warn('stop before image', e);
        }
      }
      return;
    }

    // видео поверх, картинку убираем
    setIsImageMode(false);
    setImageUri(null);
    setVideoUri(uri);
    setNowPlaying(media);
    setPlayerStatus('playing');
  };

  const pauseVideo = async () => {
    setLastCommand('pause');
    if (!videoRef.current) return;
    try {
      await videoRef.current.pauseAsync();
      setPlayerStatus('paused');
    } catch (e) {
      console.warn('pause error', e);
    }
  };

  const stopVideo = async () => {
    setLastCommand('stop');
    if (videoRef.current) {
      try {
        await videoRef.current.stopAsync();
      } catch (e) {
        console.warn('stop error', e);
      }
    }
    setPlayerStatus('stopped');
    setNowPlaying(null);
    setVideoUri(null);
    setImageUri(null);
    setIsImageMode(false);
  };

  const setVolumeLevel = async (value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setLastCommand(`volume:${clamped}`);
    setVolumeState(clamped);

    if (videoRef.current) {
      try {
        await videoRef.current.setStatusAsync({ volume: clamped / 100 });
      } catch (e) {
        console.warn('set volume error', e);
      }
    }
  };

  const getVolumeLevel = () => volume;

  const seekTo = async (seconds: number) => {
    setLastCommand(`seek:${seconds}`);
    if (!videoRef.current || !videoUri) {
      await stopVideo();
      return;
    }
    try {
      await videoRef.current.setPositionAsync(seconds * 1000);
      setPlayerStatus('playing');
      await videoRef.current.playAsync();
    } catch (e) {
      console.warn('seek error', e);
    }
  };

  // ===обработчики Video =================

  const handleVideoLoad = async () => {
    if (playerStatus === 'playing' && videoRef.current) {
      try {
        await videoRef.current.setStatusAsync({ volume: volume / 100 });
        await videoRef.current.playAsync();
      } catch (e) {
        console.warn('play on load', e);
      }
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!('isLoaded' in status) || !status.isLoaded) return;

    if (status.didJustFinish) {
      setPlayerStatus('stopped');
      setNowPlaying(null);
      setVideoUri(null);
    } else if (status.isPlaying) {
      setPlayerStatus('playing');
    }
  };

  return (
    <View style={styles.container}>
      {isImageMode && imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.media} resizeMode="cover" />
      ) : (
        <Video
          ref={videoRef}
          style={styles.media}
          source={videoUri ? { uri: videoUri } : undefined}
          resizeMode="cover" // видео на весь
          onLoad={handleVideoLoad}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          isLooping={false}
        />
      )}
    </View>
  );
};

export default PlayerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  media: {
    ...StyleSheet.absoluteFillObject,
  },
});

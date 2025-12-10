// src/screens/PlayerScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
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
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isImageMode, setIsImageMode] = useState(false);

  const [nowPlaying, setNowPlaying] = useState<string | null>(null);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>('idle');
  const [volume, setVolumeState] = useState<number>(50);
  const [lastCommand, setLastCommand] = useState<string>('—');
  const [uptime, setUptime] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => setUptime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const player = useVideoPlayer(null, (player) => {
    player.loop = false;
    player.volume = volume / 100;
  });

  useEffect(() => {
    player.volume = volume / 100;
  }, [player, volume]);

  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    setPlayerStatus(isPlaying ? 'playing' : 'paused');
  });

  // слушаем окончание видео
  useEventListener(player, 'playToEnd', () => {
    setPlayerStatus('stopped');
    setNowPlaying(null);
  });

  // ================= МЕТОДЫ ПЛЕЕРА =================

  const playMedia = (media: string) => {
    setLastCommand(`play:${media}`);

    // если это внешний URL — не добавляем MEDIA_DIR
    const isRemote = media.startsWith('http://') || media.startsWith('https://');
    const uri = isRemote ? media : MEDIA_DIR + media;

    // если это картинка — показываем её, видео глушим
    if (isImageFile(media)) {
      setIsImageMode(true);
      setImageUri(uri);
      setNowPlaying(media);
      setPlayerStatus('playing');

      player.pause();
      player.currentTime = 0;
      return;
    }

    setIsImageMode(false);
    setImageUri(null);
    setNowPlaying(media);
    setPlayerStatus('playing');

    player.replace(uri);
    player.play();
  };

  const pauseVideo = async () => {
    setLastCommand('pause');
    player.pause();
    setPlayerStatus('paused');
  };

  const stopVideo = async () => {
    setLastCommand('stop');

    player.pause();
    player.currentTime = 0;

    setPlayerStatus('stopped');
    setNowPlaying(null);
    setIsImageMode(false);
    setImageUri(null);
  };

  const setVolumeLevel = async (value: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    setLastCommand(`volume:${clamped}`);
    setVolumeState(clamped);
    player.volume = clamped / 100;
  };

  const getVolumeLevel = () => volume;

  const seekTo = async (seconds: number) => {
    setLastCommand(`seek:${seconds}`);

    if (!player || player.duration <= 0) {
      await stopVideo();
      return;
    }

    player.currentTime = seconds;
    player.play();
    setPlayerStatus('playing');
  };

  // useEffect(() => {
  //   player.replace('https://www.w3schools.com/html/mov_bbb.mp4');
  //   player.play();
  // }, []);

  return (
    <View style={styles.container}>
      {isImageMode && imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.media} resizeMode="cover" />
      ) : (
        <VideoView player={player} style={styles.media} contentFit="cover" nativeControls={false} />
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

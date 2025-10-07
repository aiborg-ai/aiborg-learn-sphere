import { useState, useRef, useCallback } from 'react';
import type { VideoPlayerState } from './types';

export function useVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    playbackSpeed: 1,
    showControls: true,
    watchedPercentage: 0,
    lastSavedProgress: 0,
  });

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (state.isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  }, [state.isPlaying]);

  const handlePause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const handleSeek = useCallback(
    (value: number[]) => {
      if (videoRef.current && state.duration) {
        const newTime = (value[0] / 100) * state.duration;
        videoRef.current.currentTime = newTime;
        setState(prev => ({ ...prev, currentTime: newTime }));
      }
    },
    [state.duration]
  );

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0] / 100;
    setState(prev => ({ ...prev, volume: newVolume, isMuted: newVolume === 0 }));
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  }, []);

  const handleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !state.isMuted;
      videoRef.current.muted = newMuted;
      setState(prev => ({ ...prev, isMuted: newMuted }));
    }
  }, [state.isMuted]);

  const handleSpeedChange = useCallback((speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setState(prev => ({ ...prev, playbackSpeed: speed }));
    }
  }, []);

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setState(prev => ({ ...prev, isFullscreen: true }));
    } else {
      document.exitFullscreen();
      setState(prev => ({ ...prev, isFullscreen: false }));
    }
  }, []);

  const skipForward = useCallback(() => {
    if (videoRef.current && state.duration) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, state.duration);
    }
  }, [state.duration]);

  const skipBackward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      const progress = (currentTime / duration) * 100;
      setState(prev => ({
        ...prev,
        currentTime,
        watchedPercentage: Math.max(prev.watchedPercentage, progress),
      }));
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setState(prev => ({ ...prev, duration: videoRef.current!.duration }));
    }
  }, []);

  const setShowControls = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showControls: show }));
  }, []);

  const setWatchedPercentage = useCallback((percentage: number) => {
    setState(prev => ({ ...prev, watchedPercentage: percentage }));
  }, []);

  const setLastSavedProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, lastSavedProgress: progress }));
  }, []);

  const setCurrentTime = useCallback((time: number) => {
    setState(prev => ({ ...prev, currentTime: time }));
  }, []);

  return {
    videoRef,
    containerRef,
    progressBarRef,
    state,
    handlePlayPause,
    handlePause,
    handleSeek,
    handleVolumeChange,
    handleMute,
    handleSpeedChange,
    handleFullscreen,
    skipForward,
    skipBackward,
    handleTimeUpdate,
    handleLoadedMetadata,
    setShowControls,
    setWatchedPercentage,
    setLastSavedProgress,
    setCurrentTime,
  };
}

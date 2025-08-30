'use client'

import { useState, useRef, useEffect } from 'react'

interface AudioPlayerProps {
  signedUrl: string
  filename: string
}

export default function AudioPlayer({ signedUrl, filename }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio(signedUrl)
    audioRef.current = audio

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleError = () => {
      setIsLoading(false)
      console.error('Audio loading error')
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    setIsLoading(true)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.pause()
      audio.src = ''
    }
  }, [signedUrl])

  const togglePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch(console.error)
      setIsPlaying(true)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return

    const newTime = parseFloat(e.target.value)
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
        <div className="animate-pulse w-8 h-8 bg-gray-300 rounded"></div>
        <div className="animate-pulse h-2 bg-gray-300 rounded flex-1"></div>
      </div>
    )
  }

  return (
    <div className="p-3 bg-gray-50 rounded-lg border">
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={togglePlayPause}
          disabled={!duration}
          className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 min-w-[35px]">
              {formatTime(currentTime)}
            </span>
            
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              disabled={!duration}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed
                [&::-webkit-slider-thumb]:appearance-none 
                [&::-webkit-slider-thumb]:w-4 
                [&::-webkit-slider-thumb]:h-4 
                [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:bg-blue-500 
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-md
                [&::-moz-range-thumb]:w-4 
                [&::-moz-range-thumb]:h-4 
                [&::-moz-range-thumb]:rounded-full 
                [&::-moz-range-thumb]:bg-blue-500 
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:border-none"
            />
            
            <span className="text-xs text-gray-500 min-w-[35px]">
              {formatTime(duration)}
            </span>
          </div>
          
          <div className="text-xs text-gray-600 mt-1 truncate">
            {filename}
          </div>
        </div>
      </div>
      
      {/* Progress bar visual */}
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div 
          className="bg-blue-500 h-1 rounded-full transition-all duration-100" 
          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
        ></div>
      </div>
    </div>
  )
}

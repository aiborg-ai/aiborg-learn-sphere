import React from 'react';

interface VideoTranscriptProps {
  transcript?: string;
}

export function VideoTranscript({ transcript }: VideoTranscriptProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-white font-medium mb-3">Transcript</h3>
      {transcript ? (
        <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{transcript}</p>
      ) : (
        <p className="text-white/60 text-sm">No transcript available</p>
      )}
    </div>
  );
}

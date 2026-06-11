-- Video hosting via YouTube (public/unlisted). Mux column kept nullable for a
-- future signed-playback migration without touching the documentaries abstraction.
ALTER TABLE documentaries
  ADD COLUMN IF NOT EXISTS youtube_video_id text;

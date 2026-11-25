export const getYouTubeVideoId = (url) => {
  if (!url) return '';

  try {
    const urlObj = new URL(url);

    if (urlObj.hostname.includes('youtube.com')) {
      if (urlObj.pathname.startsWith('/embed/')) {
        return urlObj.pathname.split('/embed/')[1]?.split('/')[0] || '';
      }
      if (urlObj.pathname.startsWith('/shorts/')) {
        return urlObj.pathname.split('/shorts/')[1]?.split('/')[0] || '';
      }
      return urlObj.searchParams.get('v') || '';
    }

    if (urlObj.hostname.includes('youtu.be')) {
      return urlObj.pathname.slice(1).split('/')[0] || '';
    }
  } catch {
    return '';
  }

  return '';
};

export const getYouTubeEmbedUrl = (url) => {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

export const isDemoPlaceholderVideo = (url) => {
  const videoId = getYouTubeVideoId(url);
  return Boolean(videoId && videoId.toLowerCase().startsWith('placeholder'));
};

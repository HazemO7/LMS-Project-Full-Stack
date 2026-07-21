export const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    
    let videoId = '';
    try {
        const urlObj = new URL(url);
        
        if (urlObj.hostname.includes('youtube.com')) {
            // e.g. https://www.youtube.com/watch?v=VIDEO_ID
            videoId = urlObj.searchParams.get('v');
        } else if (urlObj.hostname.includes('youtu.be')) {
            // e.g. https://youtu.be/VIDEO_ID
            videoId = urlObj.pathname.slice(1);
        }
    } catch (e) {
        // Invalid URL format
        return null;
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

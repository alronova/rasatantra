function firstPlayableLink(links) {
  return [...(links?.vocal || []), ...(links?.instrumental || [])][0] || '';
}

function toEmbedUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '');
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }
  } catch {
    return '';
  }
  return '';
}

export default function RagaCard({ recommendation, index }) {
  const firstLink = firstPlayableLink(recommendation.youtube_links);
  const embedUrl = toEmbedUrl(firstLink);

  return (
    <article className="raga-card">
      <div className="raga-card-main">
        <div className="raga-rank">{index + 1}</div>
        <div>
          <h3>{recommendation.raga_name}</h3>
          <div className="raga-tags">
            <span>{recommendation.bhava_match_type}</span>
            <span>score {recommendation.score.toFixed(3)}</span>
            <span>target {recommendation.target_bhava}</span>
          </div>
        </div>
      </div>

      <div className="score-line">
        <span>Bhava {recommendation.bhava_score}</span>
        <span>Prahara {recommendation.prahara_score}</span>
        <span>Ritu {recommendation.ritu_score}</span>
      </div>

      {embedUrl ? (
        <div className="video-frame">
          <iframe
            src={embedUrl}
            title={`${recommendation.raga_name} performance`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null}

      <div className="link-list">
        {[...(recommendation.youtube_links?.vocal || []), ...(recommendation.youtube_links?.instrumental || [])]
          .slice(0, 4)
          .map((link) => (
            <a href={link} target="_blank" rel="noreferrer" key={link}>
              YouTube
            </a>
          ))}
      </div>
    </article>
  );
}


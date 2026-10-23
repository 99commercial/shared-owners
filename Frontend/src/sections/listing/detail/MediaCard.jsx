import { ExternalLink, PlayCircle } from 'lucide-react';
import { videoEmbedUrl } from '../../../utils/listing';
import DetailCard from './DetailCard';

const isHttps = (url) => typeof url === 'string' && /^https:\/\//i.test(url);

/** Video and 360° tour; renders nothing when neither is set */
export default function MediaCard({ videoProvider, videoUrl, virtualTourUrl, virtualTourSupplier, walklyTourUrl }) {
  const video = videoEmbedUrl(videoProvider, videoUrl);
  const tour = isHttps(virtualTourUrl) ? virtualTourUrl : null;
  const walkly = isHttps(walklyTourUrl) ? walklyTourUrl : null;
  if (!video && !tour && !walkly) return null;

  return (
    <DetailCard title="Video & virtual tour" icon={PlayCircle} id="tour">
      <div className="space-y-5">
        {video && (
          <div className="aspect-video rounded-xl overflow-hidden bg-black">
            <iframe src={video} title="Property video" className="w-full h-full" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen loading="lazy" />
          </div>
        )}
        {tour && (
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-sm font-bold text-ink">360° virtual tour{virtualTourSupplier ? <span className="font-normal text-gray-500"> · {virtualTourSupplier}</span> : null}</p>
              <a href={tour} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">Open full screen <ExternalLink className="w-3.5 h-3.5" /></a>
            </div>
            <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
              <iframe src={tour} title="Virtual tour" className="w-full h-full" allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer" allowFullScreen loading="lazy" sandbox="allow-scripts allow-same-origin allow-popups" />
            </div>
          </div>
        )}
        {walkly && (
          <a href={walkly} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4 hover:border-brand-300">
            <span>
              <span className="block text-sm font-bold text-ink">Neighbourhood walk-through</span>
              <span className="block text-xs text-gray-500">See the local area and nearby amenities</span>
            </span>
            <ExternalLink className="w-4 h-4 text-brand-600" />
          </a>
        )}
      </div>
    </DetailCard>
  );
}

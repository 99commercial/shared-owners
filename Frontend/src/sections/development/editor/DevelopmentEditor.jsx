import { useSearchParams } from 'react-router-dom';
import {
  Info, FileText, Image, Sparkles, Send, Ban, Clock, CheckCircle2, AlertTriangle, Crown, ChevronLeft, ChevronRight,
} from 'lucide-react';
import PageHero from '../../../components/PageHero';
import StatusBadge from '../../../components/StatusBadge';
import { DEVELOPMENT_SECTIONS } from '../../../data/developmentOptions';
import { EditorStepContext } from '../../property/editor/editorContext';
import { Banner, Stepper, ProgressSummary } from '../../property/editor/EditorChrome';
import GeneralSection from './GeneralSection';
import DetailsSection from './DetailsSection';
import ImagesSection from './ImagesSection';
import ExtrasSection from './ExtrasSection';
import PublishingSection from './PublishingSection';

const SECTION_COMPONENTS = {
  development: GeneralSection,
  details: DetailsSection,
  images: ImagesSection,
  extras: ExtrasSection,
  publishing: PublishingSection,
};

const SECTION_ICONS = {
  development: Info,
  details: FileText,
  images: Image,
  extras: Sparkles,
  publishing: Send,
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

const stepState = (key, d) => {
  if (!d) return 'pending';
  switch (key) {
    case 'development':
      return d.readiness?.canPublish ? 'complete' : 'incomplete';
    case 'images':
      if (!d.images) return 'pending';
      return d.images.images?.length ? 'complete' : 'incomplete';
    case 'extras':
      if (!d.isPremium) return 'locked';
      return d.extras ? 'complete' : 'pending';
    case 'publishing':
      if (d.status === 'live') return 'complete';
      return d.status === 'pending_approval' ? 'incomplete' : 'pending';
    default:
      return d[key] ? 'complete' : 'pending';
  }
};

function StatusBanner({ development, requiresApproval }) {
  const { status, moderation } = development;
  if (status === 'suspended') {
    return (
      <Banner tone="red" icon={Ban} title="Suspended by an admin">
        {moderation?.reason || 'This development cannot be edited while suspended.'}
      </Banner>
    );
  }
  if (status === 'pending_approval') {
    return (
      <Banner tone="amber" icon={Clock} title="Waiting for approval">
        Your organisation will review it before it goes live. You can keep editing in the meantime.
      </Banner>
    );
  }
  if (status === 'live') {
    return (
      <Banner tone="green" icon={CheckCircle2} title={`Live since ${formatDate(development.publishedAt)}`}>
        {requiresApproval ? 'Saving changes sends it back for approval.' : 'Changes are shown as soon as you save them.'}
      </Banner>
    );
  }
  if (!development.readiness?.canPublish) {
    return (
      <Banner tone="gray" icon={AlertTriangle} title="Draft">
        Add the full address and map pin in General Details, then publish from the Publishing step.
      </Banner>
    );
  }
  return null;
}

/**
 * Step-by-step development editor for any organisation role; the caller binds
 * `onSave(slug, body)` to its API. With `development` null it is the create flow.
 */
export default function DevelopmentEditor({ development, onSave, savingSlug, breadcrumbs = [], requiresApproval }) {
  const [params, setParams] = useSearchParams();
  const isNew = !development;
  const readOnly = development?.status === 'suspended';

  const steps = DEVELOPMENT_SECTIONS.map((s) => ({
    ...s,
    icon: SECTION_ICONS[s.key],
    state: stepState(s.key, development),
    disabled: isNew && s.key !== 'development',
  }));

  const requested = params.get('section');
  const activeKey = steps.some((s) => s.key === requested && !s.disabled) ? requested : 'development';
  const activeIndex = steps.findIndex((s) => s.key === activeKey);
  const active = steps[activeIndex];
  const prev = steps[activeIndex - 1];
  const next = steps[activeIndex + 1];

  const select = (key) => {
    setParams({ section: key }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const ActiveSection = SECTION_COMPONENTS[activeKey];

  const footer = (
    <div className="px-6 pb-6">
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        {prev ? (
          <button type="button" onClick={() => select(prev.key)} className="btn-brand-outline">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
        ) : <span />}
        {next && (
          <button type="button" onClick={() => select(next.key)} disabled={next.disabled} className="btn-brand">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHero
        label={isNew ? 'Create Development' : 'Edit Development'}
        title={isNew ? 'Create Development' : development.name}
        subtitle="A development groups homes on one site so they can share a tour, brochures and site plan"
        breadcrumbs={breadcrumbs}
        action={
          !isNew && (
            <div className="flex items-center gap-2">
              <StatusBadge status={development.status} />
              {development.isPremium && <span className="badge bg-brand-600 text-white gap-1"><Crown className="w-3 h-3" /> Premium</span>}
            </div>
          )
        }
      />

      <Stepper steps={steps} activeKey={activeKey} onSelect={select} />

      {!isNew && <StatusBanner development={development} requiresApproval={requiresApproval} />}

      <EditorStepContext.Provider value={{ icon: SECTION_ICONS[activeKey], footer }}>
        <ActiveSection
          key={`${development?._id || 'new'}-${activeKey}-${development?.updatedAt || ''}`}
          development={development || {}}
          requiresApproval={requiresApproval}
          readOnly={readOnly}
          saving={savingSlug === active.slug}
          onSave={(body) => onSave(active.slug, body)}
        />
      </EditorStepContext.Provider>

      <ProgressSummary steps={steps} activeKey={activeKey} onSelect={select} />
    </div>
  );
}

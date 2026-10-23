import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2, AlertTriangle, Clock, XCircle, Ban, Crown, Eye, MessageSquare, Info, Building2, FileText,
  UserCheck, Image, Video, FileCheck, Sparkles, PhoneCall, ChevronLeft, ChevronRight,
} from 'lucide-react';
import PageHero from '../../../components/PageHero';
import StatusBadge from '../../../components/StatusBadge';
import { PROPERTY_SECTIONS, SECTION_LABELS } from '../../../data/propertyOptions';
import { EditorStepContext } from './editorContext';
import { Banner, Stepper, ProgressSummary } from './EditorChrome';
import LocationSection from './LocationSection';
import DetailsSection from './DetailsSection';
import DescriptionSection from './DescriptionSection';
import EligibilitySection from './EligibilitySection';
import GallerySection from './GallerySection';
import VideoTourSection from './VideoTourSection';
import AttachmentsSection from './AttachmentsSection';
import ExtrasSection from './ExtrasSection';
import EnquiryContactsSection from './EnquiryContactsSection';

const SECTION_COMPONENTS = {
  location: LocationSection,
  details: DetailsSection,
  description: DescriptionSection,
  eligibility: EligibilitySection,
  gallery: GallerySection,
  videoTour: VideoTourSection,
  attachments: AttachmentsSection,
  extras: ExtrasSection,
  enquiryContacts: EnquiryContactsSection,
};

const SECTION_ICONS = {
  location: Info,
  details: Building2,
  description: FileText,
  eligibility: UserCheck,
  gallery: Image,
  videoTour: Video,
  attachments: FileCheck,
  extras: Sparkles,
  enquiryContacts: PhoneCall,
};

const FIELD_LABELS = {
  'address.line1': 'Address line 1',
  'address.townCity': 'Town / city',
  'address.postcode': 'Postcode',
  'address.localAuthority': 'Local authority',
  location: 'Map pin',
  minimumSharePercentage: 'Minimum share (%)',
  'pricing.discountPercentage': 'Discount (%)',
  images: 'At least one image',
  energyCertificate: 'Energy Performance Certificate (EPC)',
};

/** 'pricing.fullMarketValue' -> 'Full market value' */
const fieldLabel = (path) => {
  if (FIELD_LABELS[path]) return FIELD_LABELS[path];
  const words = path.split('.').pop().replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

function StatusBanner({ property, requiresApproval }) {
  const { status, approval, completion, moderation } = property;

  if (status === 'suspended') {
    return (
      <Banner tone="red" icon={Ban} title="Suspended by an admin">
        {moderation?.reason || 'This listing cannot be edited while suspended.'}
      </Banner>
    );
  }
  if (status === 'pending_approval') {
    return (
      <Banner tone="amber" icon={Clock} title={`Waiting for admin approval (${approval?.requestType === 'edit' ? 'changes' : 'new listing'})`}>
        Submitted {formatDate(approval?.submittedAt)}. You can keep editing; your latest version is what gets reviewed.
      </Banner>
    );
  }
  if (status === 'draft' && approval?.decision === 'rejected') {
    return (
      <Banner tone="red" icon={XCircle} title="Rejected by an admin">
        <span className="font-medium">Reason:</span> {approval.reason}. Fix the issues and save any section to resubmit.
      </Banner>
    );
  }
  if (status === 'draft' && !completion?.isComplete) {
    const missing = (completion?.missingSections || []).map((k) => SECTION_LABELS[k] || k).join(', ');
    return (
      <Banner tone="gray" icon={AlertTriangle} title="Draft">
        Complete the required steps to {requiresApproval ? 'submit it for approval' : 'publish it'}. Still missing: {missing}.
      </Banner>
    );
  }
  if (status === 'live' && requiresApproval) {
    return (
      <Banner tone="green" icon={CheckCircle2} title={`Live since ${formatDate(property.publishedAt)}`}>
        Saving changes sends the listing back for admin approval before the changes are shown.
      </Banner>
    );
  }
  return null;
}

const stepState = (info, step, property) => {
  if (step.premium && property && !property.isPremium) return 'locked';
  if (info?.complete) return 'complete';
  if (info?.saved) return 'incomplete';
  return 'pending';
};

/**
 * Step-by-step editor for every property section. Works for any owner type:
 * the caller supplies `onSave(slug, body)` bound to its own API.
 * With `property` null it is the create flow: only General Details is available
 * until the first save creates the draft.
 */
export default function PropertyEditor({
  property, onSave, savingSlug, breadcrumbs = [], requiresApproval = true, developments = null,
}) {
  const [params, setParams] = useSearchParams();
  const isNew = !property;
  const sections = property?.completion?.sections || {};
  const readOnly = property?.status === 'suspended';

  const steps = PROPERTY_SECTIONS.map((s) => ({
    ...s,
    icon: SECTION_ICONS[s.key],
    state: stepState(sections[s.key], s, property),
    disabled: isNew && s.key !== 'location',
  }));

  const requested = params.get('section');
  const activeKey = steps.some((s) => s.key === requested && !s.disabled) ? requested : 'location';
  const activeIndex = steps.findIndex((s) => s.key === activeKey);
  const active = steps[activeIndex];
  const prev = steps[activeIndex - 1];
  const next = steps[activeIndex + 1];

  const select = (key) => {
    setParams({ section: key }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const ActiveSection = SECTION_COMPONENTS[activeKey];
  const missing = sections[activeKey]?.missingFields?.filter((f) => f !== 'section not saved') || [];

  const footer = (
    <div className="px-6 pb-6 space-y-4">
      {active.state === 'pending' && !readOnly && (
        <div className="flex items-start gap-2 rounded-lg bg-brand-50 border border-brand-200 px-4 py-3 text-xs text-brand-900">
          <Info className="w-4 h-4 shrink-0 text-brand-600" />
          Please complete and submit the current step before proceeding to the next step.
        </div>
      )}
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
        label={isNew ? 'Create Property' : 'Edit Property'}
        title={isNew ? 'Create Property' : property.name}
        subtitle="(Provide full property details, else property will not be listed to others)"
        breadcrumbs={breadcrumbs}
        action={
          !isNew && (
            <div className="flex flex-col items-start sm:items-end gap-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={property.status} />
                {property.isPremium && <span className="badge bg-brand-600 text-white gap-1"><Crown className="w-3 h-3" /> Premium</span>}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{property.stats?.views ?? 0} views</span>
                <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{property.stats?.enquiries ?? 0} enquiries</span>
              </div>
            </div>
          )
        }
      />

      <Stepper steps={steps} activeKey={activeKey} onSelect={select} />

      {!isNew && <StatusBanner property={property} requiresApproval={requiresApproval} />}

      {missing.length > 0 && (
        <div className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3">
          <span className="font-medium">Still needed in {active.label}:</span> {missing.map(fieldLabel).join(', ')}
        </div>
      )}

      <EditorStepContext.Provider value={{ icon: SECTION_ICONS[activeKey], footer }}>
        <ActiveSection
          key={`${property?._id || 'new'}-${activeKey}`}
          property={property || {}}
          developments={developments}
          readOnly={readOnly}
          saving={savingSlug === active.slug}
          onSave={(body) => onSave(active.slug, body)}
        />
      </EditorStepContext.Provider>

      <ProgressSummary steps={steps} activeKey={activeKey} onSelect={select} />
    </div>
  );
}

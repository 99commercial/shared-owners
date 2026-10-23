import { useState } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import SectionForm, { FieldGroup } from '../../property/editor/SectionForm';
import CheckboxField from './CheckboxField';

const FIELD_LABELS = {
  'address.postcode': 'Postcode',
  'address.line1': 'Address line 1',
  'address.townCity': 'Town / city',
  'address.localAuthority': 'Local authority',
  location: 'Map pin',
};

/** Body: { publish, homesForLondoners }. With approval, publishing submits for review instead of going live. */
export default function PublishingSection({ development, requiresApproval, onSave, saving, readOnly }) {
  const isPublished = development.status === 'live' || development.status === 'pending_approval';
  const [publish, setPublish] = useState(isPublished);
  const [homesForLondoners, setHomesForLondoners] = useState(Boolean(development.syndication?.homesForLondoners));
  const missing = development.readiness?.missingFields || [];
  const lockedLive = requiresApproval && development.status === 'live';

  return (
    <SectionForm
      title="Publishing"
      description={
        requiresApproval
          ? 'Publishing sends the development to your organisation for approval before it goes live.'
          : 'Publish to show the development on SharedOwnership. Its homes are listed separately.'
      }
      onSubmit={() => onSave({ publish, homesForLondoners })}
      saving={saving}
      readOnly={readOnly}
    >
      {missing.length > 0 ? (
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <div className="font-semibold">Not ready to publish</div>
            Complete General Details first. Still missing: {missing.map((f) => FIELD_LABELS[f] || f).join(', ')}.
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="w-5 h-5 shrink-0" /> Everything needed to publish is in place.
        </div>
      )}

      <FieldGroup title="Where to show it" cols={1}>
        <CheckboxField
          checked={publish}
          onChange={setPublish}
          disabled={readOnly || (missing.length > 0 && !publish) || (lockedLive && publish)}
          label={requiresApproval ? 'Publish on SharedOwnership (needs approval)' : 'Publish on SharedOwnership'}
          hint={lockedLive ? 'Only your organisation can unpublish a live development' : 'Untick to take the development back to draft'}
        />
        <CheckboxField
          checked={homesForLondoners}
          onChange={setHomesForLondoners}
          disabled={readOnly}
          label="Also publish on Homes for Londoners"
          hint="For developments in Greater London"
        />
      </FieldGroup>
    </SectionForm>
  );
}

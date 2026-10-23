import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DevelopmentEditor from './editor/DevelopmentEditor';

const STATUS_MESSAGES = {
  pending_approval: 'Saved. The development has been sent to your organisation for approval.',
  live: 'Saved. Your development is live.',
  draft: 'Saved. The development is now a draft.',
};

/** `owner` comes from PROPERTY_OWNERS; without a :developmentId in the URL this is the create flow */
export default function OwnerDevelopmentEditor({ owner }) {
  const { api, basePath, keys, requiresApproval } = owner;
  const { developmentId } = useParams();
  const isNew = !developmentId;
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: development, isLoading, error } = useQuery({
    queryKey: keys.development(developmentId),
    queryFn: () => api.getDevelopment(developmentId).then((r) => r.data.data.development),
    enabled: !isNew,
  });

  const save = useMutation({
    mutationFn: ({ slug, body }) =>
      isNew ? api.createDevelopment(body) : api.saveDevelopmentSection(developmentId, slug, body),
    onSuccess: (res) => {
      const updated = res.data.data.development;
      qc.setQueryData(keys.development(updated._id), updated);
      qc.invalidateQueries({ queryKey: keys.developments });
      qc.invalidateQueries({ queryKey: keys.dashboard });
      qc.invalidateQueries({ queryKey: keys.profile });
      if (isNew) {
        toast.success('Draft created. Continue with the development details.');
        navigate(`${basePath}/developments/${updated._id}?section=details`, { replace: true });
        return;
      }
      const statusChanged = updated.status !== development?.status;
      toast.success(statusChanged && STATUS_MESSAGES[updated.status] ? STATUS_MESSAGES[updated.status] : 'Step saved');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not save this step'),
  });

  const breadcrumbs = [
    { label: 'Home', to: basePath },
    { label: 'Developments', to: `${basePath}/developments` },
    { label: isNew ? 'Create Development' : 'Edit Development' },
  ];

  if (!isNew && isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  }
  if (!isNew && (error || !development)) {
    return (
      <div className="dash-card p-10 text-center">
        <p className="text-gray-700 font-medium">{error?.response?.data?.message || 'Development not found'}</p>
        <Link to={`${basePath}/developments`} className="btn-brand-outline mt-4">Back to developments</Link>
      </div>
    );
  }

  return (
    <DevelopmentEditor
      development={isNew ? null : development}
      breadcrumbs={breadcrumbs}
      requiresApproval={requiresApproval}
      savingSlug={save.isPending ? save.variables?.slug : null}
      onSave={(slug, body) => save.mutate({ slug, body })}
    />
  );
}

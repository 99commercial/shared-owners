import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PropertyEditor from './editor/PropertyEditor';

const STATUS_MESSAGES = {
  pending_approval: 'Saved. Your listing is complete and has been sent for admin approval.',
  live: 'Saved. Your listing is live.',
};

/** `owner` comes from PROPERTY_OWNERS; without a :propertyId in the URL this is the create flow */
export default function OwnerPropertyEditor({ owner }) {
  const { api, basePath, keys, requiresApproval } = owner;
  const { propertyId } = useParams();
  const isNew = !propertyId;
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: property, isLoading, error } = useQuery({
    queryKey: keys.item(propertyId),
    queryFn: () => api.getProperty(propertyId).then((r) => r.data.data.property),
    enabled: !isNew,
  });

  const { data: developments } = useQuery({
    queryKey: [...keys.developments, 'options'],
    queryFn: () => api.getDevelopments({ limit: 100 }).then((r) => r.data.data.items),
    enabled: owner.hasDevelopments,
  });

  const refreshLists = () => {
    qc.invalidateQueries({ queryKey: keys.list });
    qc.invalidateQueries({ queryKey: keys.dashboard });
    qc.invalidateQueries({ queryKey: keys.profile });
  };

  const save = useMutation({
    mutationFn: ({ slug, body }) =>
      isNew ? api.createProperty(body) : api.savePropertySection(propertyId, slug, body),
    onSuccess: (res) => {
      const updated = res.data.data.property;
      qc.setQueryData(keys.item(updated._id), updated);
      refreshLists();
      if (isNew) {
        toast.success('Draft created. Continue with the property details.');
        navigate(`${basePath}/properties/${updated._id}?section=details`, { replace: true });
        return;
      }
      const statusChanged = updated.status !== property?.status;
      toast.success(statusChanged && STATUS_MESSAGES[updated.status] ? STATUS_MESSAGES[updated.status] : 'Step saved');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not save this step'),
  });

  const breadcrumbs = [
    { label: 'Home', to: basePath },
    { label: 'Property', to: `${basePath}/properties` },
    { label: isNew ? 'Create Property' : 'Edit Property' },
  ];

  if (!isNew && isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  }
  if (!isNew && (error || !property)) {
    return (
      <div className="dash-card p-10 text-center">
        <p className="text-gray-700 font-medium">{error?.response?.data?.message || 'Property not found'}</p>
        <Link to={`${basePath}/properties`} className="btn-brand-outline mt-4">Back to properties</Link>
      </div>
    );
  }

  return (
    <PropertyEditor
      property={isNew ? null : property}
      breadcrumbs={breadcrumbs}
      requiresApproval={requiresApproval}
      developments={owner.hasDevelopments ? developments || [] : null}
      savingSlug={save.isPending ? save.variables?.slug : null}
      onSave={(slug, body) => save.mutate({ slug, body })}
    />
  );
}

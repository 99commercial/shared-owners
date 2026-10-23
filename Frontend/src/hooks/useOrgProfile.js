import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { orgApi } from '../services/endpoints';
import { useAuth } from '../contexts/AuthContext';
import { PROPERTY_OWNERS } from '../data/propertyOwners';

export const ORG_PROFILE_KEY = ['org', 'profile'];
export const ORG_DASHBOARD_KEY = PROPERTY_OWNERS.organisation.keys.dashboard;

/** GET /organisations/profile → { organisation, members, propertyCount, developmentCount } */
export function useOrgProfile() {
  const { user: authUser } = useAuth();
  const query = useQuery({
    queryKey: ORG_PROFILE_KEY,
    queryFn: () => orgApi.getProfile().then((r) => r.data.data),
  });
  return { ...query, organisation: query.data?.organisation || authUser };
}

export function useOrgDashboard() {
  return useQuery({
    queryKey: ORG_DASHBOARD_KEY,
    queryFn: () => orgApi.getDashboard().then((r) => r.data.data),
  });
}

/** Any call that answers with { data: { organisation } }; keeps the profile cache and auth context in sync */
function useOrgProfileMutation(mutationFn, successMessage, errorMessage) {
  const { updateUser } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (res) => {
      const organisation = res.data.data.organisation;
      qc.setQueryData(ORG_PROFILE_KEY, (prev) => (prev ? { ...prev, organisation } : prev));
      updateUser(organisation);
      toast.success(successMessage);
    },
    onError: (err) => toast.error(err.response?.data?.message || errorMessage),
  });
}

/** PATCH /organisations/profile with flat organisationProfile fields */
export const useUpdateOrgProfile = () =>
  useOrgProfileMutation((body) => orgApi.updateProfile(body), 'Company profile updated', 'Failed to save');

/** variables = { file, onProgress } */
export const useUploadOrgLogo = () =>
  useOrgProfileMutation(
    ({ file, onProgress }) =>
      orgApi.uploadLogo(file, (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100))),
    'Logo updated',
    'Could not upload logo'
  );

export const useRemoveOrgLogo = () =>
  useOrgProfileMutation(() => orgApi.removeLogo(), 'Logo removed', 'Could not remove logo');

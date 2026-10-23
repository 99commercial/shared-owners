import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userApi } from '../services/endpoints';
import { useAuth } from '../contexts/AuthContext';

export const USER_PROFILE_KEY = ['user', 'profile'];

export function useUserProfile() {
  const { user: authUser } = useAuth();
  const query = useQuery({
    queryKey: USER_PROFILE_KEY,
    queryFn: () => userApi.getProfile().then((r) => r.data.data.user),
  });
  return { ...query, user: query.data || authUser };
}

/** Any call that answers with { data: { user } }; keeps the profile cache and auth context in sync */
function useProfileMutation(mutationFn, successMessage, errorMessage) {
  const { updateUser } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (res) => {
      const updated = res.data.data.user;
      qc.setQueryData(USER_PROFILE_KEY, updated);
      updateUser(updated);
      toast.success(successMessage);
    },
    onError: (err) => toast.error(err.response?.data?.message || errorMessage),
  });
}

/** PATCH /users/profile with flat fields */
export const useUpdateUserProfile = (successMessage = 'Profile updated') =>
  useProfileMutation((body) => userApi.updateProfile(body), successMessage, 'Failed to save');

/** POST /users/profile/avatar (multipart); variables = { file, onProgress } */
export const useUploadUserAvatar = () =>
  useProfileMutation(
    ({ file, onProgress }) =>
      userApi.uploadAvatar(file, (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100))),
    'Profile photo updated',
    'Could not upload photo'
  );

export const useRemoveUserAvatar = () =>
  useProfileMutation(() => userApi.removeAvatar(), 'Profile photo removed', 'Could not remove photo');

export const formatLongDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
